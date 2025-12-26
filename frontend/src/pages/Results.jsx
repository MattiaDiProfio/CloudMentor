import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, XCircle, Trophy, Clock, Home } from "lucide-react";

const API_URL = "http://localhost:8000";

export default function Results() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [results, setResults] = useState(location.state?.results || null);
  const [loading, setLoading] = useState(!results);

  useEffect(() => {
    if (!results) {
      // If no results in state, we could fetch from backend
      // For now, show error
      setLoading(false);
    }
  }, [examId, results]);

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Calculating results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No results found</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Results Card */}
      <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
        <div className="text-center mb-8">
          {results.passed ? (
            <Trophy className="w-20 h-20 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          )}

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {results.passed ? "Congratulations!" : "Keep Practicing!"}
          </h1>
          <p className="text-gray-600">
            {results.passed
              ? "You have passed the AWS Developer Associate practice exam!"
              : "You did not pass this time, but you can try again."}
          </p>
        </div>

        {/* Score Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-600 text-sm mb-2">Your Score</p>
            <p className="text-4xl font-bold text-gray-900">
              {results.score} / {results.total_possible}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-600 text-sm mb-2">Percentage</p>
            <p
              className={`text-4xl font-bold ${
                results.passed ? "text-green-600" : "text-red-600"
              }`}
            >
              {results.percentage}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Passing: 72%</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-600 text-sm mb-2">Duration</p>
            <p className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <Clock className="w-8 h-8" />
              {formatDuration(results.duration_seconds)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Score Breakdown</span>
            <span>{results.score} correct</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                results.passed ? "bg-green-500" : "bg-red-500"
              }`}
              style={{ width: `${results.percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span className="font-semibold">72% (Passing)</span>
            <span>100%</span>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Recommendations
          </h3>
          <ul className="space-y-2 text-blue-800">
            {!results.passed && (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>
                    Review the explanations for questions you got wrong
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>
                    Focus on weak areas identified in the review section
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Take another practice exam after studying</span>
                </li>
              </>
            )}
            {results.passed && (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>
                    Review any questions you got wrong to strengthen knowledge
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Continue practicing to maintain your skill level</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Consider taking the actual AWS certification exam</span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(`/review/${examId}`)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <CheckCircle className="w-5 h-5" />
            Review Answers
          </button>

          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            <Home className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
