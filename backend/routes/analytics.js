const express = require("express");
const router = express.Router();
const User = require("../schema/user.schema");
const authMiddleware = require("../middlewares/auth");

router.get("/", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user).populate("tasks");
        if(!user){
            return res.status(401).json({message: "User not logged in."});
        }
        const tasks = user.tasks.map(task => ({
            listType: task.listType,
            priority: task.priority,
            dueDate: task.dueDate,
        }));

        const analytics = {
            "Backlog Tasks": tasks.filter(task => task.listType === "Backlog").length,
            "To-Do Tasks": tasks.filter(task => task.listType === "To do").length,
            "In-Progress Tasks": tasks.filter(task => task.listType === "In Progress").length,
            "Completed Tasks": tasks.filter(task => task.listType === "Done").length,
            "Low Priority": tasks.filter(task => task.priority === "Low Priority").length,
            "Medium Priority": tasks.filter(task => task.priority === "Medium Priority").length,
            "High Priority": tasks.filter(task => task.priority === "High Priority").length,
            "Due Date Tasks": tasks.filter(task => task.dueDate).length,
        }
        return res.status(200).json({analytics});
    } catch (err) {
        res.status(500).json({message: "Internal server error. Analytics could not be fetched."});
    }
});

module.exports = router;