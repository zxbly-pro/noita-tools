import { BaseComputeProvider } from "./BaseComputeProvider";
import { ChunkProvider, Status } from "./ChunkProvider";
import { ILogicRules } from "../../services/SeedInfo/infoHandler/IRule";
import { SeedSolver } from "../seedSolverHandler";

export class CallbackComputeHandler extends BaseComputeProvider {
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
    while (this.running) {
      if (this.maxResults > 0 && this.chunkProvider.results.size >= this.maxResults) {
        this.running = false;
        this.onUpdate(this.getStatus());
        return;
      }
      const chunk = this.chunkProvider.getNextChunk(this.seedSolver.workerList.length);
      if (!chunk) {
        this.running = false;
        this.onUpdate(this.getStatus());
        return;
      }
      const results = await this.seedSolver.searchChunk(chunk.from, chunk.to, this.rules, this.isNightmare);
      this.chunkProvider.commitChunk(chunk.chunkId, results);
      this.onUpdate(this.getStatus());
      if (this.maxResults > 0 && this.chunkProvider.results.size >= this.maxResults) {
        this.running = false;
        this.onUpdate(this.getStatus());
        return;
      }
    }
  }

  destruct() {
    this.stop();
  }
}
