const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

router.get("/", (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? "UP" : "DOWN";
    const healthStatus = {
        status: "UP",
        dbStatus,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        message: "Server is up and running."
    };
    if(dbStatus === "DOWN"){
        return res.status(503).json({...healthStatus, message: "Database is down."});
    }
    res.status(200).json(healthStatus);
});

module.exports = router;
