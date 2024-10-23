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
        type: [String]
        //type: [Schema.Types.ObjectId],
        //ref: "User"
    },
    checkList: {
        type: [String],
        // type: [{task: {type: String, required: true}, done: {type: Boolean, default: false}}],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date
    },
    listType: {
        type: String,
        required: true,
        enum: ["Backlog","To do", "In Progress", "Done"],
        default: "To do"
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
});

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;