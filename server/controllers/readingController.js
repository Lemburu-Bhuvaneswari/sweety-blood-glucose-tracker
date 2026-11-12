const pool = require("../config/db");

// Allowed glucose reading time slots
const VALID_TIME_SLOTS = [
    "Morning fasting",
    "After breakfast",
    "After lunch",
    "After dinner"
];

// Get today's date in India (YYYY-MM-DD)
const getTodayDate = () => {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
};

// Validate date format and actual calendar date
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

// Validate glucose value
const isValidGlucoseValue = (value) => {
    return (
        (typeof value === "number" ||
            (typeof value === "string" && value.trim() !== "")) &&
        Number.isInteger(Number(value)) &&
        Number(value) >= 40 &&
        Number(value) <= 600
    );
};

// Add a new glucose reading
const addReading = async (req, res) => {
    try {
        const { reading_date, time_slot, glucose_value } = req.body;
        const userId = req.user.userId;

        if (
            glucose_value === undefined ||
            glucose_value === null ||
            glucose_value === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter a glucose value."
            });
        }

        if (!reading_date || !time_slot) {
            return res.status(400).json({
                success: false,
                message: "Please enter all required reading details."
            });
        }

        if (!isValidDate(reading_date)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid date."
            });
        }

        if (reading_date > getTodayDate()) {
            return res.status(400).json({
                success: false,
                message: "Date cannot be in the future."
            });
        }

        if (!isValidGlucoseValue(glucose_value)) {
            return res.status(400).json({
                success: false,
                message: "Value must be between 40 and 600 mg/dl."
            });
        }

        if (!VALID_TIME_SLOTS.includes(time_slot)) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid time slot."
            });
        }

        const existingReading = await pool.query(
            `SELECT id
             FROM glucose_readings
             WHERE user_id = $1
             AND reading_date = $2
             AND time_slot = $3`,
            [userId, reading_date, time_slot]
        );

        if (existingReading.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: `You already have an ${time_slot} reading for this date.`
            });
        }

        const dailyCount = await pool.query(
            `SELECT COUNT(*)::integer AS count
             FROM glucose_readings
             WHERE user_id = $1
             AND reading_date = $2`,
            [userId, reading_date]
        );

        if (dailyCount.rows[0].count >= 4) {
            return res.status(400).json({
                success: false,
                message: "You can add only 4 readings per day."
            });
        }

        const result = await pool.query(
            `INSERT INTO glucose_readings
                (user_id, reading_date, time_slot, glucose_value)
             VALUES ($1, $2, $3, $4)
             RETURNING
                id,
                TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
                time_slot,
                glucose_value,
                created_at,
                updated_at`,
            [userId, reading_date, time_slot, Number(glucose_value)]
        );

        return res.status(201).json({
            success: true,
            message: "Glucose reading added successfully.",
            reading: result.rows[0]
        });

    } catch (error) {
        console.error("Add reading error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: `You already have an ${req.body.time_slot} reading for this date.`
            });
        }

        return res.status(500).json({
            success: false,
            message: "Something went wrong while adding the reading."
        });
    }
};

// Get all readings belonging to the logged-in user
const getReadings = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT
                id,
                TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
                time_slot,
                glucose_value,
                created_at,
                updated_at
             FROM glucose_readings
             WHERE user_id = $1
             ORDER BY reading_date DESC,
                      CASE time_slot
                          WHEN 'Morning fasting' THEN 1
                          WHEN 'After breakfast' THEN 2
                          WHEN 'After lunch' THEN 3
                          WHEN 'After dinner' THEN 4
                      END`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            readings: result.rows
        });

    } catch (error) {
        console.error("Get readings error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching readings."
        });
    }
};

// Update an existing glucose reading
const updateReading = async (req, res) => {
    try {
        const { id } = req.params;
        const { reading_date, time_slot, glucose_value } = req.body;
        const userId = req.user.userId;

        // Validate reading ID
        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid reading ID."
            });
        }

        // Check whether reading belongs to the logged-in user
        const existing = await pool.query(
            `SELECT id
             FROM glucose_readings
             WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Reading not found."
            });
        }

        // Validate required fields
        if (
            glucose_value === undefined ||
            glucose_value === null ||
            glucose_value === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter a glucose value."
            });
        }

        if (!reading_date || !time_slot) {
            return res.status(400).json({
                success: false,
                message: "Please enter all required reading details."
            });
        }

        if (!isValidDate(reading_date)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid date."
            });
        }

        if (reading_date > getTodayDate()) {
            return res.status(400).json({
                success: false,
                message: "Date cannot be in the future."
            });
        }

        if (!isValidGlucoseValue(glucose_value)) {
            return res.status(400).json({
                success: false,
                message: "Value must be between 40 and 600 mg/dl."
            });
        }

        if (!VALID_TIME_SLOTS.includes(time_slot)) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid time slot."
            });
        }

        // Check for duplicate slot, excluding the current reading
        const duplicate = await pool.query(
            `SELECT id
             FROM glucose_readings
             WHERE user_id = $1
             AND reading_date = $2
             AND time_slot = $3
             AND id <> $4`,
            [userId, reading_date, time_slot, id]
        );

        if (duplicate.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: `You already have an ${time_slot} reading for this date.`
            });
        }

        // Check daily limit if moving the reading to another date
        const dailyCount = await pool.query(
            `SELECT COUNT(*)::integer AS count
             FROM glucose_readings
             WHERE user_id = $1
             AND reading_date = $2
             AND id <> $3`,
            [userId, reading_date, id]
        );

        if (dailyCount.rows[0].count >= 4) {
            return res.status(400).json({
                success: false,
                message: "You can add only 4 readings per day."
            });
        }

        const result = await pool.query(
            `UPDATE glucose_readings
             SET reading_date = $1,
                 time_slot = $2,
                 glucose_value = $3,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4 AND user_id = $5
             RETURNING
                id,
                TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
                time_slot,
                glucose_value,
                created_at,
                updated_at`,
            [reading_date, time_slot, Number(glucose_value), id, userId]
        );

        return res.status(200).json({
            success: true,
            message: "Glucose reading updated successfully.",
            reading: result.rows[0]
        });

    } catch (error) {
        console.error("Update reading error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: `You already have an ${req.body.time_slot} reading for this date.`
            });
        }

        return res.status(500).json({
            success: false,
            message: "Something went wrong while updating the reading."
        });
    }
};

// Delete an existing glucose reading
const deleteReading = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid reading ID."
            });
        }

        const result = await pool.query(
            `DELETE FROM glucose_readings
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Reading not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Glucose reading deleted successfully."
        });

    } catch (error) {
        console.error("Delete reading error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while deleting the reading."
        });
    }
};

// Export reading controller functions
module.exports = {
    addReading,
    getReadings,
    updateReading,
    deleteReading
};