"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { user, signOut, loading, interviewCount } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/50 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-black tracking-tighter text-foreground uppercase italic">
          VOICE.AI
        </Link>
        
        <div className="flex items-center gap-6">
          {user && user.role === 'guest' && (
             <div className="hidden md:flex flex-col items-end mr-4 border-r border-border/50 pr-6">
               <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground font-mono">Sessions Remaining</span>
               <span className={`text-xs font-black tracking-tighter ${3 - interviewCount <= 0 ? 'text-destructive animate-pulse' : 'text-primary'}`}>
                 {Math.max(0, 3 - interviewCount)} / 3 REMAINING
               </span>
             </div>
          )}
          {user ? (
            <>
              <Link 
                href="/dashboard" 
                className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-[0.2em]"
              >
                Dashboard
              </Link>
              <Link 
                href="/interview/create" 
                className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-[0.2em]"
              >
                New Interview
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="rounded-none border-border uppercase text-[10px] tracking-widest font-bold"
                  >
                    <User className="w-3 h-3 mr-2" />
                    {user.email?.split('@')[0]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-none border-border bg-white dark:bg-black" align="end">
                  <DropdownMenuLabel className="uppercase text-[9px] tracking-widest font-mono">
                    Account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => signOut()}
                    className="uppercase text-[10px] tracking-widest cursor-pointer focus:bg-destructive/10 focus:text-destructive"
                  >
                    <LogOut className="w-3 h-3 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {!loading && (
                <>
                  <Link 
                    href="/login" 
                    className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-[0.2em]"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/signup"
                    className="text-[10px] font-black border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-all uppercase tracking-[0.2em]"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </>
          )}
          
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
}
