"use client";

import { useState, useEffect } from "react";
import { api } from "~/lib/trpc/client";

export default function SettingsPage() {
  const utils = api.useUtils();
  const { data: config } = api.config.get.useQuery();

  const [pointsPerQuestion, setPointsPerQuestion] = useState(1);
  const [pointsToRewardRatio, setPointsToRewardRatio] = useState(1.0);
  const [maxRewardPerCycle, setMaxRewardPerCycle] = useState(100.0);
  const [settlementDay, setSettlementDay] = useState(1);

  useEffect(() => {
    if (config) {
      setPointsPerQuestion(config.pointsPerQuestion);
      setPointsToRewardRatio(config.pointsToRewardRatio);
      setMaxRewardPerCycle(config.maxRewardPerCycle);
      if (config.settlementDay) {
        setSettlementDay(config.settlementDay);
      }
    }
  }, [config]);

  const updateMutation = api.config.update.useMutation({
    onSuccess: () => {
      utils.config.get.invalidate();
      alert("Settings updated successfully");
    },
  });

  const initSettlementMutation = api.config.initializeSettlement.useMutation({
    onSuccess: () => {
      utils.config.get.invalidate();
      alert("Settlement cycle initialized successfully");
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      pointsPerQuestion,
      pointsToRewardRatio,
      maxRewardPerCycle,
    });
  };

  const handleInitSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      confirm(
        "Are you sure? Settlement day can only be initialized once and cannot be changed later."
      )
    ) {
      initSettlementMutation.mutate({ settlementDay });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

      {/* General Settings */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">General Settings</h2>
        <form onSubmit={handleUpdateSettings} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Points Per Question
            </label>
            <input
              type="number"
              min="1"
              value={pointsPerQuestion}
              onChange={(e) => setPointsPerQuestion(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
            <p className="mt-1 text-sm text-gray-500">
              Points awarded for each correct answer (deducted for wrong answers)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Points to Reward Ratio
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={pointsToRewardRatio}
              onChange={(e) => setPointsToRewardRatio(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
            <p className="mt-1 text-sm text-gray-500">
              How many reward units per point (e.g., 1.0 means 1 point = 1 reward unit)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max Reward Per Cycle
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={maxRewardPerCycle}
              onChange={(e) => setMaxRewardPerCycle(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
            <p className="mt-1 text-sm text-gray-500">
              Maximum reward that can be earned in one settlement cycle
            </p>
          </div>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>

      {/* Settlement Cycle */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Settlement Cycle</h2>
        {config?.settlementInitialized ? (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">
              Settlement cycle is initialized. Points and rewards reset on day{" "}
              <strong>{config.settlementDay}</strong> of each month.
            </p>
          </div>
        ) : (
          <form onSubmit={handleInitSettlement} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Settlement Day (1-31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={settlementDay}
                onChange={(e) => setSettlementDay(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
              <p className="mt-1 text-sm text-gray-500">
                Day of the month when points and rewards will reset (can only be set once)
              </p>
            </div>

            <button
              type="submit"
              disabled={initSettlementMutation.isPending}
              className="rounded-md bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700 disabled:opacity-50"
            >
              {initSettlementMutation.isPending
                ? "Initializing..."
                : "Initialize Settlement Cycle"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
