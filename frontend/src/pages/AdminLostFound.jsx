import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
import Avatar from '../components/Avatar';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Eye,
  Filter,
  Trash2,
  Ban,
  Tag,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const AdminLostFound = () => {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Reject Modal
  const [moderatingItem, setModeratingItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAdminItems();
  }, [statusFilter, typeFilter]);

  const fetchAdminItems = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter);
      if (search && search.trim()) params.append('search', search.trim());

      const res = await api.get(`/lost-found/admin/all?${params.toString()}`);
      if (res.data.success) {
        setItems(res.data.items);
        setCounts(res.data.counts);
      }
    } catch (err) {
      console.error('Failed to load admin lost & found reports:', err);
      setError('Could not load administrative lost & found data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAdminItems();
  };

  const handleModerate = async (status) => {
    if (!moderatingItem) return;

    try {
      setActionLoading(true);
      const res = await api.put(`/lost-found/admin/${moderatingItem._id}/moderate`, {
        status,
        rejectionReason,
      });

      if (res.data.success) {
        setSuccessMsg(`Report status updated to '${status}'.`);
        setModeratingItem(null);
        setRejectionReason('');
        fetchAdminItems();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to moderate report.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status, type) => {
    if (status === 'resolved' || status === 'claimed') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 text-[10px] font-semibold uppercase">
          Resolved
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60 text-[10px] font-semibold uppercase">
          Flagged
        </span>
      );
    }
    if (status === 'claim_pending') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 text-[10px] font-semibold uppercase">
          Claim Pending
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 text-[10px] font-semibold uppercase">
        Active
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold mb-2 border border-amber-200/60 dark:border-amber-800/60">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Campus Administration</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Lost & Found Moderation
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-normal text-xs sm:text-sm mt-1 max-w-xl">
            Monitor student notices, moderate reported lost/found belongings, remove inappropriate listings, and maintain campus directory integrity.
          </p>
        </div>

        <Link
          to="/lost-found"
          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors shrink-0 text-center"
        >
          View Public Feed →
        </Link>
      </div>

      {/* Metrics Summary Grid */}
      {counts && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block">Total Reports</span>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{counts.all}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-[10px] font-semibold uppercase text-rose-600 dark:text-rose-400 block">Active Lost</span>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">{counts.lost}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400 block">Active Found</span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{counts.found}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-[10px] font-semibold uppercase text-amber-600 dark:text-amber-400 block">Pending Claims</span>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{counts.claim_pending}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-[10px] font-semibold uppercase text-indigo-600 dark:text-indigo-400 block">Resolved</span>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{counts.resolved}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block">Total Claims</span>
            <p className="text-xl font-bold text-slate-700 dark:text-slate-300 mt-0.5">{counts.totalClaims}</p>
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
            {['all', 'active', 'claim_pending', 'resolved', 'rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">Type:</span>
            {['all', 'lost', 'found'].map((tp) => (
              <button
                key={tp}
                onClick={() => setTypeFilter(tp)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  typeFilter === tp
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tp}
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
              placeholder="Search reports by title, description, location..."
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

      {/* Reports Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
            Loading administrative records...
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 dark:text-slate-500">
            No lost & found listings match current administrative filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Item & Photo</th>
                  <th className="px-4 py-3.5">Type & Category</th>
                  <th className="px-4 py-3.5">Location & Date</th>
                  <th className="px-4 py-3.5">Reported By</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => {
                  const isLost = item.type === 'lost';
                  return (
                    <tr key={item._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.title}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.title}</p>
                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase mb-1 border ${
                            isLost
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/60'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60'
                          }`}
                        >
                          {item.type}
                        </span>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">{item.category}</p>
                      </td>

                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                          {item.location}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(item.date).toLocaleDateString()}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar user={item.creator} size="sm" className="shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{item.creator?.name}</p>
                            <p className="text-[11px] text-slate-400">
                              {item.creator?.rollNumber || item.creator?.collegeId} (
                              {item.creator?.branch || 'Campus'})
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">{getStatusBadge(item.status, item.type)}</td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/lost-found/${item._id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {item.status !== 'rejected' && (
                            <button
                              onClick={() => {
                                setModeratingItem(item);
                                setRejectionReason('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-[11px] font-semibold transition-colors"
                            >
                              Flag
                            </button>
                          )}

                          {item.status === 'rejected' && (
                            <button
                              onClick={async () => {
                                setModeratingItem(item);
                                handleModerate('active');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-[11px] font-semibold transition-colors"
                            >
                              Re-activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Moderation Rejection Modal */}
      {moderatingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Moderate Notice: {moderatingItem.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide an administrative moderation note explaining why this listing violates campus guidelines.
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Inappropriate photo, duplicate spam notice, or fake report."
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            ></textarea>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModeratingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleModerate('rejected')}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors"
              >
                Confirm Rejection & Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLostFound;
