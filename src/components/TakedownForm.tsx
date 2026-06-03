import { useState } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  full_name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Valid email required").max(255),
  organization: z.string().trim().max(150).optional(),
  rights_owner: z.string().trim().min(2, "Rights owner is required").max(150),
  infringing_url: z.string().trim().url("Must be a valid URL").max(500),
  original_work_url: z.string().trim().url("Must be a valid URL").max(500).optional().or(z.literal("")),
  description: z.string().trim().min(20, "Please describe the issue (min 20 chars)").max(2000),
  signature: z.string().trim().min(2, "Digital signature required").max(100),
  good_faith: z.boolean().refine(v => v === true, "You must confirm the good-faith statement"),
  accuracy: z.boolean().refine(v => v === true, "You must confirm accuracy under penalty of perjury"),
});

export const TakedownForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", organization: "", rights_owner: "",
    infringing_url: "", original_work_url: "", description: "", signature: "",
    good_faith: false, accuracy: false,
  });

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    setSubmitting(true);
    try {
      const subject = encodeURIComponent(`DMCA / IT Act Takedown Notice — ${form.rights_owner}`);
      const body = encodeURIComponent(
        `DMCA / IT Act Section 79 Takedown Notice\n\n` +
        `Complainant: ${form.full_name}\nEmail: ${form.email}\n` +
        `Organization: ${form.organization || "—"}\nRights Owner: ${form.rights_owner}\n\n` +
        `Infringing URL (on Edspire Lens): ${form.infringing_url}\n` +
        `Original Work URL: ${form.original_work_url || "—"}\n\n` +
        `Description of Infringement:\n${form.description}\n\n` +
        `I have a good-faith belief that the use of the material is not authorized by the copyright owner, its agent, or the law.\n` +
        `I state under penalty of perjury that the information in this notification is accurate and that I am the owner, or authorized to act on behalf of the owner, of an exclusive right that is allegedly infringed.\n\n` +
        `Digital Signature: ${form.signature}\nDate: ${new Date().toISOString().slice(0, 10)}\n`
      );
      window.location.href = `mailto:legal@edspirelens.com?subject=${subject}&body=${body}`;
      setSubmitted(true);
      toast.success("Opening your email app — please send the prepared notice.");
    } catch (err: any) {
      toast.error("Failed to prepare notice: " + (err?.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-border bg-secondary/30 p-5 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
        <div className="text-sm text-foreground">
          <p className="font-semibold">Notice prepared.</p>
          <p className="text-muted-foreground mt-1">
            Your email client should have opened with the full takedown notice. If it didn't, email
            <a href="mailto:legal@edspirelens.com" className="text-accent underline ml-1">legal@edspirelens.com</a> directly.
          </p>
          <Button variant="link" className="px-0 mt-1" onClick={() => setSubmitted(false)}>Submit another notice</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-foreground">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Your full name *</Label>
          <Input value={form.full_name} onChange={e => update("full_name", e.target.value)} maxLength={100} placeholder="Jane Doe" />
        </div>
        <div className="space-y-1.5">
          <Label>Email *</Label>
          <Input type="email" value={form.email} onChange={e => update("email", e.target.value)} maxLength={255} placeholder="you@example.com" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Organization</Label>
          <Input value={form.organization} onChange={e => update("organization", e.target.value)} maxLength={150} placeholder="Optional" />
        </div>
        <div className="space-y-1.5">
          <Label>Rights owner *</Label>
          <Input value={form.rights_owner} onChange={e => update("rights_owner", e.target.value)} maxLength={150} placeholder="Owner of the original work" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Infringing URL on Edspire Lens *</Label>
        <Input value={form.infringing_url} onChange={e => update("infringing_url", e.target.value)} maxLength={500} placeholder="https://edspirelens.com/..." />
      </div>
      <div className="space-y-1.5">
        <Label>URL of the original work (optional)</Label>
        <Input value={form.original_work_url} onChange={e => update("original_work_url", e.target.value)} maxLength={500} placeholder="https://..." />
      </div>
      <div className="space-y-1.5">
        <Label>Description of the infringement / complaint *</Label>
        <Textarea rows={5} value={form.description} onChange={e => update("description", e.target.value)} maxLength={2000} placeholder="Explain what content is infringing and why you have the right to request its removal." />
      </div>
      <div className="space-y-1.5">
        <Label>Digital signature (type your full legal name) *</Label>
        <Input value={form.signature} onChange={e => update("signature", e.target.value)} maxLength={100} placeholder="Jane Doe" />
      </div>

      <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
        <input type="checkbox" checked={form.good_faith} onChange={e => update("good_faith", e.target.checked)} className="mt-0.5" />
        <span>I have a good-faith belief that the use of the material is not authorized by the copyright owner, its agent, or the law.</span>
      </label>
      <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
        <input type="checkbox" checked={form.accuracy} onChange={e => update("accuracy", e.target.checked)} className="mt-0.5" />
        <span>I state under penalty of perjury that this information is accurate and I am the owner, or authorized to act on behalf of the owner, of the right allegedly infringed.</span>
      </label>

      <Button type="submit" disabled={submitting} className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold gap-2">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Submit Takedown Notice
      </Button>
      <p className="text-[11px] text-muted-foreground text-center">
        Submissions open your email client addressed to legal@edspirelens.com with all details pre-filled.
      </p>
    </form>
  );
};

export default TakedownForm;