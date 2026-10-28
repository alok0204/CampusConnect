import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ImageViewerModal from '../components/ImageViewerModal';
import Avatar from '../components/Avatar';
import { getImageUrl } from '../utils/imageUrl';
import {
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Trash2,
  Share2,
  Phone,
  Mail,
  Maximize2,
} from 'lucide-react';

export const LostFoundDetails = () => {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [userClaim, setUserClaim] = useState(null);
  const [claimsList, setClaimsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Claim modal
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimForm, setClaimForm] = useState({
    reason: '',
    identifyingDetails: '',
    previousLocation: '',
    contactNumber: '',
  });

  // Review Reject modal
  const [rejectingClaimId, setRejectingClaimId] = useState(null);
  const [reviewNote, setReviewNote] = useState('');

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/lost-found/${id}`);
      if (res.data?.success) {
        setItem(res.data.item);
        setUserClaim(res.data.userClaim);

        const isFinder =
          user &&
          res.data.item.creator &&
          (res.data.item.creator._id === user.id ||
            res.data.item.creator._id === user._id ||
            res.data.item.creator === user.id);

        if ((isFinder || isAdmin) && res.data.item.type === 'found') {
          fetchClaims();
        }
      }
    } catch (err) {
      console.error('Error fetching item details:', err);
      setError(
        err.response?.data?.message || 'Could not load item details. Listing may have been removed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchClaims = async () => {
    try {
      const res = await api.get(`/lost-found/${id}/claims`);
      if (res.data?.success) {
        setClaimsList(res.data.claims || []);
      }
    } catch (err) {
      console.error('Failed to fetch claims:', err);
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!claimForm.reason.trim() || !claimForm.identifyingDetails.trim()) {
      setError('Please fill in both the reason and specific identifying details.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.post(`/lost-found/${id}/claim`, claimForm);
      if (res.data?.success) {
        setShowClaimModal(false);
        setActionMsg('Claim submitted successfully! The finder will review your verification details.');
        fetchItemDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit claim.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveClaim = async (claimId) => {
    if (!window.confirm('Are you sure you want to approve this claim and resolve this item?'))
      return;

    try {
      setActionLoading(true);
      const res = await api.put(`/lost-found/claims/${claimId}/approve`, {
        reviewNote: 'Item handed over and ownership verified.',
      });
      if (res.data?.success) {
        setActionMsg('Claim approved! Item has been marked as resolved.');
        fetchItemDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve claim.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClaim = async (e) => {
    e.preventDefault();
    if (!rejectingClaimId) return;

    try {
      setActionLoading(true);
      const res = await api.put(`/lost-found/claims/${rejectingClaimId}/reject`, {
        reviewNote,
      });
      if (res.data?.success) {
        setRejectingClaimId(null);
        setReviewNote('');
        setActionMsg('Claim rejected.');
        fetchItemDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject claim.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseReport = async (actionType) => {
    try {
      setActionLoading(true);
      const res = await api.put(`/lost-found/${id}/close`, { action: actionType });
      if (res.data?.success) {
        setActionMsg(`Report marked as ${actionType}.`);
        fetchItemDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close report.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      const res = await api.delete(`/lost-found/${id}`);
      if (res.data?.success) {
        navigate('/lost-found');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete report.');
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3 shadow-card">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Listing Unavailable</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{error || 'This report could not be found.'}</p>
        <Link
          to="/lost-found"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-brand-600 text-white font-semibold text-xs hover:bg-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Lost & Found</span>
        </Link>
      </div>
    );
  }

  const isLost = item.type === 'lost';
  const isCreator =
    user &&
    item.creator &&
    (item.creator._id === user.id || item.creator._id === user._id || item.creator === user.id);

  const formatDate = (d) => {
    return new Date(d).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Status */}
      <div className="flex items-center justify-between">
        <Link
          to="/lost-found"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Lost & Found</span>
        </Link>

        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              isLost
                ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            {isLost ? 'Lost Item' : 'Found Item'}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              item.status === 'resolved' || item.status === 'claimed'
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                : item.status === 'claim_pending'
                ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {item.status === 'resolved'
              ? 'Resolved'
              : item.status === 'claim_pending'
              ? 'Claim Pending'
              : 'Active'}
          </span>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Main Details Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden">
        {item.image ? (
          <div
            className="h-64 sm:h-80 relative bg-slate-900 overflow-hidden cursor-zoom-in group"
            onClick={() => setShowImageModal(true)}
            title="Click to view full image"
          >
            <img
              src={getImageUrl(item.image)}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold uppercase">
                {item.category}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowImageModal(true);
              }}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition-all shadow-sm flex items-center gap-1.5 text-xs font-semibold"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Zoom Photo</span>
            </button>

            <div className="absolute bottom-5 left-5 right-5 text-white space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <MapPin className="w-3.5 h-3.5" />
                <span>{item.location}</span>
              </div>
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
                {item.title}
              </h1>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 space-y-2">
            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold uppercase">
              {item.category}
            </span>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {item.title}
            </h1>
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                {isLost ? 'Date Lost' : 'Date Found'}
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {formatDate(item.date)}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                Time
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {item.time || 'Not specified'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                Brand
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {item.brand || 'N/A'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                Color
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {item.color || 'N/A'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Description & Particulars</h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>
          </div>

          {(isCreator || isAdmin) && item.uniqueDetails && (
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Confidential Identifying Details (Private to You & Admin)</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 pl-5">{item.uniqueDetails}</p>
            </div>
          )}

          {/* Contact & Submitter Info */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar user={item.creator} size="md" className="rounded-xl shadow-subtle" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{item.creator?.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Reported by {item.creator?.role || 'Campus'} (
                  {item.creator?.branch || item.creator?.department || 'Student'})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {item.contactPreference === 'phone' && item.contactNumber && (
                <a
                  href={`tel:${item.contactNumber}`}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call / Phone</span>
                </a>
              )}
              {item.contactPreference === 'email' && item.creator?.email && (
                <a
                  href={`mailto:${item.creator.email}`}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-brand-600" />
                  <span>Send Email</span>
                </a>
              )}
            </div>
          </div>

          {/* User's Claim Status */}
          {userClaim && (
            <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-brand-950 dark:text-brand-100">
                  Your Ownership Claim
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300">
                  {userClaim.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                <strong>Statement:</strong> {userClaim.reason}
              </p>
              {userClaim.reviewNote && (
                <p className="text-xs text-slate-500 bg-white/70 dark:bg-slate-800 p-2 rounded-xl">
                  <strong>Finder Note:</strong> {userClaim.reviewNote}
                </p>
              )}
            </div>
          )}

          {/* Claims List for Finder / Admin */}
          {!isLost && (isCreator || isAdmin) && claimsList.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Ownership Claims</span>
                  <span className="px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
                    {claimsList.length}
                  </span>
                </h3>
              </div>

              <div className="space-y-2.5">
                {claimsList.map((claim) => (
                  <div
                    key={claim._id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar user={claim.claimant} size="sm" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {claim.claimant?.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {claim.claimant?.collegeId} • {claim.claimant?.email}
                          </p>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        {claim.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p>
                        <strong>Reason:</strong> {claim.reason}
                      </p>
                      <p>
                        <strong>Identifying Proof:</strong>{' '}
                        <span className="text-brand-600 dark:text-brand-400 font-semibold">{claim.identifyingDetails}</span>
                      </p>
                      {claim.previousLocation && (
                        <p>
                          <strong>Last Known Spot:</strong> {claim.previousLocation}
                        </p>
                      )}
                      {claim.contactNumber && (
                        <p>
                          <strong>Phone:</strong> {claim.contactNumber}
                        </p>
                      )}
                    </div>

                    {claim.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingClaimId(claim._id);
                            setReviewNote('');
                          }}
                          disabled={actionLoading}
                          className="px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveClaim(claim._id)}
                          disabled={actionLoading}
                          className="px-3.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 text-white text-xs font-semibold shadow-subtle"
                        >
                          Verify & Approve Claim
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Listing link copied to clipboard!');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Notice</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              {!isLost && !isCreator && !userClaim && item.status !== 'resolved' && (
                <button
                  onClick={() => setShowClaimModal(true)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white font-semibold text-xs shadow-subtle flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>This Is Mine (Submit Claim)</span>
                </button>
              )}

              {isCreator && item.status === 'active' && (
                <button
                  onClick={() => handleCloseReport('resolved')}
                  disabled={actionLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-semibold text-xs"
                >
                  Mark as Resolved
                </button>
              )}

              {(isCreator || isAdmin) && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={actionLoading}
                  className="px-3.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-dropdown border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Claim Recovered Item</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Provide verifiable details to confirm your ownership with the finder.
              </p>
            </div>

            <form onSubmit={handleClaimSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Circumstances / Where you lost it *
                </label>
                <textarea
                  rows={2}
                  value={claimForm.reason}
                  onChange={(e) => setClaimForm({ ...claimForm, reason: e.target.value })}
                  placeholder="e.g. Left it in Lab 2 on desk 4 around 3 PM"
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Specific Identifying Marks / Contents *
                </label>
                <textarea
                  rows={3}
                  value={claimForm.identifyingDetails}
                  onChange={(e) =>
                    setClaimForm({ ...claimForm, identifyingDetails: e.target.value })
                  }
                  placeholder="Provide stickers, initials, scratches, or interior contents only you know..."
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Last Known Location
                  </label>
                  <input
                    type="text"
                    value={claimForm.previousLocation}
                    onChange={(e) =>
                      setClaimForm({ ...claimForm, previousLocation: e.target.value })
                    }
                    placeholder="e.g. Near Canteen"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    value={claimForm.contactNumber}
                    onChange={(e) => setClaimForm({ ...claimForm, contactNumber: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 text-white font-semibold text-xs shadow-subtle"
                >
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Claim Modal */}
      {rejectingClaimId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-dropdown border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Reject Claim</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              State why the verification details did not match.
            </p>
            <form onSubmit={handleRejectClaim} className="space-y-3">
              <textarea
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Details provided do not match..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingClaimId(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-dropdown border border-slate-200 dark:border-slate-800 space-y-3 text-center">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Report?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This action cannot be undone. Listing and claims will be permanently removed.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ImageViewerModal
        isOpen={showImageModal}
        imageUrl={getImageUrl(item?.image)}
        title={item?.title}
        onClose={() => setShowImageModal(false)}
      />
    </div>
  );
};

export default LostFoundDetails;
