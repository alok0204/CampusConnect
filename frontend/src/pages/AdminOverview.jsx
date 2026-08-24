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
      color: 'blue',
      badge: stats.events.pending > 0 ? `${stats.events.pending} Pending Review` : 'All Reviewed',
      badgeColor: stats.events.pending > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
      actionUrl: '/admin/events',
      actionText: 'Review Events',
      countLabel: 'Total Listings',
      countValue: stats.events.total,
    },
    {
      title: 'Lost & Found Moderation',
      description: 'Moderate campus lost & found reports, oversee claim handovers, remove resolved notices.',
      icon: SearchCheck,
      color: 'amber',
      badge: `${stats.lostFound.active} Active Notices`,
      badgeColor: 'bg-blue-100 text-blue-800',
      actionUrl: '/admin/lost-found',
      actionText: 'Moderate Notices',
      countLabel: 'Total Reports',
      countValue: stats.lostFound.total,
    },
    {
      title: 'Institutional Announcements',
      description: 'Publish college-wide circulars, manage exam timetables, broadcast targeted notifications.',
      icon: Megaphone,
      color: 'purple',
      badge: `${stats.announcements.published} Published`,
      badgeColor: 'bg-purple-100 text-purple-800',
      actionUrl: '/admin/announcements',
      actionText: 'Manage Circulars',
      countLabel: 'Total Circulars',
      countValue: stats.announcements.total,
    },
    {
      title: 'Clubs & Societies Charters',
      description: 'Approve new student club charters, sanction leadership rosters, monitor memberships.',
      icon: Users,
      color: 'emerald',
      badge: stats.clubs.pending > 0 ? `${stats.clubs.pending} Proposals Pending` : `${stats.clubs.active} Active`,
      badgeColor: stats.clubs.pending > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
      actionUrl: '/admin/clubs',
      actionText: 'Govern Clubs',
      countLabel: 'Total Clubs',
      countValue: stats.clubs.total,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Campus Connect Master Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Central Administrative Console
          </h1>
          <p className="text-slate-400 font-medium text-xs sm:text-sm mt-1 max-w-xl">
            Unified management dashboard for college events, lost & found claims, official circulars, and student organizations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/announcements/create"
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-colors"
          >
            Publish Circular
          </Link>
          <Link
            to="/events/create"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors"
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
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-slate-300 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{mod.title}</h3>
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {mod.countLabel}: {mod.countValue}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${mod.badgeColor}`}>
                    {mod.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {mod.description}
                </p>
              </div>

              <Link
                to={mod.actionUrl}
                className="mt-5 inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-800 text-xs font-bold transition-all border border-slate-200/80"
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
