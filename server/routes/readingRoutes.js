const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authMiddleware");

const {
    addReading,
    getReadings,
    updateReading,
    deleteReading
} = require("../controllers/readingController");

// Add a glucose reading
router.post("/", authenticateUser, addReading);

// Get the logged-in user's readings
router.get("/", authenticateUser, getReadings);

// Update a glucose reading
router.put("/:id", authenticateUser, updateReading);

// Delete a glucose reading
router.delete("/:id", authenticateUser, deleteReading);

module.exports = router;