import { useEffect, useState } from "react";
import { Download, Share, Plus, MoreVertical, ShieldCheck, Check, Copy, ExternalLink } from "lucide-react";
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

const isIOSInAppBrowser = () =>
  isIOS() && /(FBAN|FBAV|Instagram|Line|Twitter|LinkedInApp|GSA|DuckDuckGo)/i.test(navigator.userAgent);

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
      <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden">
        <div className="p-5">
        <DialogHeader>
          <div className="mx-auto mb-2 flex items-center justify-center">
            <img src="/icon-192.png" alt="Edspire Lens" className="h-16 w-16 rounded-2xl shadow-md" />
          </div>
          <DialogTitle className="text-center">Install Edspire Lens</DialogTitle>
          <DialogDescription className="text-center flex items-center justify-center gap-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500" /> Secure install · No app store needed
          </DialogDescription>
        </DialogHeader>

        {isIOSInAppBrowser() ? (
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs">
              You're inside another app's browser. iOS only allows installing from <b>Safari</b>.
            </div>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied — paste it in Safari");
                } catch { toast.info("Copy this URL and open it in Safari"); }
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium"
            >
              <Copy className="h-4 w-4" /> Copy link
            </button>
            <a
              href={`x-safari-https://${window.location.host}${window.location.pathname}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border font-medium"
            >
              <ExternalLink className="h-4 w-4" /> Try open in Safari
            </a>
          </div>
        ) : (
          <>
            {/* Illustrated Safari mock */}
            <div className="mt-4 rounded-xl border border-border bg-muted/40 overflow-hidden">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted border-b border-border">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                <span className="h-2 w-2 rounded-full bg-green-400" />
                <span className="ml-2 text-[10px] text-muted-foreground truncate">edspirelens.lovable.app</span>
              </div>
              <div className="h-16 flex items-center justify-center text-[11px] text-muted-foreground">
                Edspire Lens preview
              </div>
              <div className="flex items-center justify-around py-2 border-t border-border bg-background/60">
                <span className="text-muted-foreground">‹</span>
                <span className="text-muted-foreground">›</span>
                <span className="relative">
                  <Share className="h-5 w-5 text-blue-500 animate-bounce" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 ring-2 ring-background" />
                </span>
                <span className="text-muted-foreground">□</span>
                <span className="text-muted-foreground">≡</span>
              </div>
            </div>

            <ol className="space-y-2.5 text-sm mt-4">
              <li className="flex items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold">1</span>
                <span className="flex-1">Tap the <Share className="inline h-4 w-4 mx-0.5 text-blue-500" /> <b>Share</b> icon (bottom of Safari).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold">2</span>
                <span className="flex-1">Scroll down, tap <Plus className="inline h-4 w-4 mx-0.5" /> <b>Add to Home Screen</b>.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold">3</span>
                <span className="flex-1">Tap <b>Add</b> — the icon appears on your home screen.</span>
              </li>
            </ol>

            {typeof navigator !== "undefined" && "share" in navigator && (
              <button
                onClick={async () => {
                  try {
                    await navigator.share({ title: "Edspire Lens", url: window.location.href });
                  } catch { /* user cancelled */ }
                }}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium text-sm"
              >
                <Share className="h-4 w-4" /> Open Share sheet
              </button>
            )}

            <p className="mt-2 text-[10px] text-center text-muted-foreground">
              Note: Apple only shows "Add to Home Screen" in Safari's own Share menu.
            </p>
          </>
        )}

        <div className="mt-4 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
          <Check className="h-3 w-3 text-green-500" /> HTTPS verified · Offline-ready · Full-screen
        </div>
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