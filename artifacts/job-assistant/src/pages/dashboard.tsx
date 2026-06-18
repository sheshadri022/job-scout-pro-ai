import { Link } from "wouter";
import {
  useGetDashboardSummary,
  useGetRecentJobs,
  useGetTopMatches,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Target,
  Trophy,
  ClipboardCheck,
  ArrowRight,
  Building,
  MapPin,
  Plus,
} from "lucide-react";

function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null)
    return (
      <Badge variant="outline" className="bg-slate-100 text-slate-500">
        Unscored
      </Badge>
    );
  if (score >= 70)
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        {score}
      </Badge>
    );
  if (score >= 40)
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
        {score}
      </Badge>
    );
  return (
    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
      {score}
    </Badge>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: recentJobs = [], isLoading: recentLoading } = useGetRecentJobs();
  const { data: topMatches = [], isLoading: topLoading } = useGetTopMatches();

  const stats = [
    {
      title: "Total Jobs Saved",
      value: summary?.totalJobs ?? 0,
      icon: Briefcase,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Applied",
      value: summary?.appliedJobs ?? 0,
      icon: ClipboardCheck,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "High Matches",
      value: summary?.highMatchJobs ?? 0,
      icon: Target,
      color: "text-green-600",
      bg: "bg-green-50",
      sub: "Score ≥ 70",
    },
    {
      title: "Interviews",
      value: summary?.interviewJobs ?? 0,
      icon: Trophy,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Your job search at a glance.</p>
        </div>
        <Link href="/jobs">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Add Job
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {summaryLoading ? (
                  <div className="h-9 w-12 bg-slate-100 animate-pulse rounded" />
                ) : (
                  stat.value
                )}
              </div>
              {stat.sub && (
                <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two-column section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Jobs */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recently Added</CardTitle>
            <Link href="/jobs">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 -mr-2">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-lg" />
              ))
            ) : recentJobs.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No jobs yet.{" "}
                <Link href="/jobs" className="text-primary hover:underline">
                  Add your first job
                </Link>
              </div>
            ) : (
              recentJobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">
                        {job.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center">
                          <Building className="w-3 h-3 mr-1" />
                          {job.company}
                        </span>
                        {job.location && (
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {job.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <ScoreBadge score={job.score} />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top Matches */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Top Matches</CardTitle>
            <Link href="/jobs">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 -mr-2">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {topLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-lg" />
              ))
            ) : topMatches.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No scored jobs yet. Score a job to see your top matches.
              </div>
            ) : (
              topMatches.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">
                        {job.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center">
                          <Building className="w-3 h-3 mr-1" />
                          {job.company}
                        </span>
                      </div>
                    </div>
                    <ScoreBadge score={job.score} />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick tips */}
      <Card className="bg-primary/5 border-primary/20 shadow-sm">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-slate-900 mb-3">Getting started</h3>
          <ol className="space-y-2 text-sm text-slate-600 list-decimal list-inside">
            <li>
              <Link href="/resume" className="text-primary hover:underline">
                Upload your resume
              </Link>{" "}
              — the AI needs it to score jobs and generate content.
            </li>
            <li>
              <Link href="/settings" className="text-primary hover:underline">
                Set your preferences
              </Link>{" "}
              — configure target roles, locations and salary expectations.
            </li>
            <li>
              <Link href="/jobs" className="text-primary hover:underline">
                Add a job
              </Link>{" "}
              — paste a job description, then hit "Score Now" to get your match score.
            </li>
            <li>
              Open any job and use the AI tools to generate a tailored cover letter or interview prep.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
