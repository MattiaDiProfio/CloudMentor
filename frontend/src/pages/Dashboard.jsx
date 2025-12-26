import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Award, Target, Clock, Download } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

const API_URL = "http://localhost:8000";

export default function Dashboard() {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState("Overall");
  const navigate = useNavigate();

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${API_URL}/api/statistics`);
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const startNewExam = async () => {
    setStarting(true);
    try {
      const response = await fetch(`${API_URL}/api/exam/start`, {
        method: "POST",
      });
      const data = await response.json();
      navigate(`/exam/${data.exam_id}`);
    } catch (error) {
      console.error("Error starting exam:", error);
      alert("Failed to start exam. Please try again.");
      setStarting(false);
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/export/csv`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "exam_results.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  const getChartData = () => {
    if (!statistics || !statistics.domain_trends) return [];

    const trend = statistics.domain_trends.find(
      (t) => t.domain === selectedDomain
    );
    if (!trend) return [];

    return trend.data_points.map((point) => ({
      date: new Date(point.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      percentage: point.percentage,
    }));
  };

  const getDomainColor = (domain) => {
    const colors = {
      Overall: "#6366f1",
      Compute: "#10b981",
      Storage: "#f59e0b",
      Databases: "#8b5cf6",
      "Networking & Content Delivery": "#ef4444",
      Analytics: "#06b6d4",
      "Management & Governance": "#ec4899",
      "Developer Tools": "#14b8a6",
      Containers: "#f97316",
      "Security Identity & Compliance": "#a855f7",
      "Application Integration": "#84cc16",
    };
    return colors[domain] || "#6366f1";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const chartData = getChartData();
  const availableDomains = statistics?.domain_trends?.map((t) => t.domain) || [
    "Overall",
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          AWS Developer Associate
        </h1>
        <p className="text-xl text-gray-600">DVA-C02 Practice Exam</p>
      </div>

      {/* Export Button - Centered */}
      {statistics?.total_exams > 0 && (
        <div className="flex justify-center mb-8">
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Target className="w-6 h-6" />}
          label="Total Exams"
          value={statistics?.total_exams || 0}
          color="bg-blue-500"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Average Score"
          value={
            statistics?.average_score ? `${statistics.average_score}%` : "N/A"
          }
          color="bg-green-500"
        />
        <StatCard
          icon={<Award className="w-6 h-6" />}
          label="Pass Rate"
          value={statistics?.pass_rate ? `${statistics.pass_rate}%` : "N/A"}
          color="bg-purple-500"
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          label="Best Score"
          value={statistics?.best_score ? `${statistics.best_score}%` : "N/A"}
          color="bg-yellow-500"
        />
      </div>

      {/* Performance Chart */}
      {statistics?.total_exams > 0 && chartData.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Performance Over Time
            </h3>

            {/* Domain Selector */}
            <div className="flex flex-wrap gap-2">
              {availableDomains.map((domain) => (
                <button
                  key={domain}
                  onClick={() => setSelectedDomain(domain)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedDomain === domain
                      ? "text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  style={{
                    backgroundColor:
                      selectedDomain === domain
                        ? getDomainColor(domain)
                        : undefined,
                  }}
                >
                  {domain}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient
                  id={`colorGradient-${selectedDomain}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={getDomainColor(selectedDomain)}
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="100%"
                    stopColor={getDomainColor(selectedDomain)}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                label={{
                  value: "Score (%)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Area
                type="monotone"
                dataKey="percentage"
                stroke={getDomainColor(selectedDomain)}
                strokeWidth={3}
                fill={`url(#colorGradient-${selectedDomain})`}
                dot={{
                  fill: getDomainColor(selectedDomain),
                  r: 5,
                  strokeWidth: 2,
                  stroke: "#fff",
                }}
                activeDot={{ r: 7 }}
              />
              {/* Passing line - only show for Overall */}
              {selectedDomain === "Overall" && (
                <Line
                  type="monotone"
                  dataKey={() => 72}
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>

          <div className="mt-4 text-sm text-gray-600 text-center">
            Tracking {chartData.length} exam{chartData.length !== 1 ? "s" : ""}{" "}
            for {selectedDomain}
          </div>
        </div>
      )}

      {/* Start Exam Button */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Ready to test your knowledge?
        </h2>
        <p className="text-gray-600 mb-6">
          This exam contains 65 questions covering all DVA-C02 domains.
          <br />
          Passing score: 72%
        </p>
        <button
          onClick={startNewExam}
          disabled={starting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {starting ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Starting Exam...
            </span>
          ) : (
            "Start New Exam"
          )}
        </button>
      </div>

      {/* Recent Exams */}
      {statistics?.recent_exams && statistics.recent_exams.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Exams
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">
                    Score
                  </th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">
                    Percentage
                  </th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody>
                {statistics.recent_exams.map((exam) => (
                  <tr key={exam.exam_id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(exam.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {exam.score} / {exam.total_possible}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          exam.percentage >= 72
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {exam.percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {exam.passed ? (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          Passed
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                          Failed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-4">
        <div className={`${color} text-white p-3 rounded-lg`}>{icon}</div>
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
