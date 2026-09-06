"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type InviteInfo = {
  email: string;
  role: string;
};

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();

  const token = params?.token as string;

  const [invite, setInvite] = useState<InviteInfo | null>(null);

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) return;

    const loadInvite = async () => {
      try {
        const response = await fetch(`${API_URL}/invites/${token}`);

        const data = await response.json();

        if (!response.ok) {
          setError(data.detail || "This invitation is invalid or expired.");
          return;
        }

        setInvite(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load invitation.");
      } finally {
        setLoading(false);
      }
    };

    loadInvite();
  }, [token]);

  const handleAcceptInvite = async (e: FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/invites/${token}/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: fullName.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Unable to create your account.");
        return;
      }

      setSuccess(
        "Account created successfully! Redirecting to login..."
      );

      setTimeout(() => {
        router.push("/login");
      }, 1800);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-slate-600 font-medium">
            Loading invitation...
          </p>
        </div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">

        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">

          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 flex items-center justify-center text-red-600 text-2xl">
            !
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mt-5">
            Invitation unavailable
          </h1>

          <p className="text-slate-500 mt-2">
            {error}
          </p>

          <button
            onClick={() => router.push("/login")}
            className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            Go to Login
          </button>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-md">

        {/* BRAND */}
        <div className="text-center mb-7">

          <div className="w-14 h-14 mx-auto bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            T
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mt-4">
            TicketDesk
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            AI Support System
          </p>

        </div>

        {/* CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">

          {/* HEADER */}
          <div className="px-7 py-6 border-b border-slate-200">

            <h2 className="text-xl font-bold text-slate-900">
              Join your company
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              You've been invited to join TicketDesk.
            </p>

          </div>

          {/* BODY */}
          <div className="p-7">

            {/* INVITE DETAILS */}
            {invite && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">

                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                  Invitation
                </p>

                <p className="text-sm text-slate-700 mt-2">
                  <span className="font-semibold">
                    Email:
                  </span>{" "}
                  {invite.email}
                </p>

                <p className="text-sm text-slate-700 mt-1">
                  <span className="font-semibold">
                    Role:
                  </span>{" "}
                  <span className="capitalize">
                    {invite.role}
                  </span>
                </p>

              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm">
                ✓ {success}
              </div>
            )}

            {/* ERROR */}
            {error && invite && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <form
              onSubmit={handleAcceptInvite}
              className="space-y-5"
            >

              {/* FULL NAME */}
              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Full Name
                </label>

                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled={creating || !!success}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />

              </div>

              {/* EMAIL */}
              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email
                </label>

                <input
                  type="email"
                  value={invite?.email || ""}
                  readOnly
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-600 outline-none"
                />

              </div>

              {/* PASSWORD */}
              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Create Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  disabled={creating || !!success}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />

                <p className="text-xs text-slate-400 mt-2">
                  Minimum 6 characters.
                </p>

              </div>

              {/* BUTTON */}
              <button
                type="submit"
                disabled={creating || !!success}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating
                  ? "Creating Account..."
                  : "Accept Invitation"}
              </button>

            </form>

            {/* LOGIN */}
            <div className="text-center mt-6">

              <button
                onClick={() => router.push("/login")}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Already have an account? Login
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}