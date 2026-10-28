import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Megaphone,
  Calendar,
  Clock,
  Pin,
  AlertTriangle,
  FileText,
  Paperclip,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  Save,
  HelpCircle,
} from 'lucide-react';

export const CreateAnnouncement = () => {
  const { user, isAdmin, isFaculty } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'academic',
    priority: 'normal',
    audience: 'all', // 'all', 'students', 'faculty', 'branch', 'department', 'year', 'section'
    branch: 'ALL',
    department: 'ALL',
    year: 'ALL',
    section: 'ALL',
    image: '',
    attachmentName: '',
    attachmentUrl: '',
    attachmentFileType: 'pdf',
    attachmentFileSize: '',
    schedulePublish: false,
    publishAtDate: new Date().toISOString().split('T')[0],
    publishAtTime: '09:00',
    hasExpiry: false,
    expiresAtDate: '',
    expiresAtTime: '23:59',
    isPinned: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [publishedAnnouncement, setPublishedAnnouncement] = useState(null);

  const categories = [
    { label: 'Academic & Courses', value: 'academic' },
    { label: 'Examinations & Timetable', value: 'exam' },
    { label: 'Training & Placements', value: 'placement' },
    { label: 'Campus Events & Fests', value: 'event' },
    { label: 'Scholarships & Aid', value: 'scholarship' },
    { label: 'Administrative Circulars', value: 'administrative' },
    { label: 'General Notices', value: 'general' },
    { label: 'Emergency Broadcast', value: 'emergency' },
  ];

  const sampleAttachments = [
    {
      name: 'Official_Notice_Circular.pdf',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      type: 'pdf',
      size: '1.2 MB',
    },
    {
      name: 'Timetable_Schedule_Sheet.pdf',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      type: 'pdf',
      size: '850 KB',
    },
    {
      name: 'Application_Registration_Form.pdf',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      type: 'pdf',
      size: '420 KB',
    },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePublishSubmit = async (e, isDraft = false) => {
    if (e) e.preventDefault();
    setError('');

    if (!formData.title.trim() || formData.title.trim().length < 5) {
      setError('Please provide a clear announcement title (at least 5 characters).');
      return;
    }

    if (!formData.content.trim() || formData.content.trim().length < 15) {
      setError('Please provide full announcement content (at least 15 characters).');
      return;
    }

    // Build publication date
    let publishAt = new Date();
    if (formData.schedulePublish && formData.publishAtDate) {
      publishAt = new Date(`${formData.publishAtDate}T${formData.publishAtTime || '09:00'}:00`);
    }

    // Build expiration date
    let expiresAt = null;
    if (formData.hasExpiry && formData.expiresAtDate) {
      expiresAt = new Date(`${formData.expiresAtDate}T${formData.expiresAtTime || '23:59'}:00`);
      if (expiresAt <= publishAt) {
        setError('Expiration date/time must be strictly after the publication date/time.');
        return;
      }
    }

    const payload = {
      title: formData.title.trim(),
      summary: formData.summary.trim(),
      content: formData.content.trim(),
      category: formData.category,
      priority: formData.priority,
      audience: formData.audience,
      branch: formData.branch,
      department: formData.department,
      year: formData.year,
      section: formData.section,
      image: formData.image.trim(),
      attachment: formData.attachmentUrl.trim()
        ? {
            name: formData.attachmentName.trim() || 'Attached_Document.pdf',
            url: formData.attachmentUrl.trim(),
            fileType: formData.attachmentFileType,
            fileSize: formData.attachmentFileSize || '1 MB',
          }
        : undefined,
      publishAt: publishAt.toISOString(),
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      isPinned: formData.isPinned,
      status: isDraft ? 'draft' : undefined,
    };

    try {
      setLoading(true);
      const res = await api.post('/announcements', payload);
      if (res.data.success) {
        setPublishedAnnouncement(res.data.announcement);
      }
    } catch (err) {
      console.error('Failed to create announcement:', err);
      setError(
        err.response?.data?.message || 'Failed to publish announcement. Please check your inputs.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Success Confirmation Screen
  if (publishedAnnouncement) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 sm:p-12 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 bg-brand-100 dark:bg-brand-950/80 text-brand-800 dark:text-brand-300">
            {publishedAnnouncement.status === 'draft'
              ? 'Draft Saved'
              : publishedAnnouncement.status === 'scheduled'
              ? 'Notice Scheduled'
              : 'Announcement Published'}
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {publishedAnnouncement.status === 'draft'
              ? 'Circular Saved to Drafts'
              : publishedAnnouncement.status === 'scheduled'
              ? 'Announcement Scheduled Successfully!'
              : 'Announcement Published Live!'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            "{publishedAnnouncement.title}" is now recorded in the campus management system.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-left space-y-2 text-xs text-slate-700 dark:text-slate-300 max-w-md mx-auto">
          <p>
            <strong className="text-slate-900 dark:text-white">Category:</strong> {publishedAnnouncement.category?.toUpperCase()}
          </p>
          <p>
            <strong className="text-slate-900 dark:text-white">Priority:</strong> {publishedAnnouncement.priority?.toUpperCase()}
          </p>
          <p>
            <strong className="text-slate-900 dark:text-white">Audience Scope:</strong> {publishedAnnouncement.audience} (Branch:{' '}
            {publishedAnnouncement.branch})
          </p>
          <p>
            <strong className="text-slate-900 dark:text-white">Publish Date:</strong>{' '}
            {new Date(publishedAnnouncement.publishAt).toLocaleString()}
          </p>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={`/announcements/${publishedAnnouncement._id}`}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-colors"
          >
            View Circular Details
          </Link>
          <Link
            to="/announcements/manage"
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition-colors"
          >
            My Published Circulars
          </Link>
          <Link
            to="/announcements"
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Back to Public Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/announcements"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Announcements Feed</span>
        </Link>
        <span className="text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800/60 px-3 py-1 rounded-full">
          Faculty & Admin Publishing Desk
        </span>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-10 space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Publish Official Circular</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Draft & Publish Announcement
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Publish academic timetables, exam instructions, department broadcasts, or emergency campus circulars.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-700 dark:text-red-300 text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={(e) => handlePublishSubmit(e, false)} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Circular Title / Subject *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Mid-Semester Examination Timetable Spring 2026 / CSE Lab Assessment"
              required
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Priority Level *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              >
                <option value="normal" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Normal (Standard Bulletin)</option>
                <option value="important" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Important (Highlighted Notice)</option>
                <option value="urgent" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Urgent (Flashing Ribbon & Top Priority)</option>
              </select>
            </div>
          </div>

          {/* Target Audience Selector (Core Feature) */}
          <div className="p-5 rounded-2xl bg-brand-50/40 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/40 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-950 dark:text-brand-200">
                Target Audience Scope *
              </label>
              <span className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold">
                Backend Enforced Filter
              </span>
            </div>

            <select
              name="audience"
              value={formData.audience}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">College-Wide (All Students & Faculty)</option>
              <option value="students" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Students (or Specific Branch)</option>
              <option value="faculty" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Faculty & Staff Only</option>
              <option value="branch" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Branch Only (e.g. CSE or ECE)</option>
              <option value="year" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Specific Branch + Year (e.g. CSE 2nd Year)</option>
              <option value="section" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Specific Section (e.g. CSE 2nd Year Sec A)</option>
            </select>

            {/* Dynamic Dropdowns for Scope */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Target Branch
                </label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="ALL">All Branches</option>
                  <option value="CSE">Computer Science (CSE)</option>
                  <option value="ECE">Electronics (ECE)</option>
                  <option value="ME">Mechanical (ME)</option>
                  <option value="CE">Civil (CE)</option>
                  <option value="IT">Information Tech (IT)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Target Year
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="ALL">All Years</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Target Section
                </label>
                <select
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="ALL">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
            </div>
          </div>

          {/* Summary / Excerpt */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Short Summary / Bulletin Excerpt (Optional)
            </label>
            <input
              type="text"
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              placeholder="Brief 1-2 sentence preview shown on dashboard cards and feed listings..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Full Content */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Full Circular Content / Notice Body *
            </label>
            <textarea
              name="content"
              rows={6}
              value={formData.content}
              onChange={handleChange}
              placeholder="Write the full circular instructions, room numbers, reporting times, prerequisites, or contact information..."
              required
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all resize-y"
            ></textarea>
          </div>

          {/* Attachment Configuration */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Paperclip className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Official Document Attachment (Optional)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                name="attachmentName"
                value={formData.attachmentName}
                onChange={handleChange}
                placeholder="Document Name (e.g. Schedule_Timetable.pdf)"
                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
              />
              <input
                type="url"
                name="attachmentUrl"
                value={formData.attachmentUrl}
                onChange={handleChange}
                placeholder="Document URL (https://... or sample PDF)"
                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-slate-400 dark:text-slate-500 font-semibold text-[11px] shrink-0">
                Sample Attachments:
              </span>
              {sampleAttachments.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      attachmentName: preset.name,
                      attachmentUrl: preset.url,
                      attachmentFileType: preset.type,
                      attachmentFileSize: preset.size,
                    }))
                  }
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-brand-50 dark:hover:bg-brand-950/40 hover:border-brand-200 dark:hover:border-brand-800 text-slate-600 dark:text-slate-300 hover:text-brand-800 dark:hover:text-brand-300 whitespace-nowrap text-[11px] font-semibold transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Scheduling & Expiry Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            {/* Scheduling */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="schedulePublish"
                  checked={formData.schedulePublish}
                  onChange={handleChange}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Schedule Publication for Later
                </span>
              </label>

              {formData.schedulePublish && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <input
                    type="date"
                    name="publishAtDate"
                    value={formData.publishAtDate}
                    onChange={handleChange}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  />
                  <input
                    type="time"
                    name="publishAtTime"
                    value={formData.publishAtTime}
                    onChange={handleChange}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}
            </div>

            {/* Expiry */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="hasExpiry"
                  checked={formData.hasExpiry}
                  onChange={handleChange}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Set Auto-Expiration Date</span>
              </label>

              {formData.hasExpiry && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <input
                    type="date"
                    name="expiresAtDate"
                    value={formData.expiresAtDate}
                    onChange={handleChange}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  />
                  <input
                    type="time"
                    name="expiresAtTime"
                    value={formData.expiresAtTime}
                    onChange={handleChange}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <button
              type="button"
              onClick={(e) => handlePublishSubmit(e, true)}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>Save as Draft</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/announcements')}
                className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>
                      {formData.schedulePublish ? 'Schedule Announcement' : 'Publish Announcement'}
                    </span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAnnouncement;
