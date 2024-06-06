const jwt = require('jsonwebtoken')
function authenticateToken(req, res, next) {
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader) return res.sendStatus(401);

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded;  // Attach the decoded token to req.user
        next();  // Call the next middleware or route handler
    } catch (err) {
        return res.sendStatus(403);  // Invalid token
    }
}
module.exports = {
    authenticateToken
}