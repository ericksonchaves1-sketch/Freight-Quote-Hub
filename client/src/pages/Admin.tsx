import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldAlert, Activity, Users } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";

export default function AdminPage() {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to view this page.</p>
        </div>
      </Layout>
    );
  }

  // Dummy log data since audit logs endpoint wasn't in original routes
  // In a real app, we'd fetch this from API
  const logs = [
    { id: 1, action: "LOGIN", user: "john_shipper", timestamp: "2024-03-20 10:23 AM", details: "Successful login from IP 192.168.1.1" },
    { id: 2, action: "CREATE_QUOTE", user: "john_shipper", timestamp: "2024-03-20 10:45 AM", details: "Created quote #1023" },
    { id: 3, action: "BID_SUBMIT", user: "fast_trucks_inc", timestamp: "2024-03-20 11:15 AM", details: "Submitted bid for quote #1023" },
    { id: 4, action: "BID_ACCEPT", user: "john_shipper", timestamp: "2024-03-20 02:30 PM", details: "Accepted bid #55 from fast_trucks_inc" },
    { id: 5, action: "LOGOUT", user: "john_shipper", timestamp: "2024-03-20 03:00 PM", details: "User logged out" },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold">System Administration</h1>
          <p className="text-muted-foreground">Monitor system activity and logs</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <StatsCard 
            title="Total Users" 
            value={142} 
            icon={Users} 
            className="border-blue-200 bg-blue-50/50"
          />
          <StatsCard 
            title="System Health" 
            value="99.9%" 
            icon={Activity} 
            className="border-green-200 bg-green-50/50"
          />
          <StatsCard 
            title="Security Events" 
            value={0} 
            icon={ShieldAlert} 
          />
        </div>

        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Audit Logs</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.timestamp}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell className="text-muted-foreground">{log.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
