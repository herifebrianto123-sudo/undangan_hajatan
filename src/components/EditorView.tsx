import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  Calendar,
  Cloud,
  CloudOff,
  Eye,
  Film,
  FolderOpen,
  HardDrive,
  Image as ImageIcon,
  Layers,
  Music,
  Palette,
  Plus,
  RefreshCw,
  Send,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Type,
  Upload,
  X,
} from 'lucide-react';
import { getDriveAccessToken } from '../firebase';
import {
  deleteDriveFile,
  DriveMediaItem,
  listStudioDriveFiles,
  uploadMediaToDrive,
} from '../services/googleDrive';
import {
  BackgroundPaletteId,
  FeatureToggles,
  InvitationConfig,
} from '../types/invitation';
import { compressImageFile, readMediaAsObjectUrl } from '../utils/mediaUpload';
import {
  BACKGROUND_PALETTES,
  EVENT_CATEGORIES,
  getThemeById,
} from '../utils/themePresets';
import GoogleSignInButton from './GoogleSignInButton';
import InvitationPreview from './InvitationPreview';

export type CloudSyncStatus = 'local' | 'saving' | 'saved' | 'error';

interface EditorViewProps {
  config: InvitationConfig;
  user?: User | null;
  hasDriveAccess?: boolean;
  cloudStatus?: CloudSyncStatus;
  invitationId?: string | null;
  invitationOwnerId?: string | null;
  onSignInGoogle?: () => Promise<void>;
  onConnectDrive?: () => Promise<void>;
  onChange: (updater: (prev: InvitationConfig) => InvitationConfig) => void;
  onGoToShare: () => void;
  onOpenFullDemo: () => void;
}

type EditorTab = 'text' | 'events' | 'media' | 'color' | 'features';

