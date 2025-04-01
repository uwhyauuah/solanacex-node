const express = require('express');
const router = express.Router();
const { validateToken } = require('../middleware/authMiddleware');
const supabaseService = require('../services/supabaseService');

// Get user profile
router.post('/profile', validateToken, async (req, res) => {
    try {
        const { email } = req.user;
        
        // Get user data from database
        const userData = await supabaseService.getUserBalance(email);
        
        if (userData.length == 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return user profile data (excluding sensitive information)
        res.json({
            email: userData.email,
            balances: userData.balances,
            solana_public_key: userData.solana_public_key,
            created_at: userData.created_at,
            updated_at: userData.updated_at
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

module.exports = router; 