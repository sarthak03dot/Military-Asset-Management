
exports.authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        if (roles.length === 0) {
            return next();
        }

        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Access denied. No user role found.' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }

        next(); 
    };
};

exports.authorizeBaseAccess = (req, res, next) => {
    if (!req.user || !req.user.role) {
        return res.status(403).json({ message: 'Access denied. No user role found.' });
    }

    const { role, base_id: userBaseId } = req.user;
    const { baseId: requestedBaseId } = req.params; // Assuming baseId is passed as a URL parameter

    if (role === 'admin') {
        return next();
    }

    if (role === 'base_commander') {
        if (userBaseId && userBaseId === requestedBaseId) {
            return next();
        } else {
            return res.status(403).json({ message: 'Access denied. You can only access data for your assigned base.' });
        }
    }
    return res.status(403).json({ message: 'Access denied. Insufficient permissions for base access.' });
};
