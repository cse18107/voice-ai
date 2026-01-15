"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Zap, Target } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function HomePage() {
  const { user } = useAuth();
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
      {/* Background Grid Decoration */}
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.1]" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      <div className="relative z-10 max-w-4xl space-y-8">
        <div className="space-y-4">
          <Badge className="bg-accent text-accent-foreground rounded-none border border-border uppercase text-[10px] tracking-[0.3em] font-bold py-1 px-4 mb-4">
            AI-POWERED INTERVIEW COACH
          </Badge>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.9] text-foreground">
            Master Your <br />
            <span className="text-muted-foreground outline-text">Next Job</span> <br />
            Interview.
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto uppercase text-xs tracking-widest mt-6 leading-relaxed">
            Practice with our advanced Voice AI Agent. <br />
            Get instant feedback, detailed analysis, and a personalized action plan to land your dream job.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
          {user ? (
            <Link href="/dashboard">
              <Button className="rounded-none uppercase font-bold tracking-[0.2em] px-12 h-14 w-full sm:w-auto shadow-xl">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/signup">
                <Button className="rounded-none uppercase font-bold tracking-[0.2em] px-12 h-14 w-full sm:w-auto shadow-xl">
                  Start Practicing Free
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="rounded-none uppercase font-bold tracking-[0.2em] px-12 h-14 w-full sm:w-auto">
                  Login to Dashboard
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-24 border-t border-border mt-24">
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Zap className="w-4 h-4 text-foreground" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-foreground">Realistic Voice AI</span>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Natural conversation flow</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Shield className="w-4 h-4 text-foreground" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-foreground">Instant Feedback</span>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Detailed Performance Reports</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Target className="w-4 h-4 text-foreground" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-foreground">Personalized Plans</span>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Tailored Growth Roadmap</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      {children}
    </div>
  );
}
