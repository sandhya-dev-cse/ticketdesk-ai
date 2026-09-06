"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "https://ticketdesk-ai.onrender.com";

export default function NewTicketPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError(
        "File type not allowed. Use PNG, JPG, WEBP, PDF, TXT, or DOCX."
      );
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be 10 MB or less.");
      event.target.value = "";
      return;
    }

    setError("");
    setFile(selectedFile);
  };

  const removeFile = () => {
    setFile(null);

    const input = document.getElementById(
      "attachment"
    ) as HTMLInputElement | null;

    if (input) {
      input.value = "";
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Please enter a ticket title.");
      return;
    }

    if (!description.trim()) {
      setError("Please describe the issue.");
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      // =====================================================
      // 1. CREATE TICKET
      // =====================================================

      const response = await fetch(`${API_URL}/tickets/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priority,
          status: "open",
          category: category || null,
        }),
      });

      let data: any = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to create the ticket."
        );
      }

      const ticketId = data.ticket_id;

      if (!ticketId) {
        throw new Error(
          "Ticket was created, but the ticket ID was not returned."
        );
      }

      // =====================================================
      // 2. UPLOAD ATTACHMENT
      // =====================================================

      if (file) {
        setUploading(true);

        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch(
          `${API_URL}/tickets/${ticketId}/attachments`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        let uploadData: any = {};

        try {
          uploadData = await uploadResponse.json();
        } catch {
          uploadData = {};
        }

        if (!uploadResponse.ok) {
          throw new Error(
            uploadData.detail ||
              "Ticket was created, but the attachment upload failed."
          );
        }
      }

      // =====================================================
      // 3. SUCCESS
      // =====================================================

      setUploading(false);
      setShowSuccess(true);

      setTimeout(() => {
        router.push(`/dashboard/tickets/${ticketId}`);
      }, 1200);
    } catch (err) {
      console.error(err);

      setUploading(false);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      {/* HEADER */}
      <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              router.push("/dashboard/tickets")
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm"
            title="Back to tickets"
          >
            <ArrowLeftIcon />
          </button>

          <div>
            <p className="text-sm font-bold text-slate-900">
              TicketDesk
            </p>

            <p className="text-[11px] text-slate-500">
              AI Support Platform
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push("/dashboard/home")
          }
          className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 sm:block"
        >
          Dashboard
        </button>
      </header>

      {/* CONTENT */}
      <section className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:py-10">
        {/* PAGE TITLE */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600" />

            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Support Workspace
            </p>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Create New Ticket
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Describe your issue clearly so your support team
            can understand and resolve it faster.
          </p>
        </div>

        {/* FORM CARD */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* CARD HEADER */}
          <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <TicketIcon />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Ticket Information
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Add the details of your support request.
                </p>
              </div>
            </div>
          </div>

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="space-y-6 p-6 sm:p-8"
          >
            {/* TITLE */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Ticket title
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Example: Unable to login to my account"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* DESCRIPTION */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <span className="text-xs text-slate-400">
                  {description.length} characters
                </span>
              </div>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Explain what happened, what you were trying to do, and any error message you received..."
                rows={7}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* CATEGORY + PRIORITY */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Category
                </label>

                <div className="relative">
                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value)
                    }
                    className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 pr-10 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="">
                      Select category
                    </option>

                    <option value="Technical">
                      Technical
                    </option>

                    <option value="Account">
                      Account
                    </option>

                    <option value="Billing">
                      Billing
                    </option>

                    <option value="Access">
                      Access
                    </option>

                    <option value="Bug">
                      Bug / Error
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>

                  <ChevronIcon />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Priority
                </label>

                <div className="relative">
                  <select
                    value={priority}
                    onChange={(event) =>
                      setPriority(event.target.value)
                    }
                    className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 pr-10 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="low">Low</option>
                    <option value="medium">
                      Medium
                    </option>
                    <option value="high">High</option>
                    <option value="urgent">
                      Urgent
                    </option>
                  </select>

                  <ChevronIcon />
                </div>
              </div>
            </div>

            {/* ATTACHMENT */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Attachment
                <span className="ml-2 text-xs font-normal text-slate-400">
                  Optional
                </span>
              </label>

              {!file ? (
                <label
                  htmlFor="attachment"
                  className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-8 text-center transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/40"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:scale-105">
                    <UploadIcon />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-slate-700">
                    Upload a screenshot or document
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    PNG, JPG, WEBP, PDF, TXT or DOCX · Max 10 MB
                  </p>

                  <span className="mt-4 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-blue-600 shadow-sm ring-1 ring-slate-200 transition group-hover:bg-blue-600 group-hover:text-white">
                    Choose File
                  </span>

                  <input
                    id="attachment"
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                      <FileIcon />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {file.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={removeFile}
                    disabled={loading}
                    className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* INFO */}
            <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <InfoIcon />
              </div>

              <div>
                <p className="text-sm font-semibold text-blue-800">
                  Helpful tip
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-700/70">
                  Include error messages, steps you already
                  tried, and screenshots when useful. Your AI
                  support system can use attachments to help
                  understand the issue.
                </p>
              </div>
            </div>

            {/* ERROR */}
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

            {/* BUTTONS */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  router.push("/dashboard/tickets")
                }
                className="h-11 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="group flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-600/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    {uploading
                      ? "Uploading..."
                      : "Creating ticket..."}
                  </>
                ) : (
                  <>
                    Create Ticket
                    <ArrowRightIcon />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* SUCCESS MODAL */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-5 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckIcon />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Ticket Created
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your support ticket has been created successfully.
              {file && " Your attachment was uploaded too."}
            </p>

            <div className="mt-5 h-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-full animate-pulse rounded-full bg-blue-600" />
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Redirecting to ticket...
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ArrowLeftIcon() {
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
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
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
      <path d="M4 5h16v14H4z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M5 20h14" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      width="20"
      height="20"
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
      <path d="M8 17h5" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" />
      <path d="M12 7h.01" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12l4 4L19 6" />
    </svg>
  );
}