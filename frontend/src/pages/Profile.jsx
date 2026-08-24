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
} from 'lucide-react';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const avatarInputRef = useRef(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    name: '',
    section: '',
    year: '',
    department: '',
    profileImage: '',
    newPassword: '',
  });

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
          newPassword: '',
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
          // Preload image to ensure immediate browser rendering
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);

    try {
      const res = await api.put('/users/profile', formData);
      if (res.data.success) {
        setMessage('Profile updated successfully!');
        setIsEditing(false);
        updateUser(res.data.user);
        fetchProfile();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const p = profileData || user;
  const avatarUrl = p?.profileImage ? getImageUrl(p.profileImage) : '';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 relative">
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider">
            {p?.role} Account
          </div>
        </div>

        <div className="px-6 pb-6 sm:px-8 relative pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-14 mb-6 gap-4">
            {/* Avatar & Title */}
            <div className="flex items-end gap-4">
              {/* Native hidden file picker for direct avatar upload */}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleAvatarFileChange}
                className="hidden"
              />

              <div
                onClick={() => avatarInputRef.current && avatarInputRef.current.click()}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-md overflow-hidden flex items-center justify-center shrink-0 relative group cursor-pointer"
                title="Click to change profile photo"
              >
                <Avatar user={p} size="2xl" shape="rounded" className="w-full h-full" />

                {/* Hover overlay with camera icon */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1 backdrop-blur-[1px]">
                  {avatarUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  ) : (
                    <>
                      <Camera className="w-6 h-6" />
                      <span>Change</span>
                    </>
                  )}
                </div>

                {avatarUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
              </div>

              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                    {p?.name}
                  </h1>
                </div>
                <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Verified Campus Identity</span>
                </p>
              </div>
            </div>

            {/* Action Buttons: Change Photo & Edit Profile */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => avatarInputRef.current && avatarInputRef.current.click()}
                disabled={avatarUploading}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
              >
                {avatarUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <Camera className="w-4 h-4 text-slate-600" />
                )}
                <span>Change Photo</span>
              </button>

              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  setMessage('');
                  setError('');
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  isEditing
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>{isEditing ? 'Cancel Editing' : 'Edit Profile'}</span>
              </button>
            </div>
          </div>

          {/* Feedback messages */}
          {message && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-800 text-sm font-medium">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* View Profile Mode */}
          {!isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              {/* College ID */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  College ID
                </span>
                <p className="text-sm font-bold text-slate-800">{p?.collegeId || 'N/A'}</p>
              </div>

              {/* Roll Number (for Students) */}
              {p?.role === 'STUDENT' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Roll Number
                  </span>
                  <p className="text-sm font-bold text-slate-800">{p?.rollNumber || 'N/A'}</p>
                </div>
              )}

              {/* Email */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Email Address
                </span>
                <p className="text-sm font-bold text-slate-800 truncate">{p?.email}</p>
              </div>

              {/* Branch (Students) */}
              {p?.role === 'STUDENT' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Branch (Major)
                  </span>
                  <p className="text-sm font-bold text-blue-600">{p?.branch || 'N/A'}</p>
                </div>
              )}

              {/* Year & Section (Students) */}
              {p?.role === 'STUDENT' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Class & Section
                  </span>
                  <p className="text-sm font-bold text-slate-800">
                    {p?.year || '1st Year'} • Sec {p?.section || 'A'}
                  </p>
                </div>
              )}

              {/* Department (Faculty) */}
              {p?.role === 'FACULTY' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Department
                  </span>
                  <p className="text-sm font-bold text-slate-800">{p?.department || 'N/A'}</p>
                </div>
              )}
            </div>
          ) : (
            /* Edit Profile Form */
            <form onSubmit={handleUpdate} className="space-y-4 pt-2 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Edit Information
              </h3>

              {/* Profile Photo Upload in Edit Form */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <ImageUpload
                  value={formData.profileImage}
                  onChange={(url) => setFormData({ ...formData, profileImage: url })}
                  label="Profile Picture"
                  description="Upload a photo from your computer or phone (Max 10 MB)"
                  aspectRatio="square"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {p?.role === 'STUDENT' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Year
                    </label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Section
                    </label>
                    <select
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>
                </div>
              )}

              {p?.role === 'FACULTY' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Change Password (Leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="New password (min 6 characters)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Club Memberships Box */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Joined Campus Clubs</h2>
              <span className="text-xs text-slate-400">
                Used to unlock private club events & activities
              </span>
            </div>
          </div>
        </div>

        {p?.joinedClubs && p.joinedClubs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {p.joinedClubs.map((club, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  {club.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{club.name}</p>
                  <p className="text-xs text-slate-500">{club.role || 'Member'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 px-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
            <p className="text-sm font-semibold text-slate-700">No joined clubs yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Club memberships will be enabled in Phase 3. Once joined, your private club events will appear automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
