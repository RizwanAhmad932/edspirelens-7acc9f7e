import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Users, Clock, Shield, Activity } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import edspireLogo from "@/assets/edspire-logo.png";
import ThemeToggle from "@/components/ThemeToggle";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, todayLogins: 0, totalLogins: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }

    const { data, error } = await supabase.functions.invoke("admin-data", {
      body: { action: "dashboard" },
    });

    if (error || data?.error) {
      toast.error("Access denied or failed to load");
      navigate("/");
      return;
    }

    setIsAdmin(true);
    setLoginLogs(data.loginLogs || []);
    setStats(data.stats || { totalUsers: 0, todayLogins: 0, totalLogins: 0 });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-surface flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen gradient-surface">
      <header className="border-b border-border bg-card/80 glass sticky top-0 z-40 animate-fade-in">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <img src={edspireLogo} alt="EdSpire.AI" className="h-8 w-8 object-contain" />
            <h1 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              Admin Panel
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Users, label: "Total Users", value: stats.totalUsers, color: "text-accent" },
            { icon: Activity, label: "Today's Logins", value: stats.todayLogins, color: "text-success" },
            { icon: Clock, label: "Total Logins", value: stats.totalLogins, color: "text-warning" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-2xl p-6 shadow-card animate-scale-in"
              style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center gap-3">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Login Logs Table */}
        <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Recent Login Activity
            </h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Login Time</TableHead>
                  <TableHead className="hidden sm:table-cell">Browser</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No login activity yet
                    </TableCell>
                  </TableRow>
                ) : (
                  loginLogs.map((log: any) => (
                    <TableRow key={log.id} className="animate-fade-in">
                      <TableCell className="font-medium text-foreground">
                        {log.full_name || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(log.logged_in_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground max-w-[200px] truncate">
                        {log.user_agent ? log.user_agent.substring(0, 60) + "..." : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
