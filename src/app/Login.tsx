import React, { useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Mode = "signin" | "signup";

export default function Login() {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (mode === "signup") {
      return (
        name.trim().length >= 2 &&
        email.trim().length > 3 &&
        password.length >= 6
      );
    }

    return email.trim().length > 3 && password.length >= 6;
  }, [mode, name, email, password]);

  function resetMessages() {
    setError(null);
    setSuccess(null);
  }

  function validate() {
    resetMessages();

    if (mode === "signup" && !name.trim()) {
      setError("Digite seu nome.");
      return false;
    }

    if (mode === "signup" && name.trim().length < 2) {
      setError("Seu nome precisa ter pelo menos 2 caracteres.");
      return false;
    }

    if (!email.trim()) {
      setError("Digite seu email.");
      return false;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Digite um email válido.");
      return false;
    }

    if (!password) {
      setError("Digite sua senha.");
      return false;
    }

    if (password.length < 6) {
      setError("Sua senha precisa ter pelo menos 6 caracteres.");
      return false;
    }

    return true;
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      resetMessages();

      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        setSuccess("✅ Login feito! Carregando seu painel…");
      } else {
        const cleanedName = name.trim();

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              name: cleanedName,
              full_name: cleanedName,
              nome: cleanedName,
            },
          },
        });

        if (error) throw error;

        if (data?.session) {
          setSuccess("✅ Conta criada e login realizado!");
        } else {
          setSuccess(
            "✅ Conta criada! Confira seu email para confirmar (se a confirmação estiver ativa)."
          );
        }
      }
    } catch (err: any) {
      const msg = String(err?.message ?? "Não foi possível autenticar.");

      if (msg.toLowerCase().includes("invalid login credentials")) {
        setError("Email ou senha incorretos.");
      } else if (msg.toLowerCase().includes("user already registered")) {
        setError("Esse email já está cadastrado. Tente entrar.");
      } else if (msg.toLowerCase().includes("email rate limit exceeded")) {
        setError("Limite de emails do Supabase excedido. Tente mais tarde.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function forgotPassword() {
    resetMessages();

    if (!email.trim()) {
      setError("Digite seu email para recuperar a senha.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) throw error;

      setSuccess("✅ Enviamos um link de recuperação para seu email.");
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível enviar o link de recuperação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <div style={styles.logo} />
        </div>

        <h1 style={styles.title}>BelFlow</h1>
        <p style={styles.subtitle}>
          {mode === "signin"
            ? "Entre com email e senha para acessar o painel."
            : "Crie sua conta para registrar e acompanhar ocorrências urbanas."}
        </p>

        <div style={styles.tabs}>
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              resetMessages();
            }}
            style={{
              ...styles.tab,
              ...(mode === "signin" ? styles.tabActive : {}),
            }}
          >
            Entrar
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("signup");
              resetMessages();
            }}
            style={{
              ...styles.tab,
              ...(mode === "signup" ? styles.tabActive : {}),
            }}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={handleAuth} style={styles.form}>
          {mode === "signup" && (
            <>
              <label style={styles.label}>Nome</label>
              <input
                style={styles.input}
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </>
          )}

          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            placeholder="voce@dominio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <label style={{ ...styles.label, marginTop: 6 }}>Senha</label>

          <div style={styles.passwordRow}>
            <input
              style={{ ...styles.input, margin: 0, flex: 1 }}
              type={showPassword ? "text" : "password"}
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />

            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              style={styles.eyeBtn}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          <button
            style={{
              ...styles.button,
              opacity: loading || !canSubmit ? 0.6 : 1,
              cursor: loading || !canSubmit ? "not-allowed" : "pointer",
            }}
            disabled={loading || !canSubmit}
          >
            {loading
              ? "Aguarde…"
              : mode === "signin"
              ? "Entrar"
              : "Criar conta"}
          </button>

          {mode === "signin" && (
            <button
              type="button"
              onClick={forgotPassword}
              style={styles.linkBtn}
              disabled={loading}
            >
              Esqueci minha senha
            </button>
          )}

          {success && <div style={styles.success}>{success}</div>}
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
  logoWrap: {
    display: "grid",
    placeItems: "center",
    marginBottom: 12,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: "#FFFFFF",
    opacity: 0.92,
  },
  title: {
    margin: "6px 0 6px",
    fontSize: 28,
    fontWeight: 700,
  },
  subtitle: {
    margin: "0 0 16px",
    fontSize: 14,
    color: "#A1A1AA",
    lineHeight: 1.4,
  },
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
  tabActive: {
    background: "#16161B",
    border: "1px solid #2A2A33",
    color: "#FFFFFF",
  },
  form: {
    display: "grid",
    gap: 10,
    textAlign: "left",
  },
  label: {
    fontSize: 12,
    color: "#A1A1AA",
  },
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
  passwordRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
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
  footnote: {
    marginTop: 10,
    fontSize: 12,
    color: "#7C7C88",
    textAlign: "center",
  },
};