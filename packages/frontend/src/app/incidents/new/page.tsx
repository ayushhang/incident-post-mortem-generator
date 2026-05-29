"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateIncident() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
    setLoading(true);

    try {
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
        alert("Failed to create incident");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error creating incident");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Create New Incident</h1>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-800 rounded-lg shadow-xl p-8 space-y-6"
        >
          {/* Title */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Incident Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="e.g., API Database Connection Pool Exhaustion"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500 h-24"
              placeholder="Brief description of the incident..."
            />
          </div>

          {/* Severity */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Severity *
            </label>
            <select
              value={formData.severity}
              onChange={(e) =>
                setFormData({ ...formData, severity: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option>CRITICAL</option>
              <option>HIGH</option>
              <option>MEDIUM</option>
              <option>LOW</option>
            </select>
          </div>

          {/* Service Affected */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Service Affected
            </label>
            <input
              type="text"
              value={formData.serviceAffected}
              onChange={(e) =>
                setFormData({ ...formData, serviceAffected: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="e.g., API, Database, Payment Service"
            />
          </div>

          {/* Environment */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Environment
            </label>
            <select
              value={formData.environment}
              onChange={(e) =>
                setFormData({ ...formData, environment: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option>production</option>
              <option>staging</option>
              <option>development</option>
            </select>
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Start Time *
            </label>
            <input
              type="date"
              required
              value={formData.startTime}
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Is Ongoing */}
          <div>
            <label className="flex items-center text-white font-semibold">
              <input
                type="checkbox"
                checked={formData.isOngoing}
                onChange={(e) =>
                  setFormData({ ...formData, isOngoing: e.target.checked })
                }
                className="w-4 h-4 mr-3 bg-slate-700 border border-slate-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              Ongoing Incident
            </label>
          </div>

          {/* Users Affected */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Users Affected
            </label>
            <input
              type="number"
              value={formData.usersAffected}
              onChange={(e) =>
                setFormData({ ...formData, usersAffected: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="0"
            />
          </div>

          {/* Revenue Impact */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Revenue Impact ($)
            </label>
            <input
              type="number"
              value={formData.revenueImpact}
              onChange={(e) =>
                setFormData({ ...formData, revenueImpact: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="0.00"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              {loading ? "Creating..." : "Create Incident"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
