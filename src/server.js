require("dotenv").config();

const mongoose = require("mongoose");
const createApp = require("./app");

const port = Number(process.env.PORT || 3000);
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("MONGODB_URI is required. Set it in your environment or .env file.");
  process.exit(1);
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("PORT must be an integer between 1 and 65535.");
  process.exit(1);
}

async function startServer() {
  await mongoose.connect(mongoUri);
  const app = createApp();
  app.listen(port, () => {
    console.log(`Student Feedback API is listening on port ${port}.`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start the Student Feedback API:", error);
  process.exitCode = 1;
});
