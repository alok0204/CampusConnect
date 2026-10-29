import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GraduationCap, Lock, User, AlertCircle, ArrowRight, CheckCircle2, Sun, Moon } from 'lucide-react';

export const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');

  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
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
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative transition-colors">
      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-subtle transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 text-white dark:bg-brand-600 shadow-card mb-3">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          CampusConnect
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          Unified College Portal & Academic Life System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-8 shadow-card border border-slate-200 dark:border-slate-800 rounded-3xl">
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {forgotMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{forgotMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                College ID, Roll No or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 22CSE042 or anshul.cse@campus.edu"
                  required
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:border-brand-600 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setForgotMsg(
                      'For password reset assistance, contact the Campus Connect IT Helpdesk at helpdesk@campus.edu or use your default demo credentials.'
                    )
                  }
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:border-brand-600 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 transition-colors shadow-subtle disabled:opacity-70 text-xs sm:text-sm mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials (Development Mode Only - Omitted from Production Builds) */}
          {import.meta.env.DEV && (
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 text-center">
                1-Click Instant Demo Access (Dev Only)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin('anshul.cse@campus.edu', 'Student@123')}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate"
                >
                  🎓 <strong className="text-slate-900 dark:text-white">CSE Student</strong> (Anshul)
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin('rohit.ece@campus.edu', 'Student@123')}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate"
                >
                  🎓 <strong className="text-slate-900 dark:text-white">ECE Student</strong> (Rohit)
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin('dr.sharma@campus.edu', 'Faculty@123')}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate"
                >
                  👨‍🏫 <strong className="text-slate-900 dark:text-white">Faculty</strong> (Dr. Sharma)
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin('admin@campus.edu', 'Admin@123')}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate"
                >
                  🛡️ <strong className="text-slate-900 dark:text-white">Admin</strong> (Campus IT)
                </button>
              </div>
            </div>
          )}

          {/* Registration Options */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
            <span>New to Campus Connect?</span>
            <div className="flex items-center gap-2 font-semibold text-brand-600 dark:text-brand-400">
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
