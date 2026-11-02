const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const createApp = require("../src/app");

const ID = "507f1f77bcf86cd799439011";

function createTestModel() {
  const records = [];

  class FeedbackModel {
    constructor(fields) {
      Object.assign(this, fields);
    }

    async save() {
      if (!this.studentName || !this.courseName || !this.message) {
        const error = new Error("Required feedback fields are missing.");
        error.name = "ValidationError";
        throw error;
      }

      if (!Number.isInteger(this.rating) || this.rating < 1 || this.rating > 5) {
        const error = new Error("Rating must be an integer between 1 and 5.");
        error.name = "ValidationError";
        throw error;
      }

      this._id = ID;
      this.status = "Pending";
      this.createdAt = new Date();
      records.push(this);
      return this;
    }

    static find() {
      const query = {
        sort() {
          return query;
        },
        skip(count) {
          query.offset = count;
          return query;
        },
        limit(count) {
          query.count = count;
          return query;
        },
        async exec() {
          return records.slice(query.offset, query.offset + query.count);
        },
      };
      return query;
    }

    static countDocuments() {
      return { exec: async () => records.length };
    }

    static findByIdAndUpdate(id, update) {
      return {
        exec: async () => {
          const record = records.find((item) => item._id === id);
          if (record) {
            record.status = update.status;
          }
          return record ?? null;
        },
      };
    }
  }

  return FeedbackModel;
}

async function withServer(run) {
  const app = createApp({ FeedbackModel: createTestModel() });
  const server = app.listen(0);
  await once(server, "listening");
  const address = server.address();

  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
    await once(server, "close");
  }
}

test("POST creates feedback with the default Pending status", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/feedback`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        studentName: "Ada Student",
        courseName: "Backend Development",
        message: "Great course",
        rating: 5,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.feedback.status, "Pending");
    assert.equal(body.feedback.rating, 5);
  });
});

test("POST rejects ratings outside the required range", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/feedback`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        studentName: "Ada Student",
        courseName: "Backend Development",
        message: "Great course",
        rating: 6,
      }),
    });

    assert.equal(response.status, 400);
  });
});

test("GET returns records and pagination metadata", async () => {
  await withServer(async (baseUrl) => {
    await fetch(`${baseUrl}/api/feedback`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        studentName: "Ada Student",
        courseName: "Backend Development",
        message: "Great course",
        rating: 4,
      }),
    });

    const response = await fetch(`${baseUrl}/api/feedback?page=1&limit=1`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.feedback.length, 1);
    assert.equal(body.currentPage, 1);
    assert.equal(body.totalRecords, 1);
    assert.equal(body.totalPages, 1);
  });
});

test("GET rejects invalid pagination parameters", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/feedback?page=0`);
    assert.equal(response.status, 400);
  });
});

test("PATCH changes the status and returns 404 for a missing record", async () => {
  await withServer(async (baseUrl) => {
    await fetch(`${baseUrl}/api/feedback`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        studentName: "Ada Student",
        courseName: "Backend Development",
        message: "Great course",
        rating: 4,
      }),
    });

    const updated = await fetch(`${baseUrl}/api/feedback/${ID}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "Reviewed" }),
    });
    assert.equal(updated.status, 200);
    assert.equal((await updated.json()).feedback.status, "Reviewed");

    const missing = await fetch(
      `${baseUrl}/api/feedback/507f1f77bcf86cd799439012`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "Reviewed" }),
      },
    );
    assert.equal(missing.status, 404);
  });
});

test("PATCH rejects invalid IDs and statuses", async () => {
  await withServer(async (baseUrl) => {
    const invalidId = await fetch(`${baseUrl}/api/feedback/not-an-id`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "Reviewed" }),
    });
    const invalidStatus = await fetch(`${baseUrl}/api/feedback/${ID}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "Done" }),
    });

    assert.equal(invalidId.status, 400);
    assert.equal(invalidStatus.status, 400);
  });
});
