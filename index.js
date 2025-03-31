const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const { Keypair } = require('@solana/web3.js');
const { getBalances } = require('./solanaBalance');
const binanceApi = require('./binanceApi');
const http = require('http');
const { Server } = require("socket.io");
var cron = require('node-cron');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const port = 3000;

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Function to generate Solana key pair
function generateSolanaKeyPair() {
    const keypair = Keypair.generate();
    return {
        publicKey: keypair.publicKey.toBase58(),
        privateKey: Buffer.from(keypair.secretKey).toString('base64')
    };
}

// Store previous balances for comparison
let previousBalances = {};

// Function to check balances and update if changed
async function checkBalances(publicKey, email) {
    try {
        const currentBalances = await getBalances(publicKey);
        const previousBalance = previousBalances[publicKey] || { sol: 0, usdt: 0 };

        console.log('----------------------------------------');
        console.log(`Time: ${new Date().toISOString()}`);
        console.log(`User: ${email}`);
        console.log(`Previous SOL Balance: ${previousBalance.sol}`);
        console.log(`Current SOL Balance: ${currentBalances.sol}`);
        console.log(`USDT Balance: ${currentBalances.usdt}`);
        console.log('----------------------------------------');

        // Check if SOL balance has increased
        if (currentBalances.sol > previousBalance.sol) {
            const increase = currentBalances.sol - previousBalance.sol;
            console.log(`SOL Balance increased by: ${increase}`);

            // Get current user balance from database
            const { data: userData, error: userError } = await supabase
                .from('user_balances')
                .select('balances')
                .eq('email', email)
                .single();

            if (userError) {
                console.error('Error fetching user balance:', userError);
                return;
            }

            // Calculate new balance by adding only the increase
            const currentUserBalance = userData.balances.sol || 0;
            const newBalance = currentUserBalance + increase;

            // Update user's balance in the database
            const { error: updateError } = await supabase
                .from('user_balances')
                .update({
                    balances: {
                        sol: newBalance,
                        usdt: userData.balances.usdt
                    }
                })
                .eq('email', email);

            if (updateError) {
                console.error('Error updating user balance:', updateError);
            } else {
                console.log(`Current User Balance: ${currentUserBalance}`);
                console.log(`Increase Amount: ${increase}`);
                console.log(`Updated User Balance: ${newBalance}`);

                // Insert transaction record
                const { error: transactionError } = await supabase
                    .from('transactions')
                    .insert([
                        {
                            email: email,
                            public_key: publicKey,
                            type: 'SOL_DEPOSIT',
                            amount: increase,
                            previous_balance: currentUserBalance,
                            new_balance: newBalance,
                            status: 'COMPLETED',
                            timestamp: new Date().toISOString()
                        }
                    ]);

                if (transactionError) {
                    console.error('Error recording transaction:', transactionError);
                } else {
                    console.log('Transaction recorded successfully');
                }
            }
        }

        // Update previous balance for next comparison
        previousBalances[publicKey] = currentBalances;
        return currentBalances;
    } catch (error) {
        console.error('Error checking balances:', error);
        throw error;
    }
}

// Function to monitor all users' balances
async function monitorAllUsers() {
    try {
        // Get all users from user_balances table
        const { data: users, error } = await supabase
            .from('user_balances')
            .select('email, solana_public_key');

        if (error) {
            console.error('Error fetching users:', error);
            return;
        }

        console.log(`Monitoring ${users.length} users...`);

        // Check balances for each user
        for (const user of users) {
            if (user.solana_public_key) {
                await checkBalances(user.solana_public_key, user.email);
            }
        }
    } catch (error) {
        console.error('Error in monitorAllUsers:', error);
    }
}

// Start balance monitoring for all users
let balanceInterval;

function startBalanceMonitoring() {
    // Clear any existing interval
    if (balanceInterval) {
        clearInterval(balanceInterval);
    }

    console.log('Starting balance monitoring for all users...');

    // Check immediately
    monitorAllUsers();

    // Set up interval for every 5 seconds
    balanceInterval = setInterval(() => {
        monitorAllUsers();
    }, 5000);
}

function stopBalanceMonitoring() {
    if (balanceInterval) {
        clearInterval(balanceInterval);
        balanceInterval = null;
        console.log('Stopping balance monitoring...');
    }
}


