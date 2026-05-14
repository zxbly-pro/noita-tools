import express, { static as expressStatic } from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { handleCompute, counts } from "./io/compute.mjs";

const PORT = process.env.PORT || 3001;
const app = express();

const handleConnection = (socket, io) => {
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
};

app.get("/api/cluster_stats", (req, res) => {
  res.json({
    hosts: counts.hosts,
    workers: counts.workers,
    appetite: counts.appetite,
  });
});

app.get("/api/session", (req, res) => {
  res.send("ok");
});

// Static files
app.use(expressStatic("build/", { maxAge: "1d" }));

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile("build/index.html", { root: "." });
});

const server = createServer(app);

const io = new SocketIOServer(server, {
  cors: { origin: "*" },
});

io.on("connection", socket => {
  handleConnection(socket, io);
});

server.listen(PORT, () => {
  console.log(`Noitool running at http://localhost:${PORT}`);
});
