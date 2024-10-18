const express = require("express");
const router = express.Router();
const Task = require("../schema/task.schema");
const authMiddleware = require("../middlewares/auth");

router.post("/addTask", authMiddleware, async (req, res) => {
    try {
        const { title, priority, assignTo, checkList, dueDate } = req.body;
        const checkListArray = checkList.split(",").map((item) => item.trim());
        const {user} = req;
        const task = new Task({ title, priority, assignTo, checkList: checkListArray, dueDate, creator: user });
        await task.save();
        res.status(201).json({message: "Task added successfully."});
    } catch (err) {
        res.status(500).json({message: "Internal server error. Task could not be created.", err});
    }
});

router.get("/getTasks", authMiddleware, async (req, res) => {
    try {
        const tasks = await Task.find();
        res.status(200).json({tasks});
    } catch (err) {
        res.status(500).json({message: "Internal server error. Task could not be fetched.", err});
    }
});

router.patch("/editTask/:_id", authMiddleware, async (req, res) => {
    try {
        const id = req.params._id;
        const { title, priority, assignTo, checkList, dueDate } = req.body;
        const checkListArray = checkList.split(",").map((item) => item.trim());
        const task = await Task.findByIdAndUpdate(id, { title, priority, assignTo, checkList: checkListArray, dueDate });
        res.status(200).json({message: "Task updated successfully."});
    } catch (err) {
        res.status(500).json({message: "Internal server error. Task could not be updated."});
    }
})

module.exports = router;