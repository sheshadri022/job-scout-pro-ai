import type { JobProvider } from "./types";
import { JSearchProvider } from "./jsearch";
import { AdzunaProvider } from "./adzuna";
import { MockProvider } from "./mock";

export type { JobProvider, JobListing, FetchParams } from "./types";

const PROVIDERS: Record<string, JobProvider> = {
  jsearch: new JSearchProvider(),
  adzuna: new AdzunaProvider(),
  mock: new MockProvider(),
};

export function getProvider(name: string): JobProvider {
  const provider = PROVIDERS[name];
  if (!provider) {
    throw new Error(`Unknown provider: "${name}". Available: ${Object.keys(PROVIDERS).join(", ")}`);
  }
  return provider;
}

export function listProviders(): Array<{ name: string; label: string; requiresApiKey: boolean }> {
  return Object.values(PROVIDERS).map(p => ({
    name: p.name,
    label: p.label,
    requiresApiKey: p.requiresApiKey,
  }));
}
