"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = "https://ticketdesk-ai.onrender.com";

type Ticket = {
  id: string;
  title: string;
  description: string;
  category?: string | null;
  priority?: string;
  status?: string;
  assigned_to?: string | null;
  created_at?: string;
  updated_at?: string;
  ai_summary?: string;
};

type Comment = {
  id: string;
  user_id: string;
  role: string;
  content: string;
  created_at: string;
};

type Attachment = {
  id: string;
  filename?: string;
  original_filename?: string;
  content_type?: string;
  size?: number;
  ai_error_text?: string;
  ai_technical_details?: string;
  created_at?: string;
};

export default function TicketDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const ticketId = params.ticket_id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [userRole, setUserRole] = useState("");

  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [attachmentsLoading, setAttachmentsLoading] = useState(true);

  const [error, setError] = useState("");

  const [commentText, setCommentText] = useState("");
  const [addingComment, setAddingComment] = useState(false);

  const [summarizing, setSummarizing] = useState(false);

  const [showClosePopup, setShowClosePopup] = useState(false);
  const [closing, setClosing] = useState(false);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!ticketId) return;

    fetchCurrentUser();
    fetchTicket();
    fetchComments();
    fetchAttachments();
  }, [ticketId]);

  // ---------------------------------------------------------
  // CURRENT USER
  // ---------------------------------------------------------

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load user.");
      }

      setUserRole(data.role || data.user?.role || "");
    } catch (err) {
      console.error("Unable to load current user:", err);
    }
  };

  // ---------------------------------------------------------
  // FETCH TICKET
  // ---------------------------------------------------------

  const fetchTicket = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/tickets/${ticketId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load ticket."
        );
      }

      setTicket(data);
    } catch (err: any) {
      console.error("Unable to load ticket:", err);
      setError(err.message || "Unable to load ticket.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // FETCH COMMENTS
  // ---------------------------------------------------------

  const fetchComments = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setCommentsLoading(true);

      const response = await fetch(
        `${API_URL}/tickets/${ticketId}/comments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load comments."
        );
      }

      setComments(data.comments || []);
    } catch (err) {
      console.error("Unable to load comments:", err);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  // ---------------------------------------------------------
  // FETCH ATTACHMENTS
  // ---------------------------------------------------------

  const fetchAttachments = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setAttachmentsLoading(true);

      const response = await fetch(
        `${API_URL}/tickets/${ticketId}/attachments`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load attachments."
        );
      }

      setAttachments(
        Array.isArray(data)
          ? data
          : data.attachments || []
      );
    } catch (err) {
      console.error(
        "Unable to load attachments:",
        err
      );

      setAttachments([]);
    } finally {
      setAttachmentsLoading(false);
    }
  };

  // ---------------------------------------------------------
  // ADD COMMENT
  // ---------------------------------------------------------

  const addComment = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!commentText.trim()) {
      return;
    }

    try {
      setAddingComment(true);

      const response = await fetch(
        `${API_URL}/tickets/${ticketId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: commentText.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to add comment."
        );
      }

      setCommentText("");

      await fetchComments();

      setSuccessMessage("Comment added successfully.");
      setShowSuccessPopup(true);
    } catch (err: any) {
      setErrorMessage(
        err.message || "Unable to add comment."
      );

      setShowErrorPopup(true);
    } finally {
      setAddingComment(false);
    }
  };

  // ---------------------------------------------------------
  // AI SUMMARY
  // ---------------------------------------------------------

  const summarizeTicket = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setSummarizing(true);

      const response = await fetch(
        `${API_URL}/tickets/${ticketId}/summarize`,
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
          data.detail || "Unable to summarize ticket."
        );
      }

      await fetchTicket();

      setSuccessMessage(
        "AI summary generated successfully."
      );

      setShowSuccessPopup(true);
    } catch (err: any) {
      setErrorMessage(
        err.message || "Unable to generate AI summary."
      );

      setShowErrorPopup(true);
    } finally {
      setSummarizing(false);
    }
  };

  // ---------------------------------------------------------
  // CLOSE TICKET
  // ---------------------------------------------------------

  const closeTicket = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setClosing(true);

      const response = await fetch(
        `${API_URL}/tickets/${ticketId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: "closed",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to close ticket."
        );
      }

      setShowClosePopup(false);

      await fetchTicket();

      setSuccessMessage(
        "Ticket closed successfully."
      );

      setShowSuccessPopup(true);
    } catch (err: any) {
      setErrorMessage(
        err.message || "Unable to close ticket."
      );

      setShowErrorPopup(true);
    } finally {
      setClosing(false);
    }
  };

  // ---------------------------------------------------------
  // DELETE TICKET
  // ---------------------------------------------------------

  const deleteTicket = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        `${API_URL}/tickets/${ticketId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to delete ticket."
        );
      }

      setShowDeletePopup(false);

      setSuccessMessage(
        "Ticket deleted successfully."
      );

      setShowSuccessPopup(true);

      setTimeout(() => {
        router.push("/dashboard/tickets");
      }, 1000);
    } catch (err: any) {
      setErrorMessage(
        err.message || "Unable to delete ticket."
      );

      setShowErrorPopup(true);
    } finally {
      setDeleting(false);
    }
  };

  // ---------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------

  const formatDate = (date?: string) => {
    if (!date) return "—";

    try {
      return new Date(date).toLocaleString();
    } catch {
      return date;
    }
  };

  const formatAttachmentSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const statusClass = (status?: string) => {
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
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const priorityClass = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case "critical":
        return "bg-red-50 text-red-700 border-red-200";

      case "high":
        return "bg-orange-50 text-orange-700 border-orange-200";

      case "medium":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";

      case "low":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";

      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading ticket...
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // ERROR
  // ---------------------------------------------------------

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <ErrorIcon />
          </div>

          <h1 className="mt-5 text-lg font-bold text-slate-900">
            Unable to load ticket
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error || "Ticket not found."}
          </p>

          <button
            onClick={() => router.push("/dashboard/tickets")}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // MAIN UI
  // ---------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50">

      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-6 py-5 lg:px-8">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <button
                onClick={() =>
                  router.push("/dashboard/tickets")
                }
                className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
              >
                <ArrowLeftIcon />
                Back to Tickets
              </button>

              <div className="flex flex-wrap items-center gap-3">

                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {ticket.title}
                </h1>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${statusClass(
                    ticket.status
                  )}`}
                >
                  {ticket.status?.replace("_", " ") ||
                    "Unknown"}
                </span>

              </div>

              <p className="mt-2 text-sm text-slate-500">
                Ticket ID: {ticket.id}
              </p>

            </div>

            <div className="flex flex-wrap gap-2">

              {(userRole === "manager" ||
                userRole === "owner") && (
                <button
                  onClick={summarizeTicket}
                  disabled={summarizing}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <SparkleIcon />

                  {summarizing
                    ? "Summarizing..."
                    : "AI Summary"}
                </button>
              )}

              {ticket.status === "resolved" && (
                <button
                  onClick={() =>
                    setShowClosePopup(true)
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  <CheckIcon />
                  Close Ticket
                </button>
              )}

              {userRole === "owner" && (
                <button
                  onClick={() =>
                    setShowDeletePopup(true)
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  <TrashIcon />
                  Delete
                </button>
              )}

            </div>

          </div>

        </div>

      </header>

      {/* CONTENT */}

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

        <div className="grid gap-6 lg:grid-cols-3">

          {/* LEFT */}

          <div className="space-y-6 lg:col-span-2">

            {/* ISSUE */}

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-6 py-6 sm:px-8">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <TicketIcon />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Issue Description
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Details provided when the ticket was created.
                    </p>
                  </div>

                </div>

              </div>

              <div className="px-6 py-6 sm:px-8">

                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {ticket.description}
                </p>

              </div>

            </div>

            {/* AI SUMMARY */}

            {ticket.ai_summary && (
              <div className="rounded-3xl border border-blue-200 bg-blue-50/50 shadow-sm">

                <div className="border-b border-blue-100 px-6 py-6 sm:px-8">

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <SparkleIcon />
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-blue-900">
                        AI Summary
                      </h2>

                      <p className="mt-1 text-xs text-blue-600/70">
                        Generated by TicketDesk AI
                      </p>
                    </div>

                  </div>

                </div>

                <div className="px-6 py-6 sm:px-8">

                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {ticket.ai_summary}
                  </p>

                </div>

              </div>
            )}

            {/* ATTACHMENTS */}

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-6 py-6 sm:px-8">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <AttachmentIcon />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Attachments & AI Analysis
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Uploaded files and AI-extracted technical information.
                    </p>
                  </div>

                </div>

              </div>

              <div className="p-6 sm:p-8">

                {attachmentsLoading ? (

                  <div className="py-8 text-center">

                    <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                    <p className="mt-3 text-xs text-slate-400">
                      Loading attachments...
                    </p>

                  </div>

                ) : attachments.length === 0 ? (

                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                      <AttachmentIcon />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-slate-700">
                      No attachments
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      No files have been uploaded for this ticket.
                    </p>

                  </div>

                ) : (

                  <div className="space-y-5">

                    {attachments.map(
                      (attachment) => (

                        <div
                          key={attachment.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"
                        >

                          {/* FILE INFO */}

                          <div className="flex items-start gap-4">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                              <FileAttachmentIcon />
                            </div>

                            <div className="min-w-0 flex-1">

                              <p className="truncate text-sm font-bold text-slate-800">
                                {attachment.original_filename ||
                                  attachment.filename ||
                                  "Uploaded file"}
                              </p>

                              <div className="mt-1 flex flex-wrap gap-2">

                                {attachment.content_type && (
                                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                    {attachment.content_type.split(
                                      "/"
                                    )[1] ||
                                      attachment.content_type}
                                  </span>
                                )}

                                {typeof attachment.size ===
                                  "number" && (
                                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-400">
                                    {formatAttachmentSize(
                                      attachment.size
                                    )}
                                  </span>
                                )}

                              </div>

                            </div>

                          </div>

                          {/* AI ERROR */}

                          {attachment.ai_error_text && (
                            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">

                              <div className="flex items-center gap-2">

                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
                                  <ErrorIcon />
                                </div>

                                <div>

                                  <p className="text-sm font-bold text-red-800">
                                    AI Detected Error
                                  </p>

                                  <p className="text-[11px] text-red-600/70">
                                    Extracted from the uploaded screenshot
                                  </p>

                                </div>

                              </div>

                              <div className="mt-4 rounded-xl border border-red-100 bg-white p-4">

                                <p className="whitespace-pre-wrap text-sm leading-6 text-red-800">
                                  {attachment.ai_error_text}
                                </p>

                              </div>

                            </div>
                          )}

                          {/* TECHNICAL DETAILS */}

                          {attachment.ai_technical_details && (
                            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">

                              <div className="flex items-center gap-2">

                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                  <SparkleIcon />
                                </div>

                                <div>

                                  <p className="text-sm font-bold text-blue-800">
                                    Technical Details
                                  </p>

                                  <p className="text-[11px] text-blue-600/70">
                                    Analysis generated by TicketDesk AI
                                  </p>

                                </div>

                              </div>

                              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                {
                                  attachment.ai_technical_details
                                }
                              </p>

                            </div>
                          )}

                          {/* NO ERROR */}

                          {!attachment.ai_error_text &&
                            !attachment.ai_technical_details && (
                              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">

                                <p className="text-sm font-semibold text-emerald-700">
                                  ✓ No error information detected
                                </p>

                                <p className="mt-1 text-xs text-emerald-600/70">
                                  The AI did not find a visible technical error in this attachment.
                                </p>

                              </div>
                            )}

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>

            </div>

            {/* COMMENTS */}

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-6 py-6 sm:px-8">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <CommentIcon />
                  </div>

                  <div>

                    <h2 className="text-base font-bold text-slate-900">
                      Comments
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Discussion and updates for this ticket.
                    </p>

                  </div>

                </div>

              </div>

              <div className="p-6 sm:p-8">

                {/* ADD COMMENT */}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                  <textarea
                    value={commentText}
                    onChange={(e) =>
                      setCommentText(e.target.value)
                    }
                    placeholder="Write a comment..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />

                  <div className="mt-3 flex justify-end">

                    <button
                      onClick={addComment}
                      disabled={
                        addingComment ||
                        !commentText.trim()
                      }
                      className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {addingComment
                        ? "Adding..."
                        : "Add Comment"}
                    </button>

                  </div>

                </div>

                {/* COMMENT LIST */}

                <div className="mt-6 space-y-4">

                  {commentsLoading ? (

                    <div className="py-8 text-center">

                      <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                      <p className="mt-3 text-xs text-slate-400">
                        Loading comments...
                      </p>

                    </div>

                  ) : comments.length === 0 ? (

                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">

                      <p className="text-sm font-semibold text-slate-600">
                        No comments yet
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Start the discussion by adding a comment.
                      </p>

                    </div>

                  ) : (

                    comments.map((comment) => (

                      <div
                        key={comment.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5"
                      >

                        <div className="flex items-start justify-between gap-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
                              {comment.role
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "U"}
                            </div>

                            <div>

                              <p className="text-sm font-bold capitalize text-slate-800">
                                {comment.role ||
                                  "User"}
                              </p>

                              <p className="text-[11px] text-slate-400">
                                {formatDate(
                                  comment.created_at
                                )}
                              </p>

                            </div>

                          </div>

                        </div>

                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {comment.content}
                        </p>

                      </div>

                    ))

                  )}

                </div>

              </div>

            </div>

          </div>

          {/* RIGHT SIDEBAR */}

          <div className="space-y-6">

            {/* TICKET INFORMATION */}

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-6 py-5">

                <h2 className="text-sm font-bold text-slate-900">
                  Ticket Information
                </h2>

              </div>

              <div className="space-y-5 p-6">

                <InfoRow
                  label="Status"
                  value={
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${statusClass(
                        ticket.status
                      )}`}
                    >
                      {ticket.status?.replace(
                        "_",
                        " "
                      ) || "—"}
                    </span>
                  }
                />

                <InfoRow
                  label="Priority"
                  value={
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${priorityClass(
                        ticket.priority
                      )}`}
                    >
                      {ticket.priority || "—"}
                    </span>
                  }
                />

                <InfoRow
                  label="Category"
                  value={
                    ticket.category || "Not categorized"
                  }
                />

                <InfoRow
                  label="Assigned To"
                  value={
                    ticket.assigned_to || "Unassigned"
                  }
                />

                <InfoRow
                  label="Created"
                  value={formatDate(
                    ticket.created_at
                  )}
                />

                <InfoRow
                  label="Last Updated"
                  value={formatDate(
                    ticket.updated_at
                  )}
                />

              </div>

            </div>

            {/* QUICK ACTIONS */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

              <h2 className="text-sm font-bold text-slate-900">
                Quick Actions
              </h2>

              <div className="mt-4 space-y-3">

                {(userRole === "manager" ||
                  userRole === "owner") && (
                  <button
                    onClick={summarizeTicket}
                    disabled={summarizing}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
                  >
                    <SparkleIcon />
                    {summarizing
                      ? "Generating..."
                      : "Generate AI Summary"}
                  </button>
                )}

                {ticket.status === "resolved" && (
                  <button
                    onClick={() =>
                      setShowClosePopup(true)
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <CheckIcon />
                    Close Ticket
                  </button>
                )}

                {userRole === "owner" && (
                  <button
                    onClick={() =>
                      setShowDeletePopup(true)
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    <TrashIcon />
                    Delete Ticket
                  </button>
                )}

              </div>

            </div>

          </div>

        </div>

      </main>

      {/* CLOSE POPUP */}

      {showClosePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-6 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckIcon />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              Close this ticket?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              This will mark the ticket as closed. You can continue managing the ticket according to the workflow.
            </p>

            <div className="mt-6 flex justify-end gap-3">

              <button
                onClick={() =>
                  setShowClosePopup(false)
                }
                disabled={closing}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={closeTicket}
                disabled={closing}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {closing
                  ? "Closing..."
                  : "Yes, Close"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* DELETE POPUP */}

      {showDeletePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-6 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <TrashIcon />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              Delete this ticket?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              This action cannot be undone. The ticket will be permanently removed.
            </p>

            <div className="mt-6 flex justify-end gap-3">

              <button
                onClick={() =>
                  setShowDeletePopup(false)
                }
                disabled={deleting}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={deleteTicket}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {deleting
                  ? "Deleting..."
                  : "Yes, Delete"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* SUCCESS POPUP */}

      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-6 backdrop-blur-sm">

          <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckIcon />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              Success
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {successMessage}
            </p>

            <button
              onClick={() =>
                setShowSuccessPopup(false)
              }
              className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Continue
            </button>

          </div>

        </div>
      )}

      {/* ERROR POPUP */}

      {showErrorPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-6 backdrop-blur-sm">

          <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <ErrorIcon />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              Something went wrong
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {errorMessage}
            </p>

            <button
              onClick={() =>
                setShowErrorPopup(false)
              }
              className="mt-6 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Close
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

// =========================================================
// INFO ROW
// =========================================================

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">

      <span className="text-xs font-medium text-slate-400">
        {label}
      </span>

      <span className="text-right text-sm font-semibold text-slate-700">
        {value}
      </span>

    </div>
  );
}

// =========================================================
// ICONS
// =========================================================

function ArrowLeftIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

function TicketIcon() {
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
      <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a3 3 0 0 0 0 6v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a3 3 0 0 0 0-6V5z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </svg>
  );
}

function AttachmentIcon() {
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
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function FileAttachmentIcon() {
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </svg>
  );
}

function CommentIcon() {
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
      <path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 9.52 9.52 0 0 1-4-.9L3 21l1.9-4.6A8.4 8.4 0 0 1 3 11.5a8.5 8.5 0 0 1 18 0z" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
      <path d="M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16z" />
    </svg>
  );
}

function ErrorIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 15H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}