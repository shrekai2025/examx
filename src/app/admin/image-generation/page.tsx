"use client";

import { useEffect, useState } from "react";
import { api } from "~/lib/trpc/client";

export default function ImageGenerationPage() {
  const utils = api.useUtils();

  const { data: imageSettings } = api.config.getImageSettings.useQuery();
  const {
    data: stats,
    refetch: refetchStats,
    isLoading: statsLoading,
  } = api.imageGeneration.stats.useQuery();

  const updateApiKeyMutation = api.config.updateImageSettings.useMutation({
    onSuccess: (data) => {
      alert("API Key已更新");
      utils.config.getImageSettings.invalidate();
      setApiKeyInput("");
      setShowApiKeyForm(false);
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const generateMutation = api.imageGeneration.generateMissing.useMutation({
    onSuccess: (result) => {
      setGenerationResult(result);
      alert(`成功生成 ${result.generated} 张图片，失败 ${result.failed} 张`);
      utils.imageGeneration.stats.invalidate();
      refetchStats();
      utils.vocabulary.getAll.invalidate();
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [generationResult, setGenerationResult] = useState<{
    total: number;
    generated: number;
    failed: number;
    results: Array<{
      vocabularyId: string;
      word: string;
      success: boolean;
      imagePath?: string;
      error?: string;
    }>;
  } | null>(null);

  useEffect(() => {
    if (imageSettings?.hasApiKey) {
      setShowApiKeyForm(false);
    }
  }, [imageSettings]);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
      alert("请输入有效的API Key");
      return;
    }
    updateApiKeyMutation.mutate({ apiKey: apiKeyInput.trim() });
  };

  const handleClearApiKey = () => {
    if (
      confirm(
        "确定要清除当前的API Key吗？清除后将无法生成新图片，直到重新配置。"
      )
    ) {
      updateApiKeyMutation.mutate({ clear: true });
      setGenerationResult(null);
    }
  };

  const handleGenerateImages = async () => {
    if (!imageSettings?.hasApiKey) {
      alert("请先配置API Key");
      return;
    }

    if (stats?.missingImages === 0) {
      if (
        !confirm(
          "当前没有缺失图片的词汇，仍然要尝试重新生成吗？（可能覆盖已有图片）"
        )
      ) {
        return;
      }
    }

    setGenerationResult(null);
    generateMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">图像生成管理</h1>

      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Zhipu API Key</h2>
            <p className="mt-1 text-sm text-gray-500">
              配置智谱AI图像生成接口的API Key，用于为词汇自动生成配图。
            </p>
          </div>
          {imageSettings?.hasApiKey && !showApiKeyForm && (
            <button
              onClick={() => setShowApiKeyForm(true)}
              className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              更新API Key
            </button>
          )}
        </div>

        {imageSettings?.hasApiKey && !showApiKeyForm && (
          <div className="mt-4 flex items-center justify-between rounded-md border border-green-200 bg-green-50 p-4">
            <div>
              <p className="text-sm text-green-700">
                已配置的API Key：{imageSettings.maskedApiKey}
              </p>
              <p className="mt-1 text-xs text-green-600">
                仅显示部分Key用于确认，如需更换请点击“更新API Key”。
              </p>
            </div>
            <button
              onClick={handleClearApiKey}
              className="rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
              disabled={updateApiKeyMutation.isPending}
            >
              清除API Key
            </button>
          </div>
        )}

        {(showApiKeyForm || !imageSettings?.hasApiKey) && (
          <form onSubmit={handleSaveApiKey} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                新的API Key
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="例如：sk-xxxx"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={updateApiKeyMutation.isPending}
                className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {updateApiKeyMutation.isPending ? "保存中..." : "保存API Key"}
              </button>
              {imageSettings?.hasApiKey && (
                <button
                  type="button"
                  onClick={() => {
                    setShowApiKeyForm(false);
                    setApiKeyInput("");
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  取消
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">批量生成词汇图片</h2>
            <p className="mt-1 text-sm text-gray-500">
              自动为缺少配图的词汇调用智谱AI接口生成图片，最多并发3个请求。
            </p>
          </div>
          <button
            onClick={handleGenerateImages}
            disabled={generateMutation.isPending}
            className="rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {generateMutation.isPending ? "生成中..." : "生成缺失图片"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title="词汇总数" value={stats?.totalVocabularies ?? 0} loading={statsLoading} />
          <StatCard title="缺图词汇" value={stats?.missingImages ?? 0} loading={statsLoading} />
          <StatCard
            title="上次生成结果"
            value={
              generationResult
                ? `${generationResult.generated} 成功 / ${generationResult.failed} 失败`
                : "-"
            }
            loading={false}
          />
        </div>

        {generationResult && generationResult.results.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800">详细结果</h3>
            <div className="mt-3 max-h-64 overflow-y-auto rounded-md border">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">词汇</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">状态</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">说明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {generationResult.results.map((item) => (
                    <tr key={item.vocabularyId}>
                      <td className="px-4 py-2 font-medium text-gray-900">{item.word}</td>
                      <td className="px-4 py-2">
                        {item.success ? (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                            成功
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                            失败
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {item.success
                          ? `已保存到 ${item.imagePath}`
                          : item.error ?? "未知错误"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  loading,
}: {
  title: string;
  value: number | string;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">
        {loading ? "加载中..." : value}
      </p>
    </div>
  );
}
