const bcrypt = require("bcrypt");
const pool = require("./config/db");

const seedDatabase = async () => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const demoName = "Sweety Demo User";
        const demoEmail = "demo@sweety.app";
        const demoPassword = "SweetyDemo@123";

        const hashedPassword = await bcrypt.hash(demoPassword, 10);

        let userResult = await client.query(
            `INSERT INTO users (name, email, password)
             VALUES ($1, $2, $3)
             ON CONFLICT (email) DO NOTHING
             RETURNING id`,
            [demoName, demoEmail, hashedPassword]
        );

        let userId;

        if (userResult.rows.length > 0) {
            userId = userResult.rows[0].id;
        } else {
            const existingUser = await client.query(
                "SELECT id FROM users WHERE email = $1",
                [demoEmail]
            );

            userId = existingUser.rows[0].id;
        }

        const sampleReadings = [
            ["2026-11-13", "Morning fasting", 110],
            ["2026-11-13", "After breakfast", 145],
            ["2026-11-13", "After lunch", 160],
            ["2026-11-13", "After dinner", 130],
        ];

        for (const [date, timeSlot, glucoseValue] of sampleReadings) {
            await client.query(
                `INSERT INTO glucose_readings
                    (user_id, reading_date, time_slot, glucose_value)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (user_id, reading_date, time_slot)
                 DO NOTHING`,
                [userId, date, timeSlot, glucoseValue]
            );
        }

        await client.query("COMMIT");

        console.log("Database seeded successfully!");
        console.log("Demo email:", demoEmail);
        console.log("Demo password:", demoPassword);
        console.log("Demo user ID:", userId);
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Database seeding failed:", error);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
};

seedDatabase();