import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
import {
  Users,
  PlusCircle,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Trash2,
  Calendar,
} from 'lucide-react';

export const MyClubs = () => {
  const { user, isAdmin, isFaculty } = useAuth();
  const [joinedClubs, setJoinedClubs] = useState([]);
  const [pendingClubs, setPendingClubs] = useState([]);
  const [managedClubs, setManagedClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const [activeTab, setActiveTab] = useState('joined'); // 'joined', 'pending', 'managed'

  useEffect(() => {
    fetchMyClubs();
  }, []);

  const fetchMyClubs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/clubs/my-clubs');
      if (res.data.success) {
        setJoinedClubs(res.data.joinedClubs || []);
        setPendingClubs(res.data.pendingClubs || []);
        setManagedClubs(res.data.managedClubs || []);
      }
    } catch (err) {
      console.error('Failed to load my clubs:', err);
      setError('Could not load your clubs dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveClub = async (clubId) => {
    if (!window.confirm('Are you sure you want to leave / withdraw from this club?')) return;

    try {
      const res = await api.post(`/clubs/${clubId}/leave`);
      if (res.data.success) {
        setActionMsg(res.data.message);
        fetchMyClubs();
        setTimeout(() => setActionMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to leave club.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200 dark:border-[#262626] shadow-xs p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#212121] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#333333] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personal Community Hub</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            My Clubs & Memberships
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your active student club affiliations, pending join applications, and lead roles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/clubs"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#262626] text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-[#181818] transition-colors"
          >
            Explore Directory
          </Link>
          <Link
            to="/clubs/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black font-semibold text-xs shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Propose Club</span>
          </Link>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{actionMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#262626] overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveTab('joined')}
          className={`pb-2.5 px-3.5 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'joined'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          My Joined Clubs ({joinedClubs.length})
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-2.5 px-3.5 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'pending'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 dark:border-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          Pending Applications ({pendingClubs.length})
        </button>

        {managedClubs.length > 0 && (
          <button
            onClick={() => setActiveTab('managed')}
            className={`pb-2.5 px-3.5 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'managed'
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Clubs I Lead & Manage ({managedClubs.length})
          </button>
        )}
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse p-4"
            ></div>
          ))}
        </div>
      ) : (
        <>
          {/* Tab 1: Joined Clubs */}
          {activeTab === 'joined' && (
            <div>
              {joinedClubs.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-md mx-auto space-y-3">
                  <Users className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">No Club Memberships Yet</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    You haven't joined any campus clubs or societies yet.
                  </p>
                  <Link
                    to="/clubs"
                    className="inline-block px-4 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black font-semibold text-xs mt-2 transition-colors shadow-xs"
                  >
                    Browse Active Clubs
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {joinedClubs.map((club) => (
                    <div
                      key={club._id}
                      className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200 dark:border-[#262626] shadow-xs p-5 hover:border-slate-300 dark:hover:border-[#383838] transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-13 h-13 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200/50 dark:border-slate-700/50">
                          <img
                            src={getImageUrl(club.logo)}
                            alt={club.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#212121] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#333333] text-[10px] font-semibold uppercase">
                              {club.category}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              Joined: {new Date(club.joinedAt).toLocaleDateString()}
                            </span>
                          </div>

                          <Link
                            to={`/clubs/${club._id}`}
                            className="block text-sm font-bold text-slate-900 dark:text-white hover:underline truncate transition-colors"
                          >
                            {club.name}
                          </Link>

                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{club.shortDescription}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-[#262626] flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 px-2.5 py-1 rounded-full">
                          Role: {club.myRole}
                        </span>

                        <div className="flex items-center gap-2">
                          {!club.isManager && (
                            <button
                              onClick={() => handleLeaveClub(club._id)}
                              className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              Leave
                            </button>
                          )}
                          <Link
                            to={`/clubs/${club._id}`}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black font-semibold text-xs flex items-center gap-1 transition-colors shadow-xs"
                          >
                            <span>Open Hub</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Pending Applications */}
          {activeTab === 'pending' && (
            <div>
              {pendingClubs.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-md mx-auto space-y-3">
                  <Clock className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">No Pending Applications</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    You have no outstanding club join applications awaiting review.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingClubs.map((club) => (
                    <div
                      key={club._id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800/60 p-5 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 text-[10px] font-semibold uppercase">
                          Pending Leadership Review
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Applied: {new Date(club.requestedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{club.name}</h3>
                      {club.statement && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-amber-50/60 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40">
                          "{club.statement}"
                        </p>
                      )}

                      <div className="pt-2 flex items-center justify-between">
                        <button
                          onClick={() => handleLeaveClub(club._id)}
                          className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-colors"
                        >
                          Withdraw Request
                        </button>
                        <Link
                          to={`/clubs/${club._id}`}
                          className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                        >
                          <span>View Club Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Clubs I Manage */}
          {activeTab === 'managed' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {managedClubs.map((club) => (
                <div
                  key={club._id}
                  className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200 dark:border-[#262626] shadow-xs p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#212121] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#333333] text-[10px] font-semibold uppercase">
                        {club.status}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{club.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{club.shortDescription}</p>
                    </div>

                    <div className="text-right shrink-0 text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {club.memberCount} Members
                      </span>
                      {club.pendingCount > 0 && (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold block">
                          {club.pendingCount} Pending Requests
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-[#262626] flex items-center justify-between">
                    <Link
                      to={`/events/create`}
                      className="text-xs font-semibold text-slate-900 dark:text-white hover:underline"
                    >
                      + Host Club Event
                    </Link>

                    <Link
                      to={`/clubs/${club._id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black font-semibold text-xs shadow-xs transition-colors"
                    >
                      Manage Roster & Requests
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyClubs;
