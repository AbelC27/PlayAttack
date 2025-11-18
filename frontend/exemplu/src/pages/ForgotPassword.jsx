// frontend/exemplu/src/pages/ForgotPassword.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    background: "#000000",
    fontFamily: '"Inter", "Segoe UI", sans-serif',
  },
  card: {
    width: "100%",
    maxWidth: "440px",
    padding: "48px 42px",
    borderRadius: "24px",
    background: "linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(17, 17, 17, 0.95) 100%)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(34, 197, 94, 0.1)",
    border: "1px solid rgba(34, 197, 94, 0.1)",
    color: "#f9fafb",
    backdropFilter: "blur(12px)",
  },
  header: { marginBottom: "32px", textAlign: "center" },
  title: { fontSize: "28px", fontWeight: 700, marginBottom: "8px" },
  subtitle: { fontSize: "15px", lineHeight: 1.6, color: "rgba(226, 232, 240, 0.7)" },
  form: { display: "flex", flexDirection: "column", gap: "18px" },
  label: { fontSize: "14px", fontWeight: 600, color: "rgba(226, 232, 240, 0.85)" },
  input: {
    padding: "14px 18px",
    borderRadius: "12px",
    border: "1px solid #2a2a2a",
    backgroundColor: "#1a1a1a",
    color: "#fff",
    fontSize: "16px",
    outline: "none",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  },
  button: {
    marginTop: "12px",
    padding: "16px 0",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "#000",
    fontWeight: 700,
    fontSize: "17px",
    letterSpacing: "0.03em",
    boxShadow: "0 4px 20px rgba(34, 197, 94, 0.3)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "pointer",
  },
  alert: {
    marginTop: "26px",
    padding: "14px 16px",
    borderRadius: "14px",
    fontSize: "14px",
    fontWeight: 500,
    textAlign: "center",
  },
};

const messageStyles = {
  success: {
    background: "rgba(16, 185, 129, 0.16)",
    color: "#34d399",
    border: "1px solid rgba(16, 185, 129, 0.35)",
  },
  error: {
    background: "rgba(248, 113, 113, 0.16)",
    color: "#f87171",
    border: "1px solid rgba(248, 113, 113, 0.35)",
  },
};

const interactionStyles = `
  .auth-card input:focus {
    border-color: rgba(34, 197, 94, 0.9);
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18);
  }

  .auth-card button:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(34, 197, 94, 0.4);
  }

  .auth-card button:disabled {
    background: rgba(148, 163, 184, 0.35);
    box-shadow: none;
    cursor: not-allowed;
  }
`;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleResetRequest(e) {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setMessage("");
    setMessageType(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setMessage(error.message);
      setMessageType("error");
    } else {
      setMessage("Check your inbox for the password reset link.");
      setMessageType("success");
    }

    setIsLoading(false);
  }

  return (
    <>
      <style>{interactionStyles}</style>
      <div style={styles.page}>
        <div className="auth-card" style={styles.card}>
          <header style={styles.header}>
            <h1 style={styles.title}>Forgot password</h1>
            <p style={styles.subtitle}>
              Enter the email linked to your account and we'll send you a reset link.
            </p>
          </header>

          <form style={styles.form} onSubmit={handleResetRequest}>
            <label style={styles.label} htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />

            <button
              type="submit"
              style={{
                ...styles.button,
                opacity: isLoading ? 0.8 : 1,
                cursor: isLoading ? "wait" : "pointer",
              }}
              disabled={!email || isLoading}
            >
              {isLoading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          {message && (
            <div
              style={{
                ...styles.alert,
                ...(messageType === "success"
                  ? messageStyles.success
                  : messageStyles.error),
              }}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
