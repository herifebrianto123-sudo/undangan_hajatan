import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Film,
  Heart,
  Home,
  Image as ImageIcon,
  MailOpen,
  MapPin,
  MessageSquareHeart,
  Music,
  Pause,
  Play,
  Trash2,
  X,
} from 'lucide-react';
import {
  deleteWishFromDb,
  submitWishToDb,
  subscribeInvitationWishes,
} from '../services/invitationDb';
import { InvitationConfig } from '../types/invitation';
import { INDONESIAN_LABELS } from '../utils/i18nTemplates';
import { JavaneseAudioPlayer } from '../utils/javaneseAudio';
import {
  getPaletteById,
  getThemeById,
  resolveEmbedVideoUrl,
} from '../utils/themePresets';
import { GuestWish, INITIAL_WISHES } from '../utils/weddingData';
import { CategoryCrest, JavaneseDivider } from './JavaneseOrnaments';

interface InvitationPreviewProps {
  config: InvitationConfig;
  guestName?: string;
  embedded?: boolean;
  startOpened?: boolean;
  invitationId?: string | null;
  invitationOwnerId?: string | null;
  currentUserUid?: string | null;
}

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const STORAGE_KEY = 'undangan_rsvp_wishes_id_v1';

function computeCountdown(targetISO: string): CountdownState {
  const targetMs = new Date(targetISO).getTime();
  if (Number.isNaN(targetMs)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const diff = Math.max(0, targetMs - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function formatRelativeTime(timestamp: number): string {
  const diffMin = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return `${Math.floor(diffHours / 24)} hari lalu`;
}

function getTitleMonogram(title: string): string {
  const words = title
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]} · ${words[words.length - 1][0]}`.toUpperCase();
  }
  return title.slice(0, 2).toUpperCase();
}

export default function InvitationPreview({
  config,
  guestName = 'Tamu Undangan',
  embedded = false,
  startOpened = false,
  invitationId = null,
  invitationOwnerId = null,
  currentUserUid = null,
}: InvitationPreviewProps) {
  const theme = getThemeById(config.themeId);
  const style = theme.designStyle;
  const palette = getPaletteById(config.paletteId);
  const labels = INDONESIAN_LABELS;
  const effectiveBgCanvas = config.useCustomBg
    ? config.customBgColor
    : palette.bgCanvas;
  const isCloudConnected = Boolean(invitationId && invitationOwnerId);

  const [isOpened, setIsOpened] = useState(startOpened);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState<CountdownState>(() =>
    computeCountdown(config.targetDateISO)
  );

  const [wishes, setWishes] = useState<GuestWish[]>(() => {
    if (invitationId && invitationOwnerId) return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as GuestWish[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore storage error
    }
    return INITIAL_WISHES;
  });

  const [nama, setNama] = useState(() =>
    guestName !== 'Tamu Undangan' ? guestName : ''
  );
  const [kehadiran, setKehadiran] = useState<'Hadir' | 'Berhalangan'>('Hadir');
  const [jumlah, setJumlah] = useState<number>(2);
  const [ucapan, setUcapan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toastTimerRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<JavaneseAudioPlayer | null>(null);

  useEffect(() => {
    setIsOpened(startOpened);
  }, [startOpened]);

  useEffect(() => {
    if (guestName !== 'Tamu Undangan') {
      setNama(guestName);
    }
  }, [guestName]);

  useEffect(() => {
    if (!invitationId || !invitationOwnerId) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as GuestWish[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setWishes(parsed);
            return;
          }
        }
      } catch {
        // Ignore storage error
      }
      setWishes(INITIAL_WISHES);
      return;
    }

    const unsubscribe = subscribeInvitationWishes(invitationId, (cloudWishes) => {
      setWishes(cloudWishes);
    });
    return () => unsubscribe();
  }, [invitationId, invitationOwnerId]);

  useEffect(() => {
    audioPlayerRef.current = new JavaneseAudioPlayer(
      config.music.mode,
      config.music.customUrl
    );
    return () => {
      audioPlayerRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    audioPlayerRef.current?.setSource(
      config.music.mode,
      config.music.customUrl
    );
  }, [config.music.mode, config.music.customUrl]);

  useEffect(() => {
    if (!config.features.showMusic && isPlaying) {
      audioPlayerRef.current?.pause();
      setIsPlaying(false);
    }
  }, [config.features.showMusic, isPlaying]);

  useEffect(() => {
    setCountdown(computeCountdown(config.targetDateISO));
    const id = window.setInterval(() => {
      setCountdown(computeCountdown(config.targetDateISO));
    }, 1000);
    return () => window.clearInterval(id);
  }, [config.targetDateISO]);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIdx(null);
      if (e.key === 'ArrowRight' && config.gallery.length > 0) {
        setLightboxIdx((prev) =>
          prev === null ? null : (prev + 1) % config.gallery.length
        );
      }
      if (e.key === 'ArrowLeft' && config.gallery.length > 0) {
        setLightboxIdx((prev) =>
          prev === null
            ? null
            : (prev - 1 + config.gallery.length) % config.gallery.length
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIdx, config.gallery.length]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  const handleOpenInvitation = async () => {
    setIsOpened(true);
    if (config.features.showMusic && audioPlayerRef.current) {
      const playing = await audioPlayerRef.current.play();
      setIsPlaying(playing);
    }
  };

  const handleToggleMusic = async () => {
    if (!audioPlayerRef.current) return;
    const playing = await audioPlayerRef.current.toggle();
    setIsPlaying(playing);
  };

  const handleCopyAccount = async (accountNumber: string) => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      showToast('Berhasil disalin');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = accountNumber;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Berhasil disalin');
    }
  };

  const handleSubmitRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNama = nama.trim();
    const cleanUcapan = ucapan.trim();
    if (!cleanNama || !cleanUcapan) return;

    setIsSubmitting(true);
    if (isCloudConnected && invitationId && invitationOwnerId) {
      try {
        await submitWishToDb(invitationId, invitationOwnerId, {
          nama: cleanNama,
          kehadiran,
          jumlah: kehadiran === 'Hadir' ? jumlah : 0,
          ucapan: cleanUcapan,
        });
        setUcapan('');
        showToast('Ucapan & RSVP berhasil dikirim');
      } catch {
        showToast('Gagal mengirim ucapan. Silakan coba lagi.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    window.setTimeout(() => {
      const newWish: GuestWish = {
        id: `wish-${Date.now()}`,
        nama: cleanNama,
        kehadiran,
        jumlah: kehadiran === 'Hadir' ? jumlah : 0,
        ucapan: cleanUcapan,
        createdAt: Date.now(),
      };
      const updated = [newWish, ...wishes];
      setWishes(updated);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage error
      }
      setUcapan('');
      setIsSubmitting(false);
      showToast('Ucapan & RSVP berhasil dikirim');
    }, 200);
  };

  const handleDeleteWish = async (wishId: string) => {
    if (!invitationId) return;
    try {
      await deleteWishFromDb(invitationId, wishId);
      showToast('Ucapan dihapus');
    } catch {
      showToast('Gagal menghapus ucapan');
    }
  };

  const patternClass =
    theme.patternType === 'kawung' || theme.patternType === 'parang'
      ? palette.isDarkCanvas
        ? 'batik-kawung-dark'
        : 'batik-kawung-light'
      : '';

  const videoInfo = resolveEmbedVideoUrl(config.video.src);
  const hadirCount = wishes.filter((w) => w.kehadiran === 'Hadir').length;
  const berhalanganCount = wishes.filter((w) => w.kehadiran === 'Berhalangan').length;

  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    config.coverTitle
  )}&location=${encodeURIComponent(config.events[0]?.venue || 'Jakarta')}`;

  const isModernSans = style === 'modern-asymmetric';
  const headingFontClass = isModernSans ? 'font-sans font-bold tracking-tight' : 'font-serif font-medium';
  const subHeadingFontClass = isModernSans ? 'font-sans font-semibold tracking-tight' : 'font-serif font-semibold';

  const countdownUnits = [
    { label: labels.unitDays, value: countdown.days },
    { label: labels.unitHours, value: countdown.hours },
    { label: labels.unitMinutes, value: countdown.minutes },
    { label: labels.unitSeconds, value: countdown.seconds },
  ];

  // =========================================================================
  // RENDER COVER VARIATIONS (5 Distinct Architectural Covers)
  // =========================================================================
  const renderCover = () => {
    const coverWrapperPos = embedded
      ? 'absolute inset-0 z-30'
      : 'fixed inset-0 z-50';

    // 1. EDITORIAL BROADSHEET: Full-bleed dark-scrim photograph cover
    if (style === 'editorial-broadsheet') {
      return (
        <section
          aria-label="Sampul Undangan"
          className={`${coverWrapperPos} overflow-hidden flex flex-col justify-between text-white`}
          style={{ backgroundColor: '#111111' }}
        >
          <img
            src={config.images.hero}
            alt={config.coverTitle}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/50" />

          <div className="relative z-10 max-w-6xl w-full mx-auto px-6 sm:px-10 pt-8 pb-4 border-b border-white/25 flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.26em]">
            <span>{config.coverKicker}</span>
            <span className="tabular-nums opacity-85">{config.coverDateText}</span>
          </div>

          <div className="relative z-10 max-w-6xl w-full mx-auto px-6 sm:px-10 pb-10 md:pb-14 pt-8 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/75">
                {config.heroKicker}
              </p>
              <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-medium leading-[0.98] tracking-tight">
                {config.coverTitle}
              </h1>
              <p className="text-sm text-white/80 max-w-md leading-relaxed">
                {config.heroSubtitle}
              </p>
            </div>

            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/30 pt-5 md:pt-0 md:pl-7 space-y-4 shrink-0">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">
                  {labels.guestPrefix}
                </p>
                <p className="font-serif text-2xl sm:text-3xl font-semibold text-white mt-1">
                  {guestName}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenInvitation}
                className="w-full min-h-[48px] px-6 py-3 bg-white text-neutral-950 font-semibold text-sm tracking-wide hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
              >
                <MailOpen className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">{labels.openButton}</span>
              </button>
            </div>
          </div>
        </section>
      );
    }

    // 2. MODERN ASYMMETRIC: Crisp Light Split-Screen Cover
    if (style === 'modern-asymmetric') {
      return (
        <section
          aria-label="Sampul Undangan"
          className={`${coverWrapperPos} grid grid-cols-1 lg:grid-cols-12 overflow-hidden`}
          style={{
            backgroundColor: effectiveBgCanvas,
            color: palette.textPrimary,
          }}
        >
          <div className="lg:col-span-6 p-6 sm:p-10 lg:p-14 flex flex-col justify-between order-2 lg:order-1">
            <div className="flex items-center justify-between gap-3">
              <span
                className="text-xs font-sans font-bold uppercase tracking-[0.2em]"
                style={{ color: palette.accent }}
              >
                {config.coverKicker}
              </span>
              <span
                className="text-xs font-medium tabular-nums"
                style={{ color: palette.textMuted }}
              >
                {config.coverDateText}
              </span>
            </div>

            <div className="my-auto py-6 space-y-4">
              <div
                className="w-12 h-1"
                style={{ backgroundColor: palette.accent }}
              />
              <h1 className="font-sans text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.03]">
                {config.coverTitle}
              </h1>
              <p
                className="text-sm sm:text-base max-w-md leading-relaxed"
                style={{ color: palette.textMuted }}
              >
                {config.heroSubtitle}
              </p>

              <div
                className="mt-4 p-4 sm:p-5 rounded-2xl border max-w-md"
                style={{
                  backgroundColor: palette.bgSurface,
                  borderColor: palette.border,
                }}
              >
                <p
                  className="text-[11px] uppercase tracking-[0.18em] font-semibold"
                  style={{ color: palette.accent }}
                >
                  {labels.guestPrefix}
                </p>
                <p className="font-sans text-xl sm:text-2xl font-bold mt-1">
                  {guestName}
                </p>
              </div>
            </div>

            <div className="max-w-md w-full">
              <button
                type="button"
                onClick={handleOpenInvitation}
                className="w-full min-h-[48px] px-7 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] transition-all"
                style={{
                  backgroundColor: palette.bgCover,
                  color: palette.textOnCover,
                }}
              >
                <MailOpen className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">{labels.openButton}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 relative min-h-[34vh] lg:min-h-full order-1 lg:order-2 bg-stone-900">
            <img
              src={config.images.hero}
              alt={config.coverTitle}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        </section>
      );
    }

    // 3. BOTANICAL POSTAGE: Framed Stationery Card inside Soft Mat
    if (style === 'botanical-postage') {
      return (
        <section
          aria-label="Sampul Undangan"
          className={`${coverWrapperPos} p-4 sm:p-8 flex items-center justify-center overflow-y-auto`}
          style={{
            backgroundColor: palette.bgSurface,
            color: palette.textPrimary,
          }}
        >
          <div
            className="w-full max-w-lg rounded-3xl border p-3 sm:p-4 shadow-xl"
            style={{
              backgroundColor: effectiveBgCanvas,
              borderColor: palette.accent,
            }}
          >
            <div
              className="rounded-2xl border border-dashed px-6 py-8 sm:px-10 sm:py-10 flex flex-col items-center text-center space-y-5"
              style={{ borderColor: palette.border }}
            >
              <div style={{ color: palette.accent }}>
                <CategoryCrest
                  category={config.category}
                  frameStyle="botanical"
                  className="w-14 h-16"
                />
              </div>

              <div className="space-y-1.5">
                <p
                  className="text-[11px] uppercase tracking-[0.24em] font-semibold"
                  style={{ color: palette.accent }}
                >
                  {config.coverKicker}
                </p>
                <h1 className="font-serif italic text-4xl sm:text-5xl font-medium leading-tight">
                  {config.coverTitle}
                </h1>
                <p className="text-xs tracking-wider" style={{ color: palette.textMuted }}>
                  {config.coverDateText}
                </p>
              </div>

              <div
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 p-1"
                style={{ borderColor: palette.accent }}
              >
                <img
                  src={config.images.hero}
                  alt={config.coverTitle}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              <div
                className="w-full py-4 px-5 rounded-2xl border"
                style={{
                  backgroundColor: palette.bgSurface,
                  borderColor: palette.border,
                }}
              >
                <p
                  className="text-[11px] uppercase tracking-[0.18em] font-semibold"
                  style={{ color: palette.accent }}
                >
                  {labels.guestPrefix}
                </p>
                <p className="font-serif text-2xl font-semibold mt-1">
                  {guestName}
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenInvitation}
                className="w-full min-h-[48px] px-7 py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: palette.accent,
                  color: '#FFFFFF',
                }}
              >
                <MailOpen className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">{labels.openButton}</span>
              </button>
            </div>
          </div>
        </section>
      );
    }

    // 4. ROYAL MONOGRAM: Dark Monogram Diamond Frame Cover
    if (style === 'royal-monogram') {
      const monogram = getTitleMonogram(config.coverTitle);
      return (
        <section
          aria-label="Sampul Undangan"
          className={`${coverWrapperPos} flex flex-col items-center justify-between p-6 sm:p-10 overflow-hidden`}
          style={{
            backgroundColor: palette.bgCover,
            color: palette.textOnCover,
          }}
        >
          <img
            src={config.images.hero}
            alt={config.coverTitle}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
          <div
            className="absolute inset-4 sm:inset-7 border pointer-events-none"
            style={{ borderColor: `${palette.accentOnCover}40` }}
          />
          <div
            className="absolute inset-6 sm:inset-9 border pointer-events-none"
            style={{ borderColor: `${palette.accentOnCover}20` }}
          />

          <div className="relative z-10 text-center pt-4">
            <p
              className="text-[11px] uppercase tracking-[0.3em] font-medium"
              style={{ color: palette.accentOnCover }}
            >
              {config.coverKicker}
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto my-auto py-4">
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rotate-45 border-2 flex items-center justify-center mb-8"
              style={{
                borderColor: palette.accentOnCover,
                backgroundColor: `${palette.bgCover}E6`,
              }}
            >
              <span
                className="-rotate-45 font-serif text-xl sm:text-2xl font-semibold tracking-wider"
                style={{ color: palette.accentOnCover }}
              >
                {monogram}
              </span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight leading-tight text-white">
              {config.coverTitle}
            </h1>
            <p className="mt-2 text-xs sm:text-sm tracking-[0.2em] uppercase opacity-75">
              {config.coverDateText}
            </p>
          </div>

          <div className="relative z-10 w-full max-w-md mx-auto pb-4 space-y-4 text-center">
            <div
              className="py-4 px-5 border-y"
              style={{ borderColor: `${palette.accentOnCover}45` }}
            >
              <p
                className="text-[11px] uppercase tracking-[0.22em]"
                style={{ color: palette.accentOnCover }}
              >
                {labels.guestPrefix}
              </p>
              <p className="font-serif text-2xl sm:text-3xl font-semibold text-white mt-1">
                {guestName}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenInvitation}
              className="w-full min-h-[48px] px-7 py-3.5 font-semibold text-sm tracking-widest uppercase active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
              style={{
                backgroundColor: palette.accentOnCover,
                color: palette.bgCover,
              }}
            >
              <MailOpen className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">{labels.openButton}</span>
            </button>
          </div>
        </section>
      );
    }

    // 5. CLASSIC ARCH (Default)
    return (
      <section
        aria-label="Sampul Undangan"
        className={`${coverWrapperPos} flex flex-col items-center justify-between px-6 py-10 md:py-14 batik-kawung-dark transition-all duration-700`}
        style={{
          backgroundColor: palette.bgCover,
          color: palette.textOnCover,
        }}
      >
        <div className="text-center space-y-1">
          <p
            className="text-[11px] uppercase tracking-[0.28em] font-medium"
            style={{ color: palette.accentOnCover }}
          >
            {config.coverKicker}
          </p>
          <p className="text-xs opacity-75 tracking-wider">
            {config.coverDateText}
          </p>
        </div>

        <div className="flex flex-col items-center text-center max-w-md w-full mx-auto my-auto py-4">
          <div style={{ color: palette.accentOnCover }}>
            <CategoryCrest
              category={config.category}
              frameStyle={theme.frameStyle}
              className="w-16 h-20 md:w-20 md:h-24 mb-5"
            />
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight leading-tight">
            {config.coverTitle}
          </h1>

          <div
            className="mt-8 w-full bg-white/[0.05] backdrop-blur-sm rounded-2xl px-6 py-5 border"
            style={{ borderColor: `${palette.accentOnCover}4D` }}
          >
            <p
              className="text-[11px] uppercase tracking-[0.2em]"
              style={{ color: palette.accentOnCover }}
            >
              {labels.guestPrefix}
            </p>
            <p className="mt-1.5 font-serif text-2xl sm:text-3xl font-semibold text-white">
              {guestName}
            </p>
            <p className="mt-2 text-xs opacity-80 leading-relaxed">
              {labels.coverInviteNote}
            </p>
          </div>
        </div>

        <div className="w-full max-w-xs text-center">
          <button
            type="button"
            onClick={handleOpenInvitation}
            className="w-full min-h-[48px] px-7 py-3.5 rounded-xl font-semibold text-sm tracking-wide active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2.5 shadow-lg shadow-black/30"
            style={{
              backgroundColor: palette.accentOnCover,
              color: palette.bgCover,
            }}
          >
            <MailOpen className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">{labels.openButton}</span>
          </button>
        </div>
      </section>
    );
  };

  // =========================================================================
  // RENDER HERO VARIATIONS (5 Distinct Architectural Heroes)
  // =========================================================================
  const renderHero = () => {
    // 1. EDITORIAL BROADSHEET HERO
    if (style === 'editorial-broadsheet') {
      return (
        <header
          id="inv-beranda"
          className="border-b"
          style={{
            backgroundColor: effectiveBgCanvas,
            borderColor: palette.border,
          }}
        >
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 md:py-14 space-y-8">
            <div
              className="py-3 border-y flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.22em]"
              style={{ borderColor: palette.border, color: palette.textMuted }}
            >
              <span style={{ color: palette.accent }} className="font-semibold">
                {config.heroKicker}
              </span>
              <span className="tabular-nums">{config.coverDateText}</span>
              <span>{config.events[0]?.venue || 'Indonesia'}</span>
            </div>

            <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-medium text-center leading-[0.98] tracking-tight max-w-3xl mx-auto">
              {config.coverTitle}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start pt-2">
              <div className="lg:col-span-7 space-y-2">
                <div
                  className="aspect-[4/3] overflow-hidden border"
                  style={{
                    borderColor: palette.border,
                    backgroundColor: palette.bgCover,
                  }}
                >
                  <img
                    src={config.images.hero}
                    alt={config.coverTitle}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p
                  className="text-xs font-serif italic"
                  style={{ color: palette.textMuted }}
                >
                  Fig. 01 — {config.coverTitle} · {config.coverDateText}
                </p>
              </div>

              <div className="lg:col-span-5 space-y-6 lg:pt-4">
                <p
                  className="font-serif italic text-xl sm:text-2xl leading-relaxed"
                  style={{ color: palette.textPrimary }}
                >
                  "{config.heroSubtitle}"
                </p>

                {config.features.showCountdown && (
                  <div
                    className="pt-5 border-t space-y-4"
                    style={{ borderColor: palette.border }}
                  >
                    <p
                      className="text-[11px] uppercase tracking-[0.22em]"
                      style={{ color: palette.textMuted }}
                    >
                      {labels.countdownTitle}
                    </p>
                    <div
                      className="grid grid-cols-4 divide-x border-y py-3"
                      style={{
                        borderColor: palette.border,
                      }}
                    >
                      {countdownUnits.map((unit) => (
                        <div key={unit.label} className="text-center px-2">
                          <div className="font-serif text-2xl sm:text-3xl font-semibold tabular-nums">
                            {String(unit.value).padStart(2, '0')}
                          </div>
                          <div
                            className="text-[10px] uppercase tracking-wider mt-0.5"
                            style={{ color: palette.textMuted }}
                          >
                            {unit.label}
                          </div>
                        </div>
                      ))}
                    </div>
                    <a
                      href={googleCalendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 border text-xs sm:text-sm font-medium transition-opacity hover:opacity-80"
                      style={{
                        borderColor: palette.textPrimary,
                        color: palette.textPrimary,
                      }}
                    >
                      <Calendar className="w-4 h-4" />
                      <span className="whitespace-nowrap">{labels.saveCalendar}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      );
    }

    // 2. MODERN ASYMMETRIC HERO
    if (style === 'modern-asymmetric') {
      return (
        <header
          id="inv-beranda"
          className="border-b"
          style={{
            backgroundColor: effectiveBgCanvas,
            borderColor: palette.border,
          }}
        >
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 md:py-14 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-7 space-y-3">
                <span
                  className="inline-block text-xs font-sans font-bold uppercase tracking-[0.2em]"
                  style={{ color: palette.accent }}
                >
                  {config.heroKicker}
                </span>
                <h2 className="font-sans text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.03]">
                  {config.coverTitle}
                </h2>
                <p
                  className="text-sm sm:text-base max-w-xl leading-relaxed"
                  style={{ color: palette.textMuted }}
                >
                  {config.heroSubtitle}
                </p>
              </div>

              {config.features.showCountdown && (
                <div className="lg:col-span-5 space-y-3">
                  <div className="grid grid-cols-4 gap-2">
                    {countdownUnits.map((unit) => (
                      <div
                        key={unit.label}
                        className="rounded-2xl p-3 text-center"
                        style={{
                          backgroundColor: palette.bgCover,
                          color: palette.textOnCover,
                        }}
                      >
                        <div className="font-sans text-xl sm:text-2xl font-bold tabular-nums">
                          {String(unit.value).padStart(2, '0')}
                        </div>
                        <div className="text-[10px] opacity-75 mt-0.5">
                          {unit.label}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-medium" style={{ color: palette.textMuted }}>
                      {config.coverDateText}
                    </span>
                    <a
                      href={googleCalendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-semibold hover:underline"
                      style={{ color: palette.accent }}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{labels.saveCalendar}</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div
              className="relative aspect-[16/9] sm:aspect-[21/10] rounded-3xl overflow-hidden border"
              style={{
                borderColor: palette.border,
                backgroundColor: palette.bgCover,
              }}
            >
              <img
                src={config.images.hero}
                alt={config.coverTitle}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 bg-gradient-to-t from-black/80 via-black/30 to-transparent text-white flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs sm:text-sm font-medium">
                  {config.events[0]?.venue || 'Lokasi Acara'}
                </span>
                <span className="text-xs opacity-85 tabular-nums">
                  {config.events[0]?.time}
                </span>
              </div>
            </div>
          </div>
        </header>
      );
    }

    // 3. BOTANICAL POSTAGE HERO
    if (style === 'botanical-postage') {
      return (
        <header
          id="inv-beranda"
          className="border-b py-12 md:py-16 px-5 sm:px-8"
          style={{
            backgroundColor: palette.bgSurface,
            borderColor: palette.border,
          }}
        >
          <div
            className="max-w-3xl mx-auto rounded-3xl border p-6 sm:p-10 text-center space-y-6"
            style={{
              backgroundColor: effectiveBgCanvas,
              borderColor: palette.accent,
            }}
          >
            <div className="flex justify-center" style={{ color: palette.accent }}>
              <CategoryCrest
                category={config.category}
                frameStyle="botanical"
                className="w-12 h-14"
              />
            </div>

            <div className="space-y-2">
              <p
                className="text-xs uppercase tracking-[0.24em] font-semibold"
                style={{ color: palette.accent }}
              >
                {config.heroKicker}
              </p>
              <h2 className="font-serif italic text-4xl sm:text-5xl font-medium">
                {config.coverTitle}
              </h2>
              <p className="text-xs sm:text-sm" style={{ color: palette.textMuted }}>
                {config.coverDateText} · {config.events[0]?.venue}
              </p>
            </div>

            <div
              className="max-w-xs mx-auto aspect-[4/5] rounded-[40px] overflow-hidden border-2 p-1.5"
              style={{ borderColor: palette.accent }}
            >
              <img
                src={config.images.hero}
                alt={config.coverTitle}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-[34px]"
              />
            </div>

            <p
              className="font-serif italic text-lg max-w-md mx-auto leading-relaxed"
              style={{ color: palette.textMuted }}
            >
              "{config.heroSubtitle}"
            </p>

            {config.features.showCountdown && (
              <div className="pt-2 space-y-4">
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                  {countdownUnits.map((unit) => (
                    <div
                      key={unit.label}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border flex flex-col items-center justify-center"
                      style={{
                        backgroundColor: palette.bgSurface,
                        borderColor: palette.accent,
                      }}
                    >
                      <span className="font-serif text-xl sm:text-2xl font-semibold tabular-nums leading-none">
                        {String(unit.value).padStart(2, '0')}
                      </span>
                      <span
                        className="text-[10px] mt-1"
                        style={{ color: palette.textMuted }}
                      >
                        {unit.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div>
                  <a
                    href={googleCalendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 min-h-[44px] px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: palette.accent }}
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="whitespace-nowrap">{labels.saveCalendar}</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </header>
      );
    }

    // 4. ROYAL MONOGRAM HERO (Atmospheric dark panorama + overlapping floating countdown bar)
    if (style === 'royal-monogram') {
      return (
        <header id="inv-beranda" className="relative">
          <div
            className="relative py-20 md:py-28 px-5 sm:px-8 overflow-hidden text-center"
            style={{
              backgroundColor: palette.bgCover,
              color: palette.textOnCover,
            }}
          >
            <img
              src={config.images.hero}
              alt={config.coverTitle}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/80" />

            <div className="relative z-10 max-w-3xl mx-auto space-y-4">
              <p
                className="text-xs uppercase tracking-[0.28em] font-semibold"
                style={{ color: palette.accentOnCover }}
              >
                {config.heroKicker}
              </p>
              <h2 className="font-serif text-4xl sm:text-6xl font-medium text-white leading-[1.06]">
                {config.coverTitle}
              </h2>
              <p className="font-serif italic text-lg sm:text-xl text-stone-200 max-w-xl mx-auto leading-relaxed">
                "{config.heroSubtitle}"
              </p>
              <p
                className="text-xs sm:text-sm tracking-[0.2em] uppercase pt-2"
                style={{ color: palette.accentOnCover }}
              >
                {config.coverDateText} · {config.events[0]?.venue}
              </p>
            </div>
          </div>

          {config.features.showCountdown && (
            <div className="max-w-3xl mx-auto px-5 sm:px-8 -mt-10 relative z-20">
              <div
                className="rounded-2xl border p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5"
                style={{
                  backgroundColor: effectiveBgCanvas,
                  borderColor: palette.accent,
                }}
              >
                <div className="grid grid-cols-4 gap-4 sm:gap-6 flex-1 w-full">
                  {countdownUnits.map((unit) => (
                    <div key={unit.label} className="text-center">
                      <div className="font-serif text-2xl sm:text-3xl font-semibold tabular-nums">
                        {String(unit.value).padStart(2, '0')}
                      </div>
                      <div
                        className="text-[11px] mt-0.5"
                        style={{ color: palette.textMuted }}
                      >
                        {unit.label}
                      </div>
                    </div>
                  ))}
                </div>
                <a
                  href={googleCalendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
                  style={{
                    backgroundColor: palette.bgCover,
                    color: palette.textOnCover,
                  }}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="whitespace-nowrap">{labels.saveCalendar}</span>
                </a>
              </div>
            </div>
          )}
        </header>
      );
    }

    // 5. CLASSIC ARCH HERO (Default)
    return (
      <header
        id="inv-beranda"
        className={`relative border-b ${patternClass}`}
        style={{
          backgroundColor: effectiveBgCanvas,
          borderColor: palette.border,
        }}
      >
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 text-center lg:text-left space-y-5">
            <p
              className="text-xs uppercase tracking-[0.26em] font-semibold"
              style={{ color: palette.accent }}
            >
              {config.heroKicker}
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.06]">
              {config.coverTitle}
            </h2>
            <p
              className="font-serif italic text-lg sm:text-xl leading-relaxed max-w-lg mx-auto lg:mx-0"
              style={{ color: palette.textMuted }}
            >
              "{config.heroSubtitle}"
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-2.5 text-xs sm:text-sm font-medium justify-center lg:justify-start">
              <span>{config.coverDateText}</span>
              <span aria-hidden="true" style={{ color: palette.accent }}>
                ·
              </span>
              <span>{config.events[0]?.venue || 'Indonesia'}</span>
            </div>

            {config.features.showCountdown && (
              <div className="pt-4">
                <p
                  className="text-[11px] uppercase tracking-[0.22em] mb-3"
                  style={{ color: palette.textMuted }}
                >
                  {labels.countdownTitle}
                </p>
                <div className="grid grid-cols-4 gap-2.5 sm:gap-3 max-w-md mx-auto lg:mx-0">
                  {countdownUnits.map((unit) => (
                    <div
                      key={unit.label}
                      className="rounded-xl py-3 px-2 text-center border"
                      style={{
                        backgroundColor: palette.bgSurface,
                        borderColor: palette.border,
                      }}
                    >
                      <div className="font-serif text-2xl sm:text-3xl font-semibold tabular-nums">
                        {String(unit.value).padStart(2, '0')}
                      </div>
                      <div
                        className="text-[11px] mt-0.5"
                        style={{ color: palette.textMuted }}
                      >
                        {unit.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex justify-center lg:justify-start">
                  <a
                    href={googleCalendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-opacity hover:opacity-85"
                    style={{
                      borderColor: palette.accent,
                      backgroundColor: palette.bgSurface,
                    }}
                  >
                    <Calendar className="w-4 h-4" style={{ color: palette.accent }} />
                    <span className="whitespace-nowrap">{labels.saveCalendar}</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full max-w-sm mx-auto">
              <div
                className="aspect-[3/4] overflow-hidden border shadow-xl rounded-t-full rounded-b-2xl"
                style={{
                  borderColor: palette.accent,
                  backgroundColor: palette.bgCover,
                }}
              >
                <img
                  src={config.images.hero}
                  alt={config.coverTitle}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  };

  // =========================================================================
  // RENDER PROFILE SECTION
  // =========================================================================
  const renderProfiles = () => {
    const couplePeople = [
      {
        role: labels.brideRole,
        full: config.couple.brideFull,
        parents: config.couple.brideParents,
        origin: config.couple.brideOrigin,
        img: config.images.bride,
      },
      {
        role: labels.groomRole,
        full: config.couple.groomFull,
        parents: config.couple.groomParents,
        origin: config.couple.groomOrigin,
        img: config.images.groom,
      },
    ];

    // EDITORIAL BROADSHEET: Alternating unboxed editorial rows with hairlines
    if (style === 'editorial-broadsheet') {
      return (
        <section id="inv-mempelai" className="py-16 md:py-20 px-5 sm:px-8 max-w-5xl mx-auto">
          <div
            className="pb-8 mb-10 border-b flex flex-col md:flex-row md:items-end justify-between gap-4"
            style={{ borderColor: palette.border }}
          >
            <div>
              <p
                className="text-xs uppercase tracking-[0.24em] font-semibold"
                style={{ color: palette.accent }}
              >
                {config.openingGreeting}
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-medium mt-2">
                {labels.profileSectionTitle}
              </h2>
            </div>
            <p
              className="text-sm leading-relaxed max-w-md"
              style={{ color: palette.textMuted }}
            >
              {config.openingIntro}
            </p>
          </div>

          {config.category === 'pernikahan' ? (
            <div className="divide-y" style={{ borderColor: palette.border }}>
              {couplePeople.map((person, idx) => (
                <article
                  key={person.role}
                  className="py-8 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center"
                >
                  <div
                    className={`md:col-span-4 ${
                      idx === 1 ? 'md:order-2' : 'md:order-1'
                    }`}
                  >
                    <div
                      className="aspect-[4/5] max-w-[240px] overflow-hidden border"
                      style={{ borderColor: palette.border }}
                    >
                      <img
                        src={person.img}
                        alt={person.full}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div
                    className={`md:col-span-8 space-y-2.5 ${
                      idx === 1 ? 'md:order-1 md:text-right' : 'md:order-2'
                    }`}
                  >
                    <p
                      className="text-xs uppercase tracking-[0.22em] font-semibold"
                      style={{ color: palette.accent }}
                    >
                      0{idx + 1} · {person.role}
                    </p>
                    <h3 className="font-serif text-3xl sm:text-4xl font-medium">
                      {person.full}
                    </h3>
                    <p
                      className="text-sm sm:text-base leading-relaxed max-w-lg inline-block"
                      style={{ color: palette.textMuted }}
                    >
                      {person.parents}
                    </p>
                    <p className="text-xs uppercase tracking-widest opacity-75">
                      {person.origin}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <article className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-5">
                <div
                  className="aspect-[4/5] max-w-xs mx-auto md:mx-0 overflow-hidden border"
                  style={{ borderColor: palette.border }}
                >
                  <img
                    src={config.images.hero}
                    alt={config.primaryPerson.fullName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="md:col-span-7 space-y-3">
                <p
                  className="text-xs uppercase tracking-[0.22em] font-semibold"
                  style={{ color: palette.accent }}
                >
                  {config.primaryPerson.roleLabel}
                </p>
                <h3 className="font-serif text-3xl sm:text-4xl font-medium">
                  {config.primaryPerson.fullName}
                </h3>
                {config.primaryPerson.subBadge && (
                  <p className="text-sm font-medium" style={{ color: palette.accent }}>
                    {config.primaryPerson.subBadge}
                  </p>
                )}
                <p
                  className="text-sm sm:text-base leading-relaxed"
                  style={{ color: palette.textMuted }}
                >
                  {config.primaryPerson.parentsOrHost}
                </p>
                <p className="text-xs uppercase tracking-widest opacity-75">
                  {config.primaryPerson.origin}
                </p>
              </div>
            </article>
          )}
        </section>
      );
    }

    // MODERN ASYMMETRIC: Sleek horizontal cards with side square photo & bold sans-serif
    if (style === 'modern-asymmetric') {
      return (
        <section id="inv-mempelai" className="py-16 md:py-20 px-5 sm:px-8 max-w-5xl mx-auto">
          <div className="max-w-2xl mb-10 space-y-2">
            <p
              className="text-xs font-sans font-bold uppercase tracking-[0.2em]"
              style={{ color: palette.accent }}
            >
              {config.openingGreeting}
            </p>
            <h2 className={`${headingFontClass} text-3xl sm:text-4xl`}>
              {labels.profileSectionTitle}
            </h2>
            <p className="text-sm sm:text-base leading-relaxed" style={{ color: palette.textMuted }}>
              {config.openingIntro}
            </p>
          </div>

          {config.category === 'pernikahan' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {couplePeople.map((person) => (
                <article
                  key={person.role}
                  className="rounded-3xl p-5 sm:p-6 border flex flex-col sm:flex-row items-start sm:items-center gap-5"
                  style={{
                    backgroundColor: palette.bgSurface,
                    borderColor: palette.border,
                  }}
                >
                  <div className="w-24 h-28 sm:w-28 sm:h-36 rounded-2xl overflow-hidden shrink-0 bg-stone-900">
                    <img
                      src={person.img}
                      alt={person.full}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <p
                      className="text-[11px] font-sans font-bold uppercase tracking-[0.18em]"
                      style={{ color: palette.accent }}
                    >
                      {person.role}
                    </p>
                    <h3 className={`${subHeadingFontClass} text-xl sm:text-2xl leading-snug`}>
                      {person.full}
                    </h3>
                    <p className="text-xs sm:text-sm leading-relaxed" style={{ color: palette.textMuted }}>
                      {person.parents}
                    </p>
                    <p className="text-xs font-medium opacity-75">{person.origin}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <article
              className="rounded-3xl p-6 sm:p-8 border flex flex-col sm:flex-row items-center gap-6 sm:gap-8"
              style={{
                backgroundColor: palette.bgSurface,
                borderColor: palette.border,
              }}
            >
              <div className="w-36 h-44 sm:w-44 sm:h-52 rounded-2xl overflow-hidden shrink-0 bg-stone-900">
                <img
                  src={config.images.hero}
                  alt={config.primaryPerson.fullName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <p
                  className="text-xs font-sans font-bold uppercase tracking-[0.2em]"
                  style={{ color: palette.accent }}
                >
                  {config.primaryPerson.roleLabel}
                </p>
                <h3 className={`${subHeadingFontClass} text-2xl sm:text-3xl`}>
                  {config.primaryPerson.fullName}
                </h3>
                {config.primaryPerson.subBadge && (
                  <p className="text-sm font-semibold" style={{ color: palette.accent }}>
                    {config.primaryPerson.subBadge}
                  </p>
                )}
                <p className="text-sm leading-relaxed max-w-lg" style={{ color: palette.textMuted }}>
                  {config.primaryPerson.parentsOrHost}
                </p>
                <p className="text-xs font-medium opacity-75">{config.primaryPerson.origin}</p>
              </div>
            </article>
          )}
        </section>
      );
    }

    // CLASSIC ARCH / BOTANICAL POSTAGE / ROYAL MONOGRAM PROFILES
    const isBotanical = style === 'botanical-postage';
    const isRoyal = style === 'royal-monogram';
    const portraitShape = isBotanical
      ? 'rounded-full w-44 h-44'
      : isRoyal
      ? 'rounded-xl w-44 h-52'
      : 'rounded-t-full rounded-b-xl w-44 h-56';

    return (
      <section id="inv-mempelai" className="py-16 md:py-20 px-5 sm:px-8 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p
            className="text-xs uppercase tracking-[0.24em] font-semibold"
            style={{ color: palette.accent }}
          >
            {config.openingGreeting}
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium mt-3">
            {labels.profileSectionTitle}
          </h2>
          <p
            className="mt-3 text-sm sm:text-base leading-relaxed"
            style={{ color: palette.textMuted }}
          >
            {config.openingIntro}
          </p>
        </div>

        {config.category === 'pernikahan' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-stretch">
            {couplePeople.map((person) => (
              <article
                key={person.role}
                className={`rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center border ${
                  isBotanical ? 'border-dashed' : ''
                }`}
                style={{
                  backgroundColor: isRoyal ? palette.bgCover : palette.bgSurface,
                  borderColor: isRoyal ? palette.accentOnCover : palette.border,
                  color: isRoyal ? palette.textOnCover : palette.textPrimary,
                }}
              >
                <div
                  className={`overflow-hidden border mb-6 ${portraitShape}`}
                  style={{
                    borderColor: isRoyal ? palette.accentOnCover : palette.accent,
                    backgroundColor: palette.bgCover,
                  }}
                >
                  <img
                    src={person.img}
                    alt={person.full}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p
                  className="text-xs uppercase tracking-[0.2em] font-semibold"
                  style={{ color: isRoyal ? palette.accentOnCover : palette.accent }}
                >
                  {person.role}
                </p>
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold mt-2">
                  {person.full}
                </h3>
                <p
                  className="mt-3 text-sm leading-relaxed max-w-sm"
                  style={{ color: isRoyal ? 'rgba(255,255,255,0.78)' : palette.textMuted }}
                >
                  {person.parents}
                </p>
                <p className="mt-2 text-xs opacity-75">{person.origin}</p>
              </article>
            ))}
          </div>
        ) : (
          <article
            className={`max-w-xl mx-auto rounded-2xl p-7 sm:p-10 flex flex-col items-center text-center border ${
              isBotanical ? 'border-dashed' : ''
            }`}
            style={{
              backgroundColor: isRoyal ? palette.bgCover : palette.bgSurface,
              borderColor: isRoyal ? palette.accentOnCover : palette.border,
              color: isRoyal ? palette.textOnCover : palette.textPrimary,
            }}
          >
            <div
              className={`overflow-hidden border mb-6 ${portraitShape}`}
              style={{
                borderColor: isRoyal ? palette.accentOnCover : palette.accent,
                backgroundColor: palette.bgCover,
              }}
            >
              <img
                src={config.images.hero}
                alt={config.primaryPerson.fullName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <p
              className="text-xs uppercase tracking-[0.2em] font-semibold"
              style={{ color: isRoyal ? palette.accentOnCover : palette.accent }}
            >
              {config.primaryPerson.roleLabel}
            </p>
            <h3 className="font-serif text-3xl sm:text-4xl font-semibold mt-2">
              {config.primaryPerson.fullName}
            </h3>
            {config.primaryPerson.subBadge && (
              <p
                className="mt-1.5 text-sm font-medium"
                style={{ color: isRoyal ? palette.accentOnCover : palette.accent }}
              >
                {config.primaryPerson.subBadge}
              </p>
            )}
            <p
              className="mt-3 text-sm leading-relaxed max-w-md"
              style={{ color: isRoyal ? 'rgba(255,255,255,0.78)' : palette.textMuted }}
            >
              {config.primaryPerson.parentsOrHost}
            </p>
            <p className="mt-2 text-xs opacity-75">{config.primaryPerson.origin}</p>
          </article>
        )}
      </section>
    );
  };

  // =========================================================================
  // RENDER EVENTS SECTION (5 Distinct Schedule Layouts)
  // =========================================================================
  const renderEvents = () => {
    // 1. EDITORIAL BROADSHEET: Light architectural timetable with large tabular hours
    if (style === 'editorial-broadsheet') {
      return (
        <section
          id="inv-acara"
          className="py-16 md:py-20 px-5 sm:px-8 border-y"
          style={{
            backgroundColor: palette.bgSurface,
            borderColor: palette.border,
          }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p
                  className="text-xs uppercase tracking-[0.24em] font-semibold"
                  style={{ color: palette.accent }}
                >
                  {labels.eventsKicker}
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl font-medium mt-2">
                  {labels.eventsTitle}
                </h2>
              </div>
            </div>

            <div className="border-t divide-y" style={{ borderColor: palette.border }}>
              {config.events.map((ev, index) => (
                <article
                  key={ev.id}
                  className="py-7 grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-8 items-start"
                >
                  <div className="md:col-span-4 space-y-1">
                    <p
                      className="text-xs uppercase tracking-[0.2em] font-semibold"
                      style={{ color: palette.accent }}
                    >
                      0{index + 1} · {ev.subTitle}
                    </p>
                    <p className="font-serif text-2xl sm:text-3xl font-semibold tabular-nums">
                      {ev.time}
                    </p>
                    <p className="text-xs" style={{ color: palette.textMuted }}>
                      {ev.dayDate}
                    </p>
                  </div>

                  <div className="md:col-span-5 space-y-1.5">
                    <h3 className="font-serif text-2xl font-medium">{ev.title}</h3>
                    <p className="text-sm font-semibold">{ev.venue}</p>
                    <p className="text-xs leading-relaxed" style={{ color: palette.textMuted }}>
                      {ev.address}
                    </p>
                    <p className="text-xs pt-1" style={{ color: palette.accent }}>
                      {labels.fieldDressCode}: {ev.dressCode}
                    </p>
                  </div>

                  <div className="md:col-span-3 md:text-right">
                    <a
                      href={ev.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 border text-xs font-semibold transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: palette.bgCover,
                        color: palette.textOnCover,
                        borderColor: palette.bgCover,
                      }}
                    >
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="whitespace-nowrap">{labels.openMaps}</span>
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      );
    }

    // 2. MODERN ASYMMETRIC: Numbered Step Timeline Cards
    if (style === 'modern-asymmetric') {
      return (
        <section
          id="inv-acara"
          className="py-16 md:py-20 px-5 sm:px-8 border-y"
          style={{
            backgroundColor: palette.bgSurface,
            borderColor: palette.border,
          }}
        >
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-2">
              <p
                className="text-xs font-sans font-bold uppercase tracking-[0.2em]"
                style={{ color: palette.accent }}
              >
                {labels.eventsKicker}
              </p>
              <h2 className={`${headingFontClass} text-3xl sm:text-4xl`}>
                {labels.eventsTitle}
              </h2>
            </div>

            <div className="space-y-5">
              {config.events.map((ev, index) => (
                <article
                  key={ev.id}
                  className="rounded-3xl p-6 sm:p-7 border flex flex-col md:flex-row md:items-center justify-between gap-6"
                  style={{
                    backgroundColor: effectiveBgCanvas,
                    borderColor: palette.border,
                  }}
                >
                  <div className="flex items-start gap-4 sm:gap-5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-sans font-bold text-base tabular-nums shrink-0"
                      style={{
                        backgroundColor: palette.bgCover,
                        color: palette.textOnCover,
                      }}
                    >
                      0{index + 1}
                    </div>
                    <div className="space-y-1.5">
                      <p
                        className="text-xs font-sans font-bold uppercase tracking-[0.16em]"
                        style={{ color: palette.accent }}
                      >
                        {ev.subTitle} · {ev.dayDate}
                      </p>
                      <h3 className={`${subHeadingFontClass} text-2xl`}>
                        {ev.title}
                      </h3>
                      <p className="text-sm font-medium tabular-nums">
                        {ev.time} — {ev.venue}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: palette.textMuted }}>
                        {ev.address} · {labels.fieldDressCode}: {ev.dressCode}
                      </p>
                    </div>
                  </div>

                  <a
                    href={ev.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] px-5 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shrink-0 transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: palette.accent,
                      color: '#FFFFFF',
                    }}
                  >
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">{labels.openMaps}</span>
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>
      );
    }

    // 3. BOTANICAL POSTAGE: Soft stationery dashed-insert cards
    if (style === 'botanical-postage') {
      return (
        <section
          id="inv-acara"
          className="py-16 md:py-20 px-5 sm:px-8 border-y"
          style={{
            backgroundColor: palette.bgSurface,
            borderColor: palette.border,
          }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-12">
              <p
                className="text-xs uppercase tracking-[0.24em] font-semibold"
                style={{ color: palette.accent }}
              >
                {labels.eventsKicker}
              </p>
              <h2 className="font-serif italic text-3xl sm:text-4xl font-medium mt-2">
                {labels.eventsTitle}
              </h2>
            </div>

            <div
              className={`grid grid-cols-1 ${
                config.events.length > 1 ? 'md:grid-cols-2' : 'max-w-xl mx-auto'
              } gap-6 items-stretch`}
            >
              {config.events.map((ev) => (
                <article
                  key={ev.id}
                  className="rounded-3xl p-3 border"
                  style={{
                    backgroundColor: effectiveBgCanvas,
                    borderColor: palette.accent,
                  }}
                >
                  <div
                    className="h-full rounded-2xl border border-dashed p-6 sm:p-7 flex flex-col justify-between text-center"
                    style={{ borderColor: palette.border }}
                  >
                    <div className="space-y-3">
                      <p
                        className="text-xs uppercase tracking-[0.2em] font-semibold"
                        style={{ color: palette.accent }}
                      >
                        {ev.subTitle}
                      </p>
                      <h3 className="font-serif italic text-3xl font-medium">
                        {ev.title}
                      </h3>
                      <div
                        className="border-y border-dashed py-3 space-y-1 text-sm"
                        style={{ borderColor: palette.border }}
                      >
                        <p className="font-semibold">{ev.dayDate}</p>
                        <p className="tabular-nums" style={{ color: palette.accent }}>
                          {ev.time}
                        </p>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold">{ev.venue}</p>
                        <p className="text-xs leading-relaxed" style={{ color: palette.textMuted }}>
                          {ev.address}
                        </p>
                        <p className="text-xs pt-1" style={{ color: palette.textMuted }}>
                          {labels.fieldDressCode}: {ev.dressCode}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <a
                        href={ev.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full min-h-[44px] px-5 py-2.5 rounded-full font-semibold text-sm inline-flex items-center justify-center gap-2 text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: palette.accent }}
                      >
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="whitespace-nowrap">{labels.openMaps}</span>
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      );
    }

    // 4 & 5. CLASSIC ARCH & ROYAL MONOGRAM (Dark contrast section)
    const isRoyal = style === 'royal-monogram';
    return (
      <section
        id="inv-acara"
        className="batik-kawung-dark py-16 md:py-20 px-5 sm:px-8"
        style={{
          backgroundColor: palette.bgCover,
          color: palette.textOnCover,
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <p
              className="text-xs uppercase tracking-[0.24em] font-semibold"
              style={{ color: palette.accentOnCover }}
            >
              {labels.eventsKicker}
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-white mt-2">
              {labels.eventsTitle}
            </h2>
          </div>

          <div
            className={`grid grid-cols-1 ${
              config.events.length > 1 ? 'md:grid-cols-2' : 'max-w-xl mx-auto'
            } ${
              isRoyal
                ? 'border divide-y md:divide-y-0 md:divide-x'
                : 'gap-6 lg:gap-8'
            } items-stretch`}
            style={isRoyal ? { borderColor: `${palette.accentOnCover}40` } : undefined}
          >
            {config.events.map((ev, index) => (
              <article
                key={ev.id}
                className={
                  isRoyal
                    ? 'p-7 sm:p-10 flex flex-col justify-between text-center'
                    : 'bg-white/[0.05] border rounded-2xl p-6 sm:p-8 flex flex-col justify-between'
                }
                style={{
                  borderColor: `${palette.accentOnCover}40`,
                }}
              >
                <div>
                  <p
                    className="text-xs uppercase tracking-[0.2em] font-medium"
                    style={{ color: palette.accentOnCover }}
                  >
                    {ev.subTitle}
                  </p>
                  <h3 className="font-serif text-3xl font-medium text-white mt-1.5">
                    {ev.title}
                  </h3>
                  <div
                    className="h-px my-5"
                    style={{ backgroundColor: `${palette.accentOnCover}33` }}
                  />
                  <dl className="space-y-3.5 text-sm">
                    <div>
                      <dt className="text-xs opacity-65">{labels.fieldDate}</dt>
                      <dd className="font-medium mt-0.5">{ev.dayDate}</dd>
                    </div>
                    <div>
                      <dt className="text-xs opacity-65">{labels.fieldTime}</dt>
                      <dd className="font-medium mt-0.5 tabular-nums">{ev.time}</dd>
                    </div>
                    <div>
                      <dt className="text-xs opacity-65">{labels.fieldVenue}</dt>
                      <dd className="font-medium mt-0.5">{ev.venue}</dd>
                      <dd className="opacity-80 text-xs mt-1 leading-relaxed">
                        {ev.address}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs opacity-65">{labels.fieldDressCode}</dt>
                      <dd className="opacity-90 text-xs mt-0.5">{ev.dressCode}</dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-7">
                  <a
                    href={ev.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full min-h-[44px] px-5 py-3 font-semibold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 ${
                      isRoyal ? 'rounded-none' : 'rounded-xl'
                    }`}
                    style={
                      index === 0 || isRoyal
                        ? {
                            backgroundColor: palette.accentOnCover,
                            color: palette.bgCover,
                          }
                        : {
                            border: `1px solid ${palette.accentOnCover}`,
                            color: palette.accentOnCover,
                          }
                    }
                  >
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">{labels.openMaps}</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // =========================================================================
  // RENDER GALLERY SECTION (5 Distinct Gallery Variations)
  // =========================================================================
  const renderGallery = () => {
    if (!config.features.showGallery || config.gallery.length === 0) return null;

    return (
      <section id="inv-galeri" className="py-16 md:py-20 px-5 sm:px-8 max-w-5xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-12">
          <p
            className="text-xs uppercase tracking-[0.24em] font-semibold"
            style={{ color: palette.accent }}
          >
            {labels.galleryKicker}
          </p>
          <h2 className={`${headingFontClass} text-3xl sm:text-4xl mt-2`}>
            {labels.galleryTitle}
          </h2>
          <p className="mt-2 text-sm" style={{ color: palette.textMuted }}>
            {labels.galleryHint}
          </p>
        </div>

        {/* 1. EDITORIAL BROADSHEET GALLERY: Sharp corners + Figure captions below */}
        {style === 'editorial-broadsheet' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {config.gallery.map((photo, index) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setLightboxIdx(index)}
                className="group text-left space-y-2.5"
              >
                <div
                  className="aspect-[4/5] overflow-hidden border"
                  style={{
                    borderColor: palette.border,
                    backgroundColor: palette.bgCover,
                  }}
                >
                  <img
                    src={photo.src}
                    alt={photo.caption}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <p
                  className="text-xs font-serif italic"
                  style={{ color: palette.textMuted }}
                >
                  <span className="font-mono not-italic mr-1.5" style={{ color: palette.accent }}>
                    0{index + 1} /
                  </span>
                  {photo.caption}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* 2. MODERN ASYMMETRIC GALLERY: Bento Mosaic */}
        {style === 'modern-asymmetric' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 auto-rows-[180px] sm:auto-rows-[220px]">
            {config.gallery.map((photo, index) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setLightboxIdx(index)}
                className={`group relative overflow-hidden rounded-3xl border text-left ${
                  index === 0 && config.gallery.length >= 2
                    ? 'col-span-2 md:col-span-2 md:row-span-2'
                    : ''
                }`}
                style={{
                  borderColor: palette.border,
                  backgroundColor: palette.bgCover,
                }}
              >
                <img
                  src={photo.src}
                  alt={photo.caption}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-x-0 bottom-0 p-3.5 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                  <p className="text-xs text-white font-medium line-clamp-1">
                    {photo.caption}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 3. BOTANICAL POSTAGE GALLERY: Polaroid / Art-Print Mat Cards */}
        {style === 'botanical-postage' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {config.gallery.map((photo, index) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setLightboxIdx(index)}
                className="group p-3 pb-5 rounded-2xl border shadow-sm text-center transition-transform duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: palette.border,
                }}
              >
                <div className="aspect-[4/4] rounded-xl overflow-hidden bg-stone-100">
                  <img
                    src={photo.src}
                    alt={photo.caption}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <p
                  className="mt-3 font-serif italic text-sm px-2"
                  style={{ color: '#241C16' }}
                >
                  {photo.caption}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* 4. ROYAL MONOGRAM GALLERY: Wide Cinema Lead + Thumbnail Strip */}
        {style === 'royal-monogram' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setLightboxIdx(0)}
              className="group relative w-full aspect-[16/9] overflow-hidden border text-left block"
              style={{
                borderColor: palette.accent,
                backgroundColor: palette.bgCover,
              }}
            >
              <img
                src={config.gallery[0].src}
                alt={config.gallery[0].caption}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/85 via-black/30 to-transparent">
                <p className="font-serif text-lg sm:text-xl text-white">
                  {config.gallery[0].caption}
                </p>
              </div>
            </button>

            {config.gallery.length > 1 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {config.gallery.slice(1).map((photo, offsetIdx) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setLightboxIdx(offsetIdx + 1)}
                    className="group relative aspect-square overflow-hidden border text-left"
                    style={{
                      borderColor: palette.border,
                      backgroundColor: palette.bgCover,
                    }}
                  >
                    <img
                      src={photo.src}
                      alt={photo.caption}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                      <p className="text-[11px] text-stone-100 line-clamp-1">
                        {photo.caption}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. CLASSIC ARCH GALLERY */}
        {style === 'classic-arch' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
            {config.gallery.map((photo, index) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setLightboxIdx(index)}
                className={`group relative overflow-hidden rounded-xl border text-left ${
                  index === 1 && config.gallery.length >= 3
                    ? 'col-span-2 md:col-span-1 aspect-[4/3] md:aspect-[4/5]'
                    : 'aspect-[4/5]'
                }`}
                style={{
                  borderColor: palette.border,
                  backgroundColor: palette.bgCover,
                }}
              >
                <img
                  src={photo.src}
                  alt={photo.caption}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/35 to-transparent">
                  <p className="text-[11px] sm:text-xs text-stone-100 leading-snug line-clamp-2">
                    {photo.caption}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div
      className="relative min-h-full transition-colors duration-300"
      style={{
        backgroundColor: effectiveBgCanvas,
        color: palette.textPrimary,
      }}
    >
      {/* COVER PEMBUKA */}
      {!isOpened && renderCover()}

      {/* KONTEN UTAMA UNDANGAN */}
      <div className={embedded ? 'pb-10' : 'pb-24 md:pb-12'}>
        {renderHero()}

        {renderProfiles()}

        {config.features.showQuote && (
          <div className="px-5 sm:px-8 max-w-5xl mx-auto">
            <blockquote
              className="mb-14 max-w-2xl mx-auto text-center py-8 border-y"
              style={{ borderColor: palette.border }}
            >
              <p className="font-serif italic text-xl sm:text-2xl leading-relaxed">
                "{config.quoteText}"
              </p>
              <footer
                className="mt-3 text-xs uppercase tracking-[0.2em] font-semibold"
                style={{ color: palette.accent }}
              >
                {config.quoteSource}
              </footer>
            </blockquote>
          </div>
        )}

        {renderEvents()}

        {renderGallery()}

        {/* VIDEO MOMEN */}
        {config.features.showVideo && (
          <section id="inv-video" className="py-12 md:py-16 px-5 sm:px-8 max-w-4xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-8">
              <p
                className="text-xs uppercase tracking-[0.24em] font-semibold"
                style={{ color: palette.accent }}
              >
                {labels.videoKicker}
              </p>
              <h2 className={`${headingFontClass} text-3xl sm:text-4xl mt-2`}>
                {labels.videoTitle}
              </h2>
              {config.video.caption && (
                <p className="mt-2 text-sm" style={{ color: palette.textMuted }}>
                  {config.video.caption}
                </p>
              )}
            </div>

            <div
              className={`aspect-video overflow-hidden border flex items-center justify-center ${
                style === 'editorial-broadsheet' || style === 'royal-monogram'
                  ? 'rounded-none'
                  : 'rounded-2xl'
              }`}
              style={{
                backgroundColor: palette.bgCover,
                borderColor: palette.border,
              }}
            >
              {videoInfo.kind === 'iframe' && (
                <iframe
                  src={videoInfo.src}
                  title={config.video.caption || labels.videoTitle}
                  className="w-full h-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              )}
              {videoInfo.kind === 'video' && (
                <video
                  src={videoInfo.src}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}
              {videoInfo.kind === 'none' && (
                <div className="text-center px-6 py-10 text-stone-300 space-y-2">
                  <Film className="w-9 h-9 mx-auto opacity-75" />
                  <p className="font-serif text-xl text-white">
                    {labels.videoTitle}
                  </p>
                  <p className="text-xs opacity-75 max-w-sm mx-auto">
                    Tambahkan tautan YouTube, Google Drive, atau unggah video MP4 melalui menu Edit Undangan.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        <div style={{ color: palette.accent }}>
          <JavaneseDivider className="max-w-md mx-auto px-6 my-4" />
        </div>

        {/* BUKU TAMU & RSVP */}
        {config.features.showRsvp && (
          <section id="inv-ucapan" className="py-16 md:py-20 px-5 sm:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="text-center max-w-xl mx-auto mb-12">
                <p
                  className="text-xs uppercase tracking-[0.24em] font-semibold"
                  style={{ color: palette.accent }}
                >
                  {labels.rsvpKicker}
                </p>
                <h2 className={`${headingFontClass} text-3xl sm:text-4xl mt-2`}>
                  {labels.rsvpTitle}
                </h2>
                <div
                  className="mt-4 flex items-center justify-center gap-3 text-xs sm:text-sm tabular-nums"
                  style={{ color: palette.textMuted }}
                >
                  <span>
                    <strong className="font-semibold" style={{ color: palette.textPrimary }}>
                      {hadirCount}
                    </strong>{' '}
                    {labels.rsvpCountPresent}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    <strong className="font-semibold" style={{ color: palette.textPrimary }}>
                      {berhalanganCount}
                    </strong>{' '}
                    {labels.rsvpCountAbsent}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    <strong className="font-semibold" style={{ color: palette.textPrimary }}>
                      {wishes.length}
                    </strong>{' '}
                    {labels.rsvpCountTotal}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                <form
                  onSubmit={handleSubmitRsvp}
                  className={`lg:col-span-5 p-6 sm:p-7 space-y-5 border ${
                    style === 'editorial-broadsheet' || style === 'royal-monogram'
                      ? 'rounded-none'
                      : 'rounded-2xl'
                  }`}
                  style={{
                    backgroundColor: palette.bgSurface,
                    borderColor: palette.border,
                  }}
                >
                  <div>
                    <label
                      htmlFor="rsvp-nama"
                      className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                      style={{ color: palette.textMuted }}
                    >
                      {labels.rsvpNameLabel}
                    </label>
                    <input
                      id="rsvp-nama"
                      type="text"
                      required
                      maxLength={80}
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      placeholder="Contoh: Ibu Kartini & Keluarga"
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-white text-[#241C16] border border-stone-300 text-sm focus:outline-none focus:ring-2"
                    />
                  </div>

                  <div>
                    <span
                      className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                      style={{ color: palette.textMuted }}
                    >
                      {labels.rsvpStatusLabel}
                    </span>
                    <div className="grid grid-cols-2 gap-2.5">
                      {(
                        [
                          { val: 'Hadir', text: labels.rsvpPresentBtn },
                          { val: 'Berhalangan', text: labels.rsvpAbsentBtn },
                        ] as const
                      ).map((opt) => {
                        const active = kehadiran === opt.val;
                        return (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => setKehadiran(opt.val)}
                            className="min-h-[44px] px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors"
                            style={
                              active
                                ? {
                                    backgroundColor: palette.bgCover,
                                    color: palette.textOnCover,
                                    borderColor: palette.bgCover,
                                  }
                                : {
                                    backgroundColor: '#FFFFFF',
                                    color: '#241C16',
                                    borderColor: '#D6D3D1',
                                  }
                            }
                          >
                            {opt.text}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {kehadiran === 'Hadir' && (
                    <div>
                      <label
                        htmlFor="rsvp-jumlah"
                        className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                        style={{ color: palette.textMuted }}
                      >
                        {labels.rsvpGuestsLabel}
                      </label>
                      <select
                        id="rsvp-jumlah"
                        value={jumlah}
                        onChange={(e) => setJumlah(Number(e.target.value))}
                        className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-white text-[#241C16] border border-stone-300 text-sm focus:outline-none focus:ring-2"
                      >
                        <option value={1}>1 Orang</option>
                        <option value={2}>2 Orang</option>
                        <option value={3}>3 Orang</option>
                        <option value={4}>4 Orang</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="rsvp-ucapan"
                      className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                      style={{ color: palette.textMuted }}
                    >
                      {labels.rsvpMessageLabel}
                    </label>
                    <textarea
                      id="rsvp-ucapan"
                      rows={4}
                      required
                      maxLength={400}
                      value={ucapan}
                      onChange={(e) => setUcapan(e.target.value)}
                      placeholder={labels.rsvpMessagePlaceholder}
                      className="w-full px-4 py-3 rounded-xl bg-white text-[#241C16] border border-stone-300 text-sm focus:outline-none focus:ring-2 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[48px] px-6 py-3 rounded-xl font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-60"
                    style={{
                      backgroundColor: palette.bgCover,
                      color: palette.textOnCover,
                    }}
                  >
                    {isSubmitting ? 'Mengirim...' : labels.rsvpSubmitBtn}
                  </button>
                </form>

                <div
                  className="lg:col-span-7 space-y-4 max-h-[520px] overflow-y-auto pr-1"
                  aria-live="polite"
                >
                  {wishes.length === 0 ? (
                    <div
                      className={`p-8 text-center border text-sm ${
                        style === 'editorial-broadsheet' || style === 'royal-monogram'
                          ? 'rounded-none'
                          : 'rounded-2xl'
                      }`}
                      style={{
                        backgroundColor: palette.bgSurface,
                        borderColor: palette.border,
                        color: palette.textMuted,
                      }}
                    >
                      Belum ada ucapan dan doa. Jadilah tamu pertama yang mengirimkan ucapan melalui formulir di samping.
                    </div>
                  ) : (
                    wishes.map((w) => (
                      <article
                        key={w.id}
                        className={`p-5 border ${
                          style === 'editorial-broadsheet' || style === 'royal-monogram'
                            ? 'rounded-none'
                            : 'rounded-2xl'
                        }`}
                        style={{
                          backgroundColor: palette.bgSurface,
                          borderColor: palette.border,
                        }}
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="font-sans font-semibold text-sm">{w.nama}</h3>
                          <div className="text-xs flex items-center gap-1.5">
                            <span
                              className="inline-flex items-center gap-1 font-medium"
                              style={{
                                color:
                                  w.kehadiran === 'Hadir'
                                    ? palette.accent
                                    : palette.textMuted,
                              }}
                            >
                              {w.kehadiran === 'Hadir' && <Check className="w-3.5 h-3.5" />}
                              {w.kehadiran === 'Hadir'
                                ? labels.rsvpPresentBtn
                                : labels.rsvpAbsentBtn}
                            </span>
                            <span aria-hidden="true" style={{ color: palette.accent }}>
                              ·
                            </span>
                            <span style={{ color: palette.textMuted }}>
                              {formatRelativeTime(w.createdAt)}
                            </span>
                            {isCloudConnected &&
                              currentUserUid &&
                              currentUserUid === invitationOwnerId && (
                                <button
                                  type="button"
                                  aria-label={`Hapus ucapan dari ${w.nama}`}
                                  onClick={() => handleDeleteWish(w.id)}
                                  className="ml-1 p-1 rounded hover:bg-red-50 text-red-700"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                          </div>
                        </div>
                        <p
                          className="mt-2.5 text-sm leading-relaxed"
                          style={{ color: palette.textMuted }}
                        >
                          {w.ucapan}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* AMPLOP DIGITAL / HADIAH */}
        {config.features.showGifts && config.gifts.length > 0 && (
          <section
            id="inv-hadiah"
            className="border-t py-16 md:py-20 px-5 sm:px-8"
            style={{
              backgroundColor: palette.bgSurface,
              borderColor: palette.border,
            }}
          >
            <div className="max-w-4xl mx-auto">
              <div className="text-center max-w-xl mx-auto mb-12">
                <p
                  className="text-xs uppercase tracking-[0.24em] font-semibold"
                  style={{ color: palette.accent }}
                >
                  {labels.giftsKicker}
                </p>
                <h2 className={`${headingFontClass} text-3xl sm:text-4xl mt-2`}>
                  {labels.giftsTitle}
                </h2>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: palette.textMuted }}>
                  {labels.giftsIntro}
                </p>
              </div>

              <div
                className={`grid grid-cols-1 ${
                  config.gifts.length === 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' : 'md:grid-cols-3'
                } gap-4 sm:gap-5 items-stretch`}
              >
                {config.gifts.map((gift) => (
                  <div
                    key={gift.id}
                    className={`p-6 flex flex-col justify-between border ${
                      style === 'editorial-broadsheet' || style === 'royal-monogram'
                        ? 'rounded-none'
                        : 'rounded-2xl'
                    }`}
                    style={{
                      backgroundColor: effectiveBgCanvas,
                      borderColor: palette.border,
                    }}
                  >
                    <div>
                      <p
                        className="text-xs uppercase tracking-[0.2em] font-semibold"
                        style={{ color: palette.accent }}
                      >
                        {gift.bank}
                      </p>
                      <p className="font-serif text-2xl sm:text-3xl font-semibold tabular-nums mt-3">
                        {gift.accountNumber}
                      </p>
                      <p className="text-sm mt-1.5" style={{ color: palette.textMuted }}>
                        a.n. {gift.accountHolder}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyAccount(gift.accountNumber)}
                      className="mt-6 w-full min-h-[44px] px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-85"
                      style={{
                        borderColor: palette.accent,
                        backgroundColor: palette.bgSurface,
                      }}
                    >
                      <Copy className="w-4 h-4" style={{ color: palette.accent }} />
                      <span className="whitespace-nowrap">{labels.copyAccountBtn}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer
          className="py-12 px-5 text-center border-t"
          style={{
            backgroundColor: palette.bgCover,
            color: palette.textOnCover,
            borderColor: `${palette.accentOnCover}33`,
          }}
        >
          <p className="text-xs opacity-75">{labels.footerThankYou}</p>
          <p className="font-serif text-3xl sm:text-4xl text-white mt-2">
            {config.coverTitle}
          </p>
          <p
            className="text-xs tracking-[0.22em] uppercase mt-2"
            style={{ color: palette.accentOnCover }}
          >
            {config.coverDateText}
          </p>
        </footer>
      </div>

      {/* FLOATING MUSIC & MOBILE BOTTOM NAV */}
      {isOpened && !embedded && (
        <>
          {config.features.showMusic && (
            <button
              type="button"
              onClick={handleToggleMusic}
              aria-label={isPlaying ? 'Jeda musik latar' : 'Putar musik latar'}
              className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 min-w-[48px] min-h-[48px] px-3.5 rounded-full border shadow-xl flex items-center gap-2"
              style={{
                backgroundColor: palette.bgCover,
                color: palette.accentOnCover,
                borderColor: `${palette.accentOnCover}80`,
              }}
            >
              <Music className={`w-4 h-4 ${isPlaying ? 'animate-slow-spin' : ''}`} />
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          )}

          <nav
            aria-label="Navigasi Cepat Seluler"
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 backdrop-blur-md border-t grid grid-cols-5 items-center"
            style={{
              backgroundColor: `${effectiveBgCanvas}EE`,
              borderColor: palette.border,
              color: palette.textPrimary,
            }}
          >
            <a
              href="#inv-beranda"
              className="min-h-[44px] flex flex-col items-center justify-center text-[10px] font-medium"
            >
              <Home className="w-4 h-4 mb-0.5" />
              <span>{labels.navHome}</span>
            </a>
            <a
              href="#inv-mempelai"
              className="min-h-[44px] flex flex-col items-center justify-center text-[10px] font-medium"
            >
              <Heart className="w-4 h-4 mb-0.5" />
              <span>{labels.navProfile}</span>
            </a>
            <a
              href="#inv-acara"
              className="min-h-[44px] flex flex-col items-center justify-center text-[10px] font-medium"
            >
              <Calendar className="w-4 h-4 mb-0.5" />
              <span>{labels.navEvents}</span>
            </a>
            {config.features.showGallery ? (
              <a
                href="#inv-galeri"
                className="min-h-[44px] flex flex-col items-center justify-center text-[10px] font-medium"
              >
                <ImageIcon className="w-4 h-4 mb-0.5" />
                <span>{labels.navGallery}</span>
              </a>
            ) : (
              <a
                href="#inv-video"
                className="min-h-[44px] flex flex-col items-center justify-center text-[10px] font-medium"
              >
                <Film className="w-4 h-4 mb-0.5" />
                <span>Video</span>
              </a>
            )}
            <a
              href={config.features.showRsvp ? '#inv-ucapan' : '#inv-hadiah'}
              className="min-h-[44px] flex flex-col items-center justify-center text-[10px] font-medium"
            >
              <MessageSquareHeart className="w-4 h-4 mb-0.5" />
              <span>{labels.navRsvp}</span>
            </a>
          </nav>
        </>
      )}

      {/* LIGHTBOX GALERI */}
      {lightboxIdx !== null && config.gallery[lightboxIdx] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau Foto Galeri"
          onClick={() => setLightboxIdx(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <button
            type="button"
            onClick={() => setLightboxIdx(null)}
            aria-label="Tutup galeri"
            className="absolute top-4 right-4 min-w-[44px] min-h-[44px] rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIdx(
                (lightboxIdx - 1 + config.gallery.length) % config.gallery.length
              );
            }}
            aria-label="Foto sebelumnya"
            className="absolute left-3 sm:left-6 min-w-[44px] min-h-[44px] rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl w-full text-center px-10"
          >
            <img
              src={config.gallery[lightboxIdx].src}
              alt={config.gallery[lightboxIdx].caption}
              referrerPolicy="no-referrer"
              className="max-h-[76vh] mx-auto rounded-xl object-contain"
            />
            <p className="mt-3 text-sm text-stone-200 font-serif italic">
              {config.gallery[lightboxIdx].caption}
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIdx((lightboxIdx + 1) % config.gallery.length);
            }}
            aria-label="Foto berikutnya"
            className="absolute right-3 sm:right-6 min-w-[44px] min-h-[44px] rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* TOAST */}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl bg-[#231A14] text-[#FAF6EE] border border-[#D8B26A]/45 text-xs sm:text-sm font-medium shadow-xl transition-all duration-200 ${
          toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        {toastMessage}
      </div>
    </div>
  );
}
