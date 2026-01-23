"use client";

import { useState } from "react";

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("weekly");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, frequency }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to subscribe");
      }

      setStatus("success");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800 text-sm">
          Thanks for subscribing! Check your email to confirm.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="inline-flex items-center">
          <input
            type="radio"
            name="frequency"
            value="weekly"
            checked={frequency === "weekly"}
            onChange={(e) => setFrequency(e.target.value as "weekly" | "monthly")}
            className="text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Weekly</span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            name="frequency"
            value="monthly"
            checked={frequency === "monthly"}
            onChange={(e) => setFrequency(e.target.value as "weekly" | "monthly")}
            className="text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Monthly</span>
        </label>
      </div>

      {status === "error" && (
        <p className="text-red-600 text-sm">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
      >
        {status === "loading" ? "Subscribing..." : "Get weekly updates"}
      </button>
    </form>
  );
}
