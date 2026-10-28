import React, { useState, useEffect, useMemo } from 'react';
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
  PlusCircle,
  ArrowRight,
  CheckCircle2,
  CalendarDays,
  X,
  Maximize2,
  GitCommit,
  LayoutGrid,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react';

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

const getCategoryDotColor = (category) => {
  switch ((category || '').toLowerCase()) {
    case 'technical':
    case 'hackathon':
      return 'bg-brand-500';
    case 'workshop':
    case 'seminar':
      return 'bg-indigo-500';
    case 'cultural':
    case 'fest':
      return 'bg-rose-500';
    case 'sports':
      return 'bg-emerald-500';
    default:
      return 'bg-amber-500';
  }
};

export const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'grid'
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [branch, setBranch] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Calendar state
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
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
      if (res.data?.success) {
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

  const sortedAndFilteredEvents = useMemo(() => {
    let result = [...events];

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

    if (timeFilter === 'TODAY') {
      result = result.filter((e) => isTodayDate(e.date));
    } else if (timeFilter === 'UPCOMING') {
      result = result.filter((e) => isUpcomingEvent(e) || isTodayDate(e.date));
    } else if (timeFilter === 'PAST') {
      result = result.filter((e) => isPastEvent(e));
    }

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

  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
    const daysInCurrentMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();
    const days = [];

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

    const target = document.getElementById(`date-milestone-${todayKey}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDateClick = (dayObj) => {
    setSelectedDateKey(dayObj.dateKey);
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
    <div className="space-y-6">
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Campus Events & Calendar
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {events.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse verified workshops, hackathons, symposiums, and cultural festivals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/events/my-events"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs shadow-subtle transition-colors"
          >
            My Submissions
          </Link>
          <Link
            to="/events/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white font-semibold text-xs shadow-subtle transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Host Event</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events by title, organizer, or venue..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-600 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white font-semibold text-xs transition-colors shrink-0"
            >
              Search
            </button>
          </form>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-subtle'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-subtle'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
          </div>
        </div>

        {/* Time Horizon Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1">
            Horizon:
          </span>
          {[
            { key: 'ALL', label: 'All Dates' },
            { key: 'UPCOMING', label: 'Upcoming' },
            { key: 'TODAY', label: 'Today' },
            { key: 'PAST', label: 'Past' },
          ].map((tf) => (
            <button
              key={tf.key}
              type="button"
              onClick={() => setTimeFilter(tf.key)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                timeFilter === tf.key
                  ? 'bg-slate-900 text-white dark:bg-brand-600 dark:text-white shadow-subtle'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {tf.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="ml-auto inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{showAdvancedFilters ? 'Fewer Filters' : 'More Filters'}</span>
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                category === cat
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 ring-1 ring-brand-300 dark:ring-brand-800'
                  : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Secondary Filter Controls */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs animate-in fade-in duration-150">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                Department Restriction
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl font-medium text-slate-800 dark:text-white"
              >
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b === 'ALL' ? 'All Departments' : `${b} Only`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl font-medium text-slate-800 dark:text-white"
              >
              </input>
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl font-medium text-slate-800 dark:text-white"
              >
              </input>
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing {sortedAndFilteredEvents.length} events
            </span>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Interactive Month Calendar Drawer */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card p-4 transition-all">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setIsCalendarCollapsed(!isCalendarCollapsed)}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Month Calendar</span>
                <span className="text-xs font-medium text-slate-400">({monthName})</span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isCalendarCollapsed ? 'Click to show calendar date grid' : 'Select any date to jump to its events'}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTodayClick}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            >
              Today
            </button>

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-800 dark:text-white px-2 select-none">
                {monthName}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsCalendarCollapsed(!isCalendarCollapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle calendar view"
            >
              {isCalendarCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {!isCalendarCollapsed && (
          <div className="space-y-3 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {weekDays.map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarDays.map((dayObj, idx) => {
                const hasEvents = dayObj.events.length > 0;
                const isSelected = selectedDateKey === dayObj.dateKey;
                const isToday = dayObj.isToday;

                return (
                  <button
                    key={`${dayObj.dateKey}-${idx}`}
                    type="button"
                    onClick={() => handleDateClick(dayObj)}
                    className={`min-h-[48px] sm:min-h-[54px] p-1 rounded-xl border flex flex-col justify-between items-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-brand-600 border-transparent shadow-subtle'
                        : isToday
                        ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800 font-bold'
                        : dayObj.isCurrentMonth
                        ? hasEvents
                          ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          : 'bg-transparent text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                        : 'bg-transparent text-slate-300 dark:text-slate-700 border-transparent'
                    }`}
                  >
                    <span className="text-xs font-semibold">{dayObj.dayNum}</span>
                    {hasEvents && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {dayObj.events.slice(0, 3).map((ev, evIdx) => (
                          <div
                            key={ev._id || evIdx}
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-white' : getCategoryDotColor(ev.category)
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedDateKey && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedDateFormatted}:
                  </span>
                  <span className="ml-1.5 text-slate-500 dark:text-slate-400">
                    {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''} scheduled
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const target = document.getElementById(`date-milestone-${selectedDateKey}`);
                    if (target) {
                      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>Jump to Timeline Date</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
          <Info className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading campus events...</p>
        </div>
      ) : sortedAndFilteredEvents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-card p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center mx-auto">
            <CalendarDays className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Events Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {hasActiveFilters
              ? 'No events match your current filter parameters. Try clearing some criteria.'
              : 'There are no active events listed at this time. Create one to get started!'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
              >
                Clear Filters
              </button>
            )}
            <Link
              to="/events/create"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-brand-600 text-white text-xs font-semibold hover:bg-slate-800"
            >
              Host Event
            </Link>
          </div>
        </div>
      ) : viewMode === 'timeline' ? (
        /* Timeline View */
        <div className="space-y-8 pt-1">
          {timelineDateGroups.map((group) => {
            const isToday = group.isToday;
            const isPast = group.isPast;

            return (
              <div
                key={group.dateKey}
                id={`date-milestone-${group.dateKey}`}
                className="space-y-4 scroll-mt-24"
              >
                {/* Milestone Badge */}
                <div className="flex items-center gap-3">
                  <div
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                      isToday
                        ? 'bg-slate-900 text-white dark:bg-brand-600 border-transparent shadow-subtle'
                        : isPast
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                        : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 shadow-subtle'
                    }`}
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    <span>{group.formattedDate}</span>
                    {isToday && (
                      <span className="px-1.5 py-0.2 rounded bg-white text-slate-900 text-[9px] font-extrabold uppercase">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                  <span className="text-[11px] text-slate-400 font-medium">
                    {group.eventsCount} event{group.eventsCount > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Timeline Stream */}
                <div className="space-y-4 pl-2 sm:pl-4">
                  {group.events.map((event) => (
                    <div
                      key={event._id}
                      onClick={() => navigate(`/events/${event._id}`)}
                      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card hover:border-slate-300 dark:hover:border-slate-700 card-hover-lift cursor-pointer overflow-hidden group ${
                        isPast ? 'opacity-85' : ''
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row">
                        {event.image ? (
                          <div
                            className="sm:w-56 h-40 sm:h-auto relative bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage({
                                url: getImageUrl(event.image),
                                title: event.title,
                              });
                            }}
                          >
                            <img
                              src={getImageUrl(event.image)}
                              alt={event.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase">
                                {event.category}
                              </span>
                            </div>
                          </div>
                        ) : null}

                        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{event.startTime} - {event.endTime}</span>
                              {event.branch && event.branch !== 'ALL' && (
                                <>
                                  <span>•</span>
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
                                    {event.branch} Dept
                                  </span>
                                </>
                              )}
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                              {event.title}
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                              {event.description}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{event.venue}</span>
                            </div>

                            <span className="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400 group-hover:translate-x-0.5 transition-transform">
                              <span>View Details</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedAndFilteredEvents.map((event) => (
            <div
              key={event._id}
              onClick={() => navigate(`/events/${event._id}`)}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card hover:border-slate-300 dark:hover:border-slate-700 card-hover-lift flex flex-col overflow-hidden group cursor-pointer"
            >
              {event.image ? (
                <div
                  className="h-44 relative overflow-hidden bg-slate-100 dark:bg-slate-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewImage({ url: getImageUrl(event.image), title: event.title });
                  }}
                >
                  <img
                    src={getImageUrl(event.image)}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase">
                      {event.category}
                    </span>
                  </div>
                </div>
              ) : null}

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400">
                    <CalendarIcon className="w-3 h-3" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {event.description}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                    📍 {event.venue}
                  </span>
                  <span className="font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                    <span>Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox modal */}
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
