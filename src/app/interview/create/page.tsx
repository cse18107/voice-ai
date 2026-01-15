"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, Terminal } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

export default function CreateInterviewPage() {
  const router = useRouter();
  const { user, interviewCount, refreshCount } = useAuth();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);

  const isLimitReached = user?.role === 'guest' && interviewCount >= 3;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isLimitReached) {
      setShowModal(true);
      return;
    }

    setLoading(true);
    let response: Response | null = null;

    if (!user) {
      alert("Please login to create an interview");
      router.push("/login");
      return;
    }

    try {
      const formData = new FormData(e.currentTarget);
      if (file) {
        formData.append("resume", file);
      }
      formData.append("user_id", user.id);

      response = await fetch("/api/interviews", {
        method: "POST",
        body: formData,
      });

      if (response.status === 403) {
        setShowModal(true);
        throw new Error("Protocol limitation reached");
      }

      if (!response.ok) {
        throw new Error("Failed to create interview");
      }

      const data = await response.json();
      await refreshCount(); // Update the counter
      router.push(`/interview/${data.id}`);
    } catch (error) {
      console.error("Error:", error);
      if (response?.status !== 403) {
        alert("Failed to create interview session. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl relative">
      {/* Limit Reach Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card border-2 border-primary p-8 max-w-md w-full shadow-[20px_20px_0px_0px_rgba(var(--primary-rgb),0.1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 text-[8px] uppercase tracking-widest text-muted-foreground font-mono">SYS_ERR_403</div>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-destructive/10 border border-destructive/50">
                <Terminal className="w-6 h-6 text-destructive" />
              </div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Limitation Protocol</h2>
            </div>
            <p className="text-sm text-muted-foreground uppercase tracking-widest leading-relaxed mb-8">
              Protocol constraints detected. Guest access is limited to <span className="text-primary font-bold">3 active sessions</span>. 
              Contact the system administrator to unlock <span className="text-primary font-bold">Priority Access (Admin Role)</span>.
            </p>
            <div className="flex flex-col gap-4">
              <Button 
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="rounded-none h-12 uppercase tracking-widest font-bold border-border"
              >
                Return to Dashboard
              </Button>
              <Button 
                onClick={() => setShowModal(false)}
                className="rounded-none h-12 uppercase tracking-widest font-bold"
              >
                Acknowledge Error
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-12 flex items-center gap-4">
        <div className="p-3 bg-accent/50 border border-border rounded-none">
          <Terminal className="w-6 h-6 text-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tighter uppercase italic">Initialize Session</h1>
          <p className="text-muted-foreground uppercase text-[10px] tracking-[0.3em] mt-1">Configure your training parameters</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className={`space-y-6 bg-card border border-border p-8 shadow-xl transition-opacity ${isLimitReached ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="space-y-2">
            <Label htmlFor="topic" className="text-muted-foreground uppercase text-[10px] tracking-widest flex justify-between">
              <span>Interview Topic</span>
              <span className="text-muted-foreground/50 font-mono">TOPIC_ID</span>
            </Label>
            <Input 
              id="topic" 
              name="topic"
              placeholder="e.g. Frontend Engineer, Product Manager" 
              className="bg-transparent border-border focus:border-primary transition-colors rounded-none"
              required={!isLimitReached}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job_description" className="text-muted-foreground uppercase text-[10px] tracking-widest flex justify-between">
              <span>Job Description</span>
              <span className="text-muted-foreground/50 font-mono">TEXTAREA_MODULE</span>
            </Label>
            <Textarea 
              id="job_description" 
              name="job_description"
              placeholder="Paste the job description here..." 
              className="min-h-[200px] bg-transparent border-border focus:border-primary transition-colors rounded-none resize-none"
              required={!isLimitReached}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume" className="text-muted-foreground uppercase text-[10px] tracking-widest flex justify-between">
              <span>Resume Upload</span>
              <span className="text-muted-foreground/50 font-mono">FILE_UPLOAD_MODULE</span>
            </Label>
            <div className="relative group">
              <Input 
                id="resume" 
                type="file" 
                className="hidden" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={isLimitReached}
              />
              <Label 
                htmlFor="resume" 
                className="flex flex-col items-center justify-center border border-dashed border-border p-8 hover:border-primary transition-all cursor-pointer bg-accent/20"
              >
                <Upload className="w-6 h-6 text-muted-foreground mb-2 group-hover:text-foreground transition-colors" />
                <span className="text-xs text-muted-foreground uppercase tracking-widest">
                  {file ? file.name : "Select PDF or DOCX"}
                </span>
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="complexity" className="text-muted-foreground uppercase text-[10px] tracking-widest flex justify-between">
              <span>Complexity Level</span>
              <span className="text-muted-foreground/50 font-mono">LOGIC_INTENSITY</span>
            </Label>
            <Select name="complexity" required={!isLimitReached} defaultValue="medium" disabled={isLimitReached}>
              <SelectTrigger className="bg-transparent border-border focus:ring-0 focus:border-primary transition-colors rounded-none uppercase text-xs tracking-widest">
                <SelectValue placeholder="Select Hardness" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black border-border rounded-none text-foreground">
                <SelectItem value="easy" className="uppercase text-xs tracking-widest focus:bg-primary focus:text-primary-foreground rounded-none transition-colors">Junior / Easy</SelectItem>
                <SelectItem value="medium" className="uppercase text-xs tracking-widest focus:bg-primary focus:text-primary-foreground rounded-none transition-colors">Mid-Level / Medium</SelectItem>
                <SelectItem value="hard" className="uppercase text-xs tracking-widest focus:bg-primary focus:text-primary-foreground rounded-none transition-colors">Senior / Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || isLimitReached}
          className={`w-full h-14 uppercase font-bold tracking-[0.2em] shadow-lg transition-all ${isLimitReached ? 'bg-muted text-muted-foreground cursor-not-allowed border border-dashed border-border' : 'bg-primary text-primary-foreground hover:opacity-90'}`}
        >
          {isLimitReached ? "ALL RESOURCE UTILIZED" : (loading ? "Allocating Resources..." : "Start Interview Protocol")}
        </button>
        {isLimitReached && (
          <p className="text-[10px] uppercase tracking-widest text-destructive text-center mt-4 animate-pulse">
            Limit reached. Please upgrade to admin status for unlimited access.
          </p>
        )}
      </form>
    </div>
  );
}

