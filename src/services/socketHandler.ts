import socketIOClient, { Socket } from "socket.io-client";

export interface SocketHandlerConfig {
  url?: string;
  path?: string;

  onUpdate?: () => void;
}

class SocketHandler extends EventTarget {
  ready = false;
  connected = false;

  io: Socket;

  onUpdate: () => void;

  constructor(config: SocketHandlerConfig) {
    super();
    this.io = socketIOClient(config.url as any, config.path ? { path: config.path } : undefined);
    if (config.onUpdate) {
      this.onUpdate = config.onUpdate;
    } else {
      this.onUpdate = () => {};
    }
    this.configIO();
  }

  async waitForConnection() {
    return new Promise<void>(res => {
      res();
    });
  }

  configIO(): void {
    this.io.on("connect", () => {
      this.ready = true;
      this.connected = true;
      this.onUpdate();
    });

    this.io.on("disconnect", reason => {
      console.log("Socket 已断开:", reason);
      this.connected = false;
      this.onUpdate();
    });
  }

  on(e: string, cb): void {
    this.io.on(e, cb);
  }

  close() {
    this.io.close();
  }
}

export default SocketHandler;
