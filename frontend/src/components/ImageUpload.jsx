import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUrl';

export const ImageUpload = ({
  value = '',
  onChange,
  label = 'Upload Image',
  description = 'Supports JPG, PNG, and WebP (Max 10 MB)',
  required = false,
  aspectRatio = 'auto', // 'auto', 'square', 'banner'
}) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Clear messages on value change from outside
  useEffect(() => {
    setError('');
  }, [value]);

  const handleFile = async (file) => {
    if (!file) return;

    setError('');
    setSuccessMsg('');

    // 1. Client-side Type Validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(fileExt)) {
      setError('Invalid file format. Please upload a JPG, JPEG, PNG, or WebP image.');
      return;
    }

    // 2. Client-side Size Validation (10 MB max)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`);
      return;
    }

    // 3. Upload file to backend
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/uploads/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setSuccessMsg('Image uploaded successfully!');
        if (onChange) {
          onChange(res.data.url);
        }
      } else {
        setError(res.data.message || 'Failed to upload image. Please try again.');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      setError(
        err.response?.data?.message ||
          'Upload failed. Please check your network connection and try again.'
      );
    } finally {
      setUploading(false);
      // Reset input value so same file can be re-selected if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setError('');
    setSuccessMsg('');
    if (onChange) {
      onChange('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerPicker = () => {
    if (fileInputRef.current && !uploading) {
      fileInputRef.current.click();
    }
  };

  const displayUrl = value ? getImageUrl(value) : '';

  return (
    <div className="space-y-2">
      {/* Label & Requirement indicator */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {description && (
            <span className="text-[11px] text-slate-400 font-medium">{description}</span>
          )}
        </div>
      )}

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Main Upload Box */}
      {displayUrl ? (
        /* Image Preview Box */
        <div className="relative group rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-900 shadow-sm transition-all">
          <div
            className={`w-full overflow-hidden flex items-center justify-center ${
              aspectRatio === 'banner'
                ? 'h-48 sm:h-56'
                : aspectRatio === 'square'
                ? 'h-48 w-48 mx-auto'
                : 'h-52'
            }`}
          >
            <img
              src={displayUrl}
              alt="Uploaded preview"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Top-right Actions Overlay */}
          <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 backdrop-blur-[2px]">
            <button
              type="button"
              onClick={triggerPicker}
              disabled={uploading}
              className="px-3.5 py-2 rounded-xl bg-white text-slate-900 text-xs font-medium shadow-md hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-900 dark:text-white" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>Change Image</span>
            </button>

            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-medium shadow-md hover:bg-rose-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>

          {/* Uploading Spinner Overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center text-white space-y-2 backdrop-blur-sm">
              <Loader2 className="w-7 h-7 animate-spin text-slate-300" />
              <span className="text-xs font-medium">Uploading image...</span>
            </div>
          )}
        </div>
      ) : (
        /* Empty Drag & Drop / Click to Upload Box */
        <div
          onClick={triggerPicker}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
            isDragOver
              ? 'border-slate-800 bg-slate-100/50 dark:border-white dark:bg-white/10 scale-[1.01]'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/60'
          }`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              triggerPicker();
            }
          }}
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center space-y-2 py-3">
              <Loader2 className="w-7 h-7 text-slate-900 dark:text-white animate-spin" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Uploading image from device...</span>
            </div>
          ) : (
            <>
              <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Click to select photo or drag and drop
                </p>
                <p className="text-xs text-slate-400">
                  JPG, JPEG, PNG, or WebP up to 10 MB
                </p>
              </div>
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black text-xs font-medium shadow-sm transition-colors mt-0.5 pointer-events-none"
              >
                Browse Device
              </button>
            </>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {successMsg && !error && (
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
