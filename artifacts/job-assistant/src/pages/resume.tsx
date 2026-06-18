import { useState, useEffect, useRef } from "react";
import {
  useGetResume,
  useUploadResume,
  getGetResumeQueryKey
} from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Save, CheckCircle2, Bot, Upload, FileUp, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";

export default function Resume() {
  const { data: resume, isLoading } = useGetResume();
  const uploadResume = useUploadResume();
  const { session } = useAuth();
  const [rawText, setRawText] = useState(resume?.rawText || "");
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiBase = import.meta.env.VITE_API_URL || "";

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
          toast.success("Resume saved and parsed by AI");
        },
        onError: () => toast.error("Failed to save resume"),
      }
    );
  };

  const uploadPdf = async (file: File) => {
    if (!file.type.includes("pdf")) {
      toast.error("Please upload a PDF file");
      return;
    }
    setUploadingPdf(true);
    try {
      const form = new FormData();
      form.append("resume", file);
      const token = session?.access_token;
      const res = await fetch(`${apiBase}/api/resume/upload-pdf`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }
      const updatedResume = await res.json();
      queryClient.setQueryData(getGetResumeQueryKey(), updatedResume);
      setRawText(updatedResume.rawText || "");
      setIsEditing(false);
      toast.success("PDF uploaded and parsed by AI");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "PDF upload failed");
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadPdf(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadPdf(file);
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-48 glass-card animate-pulse" />
        ))}
      </div>
    );
  }

  const hasResume = !!resume;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Your Resume</h1>
        <p className="text-white/40 mt-1 text-sm">
          Foundation for all AI job scoring and content generation.
        </p>
      </div>

      {/* PDF Upload Drop Zone */}
      <div
        className={`glass-card p-6 border-dashed transition-all cursor-pointer ${
          dragOver ? "border-blue-500/60 bg-blue-500/10" : "border-white/20 hover:border-white/30 hover:bg-white/5"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/15 border border-blue-500/20">
            {uploadingPdf ? (
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            ) : (
              <FileUp className="w-6 h-6 text-blue-400" />
            )}
          </div>
          <div>
            <p className="text-white/80 font-semibold text-sm">
              {uploadingPdf ? "Extracting text from PDF…" : "Upload PDF Resume"}
            </p>
            <p className="text-white/35 text-xs mt-0.5">
              {uploadingPdf
                ? "AI is parsing your resume — this takes a few seconds"
                : "Drag & drop your PDF here, or click to browse. Max 10MB."}
            </p>
          </div>
          {!uploadingPdf && (
            <Button className="ml-auto btn-gradient shrink-0" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Browse
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Raw text editor */}
        <div className="glass-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white/80 font-semibold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Resume Text
              </h2>
              <p className="text-white/35 text-xs mt-0.5">Or paste your plain text resume here</p>
            </div>
            {!isEditing && hasResume && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}
                className="border-white/15 text-white/60 hover:bg-white/5 hover:text-white">
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Edit
              </Button>
            )}
          </div>

          {isEditing || !hasResume ? (
            <div className="flex-1 flex flex-col gap-4">
              <Textarea
                placeholder="Paste your plain text resume here. The AI will parse your skills, experience, and education…"
                className="flex-1 min-h-[360px] bg-white/5 border-white/12 text-white/85 placeholder:text-white/20 font-mono text-xs leading-relaxed focus:border-blue-500/40 resize-none"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                {hasResume && (
                  <Button variant="ghost" onClick={() => { setRawText(resume.rawText); setIsEditing(false); }}
                    className="text-white/50 hover:text-white hover:bg-white/5">
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={uploadResume.isPending || rawText.length < 50}
                  className="btn-gradient"
                >
                  {uploadResume.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Parsing…</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" /> Save & Parse</>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white/3 rounded-xl p-4 font-mono text-xs whitespace-pre-wrap text-white/55 flex-1 overflow-y-auto max-h-[480px] border border-white/8">
              {resume.rawText}
            </div>
          )}
        </div>

        {/* AI Parsing Results */}
        <div className="glass-card p-5">
          <div className="mb-5">
            <h2 className="text-white/80 font-semibold text-sm flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-400" />
              AI Parsing Results
            </h2>
            <p className="text-white/35 text-xs mt-0.5">How the AI understands your profile</p>
          </div>

          {!hasResume || isEditing ? (
            <div className="text-center py-12 text-white/30">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-white/20" />
              </div>
              <p className="text-sm">Save your resume to see AI parsing results.</p>
            </div>
          ) : (
            <div className="space-y-6 overflow-y-auto max-h-[480px] pr-1">
              {resume.skills && resume.skills.length > 0 && (
                <div>
                  <h3 className="text-white/40 text-xs font-semibold tracking-widest uppercase mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {resume.skills.map((skill, i) => (
                      <Badge key={i} variant="secondary"
                        className="bg-blue-500/15 text-blue-300 border border-blue-500/25 font-normal text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {resume.experience && resume.experience.length > 0 && (
                <div>
                  <h3 className="text-white/40 text-xs font-semibold tracking-widest uppercase mb-3">Experience</h3>
                  <ul className="space-y-2">
                    {resume.experience.map((exp, i) => (
                      <li key={i} className="text-xs text-white/60 bg-white/4 p-3 rounded-lg border border-white/8">
                        {exp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {resume.education && resume.education.length > 0 && (
                <div>
                  <h3 className="text-white/40 text-xs font-semibold tracking-widest uppercase mb-3">Education</h3>
                  <ul className="space-y-1.5">
                    {resume.education.map((ed, i) => (
                      <li key={i} className="text-xs text-white/55 flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-white/30 mt-1.5 flex-shrink-0" />
                        {ed}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {resume.certifications && resume.certifications.length > 0 && (
                <div>
                  <h3 className="text-white/40 text-xs font-semibold tracking-widest uppercase mb-3">Certifications</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {resume.certifications.map((cert, i) => (
                      <Badge key={i} variant="secondary"
                        className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-normal text-xs">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {resume.projects && resume.projects.length > 0 && (
                <div>
                  <h3 className="text-white/40 text-xs font-semibold tracking-widest uppercase mb-3">Projects</h3>
                  <ul className="space-y-1.5">
                    {resume.projects.map((proj, i) => (
                      <li key={i} className="text-xs text-white/55 flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-purple-400/60 mt-1.5 flex-shrink-0" />
                        {proj}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
