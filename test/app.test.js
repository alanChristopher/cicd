
import request from "supertest";
import app from '../src/app'

describe("Get /", () => {
    it("should return API message", async () => {
        const res = await request(app).get('/')
        expect(res.statusCode).toBe(200)
        expect(res.body.message).toBe("App is running...")
    })
})