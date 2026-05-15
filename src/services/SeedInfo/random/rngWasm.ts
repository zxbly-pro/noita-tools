import type { IRandomModule } from "./random";
import { loadRngWasm, type RngWasmExports } from "../wasm/compiled";
import type { WasmSource } from "../wasm/loadWasm";

export const loadRngModule = (source: WasmSource) => loadRngWasm(source);

class ReferenceRng {
  world_seed = 0;
  Seed = 0;

  constructor(seed = 0) {
    this.world_seed = seed >>> 0;
    this.Seed = seed | 0;
  }

  private bits(value: number) {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setFloat64(0, value, true);
    return view.getBigUint64(0, true);
  }

  private setRandomSeedHelper(r: number) {
    const e = this.bits(r) & 0x7fffffffffffffffn;
    const c = r < 0 ? -1n : 1n;
    const f = (e & 0xfffffffffffffn) | 0x0010000000000000n;
    const g = 0x433n - (e >> 0x34n);
    const h = f >> g;
    const cmp = 0x433 < Number((((e >> 0x20n) & 0xffffffffn) >> 0x14n)) ? 1 : 0;
    const j = (~cmp + 1) >>> 0;
    const ju = BigInt(j);
    const a = (ju << 0x20n) | ju;
    const inner = (~a & h) | ((f << 0xdn) & a);
    const b = BigInt.asIntN(64, inner) * c;
    return Number(BigInt.asUintN(32, b));
  }

  private setRandomSeedHelper2(a: number, b: number, ws: number) {
    let uVar2 = (((a - b) - ws) ^ (ws >>> 0xd)) >>> 0;
    let uVar1 = (((b - uVar2) - ws) ^ (uVar2 << 8)) >>> 0;
    let uVar3 = (((ws - uVar2) - uVar1) ^ (uVar1 >>> 0xd)) >>> 0;
    uVar2 = (((uVar2 - uVar1) - uVar3) ^ (uVar3 >>> 0xc)) >>> 0;
    uVar1 = (((uVar1 - uVar2) - uVar3) ^ (uVar2 << 0x10)) >>> 0;
    uVar3 = (((uVar3 - uVar2) - uVar1) ^ (uVar1 >>> 5)) >>> 0;
    uVar2 = (((uVar2 - uVar1) - uVar3) ^ (uVar3 >>> 3)) >>> 0;
    uVar1 = (((uVar1 - uVar2) - uVar3) ^ (uVar2 << 10)) >>> 0;
    return (((uVar3 - uVar2) - uVar1) ^ (uVar1 >>> 0xf)) >>> 0;
  }

  setWorldSeed(seed: number) {
    this.world_seed = seed >>> 0;
    this.Seed = seed | 0;
  }

  setRandomSeed(x: number, y: number) {
    const ws = this.world_seed >>> 0;
    const a = (ws ^ 0x93262e6f) >>> 0;
    const b = a & 0xfff;
    const c = (a >>> 0xc) & 0xfff;

    const x_ = x + b;
    let y_ = y + c;

    let r = x_ * 134217727.0;
    const e = this.setRandomSeedHelper(r);

    if (102400.0 <= Math.abs(y_) || Math.abs(x_) <= 1.0) {
      r = y_ * 134217727.0;
    } else {
      let y__ = y_ * 3483.328;
      y__ += e;
      y_ *= y__;
      r = y_;
    }

    const f = this.setRandomSeedHelper(r);
    const g = this.setRandomSeedHelper2(e, f, ws);

    let s = g;
    s /= 4294967295.0;
    s *= 2147483639.0;
    s += 1.0;
    this.Seed = s | 0;

    this.next();

    let h = ws & 3;
    while (h > 0) {
      this.next();
      h--;
    }
  }

  next() {
    let v4 = (this.Seed * 0x41a7 + (((this.Seed / 0x1f31d) | 0) * -0x7fffffff)) | 0;
    if (v4 < 0) {
      v4 += 0x7fffffff;
    }
    this.Seed = v4;
    return this.Seed / 0x7fffffff;
  }

