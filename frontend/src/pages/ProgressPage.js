import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProgressPage() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [analysesRes, statsRes] = await Promise.all([
        axios.get(`${API}/analysis/history`, config),
        axios.get(`${API}/progress/stats`, config)
      ]);

      setAnalyses(analysesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Loading progress...</div>
      </div>
    );
  }

  // Prepare chart data
  const progressChartData = analyses.map((a, index) => ({
    date: new Date(a.analysis_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: a.progress_score || 50,
    index: index + 1
  }));

  const muscleData = stats?.muscle_development
    ? Object.entries(stats.muscle_development).map(([muscle, level]) => ({
        muscle: muscle.charAt(0).toUpperCase() + muscle.slice(1),
        value: level === 'strong' ? 100 : level === 'moderate' ? 66 : 33
      }))
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button
            data-testid="back-to-dashboard-btn"
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2" data-testid="progress-heading">
            Progress Tracking
          </h1>
          <p className="text-slate-600">
            Visualize your transformation journey over time
          </p>
        </div>

        {analyses.length === 0 ? (
          <div className="bg-white p-12 rounded-lg border border-slate-200 text-center" data-testid="no-progress-data">
            <p className="text-slate-600">No progress data yet. Upload more photos to see your trends!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border border-slate-200" data-testid="total-analyses-stat">
                <div className="text-4xl font-mono font-bold text-slate-900 mb-1">
                  {stats?.total_analyses || 0}
                </div>
                <div className="text-sm text-slate-600">Total Analyses</div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200" data-testid="streak-stat">
                <div className="text-4xl font-mono font-bold text-orange-500 mb-1">
                  {stats?.current_streak || 0}
                </div>
                <div className="text-sm text-slate-600">Day Streak</div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200" data-testid="improvement-stat">
                <div className="text-4xl font-mono font-bold text-green-500 mb-1">
                  {stats?.improvement_percentage > 0 ? '+' : ''}{stats?.improvement_percentage || 0}%
                </div>
                <div className="text-sm text-slate-600">Overall Improvement</div>
              </div>
            </div>

            {/* Progress Score Chart */}
            <div className="bg-white p-6 rounded-lg border border-slate-200" data-testid="progress-chart">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Progress Score Over Time</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progressChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    dot={{ fill: '#38bdf8', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Muscle Development Chart */}
            {muscleData.length > 0 && (
              <div className="bg-white p-6 rounded-lg border border-slate-200" data-testid="muscle-chart">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Current Muscle Development</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={muscleData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="muscle" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white p-6 rounded-lg border border-slate-200" data-testid="timeline">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Analysis Timeline</h2>
              <div className="space-y-4">
                {analyses.map((analysis, index) => (
                  <div
                    key={analysis.id}
                    data-testid={`timeline-item-${analysis.id}`}
                    className="flex items-start gap-4 pb-4 border-b border-slate-200 last:border-0 cursor-pointer hover:bg-slate-50 p-4 rounded-lg transition-colors"
                    onClick={() => navigate(`/analysis/${analysis.id}`)}
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-sky-400/10 rounded-full flex items-center justify-center">
                      <span className="font-mono font-bold text-sky-400">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-slate-900">
                          {new Date(analysis.analysis_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-2xl font-mono font-bold text-slate-900">
                          {analysis.progress_score?.toFixed(0) || 50}
                        </div>
                      </div>
                      {analysis.weak_areas && analysis.weak_areas.length > 0 && (
                        <div className="text-sm text-slate-600">
                          Focus: {analysis.weak_areas.slice(0, 3).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
