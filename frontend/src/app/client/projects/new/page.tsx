"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function NewProjectPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" asChild>
                <Link href="/"><ArrowLeft className="size-4" /></Link>
             </Button>
             <div>
                <h1 className="text-2xl font-bold tracking-tight">Request New Project</h1>
                <p className="text-muted-foreground">Define your requirements and budget.</p>
             </div>
        </div>

        <Card>
             <CardHeader>
                 <CardTitle>Project Details</CardTitle>
                 <CardDescription>Tell us about what you want to build or achieve.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
                 <div className="space-y-2">
                     <Label htmlFor="name">Project Name</Label>
                     <Input id="name" placeholder="e.g. Mobile App Redesign" />
                 </div>
                 
                 <div className="space-y-2">
                     <Label htmlFor="description">Description & Goals</Label>
                     <Textarea id="description" placeholder="Describe the project scope, objectives, and any specific technologies required..." className="min-h-[120px]" />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <Label htmlFor="budget">Monthly Budget (USD)</Label>
                          <div className="relative">
                              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                              <Input id="budget" type="number" placeholder="5000" className="pl-7" />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="timeline">Expected Start Date</Label>
                          <Input id="timeline" type="date" />
                      </div>
                 </div>

                 <Separator />

                 <div className="space-y-4">
                     <Label>Talent Requirements</Label>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors bg-muted/20">
                             <div className="flex items-start justify-between">
                                 <span className="font-bold">Senior Engineer</span>
                                 <CheckCircle2 className="size-4 text-primary" />
                             </div>
                             <p className="text-xs text-muted-foreground mt-1">5+ years experience • Lead capability</p>
                         </div>
                         <div className="border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors">
                             <div className="flex items-start justify-between">
                                 <span className="font-bold">Mid-Level Engineer</span>
                             </div>
                             <p className="text-xs text-muted-foreground mt-1">3+ years experience • Execution focus</p>
                         </div>
                         <div className="border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors">
                             <div className="flex items-start justify-between">
                                 <span className="font-bold">Designer</span>
                             </div>
                             <p className="text-xs text-muted-foreground mt-1">UI/UX Specialist</p>
                         </div>
                         <div className="border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors">
                            <div className="flex items-center justify-center h-full text-sm font-medium text-muted-foreground">
                                + Add Custom Role
                            </div>
                         </div>
                     </div>
                 </div>
             </CardContent>
             <CardFooter className="flex justify-end gap-2 border-t bg-muted/10 px-6 py-4">
                  <Button variant="ghost" asChild>
                      <Link href="/">Cancel</Link>
                  </Button>
                  <Button>Submit Request</Button>
             </CardFooter>
        </Card>
    </div>
  );
}
