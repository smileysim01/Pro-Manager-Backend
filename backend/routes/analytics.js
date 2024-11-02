const express = require("express");
const router = express.Router();
const User = require("../schema/user.schema");
const authMiddleware = require("../middlewares/auth");
const Task = require("../schema/task.schema");

router.get("/", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user)
        if(!user){
            return res.status(401).json({message: "User not logged in."});
        }
        const tasks = await Task.find({$or: [{creator: user._id}, {assignTo: user._id}]}).select("listType priority dueDate")

        const analytics = {
            "Backlog Tasks": tasks.filter(task => task.listType === "Backlog").length,
            "To-Do Tasks": tasks.filter(task => task.listType === "To do").length,
            "In-Progress Tasks": tasks.filter(task => task.listType === "In Progress").length,
            "Completed Tasks": tasks.filter(task => task.listType === "DONE").length,
            "Low Priority": tasks.filter(task => task.priority === "LOW PRIORITY").length,
            "Moderate Priority": tasks.filter(task => task.priority === "MODERATE PRIORITY").length,
            "High Priority": tasks.filter(task => task.priority === "HIGH PRIORITY").length,
            "Due Date Tasks": tasks.filter(task => task.dueDate).length,
        }
        return res.status(200).json({analytics});
    } catch (err) {
        res.status(500).json({message: "Internal server error. Analytics could not be fetched."});
    }
});

module.exports = router;