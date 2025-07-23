const pool = require('../config');

exports.logAudit = async (userId, action, entityType, entityId, details, ipAddress) => {
    try {
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
            [userId, action, entityType, entityId, details, ipAddress]
        );
    } catch (error) {
        console.error('Error logging audit event:', error);
    }
};
