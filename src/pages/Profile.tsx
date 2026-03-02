import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Star, Zap, Trophy, Lock, GraduationCap, BookOpen, Target, Phone } from "lucide-react";
import edspireLogo from "@/assets/edspire-logo.png";
import ThemeToggle from "@/components/ThemeToggle";

const AVATARS = [
  { id: "default", emoji: "🧑‍🎓", name: "Scholar", xpRequired: 0 },
  { id: "ninja", emoji: "🥷", name: "Study Ninja", xpRequired: 0 },
  { id: "astronaut", emoji: "👨‍🚀", name: "Space Learner", xpRequired: 0 },
  { id: "wizard", emoji: "🧙‍♂️", name: "Knowledge Wizard", xpRequired: 100 },
  { id: "robot", emoji: "🤖", name: "AI Bot", xpRequired: 200 },
  { id: "dragon", emoji: "🐉", name: "Dragon Scholar", xpRequired: 500 },
  { id: "crown", emoji: "👑", name: "Study King", xpRequired: 1000 },
  { id: "fire", emoji: "🔥", name: "On Fire", xpRequired: 1500 },
  { id: "diamond", emoji: "💎", name: "Diamond Mind", xpRequired: 2500 },
  { id: "galaxy", emoji: "🌌", name: "Galaxy Brain", xpRequired: 5000 },
];

const BOARDS = ["CBSE", "ICSE", "State Board", "IB", "Other"];
const CLASSES = ["7", "8", "9", "10", "11", "12"];
const TARGET_EXAMS = ["Board Exams", "JEE", "NEET", "CUET", "Olympiads", "Other"];

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("default");
  const [studentClass, setStudentClass] = useState("");
  const [board, setBoard] = useState("");
  const [targetExam, setTargetExam] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [userChallenges, setUserChallenges] = useState<any[]>([]);
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
    setSelectedAvatar(data.selected_avatar || "default");
    setStudentClass(data.student_class || "");
    setBoard(data.board || "");
    setTargetExam(data.target_exam || "");
    setPhone(data.phone || "");

    // Load challenges
    const { data: ch } = await supabase.from("challenges").select("*").eq("is_active", true);
    setChallenges(ch || []);

    const { data: uc } = await supabase.from("user_challenges").select("*").eq("user_id", user.id);
    setUserChallenges(uc || []);

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        full_name: fullName,
        selected_avatar: selectedAvatar,
        student_class: studentClass,
        board: board,
        target_exam: targetExam || null,
        phone: phone || null,
      }).eq("id", profile.id);
      if (error) throw error;
      toast.success("Profile updated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const xp = profile?.xp || 0;
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
    <div className="min-h-screen gradient-surface">
      <header className="border-b border-border bg-card/80 glass sticky top-0 z-40 animate-fade-in">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <img src={edspireLogo} alt="Edspire Lens" className="h-8 w-8 object-contain" />
            <h1 className="font-display text-lg font-bold text-foreground">
              Edspire <span className="text-gradient">Lens</span> — Profile
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-2xl space-y-8 animate-fade-in">
        {/* XP & Level Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-elevated animate-scale-in">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-5xl">
              {AVATARS.find(a => a.id === selectedAvatar)?.emoji || "🧑‍🎓"}
            </div>
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

        {/* Avatar Picker */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
          <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent" /> Choose Avatar
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {AVATARS.map((avatar) => {
              const unlocked = xp >= avatar.xpRequired;
              const isSelected = selectedAvatar === avatar.id;
              return (
                <button key={avatar.id} onClick={() => unlocked && setSelectedAvatar(avatar.id)} disabled={!unlocked}
                  className={`relative p-3 rounded-xl border-2 transition-all text-center ${isSelected ? "border-accent bg-accent/10 shadow-sm" : unlocked ? "border-border bg-secondary/30 hover:bg-secondary/60 hover:border-accent/50" : "border-border/50 bg-secondary/10 opacity-50 cursor-not-allowed"}`}>
                  <div className="text-3xl mb-1">{avatar.emoji}</div>
                  <p className="text-[10px] font-medium text-foreground truncate">{avatar.name}</p>
                  {!unlocked && (
                    <div className="absolute inset-0 rounded-xl bg-background/60 flex items-center justify-center">
                      <div className="text-center">
                        <Lock className="h-4 w-4 text-muted-foreground mx-auto" />
                        <span className="text-[9px] text-muted-foreground">{avatar.xpRequired} XP</span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">Earn XP by analyzing videos, completing quizzes, and studying!</p>
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
                    {uc?.completed && <span className="text-xs text-success font-semibold mt-1 block">✅ Completed!</span>}
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
      </main>
    </div>
  );
};

export default Profile;
