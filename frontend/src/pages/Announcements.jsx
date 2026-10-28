import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Avatar from '../components/Avatar';
import {
  Megaphone,
  Search,
  Calendar,
  Clock,
  Pin,
  AlertTriangle,
  FileText,
  Download,
  CheckCheck,
  PlusCircle,
  Sparkles,
  Filter,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Paperclip,
  CheckCircle2,
  X,
} from 'lucide-react';

export const Announcements = () => {
  const { user, isAdmin, isFaculty } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  // Filter & Search states
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  const categories = [
    { label: 'All Notices', value: 'ALL' },
    { label: 'Exam Updates', value: 'exam' },
    { label: 'Academic', value: 'academic' },
    { label: 'Placements & T&P', value: 'placement' },
    { label: 'Scholarships', value: 'scholarship' },
    { label: 'Campus Events', value: 'event' },
    { label: 'Administrative', value: 'administrative' },
    { label: 'Emergency', value: 'emergency' },
  ];

  useEffect(() => {
    fetchAnnouncements();
  }, [categoryFilter, priorityFilter, unreadOnly, sort]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter);
      if (unreadOnly) params.append('unreadOnly', 'true');
      if (search.trim()) params.append('search', search.trim());
      if (sort) params.append('sort', sort);

      const res = await api.get(`/announcements?${params.toString()}`);
      if (res.data.success) {
        setAnnouncements(res.data.announcements);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
      setError('Could not load announcements. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAnnouncements();
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.put('/announcements/mark-all-read');
      if (res.data.success) {
        setActionMsg('All announcements marked as read.');
        fetchAnnouncements();
        setTimeout(() => setActionMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const clearFilters = () => {
    setCategoryFilter('ALL');
    setPriorityFilter('ALL');
    setUnreadOnly(false);
    setSearch('');
    setSort('newest');
  };

  const hasActiveFilters =
    categoryFilter !== 'ALL' || priorityFilter !== 'ALL' || unreadOnly || search || sort !== 'newest';

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'urgent') {
      return (
        <span className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-sm border border-red-200 dark:border-red-900/40">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
          <span>URGENT</span>
        </span>
      );
    }
    if (priority === 'important') {
      return (
        <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-sm border border-amber-200 dark:border-amber-900/40">
          <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          <span>IMPORTANT</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase">
        NOTICE
      </span>
    );
  };

  const getAudienceLabel = (item) => {
    if (item.audience === 'all') return 'College-Wide (All Members)';
    if (item.audience === 'faculty') return 'Faculty & Staff Only';
    if (item.audience === 'students') {
      return item.branch === 'ALL' ? 'All Students' : `${item.branch} Students`;
    }
    if (item.audience === 'branch') return `${item.branch} Department`;
    if (item.audience === 'year') {
      return `${item.branch === 'ALL' ? 'Campus' : item.branch} • ${item.year}`;
    }
    if (item.audience === 'section') {
      return `${item.branch} • ${item.year} (Sec ${item.section})`;
    }
    return item.audience;
  };

  return (
    <div className="space-y-6">
      {/* Clean Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Announcements & Circulars
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {announcements.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Official academic notices, examination alerts, and institutional circulars.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs shadow-subtle transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Mark All Read ({unreadCount})</span>
            </button>
          )}

          {(isAdmin || isFaculty) && (
            <>
              <Link
                to="/announcements/manage"
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs shadow-subtle transition-colors"
              >
                My Circulars
              </Link>
              <Link
                to="/announcements/create"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white font-semibold text-xs shadow-subtle transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publish Notice</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Main Filter & Search Control Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-4">
        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                categoryFilter === cat.value
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Priority Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search circulars by keyword, exam, department, or subject..."
              className="w-full pl-10 pr-20 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                unreadOnly
                  ? 'bg-brand-100 dark:bg-brand-950/80 text-brand-800 dark:text-brand-300 border border-brand-200 dark:border-brand-800'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  unreadOnly ? 'bg-brand-600 dark:bg-brand-400' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              ></span>
              <span>Unread Only ({unreadCount})</span>
            </button>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="urgent">Urgent Only</option>
              <option value="important">Important Only</option>
              <option value="normal">Normal Priority</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing filtered results ({announcements.length} notices)
            </span>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 animate-pulse space-y-3"
            >
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center max-w-lg mx-auto space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
            <Megaphone className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Announcements Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {hasActiveFilters
              ? 'No official circulars matched your active filter or search keywords. Try clearing or adjusting filters.'
              : 'There are currently no active official announcements for your department.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 mt-2 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        /* Announcements List Feed */
        <div className="space-y-4">
          {announcements.map((item) => {
            const isUrgent = item.priority === 'urgent';
            const isImportant = item.priority === 'important';

            return (
              <div
                key={item._id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all hover:shadow-md overflow-hidden relative group flex flex-col justify-between ${
                  !item.isRead
                    ? 'border-brand-300 dark:border-brand-700 ring-1 ring-brand-100 dark:ring-brand-900/30 bg-brand-50/10 dark:bg-brand-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700'
                } ${isUrgent ? 'border-l-4 border-l-red-500' : isImportant ? 'border-l-4 border-l-amber-500' : ''}`}
              >
                <div className="p-5 sm:p-6 space-y-3">
                  {/* Top Meta Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Priority Ribbon */}
                      {getPriorityBadge(item.priority)}

                      {/* Category Badge */}
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold capitalize">
                        {item.category}
                      </span>

                      {/* Audience Badge */}
                      <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[11px] font-semibold flex items-center gap-1 border border-blue-100/60 dark:border-blue-900/40">
                        <GraduationCap className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>{getAudienceLabel(item)}</span>
                      </span>

                      {item.isPinned && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1 border border-amber-200/60 dark:border-amber-900/40">
                          <Pin className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>Pinned</span>
                        </span>
                      )}
                    </div>

                    {/* Unread indicator & Publication Date */}
                    <div className="flex items-center gap-2">
                      {!item.isRead && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-extrabold uppercase animate-pulse">
                          NEW
                        </span>
                      )}
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                        {formatDate(item.publishAt)}
                      </span>
                    </div>
                  </div>

                  {/* Title & Excerpt */}
                  <div className="space-y-1">
                    <Link
                      to={`/announcements/${item._id}`}
                      className="block text-base sm:text-lg font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors leading-snug"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.summary || item.content}
                    </p>
                  </div>
                </div>

                {/* Footer Toolbar */}
                <div className="px-5 sm:px-6 py-3 bg-slate-50/70 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Avatar user={item.createdBy} size="xs" bgClass="bg-brand-100 dark:bg-brand-950/80 text-brand-800 dark:text-brand-300" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {item.createdBy?.name}
                      </span>
                      {item.createdBy?.department && (
                        <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">
                          ({item.createdBy.department})
                        </span>
                      )}
                    </div>

                    {item.attachment?.url && (
                      <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                        <Paperclip className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                        <span>Attachment ({item.attachment.fileType?.toUpperCase() || 'PDF'})</span>
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/announcements/${item._id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Read Circular</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Announcements;
