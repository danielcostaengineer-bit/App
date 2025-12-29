import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { LogOut, Camera, TrendingUp, Upload } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [stats, setStats] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [userRes, analysesRes, statsRes] = await Promise.all([
        axios.get(`${API}/auth/me`, config),
        axios.get(`${API}/analysis/history`, config),
        axios.get(`${API}/progress/stats`, config)
      ]);

      setUser(userRes.data);
      setAnalyses(analysesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/analysis/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Analysis complete!');
      navigate(`/analysis/${response.data.id}`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900" data-testid="dashboard-heading">
              BodyArchitect AI
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-slate-600" data-testid="user-name">
                {user?.name}
              </span>
              <Button
                data-testid="logout-btn"
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-slate-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-slate-200" data-testid="stat-analyses">
            <div className="text-3xl font-mono font-bold text-slate-900 mb-1">
              {stats?.total_analyses || 0}
            </div>
            <div className="text-sm text-slate-600">Total Analyses</div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200" data-testid="stat-streak">
            <div className="text-3xl font-mono font-bold text-orange-500 mb-1">
              {stats?.current_streak || 0}
            </div>
            <div className="text-sm text-slate-600">Day Streak</div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200" data-testid="stat-improvement">
            <div className="text-3xl font-mono font-bold text-green-500 mb-1">
              {stats?.improvement_percentage > 0 ? '+' : ''}{stats?.improvement_percentage || 0}%
            </div>
            <div className="text-sm text-slate-600">Improvement</div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <Button
              data-testid="view-progress-btn"
              onClick={() => navigate('/progress')}
              className="w-full bg-sky-400 text-slate-900 hover:bg-sky-300 rounded-md"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              View Progress
            </Button>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white p-8 rounded-lg border border-slate-200 mb-8">
          <div className="text-center">
            <Camera className="w-16 h-16 text-sky-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2" data-testid="upload-heading">
              Upload New Body Photo
            </h2>
            <p className="text-slate-600 mb-6">
              Take or upload a clear, well-lit photo for AI analysis
            </p>
            <label htmlFor="file-upload">
              <Button
                data-testid="upload-photo-btn"
                disabled={uploading}
                className="bg-slate-900 text-white hover:bg-slate-800 shadow-lg rounded-md"
                size="lg"
                asChild
              >
                <span>
                  {uploading ? 'Analyzing...' : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Choose Photo
                    </>
                  )}
                </span>
              </Button>
            </label>
            <input
              id="file-upload"
              data-testid="file-upload-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </div>
        </div>

        {/* Recent Analyses */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4" data-testid="recent-analyses-heading">
            Recent Analyses
          </h2>
          
          {analyses.length === 0 ? (
            <div className="bg-white p-12 rounded-lg border border-slate-200 text-center" data-testid="no-analyses">
              <p className="text-slate-600">No analyses yet. Upload your first photo to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analyses.slice(0, 6).map((analysis) => (
                <div
                  key={analysis.id}
                  data-testid={`analysis-card-${analysis.id}`}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/analysis/${analysis.id}`)}
                >
                  <div className="p-6">
                    <div className="text-sm text-slate-600 mb-3">
                      {new Date(analysis.analysis_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="mb-4">
                      <div className="text-2xl font-mono font-bold text-slate-900">
                        {analysis.progress_score?.toFixed(0) || 50}
                      </div>
                      <div className="text-xs text-slate-600">Progress Score</div>
                    </div>
                    {analysis.weak_areas && analysis.weak_areas.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-slate-900 mb-1">Weak Areas:</div>
                        <div className="text-sm text-orange-500">
                          {analysis.weak_areas.slice(0, 2).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
