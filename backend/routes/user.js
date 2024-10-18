const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../schema/user.schema");

dotenv.config();

router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    const ifUserExists = await User.findOne({ email });
    if (ifUserExists) {
        return res.status(400).json({message: "User already exists."});
    }
    const hashedPassword = await bcrypt.hashSync(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.status(201).json({message: "User registered successfully."});
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

router.get("/", async (req, res) => {
    try {
        const users = await User.find().select("-password -__v");
        res.status(200).json({users});
    } catch (err) {
        res.status(500).json({message: "Internal server error. User could not be fetched.", err});
    }
});


module.exports = router;