function stopPriceMonitoring() {
    if (priceInterval) {
        clearInterval(priceInterval);
        priceInterval = null;
        console.log('Stopping SOL price monitoring...');
    }
}

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Express API!' });
});

// Get current balances for a specific user
app.get('/balances/:email', async (req, res) => {
    try {
        const { email } = req.params;

        // Get user's public key from user_balances table
        const { data: userData, error: userError } = await supabase
            .from('user_balances')
            .select('solana_public_key')
            .eq('email', email)
            .single();

        if (userError || !userData || !userData.solana_public_key) {
            return res.status(404).json({ error: 'User not found or no public key available' });
        }

        const balances = await checkBalances(userData.solana_public_key, email);
        res.json(balances);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get balances' });
    }
});

// Register endpoint
app.post('/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({
            message: 'Registration successful',
            user: data.user,
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login endpoint
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            return res.status(401).json({ error: authError.message });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: authData.user.id,
                email: authData.user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Calculate token expiration time in milliseconds
        const tokenExpiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now in milliseconds

        // Check if user exists in the balances table
        const { data: userData, error: userError } = await supabase
            .from('user_balances')
            .select('*')
            .eq('email', email)
            .single();

        if (userError && userError.code !== 'PGRST116') { // PGRST116 is "not found"
            return res.status(500).json({ error: 'Error checking user balance' });
        }

        // If user doesn't exist in balances table, create a new record
        if (!userData) {
            // Generate Solana key pair
            const { publicKey, privateKey } = generateSolanaKeyPair();

            const { error: insertError } = await supabase
                .from('user_balances')
                .insert([
                    {
                        email: email,
                        balances: {
                            sol: 0,
                            usdt: 0
                        },
                        token: token,
                        token_expires_at: tokenExpiresAt,
                        solana_public_key: publicKey,
                        solana_private_key: privateKey
                    }
                ]);

            if (insertError) {
                return res.status(500).json({ error: 'Error creating user balance record' });
            }

            res.json({
                message: 'Login successful',
                user: authData.user,
                session: authData.session,
                token: token,
                token_expires_at: tokenExpiresAt,
                balances: { sol: 0, usdt: 0 },
                solana_public_key: publicKey
            });
        } else {
            // Update existing user's token
            const { error: updateError } = await supabase
                .from('user_balances')
                .update({
                    token: token,
                    token_expires_at: tokenExpiresAt
                })
                .eq('email', email);

            if (updateError) {
                return res.status(500).json({ error: 'Error updating user token' });
            }

            res.json({
                message: 'Login successful',
                user: authData.user,
                session: authData.session,
                token: token,
                token_expires_at: tokenExpiresAt,
                balances: userData.balances,
                solana_public_key: userData.solana_public_key
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout endpoint
app.post('/auth/logout', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        // Remove token from user_balances table
        const { error: updateError } = await supabase
            .from('user_balances')
            .update({
                token: null,
                token_expires_at: null
            })
            .eq('token', token);

        if (updateError) {
            return res.status(500).json({ error: 'Error removing token' });
        }

        // Sign out from Supabase
        const { error: authError } = await supabase.auth.signOut();

        if (authError) {
            return res.status(400).json({ error: authError.message });
        }

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Handle process termination
process.on('SIGINT', () => {
    stopBalanceMonitoring();
    server.close(() => {
        console.log('Server closed');
        process.exit();
    });
});

// Start monitoring route (admin only)
startBalanceMonitoring();


let solKlinesPrice;
async function binanceSol() {
    try {
        const solKlines = await binanceApi.getSolUsdtKlines();
        console.log('SOL/USDT Klines:', solKlines);
        solKlinesPrice = solKlines;
        
        // Emit price update to all connected clients
        if (solKlinesPrice) {
            io.emit('priceUpdate', {
                timestamp: new Date().toISOString(),
                data: solKlinesPrice
            });
        }
        
        // Call itself again after 5 seconds
        setTimeout(() => {
            binanceSol();
        }, 5000);
        
        return solKlines;
    } catch (error) {
        console.error('Error in binanceSol:', error);
        // Even if there's an error, continue monitoring
        setTimeout(() => {
            binanceSol();
        }, 5000);
        return null;
    }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Send initial price data if available
    setInterval(() => {
        if (solKlinesPrice) {
            socket.emit('sol', solKlinesPrice);
        }
    }, 1000);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start the monitoring
binanceSol();

// Start the server
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
