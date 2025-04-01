const supabase = require('../config/supabase');

class SupabaseService {
    async getUserBalance(email) {
        try {
            const { data, error } = await supabase
                .from('user_balances')
                .select('*')
                .eq('email', email);

            
            return data[0];
        } catch (error) {
            console.error('Get user balance error:', error);
            throw error;
        }
    }

    async updateUserBalance(email, balances) {
        try {
            const { error } = await supabase
                .from('user_balances')
                .update({ balances })
                .eq('email', email);

            if (error) {
                console.error('Update user balance error:', error);
                throw error;
            }
        } catch (error) {
            console.error('Update user balance error:', error);
            throw error;
        }
    }

    async createTransaction(transactionData) {
        try {
            const { error } = await supabase
                .from('transactions')
                .insert([transactionData]);

            if (error) {
                console.error('Create transaction error:', error);
                throw error;
            }
        } catch (error) {
            console.error('Create transaction error:', error);
            throw error;
        }
    }

    async getAllUsers() {
        try {
            const { data, error } = await supabase
                .from('user_balances')
                .select('email, solana_public_key');

            if (error) {
                console.error('Get all users error:', error);
                throw error;
            }
            return data;
        } catch (error) {
            console.error('Get all users error:', error);
            throw error;
        }
    }

    async updateUserToken(email, token, tokenExpiresAt) {
        try {
            const { error } = await supabase
                .from('user_balances')
                .update({
                    token,
                    token_expires_at: tokenExpiresAt
                })
                .eq('email', email);

            if (error) {
                console.error('Update user token error:', error);
                throw error;
            }
        } catch (error) {
            console.error('Update user token error:', error);
            throw error;
        }
    }

    async removeUserToken(token) {
        try {
            const { error } = await supabase
                .from('user_balances')
                .update({
                    token: null,
                    token_expires_at: null
                })
                .eq('token', token);

            if (error) {
                console.error('Remove user token error:', error);
                throw error;
            }
        } catch (error) {
            console.error('Remove user token error:', error);
            throw error;
        }
    }

    async createUserBalance(userData) {
        try {
            const { error } = await supabase
                .from('user_balances')
                .insert([userData]);

            if (error) {
                console.error('Create user balance error:', error);
                throw error;
            }
        } catch (error) {
            console.error('Create user balance error:', error);
            throw error;
        }
    }

    async createTrade(tradeData) {
        try {
            const { error } = await supabase
                .from('trades')
                .insert([tradeData]);

            if (error) {
                console.error('Create trade error:', error);
                throw error;
            }
        } catch (error) {
            console.error('Create trade error:', error);
            throw error;
        }
    }

    async getUserTrades(email) {
        try {
            const { data, error } = await supabase
                .from('trades')
                .select('*')
                .eq('email', email)
                .order('created_at', { ascending: false });
                console.log(data);
                console.log("GGG");

            return data;
        } catch (error) {
            console.error('Get user trades error:', error);
            throw error;
        }
    }

    async getTradeById(id) {
        try {
            const { data, error } = await supabase
                .from('trades')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Get trade by id error:', error);
                throw error;
            }
            return data;
        } catch (error) {
            console.error('Get trade by id error:', error);
            throw error;
        }
    }

    async getTransactions(email, publicKey) {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('email', email)
                .eq('public_key', publicKey);

            if (error) {
                console.error('Get transactions error:', error);
                throw error;
            }
            return data;
        } catch (error) {
            console.error('Get transactions error:', error);
            throw error;
        }
    }
}

module.exports = new SupabaseService();