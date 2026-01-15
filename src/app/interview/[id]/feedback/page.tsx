"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, Lightbulb, ArrowLeft, Download, MessageSquare } from "lucide-react";
import { AudioPlayer } from "@/components/audio-player";

export default function FeedbackPage() {
  const params = useParams();
  const id = params.id as string;
  const [interview, setInterview] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [elevenLabsData, setElevenLabsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch interview details
        const intRes = await fetch(`/api/interviews/${id}`);
        const intData = await intRes.json();
        setInterview(intData);

        // Fetch report
        const repRes = await fetch(`/api/interviews/${id}/report`);
        let repData = await repRes.json();
        
        // If report doesn't exist, try to generate it
        if (!repData) {
            const genRes = await fetch(`/api/interviews/${id}/report`, { method: 'POST' });
            if (genRes.ok) {
                repData = await genRes.json();
            }
        }
        
        setReport(repData);

        // Fetch ElevenLabs data if conversation_id exists
        if (intData.conversation_id) {
          const elRes = await fetch(`/api/elevenlabs/conversation/${intData.conversation_id}`);
          if (elRes.ok) {
            const elData = await elRes.json();
            setElevenLabsData(elData);
          }
        }
      } catch (error) {
        console.error("Error fetching feedback data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto py-32 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent animate-spin rounded-full" />
        <p className="text-xs uppercase tracking-[0.3em] font-mono animate-pulse">Retrieving Session Data...</p>
      </div>
    );
  }

  const score = report?.overall_score || 0;

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <div className="p-2 border border-border text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tighter uppercase italic">Analysis Report</h1>
            <div className="flex items-center gap-2 text-muted-foreground uppercase text-[10px] tracking-[0.2em]">
              <span className="text-foreground font-bold">{interview?.topic}</span>
              <span className="opacity-30">|</span>
              <span>{interview?.complexity} Level</span>
            </div>
            {interview?.job_description && (
               <p className="text-[10px] text-muted-foreground max-w-xl line-clamp-2 italic opacity-60">
                 {interview.job_description}
               </p>
            )}
          </div>
        </div>
        <div className="flex gap-3">
            {interview?.resume_url && (
                <a href={interview.resume_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="rounded-none border-border text-xs uppercase tracking-widest transition-all gap-2">
                        <Download className="w-4 h-4" /> View Resume
                    </Button>
                </a>
            )}
        </div>
      </div>

      <div className="grid gap-8">
        {/* Audio & Transcript Section */}
        {elevenLabsData && (
          <Card className="bg-card border-border rounded-none overflow-hidden border-t-4 border-t-primary shadow-2xl">
            <CardHeader className="border-b border-border bg-accent/5">
              <CardTitle className="text-xs uppercase tracking-widest flex items-center gap-2 font-bold italic">
                <MessageSquare className="w-4 h-4 text-primary" /> Conversation Archive
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
                {/* Audio Player */}
                <div className="p-6 space-y-4 bg-accent/5">
                  <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Audio Recording</h4>
                  {elevenLabsData.audio_url ? (
                    <AudioPlayer src={elevenLabsData.audio_url} className="mt-4" />
                  ) : (
                    <div className="p-4 border border-border bg-accent/20 flex flex-col items-center justify-center space-y-2 py-8">
                       <div className="w-4 h-4 border-2 border-primary border-t-transparent animate-spin rounded-full opacity-30" />
                       <span className="italic text-[10px] text-muted-foreground uppercase tracking-widest">Processing Audio...</span>
                    </div>
                  )}
                  <div className="pt-4 space-y-2">
                    <div className="flex justify-between text-[9px] uppercase tracking-widest">
                      <span className="text-muted-foreground font-mono">Duration</span>
                      <span className="font-mono text-foreground font-bold italic">
                        {Math.floor(elevenLabsData.metadata?.duration_seconds || 0)}s
                      </span>
                    </div>
                    <div className="flex justify-between text-[9px] uppercase tracking-widest">
                      <span className="text-muted-foreground font-mono">Link State</span>
                      <span className="text-emerald-500 font-bold italic">ENCRYPTED_ARCHIVE</span>
                    </div>
                  </div>
                </div>

                {/* Transcript */}
                <div className="md:col-span-2 p-6 bg-background">
                  <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-4">Transcription Stream</h4>
                  <div className="max-h-[350px] overflow-y-auto space-y-4 pr-4 scrollbar-thin scrollbar-thumb-primary/10">
                    {elevenLabsData.transcript?.map((entry: any, i: number) => (
                      <div key={i} className="group">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[8px] font-bold uppercase tracking-[0.2em] italic ${entry.role === 'agent' ? 'text-primary' : 'text-muted-foreground'}`}>
                             [{entry.role === 'agent' ? 'AGENT_01' : 'USER_CANDIDATE'}]
                          </span>
                        </div>
                        <div className={`p-3 border ${
                          entry.role === 'agent' 
                            ? 'bg-accent/10 border-primary/20 italic' 
                            : 'bg-muted/30 border-border'
                        } text-[13px] font-mono leading-relaxed transition-all group-hover:bg-accent/20`}>
                          {entry.message}
                        </div>
                      </div>
                    ))}
                    {(!elevenLabsData.transcript || elevenLabsData.transcript.length === 0) && (
                      <div className="flex flex-col items-center justify-center py-12 opacity-30">
                         <div className="w-8 h-[1px] bg-primary mb-2" />
                         <span className="text-[10px] uppercase tracking-widest">No data available</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Score Overview */}
        <Card className="bg-card border-border rounded-none overflow-hidden shadow-xl">
          <div className="h-1 bg-primary" style={{ width: `${score}%` }} />
          <CardContent className="pt-8 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono italic">Efficiency Score</span>
              <div className="text-7xl font-black tracking-tighter mt-2">{score}%</div>
            </div>
            <div className="flex-1 max-w-md space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                  <span>Confidence</span>
                  <span className="font-mono text-primary">{report?.confidence || 0}%</span>
                </div>
                <Progress 
                  value={report?.confidence || 0} 
                  className="h-2 rounded-none bg-white/10 [&>div]:bg-emerald-500" 
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                  <span>Clarity</span>
                  <span className="font-mono text-primary">{report?.clarity || 0}%</span>
                </div>
                <Progress 
                  value={report?.clarity || 0} 
                  className="h-2 rounded-none bg-white/10 [&>div]:bg-emerald-500" 
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                  <span>Relevance</span>
                  <span className="font-mono text-primary">{report?.relevance || 0}%</span>
                </div>
                <Progress 
                  value={report?.relevance || 0} 
                  className="h-2 rounded-none bg-white/10 [&>div]:bg-emerald-500" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          {/* What Went Well */}
          <section className="space-y-4">
            <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-foreground flex items-center gap-2 italic">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Positive Markers
            </h3>
            <div className="space-y-4">
              {(report?.strengths || []).map((item: string, i: number) => (
                <div key={i} className="p-4 bg-card border border-border text-sm text-muted-foreground leading-relaxed italic border-l-2 border-l-emerald-500/50">
                  &ldquo;{item}&rdquo;
                </div>
              ))}
            </div>
          </section>

          {/* What Didn't Go Well */}
          <section className="space-y-4">
            <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-foreground flex items-center gap-2 italic">
              <AlertCircle className="w-4 h-4 text-red-500" /> Optimization Points
            </h3>
            <div className="space-y-4">
              {(report?.improvements || []).map((item: string, i: number) => (
                <div key={i} className="p-4 bg-card border border-border text-sm text-muted-foreground leading-relaxed italic border-l-2 border-l-red-500/50">
                  &ldquo;{item}&rdquo;
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Improvement Areas & Actionable Items */}
        <Card className="bg-card border-border rounded-none border-l-4 border-l-primary shadow-xl">
          <CardHeader className="bg-accent/5">
            <CardTitle className="text-sm uppercase tracking-widest flex items-center gap-2 italic">
              <Lightbulb className="w-5 h-5 text-primary" /> Growth Vector Protocol
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-8 pt-8 pb-8">
            <div className="space-y-2">
              <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-4">Priority Improvement Areas</h4>
              <ul className="space-y-4">
                {(report?.priority_areas || []).map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-[13px] text-muted-foreground group">
                    <span className="text-primary font-mono font-bold">0{i+1}</span>
                    <span className="group-hover:text-foreground transition-colors leading-relaxed italic border-b border-border/30 pb-1 w-full">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-4">Actionable Directives</h4>
              <div className="space-y-4">
                {(report?.action_plan || []).map((action: any, i: number) => (
                  <div key={i} className="p-4 border border-border bg-accent/5 space-y-3 hover:bg-accent/10 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 italic ${
                        action.priority === "High" ? "bg-red-500/10 text-red-500 border border-red-500/20" : 
                        action.priority === "Medium" ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" : 
                        "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      }`}>
                        {action.priority} Priority
                      </span>
                      <span className="text-[9px] text-muted-foreground font-mono opacity-50">EST: {action.estimated_time}</span>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider mb-1 text-foreground">{action.title}</h5>
                      <p className="text-sm text-muted-foreground font-medium italic leading-relaxed">{action.description}</p>
                    </div>
                  </div>
                ))}
                {(!report?.action_plan || report.action_plan.length === 0) && (
                   <p className="text-xs text-muted-foreground italic">No specific action plan generated.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center pt-8 mb-12">
          <Link href="/interview/create">
            <button className="bg-primary text-primary-foreground uppercase font-black tracking-[0.3em] px-12 h-14 cursor-pointer shadow-2xl hover:opacity-90 hover:scale-[1.02] active:scale-100 transition-all border border-primary-foreground/20">
              Initiate New Training Protocol
            </button>
          </Link>
        </div>
      </div>
      
      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: var(--primary);
          border-radius: 10px;
          opacity: 0.1;
        }
      `}</style>
    </div>
  );
}
