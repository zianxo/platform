"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    AreaChart,
    Area,
    ResponsiveContainer
} from 'recharts';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { format, subDays } from "date-fns";

// HELPER: Generate Sparkline Data
const generateSparkline = (basePrice: number, points = 20) => {
    let current = basePrice;
    return Array.from({ length: points }).map((_, i) => {
        const change = (Math.random() - 0.5) * (basePrice * 0.05); // 5% volatility
        current += change;
        return { i, value: current };
    });
};

// HELPER: Generate Portfolio History
const GENERATE_HISTORY = () => {
    let value = 150000;
    const data = [];
    for (let i = 90; i >= 0; i--) {
        const change = (Math.random() - 0.45) * 2000;
        value += change;
        data.push({
            date: format(subDays(new Date(), i), "MMM d"),
            value: value
        });
    }
    return data;
};

const CHART_HISTORY = GENERATE_HISTORY();

// MOCK DATA FOR STOCKS (With Sparklines)
const MOCK_STOCKS = [
    { symbol: "TSLA", name: "Tesla, Inc.", price: 248.50, change: 12.40, changePct: 5.2, shares: 45, investor: "GEO" },
    { symbol: "NVDA", name: "NVIDIA Corp", price: 875.20, change: -5.60, changePct: -0.8, shares: 12, investor: "IMAD" },
    { symbol: "AAPL", name: "Apple Inc.", price: 173.40, change: 0.85, changePct: 0.5, shares: 150, investor: "GEO" },
    { symbol: "BTC", name: "Bitcoin", price: 64200.00, change: 1200.00, changePct: 1.9, shares: 0.5, investor: "IMAD" },
    { symbol: "AMZN", name: "Amazon.com", price: 180.10, change: -2.10, changePct: -1.2, shares: 60, investor: "JOINT" },
    { symbol: "MSFT", name: "Microsoft", price: 415.00, change: 3.20, changePct: 0.8, shares: 30, investor: "GEO" },
    { symbol: "GOOGL", name: "Alphabet", price: 155.20, change: -1.50, changePct: -0.9, shares: 55, investor: "JOINT" },
].map(s => ({
    ...s,
    history: generateSparkline(s.price)
}));

interface CreateInvestmentForm {
    name: string;
    investor: string;
    initial_amount: number;
    current_value: number;
    start_date: string;
}

