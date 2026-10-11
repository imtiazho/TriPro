import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email Required', 'Please enter your account email.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success('Instructions Sent', 'Password recovery instructions have been emailed.');
    }, 800);
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
          Reset Your Password
        </h2>
        <p className="mt-1 text-xs text-stone-700">
          Enter your registered work email to receive password restoration links.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-stone-200/90 space-y-6">
          {submitted ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-stone-900">Check Your Inbox</h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                If an account exists for <strong className="text-stone-800">{email}</strong>, a secure password reset link has been dispatched via Firebase Auth.
              </p>
              <Link to="/login" className="inline-block mt-4">
                <Button variant="outline" size="sm">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <Button type="submit" variant="primary" size="md" className="w-full shadow-md" isLoading={loading}>
                Send Recovery Instructions
              </Button>
            </form>
          )}

          <div className="text-center text-xs text-stone-600 pt-2 border-t border-stone-100">
            <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-[#790D16] hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
