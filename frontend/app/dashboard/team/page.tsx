"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type Member = {
  _id?: string;
  id?: string;
  user_id?: string;
  full_name: string;
  email: string;
  role: string;
};

export default function TeamPage() {
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");
  const [inviteLoading, setInviteLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${API_URL}/team/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("access_token");
          router.push("/login");
          return;
        }

        throw new Error("Unable to load team.");
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setMembers(data);
      } else if (Array.isArray(data.members)) {
        setMembers(data.members);
      } else if (Array.isArray(data.users)) {
        setMembers(data.users);
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load team members.");
    } finally {
      setLoading(false);
    }
  };

  const openInviteModal = () => {
    setShowInvite(true);
    setMessage("");
    setInviteLink("");
  };

  const closeInviteModal = () => {
    setShowInvite(false);
    setMessage("");
    setInviteLink("");
    setInviteEmail("");
    setInviteRole("employee");
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim()) {
      setMessage("Please enter an email address.");
      return;
    }

    try {
      setInviteLoading(true);
      setMessage("");
      setInviteLink("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${API_URL}/invites/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Failed to send invitation.");
        return;
      }

      setMessage("Invitation created successfully!");
      setInviteLink(data.invite_link || "");

      setInviteEmail("");
      setInviteRole("employee");

      await loadTeam();
    } catch (err) {
      console.error(err);
      setMessage("Unable to send invitation.");
    } finally {
      setInviteLoading(false);
    }
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setMessage("Invite link copied successfully!");
    } catch (err) {
      console.error(err);
      setMessage("Unable to copy invite link.");
    }
  };

  const openInviteLink = () => {
    if (!inviteLink) return;

    window.open(inviteLink, "_blank", "noopener,noreferrer");
  };

  const getRoleStyle = (role: string) => {
    switch (role.toLowerCase()) {
      case "owner":
        return "bg-purple-50 text-purple-700 border-purple-200";

      case "manager":
        return "bg-blue-50 text-blue-700 border-blue-200";

      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">

        {/* LOGO */}
        <div className="px-6 py-6 border-b border-slate-200">
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
              T
            </div>

            <div>
              <h1 className="font-bold text-slate-900">
                TicketDesk
              </h1>

              <p className="text-xs text-slate-500">
                AI Support System
              </p>
            </div>

          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 py-6 space-y-2">

          {/* DASHBOARD */}
          <button
            onClick={() => router.push("/dashboard/home")}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm hover:-translate-y-0.5"
          >
            <span className="text-lg">⌂</span>
            <span>Dashboard</span>
          </button>

          {/* TICKETS */}
          <button
            onClick={() => router.push("/dashboard/tickets")}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm hover:-translate-y-0.5"
          >
            <span className="text-lg">▣</span>
            <span>Tickets</span>
          </button>

          {/* TEAM */}
          <button
            onClick={() => router.push("/dashboard/team")}
            className="w-full flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 text-left text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-100 transition-all duration-200 hover:from-blue-100 hover:to-indigo-100 hover:shadow-md"
          >
            <span className="text-lg">♟</span>
            <span>Team</span>

            <span className="ml-auto w-2 h-2 rounded-full bg-blue-600"></span>
          </button>

        </nav>

        {/* LOGOUT */}
        <div className="border-t border-slate-200 p-4">

          <button
            onClick={() => {
              localStorage.removeItem("access_token");
              router.push("/login");
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-sm"
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* MAIN */}
      <main className="flex-1">

        {/* HEADER */}
        <header className="bg-white border-b border-slate-200 px-8 py-6">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Team
              </h2>

              <p className="text-slate-500 mt-1">
                Manage your company members and roles.
              </p>
            </div>

            {/* INVITE BUTTON */}
            <button
              onClick={openInviteModal}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg active:translate-y-0"
            >
              <span className="text-lg leading-none">+</span>
              Invite Member
            </button>

          </div>

        </header>

        {/* CONTENT */}
        <div className="p-8">

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

            {/* TOTAL */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">

              <p className="text-sm font-medium text-slate-500">
                Total Members
              </p>

              <p className="text-3xl font-bold text-slate-900 mt-2">
                {members.length}
              </p>

            </div>

            {/* MANAGERS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">

              <p className="text-sm font-medium text-slate-500">
                Managers
              </p>

              <p className="text-3xl font-bold text-blue-600 mt-2">
                {members.filter(
                  (member) =>
                    member.role.toLowerCase() === "manager"
                ).length}
              </p>

            </div>

            {/* EMPLOYEES */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">

              <p className="text-sm font-medium text-slate-500">
                Employees
              </p>

              <p className="text-3xl font-bold text-slate-700 mt-2">
                {members.filter(
                  (member) =>
                    member.role.toLowerCase() === "employee"
                ).length}
              </p>

            </div>

          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl shadow-sm">
              <span className="text-lg">!</span>
              <span>{error}</span>
            </div>
          )}

          {/* TEAM TABLE */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

            {/* TABLE HEADER */}
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">

              <h3 className="font-bold text-slate-900">
                Team Members
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                People who have access to your company workspace.
              </p>

            </div>

            {/* LOADING */}
            {loading ? (

              <div className="p-12 text-center">

                <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>

                <p className="mt-4 text-slate-500">
                  Loading team...
                </p>

              </div>

            ) : members.length === 0 ? (

              /* EMPTY */
              <div className="p-12 text-center">

                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center text-2xl mb-4">
                  👥
                </div>

                <p className="font-semibold text-slate-800">
                  No team members found
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  Invite someone to your company.
                </p>

                <button
                  onClick={openInviteModal}
                  className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-md"
                >
                  + Invite Member
                </button>

              </div>

            ) : (

              /* MEMBERS */
              <div className="divide-y divide-slate-100">

                {members.map((member, index) => (

                  <div
                    key={
                      member._id ||
                      member.id ||
                      member.user_id ||
                      index
                    }
                    className="px-6 py-5 flex items-center justify-between transition-all duration-200 hover:bg-blue-50/40"
                  >

                    <div className="flex items-center gap-4">

                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 flex items-center justify-center font-bold ring-4 ring-blue-50">
                        {member.full_name?.charAt(0)?.toUpperCase() || "U"}
                      </div>

                      <div>

                        <p className="font-semibold text-slate-900">
                          {member.full_name}
                        </p>

                        <p className="text-sm text-slate-500">
                          {member.email}
                        </p>

                      </div>

                    </div>

                    <span
                      className={`px-3 py-1.5 rounded-full border text-xs font-semibold capitalize ${getRoleStyle(
                        member.role
                      )}`}
                    >
                      {member.role}
                    </span>

                  </div>

                ))}

              </div>

            )}

          </div>

        </div>

      </main>

      {/* INVITE MODAL */}
      {showInvite && (

        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            {/* MODAL HEADER */}
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">

              <div>

                <h3 className="text-lg font-bold text-slate-900">
                  Invite Team Member
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  Add someone to your company.
                </p>

              </div>

              <button
                onClick={closeInviteModal}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-xl text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                ×
              </button>

            </div>

            {/* MODAL BODY */}
            <div className="p-6 space-y-5">

              {/* EMAIL */}
              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
                </label>

                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="manager@example.com"
                  disabled={inviteLoading}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />

              </div>

              {/* ROLE */}
              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Role
                </label>

                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  disabled={inviteLoading}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                >

                  <option value="employee">
                    Employee
                  </option>

                  <option value="manager">
                    Manager
                  </option>

                </select>

              </div>

              {/* MESSAGE */}
              {message && (
                <div
                  className={`px-4 py-3 rounded-xl text-sm border ${
                    inviteLink
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-blue-50 border-blue-200 text-blue-700"
                  }`}
                >

                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>{message}</span>
                  </div>

                </div>
              )}

              {/* INVITE LINK */}
              {inviteLink && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">

                  <p className="text-sm font-semibold text-slate-800 mb-2">
                    Manager Invite Link
                  </p>

                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-600 outline-none"
                  />

                  <div className="grid grid-cols-2 gap-2 mt-3">

                    <button
                      type="button"
                      onClick={copyInviteLink}
                      className="rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                    >
                      Copy Link
                    </button>

                    <button
                      type="button"
                      onClick={openInviteLink}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                    >
                      Open Link
                    </button>

                  </div>

                  <p className="text-xs text-slate-500 mt-3">
                    Open this link to create the invited user's account.
                  </p>

                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 pt-2">

                <button
                  onClick={closeInviteModal}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 hover:shadow-sm"
                >
                  {inviteLink ? "Done" : "Cancel"}
                </button>

                {!inviteLink && (
                  <button
                    onClick={sendInvite}
                    disabled={inviteLoading}
                    className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {inviteLoading ? "Sending..." : "Send Invite"}
                  </button>
                )}

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}