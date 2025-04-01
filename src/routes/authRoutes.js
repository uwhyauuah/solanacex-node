const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const supabase = require('../config/supabase');
const supabaseService = require('../services/supabaseService');
const { generateSolanaKeyPair } = require('../utils/solanaUtils');

router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            console.error('Registration auth error:', authError);
            return res.status(400).json({ error: authError.message });
        }

        // Generate Solana keypair
        const { publicKey, privateKey } = generateSolanaKeyPair();

        // Create user balance record
        await supabaseService.createUserBalance({
            email,
            balances: { sol: 0, usdt: 0 },
            solana_public_key: publicKey,
            solana_private_key: privateKey
        });

        res.status(201).json({
            message: 'Registration successful',
            user: authData.user,
            solana_public_key: publicKey
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Authenticate with Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            console.error('Login auth error:', authError);
            return res.status(401).json({ error: authError.message });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: authData.user.id,
                email: authData.user.email
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        const tokenExpiresAt = Date.now() + (24 * 60 * 60 * 1000);

        try {
            // Get user data
            const userData = await supabaseService.getUserBalance(email);
            
            // Update user token
            await supabaseService.updateUserToken(email, token, tokenExpiresAt);
            if(userData != undefined) {
                res.json({
                    message: 'Login successful',
                    user: authData.user,
                    session: authData.session,
                    token,
                    token_expires_at: tokenExpiresAt,
                    balances: userData.balances,
                    solana_public_key: userData.solana_public_key
                });
            }else{
                const { publicKey, privateKey } = generateSolanaKeyPair();
                
                await supabaseService.createUserBalance({
                    email,
                    balances: { sol: 0, usdt: 0 },
                    token,
                    token_expires_at: tokenExpiresAt,
                    solana_public_key: publicKey,
                    solana_private_key: privateKey
                });

                res.json({
                    message: 'Login successful',
                    user: authData.user,
                    session: authData.session,
                    token,
                    token_expires_at: tokenExpiresAt,
                    balances: { sol: 0, usdt: 0 },
                    solana_public_key: publicKey
                });
            }

            
        } catch (error) {
            console.error('Login data error:', error);
            throw error;
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

router.post('/logout', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        await supabaseService.removeUserToken(token);
        await supabase.auth.signOut();

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

module.exports = router; 