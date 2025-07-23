const pool = require('../config');
const { logAudit } = require('../middleware/loggingMiddleware');

async function checkBaseExists(baseId) {
    const result = await pool.query('SELECT base_id FROM bases WHERE base_id = $1', [baseId]);
    return result.rows.length > 0;
}

async function checkEquipmentTypeExists(equipmentTypeId) {
    const result = await pool.query('SELECT equipment_type_id FROM equipment_types WHERE equipment_type_id = $1', [equipmentTypeId]);
    return result.rows.length > 0;
}

exports.getAssets = async (req, res) => {
    const { role, base_id: userBaseId } = req.user;
    let queryText = `
        SELECT
            a.asset_id,
            a.serial_number,
            et.type_name AS equipment_type,
            a.model,
            a.manufacturer,
            b.base_name AS current_base,
            a.status,
            a.created_at,
            a.last_updated_at
        FROM assets a
        JOIN equipment_types et ON a.equipment_type_id = et.equipment_type_id
        JOIN bases b ON a.current_base_id = b.base_id
    `;
    const queryParams = [];

    if (role === 'base_commander' && userBaseId) {
        queryText += ' WHERE a.current_base_id = $1';
        queryParams.push(userBaseId);
    }

    queryText += ' ORDER BY a.serial_number';

    try {
        const result = await pool.query(queryText, queryParams);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching assets:', error);
        res.status(500).json({ message: 'Server error fetching assets.' });
    }
};

