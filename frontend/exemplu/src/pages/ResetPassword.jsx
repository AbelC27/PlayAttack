// frontend/exemplu/src/pages/ResetPassword.jsx
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

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
export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recoverySessionEstablished, setRecoverySessionEstablished] =
    useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function processRecoverySession() {
      try {
        const hash = window.location.hash;
        const searchParams = new URLSearchParams(window.location.search);

        // Handle hash-based recovery tokens (from email template)
        if (hash.includes("access_token") && hash.includes("type=recovery")) {
          
          // Parse hash parameters manually
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          const type = hashParams.get("type");

          if (!accessToken || !refreshToken) {
            throw new Error("Missing authentication tokens");
          }

          // Set session directly with the tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw new Error(`Failed to establish session: ${error.message}`);
          }

          if (!data?.session) {
            throw new Error("No session returned from setSession");
          }

          // Verify session is working
          const { data: { session: verifySession } } = 
            await supabase.auth.getSession();
          
          if (verifySession) {
            setRecoverySessionEstablished(true);
            // Clean URL after successful session establishment
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
          } else {
            throw new Error("Session verification failed");
          }
        }
        // Handle code-based recovery (newer Supabase method)
        else if (searchParams.get("code")) {
          const code = searchParams.get("code");

          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) throw error;

          if (data?.session) {
            setRecoverySessionEstablished(true);
            
            // Clean URL
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
          } else {
            throw new Error("No session returned from code exchange");
          }
        }
        // No recovery parameters found
        else {
          throw new Error(
            "Invalid or expired password reset link. Please request a new one."
          );
        }
      } catch (error) {
        console.error("❌ Recovery session error:", error);
        setMessageType("error");
        setMessage(
          error.message ||
            "Failed to initialize password reset. Please request a new link."
        );
        setRecoverySessionEstablished(false);
      } finally {
        setIsLoading(false);
      }
    }

    processRecoverySession();
  }, []);

  async function handleReset(e) {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      // Verify we still have a session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          "Your session has expired. Please request a new password reset link."
        );
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setMessageType("success");
      setMessage("Password updated successfully! Redirecting to login...");

      // Sign out to force re-login with new password
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("❌ Error resetting password:", error);
      setMessageType("error");
      setMessage(
        error.message ||
          "Failed to reset password. Please request a new reset link."
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Show loading state
  if (isLoading && !message) {
    return (
      <>
        <style>{interactionStyles}</style>
        <div style={styles.page}>
          <div className="auth-card" style={styles.card}>
            <header style={styles.header}>
              <h1 style={styles.title}>Reset password</h1>
              <p style={styles.subtitle}>Initializing password reset...</p>
            </header>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{interactionStyles}</style>
      <div style={styles.page}>
        <div className="auth-card" style={styles.card}>
          <header style={styles.header}>
            <h1 style={styles.title}>Reset password</h1>
            <p style={styles.subtitle}>
              Choose a new password to keep your account secure.
            </p>
          </header>

          {recoverySessionEstablished ? (
            <form style={styles.form} onSubmit={handleReset}>
              <label style={styles.label} htmlFor="new-password">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                placeholder="Create a strong password (min 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={styles.input}
                minLength={8}
                required
              />

              <button
                type="submit"
                style={{
                  ...styles.button,
                  opacity: isLoading ? 0.8 : 1,
                  cursor: isLoading ? "wait" : "pointer",
                }}
                disabled={!newPassword || newPassword.length < 8 || isLoading}
              >
                {isLoading ? "Updating..." : "Update password"}
              </button>
            </form>
          ) : (
            <div style={{ ...styles.alert, ...messageStyles.error }}>
              {message || "Unable to process password reset."}
            </div>
          )}

          {message && recoverySessionEstablished && (
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