const express = require("express");
const createFeedbackRouter = require("./routes/feedbackRoutes");

function createApp(options = {}) {
  const app = express();

  app.use(express.json());
  app.use("/api/feedback", createFeedbackRouter(options.FeedbackModel));

  app.use((req, res) => {
    res.status(404).json({ message: "Route not found." });
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);

    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
      return res.status(400).json({ message: "Request body must be valid JSON." });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }

    const status = Number.isInteger(error.status) ? error.status : 500;
    if (status >= 500) console.error(error);

    res.status(status).json({
      message: status >= 500 ? "Internal server error." : error.message,
    });
  });

  return app;
}

module.exports = createApp;
