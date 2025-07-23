const pool = require('../config');
const { logAudit } = require('../middleware/loggingMiddleware');

async function updateAssetBalancesForTransfer(assetId, fromBaseId, toBaseId, quantity, transferDate, client) {
    const balanceDate = transferDate.toISOString().split('T')[0]; // Get YYYY-MM-DD

    const assetResult = await client.query('SELECT equipment_type_id FROM assets WHERE asset_id = $1', [assetId]);
    if (assetResult.rows.length === 0) {
        throw new Error('Asset not found when updating balances for transfer.');
    }
    const equipmentTypeId = assetResult.rows[0].equipment_type_id;

    const existingFromBalance = await client.query(
        'SELECT * FROM asset_balances WHERE balance_date = $1 AND base_id = $2 AND equipment_type_id = $3',
        [balanceDate, fromBaseId, equipmentTypeId]
    );

    if (existingFromBalance.rows.length > 0) {
        const oldBalance = existingFromBalance.rows[0];
        const newTransfersOut = oldBalance.transfers_out + quantity;
        const newClosingBalance = oldBalance.closing_balance - quantity;
        const newNetMovement = oldBalance.net_movement - quantity; // Transfers Out decrease net movement

        await client.query(
            `UPDATE asset_balances
             SET transfers_out = $1, closing_balance = $2, net_movement = $3, last_calculated_at = CURRENT_TIMESTAMP
             WHERE balance_id = $4`,
            [newTransfersOut, newClosingBalance, newNetMovement, oldBalance.balance_id]
        );
    } else {
        await client.query(
            `INSERT INTO asset_balances (balance_date, base_id, equipment_type_id, opening_balance, purchases, transfers_in, transfers_out, assigned, expended, closing_balance, net_movement)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [balanceDate, fromBaseId, equipmentTypeId, 0, 0, 0, quantity, 0, 0, -quantity, -quantity] // Net movement decreases
        );
    }

    const existingToBalance = await client.query(
        'SELECT * FROM asset_balances WHERE balance_date = $1 AND base_id = $2 AND equipment_type_id = $3',
        [balanceDate, toBaseId, equipmentTypeId]
    );

    if (existingToBalance.rows.length > 0) {
        const oldBalance = existingToBalance.rows[0];
        const newTransfersIn = oldBalance.transfers_in + quantity;
        const newClosingBalance = oldBalance.closing_balance + quantity;
        const newNetMovement = oldBalance.net_movement + quantity; // Transfers In increase net movement

        await client.query(
            `UPDATE asset_balances
             SET transfers_in = $1, closing_balance = $2, net_movement = $3, last_calculated_at = CURRENT_TIMESTAMP
             WHERE balance_id = $4`,
            [newTransfersIn, newClosingBalance, newNetMovement, oldBalance.balance_id]
        );
    } else {
        await client.query(
            `INSERT INTO asset_balances (balance_date, base_id, equipment_type_id, opening_balance, purchases, transfers_in, transfers_out, assigned, expended, closing_balance, net_movement)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [balanceDate, toBaseId, equipmentTypeId, 0, 0, quantity, 0, 0, 0, quantity, quantity] // Net movement increases
        );
    }
}


