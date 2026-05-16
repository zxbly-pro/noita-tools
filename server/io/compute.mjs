import { logger, formatLogTime } from "../logger.mjs";

export const counts = {
  hosts: 0,
  workers: 0,
  appetite: 0,
};

const sockets = {
  hosts: new Set(),
  workers: new Set(),
};
const IDLE_SNAPSHOT_LOG_INTERVAL_MS = 300_000;
let lastSnapshotSignature = "";
let lastIdleSnapshotLogAt = 0;

const socketMeta = new Map();

const ensureSocketMeta = socketId => {
  if (!socketMeta.has(socketId)) {
    socketMeta.set(socketId, {
      socketId,
      role: null,
      appetite: 0,
      version: null,
      connectedAt: null,
      connectedAtMs: null,
      registeredAt: null,
      registeredAtMs: null,
      lastSeenAt: null,
      lastSeenAtMs: null,
      disconnectReason: null,
      remoteAddress: null,
      userAgent: null,
      transport: null,
      namespace: null,
    });
  }
  return socketMeta.get(socketId);
};

const summarizeSocket = socketId => {
  const meta = socketMeta.get(socketId);
  if (!meta) {
    return { socketId };
  }

  return {
    socketId,
    role: meta.role,
    appetite: meta.appetite,
    version: meta.version,
    connectedAt: meta.connectedAt,
    registeredAt: meta.registeredAt,
    lastSeenAt: meta.lastSeenAt,
    disconnectReason: meta.disconnectReason,
    remoteAddress: meta.remoteAddress,
    transport: meta.transport,
    namespace: meta.namespace,
  };
};

export const markSocketConnection = (socket, extra = {}) => {
  const meta = ensureSocketMeta(socket.id);
  const now = new Date();
  Object.assign(meta, {
    connectedAt: formatLogTime(now),
    connectedAtMs: now.getTime(),
    lastSeenAt: formatLogTime(now),
    lastSeenAtMs: now.getTime(),
    disconnectReason: null,
    remoteAddress: extra.remoteAddress ?? meta.remoteAddress,
    userAgent: extra.userAgent ?? meta.userAgent,
    transport: extra.transport ?? meta.transport,
    namespace: extra.namespace ?? meta.namespace,
  });
};

export const markSocketDisconnect = (socketId, reason) => {
  const meta = socketMeta.get(socketId);
  if (!meta) {
    return;
  }
  const now = new Date();
  meta.lastSeenAt = formatLogTime(now);
  meta.lastSeenAtMs = now.getTime();
  meta.disconnectReason = reason;
};

export const getSocketSummary = socketId => summarizeSocket(socketId);
export const getSocketConnectionDuration = socketId => {
  const meta = socketMeta.get(socketId);
  if (!meta?.connectedAtMs) {
    return undefined;
  }
  return Date.now() - meta.connectedAtMs;
};

export const getComputeSnapshot = () => ({
  counts: { ...counts },
  hostIds: [...sockets.hosts],
  workerIds: [...sockets.workers],
  hosts: [...sockets.hosts].map(summarizeSocket),
  workers: [...sockets.workers].map(summarizeSocket),
  pendingJobs: Object.entries(pendingJobs).map(([jobKey, job]) => ({
    jobKey,
    ...job,
    durationMs: Date.now() - job.start,
  })),
});

const isIdleSnapshot = snapshot =>
  snapshot.counts.hosts === 0
  && snapshot.counts.workers === 0
  && snapshot.pendingJobs.length === 0;

const shouldLogSnapshot = snapshot => {
  const signature = JSON.stringify({
    counts: snapshot.counts,
    hostIds: snapshot.hostIds,
    workerIds: snapshot.workerIds,
    pendingJobs: snapshot.pendingJobs.map(job => job.jobKey),
  });
  const now = Date.now();
  const idle = isIdleSnapshot(snapshot);

  if (signature !== lastSnapshotSignature) {
    lastSnapshotSignature = signature;
    if (idle) {
      lastIdleSnapshotLogAt = now;
    }
    return true;
  }

  if (idle && now - lastIdleSnapshotLogAt >= IDLE_SNAPSHOT_LOG_INTERVAL_MS) {
    lastIdleSnapshotLogAt = now;
    return true;
  }

  return !idle;
};

const registerSocket = (socketId, type, appetite = 0) => {
  if (!sockets[type].has(socketId)) {
    counts[type]++;
    counts.appetite += appetite;
    sockets[type].add(socketId);
  }
};

const unregisterSocket = (socketId, type, appetite = 0) => {
  if (sockets[type].has(socketId)) {
    counts[type]--;
    counts.appetite -= appetite;
    sockets[type].delete(socketId);
  }
};

const pingLambda = async () => {
  if (!process.env.START_SEARCH_CLUSTER_LAMBDA_ENDPOINT) {
    return;
  }

  try {
    await fetch(process.env.START_SEARCH_CLUSTER_LAMBDA_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({
        hosts: counts.hosts,
        cluster: process.env.START_SEARCH_CLUSTER_LAMBDA_CLUSTER,
        bearer: process.env.START_SEARCH_CLUSTER_LAMBDA_BEARER,
      }),
      headers: { "Content-Type": "application/json" },
    });
    logger.info(
      "已 Ping Lambda",
      process.env.START_SEARCH_CLUSTER_LAMBDA_ENDPOINT,
      counts.hosts,
      process.env.START_SEARCH_CLUSTER_LAMBDA_CLUSTER,
    );
  } catch (error) {
    logger.error("Ping Lambda 失败", error);
  }
};

