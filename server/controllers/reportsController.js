
const pool = require("../config/db");

// Validate YYYY-MM-DD format and actual calendar date
const isValidDate = (date) => {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
    }

    const parsedDate = new Date(`${date}T00:00:00Z`);

    return (
        !Number.isNaN(parsedDate.getTime()) &&
        parsedDate.toISOString().slice(0, 10) === date
    );
};

// Generate report using a date range
const generateReport = async (req, res, startDate, endDate, reportType) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT
                COUNT(*)::integer AS total_readings,
                MAX(glucose_value)::integer AS highest_value,
                MIN(glucose_value)::integer AS lowest_value,
                ROUND(AVG(glucose_value)::numeric, 1) AS average_value
             FROM glucose_readings
             WHERE user_id = $1
             AND reading_date >= $2
             AND reading_date <= $3`,
            [userId, startDate, endDate]
        );

        const readingsResult = await pool.query(
            `SELECT
                id,
                TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
                time_slot,
                glucose_value
             FROM glucose_readings
             WHERE user_id = $1
             AND reading_date >= $2
             AND reading_date <= $3
             ORDER BY reading_date ASC,
                CASE time_slot
                    WHEN 'Morning fasting' THEN 1
                    WHEN 'After breakfast' THEN 2
                    WHEN 'After lunch' THEN 3
                    WHEN 'After dinner' THEN 4
                END`,
            [userId, startDate, endDate]
        );

        const stats = result.rows[0];

        return res.status(200).json({
            success: true,
            report_type: reportType,
            period: {
                start_date: startDate,
                end_date: endDate
            },
            summary: {
                total_readings: stats.total_readings,
                highest_value: stats.highest_value,
                lowest_value: stats.lowest_value,
                average_value: stats.average_value === null
                    ? null
                    : Number(stats.average_value)
            },
            readings: readingsResult.rows,
            message: stats.total_readings === 0
                ? "No glucose readings found for this period."
                : "Report generated successfully."
        });

    } catch (error) {
        console.error("Generate report error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while generating the report."
        });
    }
};

// 1. Daily Report
const getDailyReport = async (req, res) => {
    const { date } = req.query;

    if (!isValidDate(date)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid date in YYYY-MM-DD format."
        });
    }

    return generateReport(req, res, date, date, "Daily");
};

// 2. Month-to-Date Report
const getMonthToDateReport = async (req, res) => {
    const { date } = req.query;

    if (!isValidDate(date)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid date in YYYY-MM-DD format."
        });
    }

    const startDate = `${date.slice(0, 7)}-01`;

    return generateReport(
        req,
        res,
        startDate,
        date,
        "Month-to-Date"
    );
};

// 3. Previous Month Report
const getPreviousMonthReport = async (req, res) => {
    const { date } = req.query;

    if (!isValidDate(date)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid date in YYYY-MM-DD format."
        });
    }

    const selectedDate = new Date(`${date}T00:00:00Z`);

    const firstDayPreviousMonth = new Date(Date.UTC(
        selectedDate.getUTCFullYear(),
        selectedDate.getUTCMonth() - 1,
        1
    ));

    const lastDayPreviousMonth = new Date(Date.UTC(
        selectedDate.getUTCFullYear(),
        selectedDate.getUTCMonth(),
        0
    ));

    const startDate = firstDayPreviousMonth.toISOString().slice(0, 10);
    const endDate = lastDayPreviousMonth.toISOString().slice(0, 10);

    return generateReport(
        req,
        res,
        startDate,
        endDate,
        "Previous Month"
    );
};

module.exports = {
    getDailyReport,
    getMonthToDateReport,
    getPreviousMonthReport
};
