import { useEffect, useRef, useState } from "react";
import { useLoginWithGoogle } from "../api/use-login-with-google.js";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: { client_id: string; callback: (response: { credential: string }) => void }): void;
          renderButton(parent: HTMLElement, options: Record<string, string>): void;
        };
      };
    };
  }
}

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve) => existing.addEventListener("load", () => resolve()));
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

export function GoogleSignInButton({ onSuccess }: { onSuccess: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loginWithGoogle = useLoginWithGoogle();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId || !containerRef.current) return;

    let cancelled = false;

    loadGoogleScript().then(() => {
      if (cancelled || !window.google || !containerRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          setError(null);
          loginWithGoogle.mutate(response.credential, {
            onSuccess,
            onError: (mutationError) => {
              console.error("Google login failed", mutationError);
              const message =
                (mutationError as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                "No se pudo iniciar sesión con Google.";
              setError(message);
            },
          });
        },
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        width: "320",
        text: "continue_with",
        locale: "es",
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  if (!clientId) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={containerRef} className="flex justify-center" />
      {error && <p className="max-w-sm text-center text-xs text-destructive">{error}</p>}
    </div>
  );
}
