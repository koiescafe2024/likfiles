const express = require("express");
const Agent = require("../../models/Agent");
const router = express.Router();
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const Admin = require("../../models/Admin");
const bundaiAuth = require("../../middleware/bandai-auth");

router.get("/test", async (req, res) => {
    res.json("success");
});

// Function to generate TOTP secret and QR code
const setup2FA = (userId) => {
    const secret = speakeasy.generateSecret({ length: 20 });
    return Admin.findOne({ userid: userId }).then((admin) => {
        admin.twoFactorEnabled = true;
        admin.twoFactorSecret = secret.base32;
        admin.save();

        return QRCode.toDataURL(secret.otpauth_url).then((qrCodeDataUrl) => {
            return {
                qrCodeDataUrl: qrCodeDataUrl,
                secret: secret.base32, // Send this only if necessary for client-side validation (usually not recommended)
            };
        });
    });
};

const verify2FA = (userid, token) => {
    return Admin.findOne({ userid: userid }).then((admin) => {
        console.log(admin);
        const verified = speakeasy.totp.verify({
            secret: admin.twoFactorSecret,
            encoding: "base32",
            token: token,
        });

        return verified;
    });
};

router.post("/setup2fa", bundaiAuth, async (req, res) => {
    const setup2faRes = await setup2FA(req.user.agentid);
    console.log(setup2faRes);

    res.status(200).json({
        status: true,
        result: setup2faRes,
    });
});

router.post("/verify-2fa", async (req, res) => {
    const { userid, token } = req.body;

    console.log("bodyddddddd-------------", req.body);
    verify2FA(userid, token).then(async (verified) => {
        if (verified) {
            // Proceed to create session or token
            let payload = {};
            const admin = await Admin.findOne({ userid: userid });
            if (admin) {
                payload = {
                    user: {
                        id: admin.userid,
                        userid: admin.userid,
                        agentid: admin.agentid,
                        platform: admin.platform,
                    },
                };
            }

            const token = jwt.sign(payload, process.env.BUNDAI_JWT_SECRET, {
                expiresIn: "8h",
            });

            const role = "admin";

            admin.currentSessionToken = token;
            admin.sessionStartTime = new Date();
            await admin.save();

            const result = {
                token: token,
                id: admin.userid,
                agentid: admin.agentid,
                platform: admin.platform,
                userid: admin.userid,
                role,
            };

            res.status(200).json({
                status: true,
                result,
                message: "2FA verification successful, logged in",
            });
        } else {
            res.status(404).json({
                status: false,
                message: "Invalid 2FA token",
            });
        }
    });
});

router.post("/signin", async (req, res) => {
    const { userid, password } = req.body;

    console.log("signin----------", req.body);

    const admin = await Admin.findOne({
        userid: userid,
        pwd: password,
    });

    if (admin) {
        if (admin.twoFactorEnabled) {
            res.json({
                status: true,
                result: { twoFactorEnabled: admin.twoFactorEnabled },
            });
        } else {
            let payload = {};
            if (admin) {
                payload = {
                    user: {
                        id: admin.userid,
                        userid: admin.userid,
                        agentid: admin.agentid,
                        platform: admin.platform,
                    },
                };
            }

            const token = jwt.sign(payload, process.env.BUNDAI_JWT_SECRET, {
                expiresIn: "8h",
            });

            admin.currentSessionToken = token;
            admin.sessionStartTime = new Date();
            await admin.save();

            const result = {
                token: token,
                id: admin.userid,
                agentid: admin.agentid,
                platform: admin.platform,
                userid: userid,
                role: admin.role,
            };

            res.json({ status: true, result });
        }
    } else
        res.status(404).json({
            status: false,
            message: "Authentication Failed.",
        });
});

router.post("/signout", async (req, res) => {
    res.json({ status: true, result: { token: "123123123" } });
});

module.exports = router;
