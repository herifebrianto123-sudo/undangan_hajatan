import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { ArrowLeft, Send, SlidersHorizontal } from 'lucide-react';
import AdminPanelView from './components/AdminPanelView';
import EditorView, { CloudSyncStatus } from './components/EditorView';
import InvitationPreview from './components/InvitationPreview';
import ShareAndPayView from './components/ShareAndPayView';
import ThemeCatalogView from './components/ThemeCatalogView';
import {
  auth,
  signInWithGoogleWorkspace,
  signOutFirebaseAndDrive,
  subscribeDriveTokenState,
} from './firebase';
import {
  addGuestsToDb,
  adminSetInvitationActivation,
  DEFAULT_BILLING_SETTINGS,
  getPublishedInvitationById,
  isAdminUser,
  loadOrCreateUserInvitation,
  removeGuestFromDb,
  saveInvitationConfigToDb,
  StoredInvitationRecord,
  submitClientOrderRequest,
  subscribeBillingSettings,
  subscribeInvitationGuests,
  subscribeInvitationRecord,
  upsertUserProfile,
} from './services/invitationDb';
import {
  BackgroundPaletteId,
  BillingSettings,
  EventCategory,
  GuestInviteEntry,
  InvitationConfig,
  PackageId,
  PaymentState,
  ThemeId,
} from './types/invitation';
import {
  createConfigForCategoryAndTheme,
  createDefaultInvitationConfig,
} from './utils/themePresets';

type StudioView = 'catalog' | 'demo' | 'editor' | 'share' | 'admin';

const CONFIG_STORAGE_KEY = 'undangan_studio_config_v4';
const GUESTS_STORAGE_KEY = 'undangan_studio_guests_v3';
const PAYMENT_STORAGE_KEY = 'undangan_studio_payment_v3';

const INITIAL_GUESTS: GuestInviteEntry[] = [
  { id: 'g-1', name: 'Bapak H. Ahmad Fauzi & Keluarga', createdAt: Date.now() - 300000 },
  { id: 'g-2', name: 'Ibu Kartini & Suami', createdAt: Date.now() - 180000 },
];

function mergeWithFallbackConfig(parsed: Partial<InvitationConfig>): InvitationConfig {
  const fallback = createDefaultInvitationConfig();
  return {
    ...fallback,
    ...parsed,
    couple: { ...fallback.couple, ...(parsed.couple || {}) },
    primaryPerson: {
      ...fallback.primaryPerson,
      ...(parsed.primaryPerson || {}),
    },
    images: { ...fallback.images, ...(parsed.images || {}) },
    video: { ...fallback.video, ...(parsed.video || {}) },
    music: { ...fallback.music, ...(parsed.music || {}) },
    features: { ...fallback.features, ...(parsed.features || {}) },
  };
}

