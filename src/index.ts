import mongoose from "mongoose";
import { config } from "dotenv";
import {schedule} from "node-cron";
import { promisify } from "util";
import {exec} from "child_process";

config({ path: "config.env" });

import { server as app } from "./app";
import { CronFileProcessing } from "./middlewares/CronFileProcessing";

const start = async () => {
  process.on("uncaughtException", (error: Error) => {
    console.log("UNCAUGHT EXCEPTION - SHUTTING DWON");
    console.log(`
            ERROR NAME: ${error.name}
            ERROR MESSAGE: ${error.message}
            ERROR STACK: ${error.stack}
        `);
    process.exit(1);
  });

  schedule("* * * * * *", async () => {
    const TERM_EXEC = promisify(exec);
    const projectRootPath = require('path').resolve('./');
    await TERM_EXEC(`rm ${projectRootPath}/src/uploads/*.xml`)
  })

  schedule("*/5 * * * * *", CronFileProcessing);

  if (!process.env.APP_PORT) {
    throw new Error("APP_PORT must be defined!!");
  }

  const MONGODB_URI = Number(process.env.IS_LOCAL_DB) ? process.env.LOCAL_MONGODB_URI : process.env.CLOUD_MONGODB_URI;
  
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URL must be defined!!");
  }

  if (!process.env.MONGODB_DATABASE) {
    throw new Error("MONGODB_DATABASE must be defined!!");
  }

  if (!process.env.MONGODB_PASSWORD) {
    throw new Error("MONGODB_PASSWORD must be defined!!");
  }

  try {
    const connectionURI = process.env.IS_LOCAL_DB? MONGODB_URI: MONGODB_URI
    .replace("PASSWORD",process.env.MONGODB_PASSWORD)
    .replace("DATABASE", process.env.MONGODB_DATABASE);

    await mongoose.connect(connectionURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    console.log("PDFToolBoxProcessor - Connected to MongoDB");
  } catch (error) {
    console.log("DB Connection Error", error);
  }

  const server = app.listen(process.env.APP_PORT);
  console.log(`PDFToolBoxProcessor - SERVER IS RUNNING ON PORT: ${process.env.APP_PORT}!`);

  process.on("unhandledRejection", (error: Error) => {
    console.log("UNHANDLED REJECTION - SHUTTING DWON");
    console.log(`
            ERROR NAME: ${error.name}
            ERROR MESSAGE: ${error.message}
            ERROR STACK: ${error.stack}
        `);
    server.close(() => process.exit(1));
  });
};

start();
