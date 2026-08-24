import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
import {
  Users,
  Search,
  PlusCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Calendar,
  Layers,
  Award,
  Globe,
  ExternalLink,
  ChevronRight,
  Filter,
  X,
  HeartHandshake,
} from 'lucide-react';

export const Clubs = () => {
  const { user, isAdmin, isFaculty } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');

  const categories = [
    { label: 'All Categories', value: 'ALL' },
    { label: 'Technical & Coding', value: 'Technical' },
    { label: 'Cultural & Arts', value: 'Cultural' },
    { label: 'Sports & Athletics', value: 'Sports' },
    { label: 'Literary & Debating', value: 'Literary' },
    { label: 'Music & Audio', value: 'Music' },
    { label: 'Dance & Theater', value: 'Dance' },
    { label: 'Photography & Media', value: 'Photography' },
    { label: 'Entrepreneurship & E-Cell', value: 'Entrepreneurship' },
    { label: 'Social Service & NSS', value: 'Social Service' },
    { label: 'Academic Societies', value: 'Academic' },
  ];

  useEffect(() => {
    fetchClubs();
  }, [categoryFilter, branchFilter, sort]);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (branchFilter !== 'ALL') params.append('branch', branchFilter);
      if (search.trim()) params.append('search', search.trim());
      if (sort) params.append('sort', sort);

      const res = await api.get(`/clubs?${params.toString()}`);
      if (res.data.success) {
        setClubs(res.data.clubs);
      }
    } catch (err) {
      console.error('Failed to load clubs:', err);
      setError('Could not load student clubs. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchClubs();
  };

  const clearFilters = () => {
    setCategoryFilter('ALL');
    setBranchFilter('ALL');
    setSearch('');
    setSort('name');
  };

  const hasActiveFilters =
    categoryFilter !== 'ALL' || branchFilter !== 'ALL' || search || sort !== 'name';

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-teal-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-sm mb-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Student Life & Organizations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Clubs & Student Societies
          </h1>
          <p className="text-teal-100 font-medium text-xs sm:text-sm mt-1 max-w-xl">
            Discover campus technical guilds, cultural troupes, competitive sports teams, and student chapters. Join communities and unlock club-exclusive events and circulars.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/clubs/my-clubs"
            className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm backdrop-blur-sm transition-all border border-white/20"
          >
            My Memberships
          </Link>
          <Link
            to="/clubs/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
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

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                categoryFilter === cat.value
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Branch Selectors */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clubs by name, description, or domain..."
              className="w-full pl-10 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Branches</option>
              <option value="CSE">CSE Department</option>
              <option value="ECE">ECE Department</option>
              <option value="ME">ME Department</option>
              <option value="CE">CE Department</option>
              <option value="IT">IT Department</option>
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="name">Alphabetical (A-Z)</option>
              <option value="members">Most Members</option>
              <option value="newest">Recently Formed</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Showing filtered clubs ({clubs.length} results)
            </span>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden animate-pulse"
            >
              <div className="h-36 bg-slate-200"></div>
              <div className="p-6 space-y-3">
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : clubs.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center max-w-lg mx-auto space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Clubs Found</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {hasActiveFilters
              ? 'No active clubs match your active category or search filter. Try clearing filters.'
              : 'There are currently no active clubs registered on the portal.'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 mt-2"
            >
              Reset Filters
            </button>
          ) : (
            <Link
              to="/clubs/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 mt-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Propose the First Club</span>
            </Link>
          )}
        </div>
      ) : (
        /* Clubs Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => (
            <div
              key={club._id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all overflow-hidden flex flex-col justify-between group relative"
            >
              <div>
                {/* Cover Banner */}
                <div className="h-32 bg-slate-100 relative overflow-hidden">
                  <img
                    src={getImageUrl(club.coverImage)}
                    alt={club.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent"></div>

                  {/* Category Badge Floating Top Right */}
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                    {club.category}
                  </span>

                  {/* Branch Tag Floating Top Left */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-emerald-900/80 backdrop-blur-sm text-emerald-200 text-[10px] font-bold">
                    {club.branch === 'ALL' ? 'Campus-Wide' : `${club.branch} Dept`}
                  </span>
                </div>

                {/* Logo & Header */}
                <div className="px-6 pt-0 pb-4 relative">
                  <div className="-mt-9 mb-3 flex items-end justify-between">
                    <div className="w-16 h-16 rounded-2xl bg-white border-2 border-white shadow-md overflow-hidden shrink-0">
                      <img
                        src={getImageUrl(club.logo)}
                        alt={club.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Membership Status Pill */}
                    {club.isMember ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Member</span>
                      </span>
                    ) : club.isPending ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold border border-amber-200">
                        Pending Request
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <Link
                      to={`/clubs/${club._id}`}
                      className="block text-base font-bold text-slate-900 hover:text-emerald-700 transition-colors leading-tight line-clamp-1"
                    >
                      {club.name}
                    </Link>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                      {club.shortDescription || club.description}
                    </p>
                  </div>

                  {/* Leadership Snapshot */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-[11px] truncate max-w-[130px] font-medium text-slate-700">
                        {club.facultyCoordinator?.name
                          ? club.facultyCoordinator.name
                          : club.studentPresident?.name
                          ? `Pres: ${club.studentPresident.name}`
                          : 'Student Led'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{club.memberCount} Members</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">
                  {club.department || 'Student Chapter'}
                </span>
                <Link
                  to={`/clubs/${club._id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Explore Club</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Clubs;
