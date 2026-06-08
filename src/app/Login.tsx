import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

type AuthMethod = "otp" | "password";
type OtpStep = "email" | "code";
type PasswordMode = "signin" | "signup";

interface LoginProps {
  onBypass: () => void;
}

export default function Login({ onBypass }: LoginProps) {
  // ─── Auth method toggle ───────────────────────────────────────────────────
  const [authMethod, setAuthMethod] = useState<AuthMethod>("otp");

  // ─── OTP flow ────────────────────────────────────────────────────────────
  const [otpStep, setOtpStep] = useState<OtpStep>("email");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ─── Password flow ───────────────────────────────────────────────────────
  const [pwMode, setPwMode] = useState<PasswordMode>("signin");
  const [pwName, setPwName] = useState("");
  const [pwEmail, setPwEmail] = useState("");
  const [pwPassword, setPwPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ─── Shared ───────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resetMessages() {
    setError(null);
    setSuccess(null);
  }

  // ─── Resend cooldown timer ─────────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // ─── OTP: send code ───────────────────────────────────────────────────────
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();

    if (!otpEmail.trim() || !otpEmail.includes("@")) {
      setError("Digite um email válido.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email: otpEmail.trim(),
        options: { shouldCreateUser: true },
      });
      if (error) throw error;

      setOtpStep("code");
      setResendCooldown(60);
      setSuccess("📩 Código enviado! Confira sua caixa de entrada.");
    } catch (err: any) {
      const msg = String(err?.message ?? "");
      if (msg.toLowerCase().includes("rate limit")) {
        setError("Muitas tentativas. Aguarde alguns minutos.");
      } else {
        setError(msg || "Não foi possível enviar o código.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── OTP: verify code ─────────────────────────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();

    const token = otpDigits.join("");
    if (token.length < 6) {
      setError("Digite todos os 6 dígitos do código.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.verifyOtp({
        email: otpEmail.trim(),
        token,
        type: "email",
      });
      if (error) throw error;
      setSuccess("✅ Acesso autorizado! Carregando painel…");
    } catch (err: any) {
      const msg = String(err?.message ?? "");
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("expired")) {
        setError("Código inválido ou expirado. Solicite um novo.");
      } else {
        setError(msg || "Não foi possível verificar o código.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── OTP digit inputs ─────────────────────────────────────────────────────
  function handleDigitChange(index: number, value: string) {
    const sanitized = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = sanitized;
    setOtpDigits(next);
    if (sanitized && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleDigitPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otpDigits];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] ?? "";
    setOtpDigits(next);
    const lastFilled = Math.min(pasted.length, 5);
    otpRefs.current[lastFilled]?.focus();
  }

  // ─── Password flow submit ─────────────────────────────────────────────────
  async function handlePasswordAuth(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();

    if (!pwEmail.trim() || !pwEmail.includes("@")) {
      setError("Digite um email válido.");
      return;
    }
    if (pwPassword.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    try {
      setLoading(true);
      if (pwMode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: pwEmail.trim(),
          password: pwPassword,
        });
        if (error) throw error;
        setSuccess("✅ Login feito! Carregando painel…");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: pwEmail.trim(),
          password: pwPassword,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name: pwName.trim(), full_name: pwName.trim() },
          },
        });
        if (error) throw error;
        if (data?.session) {
          setSuccess("✅ Conta criada e login realizado!");
        } else {
          setSuccess("✅ Conta criada! Confirme seu email se necessário.");
        }
      }
    } catch (err: any) {
      const msg = String(err?.message ?? "");
      if (msg.toLowerCase().includes("invalid login credentials")) {
        setError("Email ou senha incorretos.");
      } else if (msg.toLowerCase().includes("user already registered")) {
        setError("Email já cadastrado. Tente entrar.");
      } else if (msg.toLowerCase().includes("email rate limit")) {
        setError("Limite de emails excedido. Tente mais tarde.");
      } else {
        setError(msg || "Não foi possível autenticar.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <img src="/logo.jpg" alt="ZelaBelém" style={s.logo} />
        </div>
        <h1 style={s.title}>ZelaBelém</h1>
        <p style={s.subtitle}>
          {authMethod === "otp"
            ? otpStep === "email"
              ? "Informe seu email e receba um código de acesso."
              : `Código enviado para ${otpEmail}`
            : pwMode === "signin"
            ? "Entre com email e senha para acessar o painel."
            : "Crie sua conta para registrar ocorrências urbanas."}
        </p>

        {/* ── Method switcher ── */}
        <div style={s.tabs}>
          <button
            type="button"
            style={{ ...s.tab, ...(authMethod === "otp" ? s.tabActive : {}) }}
            onClick={() => { setAuthMethod("otp"); resetMessages(); }}
          >
            Código por email
          </button>
          <button
            type="button"
            style={{ ...s.tab, ...(authMethod === "password" ? s.tabActive : {}) }}
            onClick={() => { setAuthMethod("password"); resetMessages(); }}
          >
            Senha
          </button>
        </div>

        {/* ════════════════════════ OTP FLOW ════════════════════════ */}
        {authMethod === "otp" && (
          <>
            {otpStep === "email" ? (
              <form onSubmit={handleSendOtp} style={s.form}>
                <label style={s.label}>Email</label>
                <input
                  style={s.input}
                  type="email"
                  placeholder="voce@dominio.com"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  autoComplete="email"
                  required
                />

                <button
                  style={{
                    ...s.button,
                    opacity: loading || !otpEmail.trim() ? 0.6 : 1,
                    cursor: loading || !otpEmail.trim() ? "not-allowed" : "pointer",
                  }}
                  disabled={loading || !otpEmail.trim()}
                >
                  {loading ? "Enviando…" : "Enviar código"}
                </button>

                {success && <div style={s.success}>{success}</div>}
                {error && <div style={s.error}>{error}</div>}
                <div style={s.footnote}>Eixo 1 — Cidade, Mobilidade e Cidadania • Belém</div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={s.form}>
                {/* 6-digit OTP inputs */}
                <label style={{ ...s.label, textAlign: "center" }}>
                  Digite o código de 6 dígitos
                </label>

                <div style={s.otpRow}>
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      style={s.otpBox}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(i, e)}
                      onPaste={i === 0 ? handleDigitPaste : undefined}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                <button
                  style={{
                    ...s.button,
                    opacity: loading || otpDigits.join("").length < 6 ? 0.6 : 1,
                    cursor: loading || otpDigits.join("").length < 6 ? "not-allowed" : "pointer",
                  }}
                  disabled={loading || otpDigits.join("").length < 6}
                >
                  {loading ? "Verificando…" : "Verificar código"}
                </button>

                {/* Resend */}
                <button
                  type="button"
                  style={{
                    ...s.linkBtn,
                    opacity: resendCooldown > 0 || loading ? 0.5 : 1,
                    cursor: resendCooldown > 0 || loading ? "not-allowed" : "pointer",
                  }}
                  disabled={resendCooldown > 0 || loading}
                  onClick={() => {
                    setOtpDigits(["", "", "", "", "", ""]);
                    resetMessages();
                    setOtpStep("email");
                  }}
                >
                  {resendCooldown > 0
                    ? `Reenviar em ${resendCooldown}s`
                    : "← Voltar e reenviar código"}
                </button>

                {success && <div style={s.success}>{success}</div>}
                {error && <div style={s.error}>{error}</div>}
                <div style={s.footnote}>Eixo 1 — Cidade, Mobilidade e Cidadania • Belém</div>
              </form>
            )}
          </>
        )}

        {/* ════════════════════════ PASSWORD FLOW ════════════════════════ */}
        {authMethod === "password" && (
          <>
            <div style={s.subTabs}>
              <button
                type="button"
                style={{ ...s.subTab, ...(pwMode === "signin" ? s.subTabActive : {}) }}
                onClick={() => { setPwMode("signin"); resetMessages(); }}
              >
                Entrar
              </button>
              <button
                type="button"
                style={{ ...s.subTab, ...(pwMode === "signup" ? s.subTabActive : {}) }}
                onClick={() => { setPwMode("signup"); resetMessages(); }}
              >
                Criar conta
              </button>
            </div>

            <form onSubmit={handlePasswordAuth} style={s.form}>
              {pwMode === "signup" && (
                <>
                  <label style={s.label}>Nome</label>
                  <input
                    style={s.input}
                    type="text"
                    placeholder="Seu nome"
                    value={pwName}
                    onChange={(e) => setPwName(e.target.value)}
                    autoComplete="name"
                  />
                </>
              )}

              <label style={s.label}>Email</label>
              <input
                style={s.input}
                type="email"
                placeholder="voce@dominio.com"
                value={pwEmail}
                onChange={(e) => setPwEmail(e.target.value)}
                autoComplete="email"
              />

              <label style={{ ...s.label, marginTop: 4 }}>Senha</label>
              <div style={s.passwordRow}>
                <input
                  style={{ ...s.input, margin: 0, flex: 1 }}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••"
                  value={pwPassword}
                  onChange={(e) => setPwPassword(e.target.value)}
                  autoComplete={pwMode === "signin" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={s.eyeBtn}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              <button
                style={{
                  ...s.button,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                disabled={loading}
              >
                {loading ? "Aguarde…" : pwMode === "signin" ? "Entrar" : "Criar conta"}
              </button>

              {success && <div style={s.success}>{success}</div>}
              {error && <div style={s.error}>{error}</div>}
              <div style={s.footnote}>Eixo 1 — Cidade, Mobilidade e Cidadania • Belém</div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background:
      "linear-gradient(rgba(11,11,13,0.45),rgba(11,11,13,0.85)), url('/background.jpg') no-repeat center center fixed",
    backgroundSize: "cover",
    color: "#fff",
    padding: 24,
    fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "rgba(17,17,20,0.82)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 28,
    boxShadow: "0 24px 60px rgba(0,0,0,.65)",
    textAlign: "center",
  },
  logoWrap: { display: "grid", placeItems: "center", marginBottom: 12 },
  logo: { width: 64, height: 64, borderRadius: 16, objectFit: "cover", boxShadow: "0 8px 24px rgba(0,0,0,.3)" },
  title: { margin: "6px 0 6px", fontSize: 28, fontWeight: 700 },
  subtitle: { margin: "0 0 16px", fontSize: 14, color: "#A1A1AA", lineHeight: 1.4 },

  // Main method tabs
  tabs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    background: "#0E0E12",
    border: "1px solid #232329",
    borderRadius: 16,
    padding: 6,
    marginBottom: 14,
  },
  tab: {
    height: 34,
    borderRadius: 12,
    border: "1px solid transparent",
    background: "transparent",
    color: "#A1A1AA",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  tabActive: { background: "#16161B", border: "1px solid #2A2A33", color: "#FFFFFF" },

  // Password sub-tabs
  subTabs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 6,
    marginBottom: 14,
  },
  subTab: {
    height: 32,
    borderRadius: 10,
    border: "1px solid #232329",
    background: "transparent",
    color: "#A1A1AA",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  subTabActive: { background: "#16161B", border: "1px solid #2A2A33", color: "#FFFFFF" },

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
    boxSizing: "border-box",
  },
  passwordRow: { display: "flex", alignItems: "center", gap: 8 },
  eyeBtn: {
    height: 44,
    padding: "0 12px",
    borderRadius: 14,
    border: "1px solid #2A2A33",
    background: "#0E0E12",
    color: "#A1A1AA",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  // OTP digit boxes
  otpRow: {
    display: "flex",
    justifyContent: "center",
    gap: 10,
    margin: "8px 0",
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 14,
    border: "1px solid #2A2A33",
    background: "#0E0E12",
    color: "#fff",
    fontSize: 22,
    fontWeight: 700,
    textAlign: "center",
    outline: "none",
    caretColor: "#0A84FF",
    transition: "border-color 0.2s",
  },

  button: {
    marginTop: 8,
    padding: "12px 14px",
    borderRadius: 14,
    border: "none",
    background: "#0A84FF",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
  },
  linkBtn: {
    marginTop: 4,
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid #2A2A33",
    background: "transparent",
    color: "#A1A1AA",
    fontSize: 13,
    cursor: "pointer",
    textAlign: "center",
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