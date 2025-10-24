"use client";

import { api } from "~/lib/trpc/client";

export default function TargetVocabulariesPage() {
  const utils = api.useUtils();
  const { data: allVocabularies } = api.vocabulary.getAll.useQuery();
  const { data: targetVocabularies } = api.vocabulary.getTargetVocabularies.useQuery();

  const addMutation = api.vocabulary.addToTarget.useMutation({
    onSuccess: () => {
      utils.vocabulary.getTargetVocabularies.invalidate();
    },
  });

  const removeMutation = api.vocabulary.removeFromTarget.useMutation({
    onSuccess: () => {
      utils.vocabulary.getTargetVocabularies.invalidate();
    },
  });

  const targetVocabIds = new Set(
    targetVocabularies?.map((tv) => tv.vocabularyId) || []
  );

  const availableVocabularies =
    allVocabularies?.filter((v) => !targetVocabIds.has(v.id)) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Target Vocabularies</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Available Vocabularies */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Available Vocabularies
          </h2>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {availableVocabularies.length === 0 ? (
              <p className="text-gray-500">No available vocabularies</p>
            ) : (
              availableVocabularies.map((vocab) => (
                <div
                  key={vocab.id}
                  className="flex items-center justify-between rounded border p-3"
                >
                  <div className="flex items-center space-x-3">
                    {vocab.imagePath && (
                      <img
                        src={vocab.imagePath}
                        alt={vocab.word}
                        className="h-10 w-10 rounded object-cover"
                      />
                    )}
                    <span className="font-medium">{vocab.word}</span>
                  </div>
                  <button
                    onClick={() => addMutation.mutate({ vocabularyId: vocab.id })}
                    disabled={addMutation.isPending}
                    className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Target Vocabularies */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Target Vocabularies ({targetVocabularies?.length || 0})
          </h2>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {!targetVocabularies || targetVocabularies.length === 0 ? (
              <p className="text-gray-500">No target vocabularies selected</p>
            ) : (
              targetVocabularies.map((tv) => (
                <div
                  key={tv.id}
                  className="flex items-center justify-between rounded border border-green-200 bg-green-50 p-3"
                >
                  <div className="flex items-center space-x-3">
                    {tv.vocabulary.imagePath && (
                      <img
                        src={tv.vocabulary.imagePath}
                        alt={tv.vocabulary.word}
                        className="h-10 w-10 rounded object-cover"
                      />
                    )}
                    <span className="font-medium">{tv.vocabulary.word}</span>
                  </div>
                  <button
                    onClick={() => removeMutation.mutate({ id: tv.id })}
                    disabled={removeMutation.isPending}
                    className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
