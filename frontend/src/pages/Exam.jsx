import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2, Clock, Flag } from "lucide-react";

const API_URL = "http://localhost:8000";
const EXAM_DURATION_SECONDS = 130 * 60; // 130 minutes, the standard AWS exam time for Associate level certs

export default function Exam() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [allAnswers, setAllAnswers] = useState({});
  const [answerRequirements, setAnswerRequirements] = useState({}); // Track num_correct for each question
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [questionCache, setQuestionCache] = useState({});
  const latestRequestedIndex = useRef(0);
  const [progress, setProgress] = useState({ generated_count: 0, total: 65 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(EXAM_DURATION_SECONDS);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isDiscarded, setIsDiscarded] = useState(false);

  // Timer effect
  useEffect(() => {
    if (isDiscarded) return; // Don't run timer if exam is discarded

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up - auto submit
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isDiscarded]);

  useEffect(() => {
    if (isDiscarded) return; // Don't poll if exam is discarded

    // Poll for progress
    const progressInterval = setInterval(checkProgress, 1000);
    return () => clearInterval(progressInterval);
  }, [isDiscarded]);

  useEffect(() => {
    if (progress.generated_count > currentQuestionIndex) {
      loadQuestion(currentQuestionIndex);
    }
    // Try prefetching next question if available
    if (progress.generated_count > currentQuestionIndex + 1) {
      prefetchQuestion(currentQuestionIndex + 1);
    }
  }, [currentQuestionIndex, progress]);

  // Auto-load first question as soon as it's available
  useEffect(() => {
    if (
      progress.generated_count >= 1 &&
      currentQuestionIndex === 0 &&
      !currentQuestion
    ) {
      loadQuestion(0);
    }
  }, [progress.generated_count]);

  const checkProgress = async () => {
    try {
      const response = await fetch(`${API_URL}/api/exam/${examId}/progress`);
      const data = await response.json();
      setProgress(data);
    } catch (error) {
      console.error("Error checking progress:", error);
    }
  };

  const loadQuestion = async (index) => {
    // Remember the most recent index request so we can ignore stale responses
    latestRequestedIndex.current = index;

    // If cached, use immediately
    if (questionCache[index]) {
      const data = questionCache[index];
      if (latestRequestedIndex.current === index) {
        setCurrentQuestion(data);
        setSelectedAnswers(allAnswers[index] || []);
        setAnswerRequirements((prev) => ({
          ...prev,
          [index]: data.num_correct,
        }));
      }
      // Prefetch next
      prefetchQuestion(index + 1);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/exam/${examId}/question/${index}`
      );
      if (response.ok) {
        const data = await response.json();
        // cache it
        setQuestionCache((p) => ({ ...p, [index]: data }));

        // Only apply to current view if still relevant
        if (latestRequestedIndex.current === index) {
          setCurrentQuestion(data);
          setSelectedAnswers(allAnswers[index] || []);
          setAnswerRequirements((prev) => ({
            ...prev,
            [index]: data.num_correct,
          }));
        }

        // Prefetch next question
        prefetchQuestion(index + 1);
      }
    } catch (error) {
      console.error("Error loading question:", error);
    } finally {
      setLoading(false);
    }
  };

  const prefetchQuestion = async (index) => {
    if (index < 0 || index >= progress.generated_count) return;
    if (questionCache[index]) return;
    try {
      const response = await fetch(
        `${API_URL}/api/exam/${examId}/question/${index}`
      );
      if (response.ok) {
        const data = await response.json();
        setQuestionCache((p) => ({ ...p, [index]: data }));
      }
    } catch (e) {
      // ignore prefetch errors
    }
  };

  const handleAnswerToggle = (option) => {
    if (!currentQuestion) return;

    const maxAnswers = currentQuestion.num_correct;
    let newSelectedAnswers = [...selectedAnswers];

    if (newSelectedAnswers.includes(option)) {
      newSelectedAnswers = newSelectedAnswers.filter((a) => a !== option);
    } else {
      if (maxAnswers === 1) {
        newSelectedAnswers = [option];
      } else if (newSelectedAnswers.length < maxAnswers) {
        newSelectedAnswers = [...newSelectedAnswers, option];
      }
    }

    // Update both local state and allAnswers immediately
    setSelectedAnswers(newSelectedAnswers);
    setAllAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: newSelectedAnswers,
    }));
  };

  const saveAnswer = async () => {
    if (selectedAnswers.length === 0) return;

    try {
      await fetch(`${API_URL}/api/exam/${examId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: currentQuestionIndex,
          selected_answers: selectedAnswers,
        }),
      });
    } catch (error) {
      console.error("Error saving answer:", error);
    }
  };

  const goToQuestion = (index) => {
    if (index >= progress.generated_count) return;
    // Save in background and navigate immediately for snappy UX
    saveAnswer().catch((e) => console.error("Save failed:", e));
    latestRequestedIndex.current = index;
    setCurrentQuestionIndex(index);
    loadQuestion(index);
  };

  const goToNextQuestion = () => {
    saveAnswer().catch((e) => console.error("Save failed:", e));
    if (currentQuestionIndex < progress.total - 1) {
      const next = currentQuestionIndex + 1;
      latestRequestedIndex.current = next;
      setCurrentQuestionIndex(next);
      loadQuestion(next);
    }
  };

  const goToPreviousQuestion = () => {
    saveAnswer().catch((e) => console.error("Save failed:", e));
    if (currentQuestionIndex > 0) {
      const prev = currentQuestionIndex - 1;
      latestRequestedIndex.current = prev;
      setCurrentQuestionIndex(prev);
      loadQuestion(prev);
    }
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    await saveAnswer();

    try {
      const response = await fetch(`${API_URL}/api/exam/${examId}/submit`, {
        method: "POST",
      });
      const results = await response.json();
      navigate(`/results/${examId}`, { state: { results } });
    } catch (error) {
      console.error("Error submitting exam:", error);
    }
  };

  const toggleMarkForReview = () => {
    const newMarked = new Set(markedForReview);
    if (newMarked.has(currentQuestionIndex)) {
      newMarked.delete(currentQuestionIndex);
    } else {
      newMarked.add(currentQuestionIndex);
    }
    setMarkedForReview(newMarked);
  };

  const discardExam = () => {
    setShowDiscardModal(true);
  };

  const confirmDiscard = async () => {
    setShowDiscardModal(false);
    setIsDiscarded(true); // Mark exam as discarded to stop all background tasks

    // Cancel question generation on backend
    try {
      await fetch(`${API_URL}/api/exam/${examId}/cancel`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error cancelling exam:", error);
    }

    navigate("/");
  };

  const submitExam = async () => {
    setShowSubmitModal(true);
  };

  const confirmSubmit = async () => {
    setShowSubmitModal(false);
    setSubmitting(true);
    await saveAnswer();

    try {
      const response = await fetch(`${API_URL}/api/exam/${examId}/submit`, {
        method: "POST",
      });
      const results = await response.json();
      navigate(`/results/${examId}`, { state: { results } });
    } catch (error) {
      console.error("Error submitting exam:", error);
      alert("Failed to submit exam. Please try again.");
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getQuestionButtonStyle = (index) => {
    const isGenerated = index < progress.generated_count;
    const answers = allAnswers[index] || [];
    const isMarked = markedForReview.has(index);
    const isCurrent = index === currentQuestionIndex;

    // Determine if question is fully answered
    let isFullyAnswered = false;
    if (index === currentQuestionIndex && currentQuestion) {
      // Current question: check against actual requirement
      isFullyAnswered = answers.length === currentQuestion.num_correct;
    } else if (answerRequirements[index]) {
      // Previously visited question: check against stored requirement
      isFullyAnswered = answers.length === answerRequirements[index];
    } else {
      // Not yet visited: consider answered if has any answers (shouldn't happen normally)
      isFullyAnswered = answers.length > 0;
    }

    let className =
      "w-10 h-10 rounded-full font-medium transition-all flex items-center justify-center text-sm ";

    if (!isGenerated) {
      className += "bg-gray-300 text-gray-500 cursor-not-allowed";
    } else if (isCurrent) {
      if (isMarked && isFullyAnswered) {
        className +=
          "bg-white text-gray-900 border-2 border-pink-500 ring-4 ring-pink-200";
      } else if (isMarked) {
        className +=
          "bg-white text-gray-900 border-2 border-pink-500 ring-4 ring-pink-200";
      } else if (isFullyAnswered) {
        className +=
          "bg-white text-gray-900 border-2 border-green-500 ring-4 ring-green-200";
      } else {
        className += "bg-indigo-600 text-white ring-4 ring-indigo-200";
      }
    } else if (isMarked) {
      className +=
        "bg-white text-gray-900 border-2 border-pink-500 hover:bg-pink-50";
    } else if (isFullyAnswered) {
      className +=
        "bg-white text-gray-900 border-2 border-green-500 hover:bg-green-50";
    } else {
      className +=
        "bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-50";
    }

    return className;
  };

  const isNextDisabled = currentQuestionIndex >= progress.generated_count - 1;
  const isLastQuestion = currentQuestionIndex === progress.total - 1;

  if (loading && !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header with Timer */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                AWS DVA-C02 Practice Exam
              </h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {progress.total}
              </p>
            </div>

            {/* Timer */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-semibold ${
                timeRemaining < 600
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              <Clock className="w-5 h-5" />
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>
                  Progress: {Object.keys(allAnswers).length} / {progress.total}{" "}
                  answered
                </span>
                <span>
                  Generated: {progress.generated_count} / {progress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      (Object.keys(allAnswers).length / progress.total) * 100
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Question Card */}
            {currentQuestion ? (
              <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
                <div className="mb-6 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Question {currentQuestionIndex + 1}
                    </h2>
                    {currentQuestion.num_correct > 1 && (
                      <p className="text-sm text-indigo-600 font-medium">
                        Select {currentQuestion.num_correct} answers
                      </p>
                    )}
                  </div>

                  {/* "Mark Question for Review" Button */}
                  <button
                    onClick={toggleMarkForReview}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition ${
                      markedForReview.has(currentQuestionIndex)
                        ? "border-pink-500 bg-pink-50 text-pink-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Flag className="w-4 h-4" />
                    {markedForReview.has(currentQuestionIndex)
                      ? "Marked"
                      : "Mark for Review"}
                  </button>
                </div>

                <p className="text-lg text-gray-800 mb-6 leading-relaxed">
                  {currentQuestion.question}
                </p>

                <div className="space-y-3">
                  {Object.entries(currentQuestion.options).map(
                    ([key, value]) => (
                      <button
                        key={key}
                        onClick={() => handleAnswerToggle(key)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          selectedAnswers.includes(key)
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                              selectedAnswers.includes(key)
                                ? "border-indigo-600 bg-indigo-600"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedAnswers.includes(key) && (
                              <svg
                                className="w-4 h-4 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">
                              {key}.
                            </span>
                            <span className="ml-2 text-gray-800">{value}</span>
                          </div>
                        </div>
                      </button>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-8 mb-6 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                <p className="text-gray-600">
                  Generating question {currentQuestionIndex + 1}...
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Please wait while we prepare your next question
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              {isLastQuestion ? (
                <button
                  onClick={submitExam}
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Exam"
                  )}
                </button>
              ) : (
                <button
                  onClick={goToNextQuestion}
                  disabled={isNextDisabled}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {isNextDisabled && !isLastQuestion && (
              <p className="text-center text-sm text-amber-600 mt-4">
                Next question is being generated. Please wait...
              </p>
            )}
          </div>

          {/* Question Palette Sidebar */}
          <div className="w-80 bg-white rounded-lg shadow-lg p-8 h-fit sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-6">
              Question Palette
            </h3>

            {/* Legend */}
            <div className="mb-6 space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white"></div>
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-green-500 bg-white"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-pink-500 bg-white"></div>
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                <span>Not Available</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600"></div>
                <span>Current</span>
              </div>
            </div>

            {/* Question Grid */}
            <div className="grid grid-cols-5 px-3 gap-3 max-h-96 overflow-y-auto mb-6">
              {Array.from({ length: progress.total }, (_, i) => (
                <button
                  key={i}
                  onClick={() => goToQuestion(i)}
                  disabled={i >= progress.generated_count}
                  className={`${getQuestionButtonStyle(i)} m-1`}
                  title={`Question ${i + 1}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Discard Exam Button */}
            <button
              onClick={discardExam}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition border-2 border-red-300 font-medium"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Discard Exam
            </button>
          </div>
        </div>
      </div>

      {/* Discard Exam Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Discard Exam?
              </h3>
              <p className="text-gray-600">
                All your progress will be lost. You have answered{" "}
                {Object.keys(allAnswers).length} out of {progress.total}{" "}
                questions.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDiscardModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDiscard}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Exam Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Submit Exam?
              </h3>
              <p className="text-gray-600 mb-4">
                You have answered {Object.keys(allAnswers).length} out of{" "}
                {progress.total} questions.
              </p>
              {Object.keys(allAnswers).length < progress.total && (
                <p className="text-amber-600 text-sm font-medium">
                  ⚠️ {progress.total - Object.keys(allAnswers).length} questions
                  are unanswered and will be marked as incorrect.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
