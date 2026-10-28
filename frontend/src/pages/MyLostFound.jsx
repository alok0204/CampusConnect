import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ImageViewerModal from '../components/ImageViewerModal';
import Avatar from '../components/Avatar';
import { getImageUrl } from '../utils/imageUrl';
import {
  SearchCheck,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Tag,
  Ban,
  FileText,
  Maximize2,
} from 'lucide-react';

export const MyLostFound = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' or 'claims'
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError('');

      const [reportsRes, claimsRes] = await Promise.all([
        api.get('/lost-found/my-reports'),
        api.get('/lost-found/my-claims'),
      ]);

      if (reportsRes.data.success) {
        setReports(reportsRes.data.items);
      }
      if (claimsRes.data.success) {
        setClaims(claimsRes.data.claims);
      }
    } catch (err) {
      console.error('Error fetching user lost & found data:', err);
      setError('Could not load your reports and claims.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status, type) => {
    if (status === 'resolved' || status === 'claimed') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold uppercase">
          Resolved
        </span>
      );
    }
    if (status === 'claim_pending') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-extrabold uppercase">
          Claim Pending
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#212121] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#333333] text-[10px] font-bold uppercase">
        Active
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200 dark:border-[#262626] shadow-xs p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#212121] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#333333] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personal Activity Hub</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            My Reports & Claims
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your lost item notices, monitor found item claims, and view verification statuses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/lost-found/create?type=lost"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1a1a1a] dark:hover:bg-[#262626] text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
          >
            + Report Lost
          </Link>
          <Link
            to="/lost-found/create?type=found"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black font-semibold text-xs shadow-xs transition-colors"
          >
            + Report Found
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#262626]">
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>My Reported Items</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'reports' ? 'bg-slate-900 dark:bg-white text-white dark:text-black font-bold' : 'bg-slate-100 dark:bg-[#212121] text-slate-600 dark:text-slate-400'
            }`}
          >
            {reports.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('claims')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'claims'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>My Submitted Claims</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'claims' ? 'bg-slate-900 dark:bg-white text-white dark:text-black font-bold' : 'bg-slate-100 dark:bg-[#212121] text-slate-600 dark:text-slate-400'
            }`}
          >
            {claims.length}
          </span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white dark:bg-[#121212] rounded-2xl border border-slate-200 dark:border-[#262626] animate-pulse p-4"></div>
          ))}
        </div>
      ) : activeTab === 'reports' ? (
        /* Tab 1: My Reported Items */
        reports.length === 0 ? (
          <div className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200 dark:border-[#262626] p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#212121] text-slate-700 dark:text-slate-300 flex items-center justify-center mx-auto">
              <SearchCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Reports Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You haven't reported any lost or found items on campus.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <Link
                to="/lost-found/create?type=lost"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-200 dark:text-black font-semibold text-xs transition-colors shadow-xs"
              >
                Report Lost Item
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((item) => {
              const isLost = item.type === 'lost';
              return (
                <div
                  key={item._id}
                  onClick={() => navigate(`/lost-found/${item._id}`)}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 transition-all hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md space-y-4 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/lost-found/${item._id}`);
                    }
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 cursor-zoom-in relative group/img"
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
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-extrabold uppercase ${
                              isLost ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {isLost ? 'LOST REPORT' : 'FOUND REPORT'}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-600">•</span>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {item.category}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                          <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {item.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col sm:items-end justify-between items-center gap-2 shrink-0">
                      {getStatusBadge(item.status, item.type)}
                      {!isLost && item.pendingClaimsCount > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-[11px] font-extrabold">
                          {item.pendingClaimsCount} Claims Pending
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-[#262626] flex items-center justify-between">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Status:{' '}
                      <strong className="text-slate-700 dark:text-slate-300 capitalize">{item.status}</strong>
                    </span>

                    <Link
                      to={`/lost-found/${item._id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 dark:text-white hover:underline"
                    >
                      <span>
                        {!isLost && item.pendingClaimsCount > 0
                          ? `Review Claims (${item.pendingClaimsCount})`
                          : 'View Notice Details'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Tab 2: My Submitted Claims */
        claims.length === 0 ? (
          <div className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200 dark:border-[#262626] p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#212121] text-slate-700 dark:text-slate-300 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Claims Submitted</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You haven't submitted any ownership verification claims yet.
            </p>
            <div className="pt-2">
              <Link
                to="/lost-found"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-200 dark:text-black font-semibold text-xs shadow-xs transition-colors"
              >
                Browse Found Items Feed
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <div
                key={claim._id}
                onClick={() => {
                  const itemId = claim.itemId?._id || claim.itemId;
                  if (itemId) navigate(`/lost-found/${itemId}`);
                }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const itemId = claim.itemId?._id || claim.itemId;
                    if (itemId) navigate(`/lost-found/${itemId}`);
                  }
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 cursor-zoom-in relative group/img"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (claim.itemId?.image) {
                          setPreviewImage({
                            url: getImageUrl(claim.itemId.image),
                            title: claim.itemId.title,
                          });
                        }
                      }}
                      title="Click to view full image"
                    >
                      <img
                        src={getImageUrl(claim.itemId?.image)}
                        alt={claim.itemId?.title}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#212121] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#333333] text-[10px] font-bold">
                        FOUND ITEM CLAIM
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {claim.itemId?.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Found at: {claim.itemId?.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col sm:items-end justify-between items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                        claim.status === 'approved'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          : claim.status === 'rejected'
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {claim.status}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      Claimed on: {new Date(claim.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#181818] border border-slate-200/80 dark:border-[#262626] text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <p>
                    <strong className="text-slate-900 dark:text-white">Your Verification Statement:</strong> {claim.reason}
                  </p>
                  <p>
                    <strong className="text-slate-900 dark:text-white">Distinguishing Marks Provided:</strong> {claim.identifyingDetails}
                  </p>
                  {claim.reviewNote && (
                    <p className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-[#212121] border border-slate-200 dark:border-[#333333] p-2 rounded-lg mt-1 font-medium">
                      <strong className="text-slate-900 dark:text-white">Finder's Feedback:</strong> {claim.reviewNote}
                    </p>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Avatar user={claim.finder} size="xs" />
                    <span>
                      Finder: {claim.finder?.name} ({claim.finder?.branch || 'Staff'})
                    </span>
                  </div>

                  <Link
                    to={`/lost-found/${claim.itemId?._id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 dark:text-white hover:underline"
                  >
                    <span>View Found Listing</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Full-screen Image Lightbox Modal */}
      <ImageViewerModal
        isOpen={!!previewImage}
        imageUrl={previewImage?.url}
        title={previewImage?.title}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};

export default MyLostFound;
