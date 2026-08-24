import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ImageViewerModal from '../components/ImageViewerModal';
import Avatar from '../components/Avatar';
import { getImageUrl } from '../utils/imageUrl';
import {
  Calendar as CalendarIcon,
  Search,
  Filter,
  MapPin,
  Clock,
  User,
  PlusCircle,
  Sparkles,
  ArrowRight,
  Building,
  CheckCircle2,
  CalendarDays,
  X,
  Maximize2,
  GitCommit,
  LayoutGrid,
  Info,
  CalendarRange,
  Flame,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/**
 * Robust helper to convert event date & start/end time into a precise comparable timestamp
 */
export const parseEventDateTime = (dateStr, timeStr) => {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;

  let hours = 0;
  let minutes = 0;

  if (timeStr && typeof timeStr === 'string') {
    const cleanTime = timeStr.trim().toUpperCase();
    const match = cleanTime.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/);
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = match[2] ? parseInt(match[2], 10) : 0;
      const ampm = match[3];
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    }
  }

  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hours, minutes).getTime();
};

/**
 * Category color badge helper for calendar dots
 */
const getCategoryDotColor = (category) => {
  switch ((category || '').toLowerCase()) {
    case 'technical':
    case 'hackathon':
      return 'bg-blue-500';
    case 'workshop':
    case 'seminar':
      return 'bg-purple-500';
    case 'cultural':
    case 'fest':
      return 'bg-pink-500';
    case 'sports':
      return 'bg-emerald-500';
    default:
      return 'bg-amber-500';
  }
};

