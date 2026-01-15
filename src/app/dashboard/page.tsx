
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Video, Clock, CheckCircle, Terminal } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function DashboardPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    const fetchInterviews = async () => {
      if (!user) return;
      
      try {
        const res = await fetch(`/api/interviews?user_id=${user.id}`);
        const data = await res.json();
        setInterviews(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching interviews:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchInterviews();
    }
  }, [user, router, loading]);

  if (loading) {
    return (
      <div className="container mx-auto py-32 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent animate-spin rounded-full" />
        <p className="text-[10px] uppercase tracking-[0.4em] font-mono animate-pulse">Syncing Control Panel...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-16">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-4 h-4 text-primary opacity-50" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-bold">OPERATIONAL_FEED</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic text-foreground">
            Control Panel
          </h1>
          <p className="text-muted-foreground uppercase text-[10px] tracking-[0.3em] mt-2 border-l-2 border-primary/30 pl-4">
            Active Sessions and Historical Data
          </p>
        </div>
        <Link href="/interview/create">
          <Button className="h-14 px-8 rounded-none uppercase font-black tracking-[0.2em] gap-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)] transition-all bg-primary text-primary-foreground">
            <Plus className="w-5 h-5" /> New Session
          </Button>
        </Link>
      </div>

      {interviews.length === 0 ? (
        <div className="py-32 border border-dashed border-border flex flex-col items-center justify-center space-y-6 bg-accent/5">
          <div className="p-6 bg-accent/20 border border-border">
            <Video className="w-12 h-12 text-muted-foreground opacity-20" />
          </div>
          <div className="text-center">
            <h3 className="text-sm uppercase tracking-[0.3em] font-bold">No Active Sessions</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2 italic">Initiate protocol to begin training</p>
          </div>
          <Link href="/interview/create">
            <Button variant="outline" className="rounded-none uppercase text-[10px] tracking-widest px-8">
              Start First Session
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {interviews.map((interview) => (
            <Card key={interview.id} className="bg-card border-border rounded-none group hover:border-primary transition-all shadow-lg hover:shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -mr-12 -mt-12 rotate-45 pointer-events-none" />
              
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-accent text-accent-foreground rounded-none border-none uppercase text-[9px] tracking-[0.2em] px-2 py-1 font-bold">
                    {interview.complexity || "MEDIUM"}
                  </Badge>
                  <div className="text-[9px] text-muted-foreground flex items-center gap-1.5 uppercase tracking-widest font-mono">
                    <Clock className="w-3 h-3 opacity-50" /> {new Date(interview.created_at).toLocaleDateString()}
                  </div>
                </div>
                <CardTitle className="text-xl font-black transition-colors uppercase italic tracking-tight group-hover:text-primary">
                  {interview.topic}
                </CardTitle>
              </CardHeader>

              <CardContent className="pb-8">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  {interview.status === "completed" ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500 italic">ARCHIVED_SUCCESS</span>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 border border-primary/50 rounded-full animate-pulse" />
                      <span className="italic">PENDING_LINK</span>
                    </>
                  )}
                </div>
                {interview.job_description && (
                   <p className="mt-4 text-[11px] text-muted-foreground line-clamp-2 italic font-mono opacity-60">
                     {interview.job_description}
                   </p>
                )}
              </CardContent>

              <CardFooter className={`grid ${interview.status === 'completed' ? 'grid-cols-1' : 'grid-cols-2'} gap-4 border-t border-border/50 pt-6`}>
                <Link href={`/interview/${interview.id}/feedback`} className="w-full">
                  <Button 
                    variant={interview.status === 'completed' ? 'default' : 'outline'} 
                    className="w-full h-11 rounded-none border-border text-[10px] uppercase tracking-[0.2em] font-bold transition-all shadow-md"
                  >
                    {interview.status === 'completed' ? 'View Full Analysis' : 'Analysis'}
                  </Button>
                </Link>
                {interview.status !== 'completed' && (
                  <Link href={`/interview/${interview.id}`} className="w-full">
                    <Button className="w-full h-11 rounded-none text-[10px] uppercase font-bold tracking-[0.2em] flex gap-2 shadow-md">
                      <Video className="w-3.5 h-3.5" /> Enter
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

