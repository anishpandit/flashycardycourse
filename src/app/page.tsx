'use client';

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function RedirectToDashboard() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);
  
  return (
    <div className="text-center">
      <p className="text-xl text-muted-foreground">
        Redirecting to dashboard...
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignedOut>
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-foreground">
              FlashyCardy
            </h1>
            <p className="text-xl text-muted-foreground">
              Your personal flashcard platform
            </p>
          </div>
          
          <div className="flex gap-4 justify-center">
            <SignInButton>
              <Button variant="default" size="lg">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button variant="outline" size="lg">
                Sign Up
              </Button>
            </SignUpButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <RedirectToDashboard />
      </SignedIn>
    </div>
  );
}
