"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FolderGit2, FileText, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { api, type ParentProject } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

// Mock Data for Charts
const spendData = [
  { name: 'Jan', estimated: 4000, actual: 2400 },
  { name: 'Feb', estimated: 3000, actual: 1398 },
  { name: 'Mar', estimated: 2000, actual: 9800 },
  { name: 'Apr', estimated: 2780, actual: 3908 },
  { name: 'May', estimated: 1890, actual: 4800 },
  { name: 'Jun', estimated: 2390, actual: 3800 },
];

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b'];

function SpendOverviewChart() {
    return (
        <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={spendData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
          <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
          <Tooltip 
            cursor={{fill: 'transparent'}}
            contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: 'rgba(0,0,0,0.8)', color: '#fff' }}
          />
          <Bar dataKey="actual" fill="#6366f1" radius={[4, 4, 0, 0]} name="Actual Spend" />
          <Bar dataKey="estimated" fill="#3b82f6" fillOpacity={0.3} radius={[4, 4, 0, 0]} name="Estimated" />
        </BarChart>
      </ResponsiveContainer>
    )
}

function ProjectStatusChart({ projects }: { projects: ParentProject[] }) {
    // Calculate simple stats
    const active = projects.filter(p => p.status === 'ACTIVE').length;
    const trial = projects.filter(p => p.status === 'TRIAL').length;
    const completed = projects.filter(p => p.status === 'COMPLETED').length;
    const draft = projects.length - active - trial - completed;

    const data = [
        { name: 'Active', value: active },
        { name: 'Trial', value: trial },
        { name: 'Completed', value: completed },
        { name: 'Draft', value: draft },
    ].filter(item => item.value > 0);

    // Default if empty
    if (data.length === 0) {
        data.push({ name: 'No Projects', value: 1 });
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: 'rgba(0,0,0,0.8)', color: '#fff' }} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    )
}

export default function ClientDashboard() {
  const [projects, setProjects] = useState<ParentProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        try {
            const data = await api.projects.list();
            setProjects(data || []);
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, []);

  const activeProjects = projects.filter(p => p.status === 'ACTIVE' || p.status === 'TRIAL');
  const activeCount = activeProjects.length;

  // Calculate generic stats for now
  // In real app, we'd fetch actual documents count and pending requests
  const documentsCount = 0; 
  const pendingCount = 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Client Portal</h1>
                <p className="text-muted-foreground">Manage your projects and talent.</p>
            </div>
            <div className="flex items-center gap-2">
                 <Button asChild>
                    <Link href="/projects/new">
                        <Plus className="mr-2 size-4" /> Request Project
                    </Link>
                 </Button>
            </div>
        </div>

        {/* Overview & Analytics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
             <Card className="col-span-4">
                 <CardHeader>
                     <CardTitle className="text-xl font-bold">Financial Overview</CardTitle>
                     <CardDescription>Estimated vs Actual Spend (YTD)</CardDescription>
                 </CardHeader>
                 <CardContent className="pl-2">
                     <div className="h-[300px] w-full">
                        <SpendOverviewChart />
                     </div>
                 </CardContent>
             </Card>
             <Card className="col-span-3">
                 <CardHeader>
                     <CardTitle className="text-xl font-bold">Project Status</CardTitle>
                     <CardDescription>Engagement Distribution</CardDescription>
                 </CardHeader>
                 <CardContent>
                    <div className="h-[300px] w-full">
                        <ProjectStatusChart projects={projects} />
                    </div>
                 </CardContent>
             </Card>
        </div>

        {/* Projects List */}
        <div>
            <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
            {loading ? (
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : projects.length === 0 ? (
                <Card className="min-h-[300px] flex flex-col items-center justify-center text-center p-8 border-dashed">
                    <div className="bg-muted/50 p-4 rounded-full mb-4">
                        <FolderGit2 className="size-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold">No projects yet</h3>
                    <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                        Get started by defining your first project requirements. We'll match you with the best talent.
                    </p>
                    <Button asChild>
                        <Link href="/projects/new">Start a Project</Link>
                    </Button>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <Card key={project.id} className="hover:bg-muted/50 transition-colors cursor-pointer group">
                             <Link href={`/projects/${project.id}`} className="block h-full">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
                                            {project.name}
                                        </CardTitle>
                                        <Badge variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                            {project.status}
                                        </Badge>
                                    </div>
                                    <CardDescription className="line-clamp-2 min-h-[40px]">
                                        {project.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                         <div className="flex justify-between">
                                            <span>Start Date:</span>
                                            <span className="font-medium text-foreground">
                                                {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
                                            </span>
                                         </div>
                                         <div className="flex justify-between">
                                            <span>Type:</span>
                                            <span className="font-medium text-foreground capitalize">
                                                {project.engagement_type?.replace(/_/g, " ").toLowerCase() || 'N/A'}
                                            </span>
                                         </div>
                                    </div>
                                    <Button variant="ghost" className="w-full mt-4 group-hover:bg-primary/10">
                                        View Details <ExternalLink className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardContent>
                             </Link>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}
