import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from './routes/user.routes.js';
import appointmentRouter from './routes/appointment.routes.js';
import contactRouter from './routes/contact.routes.js';
import predictionRouter from './routes/prediction.routes.js';
import notificationRouter from './routes/notification.routes.js';

const app = express();

const ALLOWED_ORIGINS = [
    process.env.CORS_ORIGIN,
    "http://localhost:5173",
    "http://localhost:5174",
].filter(origin => origin && origin !== "*");

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        if (ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        } else {
            console.error(`CORS Error: Origin ${origin} not allowed. Allowed:`, ALLOWED_ORIGINS);
            return callback(new Error("Not allowed by CORS"), false);
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Root route
app.get("/", (req, res) => {
    res.json({ message: "Smart Heart Attack Prediction API is running!" });
});

// routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/appointments", appointmentRouter);
app.use("/api/v1/contacts", contactRouter);
app.use("/api/v1/predictions", predictionRouter);
app.use("/api/v1/notifications", notificationRouter);

// Global error handler
app.use((err, req, res, next) => {
    console.error("EXPRESS ERROR HANDLER CAUGHT AN ERROR:", err.stack || err);
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || []
    });
});

export { app };
