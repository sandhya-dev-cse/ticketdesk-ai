"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");
const [messageType, setMessageType] = useState<"success" | "error" | "">("");

const handleLogin = async () => {
  setMessage("");
  setMessageType("");

  if (!email || !password) {
    setMessage("Please enter your email and password.");
    setMessageType("error");
    return;
  }

  try {
    setLoading(true);

    const response = await fetch("https://ticketdesk-ai.onrender.com/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.detail || "Invalid email or password.");
      setMessageType("error");
      return;
    }

    localStorage.setItem("access_token", data.access_token);

    setMessage("Login successful!");
    setMessageType("success");

    window.location.href = "/dashboard/home";

  } catch (error) {
    console.error(error);

    setMessage(
      "Unable to connect to the server. Please check that the backend is running."
    );
    setMessageType("error");
  } finally {
    setLoading(false);
  }
};
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b1220",
        color: "white",
      }}
    >
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
        }}
      >

        {/* LEFT SIDE */}

        <section
          style={{
            width: "50%",
            minHeight: "100vh",
            background:
              "linear-gradient(135deg, #07111f 0%, #0d2342 55%, #123b6d 100%)",
            padding: "60px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
          className="hidden lg:flex"
        >

          {/* Logo */}

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "12px",
                background: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: 700,
              }}
            >
              T
            </div>

            <div>
              <div style={{ fontSize: "18px", fontWeight: 700 }}>
                TicketDesk
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#93c5fd",
                  marginTop: "2px",
                }}
              >
                AI Support Platform
              </div>
            </div>

          </div>


          {/* Main content */}

          <div style={{ maxWidth: "520px" }}>

            <div
              style={{
                color: "#60a5fa",
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "1px",
                marginBottom: "18px",
              }}
            >
              INTELLIGENT SUPPORT MANAGEMENT
            </div>

            <h1
              style={{
                fontSize: "48px",
                lineHeight: "1.1",
                fontWeight: 700,
                margin: 0,
              }}
            >
              Resolve issues faster.
              <br />

              <span style={{ color: "#60a5fa" }}>
                Support smarter.
              </span>
            </h1>

            <p
              style={{
                color: "#94a3b8",
                fontSize: "16px",
                lineHeight: "1.8",
                marginTop: "24px",
              }}
            >
              Manage support tickets, collaborate with your
              team and use AI-powered assistance to resolve
              customer issues efficiently.
            </p>


            {/* Features */}

            <div style={{ marginTop: "35px" }}>

              <Feature
                title="AI-powered support"
                description="Get intelligent assistance throughout your workflow."
              />

              <Feature
                title="Smart ticket management"
                description="Organize and prioritize support requests easily."
              />

              <Feature
                title="Secure workspace"
                description="Keep your company's support operations organized."
              />

            </div>

          </div>


          <div
            style={{
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            © 2026 TicketDesk AI
          </div>

        </section>


        {/* RIGHT SIDE */}

        <section
          style={{
            width: "50%",
            minHeight: "100vh",
            background: "#eef2f7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
          }}
        >

          <div style={{ width: "100%", maxWidth: "440px" }}>

            {/* Login Card */}

            <div
              style={{
                background: "#ffffff",
                borderRadius: "24px",
                padding: "40px",
                boxShadow: "0 25px 60px rgba(15, 23, 42, 0.12)",
                border: "1px solid #e2e8f0",
              }}
            >

              <div
                style={{
                  color: "#2563eb",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Welcome back
              </div>

              <h2
                style={{
                  color: "#0f172a",
                  fontSize: "30px",
                  marginTop: "8px",
                  marginBottom: "10px",
                  fontWeight: 700,
                }}
              >
                Sign in to TicketDesk
              </h2>

              <p
                style={{
                  color: "#64748b",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  marginBottom: "30px",
                }}
              >
                Enter your credentials to access your support workspace.
              </p>


              {/* EMAIL */}

              <label
                style={{
                  display: "block",
                  color: "#334155",
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                Work email
              </label>

              <input
                type="email"
                placeholder="name@company.com"
                value={email}
onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  height: "48px",
                  boxSizing: "border-box",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  padding: "0 15px",
                  fontSize: "14px",
                  color: "#0f172a",
                  outline: "none",
                }}
              />


              {/* PASSWORD */}

              <div style={{ marginTop: "20px" }}>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >

                  <label
                    style={{
                      color: "#334155",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#2563eb",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Forgot password?
                  </button>

                </div>


                {/* Password input + professional eye */}

                <div style={{ position: "relative" }}>

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: "100%",
                      height: "48px",
                      boxSizing: "border-box",
                      borderRadius: "12px",
                      border: "1px solid #cbd5e1",
                      background: "#f8fafc",
                      padding: "0 50px 0 15px",
                      fontSize: "14px",
                      color: "#0f172a",
                      outline: "none",
                    }}
                  />


                  {/* PROFESSIONAL EYE BUTTON */}

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "34px",
                      height: "34px",
                      borderRadius: "8px",
                      border: "none",
                      background: "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "#64748b",
                    }}
                  >
                    {showPassword ? (
                      <EyeOffIcon />
                    ) : (
                      <EyeIcon />
                    )}
                  </button>

                </div>

              </div>


              {/* Remember */}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "18px",
                }}
              >

                <input
                  type="checkbox"
                  style={{
                    width: "16px",
                    height: "16px",
                    accentColor: "#2563eb",
                  }}
                />

                <span
                  style={{
                    color: "#64748b",
                    fontSize: "13px",
                  }}
                >
                  Keep me signed in
                </span>

              </div>
              {message && (
  <div
    style={{
      marginTop: "18px",
      padding: "12px 14px",
      borderRadius: "10px",
      background:
        messageType === "success" ? "#ecfdf5" : "#fef2f2",
      border:
        messageType === "success"
          ? "1px solid #a7f3d0"
          : "1px solid #fecaca",
      color:
        messageType === "success" ? "#047857" : "#b91c1c",
      fontSize: "13px",
      fontWeight: 500,
    }}
  >
    {message}
  </div>
)}


              {/* SIGN IN */}

              <button
  type="button"
  onClick={handleLogin}
  disabled={loading}
  style={{
    width: "100%",
    height: "48px",
    marginTop: "24px",
    borderRadius: "12px",
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)",
    opacity: loading ? 0.7 : 1,
  }}
