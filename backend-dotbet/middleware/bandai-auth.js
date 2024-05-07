// const jwt = require("jsonwebtoken");

// module.exports = function (req, res, next) {
//     // Get token from header
//     const token = req.header("x-auth-token");

//     // Check if not token
//     if (!token) {
//         return res.status(401).json({ msg: "No token, authorization denied" });
//     }

//     // Verify token
//     try {
//         jwt.verify(token, process.env.BUNDAI_JWT_SECRET, (error, decoded) => {
//             if (error) {
//                 return res.status(401).json({ msg: "Token is not valid" });
//             } else {
//                 req.user = decoded.user;
//                 next();
//             }
//         });
//     } catch (err) {
//         console.error("something wrong with bundai auth middleware");
//         res.status(500).json({ msg: "Server Error" });
//     }
// };

const jwt = require("jsonwebtoken");
// const User = require('../models/User'); // Ensure you have the correct path to your User model
const Agent = require("../models/Agent");
const Admin = require("../models/Admin");
module.exports = async function (req, res, next) {
    // Get token from header
    const token = req.header("x-auth-token");

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: "No token, authorization denied" });
    }

    // Verify token
    try {
        jwt.verify(
            token,
            process.env.BUNDAI_JWT_SECRET,
            async (error, decoded) => {
                if (error) {
                    console.log("Token is not valid");
                    return res.status(401).json({ msg: "Token is not valid" });
                } else {
                    // Find user by decoded user ID
                    const admin = await Admin.findOne({
                        userid: decoded.user.userid,
                    });

                    console.log("admin----", admin);
                    console.log("decoded==========", decoded);

                    // Check if user exists and token matches the current session token
                    if (!admin || token !== admin.currentSessionToken) {
                        return res.status(401).json({
                            msg: "Your session is not valid. Please log in again.",
                        });
                    }

                    // Check if the session has expired
                    const hoursElapsed =
                        (new Date() - admin.sessionStartTime) / 36e5; // Convert ms to hours
                    if (hoursElapsed >= 8) {
                        console.log("token expired");
                        return res.status(401).json({
                            msg: "Session expired. Please log in again.",
                        });
                    }

                    req.user = decoded.user;
                    next();
                }
            }
        );
    } catch (err) {
        console.error("something wrong with auth middleware");
        res.status(500).json({ msg: "Server Error" });
    }
};
