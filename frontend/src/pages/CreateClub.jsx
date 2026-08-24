import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ImageUpload from '../components/ImageUpload';
import {
  Users,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Send,
  Globe,
  Instagram,
  Linkedin,
  Github,
  Mail,
  Phone,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';

export const CreateClub = () => {
  const { user, isAdmin, isFaculty } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    description: '',
    category: 'Technical',
    department: 'Computer Science & Engineering',
    branch: 'ALL',
    facultyCoordinatorEmail: isFaculty ? user.email : '',
    studentPresidentEmail: !isFaculty && !isAdmin ? user.email : '',
    studentSecretaryEmail: '',
    contactEmail: user?.email || '',
    contactPhone: '',
    website: '',
    instagram: '',
    linkedin: '',
    github: '',
    logo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdClub, setCreatedClub] = useState(null);

  const categories = [
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
    { label: 'Other', value: 'Other' },
  ];

  const logoPresets = [
    {
      label: 'Tech / Coding',
      url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80',
    },
    {
      label: 'Robotics',
      url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&auto=format&fit=crop&q=80',
    },
    {
      label: 'Music / Arts',
      url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    },
    {
      label: 'Literary',
      url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&auto=format&fit=crop&q=80',
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || formData.name.trim().length < 3) {
      setError('Please provide a valid club name (at least 3 characters).');
      return;
    }

    if (!formData.shortDescription.trim() || formData.shortDescription.trim().length < 10) {
      setError('Please provide a brief summary of the club (at least 10 characters).');
      return;
    }

    if (!formData.description.trim() || formData.description.trim().length < 20) {
      setError('Please provide a full description explaining the club vision and planned activities.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      shortDescription: formData.shortDescription.trim(),
      description: formData.description.trim(),
      category: formData.category,
      department: formData.department.trim(),
      branch: formData.branch,
      facultyCoordinatorEmail: formData.facultyCoordinatorEmail.trim(),
      studentPresidentEmail: formData.studentPresidentEmail.trim(),
      studentSecretaryEmail: formData.studentSecretaryEmail.trim(),
      contactEmail: formData.contactEmail.trim(),
      contactPhone: formData.contactPhone.trim(),
      socialLinks: {
        website: formData.website.trim(),
        instagram: formData.instagram.trim(),
        linkedin: formData.linkedin.trim(),
        github: formData.github.trim(),
      },
      logo: formData.logo,
      coverImage: formData.coverImage,
    };

    try {
      setLoading(true);
      const res = await api.post('/clubs', payload);
      if (res.data.success) {
        setCreatedClub(res.data.club);
      }
    } catch (err) {
      console.error('Failed to create club:', err);
      setError(
        err.response?.data?.message || 'Failed to submit club proposal. Please check your inputs.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (createdClub) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 bg-emerald-100 text-emerald-800">
            {createdClub.status === 'active' ? 'Club Activated' : 'Proposal Submitted'}
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900">
            {createdClub.status === 'active'
              ? 'Club Chartered Successfully!'
              : 'Club Proposal Submitted for Review!'}
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
            {createdClub.status === 'active'
              ? `"${createdClub.name}" is now active and listed in the campus club directory.`
              : `"${createdClub.name}" has been forwarded to the college administration. Once approved, it will be listed in the directory.`}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs text-slate-700 max-w-md mx-auto">
          <p>
            <strong>Club Name:</strong> {createdClub.name}
          </p>
          <p>
            <strong>Category:</strong> {createdClub.category}
          </p>
          <p>
            <strong>Department:</strong> {createdClub.department}
          </p>
          <p>
            <strong>Initial Status:</strong>{' '}
            <span className="font-bold uppercase text-emerald-700">{createdClub.status}</span>
          </p>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={`/clubs/${createdClub._id}`}
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-colors"
          >
            View Club Page
          </Link>
          <Link
            to="/clubs/my-clubs"
            className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs transition-colors"
          >
            My Clubs Dashboard
          </Link>
          <Link
            to="/clubs"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
          >
            Back to Directory
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
          to="/clubs"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Clubs Directory</span>
        </Link>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
          Student Organization Charter
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Charter New Organization</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Propose a Student Club
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Submit a formal charter for a technical guild, cultural team, or campus society.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Club Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Club / Organization Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. AI & Machine Learning Guild / Drama Society"
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Category & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Target Branch / Scope *
              </label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">College-Wide (Open to All Branches)</option>
                <option value="CSE">Computer Science & Engineering (CSE)</option>
                <option value="ECE">Electronics & Communication (ECE)</option>
                <option value="ME">Mechanical Engineering (ME)</option>
                <option value="CE">Civil Engineering (CE)</option>
                <option value="IT">Information Technology (IT)</option>
              </select>
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Host Academic Department / Center
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="e.g. Computer Science & Engineering / Student Affairs"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Short Summary */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Short Pitch / Tagline (1-2 Sentences) *
            </label>
            <input
              type="text"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              placeholder="A brief summary shown on discovery cards and dashboard listings..."
              required
              maxLength={250}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Full Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Full Club Mission & Planned Activities *
            </label>
            <textarea
              name="description"
              rows={5}
              value={formData.description}
              onChange={handleChange}
              placeholder="Detail the club's objectives, regular meeting schedules, annual hackathons/festivals, workshops, and how students will benefit..."
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-y"
            ></textarea>
          </div>

          {/* Leadership Roster Emails */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
              Club Leadership & Faculty Mentorship
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Faculty Coordinator Email
                </label>
                <input
                  type="email"
                  name="facultyCoordinatorEmail"
                  value={formData.facultyCoordinatorEmail}
                  onChange={handleChange}
                  placeholder="faculty@campus.edu"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Student President Email
                </label>
                <input
                  type="email"
                  name="studentPresidentEmail"
                  value={formData.studentPresidentEmail}
                  onChange={handleChange}
                  placeholder="president@campus.edu"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Student Secretary Email
                </label>
                <input
                  type="email"
                  name="studentSecretaryEmail"
                  value={formData.studentSecretaryEmail}
                  onChange={handleChange}
                  placeholder="secretary@campus.edu"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Contact Details & Socials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Official Contact Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="club@campus.edu"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Contact Phone / WhatsApp Helpline
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-700 block">
              Social Links & Repository (Optional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="Website URL (https://...)"
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="url"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                placeholder="Instagram profile URL"
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="url"
                name="github"
                value={formData.github}
                onChange={handleChange}
                placeholder="GitHub Organization URL"
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="url"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                placeholder="LinkedIn Company URL"
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Logo & Cover Image Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <ImageUpload
                value={formData.logo}
                onChange={(url) => setFormData((prev) => ({ ...prev, logo: url }))}
                label="Club Logo"
                description="Upload club insignia/logo (Max 10 MB)"
                aspectRatio="square"
              />
              {/* Presets */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
                <span className="text-slate-400 font-semibold text-[11px] shrink-0">Presets:</span>
                {logoPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, logo: preset.url }))}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 text-[11px] font-semibold text-slate-600 hover:text-emerald-800 transition-colors cursor-pointer"
                  >
                    <img src={preset.url} alt={preset.label} className="w-4 h-4 rounded object-cover" />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <ImageUpload
                value={formData.coverImage}
                onChange={(url) => setFormData((prev) => ({ ...prev, coverImage: url }))}
                label="Club Banner / Cover Image"
                description="Upload club hero banner (Max 10 MB)"
                aspectRatio="banner"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/clubs')}
              className="px-4 py-2.5 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-200 flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>
                    {isAdmin ? 'Charter & Activate Club' : 'Submit Club Proposal'}
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

export default CreateClub;
