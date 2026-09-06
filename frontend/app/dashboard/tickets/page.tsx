"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type Ticket = {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category?: string | null;
  created_at?: string;
};

type CurrentUser = {
  user_id: string;
  role: string;
};

export default function TicketsPage() {
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [prioritizing, setPrioritizing] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // =========================================================
  // LOAD PAGE
  // =========================================================

  useEffect(() => {
    loadPage();
  }, []);

  // =========================================================
  // LOAD USER + TICKETS
  // =========================================================

  const loadPage = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // -------------------------------------------------------
      // GET CURRENT USER
      // -------------------------------------------------------

      const userResponse = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = await userResponse.json();

      if (!userResponse.ok) {
        throw new Error(
          userData.detail || "Unable to identify current user."
        );
      }

      const currentUser = userData.user || userData;

      setUser({
        user_id: currentUser.user_id,
        role: (currentUser.role || "").toLowerCase(),
      });

      // -------------------------------------------------------
      // GET TICKETS
      // -------------------------------------------------------

      const ticketResponse = await fetch(`${API_URL}/tickets/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const ticketData = await ticketResponse.json();

      if (!ticketResponse.ok) {
        throw new Error(
          ticketData.detail || "Unable to load tickets."
        );
      }

      // -------------------------------------------------------
      // NORMALIZE TICKET DATA
      // -------------------------------------------------------

      const receivedTickets = Array.isArray(ticketData.tickets)
        ? ticketData.tickets
        : [];

      const normalizedTickets: Ticket[] = receivedTickets
        .filter((ticket: any) => ticket && ticket.id)
        .map((ticket: any) => ({
          id: String(ticket.id),
          title: ticket.title || "Untitled Ticket",
          description: ticket.description || "",
          priority: ticket.priority || "medium",
          status: ticket.status || "open",
          category: ticket.category || null,
          created_at: ticket.created_at,
        }));

      setTickets(normalizedTickets);

      console.log(
        "Tickets received from backend:",
        normalizedTickets
      );
    } catch (err) {
      console.error("Unable to load tickets:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // OPEN TICKET
  // =========================================================

  const openTicket = (ticketId: string) => {
    if (!ticketId || ticketId.trim() === "") {
      setError("Unable to open this ticket because its ID is missing.");
      return;
    }

    console.log("Opening ticket:", ticketId);

    router.push(`/dashboard/tickets/${ticketId}`);
  };

  // =========================================================
  // AI PRIORITIZE
  // =========================================================

  const prioritizeTickets = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setPrioritizing(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/tickets/prioritize`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "AI prioritization failed."
        );
      }

      setMessage(
        data.tickets?.length
          ? `AI prioritized ${data.tickets.length} open ticket${
              data.tickets.length === 1 ? "" : "s"
            } successfully.`
          : data.message || "No open tickets available."
      );

      await loadPage();
    } catch (err) {
      console.error("AI prioritization error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "AI prioritization failed."
      );
    } finally {
      setPrioritizing(false);
    }
  };

  // =========================================================
  // PRIORITY STYLE
  // =========================================================

  const getPriorityStyle = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return "bg-red-50 text-red-700 border-red-200";

      case "high":
        return "bg-orange-50 text-orange-700 border-orange-200";

      case "medium":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "low":
        return "bg-slate-50 text-slate-600 border-slate-200";

      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  // =========================================================
  // STATUS STYLE
  // =========================================================

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "triaged":
        return "bg-purple-50 text-purple-700 border-purple-200";

      case "in_progress":
        return "bg-amber-50 text-amber-700 border-amber-200";

      case "resolved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "closed":
        return "bg-slate-100 text-slate-600 border-slate-200";

      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  // =========================================================
  // FORMAT STATUS
  // =========================================================

  const formatStatus = (status: string) => {
    return status
      ?.replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const isManagerOrOwner =
    user?.role === "manager" ||
    user?.role === "owner";

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">

        <div>
          <p className="text-lg font-bold text-slate-900">
            TicketDesk
          </p>

          <p className="text-xs text-slate-500">
            AI Support Platform
          </p>
        </div>

        <button
          onClick={() => router.push("/dashboard/home")}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          Dashboard
        </button>

      </header>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8">

        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <div className="mb-3 flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-blue-600" />

              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Support Workspace
              </p>

            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Tickets
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              View and manage your support requests.
            </p>

          </div>

          {/* =================================================
              ACTION BUTTONS
          ================================================= */}

          <div className="flex flex-wrap gap-3">

            {/* AI PRIORITIZE */}

            {isManagerOrOwner && (
              <button
                onClick={prioritizeTickets}
                disabled={prioritizing}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >

                <span className="text-base">
                  ✨
                </span>

                {prioritizing
                  ? "AI Prioritizing..."
                  : "Prioritize Open Tickets"}

              </button>
            )}

            {/* CREATE TICKET */}

            <button
              onClick={() =>
                router.push("/dashboard/tickets/new")
              }
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 active:translate-y-0"
            >

              <span className="text-lg">
                +
              </span>

              Create Ticket

            </button>

          </div>

        </div>

        {/* ===================================================
            SUCCESS MESSAGE
        =================================================== */}

        {message && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">

            <div>

              <p className="text-sm font-semibold text-emerald-700">
                Success
              </p>

              <p className="mt-1 text-xs text-emerald-600">
                {message}
              </p>

            </div>

            <button
              onClick={() => setMessage("")}
              className="text-sm font-bold text-emerald-600 hover:text-emerald-800"
            >
              ×
            </button>

          </div>
        )}

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-5 py-4">

            <div>

              <p className="text-sm font-semibold text-red-700">
                Unable to load tickets
              </p>

              <p className="mt-1 text-xs text-red-600">
                {error}
              </p>

            </div>

            <button
              onClick={loadPage}
              className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-100"
            >
              Retry
            </button>

          </div>
        )}

        {/* ===================================================
            LOADING
        =================================================== */}

        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading tickets...
            </p>

          </div>
        )}

        {/* ===================================================
            EMPTY STATE
        =================================================== */}

        {!loading &&
          !error &&
          tickets.length === 0 && (

            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                🎫
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-900">
                No tickets yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create your first support ticket and start
                tracking issues with your team.
              </p>

              <button
                onClick={() =>
                  router.push(
                    "/dashboard/tickets/new"
                  )
                }
                className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-blue-600/30 active:scale-[0.98]"
              >
                Create Your First Ticket
              </button>

            </div>
          )}

        {/* ===================================================
            TICKETS
        =================================================== */}

        {!loading &&
          tickets.length > 0 && (

            <div className="space-y-4">

              {tickets.map((ticket) => (

                <div
                  key={ticket.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >

                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                    {/* LEFT */}

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-2">

                        {/* ID */}

                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                          #{ticket.id.slice(-6)}
                        </span>

                        {/* STATUS */}

                        <span
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${getStatusStyle(
                            ticket.status
                          )}`}
                        >
                          {formatStatus(ticket.status)}
                        </span>

                        {/* PRIORITY */}

                        <span
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${getPriorityStyle(
                            ticket.priority
                          )}`}
                        >
                          {ticket.priority?.toUpperCase()}
                        </span>

                      </div>

                      {/* TITLE */}

                      <h2 className="mt-3 truncate text-lg font-bold text-slate-900">
                        {ticket.title}
                      </h2>

                      {/* DESCRIPTION */}

                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                        {ticket.description}
                      </p>

                      {/* CATEGORY */}

                      <div className="mt-4 flex flex-wrap gap-2">

                        {ticket.category && (
                          <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                            {ticket.category}
                          </span>
                        )}

                      </div>

                    </div>

                    {/* ACTION */}

                    <div className="flex shrink-0">

                      <button
                        type="button"
                        onClick={() => openTicket(ticket.id)}
                        disabled={!ticket.id}
                        className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        View Ticket
                      </button>

                    </div>

                  </div>

                </div>

              ))}

            </div>
          )}

      </section>

    </main>
  );
}