const express = require("express");
const mongoose = require("mongoose");
const Feedback = require("../models/Feedback");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const VALID_STATUSES = new Set(["Pending", "Reviewed"]);

function parsePositiveInteger(value, fallback, fieldName) {
  if (value === undefined) return fallback;

  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    const error = new Error(`${fieldName} must be a positive integer.`);
    error.status = 400;
    throw error;
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    const error = new Error(`${fieldName} must be a safe positive integer.`);
    error.status = 400;
    throw error;
  }

  return parsed;
}

function createFeedbackRouter(FeedbackModel = Feedback) {
  const router = express.Router();

  router.post("/", async (req, res) => {
    const feedback = new FeedbackModel({
      studentName: req.body?.studentName,
      courseName: req.body?.courseName,
      message: req.body?.message,
      rating: req.body?.rating,
    });

    const savedFeedback = await feedback.save();
    res.status(201).json({ feedback: savedFeedback });
  });

  router.get("/", async (req, res) => {
    const page = parsePositiveInteger(req.query.page, DEFAULT_PAGE, "page");
    const limit = parsePositiveInteger(req.query.limit, DEFAULT_LIMIT, "limit");

    if (limit > MAX_LIMIT) {
      return res.status(400).json({ message: `limit must not exceed ${MAX_LIMIT}.` });
    }

    const skip = (page - 1) * limit;
    if (!Number.isSafeInteger(skip)) {
      return res.status(400).json({ message: "page and limit are too large." });
    }

    const [feedback, totalRecords] = await Promise.all([
      FeedbackModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      FeedbackModel.countDocuments().exec(),
    ]);

    res.json({
      feedback,
      currentPage: page,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
    });
  });

  router.patch("/:id", async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ message: "A valid feedback ID is required." });
    }

    const { status } = req.body ?? {};
    if (!VALID_STATUSES.has(status)) {
      return res.status(400).json({
        message: 'status must be either "Pending" or "Reviewed".',
      });
    }

    const feedback = await FeedbackModel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    ).exec();

    if (!feedback) {
      return res.status(404).json({ message: "Feedback record not found." });
    }

    res.json({ feedback });
  });

  return router;
}

module.exports = createFeedbackRouter;
