const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../schema/user.schema");
const authMiddleware = require("../middlewares/auth");
const validateRegistrationMiddleware = require("../middlewares/validateRegistration");
const validateUpdateMiddleware = require("../middlewares/validateUpdate");

dotenv.config();

router.post("/register", validateRegistrationMiddleware, async (req, res) => {
    const { name, email, password } = req.body;
    const ifUserExists = await User.findOne({ email });
    if (ifUserExists) {
        return res.status(400).json({message: "User already exists."});
    }
    const hashedPassword = await bcrypt.hashSync(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    const payload = {id: user._id};
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    res.status(201).json({message: "User registration successful.", token: token, name: user.name});
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({message: "Incorrect email or password."});
    }
    try {
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({message: "Incorrect email or password."});
        }
        const payload = {id: user._id};
        const token = jwt.sign(payload, process.env.JWT_SECRET);
        res.status(200).json({message: "Login successful.", token});
    } catch(err) {
        res.status(500).json({message: "Internal server error. Login failed."});
    }
});

router.post("/logout", authMiddleware, async (req,res) => {
    try {
        res.status(200).json({message: "User Logged out."})
    } catch (err) {
        res.status(500).json({message: "Internal server error. User could not be logged out."});
    }
})

router.get("/", async (req, res) => {
    try {
        const users = await User.find().select("-password -__v");
        res.status(200).json({users});
    } catch (err) {
        res.status(500).json({message: "Internal server error. User could not be fetched.", err});
    }
});

router.get("/getAccount", authMiddleware, async (req, res) => {
    const user = await User.findById(req.user).select("name email");
    try {
        res.status(200).json({user});
    } catch (err) {
        res.status(500).json({message: "Internal server error. User could not be fetched.", err});
    }
});

router.patch("/settings", authMiddleware, validateUpdateMiddleware, async (req,res) => { 
    const {name, email, oldPassword, newPassword} = req.body;
    const user = await User.findById(req.user);
    let isUpdated = false;
    let shouldLogout = false;
    if (!user) {
        return res.status(400).json({message: "User not found."});
    }
    try {
        if (oldPassword) {
            const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isPasswordMatch) {
                return res.status(400).json({message: "Incorrect password."});
            }
            if (newPassword && newPassword != oldPassword) {
                const hashedPassword = await bcrypt.hashSync(newPassword, 10);
                user.password = hashedPassword;
                isUpdated = true;
                shouldLogout = true;
            }
        }
        if (name && name != user.name) {
            user.name = name;
            isUpdated = true;
        }
        if (email && email != user.email) {
            const userEmailExists = await User.findOne({email});
            if (userEmailExists) {
                return res.status(400).json({message: "Email already exists."});
            }
            user.email = email;
            isUpdated = true;
            shouldLogout = true;
        }
        if(isUpdated) {
            await user.save();
            res.status(200).json({message: "Settings updated successfully.", logout: shouldLogout});
        } else {
            res.status(200).json({message: "Nothing to update."});
        }
    } catch (err) {
        res.status(500).json({message: "Internal server error. Settings could not be updated.", err});
    }
})

module.exports = router;