  random(a: number, b: number) {
    let v4 = (this.Seed * 0x41a7 + (((this.Seed / 0x1f31d) | 0) * -0x7fffffff)) | 0;
    if (v4 < 0) {
      v4 += 0x7fffffff;
    }
    this.Seed = v4;
    return a + (((b - a + 1) * this.Seed * 4.656612875e-10) | 0);
  }

  proceduralRandomf(x: number, y: number, a: number, b: number) {
    this.setRandomSeed(x, y);
    return a + (b - a) * this.next();
  }

  proceduralRandomi(x: number, y: number, a: number, b: number) {
    this.setRandomSeed(x, y);
    return this.random(a, b);
  }

  private getDistribution(mean: number, sharpness: number, baseline: number) {
    let i = 0;
    do {
      const r1 = this.next();
      const r2 = this.next();
      const div = Math.abs(r1 - mean);
      if (r2 < (1.0 - div) * baseline) {
        return r1;
      }
      if (div < 0.5) {
        const v11 = Math.sin(((0.5 - mean) + r1) * 3.1415);
        const v12 = Math.pow(v11, sharpness);
        if (v12 > r2) {
          return r1;
        }
      }
      i++;
    } while (i < 100);
    return this.next();
  }

  randomDistribution(min: number, max: number, mean: number, sharpness: number) {
    if (sharpness === 0) {
      return this.random(min, max);
    }

    const adjMean = (mean - min) / (max - min);
    const v7 = this.getDistribution(adjMean, sharpness, 0.005);
    const delta = roundHalfToEven((max - min) * v7);
    return min + delta;
  }

  randomDistributionf(min: number, max: number, mean: number, sharpness: number) {
    if (sharpness === 0.0) {
      const r = this.next();
      return r * (max - min) + min;
    }
    const adjMean = (mean - min) / (max - min);
    return min + (max - min) * this.getDistribution(adjMean, sharpness, 0.005);
  }
}

const roundHalfToEven = (value: number) => {
  const floor = Math.floor(value);
  const diff = value - floor;
  if (diff < 0.5) {
    return floor;
  }
  if (diff > 0.5) {
    return floor + 1;
  }
  return floor % 2 === 0 ? floor : floor + 1;
};

export const withRngWasm = (module: IRandomModule, rngWasm: RngWasmExports): IRandomModule => {
  const setMapWorldSeed = module.SetWorldSeed.bind(module);
  const rng = new ReferenceRng();
  const random = (...args: number[]) => {
    if (args.length === 0) {
      return rng.next();
    }
    if (args.length === 1) {
      return rng.random(0, roundHalfToEven(args[0]));
    }
    return Number.isInteger(args[0]) && Number.isInteger(args[1])
      ? rng.random(args[0], args[1])
      : rng.random(roundHalfToEven(args[0]), roundHalfToEven(args[1]));
  };

  module.Random = random as IRandomModule["Random"];
  module.Randomf = () => rng.next();
  module.SeededRandom = (seed: number, x: number, y: number) => {
    const local = new ReferenceRng(seed);
    local.setRandomSeed(x, y);
    return local.next();
  };
  module.RandomDistribution = (min: number, max: number, mean: number, sharpness = 0) =>
    rng.randomDistribution(min, max, mean, sharpness);
  module.RandomDistributionf = (min: number, max: number, mean: number, sharpness = 0) =>
    rng.randomDistributionf(min, max, mean, sharpness);
  module.ProceduralRandomf = (x: number, y: number, min: number, max: number) => rng.proceduralRandomf(x, y, min, max);
  module.ProceduralRandomi = (x: number, y: number, min: number, max: number) =>
    rng.proceduralRandomi(x, y, roundHalfToEven(min), roundHalfToEven(max));
  module.SetRandomSeed = (x: number, y: number) => rng.setRandomSeed(x, y);
  module.SetWorldSeed = (seed: number) => {
    setMapWorldSeed(seed);
    rng.setWorldSeed(seed);
  };
  module.GetWorldSeed = () => rng.world_seed;
  module.RoundHalfOfEven = roundHalfToEven;

  return module;
};
