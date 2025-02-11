const express = require('express');
const router = express.Router();

// Main page route
// Main page route in sessionRoutes.js
router.get('/', (req, res) => {
    res.render('index', {
        visitCount: req.session.visitCount,
        lastVisit: req.session.lastVisit,
        title: "Who's the GOAT?",
        contractAddress: process.env.GOAT_TOKEN_MINT_ADDRESS || 'Contract address not available',
        sessionID: req.sessionID,
        VOTING_COOLDOWN: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    });
});

router.get('/monitor', (req, res) => {
    res.render('monitor', {
        visitCount: req.session.visitCount,
        lastVisit: req.session.lastVisit,
    });
});
router.get('/monitor-app', (req, res) => {
    res.render('monitor-app', {
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


module.exports = router;