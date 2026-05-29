"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function IncidentDetail() {
  const params = useParams();
  const incidentId = params.id as string;

  const [incident, setIncident] = useState<any>(null);
  const [postmortem, setPostmortem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "postmortem">(
    "overview"
  );

  useEffect(() => {
    fetchIncident();
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
      }
    } catch (error) {
      console.error("Error fetching incident:", error);
    } finally {
      setLoading(false);
    }
  }

  async function generatePostmortem() {
    setGenerating(true);
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
        alert("Post-mortem generated successfully!");
      }
    } catch (error) {
      console.error("Error generating postmortem:", error);
      alert("Error generating post-mortem");
    } finally {
      setGenerating(false);
    }
  }

  async function exportMarkdown() {
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
      }
    } catch (error) {
      console.error("Error exporting:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <p className="text-slate-400 text-center">Loading incident...</p>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <p className="text-slate-400 text-center">Incident not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {incident.title}
          </h1>
          <div className="flex gap-4 items-center">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              incident.severity === "CRITICAL"
                ? "bg-red-100 text-red-800"
                : incident.severity === "HIGH"
                ? "bg-orange-100 text-orange-800"
                : incident.severity === "MEDIUM"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
            }`}>
              {incident.severity}
            </span>
            <span className="text-slate-400">
              {new Date(incident.startTime).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 bg-slate-800 rounded-lg p-2">
          {["overview", "timeline", "postmortem"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-slate-800 rounded-lg shadow-xl p-8">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Service Affected</p>
                  <p className="text-white text-lg font-semibold">
                    {incident.serviceAffected || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Environment</p>
                  <p className="text-white text-lg font-semibold">
                    {incident.environment || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Users Affected</p>
                  <p className="text-white text-lg font-semibold">
                    {incident.usersAffected?.toLocaleString() || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Revenue Impact</p>
                  <p className="text-white text-lg font-semibold">
                    ${incident.revenueImpact?.toLocaleString() || "0"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-slate-400 text-sm mb-2">Description</p>
                <p className="text-slate-300">
                  {incident.description || "No description provided"}
                </p>
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-4">
              <p className="text-slate-400">Timeline events will be displayed here</p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                + Add Timeline Event
              </button>
            </div>
          )}

          {activeTab === "postmortem" && (
            <div className="space-y-6">
              {!postmortem ? (
                <div className="text-center py-12">
                  <p className="text-slate-400 mb-6">
                    No post-mortem generated yet. Generate one from incident data.
                  </p>
                  <button
                    onClick={generatePostmortem}
                    disabled={generating}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-3 px-8 rounded-lg transition"
                  >
                    {generating ? "Generating..." : "Generate Post-Mortem"}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <button
                      onClick={exportMarkdown}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                      📥 Export Markdown
                    </button>
                    <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition">
                      📥 Export PDF
                    </button>
                  </div>

                  {postmortem.executiveSummary && (
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        Executive Summary
                      </h3>
                      <p className="text-slate-300">
                        {postmortem.executiveSummary}
                      </p>
                    </div>
                  )}

                  {postmortem.rootCauseAnalysis && (
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        Root Cause
                      </h3>
                      <p className="text-slate-300">
                        {postmortem.rootCauseAnalysis}
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
