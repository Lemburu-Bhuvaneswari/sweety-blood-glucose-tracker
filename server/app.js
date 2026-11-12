const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const readingRoutes = require("./routes/readingRoutes");

const reportRoutes = require("./routes/reportRoutes");

const app = express();

// Middleware
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

app.use(express.json());

// Health-check route
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Sweety API is running successfully.",
    });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Glucose reading routes
app.use("/api/readings", readingRoutes);

app.use("/api/reports", reportRoutes);

module.exports = app;