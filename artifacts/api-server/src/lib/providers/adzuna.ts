import type { JobProvider, JobListing, FetchParams } from "./types";

export class AdzunaProvider implements JobProvider {
  readonly name = "adzuna";
  readonly label = "Adzuna";
  readonly requiresApiKey = true;

  async fetchJobs(_params: FetchParams): Promise<JobListing[]> {
    throw new Error("Adzuna integration coming soon. Use JSearch for now.");
  }
}
