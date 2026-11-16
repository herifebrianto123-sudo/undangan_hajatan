import React from 'react';
import { EventCategory } from '../types/invitation';

export function GununganCrest({ className = 'w-20 h-28' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M60 6C60 6 88 42 102 82C112 110 108 134 94 148H26C12 134 8 110 18 82C32 42 60 6 60 6Z"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M60 15C60 15 83 47 95 83C103 107 100 128 89 141H31C20 128 17 107 25 83C37 47 60 15 60 15Z"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeOpacity="0.65"
      />
      <path d="M60 141V38" stroke="currentColor" strokeWidth="1.1" />
      <path
        d="M60 116C48 112 39 102 35 90M60 116C72 112 81 102 85 90"
        stroke="currentColor"
        strokeWidth="0.95"
      />
      <path
        d="M60 94C49 90 43 81 40 70M60 94C71 90 77 81 80 70"
        stroke="currentColor"
        strokeWidth="0.95"
      />
      <path
        d="M60 72C52 68 48 61 46 52M60 72C68 68 72 61 74 52"
        stroke="currentColor"
        strokeWidth="0.9"
      />
      <circle cx="60" cy="31" r="3" stroke="currentColor" strokeWidth="1" />
      <path
        d="M44 141V126C44 121 51 118 60 118C69 118 76 121 76 126V141"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M20 148H100M28 154H92M40 160H80"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.75"
      />
    </svg>
  );
}

export function BotanicalCrest({ className = 'w-20 h-20' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="46" stroke="currentColor" strokeWidth="1" strokeOpacity="0.45" />
      <circle cx="60" cy="60" r="38" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" />
      <path
        d="M60 22C68 38 68 54 60 68C52 54 52 38 60 22Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M60 68C72 56 84 52 94 56C86 68 74 72 60 68Z"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        d="M60 68C48 56 36 52 26 56C34 68 46 72 60 68Z"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path d="M60 68V96" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

export function CelebrationCrest({ className = 'w-20 h-20' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M60 12L66 44L98 38L72 58L94 86L62 72L52 104L46 72L14 78L40 58L18 30L50 44L60 12Z"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <circle cx="60" cy="58" r="14" stroke="currentColor" strokeWidth="0.9" strokeOpacity="0.6" />
    </svg>
  );
}

export function ArchCrescentCrest({ className = 'w-20 h-24' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M60 14C78 32 94 56 94 86V124H26V86C26 56 42 32 60 14Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M60 28C73 43 84 62 84 86V116H36V86C36 62 47 43 60 28Z"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeOpacity="0.6"
      />
      <path
        d="M67 52C60 52 54 58 54 65C54 72 60 78 67 78C62 80 55 79 50 74C45 69 45 61 50 56C55 51 62 50 67 52Z"
        fill="currentColor"
        fillOpacity="0.85"
      />
      <circle cx="71" cy="60" r="2.2" fill="currentColor" />
    </svg>
  );
}

export function CategoryCrest({
  category,
  frameStyle,
  className = 'w-16 h-20 md:w-20 md:h-24',
}: {
  category: EventCategory;
  frameStyle: 'arch' | 'editorial' | 'botanical' | 'royal';
  className?: string;
}) {
  if (frameStyle === 'botanical') {
    return <BotanicalCrest className={className} />;
  }
  if (category === 'ulang-tahun') {
    return <CelebrationCrest className={className} />;
  }
  if (category === 'khitanan' || category === 'syukuran') {
    return <ArchCrescentCrest className={className} />;
  }
  return <GununganCrest className={className} />;
}

export function JavaneseDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`} aria-hidden="true">
      <div className="h-px flex-1 max-w-[110px] bg-current opacity-20" />
      <svg width="28" height="18" viewBox="0 0 28 18" fill="none" className="shrink-0">
        <path
          d="M14 1L18.5 9L14 17L9.5 9L14 1Z"
          stroke="currentColor"
          strokeWidth="1.1"
        />
        <circle cx="14" cy="9" r="2" fill="currentColor" />
        <path d="M2 9H7M21 9H26" stroke="currentColor" strokeWidth="1" />
      </svg>
      <div className="h-px flex-1 max-w-[110px] bg-current opacity-20" />
    </div>
  );
}
