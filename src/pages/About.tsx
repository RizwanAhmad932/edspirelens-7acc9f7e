import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Scale, FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppLogo } from "@/hooks/use-app-logo";

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card space-y-2">
    <div className="flex items-center gap-2 text-accent">
      <Icon className="h-5 w-5" />
      <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">{title}</h2>
    </div>
    <div className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed space-y-3">{children}</div>
  </section>
);

const About = () => {
  const navigate = useNavigate();
  const logo = useAppLogo();

  return (
    <div className="min-h-screen min-h-[100dvh] gradient-surface">
      <header className="border-b border-border bg-card/80 glass sticky top-0 z-40 safe-top">
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <img src={logo} alt="Edspire Lens" className="h-7 w-7 object-contain" />
            <span className="font-display font-bold text-sm sm:text-base">About</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-4 sm:space-y-5">
        <div className="text-center space-y-2 pb-2">
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-foreground">
            About <span className="text-gradient">Edspire Lens</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            An AI-powered educational utility that turns any public lecture into structured study material.
          </p>
        </div>

        <Section icon={ShieldCheck} title="Nature of Service and Intermediary Status">
          <p>
            This Website functions strictly as an <strong>educational utility platform</strong> and <strong>online intermediary</strong>
            under applicable technology frameworks, including <strong>Section 512 of the Digital Millennium Copyright Act (DMCA)</strong>
            and <strong>Section 79 of the Information Technology Act</strong>. The Website allows users to organize educational materials
            and paste public third-party hyperlinks to external video content. The Website <strong>does not host, upload, clone, or store
            any video or audio files on its servers</strong>.
          </p>
        </Section>

        <Section icon={Scale} title="No Ownership of Third-Party Content">
          <p>
            All third-party videos referenced via hyperlinks remain the property of their respective owners and are streamed directly
            from their original public platforms (such as YouTube). Edspire Lens does not claim any ownership, license, or affiliation
            with such content. AI-generated summaries, quizzes, notes and infographics are derivative educational aids produced solely
            for the user's personal study and revision.
          </p>
        </Section>

        <Section icon={FileText} title="Acceptable Use">
          <p>
            Users must only submit links to lawfully published public content for personal, non-commercial educational use. Any misuse,
            including submission of pirated, infringing or unlawful material, is strictly prohibited and may result in account termination.
          </p>
        </Section>

        <Section icon={Mail} title="DMCA / Takedown Requests">
          <p>
            If you believe content referenced through this Website infringes your rights, please contact us with the URL and proof of
            ownership. We will act expeditiously to remove the reference in accordance with applicable law.
          </p>
        </Section>

        <p className="text-xs text-center text-muted-foreground pt-4 pb-8">
          © {new Date().getFullYear()} Edspire Lens. All trademarks belong to their respective owners.
        </p>
      </main>
    </div>
  );
};

export default About;