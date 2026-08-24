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
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Tag,
  HelpCircle,
  Layers,
  X,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';

export const LostFound = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  // Filter & Search states
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL', 'lost', 'found'
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
      if (res.data.success) {
        setItems(res.data.items);
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
        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-sm">
          <CheckCircle2 className="w-3 h-3" />
          <span>{type === 'found' ? 'Claimed / Resolved' : 'Recovered'}</span>
        </span>
      );
    }
    if (status === 'claim_pending') {
      return (
        <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-sm">
          <Clock className="w-3 h-3" />
          <span>Claim Pending</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
        <span>Active Notice</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-sm mb-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
            <span>Campus Lost & Found Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Lost & Found Items
          </h1>
          <p className="text-amber-100 font-medium text-sm mt-1 max-w-xl">
            Centralized portal to report lost student belongings, register recovered found items, and submit ownership verification claims.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/lost-found/my-reports"
            className="px-4 py-2.5 rounded-xl bg-amber-500/30 text-white border border-white/20 font-bold text-xs sm:text-sm hover:bg-amber-500/40 backdrop-blur-sm transition-all"
          >
            My Reports & Claims
          </Link>
          <Link
            to="/lost-found/create?type=lost"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-amber-800 font-bold text-xs sm:text-sm hover:bg-amber-50 transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Lost Item</span>
          </Link>
          <Link
            to="/lost-found/create?type=found"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-700 transition-all shadow-sm"
          >
            <SearchCheck className="w-4 h-4" />
            <span>Report Found Item</span>
          </Link>
        </div>
      </div>

      {/* Main Search & Filter Control Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        {/* Type Toggle Pills: All vs Lost vs Found */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-100">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl gap-1">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                typeFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Listings
            </button>
            <button
              onClick={() => setTypeFilter('lost')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                typeFilter === 'lost'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-red-700 hover:bg-red-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              <span>Lost Items</span>
            </button>
            <button
              onClick={() => setTypeFilter('found')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                typeFilter === 'found'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Found Items</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-500 font-bold">Sort By:</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500"
            >
              <option value="newest">Recently Listed</option>
              <option value="date_desc">Incident Date (Newest First)</option>
              <option value="date_asc">Incident Date (Oldest First)</option>
            </select>
          </div>
        </div>

        {/* Search Query Inputs */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by item name, brand, color, description..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                placeholder="Filter by location (e.g. Lab, Library)..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-colors shrink-0"
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Showing filtered results ({items.length} listings)
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

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse space-y-3"
            >
              <div className="h-44 bg-slate-200 rounded-xl"></div>
              <div className="h-5 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-4 bg-slate-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center max-w-lg mx-auto space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <SearchCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Listings Found</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {hasActiveFilters
              ? 'No lost or found items matched your search filters. Try adjusting your query or resetting filters.'
              : 'There are currently no active lost or found reports. Report an item if you misplaced or recovered something on campus.'}
          </p>
          <div className="pt-3 flex items-center justify-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Clear Filters
              </button>
            )}
            <Link
              to="/lost-found/create?type=lost"
              className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 shadow-sm"
            >
              Report Lost Item
            </Link>
          </div>
        </div>
      ) : (
        /* Items Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const isLost = item.type === 'lost';
            return (
              <div
                key={item._id}
                onClick={() => navigate(`/lost-found/${item._id}`)}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col overflow-hidden group cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/lost-found/${item._id}`);
                  }
                }}
              >
                {/* Item Image Banner */}
                <div
                  className="h-48 relative overflow-hidden bg-slate-100 group/img cursor-zoom-in"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.image) {
                      setPreviewImage({ url: getImageUrl(item.image), title: item.title });
                    }
                  }}
                  title="Click to view full image"
                >
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>

                  {/* Type Badge (LOST / FOUND) */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-xl text-white text-[11px] font-extrabold uppercase tracking-wider shadow-sm backdrop-blur-md ${
                        isLost ? 'bg-red-600/90' : 'bg-emerald-600/90'
                      }`}
                    >
                      {isLost ? 'LOST ITEM' : 'FOUND ITEM'}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold">
                      {item.category}
                    </span>
                  </div>

                  {/* Status Overlay Badge */}
                  <div
                    className="absolute top-3 right-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {getStatusBadge(item.status, item.type)}
                  </div>

                  {/* Full-screen expand button on hover */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.image) {
                        setPreviewImage({ url: getImageUrl(item.image), title: item.title });
                      }
                    }}
                    className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md opacity-0 group-hover/img:opacity-100 transition-opacity shadow-sm"
                    title="View full screen"
                    aria-label="View image full screen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="absolute bottom-3 left-3 right-12 text-white pointer-events-none">
                    <p className="text-xs font-semibold text-amber-200 truncate flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.location}</span>
                    </p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1 leading-snug group-hover:text-amber-700 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Attributes & Metadata */}
                  <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Date: {formatDate(item.date)}</span>
                      </span>
                      {item.time && (
                        <span className="text-slate-400">Time: {item.time}</span>
                      )}
                    </div>

                    {(item.brand || item.color) && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        {item.brand && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                            Brand: {item.brand}
                          </span>
                        )}
                        {item.color && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                            Color: {item.color}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Avatar user={item.creator} size="xs" />
                      <span className="text-[11px] font-medium text-slate-500 truncate max-w-[110px]">
                        {item.creator?.name}
                      </span>
                    </div>

                    <Link
                      to={`/lost-found/${item._id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>{item.type === 'found' ? 'Claim / View' : 'View Notice'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
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

export default LostFound;
