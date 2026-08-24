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
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personal Community Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Clubs & Memberships
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your active student club affiliations, pending join applications, and lead roles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/clubs"
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
          >
            Explore Directory
          </Link>
          <Link
            to="/clubs/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Propose Club</span>
          </Link>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{actionMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveTab('joined')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'joined'
              ? 'border-emerald-700 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          My Joined Clubs ({joinedClubs.length})
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'pending'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Pending Applications ({pendingClubs.length})
        </button>

        {managedClubs.length > 0 && (
          <button
            onClick={() => setActiveTab('managed')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'managed'
                ? 'border-purple-700 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Clubs I Lead & Manage ({managedClubs.length})
          </button>
        )}
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse p-4"
            ></div>
          ))}
        </div>
      ) : (
        <>
          {/* Tab 1: Joined Clubs */}
          {activeTab === 'joined' && (
            <div>
              {joinedClubs.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
                  <Users className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-900">No Club Memberships Yet</h3>
                  <p className="text-xs text-slate-500">
                    You haven't joined any campus clubs or societies yet.
                  </p>
                  <Link
                    to="/clubs"
                    className="inline-block px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs mt-2"
                  >
                    Browse Active Clubs
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {joinedClubs.map((club) => (
                    <div
                      key={club._id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-emerald-200 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                          <img
                            src={getImageUrl(club.logo)}
                            alt={club.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase">
                              {club.category}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              Joined: {new Date(club.joinedAt).toLocaleDateString()}
                            </span>
                          </div>

                          <Link
                            to={`/clubs/${club._id}`}
                            className="block text-base font-bold text-slate-900 hover:text-emerald-700 truncate"
                          >
                            {club.name}
                          </Link>

                          <p className="text-xs text-slate-500 line-clamp-1">{club.shortDescription}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                          Role: {club.myRole}
                        </span>

                        <div className="flex items-center gap-2">
                          {!club.isManager && (
                            <button
                              onClick={() => handleLeaveClub(club._id)}
                              className="text-xs font-semibold text-slate-400 hover:text-red-600"
                            >
                              Leave
                            </button>
                          )}
                          <Link
                            to={`/clubs/${club._id}`}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 flex items-center gap-1"
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
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-900">No Pending Applications</h3>
                  <p className="text-xs text-slate-500">
                    You have no outstanding club join applications awaiting review.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingClubs.map((club) => (
                    <div
                      key={club._id}
                      className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase">
                          Pending Leadership Review
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Applied: {new Date(club.requestedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{club.name}</h3>
                      {club.statement && (
                        <p className="text-xs text-slate-600 italic bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
                          "{club.statement}"
                        </p>
                      )}

                      <div className="pt-2 flex items-center justify-between">
                        <button
                          onClick={() => handleLeaveClub(club._id)}
                          className="text-xs font-bold text-red-600 hover:text-red-700"
                        >
                          Withdraw Request
                        </button>
                        <Link
                          to={`/clubs/${club._id}`}
                          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
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
                  className="bg-white rounded-2xl border border-purple-200 shadow-sm p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-extrabold uppercase">
                        {club.status}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{club.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-1">{club.shortDescription}</p>
                    </div>

                    <div className="text-right shrink-0 text-xs">
                      <span className="font-bold text-slate-800 block">
                        {club.memberCount} Members
                      </span>
                      {club.pendingCount > 0 && (
                        <span className="text-[11px] text-amber-700 font-extrabold block">
                          {club.pendingCount} Pending Requests
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      to={`/events/create`}
                      className="text-xs font-bold text-purple-700 hover:underline"
                    >
                      + Host Club Event
                    </Link>

                    <Link
                      to={`/clubs/${club._id}`}
                      className="px-4 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs"
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
