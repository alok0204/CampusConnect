import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUrl';

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 sm:w-28 sm:h-28 text-3xl font-extrabold',
  '3xl': 'w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 text-4xl font-extrabold',
};

/**
 * Universal Shared Avatar / ProfileImage Component
 *
 * Automatically synchronizes with central AuthContext for the logged-in user,
 * resolves remote & uploaded static URLs, and handles fallback initials and broken images gracefully.
 */
export const Avatar = ({
  user = null,
  src = '',
  name = '',
  size = 'sm',
  className = '',
  shape = 'circle', // 'circle' (rounded-full) or 'rounded' (rounded-2xl)
  bgClass = 'bg-slate-900 text-white dark:bg-white dark:text-black',
  alt = '',
  onClick,
}) => {
  const auth = useAuth();
  const currentUser = auth?.user;
  const [imgError, setImgError] = useState(false);

  // Determine if passed user object is the currently authenticated user
  const isCurrentUser = Boolean(
    currentUser &&
      user &&
      ((user._id && (user._id === currentUser._id || user._id === currentUser.id)) ||
        (user.id && (user.id === currentUser._id || user.id === currentUser.id)) ||
        (user.email &&
          currentUser.email &&
          user.email.toLowerCase() === currentUser.email.toLowerCase()))
  );

  // Resolve source: prioritize user profile image or current logged-in user profile image
  const rawSource =
    src ||
    (isCurrentUser
      ? currentUser?.profileImage || user?.profileImage
      : user?.profileImage ||
        (typeof user === 'string' &&
        (user.startsWith('http') || user.startsWith('/') || user.startsWith('data:') || user.startsWith('blob:'))
          ? user
          : '')) ||
    (!user && currentUser?.profileImage ? currentUser.profileImage : '');

  // Reset error state whenever the underlying source changes
  useEffect(() => {
    setImgError(false);
  }, [rawSource]);

  const resolvedUrl = rawSource ? getImageUrl(rawSource) : '';

  // Compute displayName for fallback initials and alt text
  const displayName =
    name ||
    (isCurrentUser ? currentUser?.name || user?.name : user?.name) ||
    (!user ? currentUser?.name : '') ||
    (typeof user === 'string' && !user.includes('/') ? user : '') ||
    'User';

  const getInitials = (str) => {
    if (!str || typeof str !== 'string') return 'U';
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
  };

  const initials = getInitials(displayName);
  const sizeClasses = sizeMap[size] || sizeMap.sm;
  const shapeClasses = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

  const hasValidImage = Boolean(resolvedUrl && !imgError);

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center justify-center font-bold overflow-hidden shrink-0 select-none ${sizeClasses} ${shapeClasses} ${
        !hasValidImage ? bgClass : 'bg-transparent'
      } ${className}`}
      title={displayName}
      aria-label={displayName}
    >
      {hasValidImage ? (
        <img
          src={resolvedUrl}
          alt={alt || displayName}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover block"
          loading="eager"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="leading-none select-none">{initials}</span>
      )}
    </div>
  );
};

export default Avatar;
