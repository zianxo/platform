"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Send, X, Bot, MessageSquare, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ClientAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your dedicated account assistant. Ask me anything about your projects, spend, or team.",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Prefetch data for context (silently)
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: api.projects.list, enabled: isOpen });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Mock AI Logic
    setTimeout(() => {
      let responseText = "I can help you with project updates and financial insights. Try asking 'How are my projects?' or 'What is my spend this month?'";
      const lowerInput = userMsg.content.toLowerCase();

      if (lowerInput.includes("project")) {
        const activeProjects = projects?.filter((p: any) => p.status === 'ACTIVE') || [];
        if (activeProjects.length > 0) {
            responseText = `You currently have ${activeProjects.length} active projects: ${activeProjects.map((p: any) => p.name).join(", ")}. Everything is running on schedule.`;
        } else {
            responseText = "You don't have any active projects at the moment. Would you like to start one?";
        }
      } else if (lowerInput.includes("spend") || lowerInput.includes("cost") || lowerInput.includes("budget")) {
        responseText = "Your total spend for this month is estimated at $3,800, which is 15% under your allocated budget of $4,500. Great job managing efficiency!";
      } else if (lowerInput.includes("status")) {
         responseText = "Your overall account status is healthy. All invoices are paid, and team efficiency is at 94%.";
      } else if (lowerInput.includes("team") || lowerInput.includes("talent")) {
         responseText = "Your dedicated team consists of 3 senior engineers. They logged 120 hours last week with high velocity.";
      } else if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
          responseText = "Hello! How can I assist you today?";
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseText,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500); // 1.5s delay for realism
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
           <motion.div
             initial={{ opacity: 0, scale: 0.9, y: 20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.9, y: 20 }}
             className="fixed bottom-24 right-6 z-50 w-[380px] origin-bottom-right"
           >
            <Card className="border-primary/20 shadow-2xl shadow-primary/10 overflow-hidden glass-card">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent p-4 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                      <Sparkles className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold">Talent AI</CardTitle>
                      <CardDescription className="text-xs text-primary/80 font-medium">Assistant Online</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-6 w-6 rounded-full hover:bg-white/10">
                    <X className="size-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex flex-col h-[450px]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                    {messages.map((msg) => (
                        <div key={msg.id} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "")}>
                            <div className={cn(
                                "size-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm",
                                msg.role === 'user' ? "bg-muted text-muted-foreground border-border" : "bg-indigo-100 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-500/30"
                            )}>
                                {msg.role === 'user' ? <User className="size-4" /> : <Bot className="size-4" />}
                            </div>
                            <div className={cn(
                                "rounded-2xl px-4 py-2.5 max-w-[80%] text-sm shadow-sm",
                                msg.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border border-border/50 text-foreground rounded-tl-none"
                            )}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                         <div className="flex gap-3">
                            <div className="size-8 rounded-full flex items-center justify-center shrink-0 border bg-indigo-100 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-500/30">
                                <Bot className="size-4" />
                            </div>
                            <div className="bg-card border border-border/50 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1">
                                <div className="size-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="size-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="size-1.5 rounded-full bg-indigo-400 animate-bounce"></div>
                            </div>
                         </div>
                    )}
                </div>
                <div className="p-4 bg-muted/20 border-t border-border/40">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input 
                        placeholder="Type a message..." 
                        className="bg-background/50 border-primary/10 focus-visible:ring-primary/20 transition-all rounded-xl"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    <Button type="submit" size="icon" disabled={!inputValue.trim() || isTyping} className="rounded-xl shadow-lg shadow-primary/20">
                        <Send className="size-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
           </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="fixed bottom-6 right-6 z-50"
        >
            <Button 
                onClick={() => setIsOpen(true)}
                className="size-14 rounded-full shadow-2xl shadow-primary/30 bg-gradient-to-tr from-indigo-500 to-purple-600 hover:scale-105 transition-all duration-300 border-2 border-white/20"
            >
                <Sparkles className="size-6 text-white" />
            </Button>
        </motion.div>
      )}
    </>
  );
}
