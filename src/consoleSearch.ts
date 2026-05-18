import os from "os";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import logUpdate from "log-update";

import { ComputeSocket } from "./services/compute/ComputeSocket";
import { clampConcurrency, getRecommendedConcurrency } from "./services/concurrency";
import SeedSolver from "./services/seedSolverHandler.node";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, "./package.json"), "utf-8"));
const APP_VERSION = pkg.version;
const cpuCount = os.cpus().length;
const recommendedCores = getRecommendedConcurrency(cpuCount);

const argv = yargs(hideBin(process.argv))
  .env("NOITOOL")
  .option("url", {
    default: "http://zxbly.com:3000",
  })
  .option("cores", {
    default: recommendedCores,
    type: "number",
  })
  .option("userId", {})
  .option("sessionToken", {
    type: "string",
  })
  .option("exit", {
    default: false,
  })
  .option("minRunTime", {
    default: 0,
  })
  .parseSync();

console.log(`Noitool 控制台搜索 ${APP_VERSION}`, argv, cpuCount);

// const seedSolver = new SeedSolver(1, false);
const seedSolver = new SeedSolver(clampConcurrency(argv.cores || recommendedCores, cpuCount), false);

const initTime = new Date().getTime();

const exitHandler = () => {
  setTimeout(() => {
    process.exit(0);
  }, 5000);
};

const newComputeSocket = new ComputeSocket({
  url: argv.url || "http://zxbly.com:3000/",
  version: APP_VERSION,
  sessionToken: argv.sessionToken,
  seedSolver: seedSolver as any,
  onUpdate: () => {
    if (!newComputeSocket.jobName) {
      return;
    }
    logUpdate(
      JSON.stringify(
        {
          connected: newComputeSocket.connected,
          running: newComputeSocket.running,
          info: {
            jobName: newComputeSocket.jobName,
            chunkTo: newComputeSocket.chunkTo,
            chunkFrom: newComputeSocket.chunkFrom,
          },
        },
        null,
        2,
      ),
    );
  },
  onDone: () => {
    if (!argv.exit) {
      return;
    }

    if (argv.minRunTime) {
      const timeRunning = new Date().getTime() - initTime;
      if (timeRunning < argv.minRunTime) {
        return;
      }
    }

    console.log("搜索任务已完成");
    newComputeSocket.terminate();
    exitHandler();
  },
});

newComputeSocket.on("compute:version_mismatch", () => {
  console.log("版本不匹配，请更新客户端。");
  newComputeSocket.terminate();
  exitHandler();
});

newComputeSocket.on("compute:unauthorized", config => {
  console.log("userID 或 sessionToken 无效");
  console.log("当前使用的配置:");
  console.log(config);
  newComputeSocket.terminate();
  exitHandler();
});

newComputeSocket.start().catch(e => {
  console.error(e);
  newComputeSocket.terminate();
  exitHandler();
});

let terminations = 0;

process.on("SIGINT", () => {
  if (terminations > 0) {
    process.exit(1);
  }
  terminations++;
  newComputeSocket.terminate();
  exitHandler();
});
process.on("SIGTERM", () => {
  if (terminations > 0) {
    process.exit(1);
  }
  terminations++;
  newComputeSocket.terminate();
  exitHandler();
});
