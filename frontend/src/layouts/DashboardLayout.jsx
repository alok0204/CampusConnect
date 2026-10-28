import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import Avatar from '../components/Avatar';
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck2,
  SearchCheck,
  Megaphone,
  Users,
  User,
  Shield,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  GraduationCap,
  FileSearch,
  FileText,
  HeartHandshake,
  Check,
  ChevronRight,
  ArrowRight,
  Search,
  Command,
} from 'lucide-react';

export const DashboardLayout = () => {
  const { user, logout, isAdmin, isFaculty } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Notification Bell State
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 25000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      if (res.data?.success) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const handleToggleDropdown = async () => {
    if (!notifDropdownOpen) {
      try {
        setLoadingNotifs(true);
        const res = await api.get('/notifications?limit=5');
        if (res.data?.success) {
          setRecentNotifs(res.data.notifications || []);
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch (err) {
        console.error('Error fetching recent notifications:', err);
      } finally {
        setLoadingNotifs(false);
      }
    }
    setNotifDropdownOpen(!notifDropdownOpen);
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await api.put(`/notifications/${notif._id}/read`);
        setRecentNotifs((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        fetchUnreadCount();
      } catch (e) {
        console.error('Failed to mark read:', e);
      }
    }
    setNotifDropdownOpen(false);
    if (notif.metadata?.actionUrl) {
      navigate(notif.metadata.actionUrl);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await api.put('/notifications/mark-all-read');
      setRecentNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Structured Navigation Groups
  const coreNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Lost & Found', path: '/lost-found', icon: SearchCheck },
    { name: 'Announcements', path: '/announcements', icon: Megaphone },
    { name: 'Clubs & Societies', path: '/clubs', icon: Users },
  ];

  const personalNavItems = [
    { name: 'My Events', path: '/events/my-events', icon: CalendarCheck2 },
    { name: 'My Reports & Claims', path: '/lost-found/my-reports', icon: FileSearch },
    { name: 'My Clubs', path: '/clubs/my-clubs', icon: HeartHandshake },
    ...(isFaculty || isAdmin
      ? [{ name: 'My Circulars', path: '/announcements/manage', icon: FileText }]
      : []),
    { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
    { name: 'Profile & Settings', path: '/profile', icon: User },
  ];

  const adminNavItems = [
    { name: 'Overview', path: '/admin', icon: Shield },
    { name: 'Event Approvals', path: '/admin/events', icon: ShieldAlert },
    { name: 'Lost & Found', path: '/admin/lost-found', icon: ShieldAlert },
    { name: 'Circulars Console', path: '/admin/announcements', icon: ShieldAlert },
    { name: 'Clubs Governance', path: '/admin/clubs', icon: ShieldAlert },
  ];

  const getIdentityBadge = () => {
    if (!user) return 'Guest';
    if (user.role === 'ADMIN') return 'Administrator • IT Lead';
    if (user.role === 'FACULTY') {
      return `${user.department || 'Academic'} • Faculty`;
    }
    const parts = [];
    if (user.branch) parts.push(user.branch);
    if (user.year) parts.push(user.year);
    if (user.section) parts.push(`Sec ${user.section}`);
    return parts.join(' • ') || 'Undergraduate Student';
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMin = Math.floor((now - date) / (1000 * 60));
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Derive Current Page Title for Header Breadcrumb
  const getCurrentPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Campus Overview';
    if (path.startsWith('/events/create')) return 'Create Event';
    if (path.startsWith('/events/my-events')) return 'My Event Registrations';
    if (path.startsWith('/events/')) return 'Event Overview';
    if (path === '/events') return 'Events Directory';
    if (path.startsWith('/lost-found/create')) return 'Report Item';
    if (path.startsWith('/lost-found/my-reports')) return 'My Reports & Claims';
    if (path.startsWith('/lost-found/')) return 'Lost & Found Record';
    if (path === '/lost-found') return 'Lost & Found Hub';
    if (path.startsWith('/announcements/create')) return 'Publish Circular';
    if (path.startsWith('/announcements/manage')) return 'Manage Circulars';
    if (path.startsWith('/announcements/')) return 'Circular Bulletin';
    if (path === '/announcements') return 'Campus Circulars';
    if (path.startsWith('/clubs/create')) return 'Propose Society';
    if (path.startsWith('/clubs/my-clubs')) return 'My Active Societies';
    if (path.startsWith('/clubs/')) return 'Club Profile';
    if (path === '/clubs') return 'Clubs & Societies';
    if (path === '/notifications') return 'Notification Center';
    if (path === '/profile') return 'My Academic Profile';
    if (path.startsWith('/admin')) return 'Administrative Governance';
    return 'Campus Portal';
  };

  const renderNavLink = (item, isMobile = false) => {
    const Icon = item.icon;
    const isDashboard = item.path === '/dashboard';
    const isActive = isDashboard
      ? location.pathname === '/dashboard'
      : location.pathname === item.path ||
        (item.path !== '/events/my-events' &&
          item.path !== '/lost-found/my-reports' &&
          item.path !== '/announcements/manage' &&
          item.path !== '/clubs/my-clubs' &&
          item.path !== '/admin' &&
          item.path !== '/profile' &&
          item.path !== '/notifications' &&
          location.pathname.startsWith(item.path));

    return (
      <NavLink
        key={item.name}
        to={item.path}
        onClick={isMobile ? () => setMobileMenuOpen(false) : undefined}
        className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] transition-all duration-150 ${
          isActive
            ? 'bg-slate-100 dark:bg-[#262626] text-slate-900 dark:text-white font-semibold'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#181818] font-normal'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <Icon
            className={`w-4 h-4 shrink-0 transition-colors ${
              isActive
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
            }`}
          />
          <span className="truncate">{item.name}</span>
        </div>
        {item.badge > 0 && (
          <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 dark:bg-white text-white dark:text-black leading-none">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-black flex text-slate-900 dark:text-slate-100 antialiased">
      {/* Desktop Persistent Left Navigation Rail (Linear Style) */}
      <aside className="hidden lg:flex lg:w-60 flex-col bg-white dark:bg-black border-r border-slate-200/70 dark:border-[#262626] fixed inset-y-0 z-30 select-none">
        {/* Brand Header */}
        <div className="h-14 flex items-center px-4 border-b border-slate-100 dark:border-[#262626] gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-black shadow-xs">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-slate-900 dark:text-white text-sm">
                CampusConnect
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#262626] text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-[#383838]">
                PRO
              </span>
            </div>
          </div>
        </div>

        {/* User Card */}
        <Link
          to="/profile"
          className="p-2.5 mx-3 mt-3 rounded-xl bg-slate-50/80 dark:bg-[#121212] hover:bg-slate-100/80 dark:hover:bg-[#1a1a1a] border border-slate-200/60 dark:border-[#262626] flex items-center gap-2.5 transition-colors group cursor-pointer"
        >
          <Avatar user={user} size="sm" className="shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              {user?.name || 'Campus Member'}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-medium">
              {getIdentityBadge()}
            </p>
          </div>
        </Link>

        {/* Navigation Sections */}
        <div className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
          {/* Core Modules */}
          <div>
            <span className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
              Explore
            </span>
            <nav className="space-y-0.5">{coreNavItems.map((item) => renderNavLink(item))}</nav>
          </div>

          {/* Personal Activity */}
          <div>
            <span className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
              Workspace
            </span>
            <nav className="space-y-0.5">{personalNavItems.map((item) => renderNavLink(item))}</nav>
          </div>

          {/* Admin Tools */}
          {isAdmin && (
            <div className="pt-2 border-t border-slate-100 dark:border-[#262626]">
              <div className="flex items-center justify-between px-2.5 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Governance
                </span>
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50">
                  Admin
                </span>
              </div>
              <nav className="space-y-0.5">{adminNavItems.map((item) => renderNavLink(item))}</nav>
            </div>
          )}
        </div>

        {/* Footer / Sign Out */}
        <div className="p-3 border-t border-slate-100 dark:border-[#262626]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Sheet */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-sm flex">
          <div className="w-72 bg-white dark:bg-black h-full flex flex-col p-4 shadow-2xl border-r border-slate-200 dark:border-[#262626] animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#262626]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-black">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-slate-900 dark:text-white">CampusConnect</h2>
                  <p className="text-[10px] text-slate-400">Academic Portal</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-[#262626] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 my-3 rounded-xl bg-slate-50 dark:bg-[#121212] border border-slate-100 dark:border-[#262626] flex items-center gap-2.5">
              <Avatar user={user} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {user?.name}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{getIdentityBadge()}</p>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto py-1">
              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-400 block px-2 mb-1">
                  Explore
                </span>
                <nav className="space-y-0.5">
                  {coreNavItems.map((item) => renderNavLink(item, true))}
                </nav>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-400 block px-2 mb-1">
                  Workspace
                </span>
                <nav className="space-y-0.5">
                  {personalNavItems.map((item) => renderNavLink(item, true))}
                </nav>
              </div>
              {isAdmin && (
                <div>
                  <span className="text-[10px] font-semibold uppercase text-amber-600 block px-2 mb-1">
                    Admin
                  </span>
                  <nav className="space-y-0.5">
                    {adminNavItems.map((item) => renderNavLink(item, true))}
                  </nav>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="mt-auto flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-medium text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col lg:pl-60 min-w-0">
        {/* Sleek Top Navigation Bar (Linear / Stripe style) */}
        <header className="h-14 bg-white/80 dark:bg-black/90 backdrop-blur-md border-b border-slate-200/70 dark:border-[#262626] sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 transition-colors">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#262626] transition-colors"
              aria-label="Open mobile menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">
                Campus Portal
              </span>
              <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">/</span>
              <h1 className="font-semibold text-slate-900 dark:text-white tracking-tight text-xs sm:text-sm">
                {getCurrentPageTitle()}
              </h1>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Search trigger */}
            <button
              onClick={() => navigate('/events')}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200/70 dark:border-[#262626] bg-slate-50/70 dark:bg-[#121212] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Quick search...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#262626] border border-slate-200 dark:border-[#363636] text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                /
              </kbd>
            </button>

            {/* Dark / Light Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#262626] hover:text-slate-900 dark:hover:text-white transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Notification Bell & Popover */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleToggleDropdown}
                className="relative p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#262626] hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-500 ring-2 ring-white dark:ring-black"></span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#121212] rounded-2xl border border-slate-200/80 dark:border-[#262626] shadow-dropdown z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3.5 border-b border-slate-100 dark:border-[#262626] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                      <span className="font-semibold text-xs text-slate-900 dark:text-white">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-[#262626] text-slate-800 dark:text-white text-[10px] font-bold border border-slate-200/60 dark:border-[#383838]">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-slate-600 dark:text-slate-300 hover:underline font-semibold flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-[#262626]">
                    {loadingNotifs ? (
                      <div className="p-6 text-center text-xs text-slate-400 animate-pulse">
                        Loading updates...
                      </div>
                    ) : recentNotifs.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No notifications to show.
                      </div>
                    ) : (
                      recentNotifs.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3 text-xs cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-[#181818] flex items-start gap-2.5 ${
                            !n.isRead ? 'bg-slate-50/70 dark:bg-[#181818]' : ''
                          }`}
                        >
                          <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0 opacity-0 group-hover:opacity-100">
                            {!n.isRead && <span className="block w-2 h-2 rounded-full bg-rose-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                              {n.title}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {formatRelativeTime(n.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-center">
                    <Link
                      to="/notifications"
                      onClick={() => setNotifDropdownOpen(false)}
                      className="text-xs font-semibold text-slate-900 dark:text-white hover:underline flex items-center justify-center gap-1"
                    >
                      <span>View All Activity</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Pill */}
            <Link
              to="/profile"
              className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Avatar user={user} size="xs" shape="circle" className="w-6 h-6" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden md:inline">
                {user?.name?.split(' ')[0]}
              </span>
            </Link>
          </div>
        </header>

        {/* Dynamic Outlet Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