export default function InvestmentsPage() {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [view, setView] = useState("total");
    const { data: dbInvestments } = useQuery({ queryKey: ["finance", "investments"], queryFn: api.finance.investments.list });
    
    // Form handling
    const { register, handleSubmit, reset } = useForm<CreateInvestmentForm>();
    const onSubmit = async (data: CreateInvestmentForm) => {
        try {
            await api.finance.investments.create({
                ...data,
                initial_amount: Number(data.initial_amount),
                current_value: Number(data.current_value)
            });
            queryClient.invalidateQueries({ queryKey: ["finance", "investments"] });
            toast.success("Investment added");
            setIsCreateOpen(false);
            reset();
        } catch (e) {
            toast.error("Failed to add investment");
        }
    };

    // Combine Data
    const combinedPortfolio = useMemo(() => {
        const stocks = MOCK_STOCKS.map(s => ({
            id: s.symbol,
            name: s.name,
            symbol: s.symbol,
            current_value: s.price * s.shares,
            initial_amount: (s.price * s.shares) * 0.9,
            investor: s.investor,
            changePct: s.changePct,
            isStock: true,
            shares: s.shares,
            price: s.price,
            history: s.history
        }));

        const dbItems = dbInvestments?.map(i => ({
            ...i,
            symbol: i.name.substring(0, 3).toUpperCase(),
            changePct: 0,
            isStock: false,
            shares: 1,
            price: i.current_value,
            change: 0,
            history: generateSparkline(i.current_value) // Mock history for custom items
        })) || [];

        return [...stocks, ...dbItems];
    }, [dbInvestments]);

    // Filter
    const filteredPortfolio = useMemo(() => {
        if (view === "total") return combinedPortfolio;
        return combinedPortfolio.filter(i => i.investor?.toUpperCase() === view.toUpperCase() || (view === "total" && i.investor === "JOINT"));
    }, [combinedPortfolio, view]);

    // Calculators
    const totalValue = filteredPortfolio.reduce((acc, i) => acc + i.current_value, 0);
    const totalDailyChange = filteredPortfolio.reduce((acc, i) => acc + ((i.changePct || 0) / 100) * i.current_value, 0);
    const totalDailyChangePct = totalValue > 0 ? (totalDailyChange / totalValue) * 100 : 0;

    // Stacked Data for Allocation
    const stackedData = useMemo(() => {
         const topHoldings = [...combinedPortfolio]
            .sort((a, b) => b.current_value - a.current_value)
            .slice(0, 5)
            .map(h => h.name);
            
         const dataMap: Record<string, any> = {};
         
         // Initialize
         topHoldings.forEach(name => {
             dataMap[name] = { name, Geo: 0, Imad: 0, Joint: 0, Other: 0 };
         });
         
         combinedPortfolio.forEach(item => {
             const key = topHoldings.includes(item.name) ? item.name : "Other";
             if (!dataMap[key]) dataMap[key] = { name: "Other", Geo: 0, Imad: 0, Joint: 0, Other: 0 };
             
             const inv = item.investor?.toUpperCase() || "OTHER";
             if (inv === "GEO") dataMap[key].Geo += item.current_value;
             else if (inv === "IMAD") dataMap[key].Imad += item.current_value;
             else if (inv === "JOINT") dataMap[key].Joint += item.current_value;
             else dataMap[key].Other += item.current_value;
         });
         
         return Object.values(dataMap);
    }, [combinedPortfolio]);

    const chartConfig = {
        Geo: { label: "Geo", color: "hsl(var(--chart-1))" },
        Imad: { label: "Imad", color: "hsl(var(--chart-2))" },
        Joint: { label: "Joint", color: "hsl(var(--chart-3))" },
        Other: { label: "Other", color: "hsl(var(--chart-5))" },
    } satisfies ChartConfig;

    const portfolioConfig = {
        value: { label: "Portfolio Value", color: "hsl(var(--primary))" }
    } satisfies ChartConfig;

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                     <h1 className="text-4xl font-black tracking-tighter">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h1>
                     <div className="flex items-center gap-3 mt-2 text-sm font-medium">
                        <span className={`flex items-center ${totalDailyChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {totalDailyChange >= 0 ? <TrendingUp className="mr-1 size-4" /> : <TrendingDown className="mr-1 size-4" />}
                            ${Math.abs(totalDailyChange).toLocaleString()} ({Math.abs(totalDailyChangePct).toFixed(2)}%)
                        </span>
                        <span className="text-muted-foreground">Today</span>
                     </div>
                </div>

                <div className="flex items-center gap-3">
                     <Tabs value={view} onValueChange={setView} className="bg-muted/50 p-1 rounded-xl h-10">
                        <TabsList className="h-8 bg-transparent">
                            <TabsTrigger value="total" className="rounded-lg px-4 text-xs font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Total</TabsTrigger>
                            <TabsTrigger value="geo" className="rounded-lg px-4 text-xs font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Geo</TabsTrigger>
                            <TabsTrigger value="imad" className="rounded-lg px-4 text-xs font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Imad</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="font-bold rounded-xl h-10 shadow-lg shadow-primary/20" size="sm">
                                <Plus className="size-4 mr-2" /> Add Asset
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-2xl">
                             <DialogHeader>
                                <DialogTitle>Add Custom Asset</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Asset Name</Label>
                                    <Input id="name" {...register("name", { required: true })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="investor">Owner</Label>
                                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register("investor", { required: true })}>
                                        <option value="GEO">Geo</option>
                                        <option value="IMAD">Imad</option>
                                        <option value="JOINT">Joint</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="initial">Cost Basis</Label>
                                        <Input id="initial" type="number" step="0.01" {...register("initial_amount", { required: true })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="current">Current Value</Label>
                                        <Input id="current" type="number" step="0.01" {...register("current_value", { required: true })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="start_date">Acquired Date</Label>
                                    <Input id="start_date" type="date" {...register("start_date", { required: true })} />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" className="w-full font-bold rounded-xl">Add to Portfolio</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Main Portfolio Chart */}
            <ChartContainer config={portfolioConfig} className="w-full h-[350px]">
                <AreaChart data={CHART_HISTORY} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} stroke="var(--border)" />
                    <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                        minTickGap={40}
                    />
                    <ChartTooltip 
                        content={<ChartTooltipContent />}
                        cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area
                        dataKey="value"
                        type="monotone"
                        fill="url(#fillValue)"
                        stroke="var(--primary)"
                        strokeWidth={3}
                    />
                </AreaChart>
            </ChartContainer>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Col: Holdings List */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                         <h3 className="text-xl font-bold tracking-tight">Portfolio Holdings</h3>
                         <div className="text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                            {filteredPortfolio.length} Assets
                         </div>
                    </div>
                    
                    <div className="space-y-3">
                        {filteredPortfolio.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-all group cursor-pointer shadow-sm hover:shadow-md">
                                {/* Asset Info */}
                                <div className="flex items-center gap-4 w-[25%]">
                                     <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shadow-sm">
                                        {item.symbol}
                                     </div>
                                     <div>
                                         <p className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors">{item.name}</p>
                                         <p className="text-xs text-muted-foreground font-medium">{item.shares} shares</p>
                                     </div>
                                </div>

                                {/* Mini Chart (Sparkline) */}
                                <div className="hidden md:block w-[30%] h-[40px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={item.history}>
                                            <defs>
                                                <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={item.changePct >= 0 ? "var(--emerald-500)" : "var(--red-500)"} stopOpacity={0.2} />
                                                    <stop offset="100%" stopColor={item.changePct >= 0 ? "var(--emerald-500)" : "var(--red-500)"} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Area 
                                                type="monotone" 
                                                dataKey="value" 
                                                stroke={item.changePct >= 0 ? "#10b981" : "#ef4444"} 
                                                strokeWidth={2}
                                                fillOpacity={1}
                                                fill="transparent"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Value & Change */}
                                <div className="text-right w-[25%]">
                                    <p className="font-bold text-sm">${item.current_value.toLocaleString()}</p>
                                    <div className={`text-xs font-bold flex items-center justify-end mt-0.5 ${item.changePct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {item.changePct >= 0 ? <ArrowUpRight className="size-3 mr-0.5" /> : <ArrowDownRight className="size-3 mr-0.5" />}
                                        {Math.abs(item.changePct).toFixed(2)}%
                                    </div>
                                </div>
                                
                                <div className="w-[5%] flex justify-end">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                        <MoreHorizontal className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Col: Allocation & Stats */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold tracking-tight">Analysis</h3>
                    
                     {/* Allocation Chart */}
                     <Card className="border-border/50 bg-card shadow-sm ring-1 ring-border/5 rounded-xl overflow-hidden">
                         <CardHeader>
                             <CardTitle className="text-base font-bold">Allocation</CardTitle>
                             <CardDescription>Distribution by owner</CardDescription>
                         </CardHeader>
                         <CardContent>
                            <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                <BarChart accessibilityLayer data={stackedData} layout="vertical" margin={{ left: 0 }}>
                                    <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        tickLine={false} 
                                        axisLine={false} 
                                        width={60} 
                                        tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontWeight: 600 }} 
                                    />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                    <Bar dataKey="Geo" stackId="a" fill="var(--chart-1)" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="Imad" stackId="a" fill="var(--chart-2)" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="Joint" stackId="a" fill="var(--chart-3)" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="Other" stackId="a" fill="var(--chart-5)" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ChartContainer>
                         </CardContent>
                     </Card>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="border-border/50 bg-card shadow-sm ring-1 ring-border/5 rounded-xl overflow-hidden">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top Gainer</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="text-lg font-bold text-emerald-500">TSLA</div>
                                <p className="text-xs font-medium text-emerald-500 flex items-center">
                                    +5.20% <TrendingUp className="size-3 ml-1" />
                                </p>
                            </CardContent>
                        </Card>
                         <Card className="border-border/50 bg-card shadow-sm ring-1 ring-border/5 rounded-xl overflow-hidden">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top Loser</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="text-lg font-bold text-red-500">AMZN</div>
                                <p className="text-xs font-medium text-red-500 flex items-center">
                                    -1.20% <TrendingDown className="size-3 ml-1" />
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
