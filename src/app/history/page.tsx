"use client";

import { api } from "~/lib/trpc/client";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
  const router = useRouter();
  const { data: logs, isLoading } = api.learning.getPointLogs.useQuery({
    limit: 100,
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Point History</h1>
            <button
              onClick={() => router.push("/app")}
              className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              ← Back to Learning
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg bg-white shadow-xl">
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : !logs || logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No point history yet. Start learning to see your progress!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Change
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span
                          className={`font-semibold ${
                            log.changeAmount > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {log.changeAmount > 0 ? "+" : ""}
                          {log.changeAmount}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {log.balanceAfter}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {log.changeAmount > 0 ? (
                          <span className="text-green-600">✓ Correct answer</span>
                        ) : (
                          <div>
                            <span className="text-red-600">✗ Wrong answer</span>
                            {log.questionWord && (
                              <div className="mt-1 text-xs">
                                Question: <strong>{log.questionWord}</strong>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
