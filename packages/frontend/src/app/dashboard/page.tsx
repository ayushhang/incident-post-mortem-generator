"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  startTime: string;
  usersAffected?: number;
  revenueImpact?: number;
  createdAt: string;
}

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    fetchIncidents();
  }, [filter]);

  async function fetchIncidents() {
    try {
      const query = new URLSearchParams();
      if (filter !== "ALL") query.append("severity", filter);
      query.append("page", "1");
      query.append("limit", "20");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/incidents?${query}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIncidents(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch incidents:", error);
    } finally {
      setLoading(false);
    }
  }

  const severityColors = {
    CRITICAL: "bg-red-100 text-red-800",
    HIGH: "bg-orange-100 text-orange-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    LOW: "bg-green-100 text-green-800",
  };

  const statusIcons = {
    DRAFT: "📝",
    IN_REVIEW: "👀",
    FINALIZED: "✅",
    ARCHIVED: "🗂️",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Incident Dashboard
            </h1>
            <p className="text-slate-300">
              {incidents.length} incident{incidents.length !== 1 ? "s" : ""} in system
            </p>
          </div>
          <Link
            href="/incidents/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            + New Incident
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8">
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilter(sev)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === sev
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Incidents Table */}
        {loading ? (
          <div className="dashboard-console">
            <p className="text-slate-400 text-lg">Loading incidents...</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="dashboard-console card">
            <p className="text-slate-300 text-lg">No incidents found</p>
          </div>
        ) : (
          <div className="card bg-slate-800 rounded-lg shadow-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-white font-semibold">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-white font-semibold">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-white font-semibold">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-white font-semibold">
                    Impact
                  </th>
                  <th className="px-6 py-3 text-left text-white font-semibold">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-white font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-600">
                {incidents.map((incident) => (
                  <tr
                    key={incident.id}
                    className="hover:bg-slate-700 transition"
                  >
                    <td className="px-6 py-4 text-white font-medium">
                      {incident.title}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          severityColors[
                            incident.severity as keyof typeof severityColors
                          ] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {incident.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {statusIcons[incident.status as keyof typeof statusIcons]}{" "}
                      {incident.status}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {incident.usersAffected
                        ? `${incident.usersAffected.toLocaleString()} users`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {new Date(incident.startTime).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/incidents/${incident.id}`}
                        className="text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
