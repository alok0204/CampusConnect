import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ImageViewerModal from '../components/ImageViewerModal';
import Avatar from '../components/Avatar';
import { getImageUrl } from '../utils/imageUrl';
import {
  SearchCheck,
  MapPin,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Trash2,
  Ban,
  Share2,
  Tag,
  AlertTriangle,
  HelpCircle,
  Send,
  Sparkles,
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
  const [claimCounts, setClaimCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Claim submission modal
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
      if (res.data.success) {
        setItem(res.data.item);
        setUserClaim(res.data.userClaim);
        setClaimCounts(res.data.claimCounts);

        // If current user is finder or admin, fetch claims list
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
      if (res.data.success) {
        setClaimsList(res.data.claims);
      }
    } catch (err) {
      console.error('Failed to fetch claims:', err);
    }
  };

  // Submit Claim
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
      if (res.data.success) {
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

  // Approve Claim
  const handleApproveClaim = async (claimId) => {
    if (!window.confirm('Are you sure you want to approve this claim and resolve this item?'))
      return;

    try {
      setActionLoading(true);
      const res = await api.put(`/lost-found/claims/${claimId}/approve`, {
        reviewNote: 'Item handed over and ownership verified.',
      });
      if (res.data.success) {
        setActionMsg('Claim approved! Item has been marked as resolved.');
        fetchItemDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve claim.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Claim
  const handleRejectClaim = async (e) => {
    e.preventDefault();
    if (!rejectingClaimId) return;

    try {
      setActionLoading(true);
      const res = await api.put(`/lost-found/claims/${rejectingClaimId}/reject`, {
        reviewNote,
      });
      if (res.data.success) {
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

  // Close item
  const handleCloseReport = async (actionType) => {
    try {
      setActionLoading(true);
      const res = await api.put(`/lost-found/${id}/close`, { action: actionType });
      if (res.data.success) {
        setActionMsg(`Report marked as ${actionType}.`);
        fetchItemDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close report.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete item
  const handleDelete = async () => {
    try {
      setActionLoading(true);
      const res = await api.delete(`/lost-found/${id}`);
      if (res.data.success) {
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
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Listing Unavailable</h2>
        <p className="text-xs text-slate-500">{error || 'This report could not be found.'}</p>
        <Link
          to="/lost-found"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Lost & Found Directory</span>
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
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Lost & Found</span>
        </Link>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
              isLost ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {isLost ? 'Lost Item' : 'Found Item'}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
              item.status === 'resolved' || item.status === 'claimed'
                ? 'bg-emerald-100 text-emerald-800'
                : item.status === 'claim_pending'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {item.status === 'resolved'
              ? 'Resolved / Claimed'
              : item.status === 'claim_pending'
              ? 'Claim Pending'
              : 'Active'}
          </span>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Hero Image */}
        <div
          className="h-64 sm:h-96 relative bg-slate-900 overflow-hidden cursor-zoom-in group"
          onClick={() => {
            if (item.image) setShowImageModal(true);
          }}
          title="Click to view full image"
        >
          <img
            src={getImageUrl(item.image)}
            alt={item.title}
            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
              {item.category}
            </span>
          </div>

          {/* Full-screen zoom button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowImageModal(true);
            }}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition-all shadow-sm flex items-center gap-1.5 text-xs font-bold"
            title="View image full screen"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="hidden sm:inline">View Image</span>
          </button>

          <div className="absolute bottom-6 left-6 right-6 text-white space-y-1 pointer-events-none">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase">
              <MapPin className="w-3.5 h-3.5" />
              <span>{item.location}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {item.title}
            </h1>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-6 border-b border-slate-100">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                {isLost ? 'Date Lost' : 'Date Found'}
              </span>
              <p className="text-sm font-bold text-slate-800">{formatDate(item.date)}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Approximate Time
              </span>
              <p className="text-sm font-bold text-slate-800">{item.time || 'Not specified'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Brand / Manufacturer
              </span>
              <p className="text-sm font-bold text-slate-800">{item.brand || 'N/A'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Color
              </span>
              <p className="text-sm font-bold text-slate-800">{item.color || 'N/A'}</p>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Description & Details</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>
          </div>

          {/* Private Unique Details (Visible ONLY to Creator or Admin) */}
          {(isCreator || isAdmin) && item.uniqueDetails && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Confidential Identifying Details (Private to You & Admin)</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">{item.uniqueDetails}</p>
            </div>
          )}

          {/* Reporter / Finder Information Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar user={item.creator} size="lg" bgClass="bg-amber-600 text-white" className="shadow-sm" />
              <div>
                <p className="text-sm font-bold text-slate-900">{item.creator?.name}</p>
                <p className="text-xs text-slate-500">
                  Reported by {item.creator?.role?.toLowerCase()} (
                  {item.creator?.branch || item.creator?.department || 'Student'})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-600">
              {item.contactPreference === 'phone' && item.contactNumber && (
                <a
                  href={`tel:${item.contactNumber}`}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call / WhatsApp</span>
                </a>
              )}
              {item.contactPreference === 'email' && item.creator?.email && (
                <a
                  href={`mailto:${item.creator.email}`}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Send Email</span>
                </a>
              )}
            </div>
          </div>

          {/* User's Claim Status Banner (if current user submitted a claim) */}
          {userClaim && (
            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span>Your Claim Status</span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                    userClaim.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : userClaim.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {userClaim.status}
                </span>
              </div>
              <p className="text-xs text-blue-800">
                <strong>Your Statement:</strong> {userClaim.reason}
              </p>
              {userClaim.reviewNote && (
                <p className="text-xs text-slate-600 bg-white/70 p-2.5 rounded-xl border border-blue-100">
                  <strong>Finder's Note:</strong> {userClaim.reviewNote}
                </p>
              )}
            </div>
          )}

          {/* Review Incoming Claims Drawer (if current user IS finder or admin) */}
          {!isLost && (isCreator || isAdmin) && claimsList.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Submitted Ownership Claims</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold">
                    {claimsList.length}
                  </span>
                </h3>
              </div>

              <div className="space-y-3">
                {claimsList.map((claim) => (
                  <div
                    key={claim._id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar user={claim.claimant} size="sm" className="shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {claim.claimant?.name} ({claim.claimant?.branch || 'Student'})
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Roll: {claim.claimant?.rollNumber || claim.claimant?.collegeId} •{' '}
                            {claim.claimant?.email}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase ${
                          claim.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : claim.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {claim.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 space-y-1 bg-white p-3 rounded-xl border border-slate-100">
                      <p>
                        <strong>Reason / Circumstances:</strong> {claim.reason}
                      </p>
                      <p>
                        <strong>Identifying Features / Marks:</strong>{' '}
                        <span className="text-blue-900 font-semibold">{claim.identifyingDetails}</span>
                      </p>
                      {claim.previousLocation && (
                        <p>
                          <strong>Last Known Location:</strong> {claim.previousLocation}
                        </p>
                      )}
                      {claim.contactNumber && (
                        <p>
                          <strong>Contact Phone:</strong> {claim.contactNumber}
                        </p>
                      )}
                    </div>

                    {/* Action buttons if claim is pending */}
                    {claim.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingClaimId(claim._id);
                            setReviewNote('');
                          }}
                          disabled={actionLoading}
                          className="px-3.5 py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold transition-colors"
                        >
                          Reject Claim
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveClaim(claim._id)}
                          disabled={actionLoading}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
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
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Listing link copied to clipboard!');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Notice</span>
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* If it's a found item and user is NOT creator and not claimed yet */}
              {!isLost && !isCreator && !userClaim && item.status !== 'resolved' && (
                <button
                  onClick={() => setShowClaimModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-200 flex items-center gap-2 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>This Is Mine (Submit Claim)</span>
                </button>
              )}

              {/* Creator actions */}
              {isCreator && item.status === 'active' && (
                <button
                  onClick={() => handleCloseReport('resolved')}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition-colors"
                >
                  Mark as Resolved / Recovered
                </button>
              )}

              {(isCreator || isAdmin) && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Report</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Claim Submission Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Claim Recovered Item</h3>
                <p className="text-xs text-slate-500">
                  Provide verifiable details to prove your ownership to the finder.
                </p>
              </div>
            </div>

            <form onSubmit={handleClaimSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Why do you believe this item is yours? *
                </label>
                <textarea
                  rows={2}
                  value={claimForm.reason}
                  onChange={(e) => setClaimForm({ ...claimForm, reason: e.target.value })}
                  placeholder="e.g. I left my black case on the library 2nd floor desk yesterday afternoon."
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Specific Identifying Marks / Serial / Contents *
                </label>
                <textarea
                  rows={3}
                  value={claimForm.identifyingDetails}
                  onChange={(e) =>
                    setClaimForm({ ...claimForm, identifyingDetails: e.target.value })
                  }
                  placeholder="Provide details only the owner would know: e.g. wallpaper, specific stickers, scratched initials, specific contents inside..."
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Last Known Location / Time
                </label>
                <input
                  type="text"
                  value={claimForm.previousLocation}
                  onChange={(e) =>
                    setClaimForm({ ...claimForm, previousLocation: e.target.value })
                  }
                  placeholder="e.g. Around 3 PM in Room 104"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Your Phone / WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={claimForm.contactNumber}
                  onChange={(e) => setClaimForm({ ...claimForm, contactNumber: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-200"
                >
                  Submit Claim for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Claim Modal */}
      {rejectingClaimId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reject Ownership Claim</h3>
            <p className="text-xs text-slate-500">
              Enter reason why the verification details did not match this item.
            </p>
            <form onSubmit={handleRejectClaim} className="space-y-3">
              <textarea
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="e.g. Details provided do not match the markings on this recovered item."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500"
              ></textarea>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingClaimId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete This Report?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              This action cannot be undone. All report listings and associated claim records will be removed.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Full-screen Image Viewer Lightbox Modal */}
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
