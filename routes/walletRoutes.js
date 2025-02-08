const express = require('express');
const router = express.Router();
const { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');
require('dotenv').config();

// Initialize Solana connection
const connection = new Connection(
    process.env.QUICKNODE_RPC_URL || clusterApiUrl('mainnet-beta'),
    'confirmed'
);

// Get wallet balance
router.post('/get-balance', async (req, res) => {
    try {
        const { wallet } = req.body;
        
        if (!wallet) {
            return res.status(400).json({ 
                success: false, 
                message: 'Wallet address is required' 
            });
        }

        const pubKey = new PublicKey(wallet);
        const balance = await connection.getBalance(pubKey);
        const solBalance = balance / LAMPORTS_PER_SOL;

        res.json({
            success: true,
            balance: solBalance
        });
    } catch (error) {
        console.error('Error getting balance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get wallet balance',
            error: error.message
        });
    }
});

// Get account info
router.post('/get-account-info', async (req, res) => {
    try {
        const { wallet } = req.body;
        
        if (!wallet) {
            return res.status(400).json({
                success: false,
                message: 'Wallet address is required'
            });
        }

        const pubKey = new PublicKey(wallet);
        const accountInfo = await connection.getAccountInfo(pubKey);

        if (!accountInfo) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        res.json({
            success: true,
            accountInfo: {
                lamports: accountInfo.lamports,
                owner: accountInfo.owner.toString(),
                executable: accountInfo.executable,
                rentEpoch: accountInfo.rentEpoch
            }
        });
    } catch (error) {
        console.error('Error getting account info:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get account info',
            error: error.message
        });
    }
});

// Get token accounts
router.post('/get-token-accounts', async (req, res) => {
    try {
        const { wallet } = req.body;
        
        if (!wallet) {
            return res.status(400).json({
                success: false,
                message: 'Wallet address is required'
            });
        }

        const pubKey = new PublicKey(wallet);
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubKey, {
            programId: TOKEN_PROGRAM_ID
        });

        const formattedTokens = tokenAccounts.value.map(account => ({
            mint: account.account.data.parsed.info.mint,
            tokenAddress: account.pubkey.toString(),
            amount: account.account.data.parsed.info.tokenAmount.uiAmount,
            decimals: account.account.data.parsed.info.tokenAmount.decimals,
            uiAmount: account.account.data.parsed.info.tokenAmount.uiAmountString
        }));

        res.json({
            success: true,
            tokens: formattedTokens
        });
    } catch (error) {
        console.error('Error getting token accounts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get token accounts',
            error: error.message
        });
    }
});

// Disconnect wallet
router.post('/disconnect', async (req, res) => {
    try {
        const { wallet } = req.body;
        
        if (!wallet) {
            return res.status(400).json({
                success: false,
                message: 'Wallet address is required'
            });
        }
        
        res.json({
            success: true,
            message: 'Wallet disconnected successfully'
        });
    } catch (error) {
        console.error('Error disconnecting wallet:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to disconnect wallet',
            error: error.message
        });
    }
});

module.exports = router;