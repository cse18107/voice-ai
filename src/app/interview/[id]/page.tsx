"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, PhoneOff, Play, Terminal, User } from "lucide-react";
import Image from "next/image";
import { useConversation } from "@elevenlabs/react";
import { useAuth } from "@/contexts/auth-context";

export default function InterviewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<{ text: string; role: "user" | "ai" }[]>([]);
  const [interviewData, setInterviewData] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [micMuted, setMicMuted] = useState(false);
  
  const conversation = useConversation({
    onConnect: async ({ conversationId }) => {
      console.log("Connected with conversationId:", conversationId);
      // Update database with conversationId
      await fetch(`/api/interviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: conversationId }),
      });
    },
    onMessage: (message: { message: string; source: string }) => {
      setMessages((prev) => [...prev, { text: message.message, role: message.source === "ai" ? "ai" : "user" }]);
    },
    onError: (message: string) => {
      console.error("Conversation Error:", message);
    },
  });

  const { status, isSpeaking } = conversation;

  // Fetch interview data
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const response = await fetch(`/api/interviews/${id}`);
        const data = await response.json();
        setInterviewData(data);
      } catch (error) {
        console.error("Error fetching interview:", error);
      }
    };
    fetchInterview();
  }, [id]);

  // Auto-scroll transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startInterview = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
      if (!agentId) {
        throw new Error("Missing NEXT_PUBLIC_ELEVENLABS_AGENT_ID");
      }
      
      // @ts-expect-error - The SDK types can be restrictive
      await conversation.startSession({
        agentId: agentId,
        // We can pass context here if needed
        dynamicVariables: {
          topic: interviewData?.topic,
          job_description: interviewData?.job_description,
          complexity: interviewData?.complexity,
          candidate_name: user?.user_metadata?.full_name || "Candidate",
          resume_text: interviewData?.resume_text || "",
        }
      });
    } catch (error) {
      console.error("Failed to start interview:", error);
      alert("Microphone access is required for the voice agent to function.");
    }
  }, [conversation, interviewData, user]);

  const endInterview = useCallback(async () => {
    await conversation.endSession();
    
    // Update status to completed
    await fetch(`/api/interviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });

    router.push(`/interview/${id}/feedback`);
  }, [conversation, router, id]);


  return (
    <div className="fixed inset-0 bg-background pt-16 flex flex-col overflow-hidden">
      {/* Background Grid Decoration */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      <main className="flex-1 relative z-10 w-full flex flex-col p-4 md:p-8 gap-4 overflow-hidden">
        
        {/* Top Section: Agent & Candidate Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[40%] min-h-[300px]">
          {/* Left: Agent Visual */}
          <div className="relative bg-card border border-border rounded-none flex flex-col items-center justify-center p-6 overflow-hidden shadow-xl group">
             {/* Status Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-background/80 backdrop-blur-md px-2 py-1 border border-border z-20">
              <div className={`w-1.5 h-1.5 rounded-full ${status === "connected" ? "bg-emerald-500 animate-pulse" : "bg-zinc-500"}`} />
              <span className="text-[9px] uppercase tracking-widest font-bold">Agent_Interrogator</span>
            </div>

            <div className="absolute top-4 right-4 z-20">
               <Terminal className="w-3 h-3 text-primary opacity-30" />
            </div>

            {/* Avatar */}
            <div className="relative w-40 h-40 md:w-48 md:h-48 transition-all duration-500">
               <div className={`absolute -inset-4 rounded-full border border-primary/20 transition-all duration-700 ${isSpeaking ? "scale-110 opacity-100" : "scale-100 opacity-0"}`} />
               <Image 
                src="/images/ai_agent.png" 
                alt="AI Interviewer" 
                fill 
                className={`object-cover rounded-full border-2 border-primary/30 grayscale transition-all duration-700 ${isSpeaking ? "grayscale-0 scale-105" : "grayscale-80"}`}
                priority
              />
            </div>
            
            <p className="mt-4 text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">
              {isSpeaking ? "Transmitting..." : "Monitoring..."}
            </p>
          </div>

          {/* Right: Candidate Visual (Avatar/User) */}
          <div className="relative bg-card border border-border rounded-none flex flex-col items-center justify-center p-6 overflow-hidden shadow-xl">
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-background/80 backdrop-blur-md px-2 py-1 border border-border z-20">
              <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">User_Candidate</span>
            </div>

            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border border-border bg-muted/30 flex items-center justify-center">
              <User className="w-20 h-20 text-muted-foreground opacity-20" />
            </div>

            <p className="mt-4 text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">
              {status === "connected" ? "Sync_Active" : "Link_Standby"}
            </p>
          </div>
        </div>

        {/* Bottom Section: Transcript Area */}
        <div className="flex-1 bg-card border border-border flex flex-col rounded-none shadow-2xl min-h-0 overflow-hidden">
          <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary/50 rotate-45" /> Live Protocol Stream
            </span>
            <span className="text-[9px] font-mono opacity-30">HEX_V_LINK_88</span>
          </div>
          
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin scrollbar-thumb-primary/10 bg-background/20"
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-20">
                <div className="w-8 h-[1px] bg-primary/50" />
                <span className="text-[9px] uppercase tracking-[0.4em] font-mono">Initiate link to begin stream...</span>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"} animate-in fade-in slide-in-from-bottom-1 duration-300`}>
                <div className="max-w-[85%] md:max-w-[70%]">
                  <div className={`flex items-center gap-2 mb-1 opacity-40 ${msg.role === "ai" ? "flex-row" : "flex-row-reverse"}`}>
                    <span className="text-[9px] font-bold uppercase tracking-widest italic">
                      {msg.role === "ai" ? "AGENT" : "YOU"}
                    </span>
                  </div>
                  <div className={`p-3 border ${
                    msg.role === "ai" 
                      ? "bg-muted/40 border-primary/10 text-foreground text-sm italic" 
                      : "bg-primary/5 border-primary/20 text-foreground text-sm"
                  } font-mono leading-relaxed`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="h-24 border-t border-border bg-background flex items-center justify-center p-4 relative z-20">
        <div className="max-w-4xl w-full flex items-center justify-between">
          
          {/* Start/Status Info */}
          <div className="hidden sm:flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Link Status</span>
            <span className={`text-xs font-mono font-bold ${status === "connected" ? "text-emerald-500" : "text-zinc-500"}`}>
               {status === "connected" ? "STABLE_CHANNEL" : "DISCONNECTED"}
            </span>
          </div>

          <div className="flex items-center gap-4 mx-auto sm:mx-0">
            {status !== "connected" ? (
              <Button 
                onClick={startInterview}
                disabled={status === "connecting"}
                className="h-12 px-10 bg-primary text-primary-foreground hover:bg-primary/90 rounded-none uppercase font-bold tracking-[0.2em] flex gap-3 shadow-lg"
              >
                {status === "connecting" ? "Linking..." : <><Play className="w-4 h-4" /> Initialize Interview</>}
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setMicMuted(!micMuted)}
                  className={`w-12 h-12 rounded-none border-border transition-all ${micMuted ? "bg-destructive text-destructive-foreground border-destructive" : "hover:bg-accent text-foreground"}`}
                >
                  {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>

                <Button 
                  onClick={endInterview}
                  className="h-12 px-10 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-none uppercase font-bold tracking-[0.2em] flex gap-3 shadow-lg"
                >
                  <PhoneOff className="w-4 h-4" /> End Session
                </Button>
              </>
            )}
          </div>

          {/* Encryption Indicator */}
          <div className="hidden sm:flex items-center gap-2 opacity-30">
             <div className="w-1 h-1 bg-emerald-500 rounded-full" />
             <span className="text-[9px] font-mono uppercase tracking-widest">Quantum_Encryption_On</span>
          </div>
        </div>
      </footer>

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
