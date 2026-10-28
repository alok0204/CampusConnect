import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Avatar from '../components/Avatar';
import {
  Megaphone,
  Calendar,
  Clock,
  Pin,
  AlertTriangle,
  FileText,
  Download,
  Share2,
  Trash2,
  Edit,
  ArrowLeft,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  User,
  Eye,
} from 'lucide-react';

export const AnnouncementDetails = () => {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchAnnouncement();
  }, [id]);

  const fetchAnnouncement = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/announcements/${id}`);
      if (res.data.success) {
        setAnnouncement(res.data.announcement);
      }
    } catch (err) {
      console.error('Error loading announcement details:', err);
      setError(
        err.response?.data?.message ||
          'You are not authorized to view this circular, or it may have been removed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      const res = await api.delete(`/announcements/${id}`);
      if (res.data.success) {
        navigate('/announcements');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete announcement.');
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Circular Unavailable</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{error || 'This circular could not be accessed.'}</p>
        <Link
          to="/announcements"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Announcements Feed</span>
        </Link>
      </div>
    );
  }

  const isCreator =
    user &&
    announcement.createdBy &&
    (announcement.createdBy._id === user.id ||
      announcement.createdBy._id === user._id ||
      announcement.createdBy === user.id);

  const isUrgent = announcement.priority === 'urgent';
  const isImportant = announcement.priority === 'important';

  const formatFullDate = (d) => {
    return new Date(d).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getAudienceDisplay = (item) => {
    if (item.audience === 'all') return 'Campus-Wide Circular (All Students & Faculty)';
    if (item.audience === 'faculty') return 'Faculty & Academic Staff Members Only';
    if (item.audience === 'students') {
      return item.branch === 'ALL'
        ? 'All Undergraduate & Postgraduate Students'
        : `${item.branch} Department Students`;
    }
    if (item.audience === 'branch') return `${item.branch} Department Specific`;
    if (item.audience === 'year') {
      return `${item.branch === 'ALL' ? 'College' : item.branch} • ${item.year} Class`;
    }
    if (item.audience === 'section') {
      return `${item.branch} • ${item.year} (Section ${item.section})`;
    }
    return item.audience;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/announcements"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Circulars</span>
        </Link>

        <div className="flex items-center gap-2">
          {announcement.isRead && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/50">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Read</span>
            </span>
          )}
          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
              isUrgent
                ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/50'
                : isImportant
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {announcement.priority}
          </span>
        </div>
      </div>

      {/* Main Official Letterhead Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Letterhead Header Banner */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-brand-600">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-md shrink-0">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-brand-300">
                Official Campus Circular
              </span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight leading-none mt-0.5">
                CAMPUS CONNECT INSTITUTIONAL PORTAL
              </h2>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Ref No: CC/{new Date(announcement.publishAt).getFullYear()}/
                {announcement._id.substring(announcement._id.length - 6).toUpperCase()}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-bold">
              Date of Issue
            </span>
            <p className="text-sm font-bold text-white">
              {formatFullDate(announcement.publishAt)}
            </p>
          </div>
        </div>

        {/* Circular Content Container */}
        <div className="p-6 sm:p-10 space-y-6">
          {/* Metadata Badges Row */}
          <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <span className="px-3 py-1 rounded-xl bg-brand-100 dark:bg-brand-950/80 text-brand-900 dark:text-brand-300 text-xs font-bold uppercase tracking-wider">
              Category: {announcement.category}
            </span>

            <span className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-100/60 dark:border-blue-900/40">
              Audience: {getAudienceDisplay(announcement)}
            </span>

            {announcement.expiresAt && (
              <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">
                Valid Until: {new Date(announcement.expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {announcement.title}
            </h1>
            {announcement.summary && (
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium italic">
                "{announcement.summary}"
              </p>
            )}
          </div>

          {/* Body Content */}
          <div className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed space-y-4 whitespace-pre-line font-normal pt-2">
            {announcement.content}
          </div>

          {/* Attachment Download Box */}
          {announcement.attachment?.url && (
            <div className="p-5 rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-brand-600 text-white shrink-0 shadow-sm">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-800 dark:text-brand-300 block">
                    Official Document Attachment
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {announcement.attachment.name || 'Official_Circular.pdf'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Format: {announcement.attachment.fileType?.toUpperCase() || 'PDF'} •{' '}
                    {announcement.attachment.fileSize || 'Verified Campus Document'}
                  </p>
                </div>
              </div>

              <a
                href={announcement.attachment.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-colors shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download / View Attachment</span>
              </a>
            </div>
          )}

          {/* Authority Signoff Block */}
          <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="text-xs text-slate-400 dark:text-slate-500 space-y-0.5">
              <p>Campus Connect Institutional Verification System</p>
              <p>This circular is an authenticated college communication.</p>
            </div>

            <div className="flex items-center gap-3">
              <Avatar user={announcement.createdBy} size="lg" bgClass="bg-brand-600 text-white" className="shadow-sm" />
              <div className="text-left space-y-0.5">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  Issued By Authority
                </p>
                <p className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                  {announcement.createdBy?.name}
                </p>
                <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                  {announcement.createdBy?.role === 'ADMIN'
                    ? 'Office of the Campus Administrator'
                    : `Department of ${announcement.createdBy?.department || 'Academics'}`}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Action Toolbar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Circular link copied to clipboard!');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Circular</span>
            </button>

            {(isCreator || isAdmin) && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Circular</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete This Announcement?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              This action will remove the circular from all student and department feeds immediately.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementDetails;
