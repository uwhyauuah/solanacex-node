const { getBalances } = require('../utils/solanaBalance');
const binanceApi = require('../utils/binanceApi');
const supabaseService = require('./supabaseService');
const config = require('../config/config');

class MonitoringService {
    constructor() {
        this.previousBalances = {};
        this.solKlinesPrice = null;
        this.balanceInterval = null;
    }

    async checkBalances(publicKey, email) {
        try {
            const currentBalances = await getBalances(publicKey);
            const previousBalance = this.previousBalances[publicKey] || { sol: 0, usdt: 0 };

            console.log('----------------------------------------');
            console.log(`Time: ${new Date().toISOString()}`);
            console.log(`User: ${email}`);
            console.log(`Previous SOL Balance: ${previousBalance.sol}`);
            console.log(`Current SOL Balance: ${currentBalances.sol}`);
            console.log(`USDT Balance: ${currentBalances.usdt}`);
            console.log('----------------------------------------');

            if (currentBalances.sol > previousBalance.sol) {
                const increase = currentBalances.sol - previousBalance.sol;
                await this.handleBalanceIncrease(email, publicKey, increase);
            }

            this.previousBalances[publicKey] = currentBalances;
            return currentBalances;
        } catch (error) {
            console.error('Error checking balances:', error);
            throw error;
        }
    }

    async handleBalanceIncrease(email, publicKey, increase) {
        try {
            const userData = await supabaseService.getUserBalance(email);
            const currentUserBalance = userData.balances.sol || 0;
            const newBalance = currentUserBalance + increase;

            await supabaseService.updateUserBalance(email, {
                sol: newBalance,
                usdt: userData.balances.usdt
            });

            await supabaseService.createTransaction({
                email,
                public_key: publicKey,
                type: 'SOL_DEPOSIT',
                amount: increase,
                previous_balance: currentUserBalance,
                new_balance: newBalance,
                status: 'COMPLETED',
                timestamp: new Date().toISOString()
            });

            console.log(`Balance updated successfully for ${email}`);
        } catch (error) {
            console.error('Error handling balance increase:', error);
            throw error;
        }
    }

    async monitorAllUsers() {
        try {
            const users = await supabaseService.getAllUsers();
            console.log(`Monitoring ${users.length} users...`);

            for (const user of users) {
                if (user.solana_public_key) {
                    await this.checkBalances(user.solana_public_key, user.email);
                }
            }
        } catch (error) {
            console.error('Error in monitorAllUsers:', error);
        }
    }

    startBalanceMonitoring() {
        if (this.balanceInterval) {
            clearInterval(this.balanceInterval);
        }

        console.log('Starting balance monitoring for all users...');
        this.monitorAllUsers();

        this.balanceInterval = setInterval(() => {
            this.monitorAllUsers();
        }, config.monitoring.balanceInterval);
    }

    stopBalanceMonitoring() {
        if (this.balanceInterval) {
            clearInterval(this.balanceInterval);
            this.balanceInterval = null;
            console.log('Stopping balance monitoring...');
        }
    }

    async monitorPrice(io) {
        try {
            const solKlines = await binanceApi.getSolUsdtKlines();
            this.solKlinesPrice = solKlines;
            
            if (this.solKlinesPrice) {
                io.emit('priceUpdate',  this.solKlinesPrice
                );
            }
        } catch (error) {
            console.error('Error monitoring price:', error);
        }
    }

    startPriceMonitoring(io) {
        console.log('Starting price monitoring...');
        this.monitorPrice(io);

        setInterval(() => {
            this.monitorPrice(io);
        }, config.monitoring.priceInterval);
    }
}

module.exports = new MonitoringService(); 