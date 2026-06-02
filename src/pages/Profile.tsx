import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Star, Zap, Trophy, GraduationCap, BookOpen, Target, Phone, PlayCircle } from "lucide-react";
import { useAppLogo } from "@/hooks/use-app-logo";
import ThemeToggle from "@/components/ThemeToggle";
import { MascotAvatar } from "@/components/MascotAvatar";
import { resetTutorial } from "@/components/TutorialOverlay";

const BOARDS = ["CBSE", "ICSE", "State Board", "IB", "Other"];
const CLASSES = ["7", "8", "9", "10", "11", "12"];
const TARGET_EXAMS = ["Board Exams", "JEE", "NEET", "CUET", "Olympiads", "Other"];

const DEFAULT_OUTFIT = { top: "tshirt_white", hat: "none_hat", accessory: "none_acc" };

interface SavedAvatarData {
  top: string;
  hat: string;
  accessory: string;
  owned?: string[];
}

const Profile = () => {
  const logo = useAppLogo();
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [board, setBoard] = useState("");
  const [targetExam, setTargetExam] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [userChallenges, setUserChallenges] = useState<any[]>([]);
  const [outfit, setOutfit] = useState(DEFAULT_OUTFIT);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [currentXp, setCurrentXp] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }

    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (error) { toast.error("Failed to load profile"); setLoading(false); return; }
    
    setProfile(data);
    setFullName(data.full_name || "");
    setStudentClass(data.student_class || "");
    setBoard(data.board || "");
    setTargetExam(data.target_exam || "");
    setPhone(data.phone || "");
    setCurrentXp(data.xp || 0);

    // Parse saved outfit + owned items
    try {
      const saved: SavedAvatarData = data.selected_avatar ? JSON.parse(data.selected_avatar) : null;
      if (saved && saved.top) {
        setOutfit({ top: saved.top, hat: saved.hat, accessory: saved.accessory });
        setOwnedItems(saved.owned || []);
      }
    } catch {
      // legacy string value
    }

    const { data: ch } = await supabase.from("challenges").select("*").eq("is_active", true);
    setChallenges(ch || []);

    const { data: uc } = await supabase.from("user_challenges").select("*").eq("user_id", user.id);
    setUserChallenges(uc || []);

    setLoading(false);
  };

  const handlePurchase = async (itemId: string, cost: number) => {
    if (currentXp < cost) {
      toast.error("Not enough XP!");
      return;
    }

    // Deduct XP by adding negative amount
    try {
      await supabase.rpc("add_xp", { _user_id: profile.id, _amount: -cost });
      const newXp = currentXp - cost;
      setCurrentXp(newXp);
      setProfile((p: any) => ({ ...p, xp: newXp }));
      const newOwned = [...ownedItems, itemId];
      setOwnedItems(newOwned);
      
      // Auto-save owned items
      const avatarData: SavedAvatarData = { ...outfit, owned: newOwned };
      await supabase.from("profiles").update({
        selected_avatar: JSON.stringify(avatarData),
      }).eq("id", profile.id);
    } catch (e: any) {
      toast.error("Purchase failed: " + (e.message || "Unknown error"));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Not signed in"); setSaving(false); return; }
      const avatarData: SavedAvatarData = { ...outfit, owned: ownedItems };
      const { error, data } = await supabase.from("profiles").update({
        full_name: fullName,
        selected_avatar: JSON.stringify(avatarData),
        student_class: studentClass,
        board: board,
        target_exam: targetExam || null,
        phone: phone || null,
      }).eq("id", user.id).select();
      if (error) throw error;
      if (!data || data.length === 0) {
        // Fallback: row missing, insert it
        const { error: insErr } = await supabase.from("profiles").insert({
          id: user.id, full_name: fullName, selected_avatar: JSON.stringify(avatarData),
          student_class: studentClass, board, target_exam: targetExam || null, phone: phone || null,
        });
        if (insErr) throw insErr;
      }
      toast.success("Profile updated!");
    } catch (e: any) {
      console.error("Profile save error:", e);
      toast.error(e.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const xp = currentXp;
  const level = profile?.level || 1;
  const xpProgress = Math.min((xp % 200) / 200 * 100, 100);

  if (loading) {
    return (
      <div className="min-h-screen gradient-surface flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] gradient-surface overflow-x-hidden">
      <header className="border-b border-border bg-card/80 glass sticky top-0 z-40 animate-fade-in">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <img src={logo} alt="Edspire Lens" className="h-8 w-8 object-contain" />
            <h1 className="font-display text-lg font-bold text-foreground">
              Edspire <span className="text-gradient">Lens</span> — Profile
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in safe-bottom">
        {/* XP & Level Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-elevated animate-scale-in">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <h2 className="font-display text-xl font-bold text-foreground">{fullName || "Student"}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Star className="h-4 w-4 text-warning" />
                <span className="text-sm font-semibold text-foreground">Level {level}</span>
                <span className="text-xs text-muted-foreground">• {xp} XP</span>
              </div>
              <div className="flex gap-2 mt-1">
                {board && <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">{board}</span>}
                {studentClass && <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">Class {studentClass}</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-accent">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-bold">{profile?.total_study_minutes || 0} min</span>
              </div>
              <span className="text-xs text-muted-foreground">Study time</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress to Level {level + 1}</span>
              <span>{xp % 200}/{200} XP</span>
            </div>
            <div className="h-3 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full gradient-accent transition-all duration-500" style={{ width: `${xpProgress}%` }} />
            </div>
          </div>
        </div>

        {/* Friendly mascot */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card flex flex-col items-center gap-3">
          <MascotAvatar size={140} level={level} />
          <p className="text-xs text-muted-foreground text-center">
            Your study buddy levels up as you earn XP. Reach higher levels to unlock new color tiers!
          </p>
        </div>

        {/* Edit Info */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
          <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Your Info</h3>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-10 rounded-xl" placeholder="Your name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> Class</Label>
                <select value={studentClass} onChange={e => setStudentClass(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm">
                  <option value="">Select</option>
                  {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> Board</Label>
                <select value={board} onChange={e => setBoard(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm">
                  <option value="">Select</option>
                  {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><Target className="h-3.5 w-3.5" /> Target Exam</Label>
                <select value={targetExam} onChange={e => setTargetExam(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm">
                  <option value="">Select</option>
                  {TARGET_EXAMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> Phone</Label>
                <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="h-10 rounded-xl" placeholder="Phone number" />
              </div>
            </div>
          </div>
        </div>

        {/* Challenges */}
        {challenges.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
            <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-accent" /> Active Challenges
            </h3>
            <div className="space-y-3">
              {challenges.map(ch => {
                const uc = userChallenges.find(u => u.challenge_id === ch.id);
                const progress = uc?.progress || 0;
                const pct = Math.min((progress / ch.goal_target) * 100, 100);
                return (
                  <div key={ch.id} className="p-4 rounded-xl bg-secondary/30 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{ch.title}</h4>
                        <p className="text-xs text-muted-foreground">{ch.description}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                        {ch.reward_type}: {ch.reward_value}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{progress}/{ch.goal_target} {ch.goal_type.replace(/_/g, " ")}</span>
                        <span>{Math.round(pct)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full gradient-accent transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    {uc?.completed && <span className="text-xs text-green-500 font-semibold mt-1 block">✅ Completed!</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-base">
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Profile"}
        </Button>

        {/* Replay tutorial */}
        <Button
          variant="outline"
          onClick={() => { resetTutorial(); toast.success("Tutorial will play next time you open the home page."); navigate("/"); }}
          className="w-full h-11 rounded-xl gap-2"
        >
          <PlayCircle className="h-4 w-4" /> Replay app tutorial
        </Button>
      </main>
    </div>
  );
};

export default Profile;
