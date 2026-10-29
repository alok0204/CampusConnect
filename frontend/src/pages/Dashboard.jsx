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
  Plus,
  Clock,
  MapPin,
  ArrowRight,
  Flame,
  CalendarCheck2,
  FileSearch,
  Sparkles,
  ChevronRight,
  Bell,
  Building,
  CheckCircle2,
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
      if (res.data?.success) {
        setUpcomingEvents(res.data.events.slice(0, 4));
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
      if (res.data?.success) {
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
      if (res.data?.success) {
        setRecentAnnouncements(res.data.announcements.slice(0, 4));
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

      if (clubsRes.data?.success) {
        setActiveClubs(clubsRes.data.clubs.slice(0, 3));
      }
      if (myClubsRes.data?.success) {
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
      if (res.data?.success) {
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
    if (!user) return 'College Campus Portal';
    if (user.role === 'ADMIN') return 'Central Administration & Campus Management';
    if (user.role === 'FACULTY') return `${user.department || 'Faculty'} Department • Academic Staff`;
    return `${user.branch || 'Department'} • ${user.year || 'Student'} • Section ${user.section || 'A'}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryBadgeClass = (category) => {
    switch (category?.toLowerCase()) {
      case 'hackathon':
        return 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200/80 dark:border-violet-800/60';
      case 'technical':
      case 'tech':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60';
      case 'workshop':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60';
      case 'cultural':
      case 'arts':
        return 'bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border-pink-200/80 dark:border-pink-800/60';
      case 'sports':
        return 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200/80 dark:border-orange-800/60';
      case 'seminar':
      case 'webinar':
        return 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200/80 dark:border-cyan-800/60';
      default:
        return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60';
    }
  };

  const getAnnouncementBadgeClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/80 font-bold';
      case 'important':
        return 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80 font-bold';
      default:
        return 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/80 font-semibold';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Greeting & Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider tabular-nums">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200/80 dark:border-indigo-800/60">
              Spring Term 2026
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {getGreeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {getBranchSubtitle()}
          </p>
        </div>

        {/* Primary / Secondary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/events/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Host Event</span>
          </Link>
          <Link
            to="/lost-found/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200/80 dark:border-emerald-800/70 bg-white dark:bg-[#1e1e1e] hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold shadow-xs transition-all"
          >
            <SearchCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Report Item</span>
          </Link>
          {isAdmin || isFaculty ? (
            <Link
              to="/announcements/create"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-200/80 dark:border-amber-800/70 bg-white dark:bg-[#1e1e1e] hover:bg-amber-50/60 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs font-semibold shadow-xs transition-all"
            >
              <Megaphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Post Notice</span>
            </Link>
          ) : (
            <Link
              to="/clubs/create"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-200/80 dark:border-purple-800/70 bg-white dark:bg-[#1e1e1e] hover:bg-purple-50/60 dark:hover:bg-purple-950/30 text-purple-700 dark:text-purple-300 text-xs font-semibold shadow-xs transition-all"
            >
              <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Propose Club</span>
            </Link>
          )}
        </div>
      </div>

      {/* 2. Urgent Campus Alert Ribbon (Only when active) */}
      {urgentAlert && (
        <div className="rounded-xl p-3 sm:p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
              <Flame className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-200/80 dark:bg-rose-900 text-rose-800 dark:text-rose-100">
                  Urgent Notice
                </span>
                <span className="text-xs font-bold text-rose-950 dark:text-rose-100 truncate">
                  {urgentAlert.title}
                </span>
              </div>
              <p className="text-[11px] text-rose-800 dark:text-rose-300 line-clamp-1 mt-0.5">
                {urgentAlert.message}
              </p>
            </div>
          </div>
          <Link
            to={urgentAlert.metadata?.actionUrl || '/notifications'}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium shrink-0 transition-colors"
          >
            View Bulletin
          </Link>
        </div>
      )}

      {/* 3. Campus Pulse Strip (Integrated Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1 - Events */}
        <Link
          to="/events"
          className="bg-white dark:bg-[#121212] p-4 rounded-xl border border-slate-200/80 dark:border-[#262626] border-t-2 border-t-indigo-500 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md hover:shadow-indigo-500/5 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Campus Events
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {upcomingEvents.length}
            </span>
            <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
              Upcoming
            </span>
          </div>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 font-semibold mt-1 inline-flex items-center gap-1">
            Browse schedule <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>

        {/* Metric 2 - Circulars */}
        <Link
          to="/announcements"
          className="bg-white dark:bg-[#121212] p-4 rounded-xl border border-slate-200/80 dark:border-[#262626] border-t-2 border-t-amber-500 shadow-xs hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md hover:shadow-amber-500/5 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Circulars & Notices
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Megaphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {announcementCount}
            </span>
            {unreadAnnouncementCount > 0 ? (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300/70 dark:border-amber-700/60">
                {unreadAnnouncementCount} unread
              </span>
            ) : (
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                Published
              </span>
            )}
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-amber-300 font-semibold mt-1 inline-flex items-center gap-1">
            Open Gazette <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>

        {/* Metric 3 - Lost & Found */}
        <Link
          to="/lost-found"
          className="bg-white dark:bg-[#121212] p-4 rounded-xl border border-slate-200/80 dark:border-[#262626] border-t-2 border-t-emerald-500 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md hover:shadow-emerald-500/5 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Lost & Found
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center group-hover:scale-110 transition-transform">
              <SearchCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {lostFoundCount}
            </span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              Active notices
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 font-semibold mt-1 inline-flex items-center gap-1">
            Check listings <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>

        {/* Metric 4 - Guilds & Clubs */}
        <Link
          to="/clubs"
          className="bg-white dark:bg-[#121212] p-4 rounded-xl border border-slate-200/80 dark:border-[#262626] border-t-2 border-t-purple-500 shadow-xs hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md hover:shadow-purple-500/5 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Campus Guilds
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/60 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {myClubsCount}
            </span>
            <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
              Societies joined
            </span>
          </div>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 font-semibold mt-1 inline-flex items-center gap-1">
            View directory <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>
      </div>

      {/* 4. Main 12-Column Structured Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Columns: Scheduled Events + Official Circulars */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section: Upcoming Events */}
          <div className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200/80 dark:border-[#262626] border-t-4 border-t-indigo-500 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-[#262626] mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                    Scheduled Campus Events
                  </h2>
                  <p className="text-[11px] text-slate-400 font-normal">
                    Academic workshops, cultural festivals, and technical hackathons
                  </p>
                </div>
              </div>
              <Link
                to="/events"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <span>View all</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {loadingEvents ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-slate-100 dark:bg-[#1c1c1c] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="py-8 text-center rounded-xl bg-slate-50/70 dark:bg-[#181818] border border-dashed border-slate-200 dark:border-[#262626]">
                <p className="text-xs text-slate-400 font-medium">
                  No upcoming campus events scheduled at this moment.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-[#262626]">
                {upcomingEvents.map((evt) => (
                  <Link
                    key={evt._id}
                    to={`/events/${evt._id}`}
                    className="py-3 flex items-center justify-between gap-3 group hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 px-2.5 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Date block */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/80 dark:to-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex flex-col items-center justify-center shrink-0 border border-indigo-200/80 dark:border-indigo-800/70 shadow-2xs tabular-nums">
                        <span className="text-[11px] leading-tight font-extrabold">
                          {formatDate(evt.date).split(' ')[1]}
                        </span>
                        <span className="text-[8px] uppercase tracking-wider font-semibold text-indigo-500 dark:text-indigo-400 leading-none">
                          {formatDate(evt.date).split(' ')[0]}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase border ${getCategoryBadgeClass(evt.category)}`}>
                            {evt.category}
                          </span>
                          <span className="text-[11px] text-slate-400">•</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {evt.startTime}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {evt.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400 hidden sm:inline truncate max-w-[120px]">
                        {evt.venue}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Section: Official Campus Circulars */}
          <div className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200/80 dark:border-[#262626] border-t-4 border-t-amber-500 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-[#262626] mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/70 border border-amber-200/60 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                    Official Campus Circulars
                  </h2>
                  <p className="text-[11px] text-slate-400 font-normal">
                    Administrative bulletins, academic timetables, and campus orders
                  </p>
                </div>
              </div>
              <Link
                to="/announcements"
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 transition-colors"
              >
                <span>View all</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {loadingAnnouncements ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-slate-100 dark:bg-[#1c1c1c] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : recentAnnouncements.length === 0 ? (
              <div className="py-8 text-center rounded-xl bg-slate-50/70 dark:bg-[#181818] border border-dashed border-slate-200 dark:border-[#262626]">
                <p className="text-xs text-slate-400 font-medium">
                  No official circulars published recently.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-[#262626]">
                {recentAnnouncements.map((item) => (
                  <Link
                    key={item._id}
                    to={`/announcements/${item._id}`}
                    className="py-3 flex items-start justify-between gap-3 group hover:bg-amber-50/40 dark:hover:bg-amber-950/20 px-2.5 rounded-xl transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase tracking-wider border ${getAnnouncementBadgeClass(item.priority)}`}>
                          {item.priority || 'Notice'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium tabular-nums">
                          {formatDate(item.publishAt || item.createdAt)}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-[10px] text-slate-400 font-medium truncate">
                          {item.createdBy?.name || 'Academic Office'}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-normal">
                        {item.summary || item.content}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-amber-600 dark:group-hover:text-amber-400 shrink-0 mt-1 transition-colors" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Columns: Lost & Found Watch + Active Guilds */}
        <div className="lg:col-span-4 space-y-6">
          {/* Lost & Found Watch */}
          <div className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200/80 dark:border-[#262626] border-t-4 border-t-emerald-500 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-[#262626] mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <SearchCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                    Lost & Found Watch
                  </h3>
                  <p className="text-[11px] text-slate-400">Recently reported belongings</p>
                </div>
              </div>
              <Link
                to="/lost-found"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                <span>View all</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {loadingLostFound ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-slate-100 dark:bg-[#1c1c1c] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : recentLostFound.length === 0 ? (
              <div className="py-6 text-center rounded-xl bg-slate-50/70 dark:bg-[#181818] border border-dashed border-slate-200 dark:border-[#262626]">
                <p className="text-xs text-slate-400 font-medium">No open reports.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentLostFound.map((item) => (
                  <Link
                    key={item._id}
                    to={`/lost-found/${item._id}`}
                    className="p-2.5 rounded-xl border border-emerald-100/70 dark:border-[#262626] hover:border-emerald-300 dark:hover:border-emerald-700 bg-emerald-50/20 dark:bg-emerald-950/10 flex items-center gap-3 group transition-all"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-100/40 dark:bg-[#212121] overflow-hidden shrink-0 border border-emerald-200/60 dark:border-[#2e2e2e]">
                      {item.image ? (
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          <SearchCheck className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase border ${
                            item.type === 'lost'
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/60'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60'
                          }`}
                        >
                          {item.type}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {item.location}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                        {item.title}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Active Campus Clubs */}
          <div className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200/80 dark:border-[#262626] border-t-4 border-t-purple-500 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-[#262626] mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/70 border border-purple-200/60 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                    Student Societies
                  </h3>
                  <p className="text-[11px] text-slate-400">Join active campus guilds</p>
                </div>
              </div>
              <Link
                to="/clubs"
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 transition-colors"
              >
                <span>Directory</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {loadingClubs ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-slate-100 dark:bg-[#1c1c1c] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : activeClubs.length === 0 ? (
              <div className="py-6 text-center rounded-xl bg-slate-50/70 dark:bg-[#181818] border border-dashed border-slate-200 dark:border-[#262626]">
                <p className="text-xs text-slate-400 font-medium">No clubs found.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeClubs.map((club) => (
                  <Link
                    key={club._id}
                    to={`/clubs/${club._id}`}
                    className="p-2.5 rounded-xl border border-purple-100/70 dark:border-[#262626] hover:border-purple-300 dark:hover:border-purple-700 bg-purple-50/20 dark:bg-purple-950/10 flex items-center gap-3 group transition-all"
                  >
                    <div className="w-9 h-9 rounded-lg bg-purple-100/40 dark:bg-[#212121] overflow-hidden shrink-0 border border-purple-200/60 dark:border-[#2e2e2e]">
                      <img
                        src={getImageUrl(club.logo)}
                        alt={club.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                        {club.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                          {club.category}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">
                          • {club.memberCount} Members
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
