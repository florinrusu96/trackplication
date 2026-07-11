interface IconProps {
  size?: number;
  className?: string;
}

export const AppsIcon = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3 9H21" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export const ArchiveIcon = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M20 8L20 19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19L4 8" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3 4H21L20 8H4L3 4Z" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export const SettingsIcon = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 3V5M12 19V21M3 12H5M19 12H21M5.6 5.6L7 7M17 17L18.4 18.4M18.4 5.6L17 7M7 17L5.6 18.4" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export const SearchIcon = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M21 21L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const ChevronIcon = ({ size = 13 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ExternalIcon = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M7 17L17 7M17 7H9M17 7V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SparkleIcon = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 3L13.6 9.2C13.85 10.17 14.6 10.92 15.58 11.17L21.8 12.75C22.07 12.82 22.07 13.18 21.8 13.25L15.58 14.83C14.6 15.08 13.85 15.83 13.6 16.8L12 23C11.93 23.27 11.57 23.27 11.5 23L9.9 16.8C9.65 15.83 8.9 15.08 7.92 14.83L1.7 13.25C1.43 13.18 1.43 12.82 1.7 12.75L7.92 11.17C8.9 10.92 9.65 10.17 9.9 9.2L11.5 3C11.57 2.73 11.93 2.73 12 3Z" fill="currentColor" />
  </svg>
);

export const CloseIcon = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const SendIcon = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 20L21 12L4 4L4 10L16 12L4 14L4 20Z" fill="currentColor" />
  </svg>
);

export const CheckIcon = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 13L9 17L19 7" stroke="#8fc7a6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TrashIcon = ({ size = 13 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 7H20M10 11V17M14 11V17M5 7L6 20C6 20.6 6.4 21 7 21H17C17.6 21 18 20.6 18 20L19 7M9 7V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
