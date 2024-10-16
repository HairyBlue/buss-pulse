import * as winston from "winston";
import DailyRotateFile = require("winston-daily-rotate-file");
// import * as JSZip from "jszip";
import * as fs from "fs";
import * as util from "util";
import { DateTime } from "luxon";
// import "dotenv/config";
const { combine, timestamp, json, errors, simple } = winston.format;

const logPath = "logs";

if (!fs.existsSync(logPath)) {
  fs.mkdirSync(logPath);
}

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

const logger = winston.createLogger({
  level: "info",
  transports: [
    new DailyRotateFile({
      dirname: logPath,
      filename: "log-%DATE%.log",
      datePattern: "YYYY-MM-DD-HH",
      maxSize: "20m",
      json: true,
      format: combine(errors({ stack: true }), timestamp(), json()),
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: simple(),
    })
  );
}

function wichFileToLog(filename: string) {
  return {
    warn: function (...args: any) {
      let msg = util.format.apply({}, args);
      logger.log("warn", { filename, message: msg });
    },
    info: function (...args: any) {
      let msg = util.format.apply({}, args);
      logger.log("info", { filename, message: msg });
    },
    error: function (...args: any) {
      let msg = util.format.apply({}, args);
      logger.log("error", { filename, message: msg });
    },
  };
}

function formatDate(date: any) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");

  return `${year}${month}${day}-${hour}`;
}

// function zipTheLogs() {
//   const today = new Date();
//   const files = fs.readdirSync(logPath);
//   const zip = new JSZip();

//   for (let file of files) {
//     if (file.endsWith(".zip")) {
//       continue;
//     }

//     const filePath = `${logPath}/${file}`;
//     const stat = fs.statSync(filePath);
//     const mtime = stat.mtimeMs;

//     if (mtime < Date.now() - 3 * 24 * 60 * 60 * 1000) {
//       const content = fs.readFileSync(filePath, "utf8");
//       zip.file(file, content);
//     }
//   }

//   if (Object.keys(zip.files).length > 0) {
//     const zipFiles = Object.keys(zip.files);

//     zip.generateAsync({ type: "nodebuffer" }).then((content) => {
//       const currentDateFormatted = formatDate(today);
//       fs.writeFileSync(
//         `${logPath}/older-logs-${currentDateFormatted}.zip`,
//         content
//       );

//       zipFiles.forEach((file) => {
//         fs.unlinkSync(`${logPath}/${file}`);
//       });
//     });
//   }
// }

function logList() {
  const files = fs.readdirSync(logPath);
  const fileList: string[] = [];

  for (let file of files) {
    fileList.push(file);
  }
  
  return fileList;
}

function readLog(file: string) {
  const contentToSend = [];

  const filePath = `${logPath}/${file}`;
  const readLogString = fs.readFileSync(filePath, "utf8");
  const chunkLogs = readLogString.split("\n");

  let stringLogLine = "";

  for (let i = 0; i < chunkLogs.length; i++) {

    if ((stringLogLine + chunkLogs[i]).length < 2000 ) {
      stringLogLine += chunkLogs[i];

      if (i == chunkLogs.length - 1) {
        contentToSend.push(stringLogLine);
      }
    } else {
      contentToSend.push(stringLogLine);
      stringLogLine = chunkLogs[i];
    }
  }
  
  return contentToSend;
}

function readLatestLog() {
  const files = fs.readdirSync(logPath);

  let out: any = [];
  let latesTime = -1;
  let latestFile = null;

  for (let file of files) {
    if (file.endsWith(".zip")) {
      continue;
    }

    const filePath = `${logPath}/${file}`;

    const stat = fs.statSync(filePath);
    const mtime = stat.mtimeMs;

    if (mtime > latesTime) {
      latesTime = mtime;
      latestFile = file;
    }
  }

  if (latestFile && latestFile.endsWith(".log")) {
    const latestLog = fs.readFileSync(`${logPath}/${latestFile}`, "utf8");
    out =  latestLog.replace(/\r/g, "").split("\n");
  }
  
  return out;
}

// export { wichFileToLog, zipTheLogs, logList, readLog, readLatestLog };
export { wichFileToLog, logList, readLog, readLatestLog };