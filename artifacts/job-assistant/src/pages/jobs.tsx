import { useState } from "wouter";
import { Link } from "wouter";
import { 
  useListJobs, 
  useCreateJob, 
  getListJobsQueryKey,
  JobStatus 
} from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, MapPin, Building, ExternalLink, Briefcase } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState as useReactState } from "react";

const jobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  company: z.string().min(1, "Company is required"),
  location: z.string().optional(),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().optional(),
});

function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) return <Badge variant="outline" className="bg-slate-100 text-slate-500">Unscored</Badge>;
  if (score >= 70) return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{score}</Badge>;
  if (score >= 40) return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{score}</Badge>;
  return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{score}</Badge>;
}

function StatusChip({ status }: { status: JobStatus }) {
  const styles: Record<string, string> = {
    saved: "bg-slate-100 text-slate-700",
    to_apply: "bg-blue-50 text-blue-700",
    applied: "bg-indigo-50 text-indigo-700",
    interview: "bg-purple-50 text-purple-700",
    offer: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
  };

  const labels: Record<string, string> = {
    saved: "Saved",
    to_apply: "To Apply",
    applied: "Applied",
    interview: "Interview",
    offer: "Offer",
    rejected: "Rejected",
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || styles.saved}`}>
      {labels[status] || status}
    </span>
  );
}

export default function Jobs() {
  const [search, setSearch] = useReactState("");
  const [statusFilter, setStatusFilter] = useReactState<string>("all");
  const [isAddOpen, setIsAddOpen] = useReactState(false);

  const { data: jobs = [], isLoading } = useListJobs({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const createJob = useCreateJob();

  const form = useForm<z.infer<typeof jobSchema>>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      company: "",
      location: "",
      url: "",
      description: "",
    },
  });

  const onSubmit = (values: z.infer<typeof jobSchema>) => {
    createJob.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
          setIsAddOpen(false);
          form.reset();
          toast.success("Job added successfully");
        },
        onError: () => {
          toast.error("Failed to add job");
        },
      }
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Jobs</h1>
          <p className="text-slate-500 mt-1">Track and score your potential opportunities.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Add Job
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add a New Job</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Software Engineer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company *</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corp" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="San Francisco, CA or Remote" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Paste the full job description here for better AI scoring..." 
                          className="min-h-[150px] font-mono text-sm"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createJob.isPending}>
                    {createJob.isPending ? "Adding..." : "Add Job"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            placeholder="Search by title or company..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="saved">Saved</SelectItem>
              <SelectItem value="to_apply">To Apply</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="offer">Offer</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No jobs found</h3>
            <p className="text-slate-500 mt-1 max-w-sm">
              Add your first job to start tracking and scoring it against your profile.
            </p>
            <Button className="mt-6" variant="outline" onClick={() => setIsAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add a Job
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[100px]">Score</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <ScoreBadge score={job.score} />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900">{job.title}</div>
                    <div className="flex items-center text-sm text-slate-500 mt-1">
                      <Building className="w-3.5 h-3.5 mr-1" />
                      {job.company}
                    </div>
                  </TableCell>
                  <TableCell>
                    {job.location && (
                      <div className="flex items-center text-sm text-slate-600">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {job.location}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={job.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {job.url && (
                        <a 
                          href={job.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-primary transition-colors p-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="ghost" size="sm" className="font-medium text-primary hover:bg-primary/10">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}