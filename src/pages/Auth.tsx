import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, Sparkles, ArrowLeft, GraduationCap, Phone, Target, BookOpen, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { useAppLogo } from "@/hooks/use-app-logo";

type AuthView = "login" | "signup" | "forgot";

const BOARDS = ["CBSE", "ICSE", "State Board", "IB", "Other"];
const CLASSES = ["7", "8", "9", "10", "11", "12"];
const TARGET_EXAMS = ["Board Exams", "JEE", "NEET", "CUET", "Olympiads", "Other"];

const getPasswordStrength = (pw: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-destructive" };
  if (score <= 3) return { score, label: "Medium", color: "bg-warning" };
  return { score, label: "Strong", color: "bg-success" };
};

const FloatingShape = ({ className, style }: { className: string; style: React.CSSProperties }) => (
  <div className={`absolute rounded-full opacity-[0.07] blur-2xl pointer-events-none ${className}`} style={style} />
);

const Auth = () => {
  const edspireLogo = useAppLogo();
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [board, setBoard] = useState("");
  const [targetExam, setTargetExam] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const pwStrength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") navigate("/");
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
          email, password,
          options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (signUpData.user) {
          await supabase.from("profiles").update({
            student_class: studentClass, board, target_exam: targetExam || null, phone: phone || null,
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

  const fieldDelay = (i: number) => ({ animationDelay: `${100 + i * 60}ms`, animationFillMode: "both" as const });

  return (
    <div className="min-h-screen min-h-[100dvh] relative flex items-center justify-center px-3 sm:px-4 py-6 safe-top safe-bottom overflow-hidden bg-background">
      {/* Animated background shapes */}
      <FloatingShape className="w-72 h-72 bg-accent animate-float" style={{ top: "5%", left: "-8%", animationDuration: "8s" }} />
      <FloatingShape className="w-96 h-96 bg-primary animate-float" style={{ bottom: "-10%", right: "-12%", animationDuration: "10s", animationDelay: "2s" }} />
      <FloatingShape className="w-48 h-48 bg-accent animate-float" style={{ top: "40%", right: "5%", animationDuration: "7s", animationDelay: "4s" }} />
      <FloatingShape className="w-64 h-64 bg-primary animate-float" style={{ bottom: "20%", left: "5%", animationDuration: "9s", animationDelay: "1s" }} />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-6 animate-scale-in">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="relative">
              <img src={edspireLogo} alt="Edspire Lens" className="h-14 w-14 object-contain relative z-10" />
              <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl animate-pulse" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Edspire <span className="text-gradient">Lens</span>
            </h1>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium border border-accent/20">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Video Learning
          </div>
        </div>

        {/* Glassmorphism card */}
        <div className="relative">
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-accent/30 via-transparent to-primary/20 blur-sm" />
          <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-elevated p-5 sm:p-8 animate-scale-in" style={{ animationDelay: "100ms" }}>
            <h2 className="font-display text-xl font-bold text-foreground text-center mb-5">
              {view === "login" ? "Welcome back" : view === "signup" ? "Create account" : "Reset Password"}
            </h2>

            {view === "forgot" && (
              <button onClick={() => setView("login")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors mb-4">
                <ArrowLeft className="h-3 w-3" /> Back to sign in
              </button>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {view === "signup" && (
                <>
                  <div className="space-y-1.5 animate-fade-in" style={fieldDelay(0)}>
                    <Label htmlFor="fullName" className="text-sm font-medium">Full Name *</Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                      <Input id="fullName" placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10 h-10 rounded-xl transition-all focus:ring-accent/40" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 animate-fade-in" style={fieldDelay(1)}>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Class *</Label>
                      <div className="relative group">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                        <select value={studentClass} onChange={(e) => setStudentClass(e.target.value)} required className="w-full h-10 pl-10 pr-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all">
                          <option value="">Select</option>
                          {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Board *</Label>
                      <div className="relative group">
                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                        <select value={board} onChange={(e) => setBoard(e.target.value)} required className="w-full h-10 pl-10 pr-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all">
                          <option value="">Select</option>
                          {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 animate-fade-in" style={fieldDelay(2)}>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Target Exam</Label>
                      <div className="relative group">
                        <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                        <select value={targetExam} onChange={(e) => setTargetExam(e.target.value)} className="w-full h-10 pl-10 pr-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all">
                          <option value="">Select</option>
                          {TARGET_EXAMS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Phone</Label>
                      <div className="relative group">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                        <Input type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 h-10 rounded-xl transition-all" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5 animate-fade-in" style={fieldDelay(view === "signup" ? 3 : 0)}>
                <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-10 rounded-xl transition-all" required />
                </div>
              </div>

              {view !== "forgot" && (
                <div className="space-y-1.5 animate-fade-in" style={fieldDelay(view === "signup" ? 4 : 1)}>
                  <Label htmlFor="password" className="text-sm font-medium">Password *</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-10 rounded-xl transition-all" required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Password strength indicator */}
                  {view === "signup" && password.length > 0 && (
                    <div className="space-y-1 animate-fade-in">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= pwStrength.score ? pwStrength.color : "bg-muted"}`} />
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        {pwStrength.score >= 4 && <CheckCircle2 className="h-3 w-3 text-success" />}
                        <span className={`text-[10px] font-medium ${pwStrength.score >= 4 ? "text-success" : pwStrength.score >= 2 ? "text-warning" : "text-destructive"}`}>
                          {pwStrength.label}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all animate-fade-in" style={fieldDelay(view === "signup" ? 5 : 2)}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : view === "login" ? "Sign in" : view === "signup" ? "Create account" : "Send Reset Link"}
              </Button>
            </form>

            {view !== "forgot" && (
              <div className="mt-4 animate-fade-in" style={fieldDelay(view === "signup" ? 6 : 3)}>
                <div className="relative flex items-center justify-center my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <span className="relative bg-card/80 px-3 text-xs text-muted-foreground">or</span>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button" variant="outline" disabled={loading}
                    className="w-full h-11 rounded-xl font-medium border-border/60 hover:bg-accent/5 hover:border-accent/30 transition-all"
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
                        if (result.error) toast.error(result.error.message || "Google sign-in failed");
                      } catch (err: any) {
                        toast.error(err.message || "Google sign-in failed");
                      } finally { setLoading(false); }
                    }}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Continue with Google
                  </Button>

                  <Button
                    type="button" variant="outline" disabled={loading}
                    className="w-full h-11 rounded-xl font-medium border-border/60 bg-black text-white hover:bg-black/80 hover:text-white transition-all"
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const result = await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin });
                        if (result.error) toast.error(result.error.message || "Apple sign-in failed");
                      } catch (err: any) {
                        toast.error(err.message || "Apple sign-in failed");
                      } finally { setLoading(false); }
                    }}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                    Continue with Apple
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-5 text-center space-y-2">
              {view === "login" && (
                <>
                  <button onClick={() => setView("forgot")} className="text-xs text-accent hover:underline transition-colors block mx-auto">Forgot your password?</button>
                  <button onClick={() => setView("signup")} className="text-sm text-muted-foreground hover:text-accent transition-colors">Don't have an account? <span className="font-semibold text-accent">Sign up</span></button>
                </>
              )}
              {view === "signup" && (
                <button onClick={() => setView("login")} className="text-sm text-muted-foreground hover:text-accent transition-colors">Already have an account? <span className="font-semibold text-accent">Sign in</span></button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
