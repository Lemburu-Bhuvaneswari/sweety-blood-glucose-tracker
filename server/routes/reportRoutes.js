const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authMiddleware");

const {
    getDailyReport,
    getMonthToDateReport,
    getPreviousMonthReport
} = require("../controllers/reportsController");

router.get("/daily", authenticateUser, getDailyReport);

router.get("/month-to-date", authenticateUser, getMonthToDateReport);

router.get("/previous-month", authenticateUser, getPreviousMonthReport);

module.exports = router;