import { useState } from "react";
import { toast } from "sonner";

import { API_BASE_URL, useAuth } from "@/hooks/useAuth";

export function VerifyEmailBanner() {
  const { user, token, loading } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  // non-blocking prompt: only for a logged-in user whose email isn't verified
  if (loading || !user || user.emailVerified || dismissed) return null;

  async function resend() {
    if (!token) return;
    setSending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email/resend`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error();
      toast.success("Te reenviamos el mail de verificación.");
    } catch {
      toast.error("No pude reenviar el mail. Probá más tarde.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-accent text-accent-foreground">
      <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-widest">
        <span>Confirmá tu email para asegurar tu cuenta. Te mandamos un link al registrarte.</span>
        <div className="flex items-center gap-4 shrink-0">
          <button onClick={resend} disabled={sending} className="underline hover:opacity-70 disabled:opacity-50">
            {sending ? "Enviando…" : "Reenviar"}
          </button>
          <button onClick={() => setDismissed(true)} aria-label="Cerrar aviso" className="hover:opacity-70">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
