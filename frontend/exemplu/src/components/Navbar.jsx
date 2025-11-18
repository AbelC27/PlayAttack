// frontend/exemplu/src/components/Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import PlayAtacLogo from "../assets/logo.png"; // Asigură-te că ai logo-ul în acest path

function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const navStyle = {
    backgroundColor: "#000000", // Full black background
    padding: "1rem 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#808080", // Gray text color
    borderBottom: "1px solid #333",
    position: "static",
    zIndex: "1000",
    width: "100%",
    boxSizing: "border-box",
    minHeight: "80px", // Increased height to accommodate larger logo
  };

  const logoStyle = {
    display: "flex",
    alignItems: "center",
    color: "#22c55e", // Green color for logo text
    fontSize: "1.8rem",
    fontWeight: "bold",
    textDecoration: "none",
    gap: "10px", // Space between logo image and text
  };

  const buttonContainerStyle = {
    display: "flex",
    gap: "1rem", // Spațiu între butoane
  };

  const signInButtonStyle = {
    backgroundColor: "#22c55e",
    color: "white", // White text
    border: "1px solid #444",
    padding: "0.6rem 1.2rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    textDecoration: "none",
  };

  const getStartedButtonStyle = {
    backgroundColor: "#22c55e", // Green background
    color: "white",
    border: "none",
    padding: "0.6rem 1.2rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    textDecoration: "none",
  };

  return (
    <nav style={navStyle}>
      {user ? (
        <Link to="/dashboard" style={logoStyle}>
          <img
            src={PlayAtacLogo}
            alt="PlayAtac Logo"
            style={{
              height: "60px",
              width: "auto",
              marginRight: "1.5rem",
            }}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </Link>
      ) : (
        <Link to="/" style={logoStyle}>
          <img
            src={PlayAtacLogo}
            alt="PlayAtac Logo"
            style={{
              height: "60px",
              width: "auto",
              marginRight: "1.5rem",
            }}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </Link>
      )}
      <div style={buttonContainerStyle}>
        {user ? (
          // User is logged in - show dashboard link and profile avatar dropdown
          <>
            {/* Profile Avatar Dropdown */}
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  border: "none",
                  borderRadius: "50%",
                  width: "45px",
                  height: "45px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "white",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(34, 197, 94, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "scale(1.05)";
                  e.target.style.boxShadow =
                    "0 4px 12px rgba(34, 197, 94, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "scale(1)";
                  e.target.style.boxShadow = "0 2px 8px rgba(34, 197, 94, 0.3)";
                }}
              >
                {(user.username || user.email || "U").charAt(0).toUpperCase()}
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "55px",
                    right: "0",
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    minWidth: "200px",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
                    zIndex: 1000,
                    overflow: "hidden",
                  }}
                >
                  {/* User Info Header */}
                  <div
                    style={{
                      padding: "1rem",
                      borderBottom: "1px solid #374151",
                      backgroundColor: "#111827",
                    }}
                  >
                    <div
                      style={{
                        color: "#22c55e",
                        fontWeight: "bold",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {user.username || "User"}
                    </div>
                    <div style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
                      {user.email}
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div style={{ padding: "0.5rem 0" }}>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/profile");
                      }}
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        backgroundColor: "transparent",
                        border: "none",
                        color: "#f3f4f6",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.backgroundColor = "#374151")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.backgroundColor = "transparent")
                      }
                    >
                      👤 Profile
                    </button>
                    <div
                      style={{
                        height: "1px",
                        backgroundColor: "#374151",
                        margin: "0.5rem 0",
                      }}
                    />

                    <button
                      onClick={async () => {
                        setShowDropdown(false);

                        try {

                          // Wait for signOut to complete
                          await signOut();

                          // Use window.location for hard redirect
                          window.location.href = "/";
                        } catch (error) {
                          console.error(" Error during logout:", error);

                          // Force navigation even on error
                          window.location.href = "/";
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        backgroundColor: "transparent",
                        border: "none",
                        color: "#ef4444",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.backgroundColor = "#374151")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.backgroundColor = "transparent")
                      }
                    >
                      ➜ Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          // User is not logged in - show login and signup buttons
          <>
            <Link to="/login" style={signInButtonStyle}>
              Log In
            </Link>
            <Link to="/signup" style={getStartedButtonStyle}>
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
