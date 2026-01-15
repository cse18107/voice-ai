"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { Terminal, Loader2 } from "lucide-react";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signUp(email, password, fullName);
      // Router push handled in context
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      <Card className="w-full max-w-md border-border bg-card/80 backdrop-blur-md rounded-none shadow-2xl relative z-10">
        <CardHeader className="space-y-3 border-b border-border/50 pb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 border border-primary/20">
              <Terminal className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground font-mono">REGISTRATION_PROTOCOL</span>
          </div>
          <CardTitle className="text-2xl font-black tracking-tighter uppercase italic">Create Account</CardTitle>
          <CardDescription className="text-muted-foreground uppercase text-[10px] tracking-[0.2em]">
            Register your biometric data to begin.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 pt-6">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/50 text-destructive text-xs uppercase tracking-widest">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-muted-foreground uppercase text-[10px] tracking-widest font-bold flex justify-between">
                <span>Full Name</span>
                <span className="text-muted-foreground/50 font-mono">USER_ID</span>
              </Label>
              <Input 
                id="name" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe" 
                className="bg-transparent border-border focus:border-primary transition-colors rounded-none h-11"
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground uppercase text-[10px] tracking-widest font-bold flex justify-between">
                <span>Email</span>
                <span className="text-muted-foreground/50 font-mono">AUTH_EMAIL</span>
              </Label>
              <Input 
                id="email" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@voice.ai" 
                className="bg-transparent border-border focus:border-primary transition-colors rounded-none h-11"
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground uppercase text-[10px] tracking-widest font-bold flex justify-between">
                <span>Password</span>
                <span className="text-muted-foreground/50 font-mono">SECURE_KEY</span>
              </Label>
              <Input 
                id="password" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-border focus:border-primary transition-colors rounded-none h-11"
                required
                disabled={loading}
                minLength={6}
              />
              <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest italic">Min. 6 characters</p>
            </div>
            
            <Button 
              type="submit"
              disabled={loading}
              className="w-full rounded-none uppercase font-black tracking-[0.2em] shadow-lg h-12 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Initialize Signup"
              )}
            </Button>
          </CardContent>
        </form>
        
        <CardFooter className="flex flex-col space-y-4 border-t border-border/50 pt-6">
          <div className="text-[10px] text-center text-muted-foreground uppercase tracking-[0.2em]">
            Already have an account?{" "}
            <Link href="/login" className="text-foreground hover:text-primary transition-colors font-bold underline-offset-4 hover:underline">
              Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
