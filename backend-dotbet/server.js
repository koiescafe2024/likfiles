const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const https = require("https");
// const http = require('http')
require("dotenv").config();
const fs = require("fs");
var bodyParser = require("body-parser");
const path = require("path");
const Log = require("./models/Log");
// const { initSocket } = require('./socketManager');

const app = express();
// const server = http.createServer(app);

// const io = initSocket(server);

// io.on('connection', (socket) => {
//   console.log('New client connected', socket.id);

//   // Handle socket events
//   socket.on('disconnect', () => {
//     console.log('Client disconnected', socket.id);
//   });
// });

const corsOptions = {
    origin: "*", // Adjust according to your React app's origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true, // Allow cookies
};

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.get("/", express.static(path.join(__dirname, "./public")));
app.use(express.static("public"));

// Save All Logs
app.use(async (req, res, next) => {
    const { method, originalUrl, query, ip } = req;
    console.log(
        `Method: ${method}, URL: ${originalUrl}, Query: ${JSON.stringify(
            query
        )}, IP: ${ip}`
    );

    const log = new Log({ method, originalUrl, query, ip });
    await log.save();

    next();
});

app.use("/api/users", require("./routes/api/users"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/game", require("./routes/api/game"));
app.use("/api/pay", require("./routes/api/pay"));
app.use("/api/agent", require("./routes/api/agent"));
app.use("/api/transaction", require("./routes/api/transaction"));
app.use("/api/util", require("./routes/api/util"));

app.use("/bandai/api/auth", require("./routes/bandai/auth"));
app.use("/bandai/api/agent", require("./routes/bandai/agent"));
app.use("/bandai/api/player", require("./routes/bandai/player"));
app.use("/bandai/api/report", require("./routes/bandai/report"));
app.use("/bandai/api/setting", require("./routes/bandai/setting"));
app.use("/bandai/api/log", require("./routes/bandai/log"));
// Connect to MongoDB
// mongoose.connect('mongodb://127.0.0.1/dotbet')
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => console.error('Failed to connect to MongoDB', err));
mongoose
    .connect(
        `mongodb+srv://smilesun0506:${process.env.MONGODB_PASSWORD}@dotbet.tzyhwct.mongodb.net/dotbet?retryWrites=true&w=majority`
    )
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Failed to connect to MongoDB", err));

// Start the server
const port = process.env.PORT;

// server.listen(port, () => console.log(`Server started on port ${port}`));

if (process.env.ENVIRONMENT == "prod") {
    // prod
    https
        .createServer(
            // Provide the private and public key to the server by reading each
            // file's content with the readFileSync() method.
            {
                key: fs.readFileSync(
                    "/home/ubuntu/dotbet-backend/certs/privkey.pem"
                ),
                cert: fs.readFileSync(
                    "/home/ubuntu/dotbet-backend/certs/cert.pem"
                ),
            },
            app
        )
        .listen(443, () => {
            console.log("serever is runing at port 443");
        });
} else {
    // dev
    app.listen(port, async () => {
        console.log(`Server started on port ${port}`);
    });
}
