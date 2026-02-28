import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Digite seu email.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível enviar o link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo} />
        <h1 style={styles.title}>BelFlow</h1>
        <p style={styles.subtitle}>
          Digite seu email para receber um link seguro de acesso (sem senha).
        </p>

        <form onSubmit={sendMagicLink} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            placeholder="voce@dominio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <button style={styles.button} disabled={loading}>
            {loading ? "Enviando…" : "Enviar link"}
          </button>

          {sent && <div style={styles.success}>✅ Confira seu email (caixa de entrada/spam).</div>}
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.footnote}>
            Eixo 1 — Cidade, Mobilidade e Cidadania • Belém
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#0B0B0D",
    color: "#fff",
    padding: 24,
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "#111114",
    border: "1px solid #232329",
    borderRadius: 20,
    padding: 28,
    boxShadow: "0 20px 60px rgba(0,0,0,.45)",
    textAlign: "center",
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    margin: "0 auto 12px",
    background: "#FFFFFF",
    opacity: 0.9,
  },
  title: { margin: "6px 0 6px", fontSize: 28, fontWeight: 700 },
  subtitle: { margin: "0 0 18px", fontSize: 14, color: "#A1A1AA", lineHeight: 1.4 },
  form: { display: "grid", gap: 10, textAlign: "left" },
  label: { fontSize: 12, color: "#A1A1AA" },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #2A2A33",
    background: "#0E0E12",
    color: "#fff",
    outline: "none",
    fontSize: 14,
  },
  button: {
    marginTop: 6,
    padding: "12px 14px",
    borderRadius: 14,
    border: "none",
    background: "#0A84FF",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
  },
  success: {
    marginTop: 8,
    padding: 12,
    borderRadius: 14,
    background: "rgba(34,197,94,.12)",
    border: "1px solid rgba(34,197,94,.25)",
    color: "#B7F7CC",
    fontSize: 13,
    textAlign: "center",
  },
  error: {
    marginTop: 8,
    padding: 12,
    borderRadius: 14,
    background: "rgba(239,68,68,.12)",
    border: "1px solid rgba(239,68,68,.25)",
    color: "#FECACA",
    fontSize: 13,
    textAlign: "center",
  },
  footnote: { marginTop: 10, fontSize: 12, color: "#7C7C88", textAlign: "center" },
};