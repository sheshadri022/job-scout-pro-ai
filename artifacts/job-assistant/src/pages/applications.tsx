import { 
  // Assuming this hook exists based on the prompt's provided list
  useListJobs,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building, Calendar, ClipboardCheck } from "lucide-react";
import { format } from "date-fns";

export default function Applications() {
  // We'll fetch jobs and filter them locally for applied status
  // since a dedicated useListApplications might just be a filtered view
  const { data: jobs = [], isLoading } = useListJobs();

  const appliedJobs = jobs.filter(job => 
    job.status === "applied" || 
    job.status === "interview" || 
    job.status === "offer" || 
    job.status === "rejected"
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Application History</h1>
        <p className="text-slate-500 mt-1">Track where you've sent your resume.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading history...</div>
        ) : appliedJobs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <ClipboardCheck className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No applications yet</h3>
            <p className="text-slate-500 mt-1 max-w-sm">
              Change a job's status to "Applied" to see it tracked here.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appliedJobs.map((job) => (
                <TableRow key={job.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <Link href={`/jobs/${job.id}`} className="font-medium text-primary hover:underline">
                      {job.title}
                    </Link>
                    <div className="flex items-center text-sm text-slate-500 mt-1">
                      <Building className="w-3.5 h-3.5 mr-1" />
                      {job.company}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`
                      ${job.status === 'offer' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                      ${job.status === 'interview' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                      ${job.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                      ${job.status === 'applied' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : ''}
                    `}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-slate-600">
                      <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                      {format(new Date(job.createdAt), "MMM d, yyyy")}
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