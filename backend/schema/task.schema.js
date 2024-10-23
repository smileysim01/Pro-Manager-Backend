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
        // type: [{subTask: {type: String, required: true}, done: {type: Boolean, default: false}}],
        // validate: [checkListLimit, 'Checklist cannot have more than 3 items.']
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
    },
    isPublic: {
        type: Boolean,
        default: false
    }
});

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;