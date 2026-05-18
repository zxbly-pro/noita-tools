import React, { FC, useContext, useEffect, useReducer, useCallback, useState } from "react";

import socketIOClient, { Socket } from "socket.io-client";

import { getBasePath } from "../utils";
import { SeedSolver } from "../../services/seedSolverHandler";
import useLocalStorage from "../../services/useLocalStorage";
import copy from "copy-to-clipboard";
import { randomUUID } from "../../services/helpers";

import Cookies from "js-cookie";

import { CallbackComputeHandler } from "../../services/compute/CallbackComputeHandler";
import { ChunkProvider, Status } from "../../services/compute/ChunkProvider";
import { SocketComputeProvider } from "../../services/compute/SocketComputeProvider";
import { ComputeSocket } from "../../services/compute/ComputeSocket";
import { SearchesItem, db } from "../../services/db";
import {
  clampConcurrency,
  getBrowserHardwareConcurrency,
  getRecommendedConcurrency,
} from "../../services/concurrency";

import { ruleReducer, initialRuleState } from "./ruleReducer";

const calculateJobHash = async (string: string) => {
  if (crypto?.subtle?.digest) {
    const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(string));
    const stringHash = Array.prototype.map.call(new Uint8Array(buf), x => ("00" + x.toString(16)).slice(-2)).join("");
    return stringHash;
  }
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    const char = string.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
};

const buildSearchJobKey = (
  config: SearchesItem["config"] | undefined,
  ruleTree: unknown,
  customSeedList: string,
) => {
  if (!config) {
    return "";
  }

  return JSON.stringify({
    from: config.from,
    to: config.to,
    maxResults: config.maxResults || 0,
    isNightmare: config.isNightmare || false,
    rules: ruleTree,
    customSeedList,
  });
};

const searchLog = (message: string, details?: Record<string, unknown>) => {
  console.info(`[搜索] ${message}`, details || {});
};

export const SearchContext = React.createContext<any>({});

const SearchContextProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSearchUUID, setCurrentSearchUUID] = useLocalStorage("search-current-search-uuid", "");
  const [searchInstance, setQuery] = useState<SearchesItem | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const [ruleTree, ruleDispatch] = useReducer(ruleReducer, initialRuleState);
  const [chunkProvider, setChunkProvider] = useState<ChunkProvider>();
  const [seedSolver, setSeedSolver] = useState(() => new SeedSolver(1, true));
  const [solverStatus, setSolverStatus] = useState<Status>();
  const [computeJobHash, setComputeJobHash] = useState("");

  const [unlockedSpells] = useLocalStorage<boolean[] | undefined>("unlocked-spells", undefined);
  const maxHardwareConcurrency = getBrowserHardwareConcurrency();
  const [useCores, setUseCores] = useLocalStorage("useCores", 1);
  const [concurrency, setConcurrency] = useLocalStorage(
    "search-max-concurrency",
    getRecommendedConcurrency(maxHardwareConcurrency),
  );
  const normalizedConcurrency = clampConcurrency(concurrency, maxHardwareConcurrency);
  const normalizedUseCores = clampConcurrency(useCores, normalizedConcurrency);

  const [customSeedList, setCustomSeedList] = useState("");
  const [solverReady, setSolverReady] = useState(false);

  // Cluster-related state
  const [statsSocket, setStatsSocket] = useState<Socket | null>(null);
  const [clusterState, setClusterState] = useState({ hosts: 0, workers: 0, appetite: 0 });
  const [clusterHelpAvailable, setClusterHelpAvailable] = useState(false);
  const [clusterHelpEnabled, setClusterHelpEnabled] = useState(false);
  const [clusterConnected, setClusterConnected] = useState(false);
  const [socketComputeProvider, setSocketComputeProvider] = useState<SocketComputeProvider>();
  const [callbackComputeHandler, setCallbackComputeHandler] = useState<CallbackComputeHandler>();
  const [computeVersionMismatch, setComputeVersionMismatch] = useState<boolean>(false);

  // Load query data when currentSearchUUID changes
  useEffect(() => {
    const loadQuery = async () => {
      if (!currentSearchUUID) return;

      setIsLoading(true);
      try {
        const newSearchInstance = await db.searches.get({ uuid: currentSearchUUID });
        if (newSearchInstance) {
          setQuery(newSearchInstance);
          ruleDispatch({ action: "import", data: newSearchInstance.config.rules });
        }
      } catch (error) {
        console.error("加载搜索配置失败:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuery();
  }, [currentSearchUUID]);

  useEffect(() => {
    const updateJobHash = async () => {
      const newJobHash = await calculateJobHash(buildSearchJobKey(searchInstance?.config, ruleTree, customSeedList));
      setComputeJobHash(newJobHash);
    };

    updateJobHash().catch(console.error);
  }, [searchInstance?.config, ruleTree, customSeedList]);

  useEffect(() => {
    if (concurrency !== normalizedConcurrency) {
      setConcurrency(normalizedConcurrency);
    }
  }, [concurrency, normalizedConcurrency, setConcurrency]);

  useEffect(() => {
    if (useCores !== normalizedUseCores) {
      setUseCores(normalizedUseCores);
    }
  }, [useCores, normalizedUseCores, setUseCores]);

  const updateSearchConfig = (config: Partial<SearchesItem["config"]>) => {
    if (searchInstance) {
      db.searches.update(searchInstance.id!, { config: { ...searchInstance.config, ...config } });
      setQuery({ ...searchInstance, config: { ...searchInstance.config, ...config } });
    }
  };

  useEffect(() => {
    if (!searchInstance) return;

    db.searches.update(searchInstance.id!, {
      config: { ...searchInstance.config, rules: btoa(JSON.stringify(ruleTree)) },
    });
  }, [ruleTree]);

  useEffect(() => {
    if (!searchInstance) return;

    ruleDispatch({
      action: "normalizeMode",
      data: { isNightmare: searchInstance.config.isNightmare || false },
    });
  }, [searchInstance?.config.isNightmare]);

  useEffect(() => {
    if (!searchInstance) return;

    const { from: seed, to: seedEnd } = searchInstance.config;

    const updateChunkProvider = () => {
      if (chunkProvider) {
        chunkProvider.config = {
          ...chunkProvider.config,
          searchFrom: seed,
          searchTo: seedEnd,
          jobName: computeJobHash,
        };
      } else {
        const newChunkProvider = new ChunkProvider({
          chunkSize: 100,
          searchFrom: seed,
          searchTo: seedEnd,
          jobName: computeJobHash,
          etaHistoryTimeConstant: 120,
          chunkProcessingTimeTarget: 5,
        });
        setChunkProvider(newChunkProvider);
      }
    };

    const debounceTimer = setTimeout(updateChunkProvider, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchInstance, computeJobHash, chunkProvider]);

  useEffect(() => {
    if (!searchInstance) return;

    const { maxResults, from: seed, to: seedEnd, isNightmare } = searchInstance.config;

    seedSolver.update({
      rules: ruleTree,
      currentSeed: seed,
      seedEnd: seedEnd,
      unlockedSpells,
      maxResults: maxResults || 0,
      isNightmare,
    });
  }, [searchInstance, ruleTree, seedSolver, unlockedSpells]);

  useEffect(() => {
    if (!chunkProvider || !ruleTree || !seedSolver) return;

    const newCallbackComputeHandler = new CallbackComputeHandler(
      setSolverStatus,
      chunkProvider,
      ruleTree,
      seedSolver,
      searchInstance?.config.isNightmare || false,
      searchInstance?.config.maxResults || 0,
    );

    setCallbackComputeHandler(newCallbackComputeHandler);

    return () => {
      newCallbackComputeHandler.destruct();
    };
  }, [
    seedSolver,
    ruleTree,
    chunkProvider,
    searchInstance?.config.isNightmare,
    searchInstance?.config.maxResults,
  ]);

  const handleMultithreading = useCallback(() => {
    searchLog("切换多线程", {
      previousWorkers: normalizedUseCores,
      nextWorkers: normalizedUseCores > 1 ? 1 : normalizedConcurrency,
      maxConcurrency: normalizedConcurrency,
    });
    setUseCores(normalizedUseCores > 1 ? 1 : normalizedConcurrency);
  }, [normalizedUseCores, normalizedConcurrency, setUseCores]);

  useEffect(() => {
    const newSeedSolver = new SeedSolver(normalizedUseCores, true);
    searchLog("种子求解器已创建", { workers: normalizedUseCores });
    setSeedSolver(newSeedSolver);
    setSolverReady(false);
    newSeedSolver.workersReadyPromise
      .then(() => {
        setSolverReady(true);
        searchLog("种子求解器已就绪", { workers: normalizedUseCores });
      })
      .catch(console.error);
    return () => {
      searchLog("种子求解器已销毁", { workers: normalizedUseCores });
      newSeedSolver.destroy().catch(console.error);
    };
  }, [normalizedUseCores]);

  const handleCustomSeedListChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const seedList = e.target.value
        .replace(/\D/g, ",")
        .split(",")
        .map(s => parseInt(s))
        .filter(s => !isNaN(s));
      chunkProvider?.setCustomSeedList(seedList);
      setCustomSeedList(seedList.join(", "));
    },
    [chunkProvider],
  );

  const toggleClusterHelp = useCallback(() => {
    setClusterHelpEnabled(prev => !prev);
  }, []);

  const initializeStatsSocket = useCallback(() => {
    try {
      return socketIOClient(window.location.origin, {
        path: `${getBasePath()}/socket.io/`,
        timeout: 3000,
        reconnectionAttempts: 1,
      });
    } catch (e) {}
  }, []);

  useEffect(() => {
    const socket = initializeStatsSocket();
    if (socket) {
      setStatsSocket(socket);
    }
    return () => {
      socket?.disconnect();
    };
  }, [initializeStatsSocket]);

  const getClusterStats = useCallback(() => {
    if (!statsSocket) return;

    statsSocket.emit("get_cluster_stats", (stats: any) => {
      setClusterState(stats);
      setClusterHelpAvailable(stats.workers > 0);
    });
  }, [statsSocket]);

  useEffect(() => {
    if (!statsSocket) return;

    const interval = setInterval(getClusterStats, 5000);
    getClusterStats();

    return () => clearInterval(interval);
  }, [getClusterStats, statsSocket]);

  useEffect(() => {
    if (!clusterHelpEnabled || !chunkProvider || !ruleTree) return;

    searchLog("已启用集群协助", {
      jobName: computeJobHash,
      isNightmare: searchInstance?.config.isNightmare || false,
    });

    const newComputeSocket = new ComputeSocket({
      url: window.location.origin,
      path: `${getBasePath()}/socket.io/`,
      sessionToken: Cookies.get("noitoolSessionToken"),
      version: APP_VERSION,
      onUpdate: () => {
        setClusterConnected(newComputeSocket.connected);
      },
      isHost: true,
    });

    newComputeSocket.on("compute:version_mismatch", () => {
      setComputeVersionMismatch(true);
      newComputeSocket.terminate();
    });

    const newSocketComputeProvider = new SocketComputeProvider(
      setSolverStatus,
      chunkProvider,
      ruleTree,
      newComputeSocket,
      searchInstance?.config.isNightmare || false,
    );
    setSocketComputeProvider(newSocketComputeProvider);

    return () => {
      searchLog("已禁用集群协助", {
        jobName: computeJobHash,
      });
      setClusterConnected(false);
      newComputeSocket.terminate();
      newSocketComputeProvider.destruct();
    };
  }, [
    chunkProvider,
    ruleTree,
    clusterHelpEnabled,
    searchInstance?.config.isNightmare,
  ]);

  const startCalculation = useCallback(async () => {
    searchLog("搜索已开始", {
      searchName: searchInstance?.config.name || "",
      from: searchInstance?.config.from,
      to: searchInstance?.config.to,
      maxResults: searchInstance?.config.maxResults || 0,
      isNightmare: searchInstance?.config.isNightmare || false,
      localWorkers: normalizedUseCores,
      clusterHelpEnabled,
      jobName: computeJobHash,
      customSeedCount: chunkProvider?.customSeeds?.length || 0,
    });
    socketComputeProvider?.start();
    callbackComputeHandler?.start().catch(console.error);
  }, [
    socketComputeProvider,
    callbackComputeHandler,
    searchInstance,
    normalizedUseCores,
    clusterHelpEnabled,
    computeJobHash,
    chunkProvider,
  ]);

  const stopCalculation = useCallback(async () => {
    searchLog("搜索停止中", {
      checked: chunkProvider?.progress || 0,
      results: chunkProvider?.results.size || 0,
      pendingChunks: chunkProvider?.unCommittedChunks.length || 0,
      orphanChunks: chunkProvider?.orphanChunks.length || 0,
      jobName: computeJobHash,
    });
    socketComputeProvider?.stop();
    if (!chunkProvider?.customSeeds?.length) {
      await callbackComputeHandler?.stop();
    }
  }, [socketComputeProvider, callbackComputeHandler, chunkProvider, computeJobHash]);

  const handleCopy = useCallback(() => {
    const seedList = chunkProvider?.results.size ? [...chunkProvider.results.values()] : [];
    copy(seedList.join(","));
  }, [chunkProvider]);

  const clearSearch = useCallback(() => {
    searchLog("搜索结果已清空", {
      previousChecked: chunkProvider?.progress || 0,
      previousResults: chunkProvider?.results.size || 0,
      jobName: computeJobHash,
    });
    setSolverStatus(undefined);
    if (chunkProvider) {
      chunkProvider.clear();
      if (searchInstance) {
        const { from: seed, to: seedEnd } = searchInstance.config;
        chunkProvider.config = {
          ...chunkProvider.config,
          searchFrom: seed,
          searchTo: seedEnd,
          jobName: computeJobHash,
        };
      }
    }
  }, [chunkProvider, searchInstance, computeJobHash]);

  const handleImportSearch = useCallback((str: string) => {
    try {
      const data = JSON.parse(atob(str));
      db.searches
        .add({
          ...data,
          uuid: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .catch(console.error);
    } catch (error) {
      console.error("导入搜索配置失败:", error);
    }
  }, []);

  const running = solverStatus?.running;
  const seedsChecked = chunkProvider?.progress || 0;
  const totalSeeds = searchInstance ? searchInstance.config.to - searchInstance.config.from : 0;
  const percentChecked = totalSeeds > 0 ? Math.floor((seedsChecked / totalSeeds) * 100) : 0;
  const seedsPerSecond = solverStatus?.rate;

  const contextValue = {
    isLoading,
    searchInstance,
    ruleTree,
    ruleDispatch,
    solverReady,
    chunkProvider,
    seedSolver,
    solverStatus,
    computeJobHash,
    unlockedSpells,
    useCores: normalizedUseCores,
    concurrency: normalizedConcurrency,
    customSeedList,
    clusterState,
    clusterHelpAvailable: clusterHelpAvailable && !computeVersionMismatch,
    clusterHelpEnabled,
    clusterConnected,
    computeVersionMismatch,
    running,
    seedsChecked,
    totalSeeds,
    percentChecked,
    seedsPerSecond,
    computeJobName: searchInstance?.config.name || "",
    seed: searchInstance?.config.from || 1,
    seedEnd: searchInstance?.config.to || Math.pow(2, 31),
    maxResults: searchInstance?.config.maxResults || 0,
    isNightmare: searchInstance?.config.isNightmare || false,
    updateSearchConfig,
    handleMultithreading,
    handleCustomSeedListChange,
    toggleClusterHelp,
    startCalculation,
    stopCalculation,
    handleCopy,
    clearSearch,
    handleImportSearch,
    setCurrentSearchUUID,
  };

  return <SearchContext.Provider value={contextValue}>{children}</SearchContext.Provider>;
};

export default SearchContextProvider;

export const useSearchContext = () => useContext(SearchContext);
