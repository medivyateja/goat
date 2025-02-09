const express = require('express');
const router = express.Router();
const { 
    Connection, 
    PublicKey, 
    clusterApiUrl, 
    LAMPORTS_PER_SOL 
} = require('@solana/web3.js');
const { 
    TOKEN_PROGRAM_ID,
    getAccount,
    getAssociatedTokenAddress,
    getMint
} = require('@solana/spl-token');
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

// New route to fetch user's tokens and balances
router.post('/get-tokens', async (req, res) => {
    try {
        const { wallet } = req.body;
        const GOAT_MINT_ADDRESS = process.env.YOUR_GOAT_TOKEN_MINT_ADDRESS;
        
        if (!wallet) {
            return res.status(400).json({
                success: false,
                message: 'Wallet address is required'
            });
        }

        const pubKey = new PublicKey(wallet);
        
        // Add delay helper function
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        // Fetch all token accounts owned by the wallet
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubKey, {
            programId: TOKEN_PROGRAM_ID
        });

        // Process token accounts with delay between each
        const tokens = [];
        for (const tokenAccount of tokenAccounts.value) {
            const parsedInfo = tokenAccount.account.data.parsed.info;
            const tokenMint = new PublicKey(parsedInfo.mint);
            
            try {
                const mintInfo = await getMint(connection, tokenMint);
                const decimals = mintInfo.decimals;
                const balance = parsedInfo.tokenAmount.uiAmount;
                
                tokens.push({
                    mint: parsedInfo.mint,
                    balance: balance,
                    decimals: decimals,
                    tokenAccount: tokenAccount.pubkey.toString()
                });
                
                // Add delay between each token processing
                await delay(500);
                
            } catch (error) {
                console.error(`Error fetching mint info for ${parsedInfo.mint}:`, error);
                continue;
            }
        }

        res.json({
            success: true,
            tokens: tokens
        });

    } catch (error) {
        console.error('Error fetching tokens:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch token information',
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