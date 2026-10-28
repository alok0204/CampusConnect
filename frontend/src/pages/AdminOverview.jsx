import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ShieldCheck,
  Calendar,
  SearchCheck,
  Megaphone,
  Users,
  Bell,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
} from 'lucide-react';

export const AdminOverview = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    events: { pending: 0, total: 0 },
    lostFound: { active: 0, total: 0 },
    announcements: { published: 0, total: 0 },
    clubs: { pending: 0, active: 0, total: 0 },
  });

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const [evtRes, lfRes, annRes, clubRes] = await Promise.all([
        api.get('/events/admin/all'),
        api.get('/lost-found/admin/all'),
        api.get('/announcements/admin/all'),
        api.get('/clubs/admin/all'),
      ]);

      setStats({
        events: {
          pending: evtRes.data.counts?.pending || 0,
          total: evtRes.data.counts?.all || 0,
        },
        lostFound: {
          active: lfRes.data.counts?.active || 0,
          total: lfRes.data.counts?.all || 0,
        },
        announcements: {
          published: annRes.data.counts?.published || 0,
          total: annRes.data.counts?.all || 0,
        },
        clubs: {
          pending: clubRes.data.counts?.pending || 0,
          active: clubRes.data.counts?.active || 0,
          total: clubRes.data.counts?.all || 0,
        },
      });
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const adminModules = [
    {
      title: 'Events Governance',
      description: 'Review submitted student events, check venue conflicts, approve or reject listings.',
      icon: Calendar,
      color: 'indigo',
      topBorder: 'border-t-4 border-t-indigo-500',
      iconBox: 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60',
      cardHover: 'hover:border-indigo-300 dark:hover:border-indigo-700',
      btnHover: 'hover:bg-indigo-600 dark:hover:bg-indigo-600',
      badge: stats.events.pending > 0 ? `${stats.events.pending} Pending Review` : 'All Reviewed',
      badgeColor: stats.events.pending > 0
        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60'
        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60',
      actionUrl: '/admin/events',
      actionText: 'Review Events',
      countLabel: 'Total Listings',
      countValue: stats.events.total,
    },
    {
      title: 'Lost & Found Moderation',
      description: 'Moderate campus lost & found reports, oversee claim handovers, remove resolved notices.',
      icon: SearchCheck,
      color: 'emerald',
      topBorder: 'border-t-4 border-t-emerald-500',
      iconBox: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60',
      cardHover: 'hover:border-emerald-300 dark:hover:border-emerald-700',
      btnHover: 'hover:bg-emerald-600 dark:hover:bg-emerald-600',
      badge: `${stats.lostFound.active} Active Notices`,
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60',
      actionUrl: '/admin/lost-found',
      actionText: 'Moderate Notices',
      countLabel: 'Total Reports',
      countValue: stats.lostFound.total,
    },
    {
      title: 'Institutional Announcements',
      description: 'Publish college-wide circulars, manage exam timetables, broadcast targeted notifications.',
      icon: Megaphone,
      color: 'amber',
      topBorder: 'border-t-4 border-t-amber-500',
      iconBox: 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60',
      cardHover: 'hover:border-amber-300 dark:hover:border-amber-700',
      btnHover: 'hover:bg-amber-600 dark:hover:bg-amber-600',
      badge: `${stats.announcements.published} Published`,
      badgeColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60',
      actionUrl: '/admin/announcements',
      actionText: 'Manage Circulars',
      countLabel: 'Total Circulars',
      countValue: stats.announcements.total,
    },
    {
      title: 'Clubs & Societies Charters',
      description: 'Approve new student club charters, sanction leadership rosters, monitor memberships.',
      icon: Users,
      color: 'purple',
      topBorder: 'border-t-4 border-t-purple-500',
      iconBox: 'bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60',
      cardHover: 'hover:border-purple-300 dark:hover:border-purple-700',
      btnHover: 'hover:bg-purple-600 dark:hover:bg-purple-600',
      badge: stats.clubs.pending > 0 ? `${stats.clubs.pending} Proposals Pending` : `${stats.clubs.active} Active`,
      badgeColor: stats.clubs.pending > 0
        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60'
        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60',
      actionUrl: '/admin/clubs',
      actionText: 'Govern Clubs',
      countLabel: 'Total Clubs',
      countValue: stats.clubs.total,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-2 border border-emerald-200/60 dark:border-emerald-800/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Campus Connect Master Administration</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Central Administrative Console
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-normal text-xs sm:text-sm mt-1 max-w-xl">
            Unified governance dashboard for college events, lost & found claims, official circulars, and student organizations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/announcements/create"
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors"
          >
            Publish Circular
          </Link>
          <Link
            to="/events/create"
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm transition-colors"
          >
            Host Event
          </Link>
        </div>
      </div>

      {/* Admin Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {adminModules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.title}
              className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 ${mod.topBorder} shadow-xs p-6 flex flex-col justify-between ${mod.cardHover} transition-all group`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl ${mod.iconBox} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{mod.title}</h3>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {mod.countLabel}: {mod.countValue}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase border ${mod.badgeColor}`}>
                    {mod.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {mod.description}
                </p>
              </div>

              <Link
                to={mod.actionUrl}
                className={`mt-5 inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 ${mod.btnHover} text-slate-700 dark:text-slate-300 hover:text-white dark:hover:text-white text-xs font-semibold transition-all border border-slate-200/80 dark:border-slate-700/80 group-hover:border-transparent`}
              >
                <span>{mod.actionText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminOverview;
