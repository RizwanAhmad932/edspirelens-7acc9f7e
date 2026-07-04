import { useEffect, useState } from "react";
import { Download, Share, Plus, MoreVertical, ShieldCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const isIOS = () =>
  typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

const isAndroid = () =>
  typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);

const isChromiumMobile = () =>
  typeof navigator !== "undefined" &&
  /android/i.test(navigator.userAgent) &&
  /(Chrome|SamsungBrowser|EdgA|OPR)\//i.test(navigator.userAgent);

const isSafari = () =>
  typeof navigator !== "undefined" &&
  /safari/i.test(navigator.userAgent) &&
  !/crios|fxios|edgios|opios/i.test(navigator.userAgent);

const isSecureContext = () =>
  typeof window !== "undefined" &&
  (window.isSecureContext || location.hostname === "localhost");

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-ignore iOS Safari
    window.navigator.standalone === true);

const InstallButton = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(false);
  const [iosOpen, setIosOpen] = useState(false);
  const [androidOpen, setAndroidOpen] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      toast.success("Edspire Lens installed!");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (!isSecureContext()) {
      toast.error("Install requires a secure (HTTPS) connection.");
      return;
    }
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") toast.success("Installing...");
      setDeferred(null);
      return;
    }
    if (isIOS()) {
      if (!isSafari()) {
        toast.info("On iPhone, open this page in Safari first, then tap Install.", { duration: 6000 });
        return;
      }
      setIosOpen(true);
      return;
    }
    if (isAndroid()) {
      setAndroidOpen(true);
      return;
    }
    toast.info(
      "Click the install icon in your browser's address bar, or open the menu → 'Install Edspire Lens'.",
      { duration: 6000 }
    );
  };

  return (
    <>
    <Button
      onClick={handleClick}
      size="sm"
      className="gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-full gradient-accent text-accent-foreground shadow-sm hover:opacity-90 text-[10px] sm:text-xs font-medium"
      title="Install Edspire Lens on your phone"
    >
      <Download className="h-3.5 w-3.5" />
      <span className="hidden xs:inline sm:inline">Install App</span>
      <span className="xs:hidden sm:hidden">Install</span>
    </Button>

    <Dialog open={iosOpen} onOpenChange={setIosOpen}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <div className="mx-auto mb-2 flex items-center justify-center">
            <img src="/icon-192.png" alt="Edspire Lens" className="h-16 w-16 rounded-2xl shadow-md" />
          </div>
          <DialogTitle className="text-center">Install Edspire Lens</DialogTitle>
          <DialogDescription className="text-center flex items-center justify-center gap-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500" /> Secure install · No app store needed
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-3 text-sm mt-2">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold">1</span>
            <span className="flex-1">Tap the <Share className="inline h-4 w-4 mx-0.5 text-blue-500" /> <b>Share</b> button at the bottom of Safari.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold">2</span>
            <span className="flex-1">Scroll and tap <Plus className="inline h-4 w-4 mx-0.5" /> <b>Add to Home Screen</b>.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold">3</span>
            <span className="flex-1">Tap <b>Add</b> — the app icon appears on your home screen.</span>
          </li>
        </ol>
        <div className="mt-3 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
          <Check className="h-3 w-3 text-green-500" /> Works offline-ready · Full-screen · HTTPS verified
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={androidOpen} onOpenChange={setAndroidOpen}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <div className="mx-auto mb-2 flex items-center justify-center">
            <img src="/icon-192.png" alt="Edspire Lens" className="h-16 w-16 rounded-2xl shadow-md" />
          </div>
          <DialogTitle className="text-center">Install Edspire Lens</DialogTitle>
          <DialogDescription className="text-center flex items-center justify-center gap-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500" /> Secure install · No Play Store needed
          </DialogDescription>
        </DialogHeader>
        {isChromiumMobile() ? (
          <ol className="space-y-3 text-sm mt-2">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold">1</span>
              <span className="flex-1">Tap the <MoreVertical className="inline h-4 w-4" /> menu (top-right).</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold">2</span>
              <span className="flex-1">Tap <b>Install app</b> or <b>Add to Home screen</b>.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold">3</span>
              <span className="flex-1">Tap <b>Install</b> — the app is added instantly.</span>
            </li>
          </ol>
        ) : (
          <div className="text-sm mt-2 space-y-2">
            <p>You seem to be in an in-app browser (Instagram, Facebook, etc.).</p>
            <p>Tap the <MoreVertical className="inline h-4 w-4" /> menu → <b>Open in Chrome</b>, then tap Install App again.</p>
          </div>
        )}
        <div className="mt-3 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
          <Check className="h-3 w-3 text-green-500" /> HTTPS verified · Signed manifest · No permissions required
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default InstallButton;