const express = require("express");
const mongoose = require("mongoose");
const {
    getNewEnteringCustomers,
    getWinLoseByPlayerPhone,
} = require("../../module/player");
const Transaction = require("../../models/Transaction");
const router = express.Router();
const auth = require("../../middleware/bandai-auth");
const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const Admin = require("../../models/Admin");
const Urls = require("../../models/Urls");

router.post("/new-player", auth, async (req, res) => {
    const { startDate, endDate } = req.body;
    const agent = req.user.platform;

    const newCustomers = await getNewEnteringCustomers(
        agent,
        startDate,
        endDate
    );
    // '_id', 'phone', 'balance', 'agent', 'date'
    res.json({ status: true, result: newCustomers });
});

router.post("/player-stats", auth, async (req, res) => {
    const { startDate, endDate } = req.body;
    const agent = req.user.platform;
    console.log("player-stats", agent);
    // startDate = '2023-01-01';
    // endDate = '2024-12-31';

    try {
        const playerStats = await Transaction.aggregate([
            {
                $match: {
                    date: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate),
                    },
                    // Add other filtering conditions here if necessary
                },
            },
            {
                $group: {
                    _id: "$userid",
                    totalDepositAmount: {
                        $sum: {
                            $cond: [
                                { $eq: ["$type", "deposit"] },
                                "$payAmount",
                                0,
                            ],
                        },
                    },
                    totalWithdrawalAmount: {
                        $sum: {
                            $cond: [
                                { $eq: ["$type", "withdraw"] },
                                "$payAmount",
                                0,
                            ],
                        },
                    },
                    totalDepositTimes: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "deposit"] }, 1, 0],
                        },
                    },
                    totalWithdrawalTimes: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "withdraw"] }, 1, 0],
                        },
                    },
                    totalDepositTrxIDs: {
                        $push: {
                            $cond: [
                                { $eq: ["$type", "deposit"] },
                                "$trxNo",
                                "$noval",
                            ],
                        },
                    },
                    totalWithdrawalTrxIDs: {
                        $push: {
                            $cond: [
                                { $eq: ["$type", "withdraw"] },
                                "$trxNo",
                                "$noval",
                            ],
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails",
                },
            },
            {
                $unwind: {
                    path: "$userDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 0,
                    userId: "$_id",
                    userName: "$userDetails.name", // Adjust based on your user schema
                    agent: "$userDetails.platform",
                    date: "$userDetails.date",
                    origin: "$userDetails.origin",
                    totalDepositAmount: 1,
                    totalWithdrawalAmount: 1,
                    totalDepositTimes: 1,
                    totalWithdrawalTimes: 1,
                    totalDepositTrxIDs: {
                        $filter: {
                            input: "$totalDepositTrxIDs",
                            as: "item",
                            cond: { $ne: ["$$item", "$noval"] },
                        },
                    },
                    totalWithdrawalTrxIDs: {
                        $filter: {
                            input: "$totalWithdrawalTrxIDs",
                            as: "item",
                            cond: { $ne: ["$$item", "$noval"] },
                        },
                    },
                },
            },
            {
                $match: {
                    agent: agent,
                    // Add other filtering conditions here if necessary
                },
            },
        ]);

        for (let playerStat of playerStats) {
            // Fetch deposit transaction details
            playerStat.totalDepositTransactions = await Transaction.find({
                trxNo: {
                    $in: playerStat.totalDepositTrxIDs.filter(
                        (trxNo) => trxNo !== "$noval"
                    ),
                },
            });

            // Fetch withdrawal transaction details
            playerStat.totalWithdrawalTransactions = await Transaction.find({
                trxNo: {
                    $in: playerStat.totalWithdrawalTrxIDs.filter(
                        (trxNo) => trxNo !== "$noval"
                    ),
                },
            });
        }

        console.log(JSON.stringify(playerStats, null, 2));

        await Promise.all(
            playerStats.map(async (playerStat, index) => {
                // playerStat.winlose = await getWinLoseByPlayerPhone(agent, startDate, endDate, playerStat.userName);
                playerStat.winlose = await getWinLoseByPlayerPhone(
                    agent,
                    startDate,
                    endDate,
                    playerStat.userName
                );

                // playerStat.totalDepositTrxIDs = ["qweqweqwe"];
                // playerStat.totalWithdrawalTrxIDs = ["234234234234"];

                console.log(playerStat.winlose);
            })
        );

        res.json({ status: true, result: playerStats });
    } catch (error) {
        console.error("Failed to fetch player stats:", error);
        res.status(400).json({ status: false });
        throw error;
    }
});

router.post("/members", auth, async (req, res) => {
    const agent = req.user.platform;
    const members = await User.find({ platform: agent });

    res.json({ status: true, result: members });
});

