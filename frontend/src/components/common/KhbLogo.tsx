import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface LogoProps {
  variant?: 'full' | 'icon';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const KhbLogo: React.FC<LogoProps> = ({
  variant = 'full',
  className = '',
  size = 'md',
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const getSizeClasses = () => {
    if (variant === 'icon') {
      switch (size) {
        case 'sm':
          return 'w-7 h-7';
        case 'lg':
          return 'w-11 h-11';
        case 'md':
        default:
          return 'w-9 h-9';
      }
    } else {
      switch (size) {
        case 'sm':
          return 'h-6 w-auto';
        case 'lg':
          return 'h-10 w-auto';
        case 'md':
        default:
          return 'h-8 w-auto';
      }
    }
  };

  if (variant === 'icon') {
    return (
      <img
        src="/khb-icon.png"
        alt="KHB.ai Logo"
        className={`object-contain rounded-xl shadow-xs shrink-0 select-none ${getSizeClasses()} ${className}`}
      />
    );
  }

  return (
    <div className={`flex items-center select-none ${className}`}>
      <img
        src={isDark ? '/khb-logo-dark.png' : '/khb-logo.png'}
        alt="KHB.ai"
        className={`object-contain ${getSizeClasses()}`}
      />
    </div>
  );
};
