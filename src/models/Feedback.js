const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    studentName: { type: String, required: true, trim: true },
    courseName: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be an integer between 1 and 5.",
      },
    },
    status: { type: String, enum: ["Pending", "Reviewed"], default: "Pending" },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("Feedback", feedbackSchema);
