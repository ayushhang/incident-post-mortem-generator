"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FormError {
  field?: string;
  message: string;
}

export default function CreateIncident() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FormError | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "MEDIUM",
    serviceAffected: "",
    environment: "production",
    startTime: new Date().toISOString().split("T")[0],
    isOngoing: true,
    usersAffected: "",
    revenueImpact: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.title.trim()) {
        throw new Error("Incident title is required");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/incidents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            ...formData,
            startTime: new Date(formData.startTime).toISOString(),
            usersAffected: formData.usersAffected
              ? parseInt(formData.usersAffected)
              : undefined,
            revenueImpact: formData.revenueImpact
              ? parseFloat(formData.revenueImpact)
              : undefined,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        router.push(`/incidents/${data.id}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to create incident (${response.status})`
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      console.error("Error creating incident:", err);
      setError({ message: errorMessage });
    } finally {
      setLoading(false);
    }
  }

  const severityOptions = [
    { value: "CRITICAL", label: "🔴 Critical", color: "bg-red-500/10 border-red-500" },
    { value: "HIGH", label: "🟠 High", color: "bg-orange-500/10 border-orange-500" },
    { value: "MEDIUM", label: "🟡 Medium", color: "bg-yellow-500/10 border-yellow-500" },
    { value: "LOW", label: "🟢 Low", color: "bg-green-500/10 border-green-500" },
  ];

  const environmentOptions = [
    { value: "production", label: "🔒 Production" },
    { value: "staging", label: "🧪 Staging" },
    { value: "development", label: "💻 Development" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-4xl font-bold text-white">Report Incident</h1>
          </div>
          <p className="text-slate-400 ml-15">
            Document the incident details to generate comprehensive post-mortem reports
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-red-200 font-medium">❌ {error.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>📋</span> Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Incident Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="e.g., Database Connection Pool Exhaustion"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition h-28 resize-none"
                  placeholder="Provide detailed information about what happened..."
                />
              </div>
            </div>
          </div>

          {/* Severity & Environment Card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>🎯</span> Severity & Environment
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Severity <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {severityOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, severity: opt.value })
                      }
                      className={`p-3 rounded-lg border-2 transition font-semibold text-sm ${
                        formData.severity === opt.value
                          ? `${opt.color} border-current`
                          : "bg-slate-700/30 border-slate-600 text-slate-300 hover:bg-slate-700/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Environment
                </label>
                <div className="space-y-2">
                  {environmentOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center p-3 bg-slate-700/30 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50 transition"
                    >
                      <input
                        type="radio"
                        name="environment"
                        value={opt.value}
                        checked={formData.environment === opt.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            environment: e.target.value,
                          })
                        }
                        className="w-4 h-4 mr-3"
                      />
                      <span className="text-slate-300 font-medium">
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Service & Timing Card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>⏱️</span> Service & Timeline
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Service Affected
                </label>
                <input
                  type="text"
                  value={formData.serviceAffected}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      serviceAffected: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="e.g., API, Database, Cache"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Start Time <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.isOngoing}
                onChange={(e) =>
                  setFormData({ ...formData, isOngoing: e.target.checked })
                }
                className="w-4 h-4 rounded"
              />
              <label className="text-sm font-medium text-slate-300 cursor-pointer">
                🔴 This incident is still ongoing
              </label>
            </div>
          </div>

          {/* Impact Card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>📊</span> Impact Assessment
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Users Affected
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.usersAffected}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usersAffected: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="0"
                    min="0"
                  />
                  <span className="absolute right-4 top-3 text-slate-400 text-sm">
                    👥
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Revenue Impact
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-400">$</span>
                  <input
                    type="number"
                    value={formData.revenueImpact}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        revenueImpact: e.target.value,
                      })
                    }
                    className="w-full pl-8 pr-4 py-3 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <span>{loading ? "📤 Creating..." : "✅ Create Incident"}</span>
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              ← Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
