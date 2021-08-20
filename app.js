const path = require('path');
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require('cors');

const AppError = require("./utils/appError");
const GlobalErrorHandler = require("./controllers/errorController");
const mealRouter = require("./routes/mealRoutes");
const userRouter = require("./routes/userRoutes");

const app = express();
 
// 1.GLOBAL MIDDLEWARES

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
// Set Security HTTP headers
app.use(helmet());

// logger middleware
if (process.env.NODE_ENV == "development") {
  app.use(morgan("dev"));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 300,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests in an IP. Please try again in an hour!",
});
app.use("/api", limiter);

// console.log(process.env.NODE_ENV);

app.get("/", (req, res) => {
  res.send("Hello world!");
});

// the data from the body into req.body is stored to the req object
app.use(express.json({ limit: "10kb" }));

// Data sanitization against NOSQL query injection attacks
app.use(mongoSanitize());

// Data sanitization against XSS attacks
app.use(xss());

// Prevents parameter pollution -> duplicate fields
app.use(
  hpp({
    whitelist: [ "ratingsAverage", "ratingsQuantity", "price"],
  })
);

// Middleware for the mounting the router to the particular root URL
app.use("/api/v1/meals", mealRouter);
app.use("/api/v1/users", userRouter);

app.use("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

app.use(GlobalErrorHandler);

module.exports = app;