router.post("/admins", auth, async (req, res) => {
    try {
        // Fetch all URLs first
        const urls = await Urls.find();
        const urlMap = urls.reduce((acc, url) => {
            acc[url._id.toString()] = url;
            return acc;
        }, {});

        // Fetch all admins and ensure their permissions are up to date
        let admins = await Admin.find();

        // Sync permissions for each admin
        admins = await Promise.all(
            admins.map(async (admin) => {
                let permissionsUpdated = false;
                const permissions = admin.permissions.reduce((acc, perm) => {
                    acc[perm.url.toString()] = perm;
                    return acc;
                }, {});

                // Check and add missing URLs
                urls.forEach((url) => {
                    if (!permissions[url._id.toString()]) {
                        permissions[url._id.toString()] = {
                            url: url._id,
                            access: false,
                        };
                        permissionsUpdated = true;
                    }
                });

                if (permissionsUpdated) {
                    admin.permissions = Object.values(permissions);
                    await admin.save();
                }

                return admin;
            })
        );

        // Populate URL details after ensuring all are included
        await Admin.populate(admins, { path: "permissions.url" });

        res.json({ status: true, result: admins });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Fetch a specific admin's permissions
router.get("/admin", auth, async (req, res) => {
    const adminId = req.query.admin_id;

    try {
        const admin = await Admin.findById(adminId, "permissions").populate(
            "permissions.url"
        );
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        res.json({ status: true, result: admin });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
router.post("/admin", auth, async (req, res) => {
    const { agentid, platform, role, userid, password } = req.body;

    try {
        // Check if the user already exists
        const existingAdmin = await Admin.findOne({ userid: userid });
        if (existingAdmin) {
            return res.status(409).json({status: false, message: "Admin with the given user ID already exists." });
        }

        // Create new admin
        const newAdmin = new Admin({
            agentid,
            platform,
            role,
            twoFactorEnabled: false,
            userid,
            pwd: password,  // Assuming you are handling password encryption elsewhere in your code
        });

        await newAdmin.save();  // Save the admin to the database
        res.json({ status: true, result: newAdmin });
    } catch (err) {
        console.error(err); // Log the error to the console for debugging
        res.status(500).json({status: false, message: "Failed to create admin: " + err.message });
    }
});

// Update an admin's permissions
router.post("/admin/permission", auth, async (req, res) => {
    const { access, permId, admin_id } = req.body; // Expecting an array of { url: ObjectId, access: Boolean }

    console.log("---------------", req.body);

    try {
        const permObjectId = new mongoose.Types.ObjectId(permId);
        const permissionPath = `permissions.$.access`;

        // Find the admin and update the specific permission
        const result = await Admin.updateOne(
            { _id: admin_id, "permissions._id": permObjectId }, // Match the admin and specific permission ID
            { $set: { [permissionPath]: access } } // Set the new access value
        );

        if (result.modifiedCount === 0) {
            console.log(
                "No document was modified. Check if the admin ID and permission ID are correct."
            );
            res.status(404).json({ message: "Not found" });
        }

        res.json({ status: true, result });
        console.log("Permission updated successfully.");
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post("/change-password", auth, async (req, res) => {
    try {
        const agent = req.user.platform; // Get the platform of the authenticated user (assuming it's the agent)
        const { selectedPlayerId, newPassword } = req.body; // Extract selectedPlayerId and newPassword from request body
        // Update the password for the selected player

        const salt = await bcrypt.genSalt(10);
        const updatedPassword = await bcrypt.hash(newPassword, salt);

        console.log({ updatedPassword, newPassword });

        const player = await User.findByIdAndUpdate(
            selectedPlayerId,
            {
                rpwd: newPassword,
                password: updatedPassword,
            },
            { new: true }
        );

        if (!player) {
            res.json({ status: false });
        }

        res.json({ status: true });
    } catch (error) {
        console.error("Error changing password:", error);
        res.json({ status: false });
    }
});

router.post("/update-access", auth, async (req, res) => {
    try {
        const { userId, access } = req.body; // Extract selectedPlayerId and newPassword from request body

        console.log({ userId, access });

        const player = await User.findByIdAndUpdate(
            new mongoose.Types.ObjectId(userId),
            {
                access,
            },
            { new: true }
        );

        if (!player) {
            res.json({ status: false });
        }

        res.json({ status: true });
    } catch (error) {
        console.error("Error changing password:", error);
        res.json({ status: false });
    }
});

router.put("/", auth, async (req, res) => {
    console.log("update player___", req.body);
    const updatedPlayerData = req.body;

    try {
        const user = await User.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(req.body._id) }, // Convert to ObjectId
            updatedPlayerData,
            {
                new: true,
            }
        );

        if (user) {
            res.json({ status: true, user });
        } else {
            res.status(404).json({
                status: false,
                message: "Player Not Found!",
            });
        }
    } catch (err) {
        console.error(err);
        res.status(400).json({ status: false, message: err.message });
    }
});

module.exports = router;
