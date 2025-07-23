const pool = require('../config');
const { logAudit } = require('../middleware/loggingMiddleware');

async function updateAssetBalancesForAssignment(baseId, equipmentTypeId, quantity, assignmentDate, client) {
    const balanceDate = assignmentDate.toISOString().split('T')[0];

    try {
        const existingBalance = await client.query(
            'SELECT * FROM asset_balances WHERE balance_date = $1 AND base_id = $2 AND equipment_type_id = $3',
            [balanceDate, baseId, equipmentTypeId]
        );

        if (existingBalance.rows.length > 0) {
            const oldBalance = existingBalance.rows[0];
            const newAssigned = oldBalance.assigned + quantity;
            await client.query(
                `UPDATE asset_balances
                 SET assigned = $1, last_calculated_at = CURRENT_TIMESTAMP
                 WHERE balance_id = $2`,
                [newAssigned, oldBalance.balance_id]
            );
        } else {
            await client.query(
                `INSERT INTO asset_balances (balance_date, base_id, equipment_type_id, opening_balance, purchases, transfers_in, transfers_out, assigned, expended, closing_balance, net_movement)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [balanceDate, baseId, equipmentTypeId, 0, 0, 0, 0, quantity, 0, 0, 0]
            );
        }
    } catch (error) {
        console.error('Error updating asset balances for assignment:', error);
        throw new Error('Failed to update asset balances for assignment.');
    }
}

async function updateAssetBalancesForExpenditure(baseId, equipmentTypeId, quantity, expenditureDate, client) {
    const balanceDate = expenditureDate.toISOString().split('T')[0];

    try {
        const existingBalance = await client.query(
            'SELECT * FROM asset_balances WHERE balance_date = $1 AND base_id = $2 AND equipment_type_id = $3',
            [balanceDate, baseId, equipmentTypeId]
        );

        if (existingBalance.rows.length > 0) {
            const oldBalance = existingBalance.rows[0];
            const newExpended = oldBalance.expended + quantity;
            const newClosingBalance = oldBalance.closing_balance - quantity;
            const newNetMovement = oldBalance.net_movement - quantity;

            await client.query(
                `UPDATE asset_balances
                 SET expended = $1, closing_balance = $2, net_movement = $3, last_calculated_at = CURRENT_TIMESTAMP
                 WHERE balance_id = $4`,
                [newExpended, newClosingBalance, newNetMovement, oldBalance.balance_id]
            );
        } else {
            await client.query(
                `INSERT INTO asset_balances (balance_date, base_id, equipment_type_id, opening_balance, purchases, transfers_in, transfers_out, assigned, expended, closing_balance, net_movement)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [balanceDate, baseId, equipmentTypeId, 0, 0, 0, 0, 0, quantity, -quantity, -quantity]
            );
        }
    } catch (error) {
        console.error('Error updating asset balances for expenditure:', error);
        throw new Error('Failed to update asset balances for expenditure.');
    }
}

exports.assignAsset = async (req, res) => {
    const { asset_id, assigned_to_user_id } = req.body;
    const { user_id: assigned_by_user_id, base_id: userBaseId, role } = req.user;

    if (!asset_id || !assigned_to_user_id) {
        return res.status(400).json({ message: 'Asset ID and Assigned To User ID are required.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const assetResult = await client.query('SELECT current_base_id, status, equipment_type_id FROM assets WHERE asset_id = $1', [asset_id]);
        if (assetResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Asset not found.' });
        }
        const asset = assetResult.rows[0];

        if (asset.status !== 'available') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: `Asset is not available for assignment. Current status: ${asset.status}.` });
        }

        if (role === 'base_commander' && asset.current_base_id !== userBaseId) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Access denied. You can only assign assets from your assigned base.' });
        }

        const assignedToUserResult = await client.query('SELECT user_id FROM users WHERE user_id = $1', [assigned_to_user_id]);
        if (assignedToUserResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Assigned user not found.' });
        }

        const newAssignment = await client.query(
            'INSERT INTO assignments (asset_id, assigned_to_user_id, assigned_by, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [asset_id, assigned_to_user_id, assigned_by_user_id, 'active']
        );

        await client.query(
            'UPDATE assets SET status = $1, last_updated_at = CURRENT_TIMESTAMP WHERE asset_id = $2',
            ['assigned', asset_id]
        );

        await updateAssetBalancesForAssignment(asset.current_base_id, asset.equipment_type_id, 1, new Date(), client);

        await logAudit(assigned_by_user_id, 'ASSET_ASSIGNED', 'assignment', newAssignment.rows[0].assignment_id, {
            asset_id,
            assigned_to_user_id,
            base_id: asset.current_base_id
        }, req.ip);

        await client.query('COMMIT');
        res.status(201).json({
            message: 'Asset assigned successfully',
            assignment: newAssignment.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error assigning asset:', error);
        res.status(500).json({ message: 'Server error assigning asset.' });
    } finally {
        client.release();
    }
};

