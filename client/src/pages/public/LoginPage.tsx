import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { Shield, ArrowRight, Lock, Mail, Sparkles } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithEmail, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email Required', 'Please enter your account email.');
      return;
    }
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      toast.success('Welcome Back', 'Logged into TriPro ECM workspace successfully.');
      navigate('/app/dashboard');
    } catch (err) {
      toast.error('Login Failed', 'Unable to authenticate credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demo: typeof DEMO_USERS[0]) => {
    setLoading(true);
    try {
      await switchDemoRole(demo.role, demo.email);
      toast.success('Demo Persona Activated', `Logged in as ${demo.name} (${demo.role}).`);
      navigate('/app/dashboard');
    } catch (err) {
      toast.error('Demo Login Error', 'Failed to initialize demo session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E5D3AF] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#790D16] flex items-center justify-center text-white shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-[#790D16] font-['Outfit']">
            TRIPRO <span className="text-stone-800 font-semibold text-base">ECM</span>
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold text-stone-900 font-['Outfit']">
          Sign In to Your Workspace
        </h2>
        <p className="mt-1 text-xs text-stone-700">
          Enter your organization credentials or choose a quick demo persona.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-stone-200/90 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#790D16] focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700">Password</label>
                <Link to="/forgot-password" className="text-xs text-[#790D16] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#790D16] focus:border-transparent outline-none"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full shadow-md" isLoading={loading}>
              Sign In to Dashboard <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="pt-4 border-t border-stone-100">
            <div className="flex items-center gap-1.5 mb-2.5 text-[11px] font-bold text-[#790D16] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              1-Click Demo Evaluation Personas
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {DEMO_USERS.slice(0, 4).map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => handleQuickDemo(demo)}
                  className="text-left p-2 rounded-lg bg-[#FAF7F0] border border-[#E5D3AF] hover:border-[#790D16] hover:bg-[#FDF2F3] transition-colors"
                >
                  <div className="font-semibold text-stone-900 truncate">{demo.name}</div>
                  <div className="text-[10px] text-[#790D16] capitalize font-medium">{demo.role.replace('-', ' ')}</div>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleQuickDemo(DEMO_USERS[4])} // Auditor
              className="mt-2 w-full text-left p-2 rounded-lg bg-stone-50 border border-stone-200 hover:border-stone-400 text-xs flex justify-between items-center"
            >
              <div>
                <span className="font-semibold text-stone-900">Michael Chang</span>
                <span className="text-[10px] text-stone-500 ml-2 font-medium">(Lead External Auditor — Read Only)</span>
              </div>
              <span className="text-[10px] text-stone-600 bg-stone-200 px-1.5 py-0.5 rounded">Auditor</span>
            </button>
          </div>

          <div className="text-center text-xs text-stone-600">
            Don't have a workspace yet?{' '}
            <Link to="/signup" className="font-semibold text-[#790D16] hover:underline">
              Register Organization
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