setInterval(() => {
  const snapshot = getComputeSnapshot();
  if (shouldLogSnapshot(snapshot)) {
    logger.debug("计算节点 Socket 状态", snapshot, isIdleSnapshot(snapshot) ? { mode: "local-only-idle" } : undefined);
  }
  if (counts.hosts > 0) {
    pingLambda();
  }
}, 10000);

// Make a function be called n times with backoff. ex: 0, 10, 100, 1000, 10000 seconds from now
const echoedCall = (fn, count, backoff) => {
  if (count === 0) {
    return;
  }
  fn();
  setTimeout(() => echoedCall(fn, count - 1, backoff * 10), backoff * 1000);
};

const randomFromArray = arr => arr[Math.floor(Math.random() * arr.length)];

// Track the time it takes to compute a job
const pendingJobs = {};

export const handleCompute = (socket, io) => {
  let computeAppetite = 0;

  const register = async (type, config, cb) => {
    if (config.version !== process.env.npm_package_version) {
      const meta = ensureSocketMeta(socket.id);
      meta.version = config.version || null;
      const now = new Date();
      meta.lastSeenAt = formatLogTime(now);
      meta.lastSeenAtMs = now.getTime();
      logger.warn("计算节点版本不匹配", {
        ...summarizeSocket(socket.id),
        expectedVersion: process.env.npm_package_version,
        receivedVersion: config.version,
        requestedRole: type.slice(0, -1),
        appetite: config.appetite || 0,
      });
      socket.emit("compute:version_mismatch", {
        serverVersion: process.env.npm_package_version,
        clientVersion: config.version,
      });
      return;
    }

    computeAppetite = config.appetite || 0;
    const meta = ensureSocketMeta(socket.id);
    meta.role = type.slice(0, -1);
    meta.appetite = computeAppetite;
    meta.version = config.version || null;
    const now = new Date();
    meta.registeredAt = formatLogTime(now);
    meta.registeredAtMs = now.getTime();
    meta.lastSeenAt = formatLogTime(now);
    meta.lastSeenAtMs = now.getTime();
    meta.transport = socket.conn?.transport?.name || meta.transport;
    registerSocket(socket.id, type, computeAppetite);

    logger.info("计算节点已注册", {
      ...summarizeSocket(socket.id),
      counts: { ...counts },
    });
    cb("ok");
  };

  socket.on("compute:host:register", (config, cb) => register("hosts", config, cb));
  socket.on("compute:host:unregister", () => {
    logger.info("计算 Host 已注销", {
      ...summarizeSocket(socket.id),
      countsBefore: { ...counts },
    });
    unregisterSocket(socket.id, "hosts");
  });

  socket.on("compute:worker:register", (config, cb) => register("workers", config, cb));
  socket.on("compute:worker:unregister", () => {
    logger.info("计算 Worker 已注销", {
      ...summarizeSocket(socket.id),
      countsBefore: { ...counts },
    });
    unregisterSocket(socket.id, "workers", computeAppetite);
  });

  socket.on("compute:workers", async cb => {
    cb(counts.workers);
  });

  socket.on("compute:need_job", async (appetite, cb) => {
    const meta = ensureSocketMeta(socket.id);
    const now = new Date();
    meta.lastSeenAt = formatLogTime(now);
    meta.lastSeenAtMs = now.getTime();
    // Pick a random host
    const hostId = randomFromArray([...sockets.hosts]);
    if (!hostId) {
      logger.debug("当前没有可用的计算 Host", {
        workerId: socket.id,
        appetite,
        counts: { ...counts },
      });
      cb();
      return;
    }

    const host = io.sockets.sockets.get(hostId);
    if (!host) {
      logger.warn("选中的计算 Host Socket 不存在", {
        workerId: socket.id,
        hostId,
        appetite,
        counts: { ...counts },
      });
      cb();
      return;
    }

    host.emit("compute:get_job", appetite, data => {
      if (!data || data.done) {
        cb(data);
        return;
      }

      data.hostId = hostId;
      pendingJobs[`${hostId}:${data.chunkId}`] = {
        hostId,
        workerId: socket.id,
        appetite,
        jobName: data.jobName,
        start: Date.now(),
      };
      logger.debug("已分配计算任务", {
        workerId: socket.id,
        hostId,
        appetite,
        chunkId: data.chunkId,
        jobName: data.jobName,
      });
      cb(data);
    });
  });

  socket.on("compute:done", async ({ hostId, result, chunkId }) => {
    const host = io.sockets.sockets.get(hostId);
    if (!host) {
      logger.warn("计算任务完成时目标 Host Socket 不存在", {
        workerId: socket.id,
        hostId,
        chunkId,
      });
      return;
    }

    const pendingJob = pendingJobs[`${hostId}:${chunkId}`];
    delete pendingJobs[`${hostId}:${chunkId}`];
    const meta = ensureSocketMeta(socket.id);
    const now = new Date();
    meta.lastSeenAt = formatLogTime(now);
    meta.lastSeenAtMs = now.getTime();
    logger.debug("计算任务已完成", {
      workerId: socket.id,
      hostId,
      chunkId,
      jobName: pendingJob?.jobName,
      durationMs: pendingJob ? Date.now() - pendingJob.start : undefined,
      resultCount: Array.isArray(result?.res) ? result.res.length : undefined,
    });
    host.emit("compute:done", { result, chunkId, jobName: pendingJob?.jobName });
  });

  socket.on("disconnect", reason => {
    markSocketDisconnect(socket.id, reason);
    unregisterSocket(socket.id, "hosts");
    unregisterSocket(socket.id, "workers", computeAppetite);
  });
};
