const express = require('express');
const router = express.Router();
const monitoringService = require('../services/monitoringService');
const supabaseService = require('../services/supabaseService');

router.get('/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const userData = await supabaseService.getUserBalance(email);

        if (!userData || !userData.solana_public_key) {
            return res.status(404).json({ error: 'User not found or no public key available' });
        }

        const balances = await monitoringService.checkBalances(userData.solana_public_key, email);
        res.json(balances);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get balances' });
    }
});

module.exports = router; 