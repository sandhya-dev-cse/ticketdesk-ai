"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type User = {
  full_name: string;
  email: string;
  role: string;
};

type Ticket = {
  _id: string;
  title: string;
  status: string;
  priority: string;
  category?: string;
  created_at?: string;
};

export default function HomeDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.push("/login");
        return;
      }

      const userResponse = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        localStorage.removeItem("access_token");
        router.push("/login");
        return;
      }

      const userData = await userResponse.json();
      setUser(userData.user);

      const ticketResponse = await fetch(`${API_URL}/tickets/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (ticketResponse.ok) {
        const ticketData = await ticketResponse.json();

        setTickets(
          Array.isArray(ticketData)
            ? ticketData
            : ticketData.tickets || []
        );
      }
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  const openTickets = tickets.filter(
    (ticket) => ticket.status !== "closed"
  ).length;

  const resolvedTickets = tickets.filter(
    (ticket) =>
      ticket.status === "resolved" ||
      ticket.status === "closed"
  ).length;

  const highPriorityTickets = tickets.filter(
    (ticket) =>
      ticket.priority === "high" ||
      ticket.priority === "critical"
  ).length;

  const role = user?.role?.trim().toLowerCase();

  const canManageTeam =
    role === "owner" || role === "manager";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>

          <p className="mt-4 text-slate-600 font-medium">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">

        {/* Logo */}
        <div className="px-6 py-6 border-b border-slate-200">
          <div className="flex items-center gap-3">

            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
              T
            </div>

            <div>
              <h1 className="font-bold text-slate-900 text-lg">
                TicketDesk
              </h1>

              <p className="text-xs text-slate-500">
                AI Support System
              </p>
            </div>

          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">

          {/* Dashboard */}
          <button
            onClick={() => router.push("/dashboard/home")}
            className="w-full flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-left text-sm font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:bg-blue-100 hover:shadow-md"
          >
            <span className="text-lg">⌂</span>
            Dashboard
          </button>

          {/* Tickets */}
          <button
            onClick={() => router.push("/dashboard/tickets")}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm"
          >
            <span className="text-lg">▣</span>
            Tickets
          </button>

          {/* Team */}
          {canManageTeam && (
            <button
              onClick={() => {
                console.log("TEAM CLICKED");
                router.push("/dashboard/team");
              }}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm"
            >
              <span className="text-lg">♟</span>
              Team
            </button>
          )}

        </nav>

        {/* User section */}
        <div className="border-t border-slate-200 p-4">

          <div className="mb-4 px-3">

            <p className="font-semibold text-slate-800 truncate">
              {user?.full_name}
            </p>

            <p className="text-xs text-slate-500 truncate mt-1">
              {user?.email}
            </p>

            <span className="inline-flex items-center mt-2 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold capitalize">
              {user?.role}
            </span>

          </div>

          <button
            onClick={logout}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md"
          >
            Logout
          </button>

        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0">

        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-6">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">
                Overview
              </p>

              <h2 className="text-2xl font-bold text-slate-900">
                Dashboard
              </h2>

              <p className="text-slate-500 mt-1">
                Welcome back, {user?.full_name}
              </p>
            </div>

            <button
              onClick={() =>
                router.push("/dashboard/tickets/new")
              }
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30 active:translate-y-0"
            >
              <span className="text-lg">+</span>
              Create Ticket
            </button>

          </div>

        </header>

        {/* Dashboard Content */}
        <div className="p-8">

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

            {/* Total */}
            <div className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total Tickets
                  </p>

                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {tickets.length}
                  </p>
                </div>

                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl">
                  ▣
                </div>

              </div>

            </div>

            {/* Open */}
            <div className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Open Tickets
                  </p>

                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {openTickets}
                  </p>
                </div>

                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl">
                  ◉
                </div>

              </div>

            </div>

            {/* Resolved */}
            <div className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-green-200 hover:shadow-lg">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Resolved
                  </p>

                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {resolvedTickets}
                  </p>
                </div>

                <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center text-green-600 text-xl">
                  ✓
                </div>

              </div>

            </div>

            {/* High Priority */}
            <div className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    High Priority
                  </p>

                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {highPriorityTickets}
                  </p>
                </div>

                <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-red-600 text-xl">
                  !
                </div>

              </div>

            </div>

          </div>

          {/* QUICK ACTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">

            {/* View Tickets */}
            <button
              onClick={() =>
                router.push("/dashboard/tickets")
              }
              className="group bg-white border border-slate-200 rounded-2xl p-6 text-left hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600 transition group-hover:bg-blue-100">
                ▣
              </div>

              <h3 className="font-bold text-slate-900">
                View Tickets
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                View and manage support tickets.
              </p>

              <div className="mt-4 text-sm font-semibold text-blue-600">
                View tickets →
              </div>
            </button>

            {/* Manage Team */}
            {canManageTeam && (
              <button
                onClick={() =>
                  router.push("/dashboard/team")
                }
                className="group bg-white border border-slate-200 rounded-2xl p-6 text-left hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-600 transition group-hover:bg-indigo-100">
                  ♟
                </div>

                <h3 className="font-bold text-slate-900">
                  Manage Team
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  View team members and manage roles.
                </p>

                <div className="mt-4 text-sm font-semibold text-indigo-600">
                  Manage team →
                </div>
              </button>
            )}

            {/* Create New Ticket */}
            <button
              onClick={() =>
                router.push("/dashboard/tickets/new")
              }
              className="group rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-left text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/30"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-2xl backdrop-blur-sm">
                ＋
              </div>

              <h3 className="font-bold">
                Create New Ticket
              </h3>

              <p className="mt-1 text-sm text-blue-100">
                Report a new support issue.
              </p>

              <div className="mt-4 text-sm font-semibold text-white">
                Create ticket →
              </div>
            </button>

          </div>

          {/* RECENT TICKETS */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">

              <div>
                <h3 className="font-bold text-slate-900">
                  Recent Tickets
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  Latest support requests
                </p>
              </div>

              <button
                onClick={() =>
                  router.push("/dashboard/tickets")
                }
                className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
              >
                View all →
              </button>

            </div>

            {/* Empty State */}
            {tickets.length === 0 ? (

              <div className="p-12 text-center">

                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-500">
                  ▣
                </div>

                <p className="font-semibold text-slate-700">
                  No tickets yet
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  Create your first support ticket to get started.
                </p>

                <button
                  onClick={() =>
                    router.push("/dashboard/tickets/new")
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"
                >
                  Create your first ticket
                  <span>→</span>
                </button>

              </div>

            ) : (

              <div className="divide-y divide-slate-100">

                {tickets.slice(0, 5).map((ticket, index) => (

                  <div
                    key={ticket._id || `ticket-${index}`}
                    onClick={() =>
                      router.push(
                        `/dashboard/tickets/${ticket._id}`
                      )
                    }
                    className="px-6 py-5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors duration-150"
                  >

                    <div className="min-w-0">

                      <p className="font-semibold text-slate-800 truncate">
                        {ticket.title}
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        {ticket.category || "General"}
                      </p>

                    </div>

                    <div className="flex items-center gap-3 ml-4">

                      <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold capitalize">
                        {ticket.status.replace("_", " ")}
                      </span>

                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
                          ticket.priority === "critical"
                            ? "bg-red-100 text-red-700"
                            : ticket.priority === "high"
                            ? "bg-orange-100 text-orange-700"
                            : ticket.priority === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {ticket.priority}
                      </span>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

        </div>

      </main>

    </div>
  );
}