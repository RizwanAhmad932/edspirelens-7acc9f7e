import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Users, Clock, Shield, Activity, Plus, Trash2, Eye, MousePointer, Image, Video, Megaphone, Trophy, X, Palette } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import edspireLogo from "@/assets/edspire-logo.png";
import ThemeToggle from "@/components/ThemeToggle";

const FESTIVAL_THEMES = [
  { name: "none", label: "No Theme", icon: "❌", desc: "Default look" },
  { name: "republic_day", label: "Republic Day", icon: "🇮🇳", desc: "Tricolor flags & Ashoka Chakra" },
  { name: "eid", label: "Eid", icon: "🌙", desc: "Crescent moon, stars & Eid Mubarak" },
  { name: "diwali", label: "Diwali", icon: "🪔", desc: "Diyas, fireworks & lights" },
  { name: "dussehra", label: "Dussehra", icon: "🏹", desc: "Fire effects & victory theme" },
  { name: "holi", label: "Holi", icon: "🎨", desc: "Color splashes everywhere" },
  { name: "christmas", label: "Christmas", icon: "🎄", desc: "Snowfall & Santa flying" },
];

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, todayLogins: 0, totalLogins: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [activeTheme, setActiveTheme] = useState("none");
  const [themeSaving, setThemeSaving] = useState(false);
  const navigate = useNavigate();

  // Ad form state
  const [adTitle, setAdTitle] = useState("");
  const [adType, setAdType] = useState("banner");
  const [adPlacement, setAdPlacement] = useState("home");
  const [adLinkUrl, setAdLinkUrl] = useState("");
  const [adFile, setAdFile] = useState<File | null>(null);
  const [adUploading, setAdUploading] = useState(false);
  const [adSourceType, setAdSourceType] = useState<"upload" | "google_ads">("upload");
  const [googleAdUrl, setGoogleAdUrl] = useState("");
  const [adEventCounts, setAdEventCounts] = useState<Record<string, { views: number; clicks: number }>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  // Challenge form state
  const [chTitle, setChTitle] = useState("");
  const [chDesc, setChDesc] = useState("");
  const [chRewardType, setChRewardType] = useState("xp");
  const [chRewardValue, setChRewardValue] = useState("");
  const [chGoalType, setChGoalType] = useState("study_minutes");
  const [chGoalTarget, setChGoalTarget] = useState("");

  useEffect(() => { checkAdminAndLoad(); }, []);

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
    setUsers(data.users || []);
    await Promise.all([loadAds(), loadChallenges(), loadActiveTheme()]);
    setLoading(false);
  };

  const loadActiveTheme = async () => {
    const { data } = await supabase.from("app_themes").select("theme_name").eq("is_active", true).single();
    if (data) setActiveTheme(data.theme_name);
  };

  const handleSetTheme = async (themeName: string) => {
    setThemeSaving(true);
    try {
      const { error } = await supabase.rpc("activate_theme", { _theme_name: themeName });
      if (error) throw error;
      setActiveTheme(themeName);
      toast.success(`Theme set to ${FESTIVAL_THEMES.find(t => t.name === themeName)?.label || themeName}!`);
    } catch (e: any) {
      toast.error(e.message || "Failed to set theme");
    } finally {
      setThemeSaving(false);
    }
  };

  const loadAds = async () => {
    const { data } = await supabase.from("ads").select("*").order("created_at", { ascending: false });
    setAds(data || []);
    const { data: events } = await supabase.from("ad_events").select("ad_id, event_type");
    const counts: Record<string, { views: number; clicks: number }> = {};
    (events || []).forEach((e: any) => {
      if (!counts[e.ad_id]) counts[e.ad_id] = { views: 0, clicks: 0 };
      if (e.event_type === "view") counts[e.ad_id].views++;
      if (e.event_type === "click") counts[e.ad_id].clicks++;
    });
    setAdEventCounts(counts);
  };

  const loadChallenges = async () => {
    const { data } = await supabase.from("challenges").select("*").order("created_at", { ascending: false });
    setChallenges(data || []);
  };

  const handleUploadAd = async () => {
    if (!adTitle) { toast.error("Title required"); return; }
    
    if (adSourceType === "google_ads") {
      if (!googleAdUrl) { toast.error("Google Ads URL required"); return; }
      setAdUploading(true);
      try {
        const { error } = await supabase.from("ads").insert({
          title: adTitle, ad_type: adType, media_url: googleAdUrl,
          media_type: "google_ad", link_url: adLinkUrl || null, placement: adPlacement,
        });
        if (error) throw error;
        toast.success("Google Ad created!");
        setAdTitle(""); setAdLinkUrl(""); setGoogleAdUrl("");
        await loadAds();
      } catch (e: any) { toast.error(e.message || "Failed"); }
      finally { setAdUploading(false); }
      return;
    }

    if (!adFile) { toast.error("File required"); return; }
    setAdUploading(true);
    try {
      const ext = adFile.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("ad-media").upload(path, adFile);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("ad-media").getPublicUrl(path);
      const mediaType = adFile.type.startsWith("video") ? "video" : "image";
      const { error } = await supabase.from("ads").insert({
        title: adTitle, ad_type: adType, media_url: urlData.publicUrl,
        media_type: mediaType, link_url: adLinkUrl || null, placement: adPlacement,
      });
      if (error) throw error;
      toast.success("Ad created!");
      setAdTitle(""); setAdLinkUrl(""); setAdFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await loadAds();
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setAdUploading(false); }
  };

  const toggleAd = async (id: string, active: boolean) => {
    await supabase.from("ads").update({ is_active: !active }).eq("id", id);
    await loadAds();
  };

  const deleteAd = async (id: string) => {
    await supabase.from("ads").delete().eq("id", id);
    await loadAds();
    toast.success("Ad deleted");
  };

  const handleCreateChallenge = async () => {
    if (!chTitle || !chDesc || !chRewardValue || !chGoalTarget) { toast.error("Fill all fields"); return; }
    const { error } = await supabase.from("challenges").insert({
      title: chTitle, description: chDesc, reward_type: chRewardType,
      reward_value: chRewardValue, goal_type: chGoalType, goal_target: parseInt(chGoalTarget),
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Challenge created!");
    setChTitle(""); setChDesc(""); setChRewardValue(""); setChGoalTarget("");
    await loadChallenges();
  };

  const toggleChallenge = async (id: string, active: boolean) => {
    await supabase.from("challenges").update({ is_active: !active }).eq("id", id);
    await loadChallenges();
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
    <div className="min-h-screen min-h-[100dvh] gradient-surface overflow-x-hidden">
      <header className="border-b border-border bg-card/80 glass sticky top-0 z-40 animate-fade-in">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <img src={edspireLogo} alt="Edspire Lens" className="h-8 w-8 object-contain" />
            <h1 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              Admin Panel
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 animate-fade-in safe-bottom">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Users, label: "Total Users", value: stats.totalUsers, color: "text-accent" },
            { icon: Activity, label: "Today's Logins", value: stats.todayLogins, color: "text-success" },
            { icon: Clock, label: "Total Logins", value: stats.totalLogins, color: "text-warning" },
          ].map((stat, i) => (
            <div key={stat.label} className="bg-card border border-border rounded-2xl p-6 shadow-card animate-scale-in" style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}>
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

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full grid grid-cols-5 bg-secondary/50 rounded-lg h-9 sm:h-10">
            <TabsTrigger value="users" className="text-[10px] sm:text-xs gap-0.5 sm:gap-1 px-1 sm:px-2"><Users className="h-3 w-3" /><span className="hidden sm:inline">Users</span></TabsTrigger>
            <TabsTrigger value="logins" className="text-[10px] sm:text-xs gap-0.5 sm:gap-1 px-1 sm:px-2"><Clock className="h-3 w-3" /><span className="hidden sm:inline">Logins</span></TabsTrigger>
            <TabsTrigger value="ads" className="text-[10px] sm:text-xs gap-0.5 sm:gap-1 px-1 sm:px-2"><Megaphone className="h-3 w-3" /><span className="hidden sm:inline">Ads</span></TabsTrigger>
            <TabsTrigger value="challenges" className="text-[10px] sm:text-xs gap-0.5 sm:gap-1 px-1 sm:px-2"><Trophy className="h-3 w-3" /><span className="hidden sm:inline">Challenges</span></TabsTrigger>
            <TabsTrigger value="themes" className="text-[10px] sm:text-xs gap-0.5 sm:gap-1 px-1 sm:px-2"><Palette className="h-3 w-3" /><span className="hidden sm:inline">Themes</span></TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5 text-accent" /> Registered Users
                </h2>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Board</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead className="hidden sm:table-cell">Phone</TableHead>
                      <TableHead>XP</TableHead>
                      <TableHead>Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No users yet</TableCell></TableRow>
                    ) : users.map((u: any) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium text-foreground">{u.full_name || "—"}</TableCell>
                        <TableCell className="text-sm">{u.student_class || "—"}</TableCell>
                        <TableCell className="text-sm">{u.board || "—"}</TableCell>
                        <TableCell className="text-sm">{u.target_exam || "—"}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{u.phone || "—"}</TableCell>
                        <TableCell className="text-sm font-semibold">{u.xp || 0}</TableCell>
                        <TableCell className="text-sm">{u.level || 1}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Login Logs Tab */}
          <TabsContent value="logins">
            <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5 text-accent" /> Recent Login Activity
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
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No login activity</TableCell></TableRow>
                    ) : loginLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium text-foreground">{log.full_name || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{log.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(log.logged_in_at).toLocaleString()}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground max-w-[200px] truncate">{log.user_agent ? log.user_agent.substring(0, 60) + "..." : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
                <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                  <Plus className="h-5 w-5 text-accent" /> Create New Ad
                </h3>
                <div className="flex gap-2 mb-4">
                  <button onClick={() => setAdSourceType("upload")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${adSourceType === "upload" ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>
                    📁 Upload Media
                  </button>
                  <button onClick={() => setAdSourceType("google_ads")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${adSourceType === "google_ads" ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>
                    🔗 Google Ads Link
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Ad Title</Label>
                    <Input value={adTitle} onChange={e => setAdTitle(e.target.value)} placeholder="Ad title" className="rounded-xl h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Link URL (click destination)</Label>
                    <Input value={adLinkUrl} onChange={e => setAdLinkUrl(e.target.value)} placeholder="https://example.com" className="rounded-xl h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Type</Label>
                    <select value={adType} onChange={e => setAdType(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm">
                      <option value="banner">Banner</option>
                      <option value="popup">Popup</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Placement</Label>
                    <select value={adPlacement} onChange={e => setAdPlacement(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm">
                      <option value="home">Home Page</option>
                      <option value="between_content">Between Content</option>
                      <option value="popup">Popup</option>
                    </select>
                  </div>
                  {adSourceType === "upload" ? (
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-sm">Upload Image or Video</Label>
                      <input ref={fileRef} type="file" accept="image/*,video/*" onChange={e => setAdFile(e.target.files?.[0] || null)} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20" />
                    </div>
                  ) : (
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-sm">Google Ads Image/Script URL</Label>
                      <Input value={googleAdUrl} onChange={e => setGoogleAdUrl(e.target.value)} placeholder="https://pagead2.googlesyndication.com/..." className="rounded-xl h-10" />
                      <p className="text-[10px] text-muted-foreground">Paste the image URL or ad tag URL from Google Ads</p>
                    </div>
                  )}
                </div>
                <Button onClick={handleUploadAd} disabled={adUploading} className="mt-4 gradient-primary text-primary-foreground rounded-xl">
                  {adUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Create Ad
                </Button>
              </div>

              <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-accent" /> All Ads
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Preview</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead><Eye className="h-3.5 w-3.5 inline mr-1" />Views</TableHead>
                        <TableHead><MousePointer className="h-3.5 w-3.5 inline mr-1" />Clicks</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ads.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No ads yet</TableCell></TableRow>
                      ) : ads.map((ad: any) => (
                        <TableRow key={ad.id}>
                          <TableCell>
                            {ad.media_type === "video" ? (
                              <Video className="h-8 w-8 text-muted-foreground" />
                            ) : ad.media_type === "google_ad" ? (
                              <span className="text-lg">🔗</span>
                            ) : (
                              <img src={ad.media_url} alt="" className="h-8 w-12 object-cover rounded" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-foreground text-sm">{ad.title}</TableCell>
                          <TableCell className="text-xs capitalize">{ad.ad_type} / {ad.placement}</TableCell>
                          <TableCell className="text-sm font-semibold">{adEventCounts[ad.id]?.views || 0}</TableCell>
                          <TableCell className="text-sm font-semibold">{adEventCounts[ad.id]?.clicks || 0}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${ad.is_active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>
                              {ad.is_active ? "Active" : "Inactive"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => toggleAd(ad.id, ad.is_active)} className="text-xs h-7">
                                {ad.is_active ? "Pause" : "Activate"}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteAd(ad.id)} className="text-destructive h-7">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
                <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                  <Plus className="h-5 w-5 text-accent" /> Create Challenge
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Title</Label>
                    <Input value={chTitle} onChange={e => setChTitle(e.target.value)} placeholder="Use app 3 hours" className="rounded-xl h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Description</Label>
                    <Input value={chDesc} onChange={e => setChDesc(e.target.value)} placeholder="Describe the challenge" className="rounded-xl h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Goal Type</Label>
                    <select value={chGoalType} onChange={e => setChGoalType(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm">
                      <option value="study_minutes">Study Minutes</option>
                      <option value="videos_analyzed">Videos Analyzed</option>
                      <option value="quizzes_completed">Quizzes Completed</option>
                      <option value="app_usage_minutes">App Usage (minutes)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Goal Target</Label>
                    <Input type="number" value={chGoalTarget} onChange={e => setChGoalTarget(e.target.value)} placeholder="180" className="rounded-xl h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Reward Type</Label>
                    <select value={chRewardType} onChange={e => setChRewardType(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm">
                      <option value="xp">XP</option>
                      <option value="avatar">Avatar</option>
                      <option value="costume">Costume</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Reward Value</Label>
                    <Input value={chRewardValue} onChange={e => setChRewardValue(e.target.value)} placeholder="100 or avatar_id" className="rounded-xl h-10" />
                  </div>
                </div>
                <Button onClick={handleCreateChallenge} className="mt-4 gradient-primary text-primary-foreground rounded-xl">
                  <Plus className="h-4 w-4 mr-2" /> Create Challenge
                </Button>
              </div>

              <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-accent" /> All Challenges
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Goal</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Reward</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {challenges.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No challenges yet</TableCell></TableRow>
                      ) : challenges.map((ch: any) => (
                        <TableRow key={ch.id}>
                          <TableCell className="font-medium text-foreground text-sm">{ch.title}</TableCell>
                          <TableCell className="text-xs capitalize">{ch.goal_type.replace(/_/g, " ")}</TableCell>
                          <TableCell className="text-sm font-semibold">{ch.goal_target}</TableCell>
                          <TableCell className="text-sm">{ch.reward_type}: {ch.reward_value}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${ch.is_active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>
                              {ch.is_active ? "Active" : "Inactive"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => toggleChallenge(ch.id, ch.is_active)} className="text-xs h-7">
                              {ch.is_active ? "Pause" : "Activate"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Themes Tab */}
          <TabsContent value="themes">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
              <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-2">
                <Palette className="h-5 w-5 text-accent" /> Festival Themes
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Select a theme to apply across the entire app for all users. Only one theme can be active at a time.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {FESTIVAL_THEMES.map(theme => {
                  const isActive = activeTheme === theme.name;
                  return (
                    <button
                      key={theme.name}
                      onClick={() => handleSetTheme(theme.name)}
                      disabled={themeSaving}
                      className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                        isActive
                          ? "border-accent bg-accent/10 shadow-sm"
                          : "border-border hover:border-accent/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-2xl">{theme.icon}</span>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{theme.label}</p>
                          <p className="text-xs text-muted-foreground">{theme.desc}</p>
                        </div>
                      </div>
                      {isActive && (
                        <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-bold animate-scale-in">
                          ✓ ACTIVE
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
