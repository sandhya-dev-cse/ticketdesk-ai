"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!companyName.trim()) {
      setError("Please enter your company name.");
      return;
    }

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your work email.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            company_name: companyName.trim(),
            full_name: fullName.trim(),
            email: email.trim(),
            password: password,
          }),
        }
      );

      let data: any = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to create company account."
        );
      }

      setSuccess(
        data.message || "Company account created successfully."
      );

      setCompanyName("");
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      console.log("Registration successful:", data);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">

        {/* =====================================================
            LEFT BLUE BRAND PANEL
        ===================================================== */}

        <section className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:w-[46%]">

          {/* Decorative blue glow */}

          <div className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-blue-600/30 blur-3xl" />

          <div className="absolute -bottom-48 -right-40 h-[32rem] w-[32rem] rounded-full bg-indigo-600/25 blur-3xl" />

          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">

            {/* BRAND */}

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-600/30">

                <svg
                  width="23"
                  height="23"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M4 7.5C4 6.12 5.12 5 6.5 5H17.5C18.88 5 20 6.12 20 7.5V16.5C20 17.88 18.88 19 17.5 19H6.5C5.12 19 4 17.88 4 16.5V7.5Z"
                    stroke="white"
                    strokeWidth="1.8"
                  />

                  <path
                    d="M8 9H16M8 12H14M8 15H12"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>

              </div>

              <div>
                <p className="text-lg font-bold tracking-tight text-white">
                  TicketDesk
                </p>

                <p className="text-xs text-slate-400">
                  AI Support Platform
                </p>
              </div>

            </div>

            {/* MAIN BRAND CONTENT */}

            <div className="max-w-xl">

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2">

                <span className="h-2 w-2 rounded-full bg-blue-400" />

                <span className="text-xs font-semibold text-blue-300">
                  BUILD YOUR SUPPORT WORKSPACE
                </span>

              </div>

              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">

                A smarter way
                <br />

                <span className="text-blue-400">
                  to manage support.
                </span>

              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
                Create your company workspace and bring your support
                operations together in one intelligent platform.
              </p>

              {/* STEPS */}

              <div className="mt-10 space-y-4">

                <Step
                  number="01"
                  title="Create your workspace"
                  description="Set up your company and owner account."
                  active
                />

                <Step
                  number="02"
                  title="Build your support team"
                  description="Invite teammates and assign responsibilities."
                />

                <Step
                  number="03"
                  title="Resolve tickets faster"
                  description="Use intelligent tools to streamline support."
                />

              </div>

            </div>

            {/* FOOTER */}

            <div className="flex items-center justify-between">

              <p className="text-xs text-slate-600">
                © 2026 TicketDesk AI
              </p>

              <p className="text-xs text-slate-600">
                Secure workspace
              </p>

            </div>

          </div>

        </section>

        {/* =====================================================
            RIGHT SIGNUP AREA
        ===================================================== */}

        <section className="flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:w-[54%]">

          <div className="w-full max-w-xl">

            {/* MOBILE BRAND */}

            <div className="mb-8 flex items-center gap-3 lg:hidden">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">

                <span className="text-lg font-bold text-white">
                  T
                </span>

              </div>

              <div>
                <p className="font-bold text-slate-900">
                  TicketDesk
                </p>

                <p className="text-xs text-slate-500">
                  AI Support Platform
                </p>
              </div>

            </div>

            {/* HEADER */}

            <div className="mb-8">

              <div className="mb-3 flex items-center gap-2">

                <span className="h-2 w-2 rounded-full bg-blue-600" />

                <p className="text-sm font-semibold text-blue-600">
                  Get started
                </p>

              </div>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Create your company account
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">
                Create your workspace and become the Owner.
                You can invite your support team after setup.
              </p>

            </div>

            {/* FORM CARD */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* COMPANY */}

                <InputField
                  label="Company name"
                  value={companyName}
                  onChange={setCompanyName}
                  placeholder="Acme Corporation"
                />

                {/* FULL NAME */}

                <InputField
                  label="Full name"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Your full name"
                />

                {/* EMAIL */}

                <InputField
                  label="Work email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@company.com"
                  type="email"
                />

                {/* PASSWORD */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Password
                  </label>

                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    show={showPassword}
                    onToggle={() =>
                      setShowPassword(!showPassword)
                    }
                    placeholder="Create a password"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    Use at least 8 characters.
                  </p>

                </div>

                {/* CONFIRM PASSWORD */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Confirm password
                  </label>

                  <PasswordInput
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    show={showConfirmPassword}
                    onToggle={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    placeholder="Re-enter your password"
                  />

                </div>

                {/* SUCCESS MESSAGE */}

                {success && (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">

                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600">
                      ✓
                    </div>

                    <p className="text-sm font-medium text-emerald-600">
                      {success}
                    </p>

                  </div>
                )}

                {/* ERROR MESSAGE */}

                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                      !
                    </div>

                    <p className="text-sm font-medium text-red-600">
                      {error}
                    </p>

                  </div>
                )}

                {/* TERMS */}

                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">

                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600">

                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M5 12L9 16L19 6"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                  </div>

                  <p className="text-xs leading-5 text-slate-500">
                    By creating an account, you agree to use
                    TicketDesk responsibly within your organization.
                  </p>

                </div>

                {/* CREATE ACCOUNT BUTTON */}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-blue-600/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loading
                    ? "Creating account..."
                    : "Create company account"}

                  {!loading && (
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="transition-transform group-hover:translate-x-1"
                    >
                      <path
                        d="M5 12H19M13 6L19 12L13 18"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}

                </button>

              </form>

            </div>

            {/* LOGIN */}

            <p className="mt-7 text-center text-sm text-slate-500">

              Already have an account?{" "}

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="font-semibold text-blue-600 transition hover:text-blue-700"
              >
                Sign in
              </button>

            </p>

            {/* SECURITY */}

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">

              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 3L19 6V11C19 16 16 19 12 21C8 19 5 16 5 11V6L12 3Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />

                <path
                  d="M9 12L11 14L15 10"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

              </svg>

              Secure company workspace

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}


