export interface JobListing {
  externalId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
}

export interface FetchParams {
  roles: string[];
  locations: string[];
  limit: number;
  apiKey?: string;
}

export interface JobProvider {
  readonly name: string;
  readonly label: string;
  readonly requiresApiKey: boolean;
  fetchJobs(params: FetchParams): Promise<JobListing[]>;
}
