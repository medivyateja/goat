const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { PublicKey } = require('@solana/web3.js');
const requestIp = require('request-ip');

// Constants
const USERS_DIR = path.join(__dirname, '../users');
const VOTES_FILE = path.join(__dirname, '../data/votes.json');
const VOTING_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Ensure directories exist
async function ensureDirectoriesExist() {
    try {
        await fs.mkdir(USERS_DIR, { recursive: true });
        await fs.mkdir(path.dirname(VOTES_FILE), { recursive: true });
    } catch (error) {
        console.error('Error creating directories:', error);
    }
}

ensureDirectoriesExist();

// Helper function to read votes data
async function readVotesData() {
    try {
        const data = await fs.readFile(VOTES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { ronaldo: 0, messi: 0, totalVotes: 0 };
    }
}

// Helper function to write votes data
async function writeVotesData(data) {
    await fs.writeFile(VOTES_FILE, JSON.stringify(data, null, 2));
}

// Helper function to get user's voting history
async function getUserVotingHistory(walletAddress) {
    const userFile = path.join(USERS_DIR, `${walletAddress}.json`);
    try {
        const data = await fs.readFile(userFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { 
            lastVoteTime: 0,
            votes: [],
            totalVotes: 0,
            firstVoteTime: 0
        };
    }
}

// Helper function to update user's voting history
async function updateUserVotingHistory(walletAddress, voteData) {
    const userFile = path.join(USERS_DIR, `${walletAddress}.json`);
    const currentData = await getUserVotingHistory(walletAddress);
    
    const updatedData = {
        lastVoteTime: voteData.lastVoteTime,
        votes: voteData.votes,
        totalVotes: (currentData.totalVotes || 0) + 1,
        firstVoteTime: currentData.firstVoteTime || voteData.lastVoteTime
    };
    
    await fs.writeFile(userFile, JSON.stringify(updatedData, null, 2));
}

// Check if user can vote
router.get('/can-vote', async (req, res) => {
    try {
        const { wallet } = req.query;
        
        if (!wallet) {
            return res.status(400).json({
                success: false,
                message: 'Wallet address is required'
            });
        }

        const userHistory = await getUserVotingHistory(wallet);
        const now = Date.now();
        const timeSinceLastVote = now - userHistory.lastVoteTime;
        const canVote = timeSinceLastVote >= VOTING_COOLDOWN;
        const nextVoteTime = userHistory.lastVoteTime + VOTING_COOLDOWN;

        res.json({
            success: true,
            canVote,
            cooldownRemaining: canVote ? 0 : VOTING_COOLDOWN - timeSinceLastVote,
            nextVoteTime: nextVoteTime,
            totalVotes: userHistory.totalVotes || 0,
            lastVoteTime: userHistory.lastVoteTime,
            voteHistory: userHistory.votes
        });
    } catch (error) {
        console.error('Error checking vote eligibility:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check vote eligibility'
        });
    }
});

// Get current voting stats
router.get('/voting-stats', async (req, res) => {
    try {
        const votesData = await readVotesData();
        const totalVotes = votesData.totalVotes || votesData.ronaldo + votesData.messi;
        
        res.json({
            success: true,
            stats: {
                ronaldo: {
                    votes: votesData.ronaldo,
                    percentage: totalVotes > 0 ? (votesData.ronaldo / totalVotes * 100).toFixed(1) : 0
                },
                messi: {
                    votes: votesData.messi,
                    percentage: totalVotes > 0 ? (votesData.messi / totalVotes * 100).toFixed(1) : 0
                },
                totalVotes
            }
        });
    } catch (error) {
        console.error('Error getting voting stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get voting stats'
        });
    }
});

// Cast a vote
router.post('/cast-vote', async (req, res) => {
    try {
        const { 
            wallet, 
            choice, 
            goatBalance,
            timezone = '',
            localTime = ''
        } = req.body;
        
        if (!wallet || !choice || goatBalance === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters'
            });
        }

        // Validate choice
        if (!['ronaldo', 'messi'].includes(choice.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid choice'
            });
        }

        // Check if user has GOAT tokens
        if (goatBalance <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Must hold GOAT tokens to vote'
            });
        }

        // Get user's voting history for this wallet
        const userHistory = await getUserVotingHistory(wallet);
        const timeSinceLastVote = Date.now() - userHistory.lastVoteTime;

        // Check cooldown period for this wallet
        if (timeSinceLastVote < VOTING_COOLDOWN) {
            const remainingTime = VOTING_COOLDOWN - timeSinceLastVote;
            const hours = Math.floor(remainingTime / (1000 * 60 * 60));
            const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
            
            return res.status(400).json({
                success: false,
                message: `Please wait ${hours}h ${minutes}m ${seconds}s before voting again with this wallet`,
                cooldownRemaining: remainingTime,
                nextVoteTime: userHistory.lastVoteTime + VOTING_COOLDOWN
            });
        }

        // Record the vote
        const votesData = await readVotesData();
        votesData[choice.toLowerCase()]++;
        votesData.totalVotes = (votesData.totalVotes || 0) + 1;
        await writeVotesData(votesData);

        const now = Date.now();
        // Update wallet's voting history
        const voteData = {
            lastVoteTime: now,
            votes: [
                ...userHistory.votes,
                {
                    timestamp: now,
                    choice: choice.toLowerCase(),
                    goatBalance,
                    wallet,
                    timezone,
                    localTime,
                    voteNumber: (userHistory.totalVotes || 0) + 1
                }
            ],
            totalVotes: (userHistory.totalVotes || 0) + 1
        };
        
        await updateUserVotingHistory(wallet, voteData);

        res.json({
            success: true,
            message: 'Vote recorded successfully',
            nextVoteTime: now + VOTING_COOLDOWN,
            stats: {
                ronaldo: {
                    votes: votesData.ronaldo,
                    percentage: ((votesData.ronaldo / votesData.totalVotes) * 100).toFixed(1)
                },
                messi: {
                    votes: votesData.messi,
                    percentage: ((votesData.messi / votesData.totalVotes) * 100).toFixed(1)
                }
            }
        });
    } catch (error) {
        console.error('Error casting vote:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cast vote',
            error: error.message
        });
    }
});

// Get user's voting history
router.get('/user-history/:wallet', async (req, res) => {
    try {
        const { wallet } = req.params;
        
        if (!wallet) {
            return res.status(400).json({
                success: false,
                message: 'Wallet address is required'
            });
        }

        const userHistory = await getUserVotingHistory(wallet);
        
        res.json({
            success: true,
            history: {
                totalVotes: userHistory.totalVotes || 0,
                firstVoteTime: userHistory.firstVoteTime,
                lastVoteTime: userHistory.lastVoteTime,
                votes: userHistory.votes
            }
        });
    } catch (error) {
        console.error('Error getting user history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user voting history'
        });
    }
});

// Get all votes
router.get('/all-votes', async (req, res) => {
    try {
        const usersDir = path.join(__dirname, '../users');
        const files = await fs.readdir(usersDir);
        let allVotes = [];
        
        for (const file of files) {
            const userData = await fs.readFile(path.join(usersDir, file), 'utf8');
            const user = JSON.parse(userData);
            allVotes = allVotes.concat(user.votes || []);
        }
        
        // Sort by timestamp descending (most recent first)
        allVotes.sort((a, b) => b.timestamp - a.timestamp);
        
        res.json(allVotes);
    } catch (error) {
        console.error('Error getting all votes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get votes'
        });
    }
});

module.exports = router;