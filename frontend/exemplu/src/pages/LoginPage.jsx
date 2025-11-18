import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showSlash, setShowSlash] = useState(false);
  const navigate = useNavigate();
  const { signIn, loading } = useAuth();

  useEffect(() => {
    // Trigger slash animation on mount
    setShowSlash(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const result = await signIn(email, password);

      if (result.success) {
        setMessage("Login successful!");
        navigate("/home"); 
      } else {
        setMessage(`Login failed: ${result.error}`);
      }
    } catch (error) {
      setMessage("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div style={styles.container}>
      {/* Animated Background Elements */}
      <div style={styles.bgGradient1} />
      <div style={styles.bgGradient2} />
      
      {/* Slash Animation */}
      {showSlash && (
        <div style={styles.slashContainer}>
          <div style={styles.slash} />
        </div>
      )}

      {/* Main Form Container */}
      <div style={styles.formWrapper}>
        <div style={styles.gameIcon}>⚔️</div>
        <h2 style={styles.title}>Welcome Back, Player</h2>
        <p style={styles.subtitle}>Login to continue your quest</p>
        
        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            style={styles.button} 
            disabled={loading}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 30px rgba(34, 197, 94, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 20px rgba(34, 197, 94, 0.3)';
            }}
          >
            {loading ? (
              <span style={styles.loadingText}>
                <span style={styles.spinner} />
                Logging in...
              </span>
            ) : (
              <>Login <span style={styles.arrow}>→</span></>
            )}
          </button>

          {message && (
            <div style={{
              ...styles.message,
              background: message.includes('failed') || message.includes('error') 
                ? 'rgba(239, 68, 68, 0.1)' 
                : 'rgba(34, 197, 94, 0.1)',
              border: `1px solid ${message.includes('failed') || message.includes('error') 
                ? 'rgba(239, 68, 68, 0.3)' 
                : 'rgba(34, 197, 94, 0.3)'}`,
              color: message.includes('failed') || message.includes('error') 
                ? '#ef4444' 
                : '#22c55e'
            }}>
              {message}
            </div>
          )}

          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>or</span>
            <span style={styles.dividerLine} />
          </div>

          <div style={styles.links}>
            <Link to="/signup" style={styles.link}>
              Don't have an account? <span style={styles.linkHighlight}>Sign Up</span>
            </Link>
          </div>

          <div style={styles.links}>
            <a href="/reset" style={styles.linkSecondary}>
              Forgot password?
            </a>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes slashIn {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(-45deg);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(-45deg);
            opacity: 0;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(20px, 20px) rotate(5deg); }
          50% { transform: translate(0, 40px) rotate(0deg); }
          75% { transform: translate(-20px, 20px) rotate(-5deg); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        input:-webkit-autofill,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #1a1a1a inset !important;
          box-shadow: 0 0 0 1000px #1a1a1a inset !important;
          -webkit-text-fill-color: #fff !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    width: "100vw",
    backgroundColor: "#000",
    position: "relative",
    overflow: "hidden"
  },
  bgGradient1: {
    position: "absolute",
    top: "-10%",
    right: "10%",
    width: "500px",
    height: "500px",
    background: "radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, transparent 70%)",
    borderRadius: "50%",
    filter: "blur(60px)",
    animation: "float 8s ease-in-out infinite"
  },
  bgGradient2: {
    position: "absolute",
    bottom: "-10%",
    left: "10%",
    width: "400px",
    height: "400px",
    background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
    borderRadius: "50%",
    filter: "blur(60px)",
    animation: "float 10s ease-in-out infinite reverse"
  },
  slashContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    zIndex: 1
  },
  slash: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "150%",
    height: "3px",
    background: "linear-gradient(90deg, transparent, #22c55e, transparent)",
    transform: "translateX(-100%) translateY(-100%) rotate(-45deg)",
    animation: "slashIn 1s ease-out forwards",
    boxShadow: "0 0 20px #22c55e"
  },
  formWrapper: {
    position: "relative",
    zIndex: 2,
    background: "linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(17, 17, 17, 0.95) 100%)",
    borderRadius: "24px",
    padding: "3rem 2.5rem",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(34, 197, 94, 0.1)",
    backdropFilter: "blur(10px)",
    minWidth: "440px",
    border: "1px solid rgba(34, 197, 94, 0.1)",
    animation: "fadeInUp 0.6s ease-out 0.3s both"
  },
  gameIcon: {
    fontSize: "3rem",
    textAlign: "center",
    marginBottom: "1rem",
    filter: "drop-shadow(0 0 10px rgba(34, 197, 94, 0.5))"
  },
  title: {
    color: "#fff",
    fontSize: "2rem",
    fontWeight: "800",
    textAlign: "center",
    marginBottom: "0.5rem",
    background: "linear-gradient(135deg, #fff 0%, #22c55e 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text"
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: "1rem",
    textAlign: "center",
    marginBottom: "2rem"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem"
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  label: {
    color: "#9ca3af",
    fontSize: "0.875rem",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  },
  input: {
    padding: "14px 18px",
    borderRadius: "12px",
    border: "1px solid #2a2a2a",
    backgroundColor: "#1a1a1a",
    fontSize: "16px",
    color: "#fff",
    transition: "all 0.3s ease",
    outline: "none"
  },
  button: {
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "#000",
    border: "none",
    borderRadius: "12px",
    padding: "16px 0",
    fontSize: "18px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "0.5rem",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 20px rgba(34, 197, 94, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem"
  },
  arrow: {
    display: "inline-block",
    transition: "transform 0.3s ease"
  },
  loadingText: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid #000",
    borderTopColor: "transparent",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.6s linear infinite"
  },
  message: {
    textAlign: "center",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: "500",
    animation: "fadeInUp 0.3s ease-out"
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    margin: "0.5rem 0"
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#2a2a2a"
  },
  dividerText: {
    color: "#6b7280",
    fontSize: "0.875rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  },
  links: {
    textAlign: "center"
  },
  link: {
    color: "#9ca3af",
    textDecoration: "none",
    fontSize: "0.95rem",
    transition: "color 0.3s ease"
  },
  linkHighlight: {
    color: "#22c55e",
    fontWeight: "600"
  },
  linkSecondary: {
    color: "#6b7280",
    textDecoration: "none",
    fontSize: "0.875rem",
    transition: "color 0.3s ease"
  }
};

export default LoginPage;