/* =========================================================
   INPUT FIELD
========================================================= */

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        required
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
      />

    </div>
  );
}


/* =========================================================
   PASSWORD INPUT
========================================================= */

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
}) {
  return (
    <div className="relative">

      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        required
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 pr-12 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
      />

      <button
        type="button"
        onClick={onToggle}
        aria-label={
          show ? "Hide password" : "Show password"
        }
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>

    </div>
  );
}


/* =========================================================
   EYE ICON
========================================================= */

function EyeIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M3 12C4.5 8.5 7.7 6 12 6C16.3 6 19.5 8.5 21 12C19.5 15.5 16.3 18 12 18C7.7 18 4.5 15.5 3 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="12"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}


/* =========================================================
   EYE OFF ICON
========================================================= */

function EyeOffIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M3 3L21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M10.6 10.6C10.2 11 10 11.5 10 12C10 13.1 10.9 14 12 14C12.5 14 13 13.8 13.4 13.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M9.9 4.3C10.6 4.1 11.3 4 12 4C17 4 20.5 8 21 12C20.8 13.5 20.1 15 19.1 16.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M6.2 6.2C4.4 7.6 3.3 9.5 3 12C3.5 16 7 20 12 20C13.8 20 15.4 19.5 16.8 18.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}


/* =========================================================
   SIGNUP STEP
========================================================= */

function Step({
  number,
  title,
  description,
  active = false,
}: {
  number: string;
  title: string;
  description: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${
          active
            ? "border-blue-400/30 bg-blue-500/10 text-blue-400"
            : "border-white/10 bg-white/5 text-slate-500"
        }`}
      >
        {number}
      </div>

      <div>

        <p className="text-sm font-semibold text-white">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>

      </div>

    </div>
  );
}