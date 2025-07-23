const pool = require('../config');

exports.getDashboardMetrics = async (req, res) => {
    const { date, baseId, equipmentTypeId } = req.query;
    const { role, base_id: userBaseId } = req.user;

    let queryText = `
        SELECT
            COALESCE(SUM(ab.opening_balance), 0) AS total_opening_balance,
            COALESCE(SUM(ab.closing_balance), 0) AS total_closing_balance,
            COALESCE(SUM(ab.net_movement), 0) AS total_net_movement,
            COALESCE(SUM(ab.assigned), 0) AS total_assigned,
            COALESCE(SUM(ab.expended), 0) AS total_expended
        FROM asset_balances ab
        JOIN bases b ON ab.base_id = b.base_id
        JOIN equipment_types et ON ab.equipment_type_id = et.equipment_type_id
        WHERE 1 = 1
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (date) {
        queryText += ` AND ab.balance_date = $${paramIndex++}`;
        queryParams.push(date);
    } else {
        queryText += ` AND ab.balance_date = CURRENT_DATE`;
    }

    if (baseId) {
        queryText += ` AND ab.base_id = $${paramIndex++}`;
        queryParams.push(baseId);
    }

    if (equipmentTypeId) {
        queryText += ` AND ab.equipment_type_id = $${paramIndex++}`;
        queryParams.push(equipmentTypeId);
    }

    if (role === 'base_commander' && userBaseId) {
        if (baseId && baseId !== userBaseId) {
            return res.status(403).json({ message: 'Access denied. You can only view dashboard metrics for your assigned base.' });
        }
        if (!baseId) {  
            queryText += ` AND ab.base_id = $${paramIndex++}`;
            queryParams.push(userBaseId);
        }
    }

    try {
        const result = await pool.query(queryText, queryParams);
        res.status(200).json(result.rows[0] || {  
            total_opening_balance: 0,
            total_closing_balance: 0,
            total_net_movement: 0,
            total_assigned: 0,
            total_expended: 0
        });
    } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        res.status(500).json({ message: 'Server error fetching dashboard metrics.' });
    }
};

exports.getNetMovementDetails = async (req, res) => {
    const { date, baseId, equipmentTypeId } = req.query;
    const { role, base_id: userBaseId } = req.user;

    let queryText = `
        SELECT
            ab.base_id,
            b.base_name,
            ab.equipment_type_id,
            et.type_name AS equipment_type_name,
            ab.balance_date,
            ab.purchases,
            ab.transfers_in,
            ab.transfers_out
        FROM asset_balances ab
        JOIN bases b ON ab.base_id = b.base_id
        JOIN equipment_types et ON ab.equipment_type_id = et.equipment_type_id
        WHERE 1 = 1
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (date) {
        queryText += ` AND ab.balance_date = $${paramIndex++}`;
        queryParams.push(date);
    } else {
        queryText += ` AND ab.balance_date = CURRENT_DATE`;
    }

    if (baseId) {
        queryText += ` AND ab.base_id = $${paramIndex++}`;
        queryParams.push(baseId);
    }

    if (equipmentTypeId) {
        queryText += ` AND ab.equipment_type_id = $${paramIndex++}`;
        queryParams.push(equipmentTypeId);
    }

    if (role === 'base_commander' && userBaseId) {
        if (baseId && baseId !== userBaseId) {
            return res.status(403).json({ message: 'Access denied. You can only view net movement details for your assigned base.' });
        }
        if (!baseId) {  
            queryText += ` AND ab.base_id = $${paramIndex++}`;
            queryParams.push(userBaseId);
        }
    }

    queryText += ' ORDER BY ab.balance_date DESC, b.base_name, et.type_name';

    try {
        const result = await pool.query(queryText, queryParams);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching net movement details:', error);
        res.status(500).json({ message: 'Server error fetching net movement details.' });
    }
};
