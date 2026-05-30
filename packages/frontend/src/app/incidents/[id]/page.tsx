"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface UIAlert {
  type: "error" | "success" | "info";
  message: string;
}

function TimelineEventForm({ incidentId }: { incidentId: string }) {
  const [formData, setFormData] = useState({
    timestamp: new Date().toISOString().split("T")[0],
    classification: "DETECTION",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/incidents/${incidentId}/timeline/events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            ...formData,
            timestamp: new Date(formData.timestamp).toISOString(),
          }),
        }
      );

      if (response.ok) {
        setFormData({
          timestamp: new Date().toISOString().split("T")[0],
          classification: "DETECTION",
          description: "",
        });
        alert("✅ Timeline event added successfully!");
      } else {
        throw new Error("Failed to add timeline event");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add timeline event"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">
            Date
          </label>
          <input
            type="date"
            value={formData.timestamp}
            onChange={(e) =>
              setFormData({ ...formData, timestamp: e.target.value })
            }
            className="w-full px-3 py-2 bg-slate-600/50 border border-slate-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">
            Event Type
          </label>
          <select
            value={formData.classification}
            onChange={(e) =>
              setFormData({ ...formData, classification: e.target.value })
            }
            className="w-full px-3 py-2 bg-slate-600/50 border border-slate-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option>DETECTION</option>
            <option>INVESTIGATION</option>
            <option>MITIGATION</option>
            <option>RESOLUTION</option>
            <option>COMMUNICATION</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full px-3 py-2 bg-slate-600/50 border border-slate-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-20 resize-none"
          placeholder="Describe what happened..."
        />
      </div>

      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition text-sm"
      >
        {loading ? "Adding..." : "+ Add Event"}
      </button>
    </form>
  );
}

