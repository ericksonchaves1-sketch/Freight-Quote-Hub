import { useAuth } from "@/hooks/use-auth";
import { useQuotes } from "@/hooks/use-quotes";
import { Layout } from "@/components/Layout";
import { StatsCard } from "@/components/StatsCard";
import { QuoteCard } from "@/components/QuoteCard";
import { Package, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: quotes, isLoading } = useQuotes();

  const isClient = user?.role === "client";
  
  // Compute stats
  const activeQuotes = quotes?.filter(q => q.status === "open").length || 0;
  const inNegotiation = quotes?.filter(q => q.status === "negotiation").length || 0;
  const closedQuotes = quotes?.filter(q => q.status === "closed").length || 0;
  
  // Dummy chart data
  const chartData = [
    { name: 'Mon', quotes: 4 },
    { name: 'Tue', quotes: 3 },
    { name: 'Wed', quotes: 7 },
    { name: 'Thu', quotes: 5 },
    { name: 'Fri', quotes: 8 },
    { name: 'Sat', quotes: 2 },
    { name: 'Sun', quotes: 1 },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.name}. Here's what's happening today.
            </p>
          </div>
          {isClient && (
            <Link href="/quotes">
              <Button size="lg" className="shadow-lg shadow-primary/20 hover:shadow-primary/30">
                <Package className="mr-2 h-4 w-4" />
                Create New Quote
              </Button>
            </Link>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            title="Active Quotes" 
            value={activeQuotes} 
            icon={Package} 
            trend="+12%" 
            trendUp={true} 
          />
          <StatsCard 
            title="In Negotiation" 
            value={inNegotiation} 
            icon={TrendingUp} 
            className="border-amber-200 bg-amber-50/50"
          />
          <StatsCard 
            title="Pending Actions" 
            value={isClient ? 3 : 5} 
            icon={AlertCircle} 
            className="border-red-200 bg-red-50/50"
          />
          <StatsCard 
            title="Completed" 
            value={closedQuotes} 
            icon={Clock} 
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Activity / Chart */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
              <h3 className="font-semibold text-lg mb-6">Quote Activity</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280', fontSize: 12 }} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#f3f4f6' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar 
                      dataKey="quotes" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]} 
                      barSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Recent Quotes</h3>
                <Link href="/quotes" className="text-sm text-primary hover:underline">View All</Link>
              </div>
              <div className="space-y-4">
                {isLoading ? (
                  [1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
                ) : (
                  quotes?.slice(0, 3).map((quote) => (
                    <QuoteCard 
                      key={quote.id} 
                      quote={quote} 
                      isCarrier={user?.role === "carrier"} 
                    />
                  ))
                )}
                {quotes?.length === 0 && (
                  <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-medium text-foreground">No quotes yet</h3>
                    <p className="text-muted-foreground text-sm">Create your first quote to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Quick Actions or Notifications */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-xl">
              <h3 className="font-semibold text-lg mb-2">Pro Tips</h3>
              <p className="text-slate-300 text-sm mb-4">
                Complete your company profile to get matched with better carriers and improve trust score.
              </p>
              <Button variant="secondary" size="sm" className="w-full">
                Complete Profile
              </Button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-border">
              <h3 className="font-semibold text-lg mb-4">Market Rates</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Standard Cargo</span>
                  <span className="font-medium font-mono text-green-600">$1.20 / kg</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Refrigerated</span>
                  <span className="font-medium font-mono text-green-600">$2.45 / kg</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Hazardous</span>
                  <span className="font-medium font-mono text-green-600">$3.80 / kg</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
