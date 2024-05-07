const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
    url: {
        type: String,
    },
    description: {
        type: String,
    },
});

module.exports = mongoose.model("urls", urlSchema);
