import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, ArrowRight, Lock, Mail, User as UserIcon, Building2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

export const SignupPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signupWithEmail } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName) {
      toast.error('Missing Fields', 'Please complete all required fields.');
      return;
    }
    setLoading(true);
    try {
      await signupWithEmail(email, fullName, password);
      toast.success(
        'Account Registered',
        'Your user profile has been created with safe employee defaults.'
      );
      navigate('/app/dashboard');
    } catch (err) {
      toast.error('Signup Failed', 'Unable to complete registration. Please try again.');
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
          Register New Account
        </h2>
        <p className="mt-1 text-xs text-stone-700">
          Get started with your company compliance workspace.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-stone-200/90 space-y-6">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Tanvir Hossain"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#790D16] focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Company / Organization Name</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Apex Digital Solutions"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#790D16] focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

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
              <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#790D16] focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#FAF7F0] border border-[#E5D3AF] text-[11px] text-stone-600 leading-normal">
              🔒 <strong>Security Boundary:</strong> Public registrations automatically receive standard default permissions. Super-admin privileges can only be bootstrapped via server-side CLI.
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full shadow-md" isLoading={loading}>
              Create Workspace Account <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="text-center text-xs text-stone-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#790D16] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
