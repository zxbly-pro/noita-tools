import express, { static as expressStatic } from "express";
import { createServer } from "http";
import { readFileSync } from "fs";
import { Server as SocketIOServer } from "socket.io";
import { handleCompute, counts } from "./io/compute.mjs";
import { logger } from "./logger.mjs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8"));
process.env.npm_package_version = pkg.version;

const PORT = process.env.PORT || 3001;
const BASE_PATH = process.env.BASE_PATH || "";
const app = express();

const handleConnection = (socket, io) => {
  logger.info("Socket connected", { id: socket.id });
  handleCompute(socket, io);

  socket.on("get_cluster_stats", callback => {
    if (callback) {
      callback({
        hosts: counts.hosts,
        workers: counts.workers,
        appetite: counts.appetite,
      });
    }
  });

  socket.on("disconnect", () => {
    logger.info("Socket disconnected", { id: socket.id });
  });
};

app.get(`${BASE_PATH}/api/cluster_stats`, (req, res) => {
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
  logger.info(`Noitool running at http://0.0.0.0:${PORT}${BASE_PATH || "/"}`);
  if (BASE_PATH) logger.info(`Base path: ${BASE_PATH}`);
  logger.info(`Compute pool: hosts=${counts.hosts}, workers=${counts.workers}`);
});
