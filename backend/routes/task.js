const express = require("express");
const router = express.Router();
const Task = require("../schema/task.schema");
const User = require("../schema/user.schema");
const authMiddleware = require("../middlewares/auth");

router.post("/", authMiddleware, async (req, res) => {
    const user = await User.findById(req.user);
    if(!user){
        return res.status(401).json({message: "User not logged in."});
    }
    try {
        const { title, priority, assignTo, checkList, dueDate } = req.body;
        const checkListArray = checkList.split(",").map((item) => item.trim());
        const assignToArray = assignTo ? assignTo.split(",").map((item) => item.trim()) : [];
        for (assignee in assignToArray) {
            assigneeExists = await User.findOne({email: assignee});
            if (!assigneeExists) {
                return res.status(400).json({message: `Assigned user ${assignee} is not registered.`});
            }
        }
        const task = new Task({ title, priority, assignTo: assignToArray, checkList: checkListArray, dueDate, creator: user._id });
        user.tasks.push(task._id);
        await user.save();
        await task.save();
        res.status(201).json({message: "Task added successfully."});
    } catch (err) {
        res.status(500).json({message: "Internal server error. Task could not be created."});
    }
});

router.get("/", authMiddleware, async (req, res) => {
    const user = await User.findById(req.user);
    if(!user){
        return res.status(401).json({message: "User not logged in."});
    }
    try {
        const tasks = await Task.find({creator: user._id}).select("-__v -checkList._id");
        res.status(200).json({tasks});
    } catch (err) {
        res.status(500).json({message: "Internal server error. Task could not be fetched."});
    }
});

router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user);
        if(!user){
            return res.status(401).json({message: "User not logged in."});
        }
        let task = await Task.findById(req.params.id);
        if((req.user.toString() !== task.creator.toString()) && (req.user.toString() !== task.assignTo.toString())){
            return res.status(401).json({message: "You are not authorized to view this task."});
        }
        res.status(200).json({task});
    } catch (err) {
        res.status(500).json({message: "Task could not be fetched. Try checking your task id."});
    }
});

router.get("/backlog", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user);
        if(!user){
            return res.status(401).json({message: "User not logged in."});
        }
        let tasks = await Task.find({creator: user._id, listType: "Backlog"}).select("-__v -checkList._id");
        res.status(200).json({tasks});
    } catch (err) {
        res.status(500).json({message: "Internal server error. Task could not be fetched."});
    }
});

router.get("/todo", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user);
        if(!user){
            return res.status(401).json({message: "User not logged in."});
        }
        let tasks = await Task.find({creator: user._id, listType: "To do"}).select("-__v -checkList._id");
        res.status(200).json({tasks});
    } catch (err) {
        res.status(500).json({message: "Internal server error. Task could not be fetched."});
    }
});

router.get("/inprogress", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user);
        if(!user){
            return res.status(401).json({message: "User not logged in."});
        }
        let tasks = await Task.find({creator: user._id, listType: "In Progress"}).select("-__v -checkList._id");
        res.status(200).json({tasks});
    } catch (err) {
        res.status(500).json({message: "Internal server error. Task could not be fetched."});
    }
});

router.get("/done", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user);
        if(!user){
            return res.status(401).json({message: "User not logged in."});
        }
        let tasks = await Task.find({creator: user._id, listType: "Done"}).select("-__v -checkList._id");
        res.status(200).json({tasks});
    } catch (err) {
        res.status(500).json({message: "Internal server error. Task could not be fetched."});
    }
});

router.patch("/:id", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user);
        if(!user){
            return res.status(401).json({message: "User not logged in."});
        }
        let task = await Task.findById(req.params.id);
        if((req.user.toString() !== task.creator.toString()) && (req.user.toString() !== task.assignTo.toString())){ 
            return res.status(401).json({message: "You are not authorized to update this task."});
        }
        const { title, priority, assignTo, checkList, dueDate, listType } = req.body;
        const checkListArray = checkList ? checkList.split(",").map((item) => item.trim()) : [];
        task = await Task.findByIdAndUpdate(req.params.id, { title, priority, assignTo, checkList: checkListArray, dueDate, listType }, {new:true});
        res.status(200).json({message: "Task updated successfully.", task});
    } catch (err) {
        res.status(500).json({message: "Task could not be updated. Try checking your task id."});
    }
});

router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user);
        if(!user){
            return res.status(401).json({message: "User not logged in."});
        }
        let task = await Task.findById(req.params.id);
        if(req.user.toString() !== task.creator.toString()){
            return res.status(401).json({message: "You are not authorized to delete this task."});
        }
        task = await Task.findByIdAndDelete(req.params.id);
        await User.findByIdAndUpdate(task.creator, {$pull: {tasks: req.params.id}});
        res.status(200).json({message: "Task deleted successfully."});
    } catch (err) { 
        res.status(500).json({message: "Task could not be deleted. Try checking your task id."});
    }
});

module.exports = router;