const mongoose = require("mongoose");
const Task = require("./task.schema");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    tasks: {
        type: [Schema.ObjectId],
        ref: "Task"
    }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
