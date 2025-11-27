const axios = require('axios');

const checkAuth = async (req, res, next) => {
    try {
        // 1. Check if token exists
        const token = req.headers['x-access-token'];
        
        if(!token) {
            return res.status(401).json({
                message: 'No token provided. Access denied.'
            });
        }

        // 2. Call Auth Service to validate
        // We assume Auth Service runs on localhost:3001
        // In production, use process.env.AUTH_SERVICE_URL
        const response = await axios.get('http://localhost:3001/api/v1/user/isAuthenticated', {
            headers: {
                'x-access-token': token
            }
        });

        // 3. If successful, attach user info to the request header
        // This passes the User ID to the downstream services (Flight/Booking)
        if(response.data.success) {
            req.headers['x-user-id'] = response.data.data; // 'data' is the userId from auth service
            next();
        } else {
            return res.status(401).json({
                message: 'Invalid token.'
            });
        }

    } catch (error) {
        return res.status(401).json({
            message: 'Unauthorized. Token validation failed.',
            error: error.response ? error.response.data : error.message
        });
    }
}

module.exports = {
    checkAuth
}