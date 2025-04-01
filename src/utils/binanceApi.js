const axios = require('axios');

class BinanceApi {
    constructor() {
        this.baseUrl = 'https://api.binance.com/api/v3';
    }

    /**
     * Fetch SOL/USDT kline data
     * @param {string} interval - Time interval (e.g., '5m', '1h', '1d')
     * @returns {Promise<Object>} Formatted kline data
     */
    async getSolUsdtKlines(interval = '5m') {
        try {
            const response = await axios.get(`${this.baseUrl}/klines`, {
                params: {
                    symbol: 'SOLUSDT',
                    interval: interval
                }
            });

            // Get the most recent candle
            const klineData = response.data;

            // Format the data
            return klineData;
        } catch (error) {
            console.error('Error fetching Binance data:', error.message);
            throw new Error(`Failed to fetch SOL/USDT data: ${error.message}`);
        }
    }

    /**
     * Get current SOL/USDT price
     * @returns {Promise<number>} Current price
     */
    async getCurrentPrice() {
        try {
            const response = await axios.get(`${this.baseUrl}/ticker/price`, {
                params: {
                    symbol: 'SOLUSDT'
                }
            });
            return parseFloat(response.data.price);
        } catch (error) {
            console.error('Error fetching current price:', error.message);
            throw new Error(`Failed to fetch current price: ${error.message}`);
        }
    }

    /**
     * Get 24-hour price statistics
     * @returns {Promise<Object>} 24-hour statistics
     */
    async get24HourStats() {
        try {
            const response = await axios.get(`${this.baseUrl}/ticker/24hr`, {
                params: {
                    symbol: 'SOLUSDT'
                }
            });
            return {
                priceChange: parseFloat(response.data.priceChange),
                priceChangePercent: parseFloat(response.data.priceChangePercent),
                weightedAvgPrice: parseFloat(response.data.weightedAvgPrice),
                lastPrice: parseFloat(response.data.lastPrice),
                lastQty: parseFloat(response.data.lastQty),
                bidPrice: parseFloat(response.data.bidPrice),
                bidQty: parseFloat(response.data.bidQty),
                askPrice: parseFloat(response.data.askPrice),
                askQty: parseFloat(response.data.askQty),
                openPrice: parseFloat(response.data.openPrice),
                highPrice: parseFloat(response.data.highPrice),
                lowPrice: parseFloat(response.data.lowPrice),
                volume: parseFloat(response.data.volume),
                quoteVolume: parseFloat(response.data.quoteVolume),
                openTime: new Date(response.data.openTime).toISOString(),
                closeTime: new Date(response.data.closeTime).toISOString(),
                firstId: response.data.firstId,
                lastId: response.data.lastId,
                count: parseInt(response.data.count)
            };
        } catch (error) {
            console.error('Error fetching 24-hour stats:', error.message);
            throw new Error(`Failed to fetch 24-hour statistics: ${error.message}`);
        }
    }
}

// Create and export a singleton instance
const binanceApi = new BinanceApi();
module.exports = binanceApi; 