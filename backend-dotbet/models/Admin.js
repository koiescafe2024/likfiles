const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    agentid: {
        type: String,
    },
    userid: {
        type: String,
        unique: true,
    },
    pwd: {
        type: String,
    },
    platform: {
        type: String,
    },
    role: {
        type: String, // e.g., Ad Manager, Game Manager
    },
    date: {
        type: Date,
        default: Date.now,
    },
    currentSessionToken: String,
    sessionStartTime: Date,
    twoFactorSecret: String,
    twoFactorEnabled: Boolean,
    permissions: [
        {
            url: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "urls",
            },
            access: {
                type: Boolean,
                default: false,
            },
        },
    ],
});

module.exports = mongoose.model("admins", adminSchema);
