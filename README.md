# Student Feedback Management API

A REST API built with Node.js, Express, MongoDB, and Mongoose for submitting,
listing, and reviewing student feedback.

## Setup

1. Install Node.js 20 or newer and run `npm install`.
2. Copy `.env.example` to `.env` and set `MONGODB_URI` to a reachable MongoDB
   connection string.
3. Start the API with `npm start` (or `npm run dev` for automatic restarts).

The server listens on port `3000` by default. Set `PORT` to change it. The API
does not start if MongoDB is unreachable or `MONGODB_URI` is missing.

## Endpoints

### Submit feedback

`POST /api/feedback`

Request body:

```json
{
  "studentName": "Ada Student",
  "courseName": "Backend Development",
  "message": "The practical examples were helpful.",
  "rating": 5
}
```

All four fields are required. The rating must be an integer from 1 to 5.
New records start with status `Pending`.

Success response (`201 Created`):

```json
{
  "feedback": {
    "_id": "507f1f77bcf86cd799439011",
    "studentName": "Ada Student",
    "courseName": "Backend Development",
    "message": "The practical examples were helpful.",
    "rating": 5,
    "status": "Pending"
  }
}
```

### Retrieve feedback

`GET /api/feedback?page=1&limit=10`

Both query parameters are optional; `page` defaults to `1` and `limit` to `10`.
They must be positive integers, and `limit` cannot exceed `100`. Results are
ordered newest first.

Success response (`200 OK`):

```json
{
  "feedback": [],
  "currentPage": 1,
  "totalRecords": 0,
  "totalPages": 0
}
```

### Update review status

`PATCH /api/feedback/:id`

Request body:

```json
{
  "status": "Reviewed"
}
```

The only accepted statuses are `Pending` and `Reviewed`. A valid request
returns the updated record (`200 OK`); an unknown ID returns `404 Not Found`.
Malformed IDs, invalid statuses, and invalid input return `400 Bad Request`.

## Run tests

```sh
npm test
```

The test suite exercises the HTTP routes with an in-memory model, so it does
not require a running MongoDB instance.
