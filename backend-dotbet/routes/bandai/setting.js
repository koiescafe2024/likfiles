const express = require("express");
const bandaiAuth = require("../../middleware/bandai-auth");
const Admin = require("../../models/Admin");
const router = express.Router();

router.get("/menu", bandaiAuth, async (req, res) => {
    console.log("SETTING MENU-------", req.user.userid);

    const admin = await Admin.findOne({ userid: req.user.userid }).populate(
        "permissions.url"
    );

    // Build a map of paths to access permissions
    const pathAccessMap = admin.permissions.reduce((acc, perm) => {
        if (perm.url) {
            // Ensure there's a URL object linked
            acc[perm.url.url] = perm.access;
        }
        return acc;
    }, {});

    // Function to recursively set access
    const setAccess = (menuItems) => {
        menuItems.forEach((item) => {
            if (!item.children) item.access = !!pathAccessMap[item.path]; // Assign access based on the path
            if (item.children) {
                setAccess(item.children); // Recursively assign access to children
            }
        });
    };

    const mockMenuList = [
        {
            code: "dashboard",
            label: {
                zh_CN: "首页",
                en_US: "Dashboard",
                th_TH: "แดชบอร์ด",
            },
            icon: "dashboard",
            path: "/dashboard",
        },
        {
            code: "newplayerstatistics",
            label: {
                zh_CN: "新玩家统计",
                en_US: "New Player Statistics",
                th_TH: "สถิติผู้เล่นใหม่",
            },
            icon: "transaction",
            path: "/new-player-statistics",
        },
        {
            code: "playerstats",
            label: {
                zh_CN: "球员统计数据",
                en_US: "Player Stats",
                th_TH: "สถิติผู้เล่น",
            },
            icon: "transaction",
            path: "/player-stats",
        },
        {
            code: "subagentmanagement",
            label: {
                zh_CN: "权限",
                en_US: "Sub Agents",
                th_TH: "ตัวแทนย่อย",
            },
            icon: "permission",
            path: "/sub-agent",
            children: [
                {
                    code: "subAgentManage",
                    label: {
                        zh_CN: "路由权限",
                        en_US: "Manage",
                        th_TH: "จัดการ",
                    },
                    path: "/sub-agent/manage",
                },
                // Additional children can be similarly translated
            ],
        },
        {
            code: "report",
            label: {
                zh_CN: "权限",
                en_US: "Report",
                th_TH: "รายงาน",
            },
            icon: "permission",
            path: "/report",
            children: [
                {
                    code: "win-loss-reports",
                    label: {
                        zh_CN: "赢/输报告",
                        en_US: "Win/Loss Reports",
                        th_TH: "รายงานผลชนะ/แพ้",
                    },
                    path: "/report/win-loss",
                },
            ],
        },
        {
            code: "history",
            label: {
                zh_CN: "历史",
                en_US: "History",
                th_TH: "ประวัติ",
            },
            icon: "permission",
            path: "/history",
            children: [
                {
                    code: "history-bets",
                    label: {
                        zh_CN: "投注历史",
                        en_US: "Bets History",
                        th_TH: "ประวัติการเดิมพัน",
                    },
                    path: "/history/bets",
                },
            ],
        },
        {
            code: "member",
            label: {
                zh_CN: "成员",
                en_US: "Member",
                th_TH: "สมาชิก",
            },
            icon: "permission",
            path: "/member",
            children: [
                {
                    code: "member-management",
                    label: {
                        zh_CN: "会员管理",
                        en_US: "Member Management",
                        th_TH: "การจัดการสมาชิก",
                    },
                    path: "/member/management",
                },
                {
                    code: "employee",
                    label: {
                        zh_CN: "员工",
                        en_US: "Employee",
                        th_TH: "พนักงาน",
                    },
                    path: "/member/employee",
                },
            ],
        },
        {
            code: "setting",
            label: {
                zh_CN: "环境",
                en_US: "Setting",
                th_TH: "การตั้งค่า",
            },
            icon: "transaction",
            path: "/setting",
        },
    ];

    console.log(admin.permissions);

    admin.permissions[0].url.url;

    // /new-player-statistics

    admin.permissions[0].access;

    // admin
    /**
    "agentid": "luckygaoagent",
    "userid": "koiescafe",
    "pwd": "koiescafe",
    "platform": "luckygaoagent",
    "role": "Luckygao Manager",
    "twoFactorEnabled": false,
    "twoFactorSecret": null,
    "currentSessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoia29pZXNjYWZlIiwidXNlcm5hbWUiOiJrb2llc2NhZmUiLCJhZ2VudGlkIjoibHVja3lnYW9hZ2VudCIsInBsYXRmb3JtIjoibHVja3lnYW9hZ2VudCJ9LCJpYXQiOjE3MTQ3MjgwMTMsImV4cCI6MTcxNDc1NjgxM30.uCnyp836FXfD7rT9vv0OJAnrCkN-aVbsedyWhnhKnvc",
    "date": ISODate("2024-04-25T00:18:03.084Z"),
    "sessionStartTime": ISODate("2024-05-03T09:20:13.144Z"),
    "__v": NumberInt("2"),
    "permissions": [
        {
            "url": ObjectId("662fa6fbb25300004e007242"),
            "access": true,
            "_id": ObjectId("66320fb4d3b2400a474df7bd")
        },
        {
            "url": ObjectId("662fa71db25300004e007243"),
            "access": true,
            "_id": ObjectId("6632102b1ba3cb3d019a32e1")
        },
        {
            "url": ObjectId("662fa73ab25300004e007244"),
            "access": true,
            "_id": ObjectId("6632102b1ba3cb3d019a32e2")
        }
    ]
     */
    // admin

    // Apply the access settings recursively to all menu items
    setAccess(mockMenuList);

    console.log(admin.permissions); // For debugging purposes

    console.log("aaaaaaaaaaaaaaaaa", mockMenuList);

    // Function to recursively set and filter access
    function filterMenuItems(menuItems) {
        return menuItems.reduce((acc, item) => {
            if (item.children) {
                item.children = filterMenuItems(item.children); // Recursively filter children
            }
            // Check if item or any of its children have access
            if (
                pathAccessMap[item.path] ||
                (item.children && item.children.length > 0)
            ) {
                item.access = !!pathAccessMap[item.path]; // Assign access based on the path
                acc.push(item);
            }
            return acc;
        }, []);
    }

    const filteredMenuList = filterMenuItems(mockMenuList);

    res.json({ status: true, result: filteredMenuList });
});

module.exports = router;
