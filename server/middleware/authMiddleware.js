const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {

  try {

    // Get Authorization header
    const authHeader = req.headers.authorization;


    // Check whether token exists
    if (!authHeader) {

      return res.status(401).json({
        message: "Access denied. No token provided."
      });

    }


    // Expected format:
    // Authorization: Bearer TOKEN
    const token = authHeader.split(" ")[1];


    // Check whether token exists
    if (!token) {

      return res.status(401).json({
        message: "Access denied. Invalid token format."
      });

    }


    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );


    // Store decoded user information
    // inside the request
    req.user = decoded;


    // Continue to the next middleware/route
    next();

  } catch (error) {

    return res.status(401).json({
      message: "Invalid or expired token"
    });

  }

};


module.exports = authMiddleware;