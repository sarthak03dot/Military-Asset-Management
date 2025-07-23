const pool = require('../config');
const bcrypt = require('bcryptjs');
const { logAudit } = require('../middleware/loggingMiddleware');

exports.getUsers = async (req, res) => {
    try {
        const result = await pool.query('SELECT user_id, username, email, role, base_id, created_at FROM users ORDER BY username');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error fetching users.' });
    }
};

exports.getUserById = async (req, res) => {
    const { id } = req.params;
    const { user_id: requestorId, role: requestorRole } = req.user;

    try {
        if (requestorRole !== 'admin' && requestorId !== id) {
            return res.status(403).json({ message: 'Access denied. You can only view your own profile unless you are an admin.' });
        }

        const result = await pool.query('SELECT user_id, username, email, role, base_id, created_at FROM users WHERE user_id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json({ message: 'Server error fetching user.' });
    }
};

exports.createUser = async (req, res) => {
    const { username, password, email, role, base_id } = req.body;
    const { user_id: creatorId } = req.user;

    if (!username || !password || !email || !role) {
        return res.status(400).json({ message: 'Please enter all required fields: username, password, email, role' });
    }

    const validRoles = ['admin', 'base_commander', 'logistics_officer'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified.' });
    }

    if (role === 'base_commander' && !base_id) {
        return res.status(400).json({ message: 'Base ID is required for base commanders.' });
    }

    try {
        const userExists = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User with that username or email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            'INSERT INTO users (username, password_hash, email, role, base_id) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, username, email, role, base_id',
            [username, passwordHash, email, role, base_id]
        );

        await logAudit(creatorId, 'USER_CREATED', 'user', newUser.rows[0].user_id, {
            new_username: newUser.rows[0].username,
            new_role: newUser.rows[0].role
        }, req.ip);

        res.status(201).json({
            message: 'User created successfully',
            user: {
                user_id: newUser.rows[0].user_id,
                username: newUser.rows[0].username,
                email: newUser.rows[0].email,
                role: newUser.rows[0].role,
                base_id: newUser.rows[0].base_id
            }
        });

    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Server error creating user.' });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, email, role, base_id, password } = req.body; // Password is optional for update
    const { user_id: updaterId } = req.user;

    try {
        const oldUserResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [id]);
        if (oldUserResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const oldUser = oldUserResult.rows[0];

        let passwordHash = oldUser.password_hash;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            passwordHash = await bcrypt.hash(password, salt);
        }

        const validRoles = ['admin', 'base_commander', 'logistics_officer'];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role specified.' });
        }

        if (role === 'base_commander' && !base_id) {
            return res.status(400).json({ message: 'Base ID is required for base commanders.' });
        }

        const updatedUser = await pool.query(
            `UPDATE users SET
                username = $1,
                email = $2,
                role = $3,
                base_id = $4,
                password_hash = $5,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $6 RETURNING user_id, username, email, role, base_id`,
            [
                username || oldUser.username,
                email || oldUser.email,
                role || oldUser.role,
                base_id || oldUser.base_id,
                passwordHash,
                id
            ]
        );

        await logAudit(updaterId, 'USER_UPDATED', 'user', id, {
            old_data: { username: oldUser.username, role: oldUser.role, email: oldUser.email, base_id: oldUser.base_id },
            new_data: { username: updatedUser.rows[0].username, role: updatedUser.rows[0].role, email: updatedUser.rows[0].email, base_id: updatedUser.rows[0].base_id }
        }, req.ip);

        res.status(200).json({
            message: 'User updated successfully',
            user: updatedUser.rows[0]
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error updating user.' });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    const { user_id: deleterId } = req.user;

    try {
        const result = await pool.query('DELETE FROM users WHERE user_id = $1 RETURNING username', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        await logAudit(deleterId, 'USER_DELETED', 'user', id, {
            deleted_username: result.rows[0].username
        }, req.ip);

        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error deleting user.' });
    }
};