export const Events = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  // View state: 'timeline' (vertical chronological timeline) or 'grid'
  const [viewMode, setViewMode] = useState('timeline');

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState('ALL'); // 'ALL', 'UPCOMING', 'TODAY', 'PAST'
  const [category, setCategory] = useState('ALL');
  const [branch, setBranch] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Interactive Calendar state
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-11
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [isCalendarCollapsed, setIsCalendarCollapsed] = useState(true);

  const categories = [
    'ALL',
    'Technical',
    'Hackathon',
    'Workshop',
    'Seminar',
    'Cultural',
    'Sports',
    'Fest',
    'Other',
  ];

  const branches = ['ALL', 'CSE', 'ECE', 'ME', 'CE', 'IT', 'EE', 'AIDS'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    fetchEvents();
  }, [category, branch, startDate, endDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (category && category !== 'ALL') params.append('category', category);
      if (branch && branch !== 'ALL') params.append('branch', branch);
      if (search && search.trim()) params.append('search', search.trim());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('sort', 'date_asc');

      const res = await api.get(`/events?${params.toString()}`);
      if (res.data.success) {
        setEvents(res.data.events || []);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
      setError(err.response?.data?.message || 'Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const clearFilters = () => {
    setSearch('');
    setTimeFilter('ALL');
    setCategory('ALL');
    setBranch('ALL');
    setStartDate('');
    setEndDate('');
    setSelectedDateKey(null);
  };

  const hasActiveFilters =
    search ||
    timeFilter !== 'ALL' ||
    category !== 'ALL' ||
    branch !== 'ALL' ||
    startDate ||
    endDate;

  const isTodayDate = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const eventDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return eventDay.getTime() === today.getTime();
  };

  const isPastEvent = (event) => {
    if (!event?.date) return false;
    const eventDateTime = parseEventDateTime(event.date, event.endTime || event.startTime);
    return eventDateTime < Date.now() && !isTodayDate(event.date);
  };

  const isUpcomingEvent = (event) => {
    if (!event?.date) return false;
    const d = new Date(event.date);
    const eventDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return eventDay.getTime() > today.getTime();
  };

  // --------------------------------------------------------------------------
  // Chronological Sorting & Filtering Pipeline
  // --------------------------------------------------------------------------
  const sortedAndFilteredEvents = useMemo(() => {
    let result = [...events];

    // Client-side search refinement
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.organizer?.toLowerCase().includes(q) ||
          e.venue?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q)
      );
    }

    // Time horizon filter
    if (timeFilter === 'TODAY') {
      result = result.filter((e) => isTodayDate(e.date));
    } else if (timeFilter === 'UPCOMING') {
      result = result.filter((e) => isUpcomingEvent(e) || isTodayDate(e.date));
    } else if (timeFilter === 'PAST') {
      result = result.filter((e) => isPastEvent(e));
    }

    // Strict Chronological Sort: Date ASC -> StartTime ASC -> EndTime ASC
    result.sort((a, b) => {
      const timeA = parseEventDateTime(a.date, a.startTime);
      const timeB = parseEventDateTime(b.date, b.startTime);
      if (timeA !== timeB) return timeA - timeB;

      const endA = parseEventDateTime(a.date, a.endTime);
      const endB = parseEventDateTime(b.date, b.endTime);
      return endA - endB;
    });

    return result;
  }, [events, search, timeFilter, today]);

  // --------------------------------------------------------------------------
  // Map of Events by Date Key for Calendar & Timeline (YYYY-MM-DD)
  // --------------------------------------------------------------------------
  const eventsByDateMap = useMemo(() => {
    const map = new Map();
    sortedAndFilteredEvents.forEach((ev) => {
      if (!ev.date) return;
      const d = new Date(ev.date);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey).push(ev);
    });
    return map;
  }, [sortedAndFilteredEvents]);

  // --------------------------------------------------------------------------
  // Group Chronological Events by Date & Time Slot for Continuous Vertical Timeline
  // --------------------------------------------------------------------------
  const timelineDateGroups = useMemo(() => {
    if (sortedAndFilteredEvents.length === 0) return [];

    const groupsMap = new Map();

    sortedAndFilteredEvents.forEach((event) => {
      if (!event.date) return;
      const d = new Date(event.date);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;

      if (!groupsMap.has(dateKey)) {
        const isToday = isTodayDate(event.date);
        const isPast = !isToday && new Date(d.getFullYear(), d.getMonth(), d.getDate()) < today;

        groupsMap.set(dateKey, {
          dateKey,
          dateObj: d,
          formattedDate: d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          isToday,
          isPast,
          events: [],
        });
      }

      groupsMap.get(dateKey).events.push(event);
    });

    const groups = Array.from(groupsMap.values()).sort((a, b) => a.dateObj - b.dateObj);
    groups.forEach((g) => {
      g.events.sort((a, b) => {
        const timeA = parseEventDateTime(a.date, a.startTime);
        const timeB = parseEventDateTime(b.date, b.startTime);
        if (timeA !== timeB) return timeA - timeB;
        return parseEventDateTime(a.date, a.endTime) - parseEventDateTime(b.date, b.endTime);
      });

      // Group into time slots (parallel cards only if exact same start time)
      const slotMap = new Map();
      g.events.forEach((ev) => {
        const cleanTime = (ev.startTime || 'TBD').trim().toUpperCase();
        if (!slotMap.has(cleanTime)) {
          slotMap.set(cleanTime, {
            timeKey: `${g.dateKey}-${cleanTime}`,
            startTime: ev.startTime,
            events: [],
          });
        }
        slotMap.get(cleanTime).events.push(ev);
      });

      g.timeSlots = Array.from(slotMap.values());
      g.eventsCount = g.events.length;
    });

    return groups;
  }, [sortedAndFilteredEvents, today]);

  // --------------------------------------------------------------------------
  // Calendar Days Grid Construction
  // --------------------------------------------------------------------------
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(calYear, calMonth, 1).getDay(); // 0 (Sun) - 6 (Sat)
    const daysInCurrentMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();

    const days = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = calMonth === 0 ? 11 : calMonth - 1;
      const prevYear = calMonth === 0 ? calYear - 1 : calYear;
      const dateKey = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(
        dayNum
      ).padStart(2, '0')}`;
      days.push({
        dayNum,
        dateKey,
        isCurrentMonth: false,
        isToday: false,
        events: eventsByDateMap.get(dateKey) || [],
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(
        2,
        '0'
      )}`;
      const isToday =
        calYear === today.getFullYear() &&
        calMonth === today.getMonth() &&
        d === today.getDate();

      days.push({
        dayNum: d,
        dateKey,
        isCurrentMonth: true,
        isToday,
        events: eventsByDateMap.get(dateKey) || [],
      });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remainingSlots = 35 - days.length >= 0 ? 35 - days.length : 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const nextMonth = calMonth === 11 ? 0 : calMonth + 1;
      const nextYear = calMonth === 11 ? calYear + 1 : calYear;
      const dateKey = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(
        2,
        '0'
      )}`;
      days.push({
        dayNum: i,
        dateKey,
        isCurrentMonth: false,
        isToday: false,
        events: eventsByDateMap.get(dateKey) || [],
      });
    }

    return days;
  }, [calYear, calMonth, eventsByDateMap, today]);

  const monthName = new Date(calYear, calMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const handleTodayClick = () => {
    setCalYear(today.getFullYear());
    setCalMonth(today.getMonth());
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(today.getDate()).padStart(2, '0')}`;
    setSelectedDateKey(todayKey);

    // Scroll to today's section if present in timeline
    const target = document.getElementById(`date-milestone-${todayKey}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDateClick = (dayObj) => {
    setSelectedDateKey(dayObj.dateKey);

    // Scroll smoothly to that date's section on the chronological timeline
    const target = document.getElementById(`date-milestone-${dayObj.dateKey}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const selectedDateEvents = selectedDateKey ? eventsByDateMap.get(selectedDateKey) || [] : [];
  const selectedDateFormatted = selectedDateKey
    ? new Date(selectedDateKey + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-4 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-sm mb-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Campus Event Calendar & Timeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Campus Events & Calendar
          </h1>
          <p className="text-blue-100 font-medium text-xs sm:text-sm mt-1 max-w-xl">
            Explore verified technical hackathons, symposiums, workshops, and cultural fests arranged sequentially.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/events/my-events"
            className="px-4 py-2.5 rounded-xl bg-blue-500/30 text-white border border-white/20 font-bold text-xs sm:text-sm hover:bg-blue-500/40 backdrop-blur-sm transition-all"
          >
            My Submissions
          </Link>
          <Link
            to="/events/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-xs sm:text-sm hover:bg-blue-50 transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Host an Event</span>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-[#181818] rounded-2xl border border-slate-200 dark:border-[#303030] shadow-sm p-4 sm:p-6 space-y-4">
        {/* Search Bar & View Mode Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events by title, organizer, topic, or venue..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#303030] rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-colors shrink-0"
            >
              Search
            </button>
          </form>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-[#202020] rounded-xl border border-slate-200/80 dark:border-[#303030] shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-[#181818] text-blue-700 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Vertical Chronological Timeline View"
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Timeline View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#181818] text-blue-700 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Standard Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
          </div>
        </div>

        {/* Horizon Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100 dark:border-[#303030]">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">
            Timeline Horizon:
          </span>
          {[
            { key: 'ALL', label: 'All Chronological Events' },
            { key: 'UPCOMING', label: 'Upcoming Events' },
            { key: 'TODAY', label: "Today's Events" },
            { key: 'PAST', label: 'Past Events' },
          ].map((tf) => (
            <button
              key={tf.key}
              type="button"
              onClick={() => setTimeFilter(tf.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeFilter === tf.key
                  ? 'bg-slate-900 dark:bg-[#303030] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-[#202020] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#252525]'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                category === cat
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'bg-slate-50 dark:bg-[#202020] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#252525] border border-slate-200/80 dark:border-[#303030]'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Secondary Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-[#303030] text-xs">
          {/* Branch Filter */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1 uppercase tracking-wider text-[11px]">
              Branch Restriction
            </label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#303030] rounded-xl font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b === 'ALL' ? 'All Branches (College-wide)' : `${b} Branch Only`}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1 uppercase tracking-wider text-[11px]">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#303030] rounded-xl font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1 uppercase tracking-wider text-[11px]">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#303030] rounded-xl font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Active Filter Summary Bar */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#303030]">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing {sortedAndFilteredEvents.length} chronological events across{' '}
              {timelineDateGroups.length} dates
            </span>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* ==================================================================
          INTERACTIVE EVENT CALENDAR (COLLAPSED BY DEFAULT)
          ================================================================== */}
      <div
        className={`bg-white dark:bg-[#181818] rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-[#303030] shadow-sm transition-all ${
          isCalendarCollapsed ? 'p-3.5 sm:p-4' : 'p-4 sm:p-6 space-y-4'
        }`}
      >
        {/* Calendar Header & Month Navigation Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div
            onClick={() => setIsCalendarCollapsed(!isCalendarCollapsed)}
            className="flex items-center gap-2.5 cursor-pointer select-none group/title"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover/title:bg-blue-100 dark:group-hover/title:bg-blue-900/40 transition-colors">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 group-hover/title:text-blue-600 dark:group-hover/title:text-blue-400 transition-colors">
                <span>Event Calendar</span>
                <span className="text-xs font-semibold text-slate-400">({monthName})</span>
              </h2>
              {isCalendarCollapsed ? (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Click to expand calendar view and browse dates
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Click any date with event dots to jump directly to its chronological milestone
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTodayClick}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/60 dark:border-blue-800/40 transition-colors"
            >
              Today
            </button>

            <div className="flex items-center bg-slate-100 dark:bg-[#202020] rounded-xl border border-slate-200/80 dark:border-[#303030] p-0.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-[#181818] hover:text-slate-900 dark:hover:text-white transition-all"
                title="Previous Month"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-800 dark:text-white px-2.5 select-none">
                {monthName}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-[#181818] hover:text-slate-900 dark:hover:text-white transition-all"
                title="Next Month"
                aria-label="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsCalendarCollapsed(!isCalendarCollapsed)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-[#202020] transition-colors"
              title={isCalendarCollapsed ? 'Expand Calendar' : 'Collapse Calendar'}
              aria-label={isCalendarCollapsed ? 'Expand Calendar' : 'Collapse Calendar'}
            >
              {isCalendarCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable Calendar Grid */}
        {!isCalendarCollapsed && (
          <div className="space-y-3 pt-2">
            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider py-1 border-b border-slate-100 dark:border-[#282828]">
              {weekDays.map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* 7-Column Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarDays.map((dayObj, idx) => {
                const hasEvents = dayObj.events.length > 0;
                const isSelected = selectedDateKey === dayObj.dateKey;
                const isToday = dayObj.isToday;

                return (
                  <button
                    key={`${dayObj.dateKey}-${idx}`}
                    type="button"
                    onClick={() => handleDateClick(dayObj)}
                    className={`min-h-[52px] sm:min-h-[60px] p-1.5 rounded-xl sm:rounded-2xl border flex flex-col justify-between items-center transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 ring-2 ring-blue-500/40 z-10'
                        : isToday
                        ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700/60 font-black'
                        : dayObj.isCurrentMonth
                        ? hasEvents
                          ? 'bg-slate-50 dark:bg-[#202020] text-slate-900 dark:text-white border-slate-200 dark:border-[#303030] hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs'
                          : 'bg-transparent text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-50 dark:hover:bg-[#202020]'
                        : 'bg-transparent text-slate-400/50 dark:text-slate-600/50 border-transparent'
                    }`}
                  >
                    {/* Day Number */}
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        isSelected
                          ? 'text-white font-extrabold'
                          : isToday
                          ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                          : ''
                      }`}
                    >
                      {dayObj.dayNum}
                    </span>

                    {/* Event Dot Indicators */}
                    {hasEvents && (
                      <div className="flex items-center gap-0.5 mt-1 flex-wrap justify-center max-w-full">
                        {dayObj.events.slice(0, 3).map((ev, evIdx) => (
                          <div
                            key={ev._id || evIdx}
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected
                                ? 'bg-white'
                                : getCategoryDotColor(ev.category)
                            }`}
                            title={`${ev.startTime} - ${ev.title}`}
                          />
                        ))}
                        {dayObj.events.length > 3 && (
                          <span
                            className={`text-[9px] font-black leading-none ml-0.5 ${
                              isSelected ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                            }`}
                          >
                            +{dayObj.events.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Date Summary Strip */}
            {selectedDateKey && (
              <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-[#303030] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
                      {selectedDateFormatted}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold">
                      {selectedDateEvents.length} Event{selectedDateEvents.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Quick event titles preview */}
                  {selectedDateEvents.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {selectedDateEvents.map((ev) => (
                        <span
                          key={ev._id}
                          onClick={() => navigate(`/events/${ev._id}`)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer bg-white dark:bg-[#181818] px-2 py-1 rounded-lg border border-slate-200 dark:border-[#303030]"
                        >
                          <span className="text-blue-600 font-bold">{ev.startTime}</span>
                          <span className="truncate max-w-[200px]">{ev.title}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      No events scheduled for this date.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const target = document.getElementById(`date-milestone-${selectedDateKey}`);
                    if (target) {
                      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shrink-0 self-start sm:self-center shadow-xs"
                >
                  <span>Jump to Timeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-medium flex items-center gap-2">
          <Info className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-12 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Loading Chronological Events...
          </p>
        </div>
      ) : sortedAndFilteredEvents.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-[#181818] rounded-3xl border border-slate-200 dark:border-[#303030] shadow-sm p-12 text-center max-w-lg mx-auto space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <CalendarDays className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Events Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {hasActiveFilters
              ? 'No approved events match your current filter criteria. Try adjusting the search keywords or filters.'
              : 'There are no upcoming approved events currently listed. Be the first to submit a campus event!'}
          </p>
          <div className="pt-3 flex items-center justify-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#202020] text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
              >
                Clear Filters
              </button>
            )}
            <Link
              to="/events/create"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm"
            >
              + Host an Event
            </Link>
          </div>
        </div>
      ) : viewMode === 'timeline' ? (
        /* ==================================================================
           CHRONOLOGICAL VERTICAL TIMELINE (BELOW CALENDAR)
           ================================================================== */
        <div className="space-y-12 pt-2">
          {timelineDateGroups.map((group) => {
            const isToday = group.isToday;
            const isPast = group.isPast;
            const isSelectedInCal = selectedDateKey === group.dateKey;

            return (
              <div
                key={group.dateKey}
                id={`date-milestone-${group.dateKey}`}
                className={`space-y-6 scroll-mt-24 transition-all ${
                  isSelectedInCal
                    ? 'p-3 -m-3 rounded-3xl bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/40'
                    : ''
                }`}
              >
                {/* Date Heading Milestone Banner */}
                <div className="flex items-center gap-3">
                  <div
                    className={`px-4 py-2 rounded-2xl border flex items-center gap-2.5 shadow-sm transition-all ${
                      isSelectedInCal
                        ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
                        : isToday
                        ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
                        : isPast
                        ? 'bg-slate-100 dark:bg-[#202020] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#303030]'
                        : 'bg-white dark:bg-[#181818] text-slate-900 dark:text-white border-slate-200 dark:border-[#303030]'
                    }`}
                  >
                    <CalendarIcon
                      className={`w-4 h-4 ${
                        isSelectedInCal || isToday
                          ? 'text-white'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    />
                    <span className="font-extrabold text-xs sm:text-sm uppercase tracking-wide">
                      {group.formattedDate}
                    </span>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-md bg-white text-blue-700 text-[10px] font-black uppercase tracking-wider ml-1">
                        TODAY
                      </span>
                    )}
                  </div>

                  <div className="flex-1 h-px bg-slate-200 dark:bg-[#303030]"></div>

                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                    {group.eventsCount} event{group.eventsCount > 1 ? 's' : ''} on this date
                  </span>
                </div>

                {/* Vertical Timeline Stream for this Date Group */}
                <div className="relative pl-6 sm:pl-10 space-y-8">
                  {/* Continuous Vertical Timeline Line */}
                  <div className="absolute left-[11px] sm:left-[15px] top-3 bottom-3 w-[2px] bg-slate-300 dark:bg-[#303030]"></div>

                  {group.timeSlots.map((slot) => {
                    const hasMultipleSameTime = slot.events.length > 1;

                    if (!hasMultipleSameTime) {
                      const event = slot.events[0];
                      return (
                        <div
                          key={event._id}
                          className="relative flex items-start group"
                        >
                          {/* Circular Timeline Node on Spine */}
                          <div
                            className={`absolute -left-6 sm:-left-10 top-6 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white dark:border-[#121212] transition-all z-10 ${
                              isToday || isSelectedInCal
                                ? 'bg-blue-600 ring-4 ring-blue-500/30'
                                : isPast
                                ? 'bg-slate-400 dark:bg-slate-600'
                                : 'bg-blue-600 dark:bg-blue-500 ring-2 ring-slate-200 dark:ring-[#303030] group-hover:ring-blue-400'
                            }`}
                          ></div>

                          {/* Horizontal Connector Stem */}
                          <div className="absolute -left-4 sm:-left-8 top-[31px] w-4 sm:w-8 h-[2px] bg-slate-300 dark:bg-[#303030] group-hover:bg-blue-500 transition-colors"></div>

                          {/* Event Timeline Card (Compact ~600px width on desktop) */}
                          <div
                            onClick={() => navigate(`/events/${event._id}`)}
                            className={`w-full max-w-[620px] bg-white dark:bg-[#181818] rounded-2xl border border-slate-200 dark:border-[#303030] shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all overflow-hidden cursor-pointer ${
                              isToday ? 'ring-2 ring-blue-500/30' : ''
                            } ${isPast ? 'opacity-90' : ''}`}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                navigate(`/events/${event._id}`);
                              }
                            }}
                          >
                            <div className="flex flex-col sm:flex-row">
                              {/* Event Image Banner (Controlled Size ~220px on desktop) */}
                              {event.image ? (
                                <div
                                  className="sm:w-56 sm:min-h-full h-40 relative overflow-hidden bg-slate-100 dark:bg-[#121212] shrink-0 group/img cursor-zoom-in"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewImage({
                                      url: getImageUrl(event.image),
                                      title: event.title,
                                    });
                                  }}
                                  title="Click to view full image"
                                >
                                  <img
                                    src={getImageUrl(event.image)}
                                    alt={event.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-slate-950/50 via-transparent to-transparent"></div>

                                  {/* Badges on Image */}
                                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                                    <span className="px-2 py-0.5 rounded-md bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                                      {event.category}
                                    </span>
                                    {event.branch && event.branch !== 'ALL' && (
                                      <span className="px-2 py-0.5 rounded-md bg-purple-600/90 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                                        {event.branch}
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewImage({
                                        url: getImageUrl(event.image),
                                        title: event.title,
                                      });
                                    }}
                                    className="absolute top-2.5 right-2.5 p-1 rounded-md bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md opacity-0 group-hover/img:opacity-100 transition-opacity"
                                    title="View full screen"
                                  >
                                    <Maximize2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                /* Compact Header Strip when no image */
                                <div className="sm:w-48 p-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white flex flex-col justify-between shrink-0">
                                  <div className="space-y-1">
                                    <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                                      {event.category}
                                    </span>
                                    {event.branch && event.branch !== 'ALL' && (
                                      <span className="ml-1 px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white text-[10px] font-bold">
                                        {event.branch}
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-3">
                                    <span className="text-[11px] font-semibold text-blue-100 block truncate">
                                      {event.organizer}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Event Body Content */}
                              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                                <div className="space-y-1.5">
                                  {/* Time Badge */}
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>
                                      {event.startTime} - {event.endTime}
                                    </span>
                                  </div>

                                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                                    {event.title}
                                  </h3>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                    {event.description}
                                  </p>
                                </div>

                                {/* Location Details */}
                                <div className="pt-2 border-t border-slate-100 dark:border-[#303030] text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{event.venue}</span>
                                </div>

                                {/* Card Footer: Submitter & View Action */}
                                <div className="pt-2 border-t border-slate-100 dark:border-[#303030] flex items-center justify-between text-xs">
                                  <div
                                    className="flex items-center gap-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Avatar user={event.creator} size="xs" />
                                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                                      {event.creator?.name || event.organizer}
                                    </span>
                                  </div>

                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                                    <span>View Details</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      /* Parallel Same-Date & Same-Time Branch */
                      return (
                        <div key={slot.timeKey} className="relative group">
                          {/* Timeline Node Dot */}
                          <div className="absolute -left-6 sm:-left-10 top-6 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white dark:border-[#121212] bg-purple-600 dark:bg-purple-500 ring-2 ring-purple-200 dark:ring-purple-900/50 z-10"></div>

                          {/* Horizontal Connector Stem */}
                          <div className="absolute -left-4 sm:-left-8 top-[31px] w-4 sm:w-8 h-[2px] bg-purple-400 dark:bg-[#404040]"></div>

                          {/* Same-time parallel cards container */}
                          <div className="space-y-2 max-w-[680px]">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                              <Layers className="w-3 h-3" />
                              <span>Parallel Sessions ({slot.startTime})</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {slot.events.map((event) => (
                                <div
                                  key={event._id}
                                  onClick={() => navigate(`/events/${event._id}`)}
                                  className="bg-white dark:bg-[#181818] rounded-2xl border border-slate-200 dark:border-[#303030] shadow-xs hover:shadow-md hover:border-purple-400 transition-all p-4 flex flex-col justify-between space-y-3 cursor-pointer"
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      navigate(`/events/${event._id}`);
                                    }
                                  }}
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase">
                                        {event.category}
                                      </span>
                                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                        {event.startTime} - {event.endTime}
                                      </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                                      {event.title}
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                      {event.description}
                                    </p>
                                  </div>

                                  <div className="pt-2 border-t border-slate-100 dark:border-[#303030] flex items-center justify-between text-xs">
                                    <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                                      📍 {event.venue}
                                    </span>
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                      Details →
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ==================================================================
           GRID VIEW (ALTERNATIVE VIEW)
           ================================================================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAndFilteredEvents.map((event) => (
            <div
              key={event._id}
              onClick={() => navigate(`/events/${event._id}`)}
              className="bg-white dark:bg-[#181818] rounded-2xl border border-slate-200/90 dark:border-[#303030] shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all flex flex-col overflow-hidden group cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/events/${event._id}`);
                }
              }}
            >
              {/* Event Image Banner */}
              <div
                className="h-48 relative overflow-hidden bg-slate-100 dark:bg-[#121212] group/img cursor-zoom-in"
                onClick={(e) => {
                  e.stopPropagation();
                  if (event.image) {
                    setPreviewImage({ url: getImageUrl(event.image), title: event.title });
                  }
                }}
                title="Click to view full image"
              >
                <img
                  src={getImageUrl(event.image)}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>

                {/* Badges Overlay */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-600/90 backdrop-blur-md text-white text-[11px] font-extrabold uppercase tracking-wider shadow-sm">
                    {event.category}
                  </span>
                  {event.branch && event.branch !== 'ALL' && (
                    <span className="px-2.5 py-1 rounded-lg bg-purple-600/90 backdrop-blur-md text-white text-[11px] font-extrabold uppercase tracking-wider shadow-sm">
                      {event.branch} Only
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (event.image) {
                      setPreviewImage({ url: getImageUrl(event.image), title: event.title });
                    }
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md opacity-0 group-hover/img:opacity-100 transition-opacity shadow-sm"
                  title="View full screen"
                  aria-label="View image full screen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="text-xs font-semibold text-blue-200 truncate">
                    {event.organizer}
                  </p>
                </div>
              </div>

              {/* Event Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                {/* Event Metadata details */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-[#303030] text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-white">{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      {event.startTime} - {event.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-slate-100 dark:border-[#303030] flex items-center justify-between">
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Avatar user={event.creator} size="xs" />
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
                      {event.creator?.name || event.organizer}
                    </span>
                  </div>

                  <Link
                    to={`/events/${event._id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full-screen Image Viewer Lightbox Modal */}
      <ImageViewerModal
        isOpen={!!previewImage}
        imageUrl={previewImage?.url}
        title={previewImage?.title}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};

export default Events;