export default function App() {
  const urlInfo = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const inv = params.get('inv');
    const to = params.get('to');
    const isGuestLink = params.get('guest') === '1';
    return {
      invId: inv && inv.trim().length > 0 ? inv.trim() : null,
      guestName: to && to.trim().length > 0 ? to.trim().slice(0, 80) : 'Tamu Undangan',
      isGuestLink,
    };
  }, []);

  const [config, setConfig] = useState<InvitationConfig>(() => {
    const fallback = createDefaultInvitationConfig();
    try {
      const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<InvitationConfig>;
        return mergeWithFallbackConfig(parsed);
      }
    } catch {
      // Ignore storage errors
    }
    return fallback;
  });

  const [guests, setGuests] = useState<GuestInviteEntry[]>(() => {
    try {
      const raw = localStorage.getItem(GUESTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GuestInviteEntry[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return INITIAL_GUESTS;
  });

  const [payment, setPayment] = useState<PaymentState>(() => {
    try {
      const raw = localStorage.getItem(PAYMENT_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as PaymentState;
      }
    } catch {
      // Ignore storage errors
    }
    return {
      isPaid: false,
      paymentStatus: 'unpaid',
      packageName: 'Edit Sendiri',
      amount: DEFAULT_BILLING_SETTINGS.selfEditPrice,
      method: '',
    };
  });

  const [billingSettings, setBillingSettings] = useState<BillingSettings>(
    DEFAULT_BILLING_SETTINGS
  );
  const [view, setView] = useState<StudioView>(
    urlInfo.isGuestLink ? 'demo' : 'catalog'
  );
  const [demoGuestName, setDemoGuestName] = useState<string>(urlInfo.guestName);

  // Firebase Auth & Firestore creator state
  const [user, setUser] = useState<User | null>(null);
  const [hasDriveAccess, setHasDriveAccess] = useState(false);
  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [invitationOwnerId, setInvitationOwnerId] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>('local');
  const [isBusy, setIsBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Public guest link loading state
  const [guestInvitation, setGuestInvitation] = useState<StoredInvitationRecord | null>(null);
  const [guestLoading, setGuestLoading] = useState<boolean>(
    Boolean(urlInfo.isGuestLink && urlInfo.invId)
  );
  const [guestError, setGuestError] = useState<string | null>(
    urlInfo.isGuestLink && !urlInfo.invId
      ? 'Link undangan tidak valid atau belum memiliki ID undangan.'
      : null
  );

  const configRef = useRef<InvitationConfig>(config);
  configRef.current = config;
  const skipNextCloudSaveRef = useRef(false);

  // Subscribe to dynamic Admin billing settings (prices, WA, bank accounts)
  useEffect(() => {
    return subscribeBillingSettings(setBillingSettings);
  }, []);

  // Load published & paid invitation if opened as a shared guest link (?inv=...&guest=1)
  useEffect(() => {
    if (!urlInfo.isGuestLink || !urlInfo.invId) return;
    let cancelled = false;
    setGuestLoading(true);
    setGuestError(null);

    getPublishedInvitationById(urlInfo.invId)
      .then((record) => {
        if (cancelled) return;
        if (!record) {
          setGuestError(
            'Undangan ini belum tersedia atau belum diaktifkan oleh pemilik acara.'
          );
        } else {
          setGuestInvitation({
            ...record,
            config: mergeWithFallbackConfig(record.config),
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGuestError('Gagal memuat data undangan. Silakan muat ulang halaman.');
        }
      })
      .finally(() => {
        if (!cancelled) setGuestLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [urlInfo.isGuestLink, urlInfo.invId]);

  useEffect(() => {
    return subscribeDriveTokenState(setHasDriveAccess);
  }, []);

  // Listen for Firebase Auth state & load user's invitation
  useEffect(() => {
    if (urlInfo.isGuestLink) return;
    let activeSyncUid: string | null = null;
    let cancelled = false;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        activeSyncUid = null;
        setUser(null);
        setInvitationId(null);
        setInvitationOwnerId(null);
        setCloudStatus('local');
        setView((prev) => (prev === 'admin' ? 'catalog' : prev));
        return;
      }

      if (activeSyncUid === firebaseUser.uid) {
        return;
      }
      activeSyncUid = firebaseUser.uid;

      setUser(firebaseUser);
      setAuthError(null);
      setCloudStatus('saving');
      setIsBusy(true);

      try {
        await upsertUserProfile(firebaseUser);
        const record = await loadOrCreateUserInvitation(
          firebaseUser,
          configRef.current
        );
        if (cancelled) return;
        skipNextCloudSaveRef.current = true;
        setConfig(mergeWithFallbackConfig(record.config));
        setInvitationId(record.invitationId);
        setInvitationOwnerId(record.ownerId);
        setPayment({
          isPaid: record.isPaid,
          paymentStatus: record.paymentStatus,
          packageId: record.packageId,
          packageName: record.packageName || 'Edit Sendiri',
          amount:
            typeof record.amount === 'number'
              ? record.amount
              : DEFAULT_BILLING_SETTINGS.selfEditPrice,
          method: record.paymentMethod,
          paidAt: record.paidAtMs,
          invoiceCode: record.invoiceCode,
        });
        setCloudStatus('saved');
      } catch {
        activeSyncUid = null;
        if (!cancelled) setCloudStatus('error');
      } finally {
        if (!cancelled) setIsBusy(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribeAuth();
    };
  }, [urlInfo.isGuestLink]);

  // Real-time guest list subscription for active invitation (supports Admin editing client invitations)
  useEffect(() => {
    if (urlInfo.isGuestLink || !user || !invitationId || !invitationOwnerId) {
      return;
    }
    return subscribeInvitationGuests(
      invitationId,
      invitationOwnerId,
      (cloudGuests) => {
        setGuests(cloudGuests);
      }
    );
  }, [urlInfo.isGuestLink, user, invitationId, invitationOwnerId]);

  // Real-time payment/activation status listener so client unlocks immediately when Admin approves
  useEffect(() => {
    if (urlInfo.isGuestLink || !user || !invitationId) return;
    return subscribeInvitationRecord(invitationId, (record) => {
      setPayment((prev) => ({
        ...prev,
        isPaid: record.isPaid,
        paymentStatus: record.paymentStatus,
        packageId: record.packageId || prev.packageId,
        packageName: record.packageName || prev.packageName,
        amount:
          typeof record.amount === 'number' ? record.amount : prev.amount,
        method: record.paymentMethod || prev.method,
        paidAt: record.paidAtMs,
        invoiceCode: record.invoiceCode || prev.invoiceCode,
      }));
    });
  }, [urlInfo.isGuestLink, user, invitationId]);

  // LocalStorage draft persistence
  useEffect(() => {
    if (urlInfo.isGuestLink) return;
    try {
      const safeConfig: InvitationConfig = {
        ...config,
        video: config.video.src.startsWith('blob:')
          ? { ...config.video, src: '' }
          : config.video,
        music: config.music.customUrl.startsWith('blob:')
          ? {
              mode: 'builtin',
              customUrl: '',
              label: 'Musik Instrumental Lembut (Bawaan)',
            }
          : config.music,
      };
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(safeConfig));
    } catch {
      // Ignore quota exceeded
    }
  }, [config, urlInfo.isGuestLink]);

  // Debounced Firestore auto-save when signed in
  useEffect(() => {
    if (urlInfo.isGuestLink || !user || !invitationId) return;
    if (skipNextCloudSaveRef.current) {
      skipNextCloudSaveRef.current = false;
      return;
    }

    setCloudStatus('saving');
    const timer = window.setTimeout(async () => {
      try {
        await saveInvitationConfigToDb(invitationId, config);
        setCloudStatus('saved');
      } catch {
        setCloudStatus('error');
      }
    }, 900);

    return () => window.clearTimeout(timer);
  }, [config, user, invitationId, urlInfo.isGuestLink]);

  useEffect(() => {
    if (user || urlInfo.isGuestLink) return;
    try {
      localStorage.setItem(GUESTS_STORAGE_KEY, JSON.stringify(guests));
    } catch {
      // Ignore storage errors
    }
  }, [guests, user, urlInfo.isGuestLink]);

  useEffect(() => {
    if (user || urlInfo.isGuestLink) return;
    try {
      localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(payment));
    } catch {
      // Ignore storage errors
    }
  }, [payment, user, urlInfo.isGuestLink]);

  const handleSignInGoogle = async () => {
    setIsBusy(true);
    setAuthError(null);
    try {
      await signInWithGoogleWorkspace();
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code?: string }).code || '')
          : '';
      const host = window.location.hostname || 'domain ini';
      if (code === 'auth/unauthorized-domain') {
        setAuthError(
          `Login Google belum diizinkan untuk domain "${host}". Tambahkan "${host}" ke daftar Authorized Domains di pengaturan autentikasi proyek dan Authorized JavaScript Origins OAuth, lalu coba lagi.`
        );
      } else if (code === 'auth/popup-blocked') {
        setAuthError(
          'Jendela pop-up login diblokir oleh browser. Izinkan pop-up untuk situs ini lalu klik Masuk dengan Google kembali.'
        );
      } else if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      ) {
        setAuthError(
          'Proses masuk dengan Google ditutup sebelum selesai. Silakan coba lagi.'
        );
      } else {
        setAuthError(
          'Gagal masuk dengan akun Google. Pastikan pop-up diizinkan dan domain situs sudah terdaftar.'
        );
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleSignOut = async () => {
    setIsBusy(true);
    setAuthError(null);
    try {
      await signOutFirebaseAndDrive();
    } finally {
      setIsBusy(false);
    }
  };

  const applyThemeSelection = (
    category: EventCategory,
    themeId: ThemeId,
    paletteId: BackgroundPaletteId
  ) => {
    setConfig((prev) => {
      if (prev.category !== category) {
        return createConfigForCategoryAndTheme(category, themeId, paletteId);
      }
      return {
        ...prev,
        themeId,
        paletteId,
      };
    });
  };

  const handlePreviewDemo = (
    category: EventCategory,
    themeId: ThemeId,
    paletteId: BackgroundPaletteId
  ) => {
    applyThemeSelection(category, themeId, paletteId);
    setDemoGuestName(urlInfo.guestName);
    setView('demo');
    window.scrollTo({ top: 0 });
  };

  const handleEditTheme = (
    category: EventCategory,
    themeId: ThemeId,
    paletteId: BackgroundPaletteId
  ) => {
    applyThemeSelection(category, themeId, paletteId);
    setView('editor');
    window.scrollTo({ top: 0 });
  };

  const handleSubmitOrder = async (payload: {
    packageId: PackageId;
    packageName: string;
    amount: number;
    paymentMethod: string;
    invoiceCode: string;
    whatsapp: string;
    notes: string;
  }) => {
    if (!user || !invitationId) return;
    setIsBusy(true);
    try {
      await saveInvitationConfigToDb(invitationId, config);
      const nextPayment = await submitClientOrderRequest({
        invitationId,
        user,
        ...payload,
      });
      setPayment(nextPayment);
      setCloudStatus('saved');
    } finally {
      setIsBusy(false);
    }
  };

  const handleAddGuests = async (names: string[]) => {
    if (user && invitationId) {
      setIsBusy(true);
      try {
        await addGuestsToDb(invitationId, invitationOwnerId || user.uid, names);
      } finally {
        setIsBusy(false);
      }
      return;
    }

    const entries: GuestInviteEntry[] = names.map((name, idx) => ({
      id: `guest-${Date.now()}-${idx}`,
      name,
      createdAt: Date.now(),
    }));
    setGuests((prev) => [...entries, ...prev]);
  };

  const handleRemoveGuest = async (id: string) => {
    if (user && invitationId) {
      await removeGuestFromDb(invitationId, id);
      return;
    }
    setGuests((prev) => prev.filter((g) => g.id !== id));
  };

  // Public Guest View (?guest=1)
  if (urlInfo.isGuestLink) {
    if (guestLoading) {
      return (
        <div className="min-h-screen bg-[#FAF6EE] text-[#241C16] flex items-center justify-center p-6 text-center">
          <div className="space-y-2">
            <p className="font-serif text-2xl font-semibold">Undangan Digital</p>
            <p className="text-sm text-[#5E4F43]">Memuat undangan untuk Anda...</p>
          </div>
        </div>
      );
    }

    if (guestError) {
      return (
        <div className="min-h-screen bg-[#FAF6EE] text-[#241C16] flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white border border-stone-200 rounded-2xl p-8 space-y-3">
            <p className="font-serif text-2xl font-semibold">Undangan Tidak Tersedia</p>
            <p className="text-sm text-[#5E4F43]">{guestError}</p>
          </div>
        </div>
      );
    }

    return (
      <InvitationPreview
        config={guestInvitation ? guestInvitation.config : config}
        guestName={urlInfo.guestName}
        startOpened={false}
        invitationId={guestInvitation ? guestInvitation.invitationId : null}
        invitationOwnerId={guestInvitation ? guestInvitation.ownerId : null}
        currentUserUid={user?.uid || null}
      />
    );
  }

  if (view === 'demo') {
    return (
      <div className="min-h-screen relative">
        <div className="sticky top-0 z-[60] h-12 px-4 sm:px-6 bg-[#231A14]/95 text-[#FAF6EE] border-b border-[#D8B26A]/30 backdrop-blur-md flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setView('catalog')}
            className="min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-white/10 flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Katalog</span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setView('editor')}
              className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#D8B26A]/50 text-[#D8B26A] text-xs font-semibold hover:bg-[#D8B26A]/10 flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Edit Undangan</span>
            </button>

            <button
              type="button"
              onClick={() => setView('share')}
              className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-[#D8B26A] text-[#231A14] text-xs font-semibold hover:bg-[#E4C27D] flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Bagikan</span>
            </button>
          </div>
        </div>

        <InvitationPreview
          config={config}
          guestName={demoGuestName}
          startOpened={false}
          invitationId={invitationId}
          invitationOwnerId={invitationOwnerId}
          currentUserUid={user?.uid || null}
        />
      </div>
    );
  }

  const userIsAdmin = isAdminUser(user);

  const handleAdminEditInvitation = (record: StoredInvitationRecord) => {
    skipNextCloudSaveRef.current = true;
    setConfig(mergeWithFallbackConfig(record.config));
    setInvitationId(record.invitationId);
    setInvitationOwnerId(record.ownerId);
    setPayment({
      isPaid: record.isPaid,
      paymentStatus: record.paymentStatus,
      packageId: record.packageId,
      packageName: record.packageName || billingSettings.selfEditTitle,
      amount:
        typeof record.amount === 'number'
          ? record.amount
          : billingSettings.selfEditPrice,
      method: record.paymentMethod,
      paidAt: record.paidAtMs,
      invoiceCode: record.invoiceCode,
    });
    setCloudStatus('saved');
    setView('editor');
    window.scrollTo({ top: 0 });
  };

  const handleAdminQuickActivate = async () => {
    if (!user || !userIsAdmin || !invitationId) return;
    setIsBusy(true);
    try {
      await saveInvitationConfigToDb(invitationId, config);
      const nextInvoice =
        payment.invoiceCode || `ADM-${String(Date.now()).slice(-6)}`;
      const nextMethod = payment.method || 'Aktivasi Admin';
      const nextPackageId = payment.packageId || 'admin-assisted';
      const nextPackageName =
        payment.packageName || billingSettings.adminAssistedTitle;
      const nextAmount =
        typeof payment.amount === 'number' && payment.amount > 0
          ? payment.amount
          : billingSettings.adminAssistedPrice;
      await adminSetInvitationActivation({
        invitationId,
        isPaid: true,
        packageId: nextPackageId,
        packageName: nextPackageName,
        amount: nextAmount,
        paymentMethod: nextMethod,
        invoiceCode: nextInvoice,
      });
      setPayment({
        isPaid: true,
        paymentStatus: 'paid',
        packageId: nextPackageId,
        packageName: nextPackageName,
        amount: nextAmount,
        method: nextMethod,
        paidAt: Date.now(),
        invoiceCode: nextInvoice,
      });
      setCloudStatus('saved');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#241C16]">
      <header className="sticky top-0 z-40 bg-[#FAF6EE]/95 backdrop-blur-md border-b border-[#9E7328]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setView('catalog')}
            className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#241C16] whitespace-nowrap shrink-0"
          >
            Undangan Studio
          </button>

          <nav
            aria-label="Navigasi Studio"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5E4F43]"
          >
            <button
              type="button"
              onClick={() => setView('catalog')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                view === 'catalog'
                  ? 'text-[#241C16] font-semibold underline underline-offset-8 decoration-[#9E7328]'
                  : 'hover:text-[#241C16]'
              }`}
            >
              Tema &amp; Kategori
            </button>
            <button
              type="button"
              onClick={() => setView('demo')}
              className="hover:text-[#241C16] transition-colors whitespace-nowrap shrink-0"
            >
              Lihat Demo
            </button>
            <button
              type="button"
              onClick={() => setView('editor')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                view === 'editor'
                  ? 'text-[#241C16] font-semibold underline underline-offset-8 decoration-[#9E7328]'
                  : 'hover:text-[#241C16]'
              }`}
            >
              Edit Undangan
            </button>
            <button
              type="button"
              onClick={() => setView('share')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                view === 'share'
                  ? 'text-[#241C16] font-semibold underline underline-offset-8 decoration-[#9E7328]'
                  : 'hover:text-[#241C16]'
              }`}
            >
              Bagikan Tamu
            </button>
            {userIsAdmin && (
              <button
                type="button"
                onClick={() => setView('admin')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  view === 'admin'
                    ? 'text-[#241C16] font-semibold underline underline-offset-8 decoration-[#9E7328]'
                    : 'hover:text-[#241C16]'
                }`}
              >
                Panel Admin
              </button>
            )}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setView('share')}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#231A14] text-[#FAF6EE] text-xs font-semibold hover:bg-[#382A20] transition-colors whitespace-nowrap shrink-0"
            >
              {payment.isPaid ? 'Bagikan Link' : 'Aktifkan & Bagikan'}
            </button>
          </div>
        </div>

        <div
          className={`md:hidden border-t border-[#9E7328]/15 px-3 py-1.5 grid gap-1 bg-[#FAF6EE] ${
            userIsAdmin ? 'grid-cols-5' : 'grid-cols-4'
          }`}
        >
          {[
            { id: 'catalog', label: 'Tema' },
            { id: 'demo', label: 'Demo' },
            { id: 'editor', label: 'Edit' },
            { id: 'share', label: 'Bagikan' },
            ...(userIsAdmin ? [{ id: 'admin', label: 'Admin' }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id as StudioView)}
              className={`min-h-[38px] rounded-lg text-xs font-semibold transition-colors ${
                view === tab.id
                  ? 'bg-[#231A14] text-[#FAF6EE]'
                  : 'text-[#5E4F43] hover:bg-stone-200/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {authError && view !== 'share' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div
            role="alert"
            className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start justify-between gap-4 text-xs sm:text-sm text-red-800"
          >
            <p className="leading-relaxed">{authError}</p>
            <button
              type="button"
              onClick={() => setAuthError(null)}
              className="text-xs font-semibold text-red-900 underline shrink-0"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {view === 'catalog' && (
        <ThemeCatalogView
          config={config}
          onSelectPalette={(paletteId) =>
            setConfig((prev) => ({ ...prev, paletteId }))
          }
          onPreviewDemo={handlePreviewDemo}
          onEditTheme={handleEditTheme}
          onUpdateCustomBg={(hex, enabled) =>
            setConfig((prev) => ({
              ...prev,
              customBgColor: hex,
              useCustomBg: enabled,
            }))
          }
        />
      )}

      {view === 'editor' && (
        <EditorView
          config={config}
          user={user}
          hasDriveAccess={hasDriveAccess}
          cloudStatus={cloudStatus}
          invitationId={invitationId}
          invitationOwnerId={invitationOwnerId}
          onSignInGoogle={handleSignInGoogle}
          onConnectDrive={handleSignInGoogle}
          onChange={setConfig}
          onGoToShare={() => {
            setView('share');
            window.scrollTo({ top: 0 });
          }}
          onOpenFullDemo={() => {
            setDemoGuestName(urlInfo.guestName);
            setView('demo');
            window.scrollTo({ top: 0 });
          }}
        />
      )}

      {view === 'share' && (
        <ShareAndPayView
          config={config}
          payment={payment}
          billingSettings={billingSettings}
          guests={guests}
          user={user}
          isAdmin={userIsAdmin}
          invitationId={invitationId}
          isBusy={isBusy}
          authError={authError}
          onSignInGoogle={handleSignInGoogle}
          onSignOut={handleSignOut}
          onAdminQuickActivate={userIsAdmin ? handleAdminQuickActivate : undefined}
          onSubmitOrder={handleSubmitOrder}
          onAddGuests={handleAddGuests}
          onRemoveGuest={handleRemoveGuest}
          onPreviewAsGuest={(name) => {
            setDemoGuestName(name);
            setView('demo');
            window.scrollTo({ top: 0 });
          }}
          onOpenAdminPanel={() => {
            setView('admin');
            window.scrollTo({ top: 0 });
          }}
          onBackToEditor={() => setView('editor')}
        />
      )}

      {view === 'admin' && user && userIsAdmin && (
        <AdminPanelView
          user={user}
          billingSettings={billingSettings}
          activeInvitationId={invitationId}
          onEditInvitation={handleAdminEditInvitation}
          onBackToStudio={() => {
            setView('editor');
            window.scrollTo({ top: 0 });
          }}
        />
      )}
    </div>
  );
}
