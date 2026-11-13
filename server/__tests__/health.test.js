const request = require("supertest");
const app = require("../app");

describe("Health Check API", () => {
    test("should return a successful response", async () => {
        const response = await request(app).get("/api/health");

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe(
            "Sweety API is running successfully."
        );
    });
});