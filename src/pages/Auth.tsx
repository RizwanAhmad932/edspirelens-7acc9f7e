import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, Sparkles, ArrowLeft, GraduationCap, Phone, Target, BookOpen } from "lucide-react";
import edspireLogo from "@/assets/edspire-logo.png";

type AuthView = "login" | "signup" | "forgot";

const BOARDS = ["CBSE", "ICSE", "State Board", "IB", "Other"];
const CLASSES = ["7", "8", "9", "10", "11", "12"];
const TARGET_EXAMS = ["Board Exams", "JEE", "NEET", "CUET", "Olympiads", "Other"];

const Auth = () => {
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [board, setBoard] = useState("");
  const [targetExam, setTargetExam] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        navigate("/");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (view === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Check your email for a password reset link!");
        setView("login");
      } else if (view === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      } else {
        if (!fullName || !studentClass || !board) {
          toast.error("Please fill in Name, Class, and Board");
          setLoading(false);
          return;
        }
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        // Update profile with extra fields
        if (signUpData.user) {
          await supabase.from("profiles").update({
            student_class: studentClass,
            board: board,
            target_exam: targetExam || null,
            phone: phone || null,
          }).eq("id", signUpData.user.id);
        }

        toast.success("Check your email to verify your account!");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src={edspireLogo} alt="Edspire Lens" className="h-12 w-12 object-contain" />
            <h1 className="font-display text-3xl font-bold text-foreground">
              Edspire <span className="text-gradient">Lens</span>
            </h1>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Video Learning
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-elevated p-8 animate-scale-in">
          <h2 className="font-display text-xl font-bold text-foreground text-center mb-6">
            {view === "login" ? "Sign in" : view === "signup" ? "Create account" : "Reset Password"}
          </h2>

          {view === "forgot" && (
            <button
              onClick={() => setView("login")}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors mb-4"
            >
              <ArrowLeft className="h-3 w-3" /> Back to sign in
            </button>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {view === "signup" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-sm font-medium">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="fullName" placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10 h-10 rounded-xl" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Class *</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <select
                        value={studentClass}
                        onChange={(e) => setStudentClass(e.target.value)}
                        required
                        className="w-full h-10 pl-10 pr-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Select</option>
                        {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Board *</Label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <select
                        value={board}
                        onChange={(e) => setBoard(e.target.value)}
                        required
                        className="w-full h-10 pl-10 pr-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Select</option>
                        {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Target Exam</Label>
                    <div className="relative">
                      <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <select
                        value={targetExam}
                        onChange={(e) => setTargetExam(e.target.value)}
                        className="w-full h-10 pl-10 pr-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Select</option>
                        {TARGET_EXAMS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 h-10 rounded-xl" />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-10 rounded-xl" required />
              </div>
            </div>

            {view !== "forgot" && (
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-10 rounded-xl" required minLength={6} />
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : view === "login" ? "Sign in" : view === "signup" ? "Create account" : "Send Reset Link"}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {view === "login" && (
              <>
                <button onClick={() => setView("forgot")} className="text-xs text-accent hover:underline transition-colors block mx-auto">
                  Forgot your password?
                </button>
                <button onClick={() => setView("signup")} className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  Don't have an account? Sign up
                </button>
              </>
            )}
            {view === "signup" && (
              <button onClick={() => setView("login")} className="text-sm text-muted-foreground hover:text-accent transition-colors">
                Already have an account? Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
