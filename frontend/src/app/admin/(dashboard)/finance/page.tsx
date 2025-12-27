"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, DollarSign, TrendingUp, TrendingDown, PiggyBank, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function FinancePage() {
  const { data: capital, isLoading: loadingCapital } = useQuery({ queryKey: ["finance", "capital"], queryFn: api.finance.capital.list });
  const { data: investments, isLoading: loadingInvestments } = useQuery({ queryKey: ["finance", "investments"], queryFn: api.finance.investments.list });
  const { data: budgets, isLoading: loadingBudgets } = useQuery({ queryKey: ["finance", "budgets"], queryFn: api.finance.budgets.list });
  const { data: expenses, isLoading: loadingExpenses } = useQuery({ queryKey: ["finance", "expenses"], queryFn: api.finance.expenses.list });

  const totalCapital = capital?.reduce((acc, c) => acc + c.balance, 0) || 0;
  const totalInvestments = investments?.reduce((acc, i) => acc + i.current_value, 0) || 0;
  const totalExpenses = expenses?.reduce((acc, e) => acc + e.amount, 0) || 0; // Ideally filter by current month
  const activeBudgetTotal = budgets?.filter(b => b.status === 'ACTIVE').reduce((acc, b) => acc + b.total_amount, 0) || 0;

  if (loadingCapital || loadingInvestments) {
      return (
          <div className="space-y-8 p-8 max-w-7xl mx-auto">
              <div className="h-8 w-48 bg-muted rounded animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
          </div>
      )
  }

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">Financial Overview</h1>
          <p className="text-muted-foreground font-medium mt-1">
            Track capital, investments, and operational expenses.
          </p>
        </div>
        <div className="flex gap-2">
            <Link href="/finance/capital">
                <Button className="font-bold rounded-xl" size="sm">
                    <Plus className="size-4 mr-2" /> Add Capital
                </Button>
            </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Total Capital
            </CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight">${totalCapital.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              Available liquid assets
            </p>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Investments
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight">${totalInvestments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              Total portfolio value
            </p>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Active Budgets
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight">${activeBudgetTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              Allocated for current period
            </p>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Total Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight">${totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              All time recorded expenses
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Links / Recent Activity placeholder */}
          <Card className="rounded-xl border-border">
              <CardHeader>
                  <CardTitle className="text-xl font-bold">Recent Expenses</CardTitle>
                  <CardDescription>Latest transactions recorded</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                      {expenses?.slice(0, 5).map(e => (
                          <div key={e.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
                              <div className="flex items-center gap-3">
                                  <div className="size-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                      <DollarSign className="size-5" />
                                  </div>
                                  <div>
                                      <p className="font-bold text-sm">{e.description}</p>
                                      <p className="text-xs text-muted-foreground">{e.category} • {new Date(e.date).toLocaleDateString()}</p>
                                  </div>
                              </div>
                              <span className="font-bold text-red-500">-${e.amount.toLocaleString()}</span>
                          </div>
                      ))}
                      {(!expenses || expenses.length === 0) && (
                          <div className="text-center py-8 text-muted-foreground">No expenses recorded</div>
                      )}
                  </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
