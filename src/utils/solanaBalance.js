const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, getAccount } = require('@solana/spl-token');

// Connect to Solana devnet
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// USDT token mint address on devnet
const USDT_MINT = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr');

/**
 * Get SOL balance for a wallet
 * @param {string} publicKey - Base58 encoded public key
 * @returns {Promise<number>} SOL balance
 */
async function getSolBalance(publicKey) {
    try {
        const pubKey = new PublicKey(publicKey);
        const balance = await connection.getBalance(pubKey);
        return balance / LAMPORTS_PER_SOL; // Convert lamports to SOL
    } catch (error) {
        console.error('Error getting SOL balance:', error);
        throw error;
    }
}

/**
 * Get USDT token balance for a wallet
 * @param {string} publicKey - Base58 encoded public key
 * @returns {Promise<number>} USDT balance
 */
async function getUsdtBalance(publicKey) {
    try {
        const pubKey = new PublicKey(publicKey);
        
        // Find the token account
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubKey, {
            mint: USDT_MINT
        });

        if (tokenAccounts.value.length === 0) {
            return 0; // No USDT account found
        }

        // Get the first token account
        const tokenAccount = tokenAccounts.value[0];
        const accountInfo = await getAccount(connection, tokenAccount.pubkey);
        
        // USDT has 6 decimals
        return Number(accountInfo.amount) / 1000000;
    } catch (error) {
        console.error('Error getting USDT balance:', error);
        throw error;
    }
}

/**
 * Get both SOL and USDT balances for a wallet
 * @param {string} publicKey - Base58 encoded public key
 * @returns {Promise<{sol: number, usdt: number}>} Object containing SOL and USDT balances
 */
async function getBalances(publicKey) {
    try {
        const [solBalance, usdtBalance] = await Promise.all([
            getSolBalance(publicKey),
            getUsdtBalance(publicKey)
        ]);

        return {
            sol: solBalance,
            usdt: usdtBalance
        };
    } catch (error) {
        console.error('Error getting balances:', error);
        throw error;
    }
}

/**
 * Monitor balance changes for a wallet
 * @param {string} publicKey - Base58 encoded public key
 * @param {Function} callback - Callback function to handle balance updates
 * @returns {Function} Function to stop monitoring
 */
function monitorBalances(publicKey, callback) {
    const pubKey = new PublicKey(publicKey);
    
    // Monitor SOL balance
    const solSubscription = connection.onAccountChange(
        pubKey,
        async (accountInfo) => {
            const solBalance = accountInfo.lamports / LAMPORTS_PER_SOL;
            const usdtBalance = await getUsdtBalance(publicKey);
            callback({ sol: solBalance, usdt: usdtBalance });
        },
        'confirmed'
    );

    // Monitor USDT token account
    const usdtSubscription = connection.onProgramAccountChange(
        TOKEN_PROGRAM_ID,
        async (accountInfo) => {
            const solBalance = await getSolBalance(publicKey);
            const usdtBalance = await getUsdtBalance(publicKey);
            callback({ sol: solBalance, usdt: usdtBalance });
        },
        'confirmed',
        {
            filters: [
                {
                    memcmp: {
                        offset: 32, // Token account owner offset
                        bytes: pubKey.toBase58()
                    }
                },
                {
                    memcmp: {
                        offset: 0, // Token mint offset
                        bytes: USDT_MINT.toBase58()
                    }
                }
            ]
        }
    );

    // Return function to stop monitoring
    return () => {
        connection.removeAccountChangeListener(solSubscription);
        connection.removeProgramAccountChangeListener(usdtSubscription);
    };
}

module.exports = {
    getSolBalance,
    getUsdtBalance,
    getBalances,
    monitorBalances
}; 