const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const User = require("./user.schema");

const taskSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        required: true,
        enum: ["High Priority", "Medium Priority", "Low Priority"]
    },
    assignTo: {
        type: String,
    },
    checkList: {
        type: [Array],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date
    },
    creator: {
        type: Schema.ObjectId,
        ref: "User",
        required: true
    }
});

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;