exports.recordExpenditure = async (req, res) => {
    const { asset_id, quantity, reason } = req.body;
    const { user_id: expended_by_user_id, base_id: userBaseId, role } = req.user;

    if (!asset_id || !quantity) {
        return res.status(400).json({ message: 'Asset ID and Quantity are required.' });
    }
    if (quantity <= 0) {
        return res.status(400).json({ message: 'Quantity must be a positive number.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const assetResult = await client.query('SELECT current_base_id, status, equipment_type_id FROM assets WHERE asset_id = $1', [asset_id]);
        if (assetResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Asset not found.' });
        }
        const asset = assetResult.rows[0];

        if (asset.status === 'expended') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Asset is already marked as expended.' });
        }

        if (role === 'base_commander' && asset.current_base_id !== userBaseId) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Access denied. You can only record expenditures for assets at your assigned base.' });
        }

        const newExpenditure = await client.query(
            'INSERT INTO expenditures (asset_id, base_id, quantity, reason, expended_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [asset_id, asset.current_base_id, quantity, reason, expended_by_user_id]
        );

        await client.query(
            'UPDATE assets SET status = $1, last_updated_at = CURRENT_TIMESTAMP WHERE asset_id = $2',
            ['expended', asset_id]
        );

        await updateAssetBalancesForExpenditure(asset.current_base_id, asset.equipment_type_id, quantity, new Date(), client);

        await logAudit(expended_by_user_id, 'ASSET_EXPENDED', 'expenditure', newExpenditure.rows[0].expenditure_id, {
            asset_id,
            base_id: asset.current_base_id,
            quantity,
            reason
        }, req.ip);

        await client.query('COMMIT');
        res.status(201).json({
            message: 'Expenditure recorded successfully',
            expenditure: newExpenditure.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error recording expenditure:', error);
        res.status(500).json({ message: 'Server error recording expenditure.' });
    } finally {
        client.release();
    }
};

exports.getHistoricalAssignments = async (req, res) => {
    const { date, baseId, equipmentTypeId, assignedToUserId } = req.query;
    const { role, base_id: userBaseId } = req.user;

    let queryText = `
        SELECT
            asn.assignment_id,
            asn.assigned_date,
            a.serial_number AS asset_serial_number,
            et.type_name AS equipment_type_name,
            b.base_name AS current_base_name,
            assigned_user.username AS assigned_to_username,
            assigned_by_user.username AS assigned_by_username,
            asn.status,
            asn.return_date
        FROM assignments asn
        JOIN assets a ON asn.asset_id = a.asset_id
        JOIN equipment_types et ON a.equipment_type_id = et.equipment_type_id
        JOIN bases b ON a.current_base_id = b.base_id
        LEFT JOIN users assigned_user ON asn.assigned_to_user_id = assigned_user.user_id
        LEFT JOIN users assigned_by_user ON asn.assigned_by = assigned_by_user.user_id
        WHERE 1 = 1
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (date) {
        queryText += ` AND DATE(asn.assigned_date) = $${paramIndex++}`;
        queryParams.push(date);
    }

    if (baseId) {
        queryText += ` AND a.current_base_id = $${paramIndex++}`;
        queryParams.push(baseId);
    }

    if (equipmentTypeId) {
        queryText += ` AND a.equipment_type_id = $${paramIndex++}`;
        queryParams.push(equipmentTypeId);
    }

    if (assignedToUserId) {
        queryText += ` AND asn.assigned_to_user_id = $${paramIndex++}`;
        queryParams.push(assignedToUserId);
    }

    if (role === 'base_commander' && userBaseId) {
        if (baseId && baseId !== userBaseId) {
            return res.status(403).json({ message: 'Access denied. You can only view assignments for assets at your assigned base.' });
        }
        if (!baseId) {
            queryText += ` AND a.current_base_id = $${paramIndex++}`;
            queryParams.push(userBaseId);
        }
    }

    queryText += ' ORDER BY asn.assigned_date DESC';

    try {
        const result = await pool.query(queryText, queryParams);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching historical assignments:', error);
        res.status(500).json({ message: 'Server error fetching historical assignments.' });
    }
};

exports.getHistoricalExpenditures = async (req, res) => {
    const { date, baseId, equipmentTypeId } = req.query;
    const { role, base_id: userBaseId } = req.user;

    let queryText = `
        SELECT
            exp.expenditure_id,
            exp.expenditure_date,
            a.serial_number AS asset_serial_number,
            et.type_name AS equipment_type_name,
            b.base_name AS base_name,
            exp.quantity,
            exp.reason,
            u.username AS expended_by_username
        FROM expenditures exp
        JOIN assets a ON exp.asset_id = a.asset_id
        JOIN equipment_types et ON a.equipment_type_id = et.equipment_type_id
        JOIN bases b ON exp.base_id = b.base_id
        LEFT JOIN users u ON exp.expended_by = u.user_id
        WHERE 1 = 1
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (date) {
        queryText += ` AND DATE(exp.expenditure_date) = $${paramIndex++}`;
        queryParams.push(date);
    }

    if (baseId) {
        queryText += ` AND exp.base_id = $${paramIndex++}`;
        queryParams.push(baseId);
    }

    if (equipmentTypeId) {
        queryText += ` AND a.equipment_type_id = $${paramIndex++}`;
        queryParams.push(equipmentTypeId);
    }

    if (role === 'base_commander' && userBaseId) {
        if (baseId && baseId !== userBaseId) {
            return res.status(403).json({ message: 'Access denied. You can only view expenditures for your assigned base.' });
        }
        if (!baseId) {
            queryText += ` AND exp.base_id = $${paramIndex++}`;
            queryParams.push(userBaseId);
        }
    }

    queryText += ' ORDER BY exp.expenditure_date DESC';

    try {
        const result = await pool.query(queryText, queryParams);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching historical expenditures:', error);
        res.status(500).json({ message: 'Server error fetching historical expenditures.' });
    }
};