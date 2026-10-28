import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ImageViewerModal from '../components/ImageViewerModal';
import Avatar from '../components/Avatar';
import { getImageUrl } from '../utils/imageUrl';
import {
  SearchCheck,
  Search,
  MapPin,
  Calendar,
  Clock,
  PlusCircle,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  Maximize2,
} from 'lucide-react';

export const LostFound = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'lost' | 'found'
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [sort, setSort] = useState('newest');

  const categories = [
    'ALL',
    'Electronics',
    'ID Cards & Documents',
    'Keys & Wallets',
    'Books & Stationery',
    'Clothing & Accessories',
    'Bags & Backpacks',
    'Bottles & Lunchboxes',
    'Jewelry & Watches',
    'Sports Equipment',
    'Other',
  ];

  useEffect(() => {
    fetchItems();
  }, [typeFilter, categoryFilter, statusFilter, sort]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (typeFilter && typeFilter !== 'ALL') params.append('type', typeFilter.toLowerCase());
      if (categoryFilter && categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter.toLowerCase());
      if (search && search.trim()) params.append('search', search.trim());
      if (locationSearch && locationSearch.trim()) params.append('location', locationSearch.trim());
      if (sort) params.append('sort', sort);

      const res = await api.get(`/lost-found?${params.toString()}`);
      if (res.data?.success) {
        setItems(res.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load Lost & Found items:', err);
      setError('Could not load Lost & Found items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  const clearFilters = () => {
    setTypeFilter('ALL');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setSearch('');
    setLocationSearch('');
    setSort('newest');
  };

  const hasActiveFilters =
    typeFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    search ||
    locationSearch ||
    sort !== 'newest';

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status, type) => {
    if (status === 'resolved' || status === 'claimed') {
      return (
        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>{type === 'found' ? 'Claimed' : 'Recovered'}</span>
        </span>
      );
    }
    if (status === 'claim_pending') {
      return (
        <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Claim Pending</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
        <span>Active</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Lost & Found Hub
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {items.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Report misplaced belongings or register items recovered on campus grounds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/lost-found/my-reports"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs shadow-subtle transition-colors"
          >
            My Reports & Claims
          </Link>
          <Link
            to="/lost-found/create?type=lost"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white font-semibold text-xs shadow-subtle transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Item</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card p-4 space-y-4">
        {/* Type Segment Control: All vs Lost vs Found */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-subtle font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Listings
            </button>
            <button
              onClick={() => setTypeFilter('lost')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                typeFilter === 'lost'
                  ? 'bg-rose-600 text-white shadow-subtle font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Lost Items</span>
            </button>
            <button
              onClick={() => setTypeFilter('found')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                typeFilter === 'found'
                  ? 'bg-emerald-600 text-white shadow-subtle font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Found Items</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Sort:
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white"
            >
              <option value="newest">Recently Listed</option>
              <option value="date_desc">Incident Date (Newest)</option>
              <option value="date_asc">Incident Date (Oldest)</option>
            </select>
          </div>
        </div>

        {/* Search Inputs */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, brand, description..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-600 font-medium"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                placeholder="Location (e.g. Library, Lab)"
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white font-semibold text-xs transition-colors shrink-0"
            >
              Search
            </button>
          </div>
        </form>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white dark:bg-brand-600 dark:text-white shadow-subtle'
                  : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing {items.length} matching listings
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

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse space-y-3"
            >
              <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-xl" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-card p-12 text-center max-w-sm mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <SearchCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Listings Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {hasActiveFilters
              ? 'No items match your selected filters. Try widening your search.'
              : 'There are currently no open lost or found notices.'}
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
              to="/lost-found/create?type=lost"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 text-white text-xs font-semibold shadow-subtle"
            >
              Report Item
            </Link>
          </div>
        </div>
      ) : (
        /* Items Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const isLost = item.type === 'lost';
            return (
              <div
                key={item._id}
                onClick={() => navigate(`/lost-found/${item._id}`)}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card hover:border-slate-300 dark:hover:border-slate-700 card-hover-lift flex flex-col overflow-hidden group cursor-pointer"
              >
                {/* Item Image */}
                <div
                  className="h-44 relative overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-zoom-in"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.image) {
                      setPreviewImage({ url: getImageUrl(item.image), title: item.title });
                    }
                  }}
                  title="Click to zoom image"
                >
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                  {/* Type Badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-md text-white text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md ${
                        isLost ? 'bg-rose-600/90' : 'bg-emerald-600/90'
                      }`}
                    >
                      {isLost ? 'Lost' : 'Found'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-semibold">
                      {item.category}
                    </span>
                  </div>

                  {/* Status Overlay */}
                  <div className="absolute top-2.5 right-2.5">
                    {getStatusBadge(item.status, item.type)}
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white pointer-events-none">
                    <p className="text-[11px] font-medium text-slate-200 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-300 shrink-0" />
                      <span>{item.location}</span>
                    </p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{formatDate(item.date)}</span>
                      </span>
                      {item.time && <span>{item.time}</span>}
                    </div>

                    {(item.brand || item.color) && (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        {item.brand && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium">
                            {item.brand}
                          </span>
                        )}
                        {item.color && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium">
                            {item.color}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Avatar user={item.creator} size="xs" />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[100px]">
                        {item.creator?.name}
                      </span>
                    </div>

                    <Link
                      to={`/lost-found/${item._id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                    >
                      <span>{item.type === 'found' ? 'Claim / View' : 'Details'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ImageViewerModal
        isOpen={!!previewImage}
        imageUrl={previewImage?.url}
        title={previewImage?.title}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};

export default LostFound;
