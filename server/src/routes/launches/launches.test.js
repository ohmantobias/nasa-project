const request = require("supertest");
const app = require("../../app");
const { mongoConnect, mongoDisconnect } = require("../../services/mongo");

describe("Launches API", () => {
  beforeAll(async () => {
    await mongoConnect();
  });
  afterAll(async () => {
    await mongoDisconnect();
  });

  describe("Test GET /launches", () => {
    test("it should respond with 200 succes", async () => {
      const response = await request(app)
        .get("/v1/launches")
        .expect("Content-Type", /json/)
        .expect(200);
    });
  });
  describe("Test POST /launches", () => {
    const completeLaunchData = {
      mission: "USS",
      target: "Kepler-62 f",
      rocket: "NCC 101S",
      launchDate: "January 4,2028",
    };

    const launchDataWithoutDate = {
      mission: "USS",
      target: "Kepler-62 f",
      rocket: "NCC 101S",
    };

    const launchDataWithInvalidDate = {
      mission: "USS",
      target: "Kepler-62 f",
      rocket: "NCC 101S",
      launchDate: "zoot",
    };

    test("it should respond with 201 created", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(completeLaunchData)
        .expect("Content-Type", /json/)
        .expect(201);

      const requestDate = new Date(completeLaunchData.launchDate).valueOf();
      const responseDate = new Date(response.body.launchDate).valueOf();

      expect(responseDate).toBe(requestDate);

      expect(response.body).toMatchObject(launchDataWithoutDate);
    });

    test("it should catch missing required properties", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(launchDataWithoutDate)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual({
        error: "Missing required launch property",
      });
    });
    test("it should catch invalid dates", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(launchDataWithInvalidDate)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual({
        error: "Invalid launch date",
      });
    });
  });
});
