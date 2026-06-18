import { useState, useEffect } from "react";
import { 
  useGetResume, 
  useUploadResume,
  getGetResumeQueryKey
} from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Save, CheckCircle2, Bot } from "lucide-react";
import { toast } from "sonner";

export default function Resume() {
  const { data: resume, isLoading } = useGetResume();
  const uploadResume = useUploadResume();
  const [rawText, setRawText] = useState(resume?.rawText || "");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (resume?.rawText) {
      setRawText(resume.rawText);
    }
  }, [resume?.rawText]);

  const handleSave = () => {
    if (rawText.length < 50) {
      toast.error("Resume text must be at least 50 characters.");
      return;
    }
    
    uploadResume.mutate(
      { data: { rawText } },
      {
        onSuccess: (updatedResume) => {
          queryClient.setQueryData(getGetResumeQueryKey(), updatedResume);
          setIsEditing(false);
          toast.success("Resume saved and parsed successfully");
        },
        onError: () => toast.error("Failed to save resume"),
      }
    );
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading resume...</div>;
  }

  const hasResume = !!resume;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Your Resume</h1>
        <p className="text-slate-500 mt-1">The foundation for all your AI job scoring and content generation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col h-full shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary" />
                Raw Text
              </CardTitle>
              <CardDescription>Paste your full resume text here</CardDescription>
            </div>
            {!isEditing && hasResume && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {isEditing || !hasResume ? (
              <div className="flex-1 flex flex-col gap-4">
                <Textarea
                  placeholder="Paste your plain text resume here. The AI will parse it to understand your experience and skills..."
                  className="flex-1 min-h-[400px] font-mono text-sm leading-relaxed p-4"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  {hasResume && (
                    <Button variant="ghost" onClick={() => {
                      setRawText(resume.rawText);
                      setIsEditing(false);
                    }}>
                      Cancel
                    </Button>
                  )}
                  <Button 
                    onClick={handleSave} 
                    disabled={uploadResume.isPending || rawText.length < 50}
                  >
                    {uploadResume.isPending ? "Parsing..." : (
                      <>
                        <Save className="w-4 h-4 mr-2" /> 
                        Save & Parse
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap text-slate-600 flex-1 overflow-y-auto max-h-[500px] border border-slate-200">
                {resume.rawText}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-sm border-primary/20">
            <CardHeader className="bg-primary/5 rounded-t-xl border-b border-primary/10 pb-4">
              <CardTitle className="text-lg flex items-center text-primary">
                <Bot className="w-5 h-5 mr-2" />
                AI Parsing Results
              </CardTitle>
              <CardDescription>How the AI understands your profile</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {!hasResume || isEditing ? (
                <div className="text-center py-12 text-slate-500">
                  <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-slate-300" />
                  </div>
                  Save your raw text to see how the AI parses your skills and experience.
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3 text-sm tracking-wide uppercase">Identified Skills</h3>
                    {resume.skills && resume.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {resume.skills.map((skill, i) => (
                          <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-700 font-normal">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-sm">No specific skills parsed. Ensure your text clearly lists technologies and capabilities.</span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3 text-sm tracking-wide uppercase">Experience Timeline</h3>
                    {resume.experience && resume.experience.length > 0 ? (
                      <ul className="space-y-3">
                        {resume.experience.map((exp, i) => (
                          <li key={i} className="text-sm text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-100">
                            {exp}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-slate-500 text-sm">No distinct roles parsed. Check your text formatting.</span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3 text-sm tracking-wide uppercase">Education</h3>
                    {resume.education && resume.education.length > 0 ? (
                      <ul className="list-disc pl-4 space-y-1">
                        {resume.education.map((ed, i) => (
                          <li key={i} className="text-sm text-slate-600">{ed}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-slate-500 text-sm">No education history parsed.</span>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}