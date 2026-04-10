import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, Sparkles, ArrowLeft, GraduationCap, Phone, Target, BookOpen } from "lucide-react";
import edspireLogo from "@/assets/edspire-logo.png";
import { lovable } from "@/integrations/lovable/index";

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
    <div className="min-h-screen min-h-[100dvh] gradient-surface flex items-center justify-center px-3 sm:px-4 py-6 safe-top safe-bottom">
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

        <div className="bg-card border border-border rounded-2xl shadow-elevated p-5 sm:p-8 animate-scale-in">
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

          {view !== "forgot" && (
            <div className="mt-4">
              <div className="relative flex items-center justify-center my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <span className="relative bg-card px-3 text-xs text-muted-foreground">or</span>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                className="w-full h-11 rounded-xl font-medium"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const result = await lovable.auth.signInWithOAuth("google", {
                      redirect_uri: window.location.origin,
                    });
                    if (result.error) {
                      toast.error(result.error.message || "Google sign-in failed");
                    }
                  } catch (err: any) {
                    toast.error(err.message || "Google sign-in failed");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </Button>
            </div>
          )}

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
