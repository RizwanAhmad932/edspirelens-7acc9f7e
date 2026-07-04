import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const isIOS = () =>
  typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-ignore iOS Safari
    window.navigator.standalone === true);

const InstallButton = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(false);

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
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") toast.success("Installing...");
      setDeferred(null);
      return;
    }
    if (isIOS()) {
      toast.info("Tap the Share icon, then 'Add to Home Screen'.", {
        icon: <Share className="h-4 w-4" />,
        duration: 5000,
      });
      return;
    }
    toast.info("Open your browser menu and tap 'Install app' or 'Add to Home screen'.", {
      duration: 5000,
    });
  };

  return (
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
  );
};

export default InstallButton;