const express = require("express");
const router = express.Router();
const Task = require("../schema/task.schema");
const User = require("../schema/user.schema");
const authMiddleware = require("../middlewares/auth");
const fillAssignedUsers = require("../utils/fillAssigned");
const removeAssignedUsers = require("../utils/removeAssigned");

router.post("/", authMiddleware, async (req, res) => {
    const user = await User.findById(req.user);
    if(!user){
        return res.status(401).json({message: "User not logged in."});
    }
    try {
        const { title, priority, assignTo, checkList, dueDate } = req.body;
        const checkListArray = JSON.parse(checkList);
        const task = new Task({ title, priority, checkList: checkListArray, dueDate, creator: user._id });
        await task.save();
        user.tasks.push(task._id);
        const assignedUsers = (await fillAssignedUsers(assignTo, task._id)).validAssigneesId;
        task.assignTo = assignedUsers;
        await task.save();
        await user.save();
        res.status(201).json({message: "Task added successfully.", task});
    } catch (err) {
        res.status(500).json({message: err.message || "Internal server error. Task could not be created."});
    }
});

router.get("/", authMiddleware, async (req, res) => {
    const user = await User.findById(req.user);
    if(!user){
        return res.status(401).json({message: "User not logged in."});
    }
    try {
        const tasks = await Task.find({$or: [{creator: user._id}, {assignTo: user._id}]}).select("-__v -checkList._id");
        res.status(200).json({tasks});
    } catch (err) {
        res.status(500).json({message: "Internal server error. Task could not be fetched."});
    }
});

router.get("/backlog", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user);
        if(!user){
            return res.status(401).json({message: "User not logged in."});
        }
        let tasks = await Task.find({$or: [{creator: user._id}, {assignTo: user._id}], listType: "Backlog"}).select("-__v -checkList._id");
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
        let tasks = await Task.find({$or: [{creator: user._id}, {assignTo: user._id}], listType: "To do"}).select("-__v -checkList._id");
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
        let tasks = await Task.find({$or: [{creator: user._id}, {assignTo: user._id}], listType: "In Progress"}).select("-__v -checkList._id");
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
        let tasks = await Task.find({$or: [{creator: user._id}, {assignTo: user._id}], listType: "Done"}).select("-__v -checkList._id");
        res.status(200).json({tasks});
    } catch (err) {
        res.status(500).json({message: "Internal server error. Task could not be fetched."});
    }
});

router.get("/share/:id", async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).select("-__v -creator -assignTo");
        if (!task) {
            return res.status(404).json({message: "Task not found."});
        }
        if (task.isPublic) {
            return res.status(200).json({task});
        } else {
            return res.status(401).json({message: "Task is not public."});
        }
    } catch (err) {
        return res.status(500).json({message: "Task could not be fetched. Try checking the link."});
    }
});

router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user);
        if(!user){
            return res.status(401).json({message: "User not logged in."});
        }
        let task = await Task.findById(req.params.id);
        if((user._id.toString() !== task.creator.toString()) && (!task.assignTo.includes(user._id))){
            return res.status(401).json({message: "You are not authorized to view this task."});
        }
        res.status(200).json({task});
    } catch (err) {
        res.status(500).json({message: "Task could not be fetched. Try checking your task id."});
    }
});

router.patch("/:id", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user);
        if(!user){
            return res.status(401).json({message: "User not logged in."});
        }
        const id = req.params.id
        let task = await Task.findById(id);
        if((user._id.toString() !== task.creator.toString()) && (!task.assignTo.includes(user._id))){ 
            return res.status(401).json({message: "You are not authorized to update this task."});
        }
        const { title, priority, assignTo, checkList, dueDate, listType, isPublic} = req.body;
        const updateTask = { title, priority, checkList: checkList ? JSON.parse(checkList) : checkList, dueDate, listType, isPublic };
        if(assignTo){
            // only the creator can update the assignTo field
            if(user.id.toString() === task.creator.toString()){
                const validAssigneesId = (await fillAssignedUsers(assignTo, id)).validAssigneesId;
                
                //removing tasks from updated unauthorized assignees
                const oldAssignees = task.assignTo;
                const removeAssignees = oldAssignees.filter(id => !validAssigneesId.includes(id));
                await removeAssignedUsers(id, removeAssignees);
                updateTask.assignTo = validAssigneesId;
            }
            else {
                return res.status(401).json({message: "You are not authorized to update the Assign To field of this task."});
            }
        }
        
        task = await Task.findByIdAndUpdate(id, updateTask, {new:true});
        res.status(200).json({message: "Task updated successfully.", task});
    } catch (err) {
        console.log(err);
        res.status(500).json({message: "Task could not be updated. Try checking your task id."});
    }
});

router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user);
        if(!user){
            return res.status(401).json({message: "User not logged in."});
        }
        const id = req.params.id;
        let task = await Task.findById(id);
        if(req.user.toString() !== task.creator.toString()){
            return res.status(401).json({message: "You are not authorized to delete this task."});
        }
        if(task.assignTo){
                const removedAssignees = task.assignTo.filter(ID => !task.assignTo.includes(ID));
                await removeAssignedUsers(id, removedAssignees);
        }
        task = await Task.findByIdAndDelete(req.params.id);
        await User.findByIdAndUpdate(task.creator, {$pull: {tasks: req.params.id}});
        res.status(200).json({message: "Task deleted successfully."});
    } catch (err) { 
        res.status(500).json({message: "Task could not be deleted. Try checking your task id."});
    }
});

module.exports = router;