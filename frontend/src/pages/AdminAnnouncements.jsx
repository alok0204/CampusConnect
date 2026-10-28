import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Trash2,
  PlusCircle,
  FileText,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const AdminAnnouncements = () => {
  const { isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAdminAnnouncements();
  }, [statusFilter, categoryFilter]);

  const fetchAdminAnnouncements = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get(`/announcements/admin/all?${params.toString()}`);
      if (res.data.success) {
        setAnnouncements(res.data.announcements);
        setCounts(res.data.counts);
      }
    } catch (err) {
      console.error('Error fetching admin announcements:', err);
      setError('Could not load administrative announcement records.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAdminAnnouncements();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this announcement?')) return;

    try {
      const res = await api.delete(`/announcements/${id}`);
      if (res.data.success) {
        setSuccessMsg('Announcement removed successfully.');
        fetchAdminAnnouncements();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete announcement.');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'published') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 text-[10px] font-semibold uppercase">
          Published
        </span>
      );
    }
    if (status === 'scheduled') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 text-[10px] font-semibold uppercase">
          Scheduled
        </span>
      );
    }
    if (status === 'draft') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold uppercase">
          Draft
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 text-[10px] font-semibold uppercase">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-2 border border-purple-200/60 dark:border-purple-800/60">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Campus Administration</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Announcements & Circulars Console
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-normal text-xs sm:text-sm mt-1 max-w-xl">
            Control campus circulars, broadcast notices, review department drafts, and oversee institutional communication.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/announcements"
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors"
          >
            Public Feed →
          </Link>
          <Link
            to="/announcements/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Draft Notice</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics */}
      {counts && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block">Total</span>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{counts.all}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400 block">Published</span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{counts.published}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-[10px] font-semibold uppercase text-blue-600 dark:text-blue-400 block">Scheduled</span>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{counts.scheduled}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400 block">Drafts</span>
            <p className="text-xl font-bold text-slate-700 dark:text-slate-300 mt-0.5">{counts.draft}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-[10px] font-semibold uppercase text-amber-600 dark:text-amber-400 block">Expired</span>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{counts.expired}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-[10px] font-semibold uppercase text-purple-600 dark:text-purple-400 block">Archived</span>
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">{counts.archived}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Controls Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">Status:</span>
            {[
              { key: 'all', label: 'All' },
              { key: 'published', label: 'Published', dot: 'bg-emerald-500' },
              { key: 'scheduled', label: 'Scheduled', dot: 'bg-blue-500' },
              { key: 'draft', label: 'Draft', dot: 'bg-slate-400' },
              { key: 'expired', label: 'Expired', dot: 'bg-amber-500' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStatusFilter(opt.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  statusFilter === opt.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {opt.dot && <span className={`w-1.5 h-1.5 rounded-full ${opt.dot} shrink-0`} />}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search circulars by subject, department, or content..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
            Loading administrative records...
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 dark:text-slate-500">
            No announcements found under the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Circular Title</th>
                  <th className="px-4 py-3.5">Priority & Category</th>
                  <th className="px-4 py-3.5">Target Audience</th>
                  <th className="px-4 py-3.5">Author</th>
                  <th className="px-4 py-3.5">Publication Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {announcements.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.title}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {item.summary || item.content}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold uppercase block mb-1">
                        {item.category}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase">
                        {item.priority}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{item.audience}</p>
                      <p className="text-[11px] text-slate-400">
                        {item.branch} • {item.year}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{item.createdBy?.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {item.createdBy?.role}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {new Date(item.publishAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-4">{getStatusBadge(item.status)}</td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/announcements/${item._id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="View Circular"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete Announcement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnnouncements;
