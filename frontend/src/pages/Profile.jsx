import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ImageUpload from '../components/ImageUpload';
import Avatar from '../components/Avatar';
import { getImageUrl } from '../utils/imageUrl';
import {
  User as UserIcon,
  Mail,
  Hash,
  BookOpen,
  Building,
  ShieldCheck,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Camera,
  Users,
  Calendar,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  GraduationCap,
} from 'lucide-react';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const avatarInputRef = useRef(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Profile Edit form state
  const [formData, setFormData] = useState({
    name: '',
    section: '',
    year: '',
    department: '',
    profileImage: '',
  });

  // Password Change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/profile');
      if (res.data.success) {
        setProfileData(res.data.profile);
        setFormData({
          name: res.data.profile.name || '',
          section: res.data.profile.section || 'A',
          year: res.data.profile.year || '1st Year',
          department: res.data.profile.department || '',
          profileImage: res.data.profile.profileImage || '',
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Could not load profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage('');
    setError('');

    // Validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(fileExt)) {
      setError('Invalid format. Please select a JPG, JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Photo is too large. Maximum allowed size is 10 MB.');
      return;
    }

    try {
      setAvatarUploading(true);
      const fd = new FormData();
      fd.append('image', file);

      const uploadRes = await api.post('/uploads/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (uploadRes.data.success) {
        const imageUrl = uploadRes.data.url;
        // Save immediately to user profile
        const updateRes = await api.put('/users/profile', { profileImage: imageUrl });
        if (updateRes.data.success) {
          try {
            const fullUrl = getImageUrl(imageUrl);
            const preloadImg = new Image();
            preloadImg.src = fullUrl;
          } catch (e) {}

          updateUser(updateRes.data.user);
          setProfileData((prev) => ({ ...prev, profileImage: imageUrl }));
          setFormData((prev) => ({ ...prev, profileImage: imageUrl }));
          setMessage('Profile photo updated successfully!');
        }
      }
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      setError(err.response?.data?.message || 'Failed to upload photo. Please try again.');
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);

    try {
      const res = await api.put('/users/profile', {
        name: formData.name,
        section: formData.section,
        year: formData.year,
        department: formData.department,
        profileImage: formData.profileImage,
      });

      if (res.data.success) {
        setMessage('Profile details updated successfully!');
        updateUser(res.data.user);
        setProfileData((prev) => ({
          ...prev,
          name: res.data.user.name,
          section: res.data.user.section,
          year: res.data.user.year,
          department: res.data.user.department,
          profileImage: res.data.user.profileImage,
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    // Client-side validations
    if (!passwordData.currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (!passwordData.newPassword) {
      setPasswordError('Please enter your new password.');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await api.put('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      if (res.data.success) {
        setPasswordSuccess('Password changed successfully! You can now use your new password.');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || 'Failed to change password. Please verify your current password.'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const p = profileData || user;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Main Profile Card (Clean, modern profile presentation without dark banner) */}
      <div className="bg-white dark:bg-[#121212] rounded-3xl border border-slate-200/80 dark:border-[#262626] shadow-sm p-6 sm:p-8 lg:p-10">
        {/* Profile Header Row: Avatar, Identity & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-slate-100 dark:border-slate-800/80">
          {/* Avatar and Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
            {/* Native hidden file picker for direct avatar upload */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleAvatarFileChange}
              className="hidden"
            />

            {/* Profile Avatar (slightly enlarged and prominent) */}
            <div
              onClick={() => avatarInputRef.current && avatarInputRef.current.click()}
              className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl sm:rounded-3xl border-4 border-slate-100 dark:border-slate-800 shadow-md overflow-hidden flex items-center justify-center shrink-0 relative group cursor-pointer bg-slate-100 dark:bg-slate-800 transition-transform duration-200 hover:scale-[1.02]"
              title="Click to change profile photo"
            >
              <Avatar user={p} size="3xl" shape="rounded" className="w-full h-full" />

              {/* Hover overlay with camera icon */}
              <div className="absolute inset-0 bg-slate-950/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold gap-1.5 backdrop-blur-[2px]">
                {avatarUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-white" />
                    <span>Change Photo</span>
                  </>
                )}
              </div>

              {avatarUploading && (
                <div className="absolute inset-0 bg-slate-950/65 flex items-center justify-center text-white">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}
            </div>

            {/* Name, Verified Badge & Role Pill */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                  {p?.name}
                </h1>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                  {p?.role} Account
                </span>
              </div>

              <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Verified Campus Identity</span>
              </p>
            </div>
          </div>

          {/* Action Buttons: Change Photo & Edit Profile */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => avatarInputRef.current && avatarInputRef.current.click()}
              disabled={avatarUploading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
            >
              {avatarUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-900 dark:text-white" />
              ) : (
                <Camera className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              )}
              <span>Change Photo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsEditing(!isEditing);
                setMessage('');
                setError('');
                setPasswordSuccess('');
                setPasswordError('');
              }}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-colors shadow-2xs cursor-pointer ${
                isEditing
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  : 'bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black font-bold'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>{isEditing ? 'Close Edit Mode' : 'Edit Profile'}</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Messages */}
        {message && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/80 flex items-center gap-2.5 text-rose-800 dark:text-rose-300 text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* View Profile Mode: Slightly Larger, Prominent Information Cards */}
        {!isEditing ? (
          <div className="pt-6">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-4">
              Academic & Identity Credentials
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {/* College ID */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-start gap-4">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/70 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                  <Hash className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-1">
                    College ID
                  </span>
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                    {p?.collegeId || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Roll Number (Students) */}
              {p?.role === 'STUDENT' && (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/70 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                    <GraduationCap className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-1">
                      Roll Number
                    </span>
                    <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                      {p?.rollNumber || 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-start gap-4">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/70 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                  <Mail className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-1">
                    Official Email
                  </span>
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate" title={p?.email}>
                    {p?.email || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Branch / Major (Students) */}
              {p?.role === 'STUDENT' && (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/70 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                    <BookOpen className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-1">
                      Branch (Major)
                    </span>
                    <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                      {p?.branch || 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              {/* Class & Section (Students) */}
              {p?.role === 'STUDENT' && (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/70 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                    <Calendar className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-1">
                      Class & Section
                    </span>
                    <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                      {p?.year || '1st Year'} • Section {p?.section || 'A'}
                    </p>
                  </div>
                </div>
              )}

              {/* Department (Faculty) */}
              {p?.role === 'FACULTY' && (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-start gap-4 sm:col-span-2">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/70 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                    <Building className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-1">
                      Department
                    </span>
                    <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                      {p?.department || 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Edit Profile Mode: Profile Information Form + Dedicated Security & Password Section */
          <div className="pt-6 space-y-10">
            {/* Form 1: General Profile Details */}
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Profile Information
                  </h3>
                </div>
              </div>

              {/* Profile Photo Upload in Edit Form */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70">
                <ImageUpload
                  value={formData.profileImage}
                  onChange={(url) => setFormData({ ...formData, profileImage: url })}
                  label="Profile Picture"
                  description="Upload a photo from your computer or phone (Max 10 MB)"
                  aspectRatio="square"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:outline-none transition-all"
                />
              </div>

              {/* Student Year & Section */}
              {p?.role === 'STUDENT' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Academic Year
                    </label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:outline-none transition-all"
                    >
                      <option value="1st Year" className="dark:bg-slate-800">1st Year</option>
                      <option value="2nd Year" className="dark:bg-slate-800">2nd Year</option>
                      <option value="3rd Year" className="dark:bg-slate-800">3rd Year</option>
                      <option value="4th Year" className="dark:bg-slate-800">4th Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Section
                    </label>
                    <select
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:outline-none transition-all"
                    >
                      <option value="A" className="dark:bg-slate-800">Section A</option>
                      <option value="B" className="dark:bg-slate-800">Section B</option>
                      <option value="C" className="dark:bg-slate-800">Section C</option>
                      <option value="D" className="dark:bg-slate-800">Section D</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Faculty Department */}
              {p?.role === 'FACULTY' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:outline-none transition-all"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 dark:text-black disabled:opacity-50 transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Details...</span>
                    </>
                  ) : (
                    <span>Save Profile Details</span>
                  )}
                </button>
              </div>
            </form>

            {/* Form 2: Dedicated Security & Password Management Section */}
            <form onSubmit={handlePasswordChange} className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Security & Password
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Ensure your account is protected with a secure password (minimum 8 characters).
                    </p>
                  </div>
                </div>
              </div>

              {/* Password-specific Feedback Alerts */}
              {passwordSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/80 flex items-center gap-2.5 text-rose-800 dark:text-rose-300 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {/* Current Password Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter your current password"
                    className="w-full pl-4 pr-11 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password & Confirm New Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Min. 8 characters"
                      className="w-full pl-4 pr-11 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordData.newPassword && passwordData.newPassword.length < 8 && (
                    <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mt-1.5">
                      Password must be at least 8 characters long (currently {passwordData.newPassword.length})
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Re-enter new password"
                      className="w-full pl-4 pr-11 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="text-[11px] font-medium text-rose-500 mt-1.5">
                      Passwords do not match
                    </p>
                  )}
                </div>
              </div>

              {/* Change Password Submit Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-black dark:bg-brand-600 dark:hover:bg-brand-500 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Change Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Club Memberships Box */}
      <div className="bg-white dark:bg-[#121212] rounded-3xl border border-slate-200/80 dark:border-[#262626] shadow-sm p-6 sm:p-8 lg:p-10">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#262626] mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#212121] text-slate-700 dark:text-slate-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Joined Campus Clubs</h2>
              <span className="text-xs text-slate-400">
                Used to unlock private club events & activities
              </span>
            </div>
          </div>
        </div>

        {p?.joinedClubs && p.joinedClubs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {p.joinedClubs.map((club, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#181818] border border-slate-200/80 dark:border-[#262626] flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black font-bold text-xs flex items-center justify-center shrink-0">
                  {club.name?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{club.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{club.role || 'Member'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 px-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No joined clubs yet</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Join clubs from the Clubs directory to participate in private club activities and events.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
