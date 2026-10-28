import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ImageUpload from '../components/ImageUpload';
import {
  SearchCheck,
  Calendar,
  Clock,
  MapPin,
  Tag,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Send,
  HelpCircle,
  FileText,
} from 'lucide-react';

export const CreateLostFound = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialType = searchParams.get('type') === 'found' ? 'found' : 'lost';

  const [formData, setFormData] = useState({
    type: initialType, // 'lost' or 'found'
    title: '',
    description: '',
    category: 'Electronics',
    location: '',
    date: new Date().toISOString().split('T')[0],
    time: '12:00 PM',
    color: '',
    brand: '',
    uniqueDetails: '',
    contactPreference: 'portal',
    contactNumber: '',
    image: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedItem, setSubmittedItem] = useState(null);

  const categories = [
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

  const sampleImages = [
    {
      label: 'ID Card / Document',
      url: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=800&auto=format&fit=crop&q=80',
    },
    {
      label: 'Electronics / Charger',
      url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
    },
    {
      label: 'Earbuds / Headphones',
      url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
    },
    {
      label: 'Calculator / Book',
      url: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=800&auto=format&fit=crop&q=80',
    },
    {
      label: 'Watch / Accessory',
      url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80',
    },
    {
      label: 'Keys / Keychain',
      url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80',
    },
  ];

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || formData.title.trim().length < 3) {
      setError('Please provide a descriptive item title (at least 3 characters).');
      return;
    }

    if (!formData.description.trim() || formData.description.trim().length < 10) {
      setError('Please provide a full description of the item (at least 10 characters).');
      return;
    }

    if (!formData.location.trim()) {
      setError('Please specify the campus location where the item was lost or found.');
      return;
    }

    if (!formData.date) {
      setError('Please specify the date.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/lost-found', formData);
      if (res.data.success) {
        setSubmittedItem(res.data.item);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit report. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  // Submission success screen
  if (submittedItem) {
    const isLost = submittedItem.type === 'lost';
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 sm:p-12 text-center space-y-5">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm ${
            isLost ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
              isLost
                ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            {isLost ? 'Lost Item Notice Published' : 'Found Item Registered & Live'}
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {isLost ? 'Lost Item Notice Created!' : 'Found Item Registered Successfully!'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            {isLost
              ? `Your lost item notice for "${submittedItem.title}" is now active in the campus directory. Anyone who recovers it will be able to reach out to you.`
              : `Thank you for registering "${submittedItem.title}". The owner can now discover it and submit an ownership verification claim.`}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-left space-y-2 text-xs text-slate-700 dark:text-slate-300 max-w-md mx-auto">
          <p>
            <strong className="text-slate-900 dark:text-white">Item:</strong> {submittedItem.title}
          </p>
          <p>
            <strong className="text-slate-900 dark:text-white">Category & Location:</strong> {submittedItem.category} • {submittedItem.location}
          </p>
          <p>
            <strong className="text-slate-900 dark:text-white">Date:</strong> {new Date(submittedItem.date).toLocaleDateString()}
          </p>
          <p>
            <strong className="text-slate-900 dark:text-white">Current Status:</strong>{' '}
            <span className="font-bold text-emerald-700 dark:text-emerald-400 uppercase">{submittedItem.status}</span>
          </p>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={`/lost-found/${submittedItem._id}`}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-colors"
          >
            View Item Details
          </Link>
          <Link
            to="/lost-found/my-reports"
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition-colors"
          >
            My Reports & Claims
          </Link>
          <Link
            to="/lost-found"
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  const isLostForm = formData.type === 'lost';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/lost-found"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Lost & Found Directory</span>
        </Link>
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Campus Notice Board</span>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-10 space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Item Report</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isLostForm ? 'Report a Lost Item' : 'Register a Found Item'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isLostForm
              ? 'Publish details of your misplaced belonging so that college mates or lab supervisors can identify and return it.'
              : 'Register an item you recovered on campus. Owners will be prompted to provide matching identifying verification details.'}
          </p>
        </div>

        {/* Type Toggle Switcher */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, type: 'lost' }))}
            className={`py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              isLostForm
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🚩 I Lost Something</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, type: 'found' }))}
            className={`py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              !isLostForm
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🎁 I Found Something</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-700 dark:text-red-300 text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title / Item Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Item Name / Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={
                isLostForm
                  ? 'e.g. Blue HP Laptop Charger / Black Fastrack Watch'
                  : 'e.g. Casio fx-991EX Calculator / boAt Earbuds Case'
              }
              required
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>

          {/* Category & Location */}
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
                  <option key={cat} value={cat} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                {isLostForm ? 'Location Where Lost *' : 'Location Where Found *'}
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Central Library 2nd Floor / CS Lab 3 / Canteen"
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
              />
            </div>
          </div>

          {/* Date & Approximate Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                {isLostForm ? 'Date Lost *' : 'Date Found *'}
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Approximate Time
              </label>
              <input
                type="text"
                name="time"
                value={formData.time}
                onChange={handleChange}
                placeholder="e.g. 11:30 AM or Afternoon Lab Session"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Color & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Color
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="e.g. Black & Silver / Blue / Matte White"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Brand / Manufacturer
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="e.g. HP / Apple / Casio / Wildcraft / boAt"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Full Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Public Description *
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the item, general appearance, and situation..."
              required
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all resize-y"
            ></textarea>
          </div>

          {/* Unique Details (Verification Security Feature) */}
          <div className="p-4 rounded-2xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200/70 dark:border-brand-800/60 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-900 dark:text-brand-300">
              <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Private Distinguishing Details (Kept Confidential)</span>
            </div>
            <p className="text-[11px] text-brand-800 dark:text-brand-300/80 leading-relaxed">
              {isLostForm
                ? 'Enter specific confidential features (e.g. engraving, scratches, wallpaper, serial number) to help verify your ownership.'
                : 'Enter private marks that only the true owner would know. This field is kept hidden from public viewers and used to verify incoming claims!'}
            </p>
            <input
              type="text"
              name="uniqueDetails"
              value={formData.uniqueDetails}
              onChange={handleChange}
              placeholder="e.g. Wallpaper has a cat picture, initials AS on strap, small chip on bottom right corner"
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Item Photo Upload */}
          <div className="space-y-2">
            <ImageUpload
              value={formData.image}
              onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
              label={isLostForm ? 'Lost Item Photo (Optional)' : 'Found Item Photo (Recommended)'}
              description="Upload item photo from device (Max 10 MB)"
              aspectRatio="banner"
            />

            {/* Presets */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar pt-1">
              <span className="text-slate-400 dark:text-slate-500 font-semibold text-[11px] shrink-0">
                Or pick a preset category photo:
              </span>
              {sampleImages.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, image: preset.url }))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-900/40 hover:border-brand-200 dark:hover:border-brand-700 text-slate-600 dark:text-slate-300 hover:text-brand-800 dark:hover:text-brand-300 whitespace-nowrap text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Preference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Preferred Contact Channel
              </label>
              <select
                name="contactPreference"
                value={formData.contactPreference}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              >
                <option value="portal" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Campus Connect Portal Only</option>
                <option value="email" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">College Email Address</option>
                <option value="phone" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Phone / WhatsApp</option>
                <option value="in_person" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">In Person at Department / Lab</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Contact Number (Optional)
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="+91 9876543210"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/lost-found')}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all ${
                isLostForm
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>
                    {isLostForm ? 'Publish Lost Item Notice' : 'Register Found Item'}
                  </span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLostFound;
