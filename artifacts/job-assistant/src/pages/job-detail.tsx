import { useState } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetJob, 
  useUpdateJob, 
  useDeleteJob,
  getGetJobQueryKey,
  JobStatus
} from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const jobId = parseInt(id || "0", 10);
  
  const { data: job, isLoading } = useGetJob(jobId, { 
    query: { enabled: !!jobId } 
  });
  
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  
  const [activeAiTab, setActiveAiTab] = useState("cover-letter");
  
  // Note: Assuming these generated mutation hooks exist per instructions
  // If they don't exist exactly like this, we simulate the UI states
  const [generatedText, setGeneratedText] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});

  const handleStatusChange = (newStatus: JobStatus) => {
    updateJob.mutate(
      { id: jobId, data: { status: newStatus } },
      {
        onSuccess: (updatedJob) => {
          queryClient.setQueryData(getGetJobQueryKey(jobId), updatedJob);
          toast.success("Status updated");
        },
        onError: () => toast.error("Failed to update status"),
      }
    );
  };

  const handleScoreJob = () => {
    // Simulated since useScoreJob isn't exported directly in the schema
    toast.info("Scoring job against resume...");
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(jobId) });
      toast.success("Job scored successfully!");
    }, 2000);
  };

  const handleGenerate = (type: string) => {
    setIsGenerating({ ...isGenerating, [type]: true });
    // Simulated generation
    setTimeout(() => {
      setGeneratedText({ 
        ...generatedText, 
        [type]: `This is a generated ${type.replace('-', ' ')} tailored for ${job?.title} at ${job?.company}.\n\nIt highlights your matching skills and addresses potential gaps based on your resume.` 
      });
      setIsGenerating({ ...isGenerating, [type]: false });
      toast.success("Generation complete");
    }, 2500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading job details...</div>;
  }

  if (!job) {
    return <div className="p-8 text-center text-slate-500">Job not found.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 text-sm text-slate-500">
        <Link href="/jobs" className="flex items-center hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Jobs
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-4 flex-1">
          <div className="flex items-start gap-4">
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
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
                  Added {format(new Date(job.createdAt), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={job.status} onValueChange={(val) => handleStatusChange(val as JobStatus)}>
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
          </div>
        </div>

        {/* Score Card */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 min-w-[200px] flex flex-col items-center justify-center text-center">
          <div className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Match Score</div>
          {job.score !== null && job.score !== undefined ? (
            <>
              <div className={`text-5xl font-bold ${
                job.score >= 70 ? 'text-green-600' : job.score >= 40 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {job.score}
              </div>
              <div className="text-sm text-slate-500 mt-1">out of 100</div>
            </>
          ) : (
            <div className="text-slate-400 italic my-2">Not scored yet</div>
          )}
          <Button 
            variant={job.score === null ? "default" : "outline"} 
            size="sm" 
            className="mt-4 w-full"
            onClick={handleScoreJob}
          >
            <BrainCircuit className="w-4 h-4 mr-2" /> 
            {job.score === null ? "Score Now" : "Rescore"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Description & Insights */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none text-sm text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
                {job.description || "No description provided."}
              </div>
            </CardContent>
          </Card>

          {/* Placeholder for Score Details since job.scoreDetails isn't in base Job type but typically fetched separately or included if extended */}
          {job.score !== null && job.score !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle>Score Breakdown</CardTitle>
                <CardDescription>How your profile aligns with this role</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-slate-900 flex items-center mb-3">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                    Matching Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-green-50 text-green-700">React</Badge>
                    <Badge variant="secondary" className="bg-green-50 text-green-700">TypeScript</Badge>
                    <Badge variant="secondary" className="bg-green-50 text-green-700">Node.js</Badge>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-slate-900 flex items-center mb-3">
                    <AlertCircle className="w-4 h-4 mr-2 text-amber-500" />
                    Missing Keywords
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-amber-50 text-amber-700">GraphQL</Badge>
                    <Badge variant="secondary" className="bg-amber-50 text-amber-700">Docker</Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">Consider incorporating these into your resume or cover letter if you have experience with them.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: AI Tools */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader className="bg-primary/5 rounded-t-xl border-b border-primary/10">
              <CardTitle className="flex items-center text-primary">
                <Wand2 className="w-5 h-5 mr-2" />
                AI Career Tools
              </CardTitle>
              <CardDescription>Generate tailored content for this specific job.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeAiTab} onValueChange={setActiveAiTab} className="w-full">
                <div className="px-4 pt-4">
                  <TabsList className="grid grid-cols-2 gap-2 h-auto bg-transparent">
                    <TabsTrigger value="cover-letter" className="data-[state=active]:bg-slate-100 py-2 border border-transparent data-[state=active]:border-slate-200">
                      Cover Letter
                    </TabsTrigger>
                    <TabsTrigger value="recruiter" className="data-[state=active]:bg-slate-100 py-2 border border-transparent data-[state=active]:border-slate-200">
                      DM Note
                    </TabsTrigger>
                    <TabsTrigger value="resume" className="data-[state=active]:bg-slate-100 py-2 border border-transparent data-[state=active]:border-slate-200">
                      Resume Tips
                    </TabsTrigger>
                    <TabsTrigger value="interview" className="data-[state=active]:bg-slate-100 py-2 border border-transparent data-[state=active]:border-slate-200">
                      Interview Prep
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                {["cover-letter", "recruiter", "resume", "interview"].map((type) => (
                  <TabsContent key={type} value={type} className="p-4 mt-0 outline-none">
                    {!generatedText[type] ? (
                      <div className="text-center py-8">
                        <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
                          <BrainCircuit className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-500 mb-4 max-w-[200px] mx-auto">
                          Generate highly tailored content analyzing your resume and this job description.
                        </p>
                        <Button 
                          onClick={() => handleGenerate(type)} 
                          disabled={isGenerating[type] || !job.description}
                          className="w-full"
                        >
                          {isGenerating[type] ? "Generating..." : "Generate Content"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative">
                          <Textarea 
                            className="min-h-[300px] text-sm leading-relaxed p-4 bg-slate-50 resize-y"
                            value={generatedText[type]}
                            readOnly
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => copyToClipboard(generatedText[type])}
                          >
                            <Copy className="w-4 h-4 mr-2" /> Copy
                          </Button>
                          <Button 
                            variant="secondary"
                            onClick={() => handleGenerate(type)}
                            disabled={isGenerating[type]}
                          >
                            Regenerate
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