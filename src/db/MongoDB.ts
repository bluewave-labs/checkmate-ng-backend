import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/saas";

const RETRY_INTERVAL_MS = 2000; // wait 2 seconds between retries
const MAX_RETRIES = 10; // number of retries before giving up

export const connectDatabase = async (): Promise<boolean> => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log("Connected to MongoDB");
      return true;
    } catch (error) {
      console.error(
        `MongoDB connection attempt ${attempt} failed. Retrying in ${RETRY_INTERVAL_MS}ms...`,
        error
      );

      if (attempt === MAX_RETRIES) {
        console.error(
          "Could not connect to MongoDB after max retries. Exiting."
        );
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
    }
  }

  return false;
};
export const disconnectDatabase = async (): Promise<boolean> => {
  try {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    return true;
  } catch (error) {
    console.error("MongoDB disconnection error:", error);
    return false;
  }
};
