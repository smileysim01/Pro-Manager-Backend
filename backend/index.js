const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");

const app = express();
dotenv.config();
const PORT = process.env.PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    mongoose.connect(process.env.MONGO_URI).then(() => {
        console.log("Connected to MongoDB Server.");
    }).catch((err) => {
        console.log("MongoDB connection error: ", err);
    });
})