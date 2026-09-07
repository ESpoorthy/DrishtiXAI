/**
 * Landing page
 */
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/store/authStore';
import { Eye, Shield, Zap, Users, Globe, Heart } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const features = [
    {
      icon: Shield,
      title: 'Trustworthy AI',
      description: 'Explainable predictions with confidence scores and visual explanations',
    },
    {
      icon: Zap,
      title: 'Fast Screening',
      description: 'Quick image quality assessment and DR severity prediction',
    },
    {
      icon: Users,
      title: 'Rural-Friendly',
      description: 'Mobile-first design for community health workers',
    },
    {
      icon: Globe,
      title: 'Multilingual',
      description: 'Support for multiple Indian languages',
    },
    {
      icon: Heart,
      title: 'Clinical Decision Support',
      description: 'Referral prioritization and clinician review workflow',
    },
    {
      icon: Eye,
      title: 'Quality First',
      description: 'Automatic image quality checks before prediction',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Hero section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Eye className="h-20 w-20 text-primary-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            DrishtiXAI
          </h1>
          <p className="text-2xl text-gray-600 mb-2">
            Explainable Diabetic Retinopathy Screening
          </p>
          <p className="text-lg text-gray-500 mb-8">
            AI-powered screening and referral assistant for rural India
          </p>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.push('/login')}
              className="btn-primary px-8 py-3 text-lg"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/login')}
              className="btn-secondary px-8 py-3 text-lg"
            >
              Learn More
            </button>
          </div>

          {/* Demo warning */}
          <div className="mt-8 max-w-2xl mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-800">
              ⚠️ <strong>DEMONSTRATION PROTOTYPE</strong> - For research and evaluation only.
              Not validated for clinical use. All predictions require professional medical review.
            </p>
          </div>
        </div>

        {/* Features grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="card text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <Icon className="h-8 w-8 text-primary-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Problem statement */}
        <div className="mt-20 card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Smart India Hackathon 2026
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="font-semibold text-gray-700 mb-2">Problem Statement:</p>
              <p className="text-gray-600">SIH26038 - Explainable AI for Diabetic Retinopathy Screening in Rural India</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-2">Organization:</p>
              <p className="text-gray-600">MathWorks</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-2">Category:</p>
              <p className="text-gray-600">Software</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-2">Theme:</p>
              <p className="text-gray-600">Clean & Green Technology</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
