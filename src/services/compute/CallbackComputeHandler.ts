import { BaseComputeProvider } from "./BaseComputeProvider";
import { ChunkProvider, Status } from "./ChunkProvider";
import { ILogicRules } from "../../services/SeedInfo/infoHandler/IRule";
import { SeedSolver } from "../seedSolverHandler";

export class CallbackComputeHandler extends BaseComputeProvider {
  completedChunks = 0;

  constructor(
    public onUpdate: (status: Status) => void,
    public chunkProvider: ChunkProvider,
    public rules: ILogicRules,
    public seedSolver: SeedSolver,
    public isNightmare: boolean = false,
    public maxResults: number = 0,
  ) {
    super(onUpdate, chunkProvider, rules, isNightmare);
  }

  async start() {
    if (this.running) {
      return;
    }
    this.running = true;
    this.completedChunks = 0;
    console.info("[搜索] 本地回调计算已开始", {
      from: this.chunkProvider.config.searchFrom,
      to: this.chunkProvider.config.searchTo,
      jobName: this.chunkProvider.config.jobName || "",
      isNightmare: this.isNightmare,
      maxResults: this.maxResults,
      workers: this.seedSolver.workerList.length,
    });
    while (this.running) {
      if (this.maxResults > 0 && this.chunkProvider.results.size >= this.maxResults) {
        this.running = false;
        console.info("[搜索] 本地回调计算因达到最大结果数而停止", {
          completedChunks: this.completedChunks,
          results: this.chunkProvider.results.size,
          checked: this.chunkProvider.progress,
        });
        this.onUpdate(this.getStatus());
        return;
      }
      const chunk = this.chunkProvider.getNextChunk(this.seedSolver.workerList.length);
      if (!chunk) {
        this.running = false;
        console.info("[搜索] 本地回调计算已完成", {
          completedChunks: this.completedChunks,
          results: this.chunkProvider.results.size,
          checked: this.chunkProvider.progress,
        });
        this.onUpdate(this.getStatus());
        return;
      }
      console.debug("[搜索] 本地分块开始计算", {
        chunkId: chunk.chunkId,
        from: chunk.from,
        to: chunk.to,
        appetite: chunk.appetite,
      });
      const results = await this.seedSolver.searchChunk(chunk.from, chunk.to, this.rules, this.isNightmare);
      this.chunkProvider.commitChunk(chunk.chunkId, results);
      this.completedChunks += 1;
      if (results.length > 0 || this.completedChunks <= 3 || this.completedChunks % 25 === 0) {
        console.info("[搜索] 本地分块计算完成", {
          chunkId: chunk.chunkId,
          from: chunk.from,
          to: chunk.to,
          resultCount: results.length,
          totalResults: this.chunkProvider.results.size,
          checked: this.chunkProvider.progress,
          completedChunks: this.completedChunks,
        });
      }
      this.onUpdate(this.getStatus());
      if (this.maxResults > 0 && this.chunkProvider.results.size >= this.maxResults) {
        this.running = false;
        console.info("[搜索] 本地回调计算达到最大结果数", {
          completedChunks: this.completedChunks,
          results: this.chunkProvider.results.size,
          checked: this.chunkProvider.progress,
        });
        this.onUpdate(this.getStatus());
        return;
      }
    }
  }

  destruct() {
    if (this.running) {
      console.info("[搜索] 本地回调计算在运行中被销毁", {
        checked: this.chunkProvider.progress,
        results: this.chunkProvider.results.size,
      });
    }
    this.stop();
  }
}
