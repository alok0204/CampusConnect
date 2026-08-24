import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
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
  ExternalLink,
  Flame,
  ArrowRight,
} from 'lucide-react';

export const DashboardLayout = () => {
  const { user, logout, isAdmin, isFaculty } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
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
    // Poll unread notifications count every 20 seconds
    const interval = setInterval(fetchUnreadCount, 20000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
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
      if (res.data.success) {
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
        if (res.data.success) {
          setRecentNotifs(res.data.notifications);
          setUnreadCount(res.data.unreadCount);
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

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'My Submissions', path: '/events/my-events', icon: CalendarCheck2 },
    { name: 'Lost & Found', path: '/lost-found', icon: SearchCheck },
    { name: 'My Reports & Claims', path: '/lost-found/my-reports', icon: FileSearch },
    { name: 'Announcements', path: '/announcements', icon: Megaphone },
    ...(isFaculty || isAdmin
      ? [{ name: 'My Circulars', path: '/announcements/manage', icon: FileText }]
      : []),
    { name: 'Clubs & Societies', path: '/clubs', icon: Users },
    { name: 'My Memberships', path: '/clubs/my-clubs', icon: HeartHandshake },
    { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
    { name: 'My Profile', path: '/profile', icon: User },
  ];

  // Admin specific navigation
  const adminItems = [
    { name: 'Event Approvals', path: '/admin/events', icon: ShieldAlert },
    { name: 'Lost & Found Moderation', path: '/admin/lost-found', icon: ShieldAlert },
    { name: 'Announcements Console', path: '/admin/announcements', icon: ShieldAlert },
    { name: 'Clubs Governance', path: '/admin/clubs', icon: ShieldAlert },
    { name: 'Admin Console', path: '/admin', icon: Shield },
  ];

  // Format identity pill
  const getIdentityBadge = () => {
    if (!user) return '';
    if (user.role === 'ADMIN') return 'Administrator • Campus IT';
    if (user.role === 'FACULTY') {
      return `${user.department || 'Faculty'} • Staff`;
    }
    const parts = [];
    if (user.branch) parts.push(user.branch);
    if (user.year) parts.push(user.year);
    if (user.section) parts.push(`Sec ${user.section}`);
    return parts.join(' • ') || 'Student';
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

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-slate-200 fixed inset-y-0 z-30">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-200">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-none text-lg tracking-tight">
              CampusConnect
            </h1>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 mt-0.5">
              College Portal
            </p>
          </div>
        </div>

        {/* User Card Pill */}
        <div className="p-4 mx-3 mt-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <Avatar user={user} size="md" className="shrink-0 shadow-sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-500 truncate font-medium">
              {getIdentityBadge()}
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path === '/lost-found' &&
                location.pathname.startsWith('/lost-found') &&
                location.pathname !== '/lost-found/my-reports') ||
              (item.path === '/announcements' &&
                location.pathname.startsWith('/announcements') &&
                location.pathname !== '/announcements/manage') ||
              (item.path === '/clubs' &&
                location.pathname.startsWith('/clubs') &&
                location.pathname !== '/clubs/my-clubs') ||
              (item.path !== '/dashboard' &&
                item.path !== '/events' &&
                item.path !== '/lost-found' &&
                item.path !== '/announcements' &&
                item.path !== '/clubs' &&
                item.path !== '/notifications' &&
                location.pathname.startsWith(item.path)) ||
              (item.path === '/events' &&
                (location.pathname === '/events' || location.pathname === '/events/create'));

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-extrabold">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* Admin Navigation Section */}
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-slate-100">
              <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Admin Management
              </span>
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                      isActive
                        ? 'bg-red-50 text-red-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-red-600' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                    <span className="ml-auto text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">
                      Admin
                    </span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </nav>

        {/* Logout Bottom */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 text-red-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-900/50 backdrop-blur-sm flex">
          <div className="w-72 bg-white h-full flex flex-col p-4 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-900">CampusConnect</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 border-b border-slate-100 mb-2">
              <p className="text-sm font-bold text-slate-800">{user?.name}</p>
              <p className="text-xs text-slate-500">{getIdentityBadge()}</p>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg font-semibold text-sm ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-extrabold">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}

              {isAdmin && (
                <div className="pt-3 mt-3 border-t border-slate-100">
                  <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                    Admin
                  </span>
                  {adminItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg font-semibold text-sm ${
                          isActive
                            ? 'bg-red-50 text-red-700 font-bold'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-red-600' : 'text-slate-400'}`} />
                        <span>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </nav>

            <button
              onClick={handleLogout}
              className="mt-auto flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5 text-red-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Campus Connect Portal
              </span>
              <p className="text-sm font-bold text-slate-700">
                {user?.branch ? `${user.branch} Department` : 'Central Campus'}
              </p>
            </div>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Notification Bell & Live Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleToggleDropdown}
                className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px] font-black border-2 border-white animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Menu */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-400" />
                      <span className="font-bold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 text-[10px] font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-blue-300 hover:text-white font-semibold transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {loadingNotifs ? (
                      <div className="p-6 text-center text-xs text-slate-400">Loading updates...</div>
                    ) : recentNotifs.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No notifications yet. You're all caught up!
                      </div>
                    ) : (
                      recentNotifs.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${
                            !n.isRead ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              !n.isRead ? 'bg-blue-600' : 'bg-transparent'
                            }`}
                          ></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                {n.type}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {formatRelativeTime(n.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {n.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                    <Link
                      to="/notifications"
                      onClick={() => setNotifDropdownOpen(false)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                    >
                      <span>View All in Notification Center</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Profile Link */}
            <NavLink
              to="/profile"
              className="flex items-center gap-2.5 pl-3 border-l border-slate-200 hover:opacity-85 transition-opacity"
            >
              <Avatar user={user} size="sm" className="shadow-sm" />
              <div className="hidden md:block text-left leading-tight">
                <span className="text-xs font-bold text-slate-800 block truncate max-w-[120px]">
                  {user?.name}
                </span>
                <span className="text-[10px] font-medium text-slate-400 block">
                  {user?.role}
                </span>
              </div>
            </NavLink>
          </div>
        </header>

        {/* Page Content Rendered Here */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