export default function EditorView({
  config,
  user = null,
  hasDriveAccess = false,
  cloudStatus = 'local',
  invitationId = null,
  invitationOwnerId = null,
  onSignInGoogle,
  onConnectDrive,
  onChange,
  onGoToShare,
  onOpenFullDemo,
}: EditorViewProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('text');
  const [mobileShowPreview, setMobileShowPreview] = useState(false);
  const [previewCoverOpen, setPreviewCoverOpen] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [showDriveBrowser, setShowDriveBrowser] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveMediaItem[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [pendingDeleteDriveFile, setPendingDeleteDriveFile] =
    useState<DriveMediaItem | null>(null);
  const [isDeletingDriveFile, setIsDeletingDriveFile] = useState(false);

  const activeTheme = getThemeById(config.themeId);
  const activeCategoryLabel =
    EVENT_CATEGORIES.find((c) => c.id === config.category)?.label ||
    config.category;

  const refreshDriveFiles = async () => {
    if (!getDriveAccessToken()) return;
    setDriveLoading(true);
    setDriveError(null);
    try {
      const files = await listStudioDriveFiles();
      setDriveFiles(files);
    } catch (err) {
      setDriveError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil koleksi Google Drive.'
      );
    } finally {
      setDriveLoading(false);
    }
  };

  const applyPhotoUrlToTarget = (
    url: string,
    target: 'hero' | 'bride' | 'groom' | { galleryIndex: number } | 'add-gallery'
  ) => {
    onChange((prev) => {
      if (target === 'hero' || target === 'bride' || target === 'groom') {
        return {
          ...prev,
          images: { ...prev.images, [target]: url },
        };
      }
      if (target === 'add-gallery') {
        return {
          ...prev,
          gallery: [
            ...prev.gallery,
            {
              id: `gal-${Date.now()}`,
              src: url,
              caption: 'Momen Bahagia Kami',
            },
          ],
        };
      }
      const nextGallery = [...prev.gallery];
      if (nextGallery[target.galleryIndex]) {
        nextGallery[target.galleryIndex] = {
          ...nextGallery[target.galleryIndex],
          src: url,
        };
      }
      return { ...prev, gallery: nextGallery };
    });
  };

  const handlePhotoUpload = async (
    file: File | undefined,
    target: 'hero' | 'bride' | 'groom' | { galleryIndex: number } | 'add-gallery'
  ) => {
    if (!file) return;
    try {
      if (hasDriveAccess && getDriveAccessToken()) {
        setUploadStatus(`Mengunggah "${file.name}" ke Google Drive...`);
        const uploaded = await uploadMediaToDrive(file, 'foto');
        applyPhotoUrlToTarget(uploaded.imageUrl, target);
        setUploadStatus('Foto tersimpan di Google Drive & undangan');
        if (showDriveBrowser) {
          void refreshDriveFiles();
        }
        window.setTimeout(() => setUploadStatus(null), 2600);
        return;
      }

      setUploadStatus('Memproses foto...');
      const dataUrl = await compressImageFile(file);
      applyPhotoUrlToTarget(dataUrl, target);
      setUploadStatus('Foto diperbarui (hubungkan Drive untuk kualitas penuh)');
      window.setTimeout(() => setUploadStatus(null), 2600);
    } catch (err) {
      setUploadStatus(
        err instanceof Error ? err.message : 'Gagal memproses atau mengunggah foto'
      );
    }
  };

  const handleVideoUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (hasDriveAccess && getDriveAccessToken()) {
        setUploadStatus(`Mengunggah video "${file.name}" ke Google Drive...`);
        const uploaded = await uploadMediaToDrive(file, 'video');
        onChange((prev) => ({
          ...prev,
          video: {
            ...prev.video,
            src: uploaded.videoViewUrl,
          },
          features: { ...prev.features, showVideo: true },
        }));
        setUploadStatus(`Video "${file.name}" tersimpan di Google Drive`);
        if (showDriveBrowser) {
          void refreshDriveFiles();
        }
        window.setTimeout(() => setUploadStatus(null), 2800);
        return;
      }

      const objectUrl = readMediaAsObjectUrl(file);
      onChange((prev) => ({
        ...prev,
        video: {
          ...prev.video,
          src: objectUrl,
        },
        features: { ...prev.features, showVideo: true },
      }));
      setUploadStatus(
        `Video lokal "${file.name}" siap (hubungkan Drive agar bisa dibuka tamu)`
      );
      window.setTimeout(() => setUploadStatus(null), 3000);
    } catch (err) {
      setUploadStatus(
        err instanceof Error ? err.message : 'Gagal mengunggah video ke Google Drive'
      );
    }
  };

  const handleAudioUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (hasDriveAccess && getDriveAccessToken()) {
        setUploadStatus(`Mengunggah audio "${file.name}" ke Google Drive...`);
        const uploaded = await uploadMediaToDrive(file, 'audio');
        onChange((prev) => ({
          ...prev,
          music: {
            mode: 'custom',
            customUrl: uploaded.audioUrl,
            label: file.name,
          },
          features: { ...prev.features, showMusic: true },
        }));
        setUploadStatus(`Audio "${file.name}" tersimpan di Google Drive`);
        if (showDriveBrowser) {
          void refreshDriveFiles();
        }
        window.setTimeout(() => setUploadStatus(null), 2800);
        return;
      }

      const objectUrl = readMediaAsObjectUrl(file);
      onChange((prev) => ({
        ...prev,
        music: {
          mode: 'custom',
          customUrl: objectUrl,
          label: file.name,
        },
        features: { ...prev.features, showMusic: true },
      }));
      setUploadStatus(
        `Audio lokal "${file.name}" diterapkan (hubungkan Drive agar tersimpan permanen)`
      );
      window.setTimeout(() => setUploadStatus(null), 3000);
    } catch (err) {
      setUploadStatus(
        err instanceof Error ? err.message : 'Gagal mengunggah audio ke Google Drive'
      );
    }
  };

  const handleConfirmDeleteDriveFile = async () => {
    if (!pendingDeleteDriveFile) return;
    const targetFile = pendingDeleteDriveFile;
    setIsDeletingDriveFile(true);
    try {
      await deleteDriveFile(targetFile.id);
      setDriveFiles((prev) => prev.filter((f) => f.id !== targetFile.id));
      setPendingDeleteDriveFile(null);
      setUploadStatus(`File "${targetFile.name}" dihapus dari Google Drive`);
      window.setTimeout(() => setUploadStatus(null), 2600);
    } catch (err) {
      setDriveError(
        err instanceof Error
          ? err.message
          : 'Gagal menghapus file dari Google Drive.'
      );
      setPendingDeleteDriveFile(null);
    } finally {
      setIsDeletingDriveFile(false);
    }
  };

  const toggleFeature = (key: keyof FeatureToggles) => {
    onChange((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: !prev.features[key],
      },
    }));
  };

  const tabs: { id: EditorTab; label: string; icon: React.ReactNode }[] = [
    { id: 'text', label: 'Teks & Profil', icon: <Type className="w-4 h-4" /> },
    { id: 'events', label: 'Acara & Waktu', icon: <Calendar className="w-4 h-4" /> },
    { id: 'media', label: 'Foto, Video & Musik', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'color', label: 'Warna Latar', icon: <Palette className="w-4 h-4" /> },
    { id: 'features', label: 'Fitur & Hadiah', icon: <Layers className="w-4 h-4" /> },
  ];

  const featureItems: { key: keyof FeatureToggles; label: string; desc: string }[] = [
    {
      key: 'showGifts',
      label: 'Rekening & Amplop Digital (Hadiah)',
      desc: 'Tampilkan atau sembunyikan kartu nomor rekening & dompet digital.',
    },
    {
      key: 'showGallery',
      label: 'Galeri Foto',
      desc: 'Tampilkan grid foto kenangan dengan modal pembesar.',
    },
    {
      key: 'showVideo',
      label: 'Video Momen',
      desc: 'Tampilkan pemutar video MP4, YouTube, atau Google Drive.',
    },
    {
      key: 'showRsvp',
      label: 'Buku Tamu & Konfirmasi RSVP',
      desc: 'Izinkan tamu mengisi status kehadiran dan mengirim doa.',
    },
    {
      key: 'showCountdown',
      label: 'Hitung Mundur (Countdown Timer)',
      desc: 'Tampilkan penghitung waktu menuju hari H & tombol kalender.',
    },
    {
      key: 'showMusic',
      label: 'Musik Latar Otomatis',
      desc: 'Putar musik instrumental lembut atau audio unggahan saat undangan dibuka.',
    },
    {
      key: 'showQuote',
      label: 'Kutipan Ayat / Filosofi',
      desc: 'Tampilkan kutipan doa atau filosofi acara di bawah profil.',
    },
  ];

  const countdownInputVal = (() => {
    const d = new Date(config.targetDateISO);
    if (Number.isNaN(d.getTime())) return '2026-12-19T08:00';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  })();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Editor Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-stone-200 mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#241C16]">
            Editor Undangan
          </h1>
          <p className="text-xs sm:text-sm text-[#5E4F43]">
            {activeCategoryLabel} · {activeTheme.name} — Edit teks, jadwal, foto, video, musik, warna latar, serta tampilkan atau sembunyikan fitur.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {uploadStatus && (
            <span className="text-xs font-medium text-[#9E7328] px-2">
              {uploadStatus}
            </span>
          )}

          {user ? (
            <>
              <span className="min-h-[40px] px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-medium text-[#5E4F43] flex items-center gap-1.5">
                <Cloud
                  className={`w-3.5 h-3.5 ${
                    cloudStatus === 'error'
                      ? 'text-red-600'
                      : cloudStatus === 'saving'
                      ? 'text-[#9E7328]'
                      : 'text-emerald-700'
                  }`}
                />
                <span>
                  {cloudStatus === 'saving'
                    ? 'Menyimpan...'
                    : cloudStatus === 'error'
                    ? 'Gagal sinkron'
                    : 'Tersimpan di Cloud'}
                </span>
              </span>
              {!hasDriveAccess && (onConnectDrive || onSignInGoogle) && (
                <GoogleSignInButton
                  label="Hubungkan Google Drive"
                  onClick={onConnectDrive || onSignInGoogle!}
                  className="min-h-[40px] px-3 py-1.5 text-xs"
                />
              )}
            </>
          ) : (
            onSignInGoogle && (
              <GoogleSignInButton
                label="Masuk dengan Google"
                onClick={onSignInGoogle}
              />
            )
          )}

          {!user && !onSignInGoogle && (
            <span className="text-xs text-[#5E4F43] flex items-center gap-1">
              <CloudOff className="w-3.5 h-3.5" />
              <span>Draft Lokal</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => setMobileShowPreview((v) => !v)}
            className="lg:hidden min-h-[44px] px-4 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-[#241C16] flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4" />
            <span>{mobileShowPreview ? 'Tutup Pratinjau' : 'Lihat Pratinjau'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenFullDemo}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#231A14]/25 bg-white text-xs sm:text-sm font-semibold text-[#241C16] hover:bg-[#FAF6EE] flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            <span className="whitespace-nowrap">Demo Layar Penuh</span>
          </button>

          <button
            type="button"
            onClick={onGoToShare}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#231A14] text-[#FAF6EE] text-xs sm:text-sm font-semibold hover:bg-[#382A20] flex items-center gap-2 shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span className="whitespace-nowrap">Bagikan ke Tamu</span>
          </button>
        </div>
      </div>

      {/* Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE: EDITOR CONTROLS */}
        <div
          className={`lg:col-span-6 bg-white border border-stone-200 rounded-2xl overflow-hidden ${
            mobileShowPreview ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Tab Strip */}
          <div className="flex overflow-x-auto border-b border-stone-200 bg-[#FAF6EE]/60 p-1.5 gap-1">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'bg-[#231A14] text-[#FAF6EE]'
                      : 'text-[#5E4F43] hover:text-[#241C16] hover:bg-white'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-5 sm:p-6 space-y-6 max-h-[72vh] overflow-y-auto">
            {/* TAB: WARNA LATAR */}
            {activeTab === 'color' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-semibold text-[#241C16] mb-3">
                    Pilihan Warna Latar
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {BACKGROUND_PALETTES.map((pal) => {
                      const active = !config.useCustomBg && config.paletteId === pal.id;
                      return (
                        <button
                          key={pal.id}
                          type="button"
                          onClick={() =>
                            onChange((prev) => ({
                              ...prev,
                              paletteId: pal.id as BackgroundPaletteId,
                              useCustomBg: false,
                            }))
                          }
                          className={`min-h-[44px] px-3.5 py-2.5 rounded-xl border flex items-center gap-3 text-left transition-all ${
                            active
                              ? 'border-[#231A14] bg-[#FAF6EE]'
                              : 'border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          <span className="flex items-center gap-1 shrink-0">
                            <span
                              className="w-5 h-5 rounded-full border border-black/15"
                              style={{ backgroundColor: pal.swatchPrimary }}
                            />
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/15"
                              style={{ backgroundColor: pal.swatchSecondary }}
                            />
                          </span>
                          <span className="text-xs font-medium text-[#241C16]">
                            {pal.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 p-4 rounded-xl border border-stone-200 bg-stone-50/70 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-[#241C16]">
                        Warna Latar Kustom
                      </p>
                      <p className="text-[11px] text-[#5E4F43]">
                        Atur warna latar belakang halaman undangan sesuai keinginan.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.customBgColor}
                        onChange={(e) =>
                          onChange((prev) => ({
                            ...prev,
                            customBgColor: e.target.value,
                            useCustomBg: true,
                          }))
                        }
                        className="w-10 h-10 rounded-lg cursor-pointer border border-stone-300 bg-white p-0.5"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onChange((prev) => ({
                            ...prev,
                            useCustomBg: !prev.useCustomBg,
                          }))
                        }
                        className="min-h-[38px] px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-medium"
                      >
                        {config.useCustomBg ? 'Kustom Aktif' : 'Gunakan Kustom'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TEKS & PROFIL */}
            {activeTab === 'text' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[#5E4F43] mb-1">
                    Judul Besar Sampul &amp; Hero
                  </label>
                  <input
                    type="text"
                    value={config.coverTitle}
                    onChange={(e) =>
                      onChange((p) => ({ ...p, coverTitle: e.target.value }))
                    }
                    className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 text-sm font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5E4F43] mb-1">
                      Label Atas Sampul
                    </label>
                    <input
                      type="text"
                      value={config.coverKicker}
                      onChange={(e) =>
                        onChange((p) => ({ ...p, coverKicker: e.target.value }))
                      }
                      className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5E4F43] mb-1">
                      Teks Tanggal di Sampul
                    </label>
                    <input
                      type="text"
                      value={config.coverDateText}
                      onChange={(e) =>
                        onChange((p) => ({ ...p, coverDateText: e.target.value }))
                      }
                      className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5E4F43] mb-1">
                    Kalimat Subjudul Hero
                  </label>
                  <textarea
                    rows={2}
                    value={config.heroSubtitle}
                    onChange={(e) =>
                      onChange((p) => ({ ...p, heroSubtitle: e.target.value }))
                    }
                    className="w-full p-3 rounded-xl border border-stone-300 text-sm resize-none"
                  />
                </div>

                {config.category === 'pernikahan' ? (
                  <>
                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#9E7328]">
                        Profil Mempelai Putri
                      </p>
                      <input
                        type="text"
                        value={config.couple.brideFull}
                        onChange={(e) =>
                          onChange((p) => ({
                            ...p,
                            couple: { ...p.couple, brideFull: e.target.value },
                          }))
                        }
                        placeholder="Nama lengkap & gelar"
                        className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 bg-white text-sm"
                      />
                      <input
                        type="text"
                        value={config.couple.brideParents}
                        onChange={(e) =>
                          onChange((p) => ({
                            ...p,
                            couple: { ...p.couple, brideParents: e.target.value },
                          }))
                        }
                        placeholder="Nama kedua orang tua"
                        className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 bg-white text-sm"
                      />
                      <input
                        type="text"
                        value={config.couple.brideOrigin}
                        onChange={(e) =>
                          onChange((p) => ({
                            ...p,
                            couple: { ...p.couple, brideOrigin: e.target.value },
                          }))
                        }
                        placeholder="Kota asal"
                        className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 bg-white text-sm"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#9E7328]">
                        Profil Mempelai Putra
                      </p>
                      <input
                        type="text"
                        value={config.couple.groomFull}
                        onChange={(e) =>
                          onChange((p) => ({
                            ...p,
                            couple: { ...p.couple, groomFull: e.target.value },
                          }))
                        }
                        placeholder="Nama lengkap & gelar"
                        className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 bg-white text-sm"
                      />
                      <input
                        type="text"
                        value={config.couple.groomParents}
                        onChange={(e) =>
                          onChange((p) => ({
                            ...p,
                            couple: { ...p.couple, groomParents: e.target.value },
                          }))
                        }
                        placeholder="Nama kedua orang tua"
                        className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 bg-white text-sm"
                      />
                      <input
                        type="text"
                        value={config.couple.groomOrigin}
                        onChange={(e) =>
                          onChange((p) => ({
                            ...p,
                            couple: { ...p.couple, groomOrigin: e.target.value },
                          }))
                        }
                        placeholder="Kota asal"
                        className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 bg-white text-sm"
                      />
                    </div>
                  </>
                ) : (
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#9E7328]">
                      Profil Tokoh / Tuan Rumah Acara
                    </p>
                    <input
                      type="text"
                      value={config.primaryPerson.roleLabel}
                      onChange={(e) =>
                        onChange((p) => ({
                          ...p,
                          primaryPerson: { ...p.primaryPerson, roleLabel: e.target.value },
                        }))
                      }
                      placeholder="Peran (misal: Putra Tercinta / Tuan Rumah)"
                      className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 bg-white text-sm"
                    />
                    <input
                      type="text"
                      value={config.primaryPerson.fullName}
                      onChange={(e) =>
                        onChange((p) => ({
                          ...p,
                          primaryPerson: { ...p.primaryPerson, fullName: e.target.value },
                        }))
                      }
                      placeholder="Nama lengkap"
                      className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 bg-white text-sm"
                    />
                    <input
                      type="text"
                      value={config.primaryPerson.subBadge}
                      onChange={(e) =>
                        onChange((p) => ({
                          ...p,
                          primaryPerson: { ...p.primaryPerson, subBadge: e.target.value },
                        }))
                      }
                      placeholder="Keterangan tambahan (misal: Usia / Tanggal Lahir / Hajat)"
                      className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 bg-white text-sm"
                    />
                    <input
                      type="text"
                      value={config.primaryPerson.parentsOrHost}
                      onChange={(e) =>
                        onChange((p) => ({
                          ...p,
                          primaryPerson: {
                            ...p.primaryPerson,
                            parentsOrHost: e.target.value,
                          },
                        }))
                      }
                      placeholder="Nama orang tua / keluarga"
                      className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 bg-white text-sm"
                    />
                    <input
                      type="text"
                      value={config.primaryPerson.origin}
                      onChange={(e) =>
                        onChange((p) => ({
                          ...p,
                          primaryPerson: { ...p.primaryPerson, origin: e.target.value },
                        }))
                      }
                      placeholder="Kota"
                      className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 bg-white text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#5E4F43] mb-1">
                    Salam &amp; Kata Pengantar
                  </label>
                  <input
                    type="text"
                    value={config.openingGreeting}
                    onChange={(e) =>
                      onChange((p) => ({ ...p, openingGreeting: e.target.value }))
                    }
                    className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 text-sm mb-2"
                  />
                  <textarea
                    rows={3}
                    value={config.openingIntro}
                    onChange={(e) =>
                      onChange((p) => ({ ...p, openingIntro: e.target.value }))
                    }
                    className="w-full p-3.5 rounded-xl border border-stone-300 text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5E4F43] mb-1">
                    Kutipan Ayat / Filosofi
                  </label>
                  <textarea
                    rows={3}
                    value={config.quoteText}
                    onChange={(e) =>
                      onChange((p) => ({ ...p, quoteText: e.target.value }))
                    }
                    className="w-full p-3.5 rounded-xl border border-stone-300 text-sm resize-none mb-2"
                  />
                  <input
                    type="text"
                    value={config.quoteSource}
                    onChange={(e) =>
                      onChange((p) => ({ ...p, quoteSource: e.target.value }))
                    }
                    placeholder="Sumber kutipan"
                    className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: ACARA & WAKTU */}
            {activeTab === 'events' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[#5E4F43] mb-1">
                    Tanggal &amp; Jam Hitung Mundur (Hari H)
                  </label>
                  <input
                    type="datetime-local"
                    value={countdownInputVal}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      onChange((p) => ({
                        ...p,
                        targetDateISO: `${e.target.value}:00+07:00`,
                      }));
                    }}
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>

                {config.events.map((ev, idx) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#9E7328]">
                        Sesi Acara {idx + 1}
                      </p>
                      {config.events.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            onChange((p) => ({
                              ...p,
                              events: p.events.filter((item) => item.id !== ev.id),
                            }))
                          }
                          className="text-xs text-red-700 hover:underline"
                        >
                          Hapus Sesi
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={ev.title}
                        onChange={(e) =>
                          onChange((p) => {
                            const next = [...p.events];
                            next[idx] = { ...next[idx], title: e.target.value };
                            return { ...p, events: next };
                          })
                        }
                        placeholder="Judul acara"
                        className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 bg-white text-sm"
                      />
                      <input
                        type="text"
                        value={ev.subTitle}
                        onChange={(e) =>
                          onChange((p) => {
                            const next = [...p.events];
                            next[idx] = {
                              ...next[idx],
                              subTitle: e.target.value,
                            };
                            return { ...p, events: next };
                          })
                        }
                        placeholder="Subjudul"
                        className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 bg-white text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={ev.dayDate}
                        onChange={(e) =>
                          onChange((p) => {
                            const next = [...p.events];
                            next[idx] = { ...next[idx], dayDate: e.target.value };
                            return { ...p, events: next };
                          })
                        }
                        placeholder="Hari & Tanggal"
                        className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 bg-white text-sm"
                      />
                      <input
                        type="text"
                        value={ev.time}
                        onChange={(e) =>
                          onChange((p) => {
                            const next = [...p.events];
                            next[idx] = { ...next[idx], time: e.target.value };
                            return { ...p, events: next };
                          })
                        }
                        placeholder="Waktu (WIB)"
                        className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 bg-white text-sm"
                      />
                    </div>
                    <input
                      type="text"
                      value={ev.venue}
                      onChange={(e) =>
                        onChange((p) => {
                          const next = [...p.events];
                          next[idx] = { ...next[idx], venue: e.target.value };
                          return { ...p, events: next };
                        })
                      }
                      placeholder="Nama gedung / tempat"
                      className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 bg-white text-sm"
                    />
                    <input
                      type="text"
                      value={ev.address}
                      onChange={(e) =>
                        onChange((p) => {
                          const next = [...p.events];
                          next[idx] = { ...next[idx], address: e.target.value };
                          return { ...p, events: next };
                        })
                      }
                      placeholder="Alamat lengkap"
                      className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 bg-white text-sm"
                    />
                    <input
                      type="url"
                      value={ev.mapsUrl}
                      onChange={(e) =>
                        onChange((p) => {
                          const next = [...p.events];
                          next[idx] = { ...next[idx], mapsUrl: e.target.value };
                          return { ...p, events: next };
                        })
                      }
                      placeholder="Link Google Maps"
                      className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 bg-white text-sm"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    onChange((p) => ({
                      ...p,
                      events: [
                        ...p.events,
                        {
                          id: `ev-${Date.now()}`,
                          title: 'Acara Tambahan',
                          subTitle: 'Rangkaian Lanjutan',
                          dayDate: p.coverDateText,
                          time: '13.00 – 16.00 WIB',
                          venue: 'Aula Utama',
                          address: 'Jakarta',
                          dressCode: 'Batik / Bebas Rapi',
                          mapsUrl: 'https://maps.google.com/?q=Jakarta',
                        },
                      ],
                    }))
                  }
                  className="min-h-[40px] px-4 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-[#241C16] flex items-center gap-1.5 hover:bg-stone-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Sesi Acara</span>
                </button>
              </div>
            )}

            {/* TAB 4: FOTO, VIDEO & MUSIK */}
            {activeTab === 'media' && (
              <div className="space-y-6">
                {/* Google Drive Connection Card */}
                <div className="p-4 rounded-xl border border-[#9E7328]/30 bg-[#FAF6EE] space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-[#241C16] flex items-center gap-1.5">
                        <HardDrive className="w-4 h-4 text-[#9E7328]" />
                        <span>
                          {hasDriveAccess
                            ? 'Google Drive Terhubung · Folder Undangan Studio Media'
                            : 'Penyimpanan Media di Google Drive'}
                        </span>
                      </p>
                      <p className="text-[11px] text-[#5E4F43] leading-relaxed">
                        {hasDriveAccess
                          ? 'Foto, video, dan musik yang Anda unggah otomatis disimpan ke folder "Undangan Studio Media" di Google Drive Anda dengan izin baca publik untuk tamu.'
                          : 'Hubungkan Google Drive agar foto resolusi tinggi, video MP4, dan audio tersimpan permanen di folder Google Drive Anda tanpa membebani batas database.'}
                      </p>
                    </div>

                    {hasDriveAccess ? (
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const nextOpen = !showDriveBrowser;
                            setShowDriveBrowser(nextOpen);
                            if (nextOpen) {
                              void refreshDriveFiles();
                            }
                          }}
                          className="min-h-[38px] px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-[#241C16] hover:bg-stone-50 flex items-center gap-1.5"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-[#9E7328]" />
                          <span>
                            {showDriveBrowser
                              ? 'Tutup Koleksi Drive'
                              : 'Lihat Koleksi Drive'}
                          </span>
                        </button>
                      </div>
                    ) : (
                      (onConnectDrive || onSignInGoogle) && (
                        <GoogleSignInButton
                          label={
                            user
                              ? 'Hubungkan Google Drive'
                              : 'Masuk & Hubungkan Google Drive'
                          }
                          onClick={onConnectDrive || onSignInGoogle!}
                        />
                      )
                    )}
                  </div>

                  {showDriveBrowser && hasDriveAccess && (
                    <div className="pt-3 border-t border-[#9E7328]/20 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-[#241C16]">
                          Koleksi File Undangan Studio Media ({driveFiles.length})
                        </p>
                        <button
                          type="button"
                          onClick={() => void refreshDriveFiles()}
                          disabled={driveLoading}
                          className="min-h-[34px] px-2.5 py-1 rounded-lg border border-stone-300 bg-white text-[11px] font-semibold text-[#241C16] hover:bg-stone-50 flex items-center gap-1 disabled:opacity-60"
                        >
                          <RefreshCw
                            className={`w-3 h-3 ${
                              driveLoading ? 'animate-spin' : ''
                            }`}
                          />
                          <span>Muat Ulang</span>
                        </button>
                      </div>

                      {driveError && (
                        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          {driveError}
                        </p>
                      )}

                      {driveLoading && driveFiles.length === 0 ? (
                        <p className="text-xs text-[#5E4F43] py-3">
                          Mengambil daftar file dari Google Drive...
                        </p>
                      ) : driveFiles.length === 0 ? (
                        <p className="text-xs text-[#5E4F43] py-2">
                          Belum ada file di folder Undangan Studio Media. Unggah foto, video, atau musik di bawah untuk menyimpannya ke Drive.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {driveFiles.map((file) => {
                            const isImage = file.mimeType.startsWith('image/');
                            const isVideo = file.mimeType.startsWith('video/');
                            const isAudio = file.mimeType.startsWith('audio/');
                            return (
                              <div
                                key={file.id}
                                className="p-2.5 rounded-lg bg-white border border-stone-200 flex flex-wrap items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  {isImage ? (
                                    <img
                                      src={file.imageUrl}
                                      alt={file.name}
                                      referrerPolicy="no-referrer"
                                      className="w-10 h-10 rounded-md object-cover bg-stone-100 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-md bg-stone-100 flex items-center justify-center shrink-0 text-[#9E7328]">
                                      {isVideo ? (
                                        <Film className="w-4 h-4" />
                                      ) : (
                                        <Music className="w-4 h-4" />
                                      )}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-[#241C16] truncate">
                                      {file.name}
                                    </p>
                                    <p className="text-[11px] text-[#5E4F43]">
                                      {isImage
                                        ? 'Foto Drive'
                                        : isVideo
                                        ? 'Video Drive'
                                        : isAudio
                                        ? 'Audio Drive'
                                        : 'Media Drive'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                  {isImage && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          applyPhotoUrlToTarget(
                                            file.imageUrl,
                                            'hero'
                                          );
                                          setUploadStatus(
                                            `"${file.name}" dipasang sebagai Foto Utama`
                                          );
                                        }}
                                        className="min-h-[32px] px-2 py-1 rounded-md border border-stone-300 bg-stone-50 text-[11px] font-medium hover:bg-stone-100"
                                      >
                                        Foto Utama
                                      </button>
                                      {config.category === 'pernikahan' && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              applyPhotoUrlToTarget(
                                                file.imageUrl,
                                                'bride'
                                              );
                                              setUploadStatus(
                                                `"${file.name}" dipasang untuk Mempelai Putri`
                                              );
                                            }}
                                            className="min-h-[32px] px-2 py-1 rounded-md border border-stone-300 bg-stone-50 text-[11px] font-medium hover:bg-stone-100"
                                          >
                                            Putri
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              applyPhotoUrlToTarget(
                                                file.imageUrl,
                                                'groom'
                                              );
                                              setUploadStatus(
                                                `"${file.name}" dipasang untuk Mempelai Putra`
                                              );
                                            }}
                                            className="min-h-[32px] px-2 py-1 rounded-md border border-stone-300 bg-stone-50 text-[11px] font-medium hover:bg-stone-100"
                                          >
                                            Putra
                                          </button>
                                        </>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          applyPhotoUrlToTarget(
                                            file.imageUrl,
                                            'add-gallery'
                                          );
                                          setUploadStatus(
                                            `"${file.name}" ditambahkan ke Galeri`
                                          );
                                        }}
                                        className="min-h-[32px] px-2 py-1 rounded-md border border-stone-300 bg-stone-50 text-[11px] font-medium hover:bg-stone-100"
                                      >
                                        + Galeri
                                      </button>
                                    </>
                                  )}

                                  {isVideo && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onChange((p) => ({
                                          ...p,
                                          video: {
                                            ...p.video,
                                            src: file.videoViewUrl,
                                          },
                                          features: {
                                            ...p.features,
                                            showVideo: true,
                                          },
                                        }));
                                        setUploadStatus(
                                          `Video "${file.name}" dipasang`
                                        );
                                      }}
                                      className="min-h-[32px] px-2.5 py-1 rounded-md border border-stone-300 bg-stone-50 text-[11px] font-medium hover:bg-stone-100"
                                    >
                                      Pakai Video
                                    </button>
                                  )}

                                  {isAudio && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onChange((p) => ({
                                          ...p,
                                          music: {
                                            mode: 'custom',
                                            customUrl: file.audioUrl,
                                            label: file.name,
                                          },
                                          features: {
                                            ...p.features,
                                            showMusic: true,
                                          },
                                        }));
                                        setUploadStatus(
                                          `Audio "${file.name}" dipasang`
                                        );
                                      }}
                                      className="min-h-[32px] px-2.5 py-1 rounded-md border border-stone-300 bg-stone-50 text-[11px] font-medium hover:bg-stone-100"
                                    >
                                      Pakai Musik
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    aria-label={`Hapus ${file.name} dari Drive`}
                                    onClick={() => setPendingDeleteDriveFile(file)}
                                    className="min-w-[32px] min-h-[32px] rounded-md border border-red-200 text-red-700 bg-white flex items-center justify-center hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-[#241C16]">
                    Foto Utama &amp; Profil
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(config.category === 'pernikahan'
                      ? ([
                          { key: 'hero', label: 'Foto Utama' },
                          { key: 'bride', label: 'Mempelai Putri' },
                          { key: 'groom', label: 'Mempelai Putra' },
                        ] as const)
                      : ([{ key: 'hero', label: 'Foto Utama & Profil' }] as const)
                    ).map((slot) => (
                      <div
                        key={slot.key}
                        className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-2.5"
                      >
                        <div className="aspect-[3/4] rounded-lg overflow-hidden bg-stone-200">
                          <img
                            src={config.images[slot.key]}
                            alt={slot.label}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs font-semibold text-[#241C16]">
                          {slot.label}
                        </p>
                        <label className="w-full min-h-[38px] px-3 py-1.5 rounded-lg bg-[#231A14] text-[#FAF6EE] text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#382A20]">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Ganti Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = '';
                              void handlePhotoUpload(file, slot.key);
                            }}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-stone-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-[#241C16]">
                      Foto Galeri ({config.gallery.length})
                    </h2>
                    <label className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-[#241C16] flex items-center gap-1.5 cursor-pointer hover:bg-stone-50">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          void handlePhotoUpload(file, 'add-gallery');
                        }}
                      />
                    </label>
                  </div>

                  <div className="space-y-2.5">
                    {config.gallery.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl border border-stone-200 flex items-center gap-3 bg-stone-50/70"
                      >
                        <img
                          src={item.src}
                          alt={item.caption}
                          referrerPolicy="no-referrer"
                          className="w-12 h-14 rounded-lg object-cover shrink-0 bg-stone-200"
                        />
                        <input
                          type="text"
                          value={item.caption}
                          onChange={(e) =>
                            onChange((p) => {
                              const next = [...p.gallery];
                              next[idx] = { ...next[idx], caption: e.target.value };
                              return { ...p, gallery: next };
                            })
                          }
                          className="flex-1 min-w-0 min-h-[38px] px-3 rounded-lg border border-stone-300 bg-white text-xs"
                        />
                        <label
                          title="Ganti gambar"
                          className="min-w-[38px] min-h-[38px] rounded-lg border border-stone-300 bg-white flex items-center justify-center cursor-pointer hover:bg-stone-100 shrink-0"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#241C16]" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handlePhotoUpload(e.target.files?.[0], {
                                galleryIndex: idx,
                              })
                            }
                          />
                        </label>
                        <button
                          type="button"
                          aria-label="Hapus foto"
                          onClick={() =>
                            onChange((p) => ({
                              ...p,
                              gallery: p.gallery.filter((g) => g.id !== item.id),
                            }))
                          }
                          className="min-w-[38px] min-h-[38px] rounded-lg border border-red-200 text-red-700 bg-white flex items-center justify-center hover:bg-red-50 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-stone-200">
                  <h2 className="text-sm font-semibold text-[#241C16] flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-[#9E7328]" />
                    Video Momen
                  </h2>
                  <input
                    type="url"
                    value={config.video.src}
                    onChange={(e) =>
                      onChange((p) => ({
                        ...p,
                        video: { ...p.video, src: e.target.value },
                      }))
                    }
                    placeholder="Tempel link YouTube, Google Drive, atau URL MP4"
                    className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 text-sm"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="min-h-[40px] px-4 py-2 rounded-xl bg-[#231A14] text-[#FAF6EE] text-xs font-semibold flex items-center gap-2 cursor-pointer hover:bg-[#382A20]">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Unggah Video MP4/WebM</span>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => handleVideoUpload(e.target.files?.[0])}
                      />
                    </label>
                    {config.video.src && (
                      <button
                        type="button"
                        onClick={() =>
                          onChange((p) => ({
                            ...p,
                            video: { ...p.video, src: '' },
                          }))
                        }
                        className="text-xs text-red-700 hover:underline"
                      >
                        Hapus Video
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={config.video.caption}
                    onChange={(e) =>
                      onChange((p) => ({
                        ...p,
                        video: { ...p.video, caption: e.target.value },
                      }))
                    }
                    placeholder="Keterangan video"
                    className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>

                <div className="space-y-3 pt-2 border-t border-stone-200">
                  <h2 className="text-sm font-semibold text-[#241C16] flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-[#9E7328]" />
                    Musik Latar ({config.music.label})
                  </h2>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        onChange((p) => ({
                          ...p,
                          music: {
                            mode: 'builtin',
                            customUrl: '',
                            label: 'Musik Instrumental Lembut (Bawaan)',
                          },
                        }))
                      }
                      className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-medium ${
                        config.music.mode === 'builtin'
                          ? 'bg-[#231A14] text-[#FAF6EE] border-[#231A14]'
                          : 'bg-white text-[#241C16] border-stone-300'
                      }`}
                    >
                      Gunakan Musik Bawaan
                    </button>

                    <label className="min-h-[40px] px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-xs font-medium text-[#241C16] flex items-center gap-1.5 cursor-pointer hover:bg-stone-50">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Unggah MP3</span>
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => handleAudioUpload(e.target.files?.[0])}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: FITUR (TAMPILKAN / SEMBUNYIKAN) & REKENING HADIAH */}
            {activeTab === 'features' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-semibold text-[#241C16] mb-1">
                    Tampilkan atau Sembunyikan Fitur
                  </h2>
                  <p className="text-xs text-[#5E4F43] mb-4">
                    Nonaktifkan fitur yang tidak diperlukan pada undangan Anda (misalnya menyembunyikan rekening hadiah).
                  </p>

                  <div className="divide-y divide-stone-200 border border-stone-200 rounded-xl overflow-hidden">
                    {featureItems.map((item) => {
                      const enabled = config.features[item.key];
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => toggleFeature(item.key)}
                          className="w-full p-4 bg-white hover:bg-stone-50/70 flex items-center justify-between gap-4 text-left transition-colors"
                        >
                          <div>
                            <p className="text-sm font-semibold text-[#241C16]">
                              {item.label}
                            </p>
                            <p className="text-xs text-[#5E4F43] mt-0.5">
                              {item.desc}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold ${
                              enabled ? 'text-emerald-800' : 'text-stone-400'
                            }`}
                          >
                            {enabled ? (
                              <>
                                <ToggleRight className="w-7 h-7 text-emerald-700" />
                                <span className="hidden sm:inline">Tampil</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-7 h-7 text-stone-400" />
                                <span className="hidden sm:inline">Sembunyi</span>
                              </>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {config.features.showGifts && (
                  <div className="space-y-3 pt-2 border-t border-stone-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-[#241C16]">
                        Daftar Rekening / Dompet Digital
                      </h2>
                      <button
                        type="button"
                        onClick={() =>
                          onChange((p) => ({
                            ...p,
                            gifts: [
                              ...p.gifts,
                              {
                                id: `gift-${Date.now()}`,
                                bank: 'Bank Baru',
                                accountNumber: '0000000000',
                                accountHolder:
                                  p.couple.brideFull || p.primaryPerson.fullName,
                              },
                            ],
                          }))
                        }
                        className="min-h-[38px] px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Rekening</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {config.gifts.map((gift, idx) => (
                        <div
                          key={gift.id}
                          className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={gift.bank}
                              onChange={(e) =>
                                onChange((p) => {
                                  const next = [...p.gifts];
                                  next[idx] = { ...next[idx], bank: e.target.value };
                                  return { ...p, gifts: next };
                                })
                              }
                              placeholder="Nama Bank / E-Wallet"
                              className="flex-1 min-h-[38px] px-3 rounded-lg border border-stone-300 bg-white text-xs font-semibold"
                            />
                            <button
                              type="button"
                              aria-label="Hapus rekening"
                              onClick={() =>
                                onChange((p) => ({
                                  ...p,
                                  gifts: p.gifts.filter((g) => g.id !== gift.id),
                                }))
                              }
                              className="min-w-[38px] min-h-[38px] rounded-lg border border-red-200 bg-white text-red-700 flex items-center justify-center"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input
                              type="text"
                              value={gift.accountNumber}
                              onChange={(e) =>
                                onChange((p) => {
                                  const next = [...p.gifts];
                                  next[idx] = {
                                    ...next[idx],
                                    accountNumber: e.target.value,
                                  };
                                  return { ...p, gifts: next };
                                })
                              }
                              placeholder="Nomor Rekening"
                              className="min-h-[38px] px-3 rounded-lg border border-stone-300 bg-white text-xs tabular-nums"
                            />
                            <input
                              type="text"
                              value={gift.accountHolder}
                              onChange={(e) =>
                                onChange((p) => {
                                  const next = [...p.gifts];
                                  next[idx] = {
                                    ...next[idx],
                                    accountHolder: e.target.value,
                                  };
                                  return { ...p, gifts: next };
                                })
                              }
                              placeholder="Atas Nama"
                              className="min-h-[38px] px-3 rounded-lg border border-stone-300 bg-white text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: LIVE PREVIEW */}
        <div
          className={`lg:col-span-6 ${
            mobileShowPreview ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-200 bg-stone-50 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#5E4F43]">
                Pratinjau Langsung
              </span>
              <button
                type="button"
                onClick={() => setPreviewCoverOpen((v) => !v)}
                className="text-xs font-semibold text-[#9E7328] hover:underline"
              >
                {previewCoverOpen ? 'Lihat Sampul Depan' : 'Masuk ke Isi Undangan'}
              </button>
            </div>

            <div className="h-[70vh] overflow-y-auto relative">
              <InvitationPreview
                config={config}
                guestName="Bapak Ahmad Fauzi"
                embedded={true}
                startOpened={previewCoverOpen}
                invitationId={invitationId}
                invitationOwnerId={invitationOwnerId}
                currentUserUid={user?.uid || null}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Explicit Confirmation Modal for Deleting Google Drive Media */}
      {pendingDeleteDriveFile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="drive-delete-modal-title"
          className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <h3
                id="drive-delete-modal-title"
                className="font-serif text-xl font-semibold text-[#241C16]"
              >
                Hapus File Google Drive?
              </h3>
              <button
                type="button"
                aria-label="Tutup dialog"
                onClick={() => setPendingDeleteDriveFile(null)}
                disabled={isDeletingDriveFile}
                className="min-w-[36px] min-h-[36px] rounded-lg hover:bg-stone-100 flex items-center justify-center text-[#5E4F43]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-[#5E4F43] leading-relaxed">
              Apakah Anda yakin ingin menghapus{' '}
              <strong className="text-[#241C16]">
                &ldquo;{pendingDeleteDriveFile.name}&rdquo;
              </strong>{' '}
              secara permanen dari Google Drive Anda? Jika masih dipakai di undangan, foto atau media terkait tidak akan tampil lagi bagi tamu.
            </p>
            <div className="flex flex-wrap justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingDeleteDriveFile(null)}
                disabled={isDeletingDriveFile}
                className="min-h-[42px] px-4 py-2 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm font-semibold text-[#241C16] hover:bg-stone-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDeleteDriveFile()}
                disabled={isDeletingDriveFile}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-red-700 text-white text-xs sm:text-sm font-semibold hover:bg-red-800 disabled:opacity-60"
              >
                {isDeletingDriveFile ? 'Menghapus...' : 'Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
