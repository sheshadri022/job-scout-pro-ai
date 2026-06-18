import type { JobProvider, JobListing, FetchParams } from "./types";

export class JSearchProvider implements JobProvider {
  readonly name = "jsearch";
  readonly label = "JSearch (LinkedIn/Indeed/Glassdoor)";
  readonly requiresApiKey = true;

  async fetchJobs(params: FetchParams): Promise<JobListing[]> {
    if (!params.apiKey) {
      throw new Error("JSearch requires a RapidAPI key. Add it in Settings.");
    }

    const results: JobListing[] = [];
    const role = params.roles[0] ?? "software engineer";
    const location = params.locations[0] ?? "remote";
    const query = `${role} in ${location}`;

    const url = new URL("https://jsearch.p.rapidapi.com/search");
    url.searchParams.set("query", query);
    url.searchParams.set("num_pages", "2");
    url.searchParams.set("date_posted", "week");

    const response = await fetch(url.toString(), {
      headers: {
        "X-RapidAPI-Key": params.apiKey,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
      },
    });

    if (!response.ok) {
      throw new Error(`JSearch API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { data?: Array<{
      job_id: string;
      job_title: string;
      employer_name: string;
      job_city?: string;
      job_state?: string;
      job_country?: string;
      job_description?: string;
      job_apply_link?: string;
    }> };

    for (const job of (data.data ?? []).slice(0, params.limit)) {
      const locationParts = [job.job_city, job.job_state, job.job_country].filter(Boolean);
      results.push({
        externalId: job.job_id,
        title: job.job_title,
        company: job.employer_name,
        location: locationParts.join(", ") || "Remote",
        description: job.job_description ?? "",
        url: job.job_apply_link ?? "",
        source: "jsearch",
      });
    }

    return results;
  }
}