exports.recordTransfer = async (req, res) => {
    const { asset_id, from_base_id, to_base_id, quantity } = req.body;
    const { user_id } = req.user;

    if (!asset_id || !from_base_id || !to_base_id || !quantity) {
        return res.status(400).json({ message: 'Asset ID, From Base ID, To Base ID, and Quantity are required.' });
    }
    if (from_base_id === to_base_id) {
        return res.status(400).json({ message: 'Cannot transfer an asset to the same base.' });
    }
    if (quantity <= 0) {
        return res.status(400).json({ message: 'Quantity must be a positive number.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const assetResult = await client.query('SELECT current_base_id, status FROM assets WHERE asset_id = $1', [asset_id]);
        if (assetResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Asset not found.' });
        }
        const asset = assetResult.rows[0];

        if (asset.current_base_id !== from_base_id) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: `Asset is not currently at the specified 'from' base (${from_base_id}). It is at ${asset.current_base_id}.` });
        }
        if (asset.status === 'expended') { // Cannot transfer an expended asset
             await client.query('ROLLBACK');
             return res.status(400).json({ message: 'Cannot transfer an expended asset.' });
        }

        const newTransfer = await client.query(
            'INSERT INTO transfers (asset_id, from_base_id, to_base_id, quantity, transferred_by, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [asset_id, from_base_id, to_base_id, quantity, user_id, 'completed'] // Mark as completed immediately for simplicity
        );

        await client.query(
            'UPDATE assets SET current_base_id = $1, status = $2, last_updated_at = CURRENT_TIMESTAMP WHERE asset_id = $3',
            [to_base_id, 'available', asset_id] // Assuming it's available upon transfer completion
        );

        await updateAssetBalancesForTransfer(asset_id, from_base_id, to_base_id, quantity, new Date(), client);

        await logAudit(user_id, 'ASSET_TRANSFERRED', 'transfer', newTransfer.rows[0].transfer_id, {
            asset_id,
            from_base_id,
            to_base_id,
            quantity
        }, req.ip);

        await client.query('COMMIT');
        res.status(201).json({
            message: 'Transfer recorded successfully',
            transfer: newTransfer.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error recording transfer:', error);
        res.status(500).json({ message: 'Server error recording transfer.' });
    } finally {
        client.release();
    }
};

exports.getHistoricalTransfers = async (req, res) => {
    const { date, fromBaseId, toBaseId, equipmentTypeId } = req.query;
    const { role, base_id: userBaseId } = req.user;

    let queryText = `
        SELECT
            t.transfer_id,
            t.transfer_date,
            a.serial_number AS asset_serial_number,
            et.type_name AS equipment_type_name,
            b_from.base_name AS from_base_name,
            b_to.base_name AS to_base_name,
            t.quantity,
            t.status,
            t.completed_at,
            u.username AS transferred_by_username
        FROM transfers t
        JOIN assets a ON t.asset_id = a.asset_id
        JOIN equipment_types et ON a.equipment_type_id = et.equipment_type_id
        JOIN bases b_from ON t.from_base_id = b_from.base_id
        JOIN bases b_to ON t.to_base_id = b_to.base_id
        LEFT JOIN users u ON t.transferred_by = u.user_id
        WHERE 1 = 1
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (date) {
        queryText += ` AND DATE(t.transfer_date) = $${paramIndex++}`;
        queryParams.push(date);
    }

    if (fromBaseId) {
        queryText += ` AND t.from_base_id = $${paramIndex++}`;
        queryParams.push(fromBaseId);
    }

    if (toBaseId) {
        queryText += ` AND t.to_base_id = $${paramIndex++}`;
        queryParams.push(toBaseId);
    }

    if (equipmentTypeId) {
        queryText += ` AND a.equipment_type_id = $${paramIndex++}`;
        queryParams.push(equipmentTypeId);
    }

    if (role === 'base_commander' && userBaseId) {
        if (fromBaseId && toBaseId) {
            if (fromBaseId !== userBaseId && toBaseId !== userBaseId) {
                return res.status(403).json({ message: 'Access denied. You can only view transfers involving your assigned base.' });
            }
        } else if (fromBaseId && fromBaseId !== userBaseId) {
             return res.status(403).json({ message: 'Access denied. You can only view transfers involving your assigned base.' });
        } else if (toBaseId && toBaseId !== userBaseId) {
             return res.status(403).json({ message: 'Access denied. You can only view transfers involving your assigned base.' });
        } else if (!fromBaseId && !toBaseId) { 
            queryText += ` AND (t.from_base_id = $${paramIndex} OR t.to_base_id = $${paramIndex})`;
            queryParams.push(userBaseId);
            paramIndex++;
        }
    }

    queryText += ' ORDER BY t.transfer_date DESC';

    try {
        const result = await pool.query(queryText, queryParams);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching historical transfers:', error);
        res.status(500).json({ message: 'Server error fetching historical transfers.' });
    }
};
