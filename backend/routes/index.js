const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.send("Thanks for using the Pro-Manager Application");
});

module.exports = router;