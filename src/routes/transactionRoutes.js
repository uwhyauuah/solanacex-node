const express = require('express');
const router = express.Router();
const { validateToken } = require('../middleware/authMiddleware');
const supabaseService = require('../services/supabaseService');

router.post('/transactions', validateToken, async (req, res) => {
    try {
        const { email, publicKey } = req.body;

        if (!email || !publicKey) {
            return res.status(400).json({ 
                error: 'Email and public key are required' 
            });
        }

        const transactions = await supabaseService.getTransactions(email, publicKey);
        
        res.json({
            message: 'Transactions retrieved successfully',
            transactions: transactions
        });

    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve transactions',
            details: error.message 
        });
    }
});

module.exports = router;