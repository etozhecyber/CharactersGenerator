
/**
 * Universal model capability detection system.
 *
 * Instead of hardcoding provider URLs, this module applies a chain of
 * "capability detectors" to raw model data from any OpenAI-compatible API.
 * Each detector knows one response format (NanoGPT, OpenRouter, etc.).
 * If at least one detector fires for at least one model in the list,
 * we can filter. Otherwise we show all models with a warning.
 *
 * To add support for a new provider format, just append a function
 * to STRUCTURED_OUTPUT_DETECTORS.
 */

export interface ModelInfo {
  id: string;
  name: string;
  ownedBy: string;
  supportsStructuredOutput: boolean | null;
}

export interface ProcessedModelsResult {
  models: ModelInfo[];
  isFiltered: boolean;
}

/**
 * Raw model object from the API. Standard OpenAI fields plus any
 * provider-specific extras that come through as unknown.
 */
interface RawModelData {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  [key: string]: unknown;
}

/**
 * A detector returns:
 *  - true   if the model definitely supports the capability
 *  - false  if the model definitely does NOT support the capability
 *  - null   if this detector cannot determine (unknown format)
 */
type CapabilityDetector = (raw: RawModelData) => boolean | null;

/**
 * Chain of detectors. Order does not matter — any match wins.
 * Extend this array to support new provider response formats.
 */
const STRUCTURED_OUTPUT_DETECTORS: CapabilityDetector[] = [
  // NanoGPT detailed mode:
  //   { capabilities: { structured_output: true } }
  (m: RawModelData): boolean | null => {
    const capabilities = m.capabilities;
    if (
      capabilities &&
      typeof capabilities === 'object' &&
      typeof (capabilities as Record<string, unknown>).structured_output === 'boolean'
    ) {
      return (capabilities as Record<string, unknown>).structured_output as boolean;
    }
    return null;
  },

  // OpenRouter format:
  //   { supported_parameters: ["structured_output", ...] }
  //   or { supported_parameters: ["structured_outputs", ...] }
  (m: RawModelData): boolean | null => {
    const params = m.supported_parameters;
    if (Array.isArray(params)) {
      return (
        params.includes('structured_output') ||
        params.includes('structured_outputs')
      );
    }
    return null;
  },
];

/**
 * Run all detectors against a single raw model object.
 * Returns true/false if any detector could determine the capability,
 * or null if no detector recognized the format.
 */
function detectStructuredOutput(raw: RawModelData): boolean | null {
  for (const detector of STRUCTURED_OUTPUT_DETECTORS) {
    const result = detector(raw);
    if (result !== null) return result;
  }
  return null;
}

/**
 * Process a list of raw model objects from any OpenAI-compatible API.
 *
 * 1. Map each raw model to ModelInfo with capability detection.
 * 2. If at least one model has known capability info → filter to
 *    only those that support structured output.
 * 3. If no model has capability info → return all + isFiltered=false.
 */
export function processModels(rawModels: RawModelData[]): ProcessedModelsResult {
  const mapped: ModelInfo[] = rawModels.map((raw) => ({
    id: raw.id,
    name:
      (typeof raw.name === 'string' ? raw.name : null) || raw.id,
    ownedBy: raw.owned_by || '',
    supportsStructuredOutput: detectStructuredOutput(raw),
  }));

  const hasCapabilityInfo = mapped.some(
    (m) => m.supportsStructuredOutput !== null,
  );

  if (hasCapabilityInfo) {
    return {
      models: mapped.filter((m) => m.supportsStructuredOutput === true),
      isFiltered: true,
    };
  }

  return { models: mapped, isFiltered: false };
}
