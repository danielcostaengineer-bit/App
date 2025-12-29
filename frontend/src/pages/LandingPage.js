import { useNavigate } from 'react-router-dom';
import { ArrowRight, Camera, TrendingUp, Target } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1
                  className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight"
                  data-testid="hero-heading"
                >
                  Build Your Best
                  <br />
                  <span className="text-sky-400">Physique</span>
                </h1>
                <p className="text-lg text-slate-600 max-w-xl" data-testid="hero-subheading">
                  AI-powered body analysis to identify weak muscles and optimize your training. Track progress daily and get personalized exercise recommendations.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  data-testid="get-started-btn"
                  onClick={() => navigate('/auth')}
                  size="lg"
                  className="bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all rounded-md text-base"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  data-testid="learn-more-btn"
                  onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                  size="lg"
                  variant="outline"
                  className="bg-white border-slate-200 text-slate-900 hover:bg-slate-50 rounded-md text-base"
                >
                  Learn More
                </Button>
              </div>
            </div>

            {/* Right: Hero Image */}
            <div className="relative">
              <div className="relative rounded-lg overflow-hidden border border-slate-200 shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1646072507419-9f836f8d3f67?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwzfHxhdGhsZXRpYyUyMG1hbiUyMGZpdG5lc3MlMjBwb3NlJTIwc3R1ZGlvJTIwbGlnaHRpbmd8ZW58MHx8fHwxNzY3MDUwOTA4fDA&ixlib=rb-4.1.0&q=85"
                  alt="Athlete in studio"
                  className="w-full h-auto"
                  data-testid="hero-image"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4" data-testid="features-heading">
              Smart Training, Real Results
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Leverage AI vision technology to get precise muscle analysis and data-driven workout recommendations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg border border-slate-200 hover:shadow-md transition-shadow" data-testid="feature-analysis">
              <div className="w-12 h-12 bg-sky-400/10 rounded-md flex items-center justify-center mb-4">
                <Camera className="w-6 h-6 text-sky-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">AI Body Analysis</h3>
              <p className="text-slate-600">
                Upload daily photos and get instant AI-powered muscle group assessments. Identify weak areas with precision.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg border border-slate-200 hover:shadow-md transition-shadow" data-testid="feature-tracking">
              <div className="w-12 h-12 bg-orange-500/10 rounded-md flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Progress Tracking</h3>
              <p className="text-slate-600">
                Visualize your transformation with timeline views and progress charts. Track muscle development over time.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg border border-slate-200 hover:shadow-md transition-shadow" data-testid="feature-recommendations">
              <div className="w-12 h-12 bg-green-500/10 rounded-md flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Custom Recommendations</h3>
              <p className="text-slate-600">
                Get personalized exercise plans targeting your weak areas. Optimize every workout for maximum results.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6" data-testid="cta-heading">
            Ready to Transform Your Physique?
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Start your journey today. Take control of your fitness with AI-powered insights.
          </p>
          <Button
            data-testid="cta-start-btn"
            onClick={() => navigate('/auth')}
            size="lg"
            className="bg-sky-400 text-slate-900 hover:bg-sky-300 shadow-lg hover:shadow-xl transition-all rounded-md text-base font-bold"
          >
            Start Free Analysis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
