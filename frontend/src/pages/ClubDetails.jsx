import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Avatar from '../components/Avatar';
import { getImageUrl } from '../utils/imageUrl';
import {
  Users,
  Calendar,
  Megaphone,
  Globe,
  Instagram,
  Linkedin,
  Github,
  Mail,
  Phone,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Share2,
  UserPlus,
  UserMinus,
  Check,
  X,
  Trash2,
  Edit,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const ClubDetails = () => {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // Tabs: 'about', 'events', 'announcements', 'members', 'pending'
  const [activeTab, setActiveTab] = useState('about');

  // Join Modal State
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinStatement, setJoinStatement] = useState('');

  // Manager Roster & Pending Data
  const [membersRoster, setMembersRoster] = useState([]);
  const [pendingList, setPendingList] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  useEffect(() => {
    fetchClubDetails();
  }, [id]);

  useEffect(() => {
    if (club?.isManager || isAdmin) {
      if (activeTab === 'members') fetchRoster();
      if (activeTab === 'pending') fetchPending();
    }
  }, [activeTab, club]);

  const fetchClubDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/clubs/${id}`);
      if (res.data.success) {
        setClub(res.data.club);
      }
    } catch (err) {
      console.error('Error fetching club details:', err);
      setError(
        err.response?.data?.message || 'Could not load club details. It may be pending or removed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRoster = async () => {
    try {
      setLoadingRoster(true);
      const res = await api.get(`/clubs/${id}/members`);
      if (res.data.success) {
        setMembersRoster(res.data.members);
      }
    } catch (err) {
      console.error('Failed to load roster:', err);
    } finally {
      setLoadingRoster(false);
    }
  };

  const fetchPending = async () => {
    try {
      setLoadingRoster(true);
      const res = await api.get(`/clubs/${id}/pending-members`);
      if (res.data.success) {
        setPendingList(res.data.pendingMembers);
      }
    } catch (err) {
      console.error('Failed to load pending members:', err);
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await api.post(`/clubs/${id}/join`, {
        statement: joinStatement,
      });
      if (res.data.success) {
        setActionMsg(res.data.message);
        setShowJoinModal(false);
        setJoinStatement('');
        fetchClubDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit join request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveClub = async () => {
    if (!window.confirm('Are you sure you want to leave / cancel membership for this club?')) return;

    try {
      setActionLoading(true);
      const res = await api.post(`/clubs/${id}/leave`);
      if (res.data.success) {
        setActionMsg(res.data.message);
        fetchClubDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to leave club.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveMember = async (userId) => {
    try {
      setActionLoading(true);
      const res = await api.put(`/clubs/${id}/approve-member/${userId}`, {
        role: 'Member',
      });
      if (res.data.success) {
        setActionMsg('Member approved successfully!');
        fetchPending();
        fetchClubDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve member.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectMember = async (userId) => {
    try {
      setActionLoading(true);
      const res = await api.put(`/clubs/${id}/reject-member/${userId}`);
      if (res.data.success) {
        setActionMsg('Membership application rejected.');
        fetchPending();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject member.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member from the club?')) return;

    try {
      setActionLoading(true);
      const res = await api.delete(`/clubs/${id}/members/${userId}`);
      if (res.data.success) {
        setActionMsg('Member removed from club roster.');
        fetchRoster();
        fetchClubDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-9 h-9 border-3 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Club Unavailable</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{error || 'Could not load the requested club.'}</p>
        <Link
          to="/clubs"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Clubs Directory</span>
        </Link>
      </div>
    );
  }

  const isManager = club.isManager || isAdmin;
  const isMember = club.membershipStatus === 'member';
  const isPending = club.membershipStatus === 'pending';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/clubs"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Clubs Directory</span>
        </Link>

        <div className="flex items-center gap-2">
          {isMember && (
            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200/60 dark:border-emerald-800/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Active Member ({club.myRole || 'Member'})</span>
            </span>
          )}
          {isPending && (
            <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200/60 dark:border-amber-800/60">
              Join Request Pending Review
            </span>
          )}
          {isManager && (
            <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200/60 dark:border-indigo-800/60">
              Club Manager
            </span>
          )}
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Main Header & Cover Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Cover Banner */}
        <div className="h-44 sm:h-56 bg-slate-900 relative overflow-hidden">
          <img
            src={getImageUrl(club.coverImage)}
            alt={club.name}
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent"></div>

          {/* Category Pill floating */}
          <span className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-800 dark:text-slate-200 text-xs font-semibold tracking-wide shadow-sm border border-slate-200/50 dark:border-slate-700/50">
            {club.category}
          </span>
        </div>

        {/* Profile Info Row */}
        <div className="px-6 sm:px-8 pb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-900 shadow-md overflow-hidden shrink-0">
                <img
                  src={getImageUrl(club.logo)}
                  alt={club.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-0.5 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                  {club.name}
                </h1>
                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {club.department} •{' '}
                  {club.branch === 'ALL' ? 'College-Wide' : `${club.branch} Branch`}
                </p>
              </div>
            </div>

            {/* Main Membership Action CTA */}
            <div className="flex items-center gap-2">
              {!isMember && !isPending && (
                <button
                  onClick={() => setShowJoinModal(true)}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm shadow-sm transition-colors disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Join Club</span>
                </button>
              )}

              {isPending && (
                <button
                  onClick={handleLeaveClub}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-medium text-xs hover:bg-amber-100 transition-colors"
                >
                  Cancel Request
                </button>
              )}

              {isMember && !isManager && (
                <button
                  onClick={handleLeaveClub}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium text-xs hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  Leave Club
                </button>
              )}

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Club link copied to clipboard!');
                }}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                title="Share Club"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Short Pitch */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            {club.shortDescription}
          </p>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-5 sm:gap-8 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">{club.memberCount} Active Members</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{club.events?.length || 0} Events Hosted</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>{club.announcements?.length || 0} Circulars</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveTab('about')}
          className={`pb-2.5 px-3.5 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'about'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          About & Leadership
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`pb-2.5 px-3.5 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'events'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          Club Events ({club.events?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`pb-2.5 px-3.5 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'announcements'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          Club Circulars ({club.announcements?.length || 0})
        </button>

        {isManager && (
          <>
            <button
              onClick={() => setActiveTab('members')}
              className={`pb-2.5 px-3.5 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'members'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Member Roster ({club.memberCount})
            </button>

            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-2.5 px-3.5 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'border-amber-600 text-amber-600 dark:text-amber-400 dark:border-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Pending Applications ({club.pendingCount || 0})
            </button>
          </>
        )}
      </div>

      {/* Tab 1: About & Leadership */}
      {activeTab === 'about' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Description */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">About the Club</h2>
              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {club.description}
              </div>
            </div>

            {/* Leadership Cards */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Club Leadership & Mentors</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {club.facultyCoordinator && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
                    <Avatar user={club.facultyCoordinator} size="lg" shape="rounded" bgClass="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200" className="shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                        Faculty Coordinator
                      </span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {club.facultyCoordinator.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {club.facultyCoordinator.email}
                      </p>
                    </div>
                  </div>
                )}

                {club.studentPresident && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
                    <Avatar user={club.studentPresident} size="lg" shape="rounded" bgClass="bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200" className="shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                        Student President
                      </span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {club.studentPresident.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {club.studentPresident.branch} • {club.studentPresident.email}
                      </p>
                    </div>
                  </div>
                )}

                {club.studentSecretary && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
                    <Avatar user={club.studentSecretary} size="lg" shape="rounded" bgClass="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200" className="shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                        General Secretary
                      </span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {club.studentSecretary.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {club.studentSecretary.branch} • {club.studentSecretary.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Contact & Socials Bar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Official Contact
              </h3>

              <div className="space-y-3 text-xs">
                {club.contactEmail && (
                  <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                    <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <a
                      href={`mailto:${club.contactEmail}`}
                      className="hover:text-indigo-600 dark:hover:text-indigo-400 truncate font-medium"
                    >
                      {club.contactEmail}
                    </a>
                  </div>
                )}

                {club.contactPhone && (
                  <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                    <Phone className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="font-medium">{club.contactPhone}</span>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {club.socialLinks && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Connect With Us
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {club.socialLinks.website && (
                      <a
                        href={club.socialLinks.website}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-slate-200 dark:border-slate-700"
                        title="Website"
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                    {club.socialLinks.github && (
                      <a
                        href={club.socialLinks.github}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-white transition-colors border border-slate-200 dark:border-slate-700"
                        title="GitHub"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {club.socialLinks.linkedin && (
                      <a
                        href={club.socialLinks.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-slate-200 dark:border-slate-700"
                        title="LinkedIn"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {club.socialLinks.instagram && (
                      <a
                        href={club.socialLinks.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-pink-950/40 text-slate-600 dark:text-slate-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors border border-slate-200 dark:border-slate-700"
                        title="Instagram"
                      >
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Club Events */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Events Hosted by {club.name}</h2>
            {isManager && (
              <Link
                to="/events/create"
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors"
              >
                + Host New Event
              </Link>
            )}
          </div>

          {!club.events || club.events.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center max-w-md mx-auto space-y-2.5">
              <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400">No scheduled events found for this club yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {club.events.map((evt) => (
                <Link
                  key={evt._id}
                  to={`/events/${evt._id}`}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all block group space-y-2"
                >
                  <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold uppercase">
                    {evt.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {evt.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{evt.description}</p>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>{new Date(evt.date).toLocaleDateString()}</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                      View Event <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Club Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Notices Published by {club.name}
            </h2>
            {isManager && (
              <Link
                to="/announcements/create"
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors"
              >
                + Publish Notice
              </Link>
            )}
          </div>

          {!club.announcements || club.announcements.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center max-w-md mx-auto space-y-2.5">
              <Megaphone className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400">No circulars published for this club yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {club.announcements.map((ann) => (
                <Link
                  key={ann._id}
                  to={`/announcements/${ann._id}`}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex items-center justify-between gap-4 block group"
                >
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold uppercase">
                      {ann.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {ann.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{ann.summary || ann.content}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Member Roster (Manager / Admin) */}
      {activeTab === 'members' && isManager && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Active Members Roster ({membersRoster.length})
            </h2>
          </div>

          {loadingRoster ? (
            <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
              Loading club members roster...
            </div>
          ) : membersRoster.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">No members found.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {membersRoster.map((m) => (
                <div
                  key={m.user?._id || m.user}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar user={m.user} size="sm" bgClass="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200" className="shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{m.user?.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {m.user?.branch} • {m.user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold">
                      {m.role}
                    </span>

                    {m.role !== 'President' && m.role !== 'Faculty Coordinator' && (
                      <button
                        onClick={() => handleRemoveMember(m.user?._id || m.user)}
                        disabled={actionLoading}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Remove Member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Pending Applications (Manager / Admin) */}
      {activeTab === 'pending' && isManager && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Pending Membership Applications ({pendingList.length})
          </h2>

          {loadingRoster ? (
            <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
              Loading pending join requests...
            </div>
          ) : pendingList.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">
              No pending membership applications.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingList.map((p) => (
                <div
                  key={p.user?._id || p.user}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <Avatar user={p.user} size="sm" bgClass="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200" className="shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{p.user?.name}</p>
                        <span className="text-xs text-slate-400">({p.user?.branch})</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{p.statement}"</p>
                      <p className="text-[10px] text-slate-400">
                        Applied on: {new Date(p.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveMember(p.user?._id || p.user)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleRejectMember(p.user?._id || p.user)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 font-medium text-xs transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Join Club Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <UserPlus className="w-5 h-5" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Join {club.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your application will be sent to the club coordinator for review.
              </p>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Why do you want to join? (Optional Statement)
                </label>
                <textarea
                  rows={3}
                  value={joinStatement}
                  onChange={(e) => setJoinStatement(e.target.value)}
                  placeholder="Share your interests, skills, or why you'd like to participate..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubDetails;
