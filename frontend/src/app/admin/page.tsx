import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
    
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
         <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
           Hirefel <br />
           <span className="text-accent">Admin</span>
         </h1>
         <p className="text-xl text-muted-foreground max-w-2xl">
           The all-in-one operating system. Track talent, manage clients, and control your financials.
         </p>
         <div className="flex gap-4">
           <Link href="/dashboard">
             <Button size="lg" className="gap-2">
               Enter Dashboard <ArrowRight className="h-4 w-4" />
             </Button>
           </Link>
         </div>
      </main>
    </div>
  );
}
