import type { JobProvider, JobListing, FetchParams } from "./types";

const MOCK_JOBS: Omit<JobListing, "source">[] = [
  {
    externalId: "mock-001",
    title: "Senior Software Engineer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA (Remote)",
    description: "We are looking for a Senior Software Engineer to join our platform team. You will build scalable microservices using Node.js, TypeScript, and PostgreSQL. Requirements: 5+ years experience, strong TypeScript skills, experience with AWS, Docker, CI/CD pipelines, REST API design, and agile development practices.",
    url: "https://example.com/jobs/001",
  },
  {
    externalId: "mock-002",
    title: "Full Stack Developer",
    company: "StartupXYZ",
    location: "New York, NY (Hybrid)",
    description: "Join our fast-growing startup! We need a Full Stack Developer proficient in React, Node.js, and PostgreSQL. You'll own features end-to-end, collaborate with designers, and ship fast. Skills needed: React, TypeScript, Express, SQL, Git, REST APIs.",
    url: "https://example.com/jobs/002",
  },
  {
    externalId: "mock-003",
    title: "Backend Engineer - Python",
    company: "DataFlow Systems",
    location: "Remote",
    description: "Backend Engineer to build data pipelines and APIs. Tech stack: Python, FastAPI, PostgreSQL, Redis, Kubernetes. You'll design high-throughput data processing systems. Must have 3+ years Python, experience with async programming, and strong SQL skills.",
    url: "https://example.com/jobs/003",
  },
  {
    externalId: "mock-004",
    title: "Frontend React Developer",
    company: "DesignFirst Co.",
    location: "Austin, TX (Remote)",
    description: "Craft beautiful, performant UIs with React and TypeScript. Work with our design system, implement complex animations, and ensure cross-browser compatibility. Requirements: React 18+, TypeScript, CSS-in-JS, accessibility knowledge, unit testing with Jest.",
    url: "https://example.com/jobs/004",
  },
  {
    externalId: "mock-005",
    title: "DevOps / Platform Engineer",
    company: "CloudNative Ltd.",
    location: "Remote (Global)",
    description: "Build and maintain our cloud infrastructure on AWS. You'll work on Terraform, Kubernetes, CI/CD, monitoring (DataDog/Prometheus). Experience with IaC, container orchestration, and SRE practices required.",
    url: "https://example.com/jobs/005",
  },
  {
    externalId: "mock-006",
    title: "Staff Engineer - Distributed Systems",
    company: "ScaleUp Inc.",
    location: "Seattle, WA (Hybrid)",
    description: "Lead technical direction for our distributed systems team. Design fault-tolerant architectures handling millions of requests. Must have expert-level knowledge of distributed databases, message queues (Kafka), and microservices patterns.",
    url: "https://example.com/jobs/006",
  },
];

export class MockProvider implements JobProvider {
  readonly name = "mock";
  readonly label = "Demo Jobs (No API Key Required)";
  readonly requiresApiKey = false;

  async fetchJobs(params: FetchParams): Promise<JobListing[]> {
    await new Promise(r => setTimeout(r, 300));
    return MOCK_JOBS.slice(0, params.limit).map(j => ({ ...j, source: "mock" }));
  }
}
