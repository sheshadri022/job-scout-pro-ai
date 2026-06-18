import { Link } from "wouter";
import {
  useGetDashboardSummary,
  useGetRecentJobs,
  useGetTopMatches,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Target,
  Trophy,
  ClipboardCheck,
  ArrowRight,
  Building,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";

function ScorePill({ score }: { score: number | null | undefined }) {
  if (score == null)
    return <span className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-white/35 border border-white/10">–</span>;
  if (score >= 70)
    return <span className="score-high text-xs px-2 py-0.5 rounded-full font-semibold">{score}%</span>;
  if (score >= 40)
    return <span className="score-mid text-xs px-2 py-0.5 rounded-full font-semibold">{score}%</span>;
  return <span className="score-low text-xs px-2 py-0.5 rounded-full font-semibold">{score}%</span>;
}

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: recentJobs = [], isLoading: recentLoading } = useGetRecentJobs();
  const { data: topMatches = [], isLoading: topLoading } = useGetTopMatches();

  const stats = [
    {
      title: "Jobs Saved",
      value: summary?.totalJobs ?? 0,
      icon: Briefcase,
      gradient: "from-blue-500/20 to-blue-600/10",
      iconColor: "text-blue-400",
      border: "border-blue-500/20",
    },
    {
      title: "Applied",
      value: summary?.appliedJobs ?? 0,
      icon: ClipboardCheck,
      gradient: "from-indigo-500/20 to-indigo-600/10",
      iconColor: "text-indigo-400",
      border: "border-indigo-500/20",
    },
    {
      title: "High Matches",
      value: summary?.highMatchJobs ?? 0,
      icon: Target,
      gradient: "from-emerald-500/20 to-emerald-600/10",
      iconColor: "text-emerald-400",
      border: "border-emerald-500/20",
      sub: "Score ≥ 70",
    },
    {
      title: "Interviews",
      value: summary?.interviewJobs ?? 0,
      icon: Trophy,
      gradient: "from-purple-500/20 to-purple-600/10",
      iconColor: "text-purple-400",
      border: "border-purple-500/20",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/40 mt-1 text-sm">Your job search at a glance.</p>
        </div>
        <Link href="/discover">
          <Button className="btn-gradient">
            <Search className="w-4 h-4 mr-2" />
            Discover Jobs
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.title}
            className={`glass-card p-5 bg-gradient-to-br ${stat.gradient} border ${stat.border}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/50 text-sm font-medium">{stat.title}</p>
              <div className="p-2 rounded-xl bg-white/5">
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </div>
            <div className="text-4xl font-bold text-white tracking-tight">
              {summaryLoading ? (
                <div className="h-10 w-14 bg-white/10 animate-pulse rounded-lg" />
              ) : (
                stat.value
              )}
            </div>
            {stat.sub && <p className="text-xs text-white/30 mt-1">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {/* Two-column section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Jobs */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white/80 font-semibold text-sm">Recently Added</h2>
            <Link href="/jobs">
              <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-white/5 -mr-2 text-xs">
                View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-1.5">
            {recentLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-white/5 animate-pulse rounded-xl" />
              ))
            ) : recentJobs.length === 0 ? (
              <div className="text-center py-8 text-white/30 text-sm">
                <Briefcase className="w-7 h-7 text-white/15 mx-auto mb-2" />
                No jobs yet.{" "}
                <Link href="/discover" className="text-blue-400 hover:underline">Discover jobs</Link>
              </div>
            ) : (
              recentJobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer group">
                    <div className="min-w-0">
                      <p className="font-medium text-white/85 text-sm truncate group-hover:text-white">
                        {job.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-white/35 mt-0.5">
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
                    <ScorePill score={job.score} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Top Matches */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white/80 font-semibold text-sm">Top Matches</h2>
            <Link href="/jobs">
              <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-white/5 -mr-2 text-xs">
                View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-1.5">
            {topLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-white/5 animate-pulse rounded-xl" />
              ))
            ) : topMatches.length === 0 ? (
              <div className="text-center py-8 text-white/30 text-sm">
                <Target className="w-7 h-7 text-white/15 mx-auto mb-2" />
                No scored jobs yet.
              </div>
            ) : (
              topMatches.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer group">
                    <div className="min-w-0">
                      <p className="font-medium text-white/85 text-sm truncate group-hover:text-white">
                        {job.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-white/35 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {job.company}
                        </span>
                      </div>
                    </div>
                    <ScorePill score={job.score} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Getting started */}
      <div className="glass-card p-5 border-blue-500/15 bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <h3 className="font-semibold text-white/80 text-sm">Getting started</h3>
        </div>
        <ol className="space-y-2.5 text-sm text-white/45 list-none">
          {[
            { href: "/resume", label: "Upload your resume", suffix: "— the AI needs it to score jobs and generate content." },
            { href: "/settings", label: "Set your preferences", suffix: "— configure target roles, locations and salary." },
            { href: "/discover", label: "Discover jobs", suffix: "— fetch from portals, auto-score, and review matches." },
            { href: "/jobs", label: "Open any job", suffix: "— generate a cover letter, recruiter message, or prep for interviews." },
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-white/8 border border-white/12 text-white/40 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">
                {i + 1}
              </span>
              <span>
                <Link href={step.href} className="text-blue-400 hover:text-blue-300 hover:underline font-medium">
                  {step.label}
                </Link>{" "}
                {step.suffix}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
