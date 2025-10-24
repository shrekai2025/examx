"use client";

import { useState, useEffect } from "react";
import { api } from "~/lib/trpc/client";

export default function VocabulariesPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [word, setWord] = useState("");
  const [note, setNote] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imagePath, setImagePath] = useState("");
  const [audioPath, setAudioPath] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchWords, setBatchWords] = useState("");
  const [batchResult, setBatchResult] = useState<any>(null);
  const [lightboxImage, setLightboxImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  const utils = api.useUtils();
  const { data: vocabularies, isLoading } = api.vocabulary.getAll.useQuery();

  const createMutation = api.vocabulary.create.useMutation({
    onSuccess: () => {
      utils.vocabulary.getAll.invalidate();
      resetForm();
    },
  });

  const createBatchMutation = api.vocabulary.createBatch.useMutation({
    onSuccess: (result) => {
      utils.vocabulary.getAll.invalidate();
      setBatchResult(result);
      setBatchWords("");
    },
  });

  const updateMutation = api.vocabulary.update.useMutation({
    onSuccess: () => {
      utils.vocabulary.getAll.invalidate();
      resetForm();
    },
  });

  const deleteMutation = api.vocabulary.delete.useMutation({
    onSuccess: () => {
      utils.vocabulary.getAll.invalidate();
    },
  });

  const resetForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setWord("");
    setNote("");
    setImageFile(null);
    setAudioFile(null);
    setImagePath("");
    setAudioPath("");
    setPasteMode(false);
    setImagePreview(null);
  };

  // 监听剪贴板粘贴事件
  useEffect(() => {
    if (!pasteMode) return;

    const handlePaste = async (e: ClipboardEvent) => {
      e.preventDefault();
      const items = e.clipboardData?.items;

      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            // 创建预览
            const reader = new FileReader();
            reader.onload = (e) => {
              setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(blob);

            // 设置图片文件
            setImageFile(blob);
            setPasteMode(false);
            break;
          }
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [pasteMode]);

  // 监听Esc关闭大图
  useEffect(() => {
    if (!lightboxImage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxImage(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxImage]);

  // 处理文件选择
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // 创建预览
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (vocab: any) => {
    setEditingId(vocab.id);
    setWord(vocab.word);
    setNote(vocab.note || "");
    setImagePath(vocab.imagePath || "");
    setAudioPath(vocab.audioPath || "");
    setIsCreating(true);
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();
    return data.path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let finalImagePath = imagePath;
      let finalAudioPath = audioPath;

      if (imageFile) {
        finalImagePath = await uploadFile(imageFile);
      }

      if (audioFile) {
        finalAudioPath = await uploadFile(audioFile);
      }

      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          word,
          note: note || undefined,
          imagePath: finalImagePath || undefined,
          audioPath: finalAudioPath || undefined,
        });
      } else {
        await createMutation.mutateAsync({
          word,
          note: note || undefined,
          imagePath: finalImagePath || undefined,
          audioPath: finalAudioPath || undefined,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to save vocabulary");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this vocabulary?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleBatchSubmit = () => {
    const words = batchWords
      .split("\n")
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    if (words.length === 0) {
      alert("Please enter at least one word");
      return;
    }

    createBatchMutation.mutate({ words });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Vocabularies</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setIsBatchMode(!isBatchMode);
              setIsCreating(false);
              setBatchResult(null);
            }}
            className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            {isBatchMode ? "Cancel Batch" : "Batch Import"}
          </button>
          <button
            onClick={() => {
              setIsCreating(!isCreating);
              setIsBatchMode(false);
            }}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            {isCreating ? "Cancel" : "Add New"}
          </button>
        </div>
      </div>

      {isBatchMode && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Batch Import Vocabularies</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Enter words (one per line)
              </label>
              <textarea
                value={batchWords}
                onChange={(e) => setBatchWords(e.target.value)}
                rows={15}
                placeholder="apple&#10;banana&#10;orange&#10;..."
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono"
              />
              <p className="mt-1 text-sm text-gray-500">
                Total: {batchWords.split("\n").filter((w) => w.trim().length > 0).length} words
              </p>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleBatchSubmit}
                disabled={createBatchMutation.isPending || batchWords.trim().length === 0}
                className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {createBatchMutation.isPending ? "Importing..." : "Import"}
              </button>
              <button
                onClick={() => {
                  setBatchWords("");
                  setBatchResult(null);
                }}
                className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
              >
                Clear
              </button>
            </div>

            {batchResult && (
              <div className="rounded-md bg-blue-50 p-4">
                <h3 className="font-semibold text-blue-900">Import Results:</h3>
                <ul className="mt-2 space-y-1 text-sm text-blue-800">
                  <li>✓ Created: {batchResult.created} words</li>
                  <li>⊘ Skipped (already exists): {batchResult.skipped} words</li>
                  {batchResult.errors.length > 0 && (
                    <li className="text-red-600">✗ Errors: {batchResult.errors.length}</li>
                  )}
                </ul>
                {batchResult.errors.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium text-red-600">
                      Show errors
                    </summary>
                    <ul className="mt-1 list-inside list-disc text-xs text-red-700">
                      {batchResult.errors.map((error: string, i: number) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {isCreating && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">
            {editingId ? "Edit Vocabulary" : "Add New Vocabulary"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Word *
              </label>
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Image
              </label>

              <div className="mt-2 flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="block w-full"
                />

                <button
                  type="button"
                  onClick={() => setPasteMode(!pasteMode)}
                  className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition ${
                    pasteMode
                      ? "bg-green-600 text-white ring-2 ring-green-400"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {pasteMode ? "✓ Paste Mode" : "Enable Paste"}
                </button>
              </div>

              {pasteMode && (
                <div className="mt-2 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                  📋 Paste mode enabled! Press <kbd className="rounded bg-blue-100 px-2 py-1 font-mono">Ctrl/Cmd + V</kbd> to paste an image from clipboard
                </div>
              )}

              {(imagePreview || imagePath) && (
                <div className="mt-3">
                  <p className="mb-2 text-sm font-medium text-gray-700">Preview:</p>
                  <img
                    src={imagePreview || imagePath}
                    alt="Preview"
                    className="h-32 w-32 rounded-lg border-2 border-gray-200 object-cover shadow-sm"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Audio
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full"
              />
              {audioPath && !audioFile && (
                <div className="mt-2">
                  <audio src={audioPath} controls className="w-full" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={uploading || createMutation.isPending || updateMutation.isPending}
                className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : editingId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Word
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Audio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Example Sentences
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Note
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {vocabularies?.map((vocab) => (
                <tr key={vocab.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {vocab.word}
                  </td>
                  <td className="px-6 py-4">
                    {vocab.imagePath && (
                      <button
                        type="button"
                        onClick={() =>
                          vocab.imagePath && setLightboxImage({ src: vocab.imagePath, alt: vocab.word })
                        }
                        className="group block"
                      >
                        <img
                          src={vocab.imagePath}
                          alt={vocab.word}
                          className="h-12 w-12 rounded object-cover ring-1 ring-gray-200 transition group-hover:ring-2 group-hover:ring-indigo-500"
                        />
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {vocab.audioPath && (
                      <audio src={vocab.audioPath} controls className="w-40" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {vocab.exampleSentences && vocab.exampleSentences.length > 0 ? (
                      <div className="space-y-2">
                        {vocab.exampleSentences.map((sentence: any) => (
                          <div key={sentence.id} className="flex items-start gap-2">
                            <div className="flex-1">
                              <p className="text-sm text-gray-700">{sentence.sentence}</p>
                            </div>
                            {sentence.audioPath && (
                              <audio src={sentence.audioPath} controls className="w-32" />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No sentences</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {vocab.note}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <button
                      onClick={() => handleEdit(vocab)}
                      className="mr-2 text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(vocab.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -right-3 -top-3 rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-700 shadow-lg hover:bg-gray-100"
            >
              ✕
            </button>
            <img
              src={lightboxImage.src}
              alt={lightboxImage.alt}
              className="max-h-[80vh] max-w-full rounded-lg shadow-2xl"
            />
            <p className="mt-3 text-center text-sm font-medium text-white">
              {lightboxImage.alt}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
