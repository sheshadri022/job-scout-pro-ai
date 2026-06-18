import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetJob,
  useUpdateJob,
  useDeleteJob,
  useScoreJob,
  useGenerateCoverLetter,
  useGenerateRecruiterMessage,
  useGenerateResumeTips,
  useGenerateInterviewPrep,
  getGetJobQueryKey,
  JobStatus,
} from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Building,
  MapPin,
  ExternalLink,
  Calendar,
  Trash2,
  BrainCircuit,
  Wand2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useLocation } from "wouter";

const AI_TABS = [
  { value: "cover-letter", label: "Cover Letter" },
  { value: "recruiter", label: "DM Note" },
  { value: "resume", label: "Resume Tips" },
  { value: "interview", label: "Interview Prep" },
] as const;

type AiTabValue = (typeof AI_TABS)[number]["value"];

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const jobId = parseInt(id || "0", 10);
  const [, navigate] = useLocation();

  const { data: job, isLoading } = useGetJob(jobId, {
    query: { enabled: !!jobId, queryKey: ["job", jobId] },
  });

  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const scoreJob = useScoreJob();
  const generateCoverLetter = useGenerateCoverLetter();
  const generateRecruiterMessage = useGenerateRecruiterMessage();
  const generateResumeTips = useGenerateResumeTips();
  const generateInterviewPrep = useGenerateInterviewPrep();

  const [activeAiTab, setActiveAiTab] = useState<AiTabValue>("cover-letter");
  const [generatedText, setGeneratedText] = useState<Partial<Record<AiTabValue, string>>>({});

  const handleStatusChange = (newStatus: JobStatus) => {
    updateJob.mutate(
      { id: jobId, data: { status: newStatus } },
      {
        onSuccess: (updated) => {
          queryClient.setQueryData(getGetJobQueryKey(jobId), updated);
          toast.success("Status updated");
        },
        onError: () => toast.error("Failed to update status"),
      }
    );
  };

  const handleScoreJob = () => {
    scoreJob.mutate(
      { id: jobId },
      {
        onSuccess: (updated) => {
          queryClient.setQueryData(getGetJobQueryKey(jobId), updated);
          toast.success("Job scored successfully!");
        },
        onError: () =>
          toast.error("Scoring failed. Make sure you have a resume uploaded."),
      }
    );
  };

  const handleDelete = () => {
    deleteJob.mutate(
      { id: jobId },
      {
        onSuccess: () => {
          toast.success("Job deleted");
          navigate("/jobs");
        },
        onError: () => toast.error("Failed to delete job"),
      }
    );
  };

  const handleGenerate = (type: AiTabValue) => {
    const opts = {
      onSuccess: (data: { content: string }) => {
        setGeneratedText((prev) => ({ ...prev, [type]: data.content }));
        toast.success("Generated successfully");
      },
      onError: () =>
        toast.error("Generation failed. Make sure you have a resume uploaded."),
    };

    switch (type) {
      case "cover-letter":
        generateCoverLetter.mutate({ data: { jobId } }, opts);
        break;
      case "recruiter":
        generateRecruiterMessage.mutate({ data: { jobId } }, opts);
        break;
      case "resume":
        generateResumeTips.mutate({ data: { jobId } }, opts);
        break;
      case "interview":
        generateInterviewPrep.mutate({ data: { jobId } }, opts);
        break;
    }
  };

  const isGenerating = (type: AiTabValue) => {
    switch (type) {
      case "cover-letter": return generateCoverLetter.isPending;
      case "recruiter": return generateRecruiterMessage.isPending;
      case "resume": return generateResumeTips.isPending;
      case "interview": return generateInterviewPrep.isPending;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading job details...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 text-center text-slate-500">
        Job not found.{" "}
        <Link href="/jobs" className="text-primary hover:underline">
          Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-4 text-sm text-slate-500">
        <Link
          href="/jobs"
          className="flex items-center hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Jobs
        </Link>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-4 flex-1">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-slate-600">
              <span className="flex items-center font-medium text-slate-900">
                <Building className="w-4 h-4 mr-1.5 text-slate-400" />
                {job.company}
              </span>
              {job.location && (
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1.5 text-slate-400" />
                  {job.location}
                </span>
              )}
              <span className="flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
                Added {format(new Date(job.createdAt), "MMM d, yyyy")}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={job.status}
              onValueChange={(val) => handleStatusChange(val as JobStatus)}
            >
              <SelectTrigger className="w-[160px] font-medium">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="saved">Saved</SelectItem>
                <SelectItem value="to_apply">To Apply</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {job.url && (
              <Button asChild variant="outline">
                <a href={job.url} target="_blank" rel="noopener noreferrer">
                  View Posting <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 ml-auto">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this job?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove the job and all associated data. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Score card */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 min-w-[180px] flex flex-col items-center justify-center text-center">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Match Score
          </div>
          {job.score != null ? (
            <>
              <div
                className={`text-5xl font-bold ${
                  job.score >= 70
                    ? "text-green-600"
                    : job.score >= 40
                    ? "text-amber-600"
                    : "text-red-600"
                }`}
              >
                {job.score}
              </div>
              <div className="text-sm text-slate-500 mt-1">out of 100</div>
            </>
          ) : (
            <div className="text-slate-400 italic my-2 text-sm">Not scored yet</div>
          )}
          <Button
            variant={job.score == null ? "default" : "outline"}
            size="sm"
            className="mt-4 w-full"
            onClick={handleScoreJob}
            disabled={scoreJob.isPending}
          >
            {scoreJob.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scoring...</>
            ) : (
              <><BrainCircuit className="w-4 h-4 mr-2" /> {job.score == null ? "Score Now" : "Rescore"}</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none text-sm text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
                {job.description || (
                  <span className="text-slate-400 italic">No description provided.</span>
                )}
              </div>
            </CardContent>
          </Card>

          {job.score != null && (
            <Card>
              <CardHeader>
                <CardTitle>Score Breakdown</CardTitle>
                <CardDescription>
                  How your profile aligns with this role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        job.score >= 70
                          ? "bg-green-500"
                          : job.score >= 40
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${job.score}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-700 w-12 text-right">
                    {job.score}%
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  {job.score >= 70
                    ? "Strong match — your profile aligns well with this role."
                    : job.score >= 40
                    ? "Moderate match — some gaps exist but the role is reachable."
                    : "Low match — significant gaps between your profile and this role."}
                </p>
                <div className="pt-2">
                  <p className="text-sm text-slate-600">
                    Use the AI tools on the right to generate a tailored cover letter or get resume improvement tips for this specific role.
                  </p>
                </div>
                <Separator />
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-600">
                    AI analysis complete — generate content below to maximize your chances.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-600">
                    Rescore anytime after updating your resume for a fresh analysis.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — AI tools */}
        <div>
          <Card className="sticky top-6">
            <CardHeader className="bg-primary/5 rounded-t-xl border-b border-primary/10">
              <CardTitle className="flex items-center text-primary">
                <Wand2 className="w-5 h-5 mr-2" />
                AI Career Tools
              </CardTitle>
              <CardDescription>
                Generate tailored content for this specific job.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs
                value={activeAiTab}
                onValueChange={(v) => setActiveAiTab(v as AiTabValue)}
                className="w-full"
              >
                <div className="px-4 pt-4">
                  <TabsList className="grid grid-cols-2 gap-1 h-auto bg-slate-100 p-1">
                    {AI_TABS.map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="text-xs py-1.5"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {AI_TABS.map((tab) => (
                  <TabsContent
                    key={tab.value}
                    value={tab.value}
                    className="p-4 mt-0 outline-none"
                  >
                    {!generatedText[tab.value] ? (
                      <div className="text-center py-8">
                        <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200">
                          <BrainCircuit className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-500 mb-4 max-w-[200px] mx-auto">
                          Generate highly tailored content based on your resume and this job.
                        </p>
                        {!job.description && (
                          <p className="text-xs text-amber-600 mb-3 bg-amber-50 rounded p-2">
                            Add a job description for better results.
                          </p>
                        )}
                        <Button
                          onClick={() => handleGenerate(tab.value)}
                          disabled={isGenerating(tab.value)}
                          className="w-full"
                        >
                          {isGenerating(tab.value) ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                          ) : (
                            "Generate"
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Textarea
                          className="min-h-[260px] text-sm leading-relaxed p-3 bg-slate-50 resize-y"
                          value={generatedText[tab.value]}
                          onChange={(e) =>
                            setGeneratedText((prev) => ({
                              ...prev,
                              [tab.value]: e.target.value,
                            }))
                          }
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() =>
                              copyToClipboard(generatedText[tab.value]!)
                            }
                          >
                            <Copy className="w-4 h-4 mr-2" /> Copy
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => handleGenerate(tab.value)}
                            disabled={isGenerating(tab.value)}
                          >
                            {isGenerating(tab.value) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Redo"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
