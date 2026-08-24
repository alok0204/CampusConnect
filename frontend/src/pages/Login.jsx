import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GraduationCap, Lock, User, AlertCircle, ArrowRight, CheckCircle2, ShieldAlert, Sun, Moon } from 'lucide-react';

export const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');

  const { login } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setForgotMsg('');

    if (!identifier || !password) {
      setError('Please provide both College ID/Email and Password.');
      return;
    }

    setLoading(true);
    const result = await login(identifier, password);
    setLoading(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
  };

  // Instant 1-Click Quick Login for Evaluators & Reviewers
  const handleQuickLogin = async (id, pass) => {
    setIdentifier(id);
    setPassword(pass);
    setError('');
    setForgotMsg('');
    setLoading(true);

    const result = await login(id, pass);
    setLoading(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Dark/Light Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 mb-4">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Campus Connect
        </h2>
        <p className="mt-1 text-sm text-slate-500 font-medium">
          Unified College Portal & Campus Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200 rounded-2xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm font-medium">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {forgotMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-700 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span>{forgotMsg}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                College Email / College ID / Roll Number
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 22CSE042 or anshul.cse@campus.edu"
                  required
                  className="block w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setForgotMsg(
                      'For password reset assistance, please contact the Campus Connect IT Helpdesk at helpdesk@campus.edu or use your default credentials.'
                    )
                  }
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-all shadow-md shadow-blue-100 disabled:opacity-70 text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials for Reviewers with 1-Click Instant Login */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 text-center">
              Quick Test Logins (1-Click Instant Sign-In)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('anshul.cse@campus.edu', 'Student@123')}
                className="px-2.5 py-2 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-left transition-colors text-xs font-medium text-slate-700 truncate disabled:opacity-50"
              >
                🎓 <strong className="text-blue-700">CSE Student</strong> (Anshul)
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('rohit.ece@campus.edu', 'Student@123')}
                className="px-2.5 py-2 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100 text-left transition-colors text-xs font-medium text-slate-700 truncate disabled:opacity-50"
              >
                🎓 <strong className="text-purple-700">ECE Student</strong> (Rohit)
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('dr.sharma@campus.edu', 'Faculty@123')}
                className="px-2.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-left transition-colors text-xs font-medium text-slate-700 truncate disabled:opacity-50"
              >
                👨‍🏫 <strong className="text-emerald-700">Faculty</strong> (Dr. Sharma)
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('admin@campus.edu', 'Admin@123')}
                className="px-2.5 py-2 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-left transition-colors text-xs font-medium text-slate-700 truncate disabled:opacity-50"
              >
                🛡️ <strong className="text-amber-700">Admin</strong> (Campus IT)
              </button>
            </div>
          </div>

          {/* Registration link */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <span>Don't have an account?</span>
            <div className="flex items-center gap-3 font-semibold text-blue-600">
              <Link to="/signup/student" className="hover:underline">
                Student Sign Up
              </Link>
              <span>•</span>
              <Link to="/signup/faculty" className="hover:underline">
                Faculty Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
