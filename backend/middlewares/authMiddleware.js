import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ error: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ error: 'Not authorized, no token' });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Role is not authorized to access this route` });
        }
        next();
    };
};

export const requireBiometric = (req, res, next) => {
    // We assume biometric verification is handled via a separate endpoint
    // that issues a special token or updates the current session state.
    // For MVP, we check a flag in the payload.
    if (!req.headers['x-biometric-token']) {
        return res.status(403).json({ error: 'Biometric confirmation token required for this action' });
    }
    try {
        const decoded = jwt.verify(req.headers['x-biometric-token'], process.env.JWT_SECRET);
        if (decoded.biometricVerified && decoded.id === req.user.id) {
            next();
        } else {
            throw new Error('Invalid biometric token');
        }
    } catch (error) {
        return res.status(403).json({ error: 'Invalid biometric confirmation' });
    }
};
