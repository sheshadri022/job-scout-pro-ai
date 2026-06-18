import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  Search, RefreshCw, CheckCircle2, XCircle, ExternalLink,
  Briefcase, MapPin, Building, Sparkles, Key, AlertCircle,
  ChevronRight, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth";

interface Provider {
  name: string;
  label: string;
  requiresApiKey: boolean;
}

interface JobEntry {
  id: number;
  title: string;
  company: string;
  location: string | null;
  url: string | null;
  score: number | null;
  source: string;
  reviewStatus: string;
}

type Queue = Record<string, JobEntry[]>;

function ScorePill({ score }: { score: number | null | undefined }) {
  if (score == null) return (
    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10">
      Scoring…
    </span>
  );
  if (score >= 70) return (
    <span className="score-high text-xs px-2.5 py-0.5 rounded-full font-semibold">
      {score}%
    </span>
  );
  if (score >= 40) return (
    <span className="score-mid text-xs px-2.5 py-0.5 rounded-full font-semibold">
      {score}%
    </span>
  );
  return (
    <span className="score-low text-xs px-2.5 py-0.5 rounded-full font-semibold">
      {score}%
    </span>
  );
}

const SOURCE_LABELS: Record<string, string> = {
  jsearch: "LinkedIn / Indeed / Glassdoor",
  mock: "Demo Jobs",
  adzuna: "Adzuna",
  manual: "Manually Added",
};