exports.getAssetById = async (req, res) => {
    const { id } = req.params;
    const { role, base_id: userBaseId } = req.user;

    try {
        const result = await pool.query(
            `SELECT
                a.asset_id,
                a.serial_number,
                a.equipment_type_id,
                et.type_name AS equipment_type_name,
                a.model,
                a.manufacturer,
                a.current_base_id,
                b.base_name AS current_base_name,
                a.status,
                a.created_at,
                a.last_updated_at
            FROM assets a
            JOIN equipment_types et ON a.equipment_type_id = et.equipment_type_id
            JOIN bases b ON a.current_base_id = b.base_id
            WHERE a.asset_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Asset not found.' });
        }

        const asset = result.rows[0];

        if (role === 'base_commander' && userBaseId && asset.current_base_id !== userBaseId) {
            return res.status(403).json({ message: 'Access denied. You can only view assets at your assigned base.' });
        }

        res.status(200).json(asset);
    } catch (error) {
        console.error('Error fetching asset by ID:', error);
        res.status(500).json({ message: 'Server error fetching asset.' });
    }
};

exports.getAssetDetails = async (req, res) => {
    const { id } = req.params;
    const { role, base_id: userBaseId } = req.user;

    const client = await pool.connect();
    try {
        const assetResult = await client.query(
            `SELECT
                a.asset_id,
                a.serial_number,
                a.equipment_type_id,
                et.type_name AS equipment_type_name,
                a.model,
                a.manufacturer,
                a.current_base_id,
                b.base_name AS current_base_name,
                a.status,
                a.created_at,
                a.last_updated_at
            FROM assets a
            JOIN equipment_types et ON a.equipment_type_id = et.equipment_type_id
            JOIN bases b ON a.current_base_id = b.base_id
            WHERE a.asset_id = $1`,
            [id]
        );

        if (assetResult.rows.length === 0) {
            return res.status(404).json({ message: 'Asset not found.' });
        }
        const asset = assetResult.rows[0];

        if (role === 'base_commander' && userBaseId && asset.current_base_id !== userBaseId) {
            return res.status(403).json({ message: 'Access denied. You can only view details for assets at your assigned base.' });
        }

        const purchasesResult = await client.query(
            `SELECT
                p.purchase_id,
                p.purchase_date,
                p.quantity,
                p.unit_cost,
                p.total_cost,
                u.username AS purchased_by_username,
                b.base_name AS purchased_for_base_name
            FROM purchases p
            JOIN users u ON p.purchased_by = u.user_id
            JOIN bases b ON p.base_id = b.base_id
            WHERE p.asset_id = $1
            ORDER BY p.purchase_date DESC`,
            [id]
        );

        const transfersResult = await client.query(
            `SELECT
                t.transfer_id,
                t.transfer_date,
                t.quantity,
                b_from.base_name AS from_base_name,
                b_to.base_name AS to_base_name,
                t.status,
                t.completed_at,
                u.username AS transferred_by_username
            FROM transfers t
            JOIN bases b_from ON t.from_base_id = b_from.base_id
            JOIN bases b_to ON t.to_base_id = b_to.base_id
            LEFT JOIN users u ON t.transferred_by = u.user_id
            WHERE t.asset_id = $1
            ORDER BY t.transfer_date DESC`,
            [id]
        );

        const assignmentsResult = await client.query(
            `SELECT
                a.assignment_id,
                a.assigned_date,
                a.return_date,
                a.status,
                assigned_to_user.username AS assigned_to_username,
                assigned_by_user.username AS assigned_by_username
            FROM assignments a
            LEFT JOIN users assigned_to_user ON a.assigned_to_user_id = assigned_to_user.user_id
            LEFT JOIN users assigned_by_user ON a.assigned_by = assigned_by_user.user_id
            WHERE a.asset_id = $1
            ORDER BY a.assigned_date DESC`,
            [id]
        );

        const expendituresResult = await client.query(
            `SELECT
                e.expenditure_id,
                e.expenditure_date,
                e.quantity,
                e.reason,
                u.username AS expended_by_username,
                b.base_name AS expended_at_base_name
            FROM expenditures e
            JOIN bases b ON e.base_id = b.base_id
            LEFT JOIN users u ON e.expended_by = u.user_id
            WHERE e.asset_id = $1
            ORDER BY e.expenditure_date DESC`,
            [id]
        );

        res.status(200).json({
            assetInfo: asset,
            history: {
                purchases: purchasesResult.rows,
                transfers: transfersResult.rows,
                assignments: assignmentsResult.rows,
                expenditures: expendituresResult.rows,
            },
        });

    } catch (error) {
        console.error('Error fetching asset details:', error);
        res.status(500).json({ message: 'Server error fetching asset details.' });
    } finally {
        client.release();
    }
};


exports.createAsset = async (req, res) => {
    const { serial_number, equipment_type_id, model, manufacturer, current_base_id } = req.body;
    const { user_id } = req.user;

    if (!serial_number || !equipment_type_id || !current_base_id) {
        return res.status(400).json({ message: 'Serial number, equipment type ID, and current base ID are required.' });
    }

    try {
        const assetExists = await pool.query('SELECT * FROM assets WHERE serial_number = $1', [serial_number]);
        if (assetExists.rows.length > 0) {
            return res.status(400).json({ message: 'Asset with that serial number already exists.' });
        }

        if (!(await checkBaseExists(current_base_id))) {
            return res.status(400).json({ message: 'Invalid current_base_id. Base does not exist.' });
        }

        if (!(await checkEquipmentTypeExists(equipment_type_id))) {
            return res.status(400).json({ message: 'Invalid equipment_type_id. Equipment type does not exist.' });
        }

        const newAsset = await pool.query(
            'INSERT INTO assets (serial_number, equipment_type_id, model, manufacturer, current_base_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [serial_number, equipment_type_id, model, manufacturer, current_base_id]
        );

        await logAudit(user_id, 'ASSET_CREATED', 'asset', newAsset.rows[0].asset_id, {
            serial_number: newAsset.rows[0].serial_number,
            equipment_type_id: newAsset.rows[0].equipment_type_id,
            current_base_id: newAsset.rows[0].current_base_id
        }, req.ip);

        res.status(201).json({
            message: 'Asset created successfully',
            asset: newAsset.rows[0]
        });
    } catch (error) {
        console.error('Error creating asset:', error);
        res.status(500).json({ message: 'Server error creating asset.' });
    }
};

exports.updateAsset = async (req, res) => {
    const { id } = req.params;
    const { serial_number, equipment_type_id, model, manufacturer, current_base_id, status } = req.body;
    const { user_id } = req.user;

    try {
        const oldAssetResult = await pool.query('SELECT * FROM assets WHERE asset_id = $1', [id]);
        if (oldAssetResult.rows.length === 0) {
            return res.status(404).json({ message: 'Asset not found.' });
        }
        const oldAsset = oldAssetResult.rows[0];

        if (equipment_type_id && !(await checkEquipmentTypeExists(equipment_type_id))) {
            return res.status(400).json({ message: 'Invalid equipment_type_id. Equipment type does not exist.' });
        }
        if (current_base_id && !(await checkBaseExists(current_base_id))) {
            return res.status(400).json({ message: 'Invalid current_base_id. Base does not exist.' });
        }

        const updatedAsset = await pool.query(
            `UPDATE assets SET
                serial_number = $1,
                equipment_type_id = $2,
                model = $3,
                manufacturer = $4,
                current_base_id = $5,
                status = $6,
                last_updated_at = CURRENT_TIMESTAMP
            WHERE asset_id = $7 RETURNING *`,
            [
                serial_number || oldAsset.serial_number,
                equipment_type_id || oldAsset.equipment_type_id,
                model || oldAsset.model,
                manufacturer || oldAsset.manufacturer,
                current_base_id || oldAsset.current_base_id,
                status || oldAsset.status,
                id
            ]
        );

        await logAudit(user_id, 'ASSET_UPDATED', 'asset', id, {
            old_data: oldAsset,
            new_data: updatedAsset.rows[0]
        }, req.ip);

        res.status(200).json({
            message: 'Asset updated successfully',
            asset: updatedAsset.rows[0]
        });
    } catch (error) {
        console.error('Error updating asset:', error);
        res.status(500).json({ message: 'Server error updating asset.' });
    }
};

exports.deleteAsset = async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.user;

    try {
        const result = await pool.query('DELETE FROM assets WHERE asset_id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Asset not found.' });
        }

        await logAudit(user_id, 'ASSET_DELETED', 'asset', id, {
            deleted_serial_number: result.rows[0].serial_number
        }, req.ip);

        res.status(200).json({ message: 'Asset deleted successfully.' });
    } catch (error) {
        console.error('Error deleting asset:', error);
        res.status(500).json({ message: 'Server error deleting asset.' });
    }
};
