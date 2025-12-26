import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Home,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const API_URL = "http://localhost:8000";

export default function Review() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [filter, setFilter] = useState("all"); // 'all', 'correct', 'incorrect'
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReview();
  }, [examId]);

  const fetchReview = async () => {
    try {
      const response = await fetch(`${API_URL}/api/exam/${examId}/review`);
      const data = await response.json();
      setReview(data.questions);
    } catch (error) {
      console.error("Error fetching review:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (questionId) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const getFilteredQuestions = () => {
    if (!review) return [];

    switch (filter) {
      case "correct":
        return review.filter((q) => q.is_correct);
      case "incorrect":
        return review.filter((q) => !q.is_correct);
      default:
        return review;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading review...</p>
        </div>
      </div>
    );
  }

  const filteredQuestions = getFilteredQuestions();
  const correctCount = review?.filter((q) => q.is_correct).length || 0;
  const incorrectCount = review?.filter((q) => !q.is_correct).length || 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Review</h1>
        <p className="text-gray-600">
          Review all questions and see detailed explanations
        </p>
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">Total Questions</p>
            <p className="text-3xl font-bold text-gray-900">
              {review?.length || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">Correct</p>
            <p className="text-3xl font-bold text-green-600">{correctCount}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">Incorrect</p>
            <p className="text-3xl font-bold text-red-600">{incorrectCount}</p>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === "all"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          All ({review?.length || 0})
        </button>
        <button
          onClick={() => setFilter("correct")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === "correct"
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Correct ({correctCount})
        </button>
        <button
          onClick={() => setFilter("incorrect")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === "incorrect"
              ? "bg-red-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Incorrect ({incorrectCount})
        </button>
      </div>

      {/* Questions List */}
      <div className="space-y-4 mb-6">
        {filteredQuestions.map((question) => (
          <div
            key={question.question_id}
            className={`bg-white rounded-lg shadow-lg overflow-hidden border-l-4 ${
              question.is_correct ? "border-green-500" : "border-red-500"
            }`}
          >
            {/* Question Header */}
            <button
              onClick={() => toggleQuestion(question.question_id)}
              className="w-full p-6 text-left hover:bg-gray-50 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {question.is_correct ? (
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                    )}
                    <span className="font-semibold text-gray-900">
                      Question {question.question_id + 1}
                    </span>
                  </div>
                  <p className="text-gray-800 leading-relaxed">
                    {question.question}
                  </p>
                </div>
                {expandedQuestions.has(question.question_id) ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                )}
              </div>
            </button>

            {/* Question Details (Expanded) */}
            {expandedQuestions.has(question.question_id) && (
              <div className="px-6 pb-6 border-t">
                {question.num_correct > 1 && (
                  <p className="text-sm text-indigo-600 font-medium mb-4 mt-4">
                    Select {question.num_correct} answers
                  </p>
                )}

                {/* Options */}
                <div className="space-y-3 mb-6">
                  {Object.entries(question.options).map(([key, value]) => {
                    const isCorrect = question.correct_answers.includes(key);
                    const isUserAnswer = question.user_answers.includes(key);

                    return (
                      <div
                        key={key}
                        className={`p-4 rounded-lg border-2 ${
                          isCorrect && isUserAnswer
                            ? "border-green-500 bg-green-50"
                            : isCorrect
                            ? "border-green-500 bg-green-50"
                            : isUserAnswer
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="font-semibold text-gray-700">
                            {key}.
                          </span>
                          <div className="flex-1">
                            <p className="text-gray-800">{value}</p>
                            <div className="flex gap-2 mt-2">
                              {isCorrect && (
                                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-medium">
                                  Correct Answer
                                </span>
                              )}
                              {isUserAnswer && !isCorrect && (
                                <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full font-medium">
                                  Your Answer
                                </span>
                              )}
                              {isUserAnswer && isCorrect && (
                                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-medium">
                                  Your Answer ✓
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Explanation
                  </h4>
                  <p className="text-blue-800 leading-relaxed">
                    {question.explanation}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Back Button */}
      <div className="text-center">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          <Home className="w-5 h-5" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
