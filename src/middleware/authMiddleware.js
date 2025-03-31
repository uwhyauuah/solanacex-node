const jwt = require('jsonwebtoken');
const config = require('../config/config');
const supabaseService = require('../services/supabaseService');

const validateToken = async (req, res, next) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(401).json({ error: 'Token is required' });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, config.jwt.secret);
        
        // Check if token exists in database and is not expired
        const userData = await supabaseService.getUserBalance(decoded.email);
        
        if (!userData || userData.token !== token || new Date(userData.token_expires_at) < new Date()) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Add user data to request object
        req.user = {
            email: decoded.email,
            userId: decoded.userId
        };
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    validateToken
}; 