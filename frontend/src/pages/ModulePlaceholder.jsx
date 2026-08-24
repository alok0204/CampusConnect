import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, SearchCheck, Megaphone, Users, Shield, ArrowLeft } from 'lucide-react';

export const ModulePlaceholder = ({ title, description, icon: Icon, phase, actionText, actionLink }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
        <Icon className="w-8 h-8" />
      </div>
      <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
        Phase {phase} Module
      </span>
      <h2 className="text-2xl font-extrabold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      <div className="pt-4 flex items-center justify-center gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
