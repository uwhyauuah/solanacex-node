const express = require('express');
const router = express.Router();
const { validateToken } = require('../middleware/authMiddleware');
const supabaseService = require('../services/supabaseService');
const monitoringService = require('../services/monitoringService');

router.post('/sell-sol', validateToken, async (req, res) => {
    try {
        const { email, token, solAmount, price } = req.body;

        if (!email || !token || !solAmount || !price) {
            return res.status(400).json({ 
                error: 'Email, token, SOL amount, and price are required' 
            });
        }

        // Validate solAmount and price are positive numbers
        if (isNaN(solAmount) || solAmount <= 0) {
            return res.status(400).json({ 
                error: 'SOL amount must be a positive number' 
            });
        }

        if (isNaN(price) || price <= 0) {
            return res.status(400).json({ 
                error: 'Price must be a positive number' 
            });
        }

        // Get user's current balance
        const userData = await supabaseService.getUserBalance(email);
        if (!userData) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user has enough SOL
        if (!userData.balances.sol || userData.balances.sol < solAmount) {
            return res.status(400).json({ 
                error: 'Insufficient SOL balance',
                currentBalance: userData.balances.sol,
                requiredAmount: solAmount
            });
        }

        // Calculate USDT amount (using the provided price)
        const usdtAmount = solAmount * price;

        // Update user balances
        const newBalances = {
            sol: userData.balances.sol - solAmount,
            usdt: (userData.balances.usdt || 0) + usdtAmount
        };

        await supabaseService.updateUserBalance(email, newBalances);

        // Create trade record
        await supabaseService.createTrade({
            email,
            public_key: userData.solana_public_key,
            type: 'SOL_SELL',
            sol_amount: solAmount,
            usdt_amount: usdtAmount,
            price: price,
            previous_balance: userData.balances,
            new_balance: newBalances,
            status: 'COMPLETED'
        });

        res.json({
            message: 'SOL sold successfully',
            trade: {
                solAmount,
                usdtAmount,
                price: price,
                newBalances
            }
        });

    } catch (error) {
        console.error('Sell SOL error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Get user's trade history
router.get('/history', validateToken, async (req, res) => {
    try {
        const { email } = req.user;
        const trades = await supabaseService.getUserTrades(email);
        res.json(trades);
    } catch (error) {
        console.error('Get trade history error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Get specific trade details
router.get('/:id', validateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const trade = await supabaseService.getTradeById(id);
        
        if (!trade) {
            return res.status(404).json({ error: 'Trade not found' });
        }

        // Check if the trade belongs to the user
        if (trade.email !== req.user.email) {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        res.json(trade);
    } catch (error) {
        console.error('Get trade details error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

module.exports = router; 