import { Server as SocketIOServer } from "socket.io";

import { handleLiveSeed } from "./liveSeed.mjs";
import { handleCompute, counts } from "./compute.mjs";
import { rooms } from "./rooms.mjs";

const corsDomains = [
  "www.zxbly.com:4430",
  "zxbly.com:4430",
  "www.zxbly.com:3001",
  "www.zxbly.com:3000",
  "zxbly.com:3001",
  "zxbly.com:300",
  "localhost:3000",
  "localhost:3001",
  "127.0.0.1:3000",
  "127.0.0.1:3001",
];
const corsSchemes = ["http://", "https://", "ws://", "wss://", ""];
const allowedCORS = corsSchemes.flatMap(ext => corsDomains.map(d => ext + d));

const handleConnection = (socket, io) => {
  handleLiveSeed(socket, io);
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

const makeIO = (server, app) => {
  app.get("/api/cluster_stats", (req, res) => {
    res.json({
      hosts: counts.hosts,
      workers: counts.workers,
      appetite: counts.appetite,
    });
  });

  const io = new SocketIOServer(server, {
    cors: {
      origin: function (origin, callback) {
        if (allowedCORS.indexOf(origin) !== -1 || !origin) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
    },
  });

  io.engine.on("connection_error", err => {
    console.log(err);
  });

  io.on("connection", socket => {
    console.log("New connection");
    handleConnection(socket, io);
  });

  io.of("/").adapter.on("delete-room", room => {
    // Room is empty
    rooms.delete(room);
  });
};

export default makeIO;
