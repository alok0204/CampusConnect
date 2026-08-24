import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
import Avatar from '../components/Avatar';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Trash2,
  PlusCircle,
  Users,
  Check,
  X,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';

export const AdminClubs = () => {
  const { isAdmin } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingClubId, setRejectingClubId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchAdminClubs();
  }, [statusFilter, categoryFilter]);

  const fetchAdminClubs = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get(`/clubs/admin/all?${params.toString()}`);
      if (res.data.success) {
        setClubs(res.data.clubs);
        setCounts(res.data.counts);
      }
    } catch (err) {
      console.error('Error fetching admin clubs:', err);
      setError('Could not load administrative club records.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAdminClubs();
  };

  const handleApprove = async (id, clubName) => {
    try {
      const res = await api.put(`/clubs/${id}/approve`);
      if (res.data.success) {
        setSuccessMsg(`Club '${clubName}' approved and activated successfully.`);
        fetchAdminClubs();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve club.');
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/clubs/${rejectingClubId}/reject`, {
        rejectionReason,
      });
      if (res.data.success) {
        setSuccessMsg('Club charter proposal marked as rejected.');
        setRejectModalOpen(false);
        setRejectingClubId(null);
        setRejectionReason('');
        fetchAdminClubs();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject club.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently remove this club charter?')) return;

    try {
      const res = await api.delete(`/clubs/${id}`);
      if (res.data.success) {
        setSuccessMsg('Club removed successfully.');
        fetchAdminClubs();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete club.');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
          Active
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase">
          Pending Approval
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-[10px] font-extrabold uppercase">
          Rejected
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Campus Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Clubs & Organizations Governance
          </h1>
          <p className="text-slate-400 font-medium text-xs sm:text-sm mt-1 max-w-xl">
            Review student charter proposals, sanction club budgets, moderate leadership rosters, and monitor active memberships.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/clubs"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors backdrop-blur-sm"
          >
            Public Directory
          </Link>
          <Link
            to="/clubs/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Charter Club</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics Summary */}
      {counts && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Total Clubs</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{counts.all}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
            <span className="text-[11px] font-bold uppercase text-emerald-600 block">Active</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{counts.active}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
            <span className="text-[11px] font-bold uppercase text-amber-600 block">
              Pending Approvals
            </span>
            <p className="text-2xl font-black text-amber-600 mt-1">{counts.pending}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
            <span className="text-[11px] font-bold uppercase text-red-600 block">Rejected</span>
            <p className="text-2xl font-black text-red-600 mt-1">{counts.rejected}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold uppercase text-purple-600 block">
              Student Memberships
            </span>
            <p className="text-2xl font-black text-purple-700 mt-1">{counts.totalMemberships}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500">Filter Status:</span>
            {['all', 'active', 'pending', 'rejected', 'inactive'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
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
              placeholder="Search clubs by name, domain, or department..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Clubs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
            Loading club administrative records...
          </div>
        ) : clubs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No club records match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Club Name & Category</th>
                  <th className="px-4 py-3.5">Department / Branch</th>
                  <th className="px-4 py-3.5">President & Faculty</th>
                  <th className="px-4 py-3.5">Members</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clubs.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                          <img
                            src={getImageUrl(item.logo)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">{item.name}</p>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      <p className="font-semibold text-slate-800">{item.department}</p>
                      <p className="text-[11px] text-slate-400">
                        {item.branch === 'ALL' ? 'College-Wide' : `${item.branch} Branch`}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        {item.studentPresident && (
                          <Avatar user={item.studentPresident} size="sm" className="shrink-0" />
                        )}
                        <div>
                          <p className="font-bold text-slate-800">
                            {item.studentPresident?.name ? item.studentPresident.name : 'Unassigned'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {item.facultyCoordinator?.name
                              ? `Coord: ${item.facultyCoordinator.name}`
                              : 'No Coordinator'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      <span className="font-bold text-slate-900">{item.memberCount}</span>
                      {item.pendingCount > 0 && (
                        <span className="text-amber-700 font-extrabold ml-1.5">
                          ({item.pendingCount} pending)
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">{getStatusBadge(item.status)}</td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(item._id, item.name)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
                              title="Approve Club"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => {
                                setRejectingClubId(item._id);
                                setRejectModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold text-[11px] flex items-center gap-1"
                              title="Reject Club"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        <Link
                          to={`/clubs/${item._id}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                          title="View Club"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete Club"
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

      {/* Rejection Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Reject Club Proposal</h3>
            <p className="text-xs text-slate-500">
              Provide an optional explanation for why this club charter cannot be approved.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. A similar club already exists, or missing faculty mentor approval..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500 resize-none"
              ></textarea>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClubs;
