import { existsSync } from "fs";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const envFilePath = fileURLToPath(new URL("../.env", import.meta.url));

if (existsSync(envFilePath)) {
  process.loadEnvFile(envFilePath);
}

if (!process.env.MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is missing. Add it to the .env file in the app root.",
  );
}

export const MONGODB_URI = process.env.MONGODB_URI;
export const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "countdown-timer";

export async function connectToDatabase() {
  await mongoose.connect(MONGODB_URI, {
    dbName: MONGODB_DB_NAME,
    serverSelectionTimeoutMS: 10000,
  });
  console.log(`Connected to MongoDB database "${MONGODB_DB_NAME}"`);
}
