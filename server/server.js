require("dotenv").config();

const app = require("./app");
const pool = require("./config/db");

const PORT = process.env.PORT || 5000;

// Verify PostgreSQL connection before starting the server
const startServer = async () => {
    try {
        await pool.query("SELECT 1");

        console.log("PostgreSQL connection verified.");

        app.listen(PORT, () => {
            console.log(`Sweety API running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Unable to connect to PostgreSQL:", error.message);
        process.exit(1);
    }
};

startServer();