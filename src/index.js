const express = require('express');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const { checkAuth } = require('./middlewares/auth-request-middleware'); // <--- Import Middleware
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(morgan("combined"));
app.use(cors());

const limiter = rateLimit({
	windowMs: 2 * 60 * 1000,
	max: 100,
    message: 'Too many requests, please try again later'
});
app.use(limiter);

// === ROUTE CONFIGURATION ===

// 1. AUTH SERVICE (Public)
// Hit this to get Token
app.use('/api/v1/user', createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL, // Auth Service
    changeOrigin: true,
    pathRewrite: (path) => '/api/v1/user' + path 
}));

// 2. FLIGHT SERVICE (Mixed Security)
// GET /flights -> Public (Search)
// POST /flights -> Protected (Create)
app.use('/api/v1/flights', (req, res, next) => {
    if(req.method === 'GET') {
        return next(); // Skip auth checkup since its public
    }
    return checkAuth(req, res, next); // Require auth for creating/updating
}, createProxyMiddleware({ 
    target: process.env.FLIGHT_SERVICE_URL, 
    changeOrigin: true, 
    pathRewrite: (path) => '/api/v1/flights' + path
}));

// 3. BOOKING SERVICE (Fully Protected): You must be logged in to book or cancel
app.use('/api/v1/bookings', checkAuth, createProxyMiddleware({ 
    target: process.env.BOOKING_SERVICE_URL, 
    changeOrigin: true, 
    pathRewrite: (path) => '/api/v1/bookings' + path
}));

//Ping check
app.get('/info', (req, res) => {
    return res.json({ message: 'API Gateway is Live' });
});

app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
});