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
        const validAssignees = [];
        for (let assigneeEmail of assignToArray) {
            let assignee = await User.findOne({email: assigneeEmail});
            if (!assignee) {
                return res.status(400).json({message: `Assigned user ${assigneeEmail} is not registered.`});
            }
            validAssignees.push(assignee);
        }
        const task = new Task({ title, priority, assignTo: assignToArray, checkList: checkListArray, dueDate, creator: user._id });
        user.tasks.push(task._id);
        await task.save();
        await user.save();
        for (let assignee of validAssignees) {
            assignee.tasks.push(task._id);
            await assignee.save();
        }
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
        const tasks = await Task.find({$or: [{creator: user._id}, {assignTo: user.email}]}).select("-__v -checkList._id");
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
        let tasks = await Task.find({$or: [{creator: user._id}, {assignTo: user.email}], listType: "Backlog"}).select("-__v -checkList._id");
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
        let tasks = await Task.find({$or: [{creator: user._id}, {assignTo: user.email}], listType: "To do"}).select("-__v -checkList._id");
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
        let tasks = await Task.find({$or: [{creator: user._id}, {assignTo: user.email}], listType: "In Progress"}).select("-__v -checkList._id");
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
        let tasks = await Task.find({$or: [{creator: user._id}, {assignTo: user.email}], listType: "Done"}).select("-__v -checkList._id");
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
        if((user._id.toString() !== task.creator.toString()) && (!task.assignTo.includes(user.email))){
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
        if((user._id.toString() !== task.creator.toString()) && (!task.assignTo.includes(user.email))){ 
            return res.status(401).json({message: "You are not authorized to update this task."});
        }
        const { title, priority, assignTo, checkList, dueDate, listType } = req.body;
        const checkListArray = checkList ? checkList.split(",").map((item) => item.trim()) : [];
        const updateTask = { title, priority, checkList: checkListArray, dueDate, listType }
        if(assignTo){
            // only the creator can update the assignTo field
            if(user.id.toString() === task.creator.toString()){
                const assignToArray = assignTo.split(",").map((item) => item.trim());
                const validAssignees = [];
                for (let assigneeEmail of assignToArray) {
                    let assignee = await User.findOne({email: assigneeEmail});
                    if (!assignee) {
                        return res.status(400).json({message: `Assigned user ${assigneeEmail} is not registered.`});
                    }
                    validAssignees.push(assignee);
                }
                for (let assignee of validAssignees) {
                    console.log("Hello", assignee.tasks.includes(task._id))
                    if(!assignee.tasks.includes(task._id)){
                        console.log("Inside")
                        assignee.tasks.push(task._id);
                        await assignee.save();
                    }
                }

                //removing tasks from updated unauthorized assignees
                const oldAssignees = task.assignTo;
                const removedAssignees = oldAssignees.filter(email => !assignToArray.includes(email));
                for(let email of removedAssignees){
                    let assignee = await User.findOne({email});
                    if(assignee){
                        assignee.tasks = assignee.tasks.filter(taskId => taskId.toString() !== task._id.toString());
                        await assignee.save();
                    }
                }

                updateTask.assignTo = assignToArray;
            }
            else {
                return res.status(401).json({message: "You are not authorized to update the Assign To field of this task."});
            }
        }
        
        task = await Task.findByIdAndUpdate(id, updateTask, {new:true});
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
        console.log("One")
        if(task.assignTo){
            console.log("Two")
                const removedAssignees = task.assignTo.filter(email => !task.assignTo.includes(email));
                for(let email of removedAssignees){
                    let assignee = await User.findOne({email});
                    if(assignee){
                        assignee.tasks = assignee.tasks.filter(taskId => taskId.toString() !== task._id.toString());
                        await assignee.save();
                    }
                }
        }

        task = await Task.findByIdAndDelete(req.params.id);
        await User.findByIdAndUpdate(task.creator, {$pull: {tasks: req.params.id}});
        res.status(200).json({message: "Task deleted successfully."});
    } catch (err) { 
        res.status(500).json({message: "Task could not be deleted. Try checking your task id."});
    }
});

module.exports = router;