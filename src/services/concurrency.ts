export const normalizeConcurrencyLimit = (value?: number) => {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.floor(value!));
};

export const getRecommendedConcurrency = (value?: number) => {
  return Math.max(1, Math.floor(normalizeConcurrencyLimit(value) / 2));
};

export const clampConcurrency = (value: number, max?: number) => {
  const normalizedMax = normalizeConcurrencyLimit(max);
  const normalizedValue = normalizeConcurrencyLimit(value);
  return Math.min(normalizedValue, normalizedMax);
};

export const getBrowserHardwareConcurrency = () => {
  if (typeof navigator === "undefined") {
    return 1;
  }

  return normalizeConcurrencyLimit(navigator.hardwareConcurrency);
};
