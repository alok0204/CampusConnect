import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, SearchCheck, Megaphone, Users, Shield, ArrowLeft } from 'lucide-react';

export const ModulePlaceholder = ({ title, description, icon: Icon, phase, actionText, actionLink }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
        <Icon className="w-7 h-7" />
      </div>
      <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 text-xs font-semibold uppercase tracking-wider">
        Phase {phase} Module
      </span>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      <div className="pt-3 flex items-center justify-center gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default ModulePlaceholder;
