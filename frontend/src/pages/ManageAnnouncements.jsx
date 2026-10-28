import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Megaphone,
  Calendar,
  Clock,
  Pin,
  AlertTriangle,
  FileText,
  PlusCircle,
  Eye,
  Trash2,
  Edit,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Search,
} from 'lucide-react';

export const ManageAnnouncements = () => {
  const { user, isAdmin, isFaculty } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusTab, setStatusTab] = useState('all'); // 'all', 'published', 'draft', 'scheduled', 'expired'
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMyAnnouncements();
  }, []);

  const fetchMyAnnouncements = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/announcements/my-announcements');
      if (res.data.success) {
        setAnnouncements(res.data.announcements);
      }
    } catch (err) {
      console.error('Failed to load my announcements:', err);
      setError('Could not load your announcements.');
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter((a) => {
    const matchesStatus = statusTab === 'all' || a.status === statusTab;
    const matchesSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    if (status === 'published') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold uppercase">
          Published
        </span>
      );
    }
    if (status === 'scheduled') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#212121] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#333333] text-[10px] font-bold uppercase">
          Scheduled
        </span>
      );
    }
    if (status === 'draft') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#212121] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#333333] text-[10px] font-bold uppercase">
          Draft
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold uppercase">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200 dark:border-[#262626] shadow-xs p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#212121] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#333333] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Authoring Console</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            My Published Circulars
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your authored campus circulars, view read receipts, schedule future notices, and edit drafts.
          </p>
        </div>

        <Link
          to="/announcements/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black font-semibold text-xs shadow-xs transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Draft New Notice</span>
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#262626] overflow-x-auto pb-1 no-scrollbar">
        {['all', 'published', 'scheduled', 'draft', 'expired'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusTab(st)}
            className={`pb-3 px-4 text-xs font-bold capitalize transition-all border-b-2 whitespace-nowrap ${
              statusTab === st
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {st} (
            {st === 'all'
              ? announcements.length
              : announcements.filter((a) => a.status === st).length}
            )
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by keyword..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#262626] rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
        />
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 bg-white dark:bg-[#121212] rounded-2xl border border-slate-200 dark:border-[#262626] animate-pulse p-4"
            ></div>
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200 dark:border-[#262626] p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#212121] text-slate-700 dark:text-slate-300 flex items-center justify-center mx-auto">
            <Megaphone className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Announcements in this View</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            You don't have any announcements under the '{statusTab}' status.
          </p>
          <div className="pt-2">
            <Link
              to="/announcements/create"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-200 dark:text-black font-semibold text-xs shadow-xs transition-colors"
            >
              Create New Notice
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAnnouncements.map((item) => (
            <div
              key={item._id}
              className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200 dark:border-[#262626] shadow-xs p-5 hover:border-slate-300 dark:hover:border-[#383838] transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(item.status)}
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#212121] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#333333] text-[10px] font-bold uppercase">
                      {item.category}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#212121] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#333333] text-[10px] font-semibold">
                      Audience: {item.audience} ({item.branch})
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{item.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{item.summary || item.content}</p>
                </div>

                <div className="flex flex-row sm:flex-col sm:items-end justify-between items-center gap-1.5 shrink-0 text-xs text-slate-400 dark:text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {item.readCount || 0} Readers
                  </span>
                  <span className="text-[11px]">
                    {item.status === 'scheduled' ? 'Scheduled for: ' : 'Published: '}
                    {new Date(item.publishAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#262626] flex items-center justify-between">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Priority: <strong className="uppercase text-slate-600 dark:text-slate-300">{item.priority}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/announcements/${item._id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 dark:text-white hover:underline"
                  >
                    <span>View Circular</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageAnnouncements;
