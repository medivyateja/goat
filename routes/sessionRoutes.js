const express = require('express');
const router = express.Router();

// Main page route
router.get('/', (req, res) => {
    res.render('index', {
        visitCount: req.session.visitCount,
        lastVisit: req.session.lastVisit,
        title: "Who's the GOAT?",
        contractAddress: process.env.GOAT_TOKEN_MINT_ADDRESS || 'Contract address not available'
    });
});

router.get('/monitor', (req, res) => {
    res.render('monitor', {
        visitCount: req.session.visitCount,
        lastVisit: req.session.lastVisit,
        contractAddress: process.env.GOAT_TOKEN_MINT_ADDRESS
    });
});

router.get('/download-app', (req, res) => {
    res.render('download-app', {
        visitCount: req.session.visitCount,
        lastVisit: req.session.lastVisit,
        contractAddress: process.env.GOAT_TOKEN_MINT_ADDRESS
    });
});

// Get session info
router.get('/session-info', (req, res) => {
    res.json({
        visitCount: req.session.visitCount,
        lastVisit: new Date(req.session.lastVisit).toLocaleString(),
        sessionID: req.sessionID
    });
});

// Get voting stats
router.get('/voting-stats', (req, res) => {
    res.json({
        success: true,
        stats: {
            ronaldo: 45,
            messi: 55
        }
    });
});

module.exports = router;