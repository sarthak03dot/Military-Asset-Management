const pool = require('../config');
const { logAudit } = require('../middleware/loggingMiddleware');

exports.getEquipmentTypes = async (req, res) => {
    try {
        const result = await pool.query('SELECT equipment_type_id, type_name, description FROM equipment_types ORDER BY type_name');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching equipment types:', error);
        res.status(500).json({ message: 'Server error fetching equipment types.' });
    }
};

exports.getEquipmentTypeById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT equipment_type_id, type_name, description FROM equipment_types WHERE equipment_type_id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Equipment type not found.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching equipment type by ID:', error);
        res.status(500).json({ message: 'Server error fetching equipment type.' });
    }
};

exports.createEquipmentType = async (req, res) => {
    const { type_name, description } = req.body;

    if (!type_name) {
        return res.status(400).json({ message: 'Equipment type name is required.' });
    }

    try {
        const typeExists = await pool.query('SELECT * FROM equipment_types WHERE type_name = $1', [type_name]);
        if (typeExists.rows.length > 0) {
            return res.status(400).json({ message: 'Equipment type with that name already exists.' });
        }

        const newType = await pool.query(
            'INSERT INTO equipment_types (type_name, description) VALUES ($1, $2) RETURNING *',
            [type_name, description]
        );

        await logAudit(req.user.user_id, 'EQUIPMENT_TYPE_CREATED', 'equipment_type', newType.rows[0].equipment_type_id, {
            type_name: newType.rows[0].type_name
        }, req.ip);

        res.status(201).json({
            message: 'Equipment type created successfully',
            equipmentType: newType.rows[0]
        });
    } catch (error) {
        console.error('Error creating equipment type:', error);
        res.status(500).json({ message: 'Server error creating equipment type.' });
    }
};

exports.updateEquipmentType = async (req, res) => {
    const { id } = req.params;
    const { type_name, description } = req.body;

    try {
        const oldTypeResult = await pool.query('SELECT * FROM equipment_types WHERE equipment_type_id = $1', [id]);
        if (oldTypeResult.rows.length === 0) {
            return res.status(404).json({ message: 'Equipment type not found.' });
        }
        const oldType = oldTypeResult.rows[0];

        const updatedType = await pool.query(
            'UPDATE equipment_types SET type_name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE equipment_type_id = $3 RETURNING *',
            [type_name || oldType.type_name, description || oldType.description, id]
        );

        await logAudit(req.user.user_id, 'EQUIPMENT_TYPE_UPDATED', 'equipment_type', id, {
            old_data: oldType,
            new_data: updatedType.rows[0]
        }, req.ip);

        res.status(200).json({
            message: 'Equipment type updated successfully',
            equipmentType: updatedType.rows[0]
        });
    } catch (error) {
        console.error('Error updating equipment type:', error);
        res.status(500).json({ message: 'Server error updating equipment type.' });
    }
};

exports.deleteEquipmentType = async (req, res) => {
    const { id } = req.params;

    try {
        const assetsLinked = await pool.query('SELECT COUNT(*) FROM assets WHERE equipment_type_id = $1', [id]);
        if (parseInt(assetsLinked.rows[0].count) > 0) {
            return res.status(400).json({ message: 'Cannot delete equipment type: Assets are currently linked to it.' });
        }

        const result = await pool.query('DELETE FROM equipment_types WHERE equipment_type_id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Equipment type not found.' });
        }

        await logAudit(req.user.user_id, 'EQUIPMENT_TYPE_DELETED', 'equipment_type', id, {
            deleted_type_name: result.rows[0].type_name
        }, req.ip);

        res.status(200).json({ message: 'Equipment type deleted successfully.' });
    } catch (error) {
        console.error('Error deleting equipment type:', error);
        res.status(500).json({ message: 'Server error deleting equipment type.' });
    }
};
