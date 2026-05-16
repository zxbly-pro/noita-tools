import express, { static as expressStatic } from "express";
import { createServer } from "http";
import { readFileSync } from "fs";
import { Server as SocketIOServer } from "socket.io";
import {
  handleCompute,
  counts,
  markSocketConnection,
  markSocketDisconnect,
  getSocketSummary,
  getSocketConnectionDuration,
  getComputeSnapshot,
} from "./io/compute.mjs";
import { logger } from "./logger.mjs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8"));
process.env.npm_package_version = pkg.version;

const PORT = process.env.PORT || 3001;
const BASE_PATH = process.env.BASE_PATH || "";
const app = express();
const IDLE_CLUSTER_REQUEST_LOG_INTERVAL_MS = 60_000;
let lastIdleSocketClusterStatsLogAt = 0;
let lastIdleHttpClusterStatsLogAt = 0;

const shouldLogClusterStatsRequest = (snapshot, lastLoggedAt) => {
  const idle = snapshot.counts.hosts === 0
    && snapshot.counts.workers === 0
    && snapshot.pendingJobs.length === 0;

  if (!idle) {
    return true;
  }

  return Date.now() - lastLoggedAt >= IDLE_CLUSTER_REQUEST_LOG_INTERVAL_MS;
};

app.use((req, res, next) => {
  const startedAt = Date.now();
  const forwardedFor = req.headers["x-forwarded-for"];
  const remoteAddress =
    (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(",")[0]?.trim()) ||
    req.socket?.remoteAddress ||
    null;

  res.on("finish", () => {
    logger.http("HTTP 请求", {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      remoteAddress,
      userAgent: req.headers["user-agent"] || null,
      referer: req.headers.referer || null,
    });
  });

  next();
});

const handleConnection = (socket, io) => {
  const handshake = socket.handshake || {};
  const headers = handshake.headers || {};
  const remoteAddress =
    handshake.address ||
    socket.request?.socket?.remoteAddress ||
    socket.conn?.remoteAddress ||
    null;
  const userAgent = headers["user-agent"] || null;
  const transport = socket.conn?.transport?.name || null;
  const namespace = socket.nsp?.name || null;
  const query = handshake.query || {};

  markSocketConnection(socket, {
    remoteAddress,
    userAgent,
    transport,
    namespace,
  });
  logger.info("Socket 已连接", {
    ...getSocketSummary(socket.id),
    query,
    counts: { ...counts },
  });
  handleCompute(socket, io);

  socket.on("get_cluster_stats", callback => {
    const snapshot = getComputeSnapshot();
    if (shouldLogClusterStatsRequest(snapshot, lastIdleSocketClusterStatsLogAt)) {
      logger.debug("Socket 请求集群状态", {
        ...getSocketSummary(socket.id),
        counts: { ...counts },
        compute: snapshot,
      });
      if (snapshot.counts.hosts === 0 && snapshot.counts.workers === 0 && snapshot.pendingJobs.length === 0) {
        lastIdleSocketClusterStatsLogAt = Date.now();
      }
    }
    if (callback) {
      callback({
        hosts: counts.hosts,
        workers: counts.workers,
        appetite: counts.appetite,
      });
    }
  });

  socket.on("disconnect", reason => {
    markSocketDisconnect(socket.id, reason);
    const summary = getSocketSummary(socket.id);
    logger.info("Socket 已断开", {
      ...summary,
      disconnectReason: reason,
      connectionDurationMs: getSocketConnectionDuration(socket.id),
      counts: { ...counts },
      compute: getComputeSnapshot().counts,
    });
  });
};

app.get(`${BASE_PATH}/api/cluster_stats`, (req, res) => {
  const snapshot = getComputeSnapshot();
  if (shouldLogClusterStatsRequest(snapshot, lastIdleHttpClusterStatsLogAt)) {
    logger.debug("HTTP 请求集群状态", {
      remoteAddress: req.socket?.remoteAddress || null,
      counts: { ...counts },
      compute: snapshot,
    });
    if (snapshot.counts.hosts === 0 && snapshot.counts.workers === 0 && snapshot.pendingJobs.length === 0) {
      lastIdleHttpClusterStatsLogAt = Date.now();
    }
  }
  res.json({
    hosts: counts.hosts,
    workers: counts.workers,
    appetite: counts.appetite,
  });
});

app.get(`${BASE_PATH}/api/session`, (req, res) => {
  res.send("ok");
});

// Static files
app.use(BASE_PATH || "/", expressStatic("build/", { maxAge: "1d" }));

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile("build/index.html", { root: "." });
});

const server = createServer(app);

const io = new SocketIOServer(server, {
  cors: { origin: "*" },
  path: `${BASE_PATH}/socket.io/`,
});

io.on("connection", socket => {
  handleConnection(socket, io);
});

server.listen(PORT, () => {
  logger.info(`Noitool 已启动: http://0.0.0.0:${PORT}${BASE_PATH || "/"}`);
  if (BASE_PATH) logger.info(`基础路径: ${BASE_PATH}`);
  logger.info(`计算池状态: hosts=${counts.hosts}, workers=${counts.workers}`);
});