export default function IncidentDetail() {
  const params = useParams();
  const incidentId = params.id as string;

  const [incident, setIncident] = useState<any>(null);
  const [postmortem, setPostmortem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "timeline" | "postmortem"
  >("overview");
  const [alert, setAlert] = useState<UIAlert | null>(null);

  useEffect(() => {
    void fetchIncident();
  }, [incidentId]);

  async function fetchIncident() {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/incidents/${incidentId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIncident(data);
      } else {
        setAlert({
          type: "error",
          message: "Failed to load incident details",
        });
      }
    } catch (error) {
      console.error("Error fetching incident:", error);
      setAlert({
        type: "error",
        message: "Error loading incident. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function generatePostmortem() {
    setGenerating(true);
    setAlert(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/incidents/${incidentId}/postmortem/generate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPostmortem(data);
        setAlert({
          type: "success",
          message: "✅ Post-mortem generated successfully!",
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to generate postmortem (${response.status})`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate postmortem";
      console.error("Error generating postmortem:", error);
      setAlert({
        type: "error",
        message: `❌ ${errorMessage}`,
      });
    } finally {
      setGenerating(false);
    }
  }

  async function exportMarkdown() {
    setExporting("markdown");
    setAlert(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/incidents/${incidentId}/export/markdown`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `postmortem-${incidentId}.md`;
        a.click();
        URL.revokeObjectURL(url);
        setAlert({
          type: "success",
          message: "✅ Markdown file downloaded successfully",
        });
      } else {
        throw new Error(
          `Failed to export markdown (${response.status})`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to export markdown";
      console.error("Error exporting markdown:", error);
      setAlert({
        type: "error",
        message: `❌ ${errorMessage}`,
      });
    } finally {
      setExporting(null);
    }
  }

  async function exportPDF() {
    setExporting("pdf");
    setAlert(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/incidents/${incidentId}/export/pdf`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `postmortem-${incidentId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        setAlert({
          type: "success",
          message: "✅ PDF file downloaded successfully",
        });
      } else {
        throw new Error(
          `Failed to export PDF (${response.status})`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to export PDF";
      console.error("Error exporting PDF:", error);
      setAlert({
        type: "error",
        message: `❌ ${errorMessage}`,
      });
    } finally {
      setExporting(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading incident...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-white mb-2">Incident not found</h2>
          <p className="text-slate-400">The incident you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-500/20 text-red-200 border-red-500/50";
      case "HIGH":
        return "bg-orange-500/20 text-orange-200 border-orange-500/50";
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-200 border-yellow-500/50";
      default:
        return "bg-green-500/20 text-green-200 border-green-500/50";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "🔴";
      case "HIGH":
        return "🟠";
      case "MEDIUM":
        return "🟡";
      default:
        return "🟢";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Alert */}
        {alert && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              alert.type === "error"
                ? "bg-red-500/10 border-red-500/50"
                : alert.type === "success"
                ? "bg-green-500/10 border-green-500/50"
                : "bg-blue-500/10 border-blue-500/50"
            }`}
          >
            <p
              className={
                alert.type === "error"
                  ? "text-red-200"
                  : alert.type === "success"
                  ? "text-green-200"
                  : "text-blue-200"
              }
            >
              {alert.message}
            </p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">
                  {getSeverityIcon(incident.severity)}
                </span>
                <h1 className="text-4xl font-bold text-white">
                  {incident.title}
                </h1>
              </div>
              <p className="text-slate-400">
                Reported on{" "}
                {new Date(incident.startTime).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <span
              className={`px-4 py-2 rounded-full border font-semibold text-sm ${getSeverityColor(
                incident.severity
              )}`}
            >
              {incident.severity} Severity
            </span>
            <span className="px-4 py-2 rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/50 font-semibold text-sm">
              Status: {incident.status}
            </span>
            {incident.isOngoing && (
              <span className="px-4 py-2 rounded-full bg-red-500/20 text-red-200 border border-red-500/50 font-semibold text-sm animate-pulse">
                🔴 Ongoing
              </span>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Service",
              value: incident.serviceAffected || "N/A",
              icon: "⚙️",
            },
            {
              label: "Environment",
              value: incident.environment || "N/A",
              icon: "🌍",
            },
            {
              label: "Users Affected",
              value: incident.usersAffected?.toLocaleString() || "Unknown",
              icon: "👥",
            },
            {
              label: "Revenue Impact",
              value: `$${incident.revenueImpact?.toLocaleString() || "0"}`,
              icon: "💰",
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
            >
              <p className="text-slate-400 text-sm flex items-center gap-2 mb-1">
                <span>{stat.icon}</span> {stat.label}
              </p>
              <p className="text-white font-semibold text-lg">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-slate-800/50 border border-slate-700 rounded-xl p-2 backdrop-blur">
          {(["overview", "timeline", "postmortem"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === tab
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              {tab === "overview" && "📋 Overview"}
              {tab === "timeline" && "📅 Timeline"}
              {tab === "postmortem" && "📄 Post-Mortem"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 backdrop-blur">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {incident.description && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">
                    Description
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    {incident.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                  <p className="text-slate-400 text-sm mb-2">📍 Created By</p>
                  <p className="text-white font-semibold">
                    {incident.createdBy?.name || incident.createdBy?.email || "System"}
                  </p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                  <p className="text-slate-400 text-sm mb-2">🕐 Created At</p>
                  <p className="text-white font-semibold">
                    {new Date(incident.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-200 text-sm">
                  📝 Timeline events help document the incident progression from detection to resolution
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Add Timeline Event</h3>
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                  <TimelineEventForm incidentId={incidentId} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "postmortem" && (
            <div className="space-y-6">
              {!postmortem ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-slate-400 mb-6 text-lg">
                    Generate an AI-powered post-mortem analysis of this incident
                  </p>
                  <button
                    onClick={generatePostmortem}
                    disabled={generating}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 px-8 rounded-lg transition transform hover:scale-105 active:scale-95"
                  >
                    {generating ? "⏳ Generating..." : "🚀 Generate Post-Mortem"}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={exportMarkdown}
                      disabled={exporting === "markdown"}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2"
                    >
                      {exporting === "markdown" ? "⏳" : "📥"} Markdown
                    </button>
                    <button
                      onClick={exportPDF}
                      disabled={exporting === "pdf"}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2"
                    >
                      {exporting === "pdf" ? "⏳" : "📥"} PDF
                    </button>
                  </div>

                  {postmortem.executiveSummary && (
                    <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                      <h3 className="text-xl font-bold text-white mb-3">
                        Executive Summary
                      </h3>
                      <p className="text-slate-300 leading-relaxed">
                        {postmortem.executiveSummary}
                      </p>
                    </div>
                  )}

                  {postmortem.rootCauseAnalysis && (
                    <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                      <h3 className="text-xl font-bold text-white mb-3">
                        🔍 Root Cause Analysis
                      </h3>
                      <p className="text-slate-300 leading-relaxed">
                        {postmortem.rootCauseAnalysis}
                      </p>
                    </div>
                  )}

                  {postmortem.contributingFactors && (
                    <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                      <h3 className="text-xl font-bold text-white mb-3">
                        ⚡ Contributing Factors
                      </h3>
                      <p className="text-slate-300 leading-relaxed">
                        {postmortem.contributingFactors}
                      </p>
                    </div>
                  )}

                  {postmortem.whatWentWell && (
                    <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                      <h3 className="text-xl font-bold text-green-200 mb-3">
                        ✅ What Went Well
                      </h3>
                      <p className="text-slate-300 leading-relaxed">
                        {postmortem.whatWentWell}
                      </p>
                    </div>
                  )}

                  {postmortem.correctiveActions && (
                    <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                      <h3 className="text-xl font-bold text-white mb-3">
                        🎯 Corrective Actions
                      </h3>
                      <p className="text-slate-300 leading-relaxed">
                        {postmortem.correctiveActions}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
