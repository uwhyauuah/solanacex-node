const { getBalances } = require('./solanaBalance');

// Function to check balances
async function checkBalances(publicKey) {
    try {
        const balances = await getBalances(publicKey);
        console.log('----------------------------------------');
        console.log(`Time: ${new Date().toISOString()}`);
        console.log(`SOL Balance: ${balances.sol}`);
        console.log(`USDT Balance: ${balances.usdt}`);
        console.log('----------------------------------------');
    } catch (error) {
        console.error('Error checking balances:', error);
    }
}

// Function to start the cron job
function startBalanceCron(publicKey) {
    console.log('Starting balance monitoring...');
    
    // Check immediately
    checkBalances(publicKey);
    
    // Set up interval for every 5 seconds
    const interval = setInterval(() => {
        checkBalances(publicKey);
    }, 5000);
    
    // Handle process termination
    process.on('SIGINT', () => {
        clearInterval(interval);
        console.log('Stopping balance monitoring...');
        process.exit();
    });
    
    return interval;
}

// Example usage
if (require.main === module) {
    const publicKey = process.argv[2];
    
    if (!publicKey) {
        console.error('Please provide a Solana public key as an argument');
        process.exit(1);
    }
    
    startBalanceCron(publicKey);
}

module.exports = {
    startBalanceCron,
    checkBalances
}; 