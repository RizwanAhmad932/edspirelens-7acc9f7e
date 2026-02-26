import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Star, Zap, Trophy, Lock } from "lucide-react";
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

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("default");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) { toast.error("Failed to load profile"); return; }
    setProfile(data);
    setFullName(data.full_name || "");
    setSelectedAvatar(data.selected_avatar || "default");
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          selected_avatar: selectedAvatar,
        })
        .eq("id", profile.id);

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
  const nextLevelXp = level * 200;
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
            <img src={edspireLogo} alt="EdSpire.AI" className="h-8 w-8 object-contain" />
            <h1 className="font-display text-lg font-bold text-foreground">Profile</h1>
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
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-accent">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-bold">{profile?.total_study_minutes || 0} min</span>
              </div>
              <span className="text-xs text-muted-foreground">Study time</span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress to Level {level + 1}</span>
              <span>{xp % 200}/{200} XP</span>
            </div>
            <div className="h-3 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full gradient-accent transition-all duration-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Edit Name */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
          <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
            Display Name
          </h3>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 rounded-xl"
              placeholder="Your display name"
            />
          </div>
        </div>

        {/* Avatar Picker */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
          <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent" />
            Choose Avatar
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {AVATARS.map((avatar) => {
              const unlocked = xp >= avatar.xpRequired;
              const isSelected = selectedAvatar === avatar.id;
              return (
                <button
                  key={avatar.id}
                  onClick={() => unlocked && setSelectedAvatar(avatar.id)}
                  disabled={!unlocked}
                  className={`relative p-3 rounded-xl border-2 transition-all text-center ${
                    isSelected
                      ? "border-accent bg-accent/10 shadow-sm"
                      : unlocked
                      ? "border-border bg-secondary/30 hover:bg-secondary/60 hover:border-accent/50"
                      : "border-border/50 bg-secondary/10 opacity-50 cursor-not-allowed"
                  }`}
                >
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
          <p className="text-xs text-muted-foreground mt-3">
            Earn XP by analyzing videos, completing quizzes, and studying! Unlock new avatars as you level up.
          </p>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-base"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Profile"}
        </Button>
      </main>
    </div>
  );
};

export default Profile;
