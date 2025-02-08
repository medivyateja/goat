const express = require('express');
const router = express.Router();

// Main page route
router.get('/', (req, res) => {
    res.render('index', {
        visitCount: req.session.visitCount,
        lastVisit: req.session.lastVisit,
        title: "Who's the GOAT?"
    });
});

router.get('/monitor', (req, res) => {
    res.render('monitor', {
        visitCount: req.session.visitCount,
        lastVisit: req.session.lastVisit,
    });
});

router.get('/download-app', (req, res) => {
    res.render('download-app', {
        visitCount: req.session.visitCount,
        lastVisit: req.session.lastVisit,
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

// Vote route
router.post('/vote', (req, res) => {
    const { choice } = req.body;
    
    if (!req.session.wallet) {
        return res.status(403).json({
            success: false,
            message: 'Please connect your wallet to vote'
        });
    }

    // Store the vote in session
    req.session.vote = choice;
    
    res.json({
        success: true,
        message: `Successfully voted for ${choice}`
    });
});

// Get voting stats
router.get('/voting-stats', (req, res) => {
    // In a real application, you would fetch this from a database
    res.json({
        success: true,
        stats: {
            ronaldo: 45, // Example percentage
            messi: 55    // Example percentage
        }
    });
});

module.exports = router;