export default function Discover() {
  const { session } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [queue, setQueue] = useState<Queue>({});
  const [syncing, setSyncing] = useState<string | null>(null);
  const [queueLoading, setQueueLoading] = useState(true);
  const [warmingUp, setWarmingUp] = useState(false);
  const [actioning, setActioning] = useState<number | null>(null);
  const initializedRef = useRef(false);

  const apiBase = import.meta.env.VITE_API_URL || "";

  async function apiFetch(path: string, options?: RequestInit) {
    const token = session?.access_token;
    const res = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error || "Request failed");
    }
    return res.json();
  }

  async function apiFetchWithRetry(path: string, options?: RequestInit, maxAttempts = 4): Promise<unknown> {
    let lastErr: unknown;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await apiFetch(path, options);
      } catch (err) {
        lastErr = err;
        if (attempt === maxAttempts - 1) break;
        if (attempt === 0) setWarmingUp(true);
        await new Promise(r => setTimeout(r, Math.min(2000 * (attempt + 1), 8000)));
      }
    }
    throw lastErr;
  }

  async function loadProviders() {
    try {
      const data = await apiFetch("/api/discover/providers");
      setProviders(data as Provider[]);
    } catch {
      // Non-critical — providers list will stay empty
    }
  }

  async function loadQueue(showToastOnFail = false) {
    setQueueLoading(true);
    try {
      const data = await apiFetchWithRetry("/api/discover/queue") as Queue;
      setQueue(data);
    } catch {
      if (showToastOnFail) toast.error("Failed to load queue");
    } finally {
      setQueueLoading(false);
      setWarmingUp(false);
    }
  }

  async function syncProvider(providerName: string) {
    setSyncing(providerName);
    try {
      const result = await apiFetch("/api/discover/sync", {
        method: "POST",
        body: JSON.stringify({ provider: providerName, limit: 20 }),
      }) as { provider: string; saved: number };
      toast.success(`${result.provider}: ${result.saved} new jobs found`);
      await loadQueue(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(null);
    }
  }

  async function approve(jobId: number) {
    setActioning(jobId);
    try {
      await apiFetch(`/api/discover/${jobId}/approve`, { method: "POST" });
      setQueue(prev => {
        const next: Queue = {};
        for (const [src, jobs] of Object.entries(prev)) {
          next[src] = jobs.filter(j => j.id !== jobId);
        }
        return next;
      });
      toast.success("Job added to your list — ready to apply!");
    } catch {
      toast.error("Failed to approve job");
    } finally {
      setActioning(null);
    }
  }

  async function skip(jobId: number) {
    setActioning(jobId);
    try {
      await apiFetch(`/api/discover/${jobId}/skip`, { method: "POST" });
      setQueue(prev => {
        const next: Queue = {};
        for (const [src, jobs] of Object.entries(prev)) {
          next[src] = jobs.filter(j => j.id !== jobId);
        }
        return next;
      });
    } catch {
      toast.error("Failed to skip job");
    } finally {
      setActioning(null);
    }
  }

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    loadProviders();
    loadQueue();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPending = Object.values(queue).reduce((acc, jobs) => acc + jobs.length, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Search className="w-7 h-7 text-blue-400" />
            Discover Jobs
          </h1>
          <p className="text-white/45 mt-1 text-sm">
            Fetch jobs from portals, auto-score vs your resume, and queue them for review.
          </p>
        </div>
        <Button
          onClick={() => loadQueue(true)}
          disabled={queueLoading}
          variant="outline"
          className="border-white/15 text-white/70 hover:bg-white/5 hover:text-white"
        >
          {queueLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh Queue
        </Button>
      </div>

      {/* Providers */}
      <section>
        <h2 className="text-sm font-semibold text-white/45 uppercase tracking-widest mb-3">Job Sources</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {providers.length === 0 && (
            <div className="glass-card p-5 col-span-3 text-center text-white/35 text-sm">
              Loading providers…
            </div>
          )}
          {providers.map((p) => (
            <div key={p.name} className="glass-card p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-white/85 font-medium text-sm truncate">{p.label}</p>
                  {p.requiresApiKey && (
                    <p className="text-white/35 text-xs flex items-center gap-1 mt-0.5">
                      <Key className="w-3 h-3" />
                      Requires API key (Settings)
                    </p>
                  )}
                  {!p.requiresApiKey && (
                    <p className="text-green-400/70 text-xs flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      No key needed
                    </p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => syncProvider(p.name)}
                disabled={syncing !== null}
                className="btn-gradient w-full"
              >
                {syncing === p.name ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> Fetching…</>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5 mr-2" /> Fetch & Score Jobs</>
                )}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Info banner */}
      <div className="glass-card p-4 flex items-start gap-3 border-blue-500/20">
        <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-white/50 leading-relaxed">
          <strong className="text-white/70">How it works:</strong> Fetch jobs above → AI scores each one vs your resume → only jobs above your score threshold (configurable in Settings) appear in the review queue below.
          Approve a job to add it to <Link href="/jobs" className="text-blue-400 hover:underline">My Jobs</Link>, or skip to dismiss.
          Click any job title to open the full AI tools (cover letter, recruiter message, etc.).
        </div>
      </div>

      {/* Review Queue */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white/45 uppercase tracking-widest">
            Review Queue
            {totalPending > 0 && (
              <span className="ml-2 bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full border border-blue-500/30">
                {totalPending}
              </span>
            )}
          </h2>
        </div>

        {queueLoading ? (
          <div className="glass-card p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
            {warmingUp ? (
              <>
                <p className="text-white/60 text-sm font-medium">Server warming up…</p>
                <p className="text-white/30 text-xs mt-1">Free tier spins down after inactivity. Ready in ~15s.</p>
              </>
            ) : (
              <p className="text-white/45 text-sm">Loading queue…</p>
            )}
          </div>
        ) : totalPending === 0 ? (
          <div className="glass-card p-12 text-center space-y-3">
            <Search className="w-10 h-10 text-white/20 mx-auto" />
            <p className="text-white/50 font-medium">No jobs in review queue</p>
            <p className="text-white/30 text-sm max-w-sm mx-auto">
              Fetch jobs from a source above. Jobs scoring above your threshold will appear here for review.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(queue).map(([source, jobs]) => {
              if (jobs.length === 0) return null;
              return (
                <div key={source}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-white/40 text-xs px-3 py-1 rounded-full border border-white/10 bg-white/5">
                      {SOURCE_LABELS[source] || source} — top {jobs.length}
                    </span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>
                  <div className="space-y-2">
                    {jobs.map((job) => (
                      <div key={job.id} className="glass-card-hover p-4 flex items-center gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/jobs/${job.id}`}>
                              <span className="font-semibold text-white/90 text-sm hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-1">
                                {job.title}
                                <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                              </span>
                            </Link>
                            <ScorePill score={job.score} />
                          </div>
                          <div className="flex items-center gap-3 text-xs text-white/40 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {job.company}
                            </span>
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {job.location}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {job.url && (
                            <a href={job.url} target="_blank" rel="noopener noreferrer">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-white/35 hover:text-white/70 hover:bg-white/5 h-8 w-8 p-0"
                                title="Open job page"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </a>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => skip(job.id)}
                            disabled={actioning === job.id}
                            className="text-white/35 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                            title="Skip"
                          >
                            {actioning === job.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => approve(job.id)}
                            disabled={actioning === job.id}
                            className="btn-gradient h-8 px-3 text-xs"
                            title="Add to My Jobs"
                          >
                            {actioning === job.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Add</>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Tip */}
      <div className="glass-card p-4 flex items-start gap-3 border-purple-500/20">
        <Briefcase className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-white/45 leading-relaxed">
          <strong className="text-white/60">Connect real portals:</strong> Add your{" "}
          <Link href="/settings" className="text-blue-400 hover:underline">RapidAPI key in Settings</Link>{" "}
          to fetch live jobs from LinkedIn, Indeed, and Glassdoor via the JSearch provider.
          The Demo provider works instantly with no key required.
        </p>
      </div>
    </div>
  );
}
