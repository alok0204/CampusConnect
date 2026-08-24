import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
import {
  Calendar,
  SearchCheck,
  Megaphone,
  Users,
  ArrowUpRight,
  Sparkles,
  PlusCircle,
  Clock,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Tag,
  AlertTriangle,
  GraduationCap,
  Bell,
  Flame,
  Activity,
} from 'lucide-react';

export const Dashboard = () => {
  const { user, isAdmin, isFaculty } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [recentLostFound, setRecentLostFound] = useState([]);
  const [lostFoundCount, setLostFoundCount] = useState(0);
  const [loadingLostFound, setLoadingLostFound] = useState(true);

  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [unreadAnnouncementCount, setUnreadAnnouncementCount] = useState(0);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  const [activeClubs, setActiveClubs] = useState([]);
  const [myClubsCount, setMyClubsCount] = useState(0);
  const [loadingClubs, setLoadingClubs] = useState(true);

  // Notification and Urgent Bulletin State
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [urgentAlert, setUrgentAlert] = useState(null);

  useEffect(() => {
    fetchUpcomingEvents();
    fetchRecentLostFound();
    fetchRecentAnnouncements();
    fetchClubsData();
    fetchNotificationData();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      setLoadingEvents(true);
      const res = await api.get('/events?sort=date_asc');
      if (res.data.success) {
        setUpcomingEvents(res.data.events.slice(0, 3));
      }
    } catch (err) {
      console.error('Failed to load dashboard events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchRecentLostFound = async () => {
    try {
      setLoadingLostFound(true);
      const res = await api.get('/lost-found?sort=newest');
      if (res.data.success) {
        setRecentLostFound(res.data.items.slice(0, 3));
        setLostFoundCount(res.data.count || res.data.items.length);
      }
    } catch (err) {
      console.error('Failed to load dashboard lost & found items:', err);
    } finally {
      setLoadingLostFound(false);
    }
  };

  const fetchRecentAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true);
      const res = await api.get('/announcements?sort=newest');
      if (res.data.success) {
        setRecentAnnouncements(res.data.announcements.slice(0, 3));
        setAnnouncementCount(res.data.count || res.data.announcements.length);
        setUnreadAnnouncementCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load dashboard announcements:', err);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const fetchClubsData = async () => {
    try {
      setLoadingClubs(true);
      const [clubsRes, myClubsRes] = await Promise.all([
        api.get('/clubs?sort=members'),
        api.get('/clubs/my-clubs'),
      ]);

      if (clubsRes.data.success) {
        setActiveClubs(clubsRes.data.clubs.slice(0, 3));
      }
      if (myClubsRes.data.success) {
        setMyClubsCount(myClubsRes.data.joinedClubs?.length || 0);
      }
    } catch (err) {
      console.error('Failed to load dashboard clubs data:', err);
    } finally {
      setLoadingClubs(false);
    }
  };

  const fetchNotificationData = async () => {
    try {
      const res = await api.get('/notifications?limit=5');
      if (res.data.success) {
        setUnreadNotifCount(res.data.unreadCount);
        setUnreadNotifications(res.data.notifications);

        // Check for unread urgent alert
        const urgent = res.data.notifications.find(
          (n) => !n.isRead && n.priority === 'urgent'
        );
        if (urgent) {
          setUrgentAlert(urgent);
        }
      }
    } catch (err) {
      console.error('Failed to load notifications for dashboard:', err);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getBranchSubtitle = () => {
    if (!user) return '';
    if (user.role === 'ADMIN') return 'Central Administration & Campus Management';
    if (user.role === 'FACULTY') return `${user.department || 'Faculty'} • Staff Portal`;
    return `${user.branch || 'Branch'} • ${user.year || 'Student'} • Section ${user.section || 'A'}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Urgent Bulletin Notification Banner */}
      {urgentAlert && (
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-200">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-red-200 text-red-900 text-[10px] font-black uppercase">
                  Urgent Notice
                </span>
                <span className="text-xs font-bold text-red-950 truncate">{urgentAlert.title}</span>
              </div>
              <p className="text-xs text-red-800 line-clamp-1 mt-0.5">{urgentAlert.message}</p>
            </div>
          </div>
          <Link
            to={urgentAlert.metadata?.actionUrl || '/notifications'}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shrink-0 transition-colors shadow-sm"
          >
            Review Now
          </Link>
        </div>
      )}

      {/* Dashboard Greeting Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-sm mb-3">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Campus Connect Portal</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {getGreeting()}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-blue-100 font-medium text-sm sm:text-base mt-1">
              {getBranchSubtitle()}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/events/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-xs sm:text-sm hover:bg-blue-50 transition-all shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Host Event</span>
            </Link>
            <Link
              to="/clubs/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/40 text-white border border-white/20 font-bold text-xs sm:text-sm hover:bg-emerald-500/50 backdrop-blur-sm transition-all"
            >
              <Users className="w-4 h-4" />
              <span>Propose Club</span>
            </Link>
            <Link
              to="/lost-found/create?type=lost"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/30 text-white border border-white/20 font-bold text-xs sm:text-sm hover:bg-blue-500/40 backdrop-blur-sm transition-all"
            >
              <SearchCheck className="w-4 h-4" />
              <span>Report Item</span>
            </Link>
          </div>
        </div>

        {/* Decorative background circles */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none"></div>
        <div className="absolute right-32 -top-12 w-32 h-32 rounded-full bg-white/5 pointer-events-none"></div>
      </div>

      {/* Summary Cards Row (4 Modules) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Module 1: Events Card */}
        <Link
          to="/events"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all flex items-start gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Campus Events
            </span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              Filtered for {user?.branch || 'You'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Common & branch verified listings
            </p>
          </div>
        </Link>

        {/* Module 2: Lost & Found Card */}
        <Link
          to="/lost-found"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 transition-all flex items-start gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
            <SearchCheck className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Lost & Found
            </span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {lostFoundCount} Active Notice{lostFoundCount === 1 ? '' : 's'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Report lost items or claim recoveries
            </p>
          </div>
        </Link>

        {/* Module 3: Announcements Card */}
        <Link
          to="/announcements"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 transition-all flex items-start gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Official Circulars
            </span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {announcementCount} Notice{announcementCount === 1 ? '' : 's'}
              {unreadAnnouncementCount > 0 && (
                <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-extrabold">
                  {unreadAnnouncementCount} New
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Academic, exam & department notices
            </p>
          </div>
        </Link>

        {/* Module 4: Clubs Card */}
        <Link
          to="/clubs"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all flex items-start gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Student Clubs
            </span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {myClubsCount} Membership{myClubsCount === 1 ? '' : 's'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Technical guilds, music & arts societies
            </p>
          </div>
        </Link>
      </div>

      {/* Live Modules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: EVENTS (LIVE PREVIEW) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    Upcoming Events
                  </h2>
                  <span className="text-xs text-slate-400">
                    Verified for {user?.branch || 'All'}
                  </span>
                </div>
              </div>
              <Link
                to="/events"
                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                title="View all events"
              >
                <ArrowUpRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Live Events List */}
            {loadingEvents ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="py-6 px-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                <p className="text-xs font-semibold text-slate-600">No upcoming events yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((evt) => (
                  <Link
                    key={evt._id}
                    to={`/events/${evt._id}`}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-100 hover:border-blue-200 transition-all flex items-center justify-between gap-3 group block"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex flex-col items-center justify-center shrink-0">
                        <span>{formatDate(evt.date).split(' ')[1]}</span>
                        <span className="text-[10px] font-normal leading-none">
                          {formatDate(evt.date).split(' ')[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {evt.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {evt.venue} • {evt.startTime}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/events"
            className="mt-4 w-full py-2.5 rounded-xl border border-blue-200 text-blue-600 font-bold text-xs text-center hover:bg-blue-50 transition-colors block"
          >
            Explore All Campus Events →
          </Link>
        </div>

        {/* Section 2: CLUBS (LIVE PREVIEW) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    Featured Clubs & Chapters
                  </h2>
                  <span className="text-xs text-slate-400">Popular student organizations</span>
                </div>
              </div>
              <Link
                to="/clubs"
                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                title="View all clubs"
              >
                <ArrowUpRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Live Clubs List */}
            {loadingClubs ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : activeClubs.length === 0 ? (
              <div className="py-6 px-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                <p className="text-xs font-semibold text-slate-600">No active clubs found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeClubs.map((c) => (
                  <Link
                    key={c._id}
                    to={`/clubs/${c._id}`}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-100 hover:border-emerald-200 transition-all flex items-center justify-between gap-3 group block"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white overflow-hidden shrink-0 border border-slate-200">
                        <img src={getImageUrl(c.logo)} alt={c.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                          {c.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {c.category} • {c.memberCount} Members
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/clubs"
            className="mt-4 w-full py-2.5 rounded-xl border border-emerald-200 text-emerald-700 font-bold text-xs text-center hover:bg-emerald-50 transition-colors block"
          >
            Explore Student Organizations →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
