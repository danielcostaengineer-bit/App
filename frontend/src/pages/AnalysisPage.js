import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft, TrendingUp, AlertCircle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AnalysisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalysis();
  }, [id]);

  const loadAnalysis = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/analysis/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalysis(response.data);
    } catch (error) {
      console.error('Error loading analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading analysis...</div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Analysis not found</div>
      </div>
    );
  }

  const getMuscleColor = (level) => {
    if (level === 'strong') return 'text-green-400 bg-green-400/10';
    if (level === 'moderate') return 'text-sky-400 bg-sky-400/10';
    return 'text-orange-400 bg-orange-400/10';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button
            data-testid="back-to-dashboard-btn"
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left: Image Viewport (70%) */}
          <div className="lg:col-span-8">
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg border border-slate-800 p-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2" data-testid="analysis-heading">
                  Body Analysis
                </h1>
                <p className="text-slate-400">
                  {new Date(analysis.analysis_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>

              {analysis.image_base64 && (
                <div className="rounded-lg overflow-hidden border border-slate-800 mb-6">
                  <img
                    src={`data:image/jpeg;base64,${analysis.image_base64}`}
                    alt="Body analysis"
                    className="w-full h-auto"
                    data-testid="analysis-image"
                  />
                </div>
              )}

              {/* Overall Assessment */}
              {analysis.overall_assessment && (
                <div className="bg-sky-400/10 border border-sky-400/20 rounded-lg p-6">
                  <h3 className="font-bold text-sky-400 mb-2">Overall Assessment</h3>
                  <p className="text-slate-300">{analysis.overall_assessment}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Metrics Sidebar (30%) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Progress Score */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg border border-slate-800 p-6" data-testid="progress-score-card">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold">Progress Score</h3>
              </div>
              <div className="text-5xl font-mono font-black text-sky-400 mb-2">
                {analysis.progress_score?.toFixed(0) || 50}
              </div>
              <div className="text-sm text-slate-400">Out of 100</div>
            </div>

            {/* Muscle Groups */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg border border-slate-800 p-6" data-testid="muscle-groups-card">
              <h3 className="font-bold mb-4">Muscle Group Assessment</h3>
              <div className="space-y-3">
                {Object.entries(analysis.muscle_groups || {}).map(([muscle, level]) => (
                  <div key={muscle} className="flex items-center justify-between">
                    <span className="text-slate-300 capitalize">{muscle}</span>
                    <span className={`px-3 py-1 rounded-md text-sm font-medium ${getMuscleColor(level)}`}>
                      {level}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weak Areas */}
            {analysis.weak_areas && analysis.weak_areas.length > 0 && (
              <div className="bg-orange-400/10 border border-orange-400/20 rounded-lg p-6" data-testid="weak-areas-card">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                  <h3 className="font-bold text-orange-400">Focus Areas</h3>
                </div>
                <ul className="space-y-2">
                  {analysis.weak_areas.map((area, index) => (
                    <li key={index} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg border border-slate-800 p-6" data-testid="recommendations-card">
                <h3 className="font-bold mb-4 text-green-400">Recommendations</h3>
                <ul className="space-y-3">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
