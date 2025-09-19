import React from 'react';

const COLORS = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
  '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
  '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
  '#ff5722', '#795548', '#607d8b',
];

const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.split(' ');
  const initials = parts.map(part => part[0]).join('');
  return initials.substring(0, 2).toUpperCase();
};

const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
};

const generateAvatar = (name: string): string => {
  const initials = getInitials(name);
  const colorIndex = Math.abs(hashCode(name)) % COLORS.length;
  const backgroundColor = COLORS[colorIndex];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="${backgroundColor}" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="40" font-family="sans-serif" font-weight="bold">${initials}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

interface AvatarProps {
  name: string;
  src: string | null | undefined;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ name, src, className = 'w-10 h-10 rounded-full' }) => {
  const avatarSrc = src || generateAvatar(name);
  return <img src={avatarSrc} alt={name} className={className} />;
};

export default Avatar;