>
  {loading ? "Signing in..." : "Sign in"}
</button>


              {/* Divider */}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  margin: "28px 0",
                }}
              >

                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: "#e2e8f0",
                  }}
                />

                <span
                  style={{
                    color: "#94a3b8",
                    fontSize: "10px",
                    fontWeight: 600,
                  }}
                >
                  NEW TO TICKETDESK?
                </span>

                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: "#e2e8f0",
                  }}
                />

              </div>


              {/* Create account */}

              <button
  type="button"
  onClick={() => router.push("/signup")}
  style={{
    width: "100%",
    height: "44px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#334155",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  }}
>
  Create company account
</button>
              

            </div>


            <p
              style={{
                textAlign: "center",
                color: "#94a3b8",
                fontSize: "12px",
                marginTop: "18px",
              }}
            >
              Secure workspace for modern support teams.
            </p>

          </div>

        </section>

      </div>
    </main>
  );
}


/* FEATURE */

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: "#60a5fa",
          marginTop: "7px",
          flexShrink: 0,
        }}
      />

      <div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#f8fafc",
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: "12px",
            color: "#64748b",
            marginTop: "4px",
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
}


/* EYE ICON */

function EyeIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}


/* EYE OFF ICON */

function EyeOffIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5" />
      <path d="M6.7 6.7C4.2 8.2 2.5 12 2.5 12s3.5 6 9.5 6c1.8 0 3.4-.4 4.8-1" />
      <path d="M9.5 4.4A10.5 10.5 0 0 1 12 4c6 0 9.5 6 9.5 6s-.8 1.5-2.1 2.9" />
    </svg>
  );
}