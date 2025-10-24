"use client";

import { api } from "~/lib/trpc/client";

export default function AdminDashboard() {
  const { data: vocabularies } = api.vocabulary.getAll.useQuery();
  const { data: targetVocabularies } = api.vocabulary.getTargetVocabularies.useQuery();
  const { data: config } = api.config.get.useQuery();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Vocabularies</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {vocabularies?.length ?? 0}
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Target Vocabularies</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {targetVocabularies?.length ?? 0}
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Points Per Question</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {config?.pointsPerQuestion ?? 0}
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900">Quick Links</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <a
            href="/admin/vocabularies"
            className="block rounded-lg border-2 border-gray-200 p-4 hover:border-indigo-500"
          >
            <h3 className="font-semibold text-gray-900">Manage Vocabularies</h3>
            <p className="mt-1 text-sm text-gray-600">
              Add, edit, or delete vocabulary items
            </p>
          </a>
          <a
            href="/admin/target-vocabularies"
            className="block rounded-lg border-2 border-gray-200 p-4 hover:border-indigo-500"
          >
            <h3 className="font-semibold text-gray-900">Manage Target Vocabularies</h3>
            <p className="mt-1 text-sm text-gray-600">
              Select vocabularies for student learning
            </p>
          </a>
          <a
            href="/admin/settings"
            className="block rounded-lg border-2 border-gray-200 p-4 hover:border-indigo-500"
          >
            <h3 className="font-semibold text-gray-900">Settings</h3>
            <p className="mt-1 text-sm text-gray-600">
              Configure points, rewards, and settlement cycle
            </p>
          </a>
          <a
            href="/admin/image-generation"
            className="block rounded-lg border-2 border-gray-200 p-4 hover:border-indigo-500"
          >
            <h3 className="font-semibold text-gray-900">Image Generation</h3>
            <p className="mt-1 text-sm text-gray-600">
              Configure API key and generate vocabulary images
            </p>
          </a>
          <a
            href="/admin/audio-generation"
            className="block rounded-lg border-2 border-gray-200 p-4 hover:border-indigo-500"
          >
            <h3 className="font-semibold text-gray-900">Audio Generation</h3>
            <p className="mt-1 text-sm text-gray-600">
              Configure ElevenLabs key and generate vocabulary audio
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
