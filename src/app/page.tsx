"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "~/lib/trpc/client";
import { useRouter } from "next/navigation";

export default function LearningPage() {
  const router = useRouter();
  const [isLearning, setIsLearning] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [currentQuestionType, setCurrentQuestionType] = useState<"image-to-word" | "word-to-image" | "sentence-to-word" | null>(null);
  const [sentenceData, setSentenceData] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: userState, refetch: refetchUserState } =
    api.learning.getUserState.useQuery();

  const startLearningMutation = api.learning.startLearning.useMutation({
    onSuccess: (data) => {
      setIsLearning(true);
      setCurrentQuestion(data.question);
      setCurrentQuestionType(data.questionType);
      setSentenceData(data.sentenceData || null);
      setOptions(data.options || []);
      setSelectedAnswer(null);
      setShowResult(false);

      // Play audio
      if (data.questionType === "word-to-image" && data.question.audioPath) {
        playAudio(data.question.audioPath);
      } else if (data.questionType === "image-to-word" && data.question.audioPath) {
        // 自动播放单词读音
        playAudio(data.question.audioPath);
      } else if (data.questionType === "sentence-to-word" && data.sentenceData?.audioPath) {
        // 自动播放例句语音
        playAudio(data.sentenceData.audioPath);
      }
    },
  });

  const stopLearningMutation = api.learning.stopLearning.useMutation({
    onSuccess: () => {
      setIsLearning(false);
      setCurrentQuestion(null);
      setOptions([]);
      refetchUserState();
    },
  });

  const submitAnswerMutation = api.learning.submitAnswer.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setShowResult(true);
      refetchUserState();

      // 播放单词语音
      if (currentQuestion?.audioPath) {
        playAudio(currentQuestion.audioPath);
      }

      // 开始3秒倒计时
      console.log("🔄 Starting 3-second countdown...");
      setCountdown(3);
      let timeLeft = 3;

      const timer = setInterval(() => {
        timeLeft -= 1;
        console.log(`⏱️ Countdown: ${timeLeft}`);
        setCountdown(timeLeft);

        if (timeLeft <= 0) {
          console.log("✅ Countdown complete, loading next question...");
          clearInterval(timer);
          // 使用 data 而不是依赖 state
          if (data?.nextQuestion) {
            console.log("📝 Next question found:", data.nextQuestion.question.word);
            setCurrentQuestion(data.nextQuestion.question);
            setCurrentQuestionType(data.nextQuestion.questionType);
            setSentenceData(data.nextQuestion.sentenceData || null);
            setOptions(data.nextQuestion.options || []);
            setSelectedAnswer(null);
            setShowResult(false);
            setResult(null);
            setCountdown(null);

            // Play audio for next question
            if (
              data.nextQuestion.questionType === "word-to-image" &&
              data.nextQuestion.question.audioPath
            ) {
              playAudio(data.nextQuestion.question.audioPath);
            } else if (
              data.nextQuestion.questionType === "image-to-word" &&
              data.nextQuestion.question.audioPath
            ) {
              playAudio(data.nextQuestion.question.audioPath);
            } else if (
              data.nextQuestion.questionType === "sentence-to-word" &&
              data.nextQuestion.sentenceData?.audioPath
            ) {
              playAudio(data.nextQuestion.sentenceData.audioPath);
            }
          } else {
            console.log("⚠️ No next question available");
          }
        }
      }, 1000);

      countdownTimerRef.current = timer;
    },
  });

  const playAudio = (path: string) => {
    if (audioRef.current) {
      audioRef.current.src = path;
      audioRef.current.play();
    }
  };

  const handleStartLearning = () => {
    startLearningMutation.mutate();
  };

  const handleStopLearning = () => {
    stopLearningMutation.mutate();
  };

  const handleAnswerSelect = (answer: string) => {
    // 如果已经显示结果，不允许再次选择
    if (showResult) return;

    setSelectedAnswer(answer);

    // 立即提交答案
    if (!currentQuestion || !currentQuestionType) return;

    submitAnswerMutation.mutate({
      questionId: currentQuestion.id,
      answer: answer,
      questionType: currentQuestionType,
    });
  };

  const handleNextQuestion = () => {
    // 清除倒计时
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);

    if (result?.nextQuestion) {
      setCurrentQuestion(result.nextQuestion.question);
      setCurrentQuestionType(result.nextQuestion.questionType);
      setSentenceData(result.nextQuestion.sentenceData || null);
      setOptions(result.nextQuestion.options || []);
      setSelectedAnswer(null);
      setShowResult(false);
      setResult(null);

      // Play audio
      if (
        result.nextQuestion.questionType === "word-to-image" &&
        result.nextQuestion.question.audioPath
      ) {
        playAudio(result.nextQuestion.question.audioPath);
      } else if (
        result.nextQuestion.questionType === "image-to-word" &&
        result.nextQuestion.question.audioPath
      ) {
        playAudio(result.nextQuestion.question.audioPath);
      } else if (
        result.nextQuestion.questionType === "sentence-to-word" &&
        result.nextQuestion.sentenceData?.audioPath
      ) {
        playAudio(result.nextQuestion.sentenceData.audioPath);
      }
    }
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Use the local state for questionType instead of userState
  const questionType = currentQuestionType;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <audio ref={audioRef} />

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white">
                  👤
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Points</span>
                <span className="text-2xl font-bold text-gray-900">
                  {userState?.currentPoints || 0}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Rewards</span>
                <span className="text-2xl font-bold text-green-600">
                  ${userState?.currentReward.toFixed(2) || "0.00"}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => router.push("/history")}
                className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              >
                History
              </button>
              <button
                onClick={() => router.push("/admin")}
                className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-12">
        {!isLearning ? (
          <div className="text-center">
            <button
              onClick={handleStartLearning}
              disabled={startLearningMutation.isPending}
              className="rounded-full bg-gradient-to-r from-green-500 to-green-600 px-16 py-8 text-3xl font-bold text-white shadow-2xl transition hover:from-green-600 hover:to-green-700 disabled:opacity-50"
            >
              {startLearningMutation.isPending ? "Loading..." : "Start Earning"}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Question Area */}
            <div className="rounded-2xl bg-white p-8 shadow-xl">
              {questionType === "image-to-word" ? (
                <div className="space-y-6">
                  <h2 className="text-center text-2xl font-semibold text-gray-900">
                    Choose the correct word
                  </h2>
                  {currentQuestion?.imagePath && (
                    <div className="flex justify-center">
                      <img
                        src={currentQuestion.imagePath}
                        alt="Question"
                        className="max-h-64 rounded-lg object-contain"
                      />
                    </div>
                  )}
                </div>
              ) : questionType === "word-to-image" ? (
                <div className="space-y-6">
                  <h2 className="text-center text-2xl font-semibold text-gray-900">
                    Choose the correct image for:
                  </h2>
                  <div className="text-center text-4xl font-bold text-indigo-600">
                    {currentQuestion?.word}
                  </div>
                </div>
              ) : questionType === "sentence-to-word" ? (
                <div className="space-y-6">
                  <h2 className="text-center text-2xl font-semibold text-gray-900">
                    Listen and fill in the blank
                  </h2>
                  <div className="text-center text-3xl font-medium text-gray-800">
                    {sentenceData?.sentenceWithBlank}
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() => sentenceData?.audioPath && playAudio(sentenceData.audioPath)}
                      className="rounded-full bg-indigo-600 p-4 text-white hover:bg-indigo-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Result Display */}
              {showResult && (
                <div
                  className={`mt-6 rounded-lg p-4 ${
                    result.isCorrect ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  <p
                    className={`text-center text-xl font-semibold ${
                      result.isCorrect ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {result.isCorrect ? "✓ Correct!" : "✗ Wrong!"}
                  </p>
                  {!result.isCorrect && (
                    <p className="mt-2 text-center text-gray-700">
                      Correct answer: <strong>{result.correctAnswer}</strong>
                    </p>
                  )}
                  {countdown !== null && countdown > 0 && (
                    <div className="mt-4 text-center">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg">
                        <span className="text-2xl font-bold text-indigo-600">
                          {countdown}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        Next question in {countdown}s...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {questionType === "image-to-word" || questionType === "sentence-to-word"
                ? options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleAnswerSelect(option.word)}
                      disabled={showResult}
                      className={`rounded-lg border-2 p-6 text-xl font-semibold transition ${
                        selectedAnswer === option.word
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-300 bg-white hover:border-indigo-400"
                      } disabled:opacity-50`}
                    >
                      {option.word}
                    </button>
                  ))
                : options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleAnswerSelect(option.word)}
                      disabled={showResult}
                      className={`rounded-lg border-2 p-4 transition ${
                        selectedAnswer === option.word
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-300 bg-white hover:border-indigo-400"
                      } disabled:opacity-50`}
                    >
                      {option.imagePath && (
                        <img
                          src={option.imagePath}
                          alt={option.word}
                          className="h-32 w-full rounded object-contain"
                        />
                      )}
                    </button>
                  ))}
            </div>

            {/* Manual Next Button (optional - can skip if timeout is active) */}
            {showResult && countdown !== null && countdown > 0 && (
              <div className="text-center">
                <button
                  onClick={handleNextQuestion}
                  className="rounded-lg bg-indigo-600 px-8 py-3 text-lg font-semibold text-white hover:bg-indigo-700"
                >
                  Skip Wait →
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="flex justify-around rounded-lg bg-white p-6 shadow">
              <div className="text-center">
                <p className="text-sm text-gray-500">Correct</p>
                <p className="text-2xl font-bold text-green-600">
                  {userState?.sessionCorrect || 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Wrong</p>
                <p className="text-2xl font-bold text-red-600">
                  {userState?.sessionWrong || 0}
                </p>
              </div>
              {showResult && (
                <>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Points Change</p>
                    <p
                      className={`text-2xl font-bold ${
                        result.pointChange > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {result.pointChange > 0 ? "+" : ""}
                      {result.pointChange}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Rewards</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${result.newReward.toFixed(2)}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Stop Learning */}
            <div className="text-center">
              <button
                onClick={handleStopLearning}
                disabled={stopLearningMutation.isPending}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Stop Learning
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
