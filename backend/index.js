const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const errorHandlerMiddleware = require("./middlewares/errorHandler");
const indexRouter = require("./routes/index");
const userRouter = require("./routes/user");
const taskRouter = require("./routes/task");
const healthRouter = require("./routes/health");

const app = express();
dotenv.config();
const PORT = process.env.PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/Pro-Manager/api/v1/health", healthRouter);
app.use("/Pro-Manager/api/v1", indexRouter);
app.use("/Pro-Manager/api/v1/user", userRouter);
app.use("/Pro-Manager/api/v1/board/task", taskRouter);

app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
  });
app.use(errorHandlerMiddleware);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    mongoose.connect(process.env.MONGO_URI).then(() => {
        console.log("Connected to MongoDB Server.");
    }).catch((err) => {
        console.log("MongoDB connection error: ", err);
    });
})