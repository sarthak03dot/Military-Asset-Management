const pool = require('../config');
const { logAudit } = require('../middleware/loggingMiddleware');

exports.getBases = async (req, res) => {
    try {
        const result = await pool.query('SELECT base_id, base_name, location, commander_user_id FROM bases ORDER BY base_name');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching bases:', error);
        res.status(500).json({ message: 'Server error fetching bases.' });
    }
};

exports.getBaseById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT base_id, base_name, location, commander_user_id FROM bases WHERE base_id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Base not found.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching base by ID:', error);
        res.status(500).json({ message: 'Server error fetching base.' });
    }
};

exports.createBase = async (req, res) => {
    const { base_name, location, commander_user_id } = req.body;

    if (!base_name || !location) {
        return res.status(400).json({ message: 'Base name and location are required.' });
    }

    try {
        const baseExists = await pool.query('SELECT * FROM bases WHERE base_name = $1', [base_name]);
        if (baseExists.rows.length > 0) {
            return res.status(400).json({ message: 'Base with that name already exists.' });
        }

        const newBase = await pool.query(
            'INSERT INTO bases (base_name, location, commander_user_id) VALUES ($1, $2, $3) RETURNING *',
            [base_name, location, commander_user_id]
        );

        await logAudit(req.user.user_id, 'BASE_CREATED', 'base', newBase.rows[0].base_id, {
            base_name: newBase.rows[0].base_name,
            location: newBase.rows[0].location
        }, req.ip);

        res.status(201).json({
            message: 'Base created successfully',
            base: newBase.rows[0]
        });
    } catch (error) {
        console.error('Error creating base:', error);
        res.status(500).json({ message: 'Server error creating base.' });
    }
};

exports.updateBase = async (req, res) => {
    const { id } = req.params;
    const { base_name, location, commander_user_id } = req.body;

    try {
        const oldBaseResult = await pool.query('SELECT * FROM bases WHERE base_id = $1', [id]);
        if (oldBaseResult.rows.length === 0) {
            return res.status(404).json({ message: 'Base not found.' });
        }
        const oldBase = oldBaseResult.rows[0];

        const updatedBase = await pool.query(
            'UPDATE bases SET base_name = $1, location = $2, commander_user_id = $3, updated_at = CURRENT_TIMESTAMP WHERE base_id = $4 RETURNING *',
            [base_name || oldBase.base_name, location || oldBase.location, commander_user_id || oldBase.commander_user_id, id]
        );

        await logAudit(req.user.user_id, 'BASE_UPDATED', 'base', id, {
            old_data: oldBase,
            new_data: updatedBase.rows[0]
        }, req.ip);

        res.status(200).json({
            message: 'Base updated successfully',
            base: updatedBase.rows[0]
        });
    } catch (error) {
        console.error('Error updating base:', error);
        res.status(500).json({ message: 'Server error updating base.' });
    }
};

exports.deleteBase = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM bases WHERE base_id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Base not found.' });
        }

        await logAudit(req.user.user_id, 'BASE_DELETED', 'base', id, {
            deleted_base_name: result.rows[0].base_name
        }, req.ip);

        res.status(200).json({ message: 'Base deleted successfully.' });
    } catch (error) {
        console.error('Error deleting base:', error);
        res.status(500).json({ message: 'Server error deleting base.' });
    }
};