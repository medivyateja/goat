const express = require('express');
const session = require('express-session');
const path = require('path');
const sessionRoutes = require('./routes/sessionRoutes');
const walletRoutes = require('./routes/walletRoutes');
const voteRoutes = require('./routes/voteRoutes');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Middleware to check session on every request
app.use((req, res, next) => {
    // Initialize visit count if it doesn't exist
    if (!req.session.visitCount) {
        req.session.visitCount = 0;
    }
    req.session.visitCount++;
    
    // Initialize lastVisit timestamp
    req.session.lastVisit = Date.now();
    
    next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', sessionRoutes);
app.use('/wallet', walletRoutes);
app.use('/vote', voteRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        message: 'Something broke!',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', {
        message: 'Page not found',
        error: { status: 404 }
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});