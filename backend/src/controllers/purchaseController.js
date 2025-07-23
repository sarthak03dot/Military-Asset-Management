const pool = require('../config');
const { logAudit } = require('../middleware/loggingMiddleware');

async function updateAssetBalancesForPurchase(baseId, equipmentTypeId, quantity, purchaseDate, client) {
    const balanceDate = purchaseDate.toISOString().split('T')[0]; // Get YYYY-MM-DD

    try {
        const existingBalance = await client.query(
            'SELECT * FROM asset_balances WHERE balance_date = $1 AND base_id = $2 AND equipment_type_id = $3',
            [balanceDate, baseId, equipmentTypeId]
        );

        if (existingBalance.rows.length > 0) {
            const oldBalance = existingBalance.rows[0];
            const newPurchases = oldBalance.purchases + quantity;
            const newClosingBalance = oldBalance.closing_balance + quantity; // Assuming purchases directly add to closing balance for the day
            const newNetMovement = oldBalance.net_movement + quantity;

            await client.query(
                `UPDATE asset_balances
                 SET purchases = $1, closing_balance = $2, net_movement = $3, last_calculated_at = CURRENT_TIMESTAMP
                 WHERE balance_id = $4`,
                [newPurchases, newClosingBalance, newNetMovement, oldBalance.balance_id]
            );
        } else {
            await client.query(
                `INSERT INTO asset_balances (balance_date, base_id, equipment_type_id, opening_balance, purchases, transfers_in, transfers_out, assigned, expended, closing_balance, net_movement)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [balanceDate, baseId, equipmentTypeId, 0, quantity, 0, 0, 0, 0, quantity, quantity]
            );
        }
    } catch (error) {
        console.error('Error updating asset balances for purchase:', error);
        throw new Error('Failed to update asset balances.'); // Re-throw to trigger transaction rollback
    }
}


exports.recordPurchase = async (req, res) => {
    const { asset_id, base_id, quantity, unit_cost, total_cost } = req.body;
    const { user_id } = req.user; // User performing the action

    if (!asset_id || !base_id || !quantity) {
        return res.status(400).json({ message: 'Asset ID, Base ID, and Quantity are required.' });
    }
    if (quantity <= 0) {
        return res.status(400).json({ message: 'Quantity must be a positive number.' });
    }

    const client = await pool.connect(); // Get a client from the pool for transaction
    try {
        await client.query('BEGIN'); // Start transaction

        const assetResult = await client.query('SELECT equipment_type_id FROM assets WHERE asset_id = $1', [asset_id]);
        if (assetResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Asset not found.' });
        }
        const equipmentTypeId = assetResult.rows[0].equipment_type_id;

        const newPurchase = await client.query(
            'INSERT INTO purchases (asset_id, base_id, quantity, unit_cost, total_cost, purchased_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [asset_id, base_id, quantity, unit_cost, total_cost, user_id]
        );

        if (quantity === 1) {
            await client.query(
                'UPDATE assets SET current_base_id = $1, last_updated_at = CURRENT_TIMESTAMP WHERE asset_id = $2',
                [base_id, asset_id]
            );
        }

        await updateAssetBalancesForPurchase(base_id, equipmentTypeId, quantity, new Date(), client);

        await logAudit(user_id, 'ASSET_PURCHASED', 'purchase', newPurchase.rows[0].purchase_id, {
            asset_id,
            base_id,
            quantity,
            total_cost
        }, req.ip);

        await client.query('COMMIT'); // Commit transaction
        res.status(201).json({
            message: 'Purchase recorded successfully',
            purchase: newPurchase.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK'); // Rollback transaction on error
        console.error('Error recording purchase:', error);
        res.status(500).json({ message: 'Server error recording purchase.' });
    } finally {
        client.release(); 
    }
};
exports.getHistoricalPurchases = async (req, res) => {
    const { date, baseId, equipmentTypeId } = req.query; // Filters
    const { role, base_id: userBaseId } = req.user;

    let queryText = `
        SELECT
            p.purchase_id,
            p.purchase_date,
            a.serial_number AS asset_serial_number,
            et.type_name AS equipment_type_name,
            b.base_name AS base_name,
            p.quantity,
            p.unit_cost,
            p.total_cost,
            u.username AS purchased_by_username
        FROM purchases p
        JOIN assets a ON p.asset_id = a.asset_id
        JOIN equipment_types et ON a.equipment_type_id = et.equipment_type_id
        JOIN bases b ON p.base_id = b.base_id
        LEFT JOIN users u ON p.purchased_by = u.user_id
        WHERE 1 = 1
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (date) {
        queryText += ` AND DATE(p.purchase_date) = $${paramIndex++}`;
        queryParams.push(date);
    }

    if (baseId) {
        queryText += ` AND p.base_id = $${paramIndex++}`;
        queryParams.push(baseId);
    }

    if (equipmentTypeId) {
        queryText += ` AND a.equipment_type_id = $${paramIndex++}`;
        queryParams.push(equipmentTypeId);
    }

    if (role === 'base_commander' && userBaseId) {
        if (baseId && baseId !== userBaseId) {
            return res.status(403).json({ message: 'Access denied. You can only view purchases for your assigned base.' });
        }
        if (!baseId) {
            queryText += ` AND p.base_id = $${paramIndex++}`;
            queryParams.push(userBaseId);
        }
    }

    queryText += ' ORDER BY p.purchase_date DESC';

    try {
        const result = await pool.query(queryText, queryParams);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching historical purchases:', error);
        res.status(500).json({ message: 'Server error fetching historical purchases.' });
    }
};
