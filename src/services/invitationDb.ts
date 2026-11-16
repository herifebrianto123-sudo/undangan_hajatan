import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  BackgroundPaletteId,
  BillingSettings,
  GuestInviteEntry,
  InvitationConfig,
  OrderRecord,
  PackageId,
  PaymentAccountItem,
  PaymentState,
  PaymentStatus,
  ThemeId,
} from '../types/invitation';
import { GuestWish } from '../utils/weddingData';

export const ADMIN_EMAIL = 'herifebrianto123@gmail.com';

export function isAdminUser(user: User | null): boolean {
  if (!user || !user.email) return false;
  return (
    user.emailVerified && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );
}

export const DEFAULT_BILLING_SETTINGS: BillingSettings = {
  selfEditTitle: 'Edit Sendiri',
  selfEditDesc:
    'Anda mengisi teks, jadwal acara, dan unggah foto/video ke Google Drive sendiri di Editor Studio. Setelah transfer dikonfirmasi Admin, fitur Daftar Tamu & link undangan otomatis aktif.',
  selfEditPrice: 90000,
  adminAssistedTitle: 'Admin yang Editkan (Terima Beres)',
  adminAssistedDesc:
    'Cukup kirim teks acara dan foto/video Anda via WhatsApp. Admin yang bantu rapikan desain, isi teks, dan unggahkan media ke Drive sampai undangan siap sebar.',
  adminAssistedPrice: 120000,
  adminWhatsapp: '',
  paymentAccounts: [
    {
      id: 'acc-bca',
      label: 'Transfer Bank BCA',
      accountNumber: 'Atur nomor rekening di Panel Admin',
      accountName: 'Heri Febrianto',
      notes: 'Transfer sesuai nominal paket, lalu kirim bukti via WhatsApp.',
      isActive: true,
    },
    {
      id: 'acc-ewallet',
      label: 'DANA / GoPay / QRIS',
      accountNumber: 'Atur nomor E-Wallet di Panel Admin',
      accountName: 'Heri Febrianto',
      notes: 'Cantumkan kode invoice pada catatan transfer.',
      isActive: true,
    },
  ],
};

export interface StoredInvitationRecord {
  invitationId: string;
  ownerId: string;
  isPublished: boolean;
  isPaid: boolean;
  paymentStatus: PaymentStatus;
  packageId?: PackageId;
  packageName?: string;
  amount?: number;
  paymentMethod: string;
  invoiceCode: string;
  paidAtMs?: number;
  updatedAtMs?: number;
  config: InvitationConfig;
}

function clampStr(val: unknown, max: number, fallback = ''): string {
  if (typeof val !== 'string') return fallback;
  return val.slice(0, max);
}

function timestampToMs(ts: unknown): number {
  if (ts instanceof Timestamp) return ts.toMillis();
  if (typeof ts === 'number') return ts;
  return Date.now();
}

const VALID_CATEGORIES = new Set([
  'pernikahan',
  'ulang-tahun',
  'khitanan',
  'syukuran',
  'kelahiran',
]);

export function sanitizeConfigForFirestore(
  cfg: InvitationConfig
): InvitationConfig {
  const safeHeroImg = clampStr(cfg.images.hero, 340000);
  const safeBrideImg = clampStr(cfg.images.bride, 340000);
  const safeGroomImg = clampStr(cfg.images.groom, 340000);
  const safeCategory = VALID_CATEGORIES.has(cfg.category)
    ? cfg.category
    : 'pernikahan';

  const rawEvents =
    Array.isArray(cfg.events) && cfg.events.length > 0
      ? cfg.events
      : [
          {
            id: 'acara-utama',
            title: 'Acara Utama',
            subTitle: 'Rangkaian Acara',
            dayDate:
              clampStr(cfg.coverDateText, 120) || 'Sabtu, 19 Desember 2026',
            time: '09.00 – 12.00 WIB',
            venue: 'Lokasi Acara',
            address: 'Indonesia',
            dressCode: 'Bebas Rapi',
            mapsUrl: 'https://maps.google.com/?q=Indonesia',
          },
        ];

  return {
    category: safeCategory,
    themeId: (clampStr(cfg.themeId, 80) || 'keraton-klasik') as ThemeId,
    paletteId: (clampStr(cfg.paletteId, 80) ||
      'cream-sogan') as BackgroundPaletteId,
    customBgColor: clampStr(cfg.customBgColor, 32, '#FAF6EE'),
    useCustomBg: Boolean(cfg.useCustomBg),
    targetDateISO: clampStr(
      cfg.targetDateISO,
      64,
      '2026-12-19T08:00:00+07:00'
    ),
    coverKicker: clampStr(cfg.coverKicker, 160),
    coverTitle: clampStr(cfg.coverTitle, 160) || 'Undangan Digital',
    coverDateText: clampStr(cfg.coverDateText, 160),
    heroKicker: clampStr(cfg.heroKicker, 160),
    heroSubtitle: clampStr(cfg.heroSubtitle, 500),
    openingGreeting: clampStr(cfg.openingGreeting, 200),
    openingIntro: clampStr(cfg.openingIntro, 800),
    quoteText: clampStr(cfg.quoteText, 800),
    quoteSource: clampStr(cfg.quoteSource, 200),
    couple: {
      brideNick: clampStr(cfg.couple.brideNick, 80),
      groomNick: clampStr(cfg.couple.groomNick, 80),
      brideFull: clampStr(cfg.couple.brideFull, 160),
      brideParents: clampStr(cfg.couple.brideParents, 300),
      brideOrigin: clampStr(cfg.couple.brideOrigin, 120),
      groomFull: clampStr(cfg.couple.groomFull, 160),
      groomParents: clampStr(cfg.couple.groomParents, 300),
      groomOrigin: clampStr(cfg.couple.groomOrigin, 120),
    },
    primaryPerson: {
      roleLabel: clampStr(cfg.primaryPerson.roleLabel, 120),
      fullName: clampStr(cfg.primaryPerson.fullName, 160),
      subBadge: clampStr(cfg.primaryPerson.subBadge, 120),
      parentsOrHost: clampStr(cfg.primaryPerson.parentsOrHost, 300),
      origin: clampStr(cfg.primaryPerson.origin, 120),
    },
    images: {
      hero: safeHeroImg,
      bride: safeBrideImg,
      groom: safeGroomImg,
    },
    gallery: cfg.gallery.slice(0, 12).map((item) => ({
      id: clampStr(item.id, 80) || `gal-${Date.now()}`,
      src: clampStr(item.src, 340000),
      caption: clampStr(item.caption, 200),
    })),
    video: {
      src: cfg.video.src.startsWith('blob:')
        ? ''
        : clampStr(cfg.video.src, 1000),
      caption: clampStr(cfg.video.caption, 200),
    },
    music: cfg.music.customUrl.startsWith('blob:')
      ? {
          mode: 'builtin',
          customUrl: '',
          label: 'Musik Instrumental Lembut (Bawaan)',
        }
      : {
          mode: cfg.music.mode === 'custom' ? 'custom' : 'builtin',
          customUrl: clampStr(cfg.music.customUrl, 1000),
          label:
            clampStr(cfg.music.label, 160) ||
            'Musik Instrumental Lembut (Bawaan)',
        },
    events: rawEvents.slice(0, 10).map((ev) => ({
      id: clampStr(ev.id, 80) || `ev-${Date.now()}`,
      title: clampStr(ev.title, 160) || 'Acara',
      subTitle: clampStr(ev.subTitle, 160),
      dayDate: clampStr(ev.dayDate, 120),
      time: clampStr(ev.time, 80),
      venue: clampStr(ev.venue, 160),
      address: clampStr(ev.address, 300),
      dressCode: clampStr(ev.dressCode, 120),
      mapsUrl: clampStr(ev.mapsUrl, 500),
    })),
    gifts: cfg.gifts.slice(0, 8).map((g) => ({
      id: clampStr(g.id, 80) || `gift-${Date.now()}`,
      bank: clampStr(g.bank, 80) || 'Bank',
      accountNumber: clampStr(g.accountNumber, 80),
      accountHolder: clampStr(g.accountHolder, 160),
    })),
    features: {
      showMusic: Boolean(cfg.features.showMusic),
      showCountdown: Boolean(cfg.features.showCountdown),
      showQuote: Boolean(cfg.features.showQuote),
      showGallery: Boolean(cfg.features.showGallery),
      showVideo: Boolean(cfg.features.showVideo),
      showRsvp: Boolean(cfg.features.showRsvp),
      showGifts: Boolean(cfg.features.showGifts),
    },
  };
}

function mapBillingDoc(raw: Record<string, unknown> | undefined): BillingSettings {
  if (!raw) return DEFAULT_BILLING_SETTINGS;
  const accountsRaw = Array.isArray(raw.paymentAccounts)
    ? raw.paymentAccounts
    : DEFAULT_BILLING_SETTINGS.paymentAccounts;

  const paymentAccounts: PaymentAccountItem[] = accountsRaw
    .slice(0, 15)
    .map((acc: unknown, idx: number) => {
      const item = (acc || {}) as Record<string, unknown>;
      return {
        id: clampStr(item.id, 64) || `acc-${idx + 1}`,
        label: clampStr(item.label, 80) || 'Rekening Bank',
        accountNumber: clampStr(item.accountNumber, 80),
        accountName: clampStr(item.accountName, 120),
        notes: clampStr(item.notes, 200),
        isActive: item.isActive !== false,
      };
    });

  return {
    selfEditTitle:
      clampStr(raw.selfEditTitle, 100) ||
      DEFAULT_BILLING_SETTINGS.selfEditTitle,
    selfEditDesc:
      clampStr(raw.selfEditDesc, 350) || DEFAULT_BILLING_SETTINGS.selfEditDesc,
    selfEditPrice:
      typeof raw.selfEditPrice === 'number' && raw.selfEditPrice >= 0
        ? Math.round(raw.selfEditPrice)
        : DEFAULT_BILLING_SETTINGS.selfEditPrice,
    adminAssistedTitle:
      clampStr(raw.adminAssistedTitle, 100) ||
      DEFAULT_BILLING_SETTINGS.adminAssistedTitle,
    adminAssistedDesc:
      clampStr(raw.adminAssistedDesc, 350) ||
      DEFAULT_BILLING_SETTINGS.adminAssistedDesc,
    adminAssistedPrice:
      typeof raw.adminAssistedPrice === 'number' && raw.adminAssistedPrice >= 0
        ? Math.round(raw.adminAssistedPrice)
        : DEFAULT_BILLING_SETTINGS.adminAssistedPrice,
    adminWhatsapp: clampStr(raw.adminWhatsapp, 32),
    paymentAccounts,
  };
}

function mapInvitationDoc(
  id: string,
  data: Record<string, unknown>
): StoredInvitationRecord {
  const isPaid = Boolean(data.isPaid);
  const rawStatus = data.paymentStatus;
  const paymentStatus: PaymentStatus =
    rawStatus === 'paid' || isPaid
      ? 'paid'
      : rawStatus === 'pending'
      ? 'pending'
      : 'unpaid';

  return {
    invitationId: id,
    ownerId: data.ownerId as string,
    isPublished: Boolean(data.isPublished),
    isPaid,
    paymentStatus,
    packageId:
      data.packageId === 'admin-assisted'
        ? 'admin-assisted'
        : data.packageId === 'self-edit'
        ? 'self-edit'
        : undefined,
    packageName: (data.packageName as string) || undefined,
    amount: typeof data.amount === 'number' ? data.amount : undefined,
    paymentMethod: (data.paymentMethod as string) || '',
    invoiceCode: (data.invoiceCode as string) || '',
    paidAtMs: data.paidAt ? timestampToMs(data.paidAt) : undefined,
    updatedAtMs: data.updatedAt ? timestampToMs(data.updatedAt) : undefined,
    config: data.config as InvitationConfig,
  };
}

export function subscribeBillingSettings(
  onUpdate: (settings: BillingSettings) => void
): () => void {
  const ref = doc(db, 'app_settings', 'billing');
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(DEFAULT_BILLING_SETTINGS);
        return;
      }
      onUpdate(mapBillingDoc(snap.data() as Record<string, unknown>));
    },
    () => {
      onUpdate(DEFAULT_BILLING_SETTINGS);
    }
  );
}

export async function saveBillingSettings(
  settings: BillingSettings,
  adminEmail: string
): Promise<void> {
  const path = 'app_settings/billing';
  try {
    const cleanAccounts = settings.paymentAccounts
      .slice(0, 15)
      .map((acc, idx) => ({
        id: clampStr(acc.id.trim(), 64) || `acc-${Date.now()}-${idx}`,
        label: clampStr(acc.label.trim(), 80) || 'Rekening Pembayaran',
        accountNumber: clampStr(acc.accountNumber.trim(), 80),
        accountName: clampStr(acc.accountName.trim(), 120),
        notes: clampStr(acc.notes.trim(), 200),
        isActive: Boolean(acc.isActive),
      }));

    await setDoc(doc(db, 'app_settings', 'billing'), {
      id: 'billing',
      selfEditTitle:
        clampStr(settings.selfEditTitle.trim(), 100) || 'Edit Sendiri',
      selfEditDesc: clampStr(settings.selfEditDesc.trim(), 350),
      selfEditPrice: Math.max(0, Math.round(Number(settings.selfEditPrice) || 0)),
      adminAssistedTitle:
        clampStr(settings.adminAssistedTitle.trim(), 100) ||
        'Admin yang Editkan',
      adminAssistedDesc: clampStr(settings.adminAssistedDesc.trim(), 350),
      adminAssistedPrice: Math.max(
        0,
        Math.round(Number(settings.adminAssistedPrice) || 0)
      ),
      adminWhatsapp: clampStr(settings.adminWhatsapp.replace(/[^\d]/g, ''), 32),
      paymentAccounts: cleanAccounts,
      updatedBy: clampStr(adminEmail, 200),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function upsertUserProfile(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  try {
    const existingSnap = await getDoc(ref);
    const payload = {
      uid: user.uid,
      displayName: clampStr(user.displayName || 'Pengguna Studio', 120),
      email: clampStr(user.email || '', 200),
      photoURL: clampStr(user.photoURL || '', 500),
      updatedAt: serverTimestamp(),
    };
    if (existingSnap.exists()) {
      await updateDoc(ref, {
        displayName: payload.displayName,
        email: payload.email,
        photoURL: payload.photoURL,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadOrCreateUserInvitation(
  user: User,
  fallbackConfig: InvitationConfig
): Promise<StoredInvitationRecord> {
  const collectionPath = 'invitations';
  let snap;
  try {
    const q = query(
      collection(db, collectionPath),
      where('ownerId', '==', user.uid)
    );
    snap = await getDocs(q);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }

  if (!snap.empty) {
    const sortedDocs = [...snap.docs].sort((a, b) => {
      const aMs = timestampToMs(a.data().updatedAt);
      const bMs = timestampToMs(b.data().updatedAt);
      return bMs - aMs;
    });
    const topDoc = sortedDocs[0];
    return mapInvitationDoc(
      topDoc.id,
      topDoc.data() as Record<string, unknown>
    );
  }

  const invitationId = `inv-${user.uid.slice(0, 10)}-${Date.now()}`;
  const docPath = `${collectionPath}/${invitationId}`;
  try {
    const safeConfig = sanitizeConfigForFirestore(fallbackConfig);
    const docRef = doc(db, collectionPath, invitationId);
    await setDoc(docRef, {
      id: invitationId,
      ownerId: user.uid,
      isPublished: false,
      isPaid: false,
      paymentStatus: 'unpaid',
      config: safeConfig,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      invitationId,
      ownerId: user.uid,
      isPublished: false,
      isPaid: false,
      paymentStatus: 'unpaid',
      paymentMethod: '',
      invoiceCode: '',
      config: safeConfig,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export function subscribeInvitationRecord(
  invitationId: string,
  onUpdate: (record: StoredInvitationRecord) => void
): () => void {
  const ref = doc(db, 'invitations', invitationId);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) return;
      onUpdate(
        mapInvitationDoc(snap.id, snap.data() as Record<string, unknown>)
      );
    },
    (error) => {
      handleFirestoreError(
        error,
        OperationType.GET,
        `invitations/${invitationId}`
      );
    }
  );
}

export async function getPublishedInvitationById(
  invitationId: string
): Promise<StoredInvitationRecord | null> {
  const path = `invitations/${invitationId}`;
  try {
    const snap = await getDoc(doc(db, 'invitations', invitationId));
    if (!snap.exists()) return null;
    const record = mapInvitationDoc(
      snap.id,
      snap.data() as Record<string, unknown>
    );
    if (!record.isPaid || !record.isPublished) {
      return null;
    }
    return record;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveInvitationConfigToDb(
  invitationId: string,
  config: InvitationConfig
): Promise<void> {
  const path = `invitations/${invitationId}`;
  try {
    const safeConfig = sanitizeConfigForFirestore(config);
    await updateDoc(doc(db, 'invitations', invitationId), {
      config: safeConfig,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function submitClientOrderRequest(params: {
  invitationId: string;
  user: User;
  packageId: PackageId;
  packageName: string;
  amount: number;
  paymentMethod: string;
  invoiceCode: string;
  whatsapp: string;
  notes: string;
}): Promise<PaymentState> {
  const invPath = `invitations/${params.invitationId}`;
  const orderId = `ord-${params.invitationId}`;
  const orderPath = `orders/${orderId}`;

  const cleanPkgName = clampStr(params.packageName.trim(), 120) || 'Edit Sendiri';
  const cleanMethod =
    clampStr(params.paymentMethod.trim(), 64) || 'Transfer Bank';
  const cleanInvoice =
    clampStr(params.invoiceCode.trim(), 64) ||
    `INV-${String(Date.now()).slice(-6)}`;
  const cleanAmount = Math.max(0, Math.round(params.amount));

  try {
    await updateDoc(doc(db, 'invitations', params.invitationId), {
      paymentStatus: 'pending',
      packageId: params.packageId,
      packageName: cleanPkgName,
      amount: cleanAmount,
      paymentMethod: cleanMethod,
      invoiceCode: cleanInvoice,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, invPath);
  }

  try {
    const orderRef = doc(db, 'orders', orderId);
    const existingOrder = await getDoc(orderRef);
    const baseFields = {
      ownerName: clampStr(params.user.displayName || 'Klien Studio', 120),
      ownerEmail: clampStr(params.user.email || '', 200),
      whatsapp: clampStr(params.whatsapp.trim(), 32),
      packageId: params.packageId,
      packageName: cleanPkgName,
      amount: cleanAmount,
      paymentMethod: cleanMethod,
      invoiceCode: cleanInvoice,
      notes: clampStr(params.notes.trim(), 400),
      updatedAt: serverTimestamp(),
    };

    if (existingOrder.exists()) {
      await updateDoc(orderRef, baseFields);
    } else {
      await setDoc(orderRef, {
        id: orderId,
        invitationId: params.invitationId,
        ownerId: params.user.uid,
        status: 'pending',
        ...baseFields,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, orderPath);
  }

  return {
    isPaid: false,
    paymentStatus: 'pending',
    packageId: params.packageId,
    packageName: cleanPkgName,
    amount: cleanAmount,
    method: cleanMethod,
    invoiceCode: cleanInvoice,
  };
}

export async function listAllOrdersForAdmin(): Promise<OrderRecord[]> {
  const path = 'orders';
  try {
    const snap = await getDocs(collection(db, 'orders'));
    return snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          invitationId: (data.invitationId as string) || '',
          ownerId: (data.ownerId as string) || '',
          ownerName: (data.ownerName as string) || 'Klien',
          ownerEmail: (data.ownerEmail as string) || '',
          whatsapp: (data.whatsapp as string) || '',
          packageId:
            data.packageId === 'admin-assisted'
              ? 'admin-assisted'
              : 'self-edit',
          packageName: (data.packageName as string) || 'Edit Sendiri',
          amount: typeof data.amount === 'number' ? data.amount : 0,
          paymentMethod: (data.paymentMethod as string) || '',
          invoiceCode: (data.invoiceCode as string) || '',
          notes: (data.notes as string) || '',
          status:
            data.status === 'paid'
              ? 'paid'
              : data.status === 'cancelled'
              ? 'cancelled'
              : 'pending',
          createdAtMs: timestampToMs(data.createdAt),
          updatedAtMs: timestampToMs(data.updatedAt),
        } satisfies OrderRecord;
      })
      .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function listAllInvitationsForAdmin(): Promise<
  StoredInvitationRecord[]
> {
  const path = 'invitations';
  try {
    const snap = await getDocs(collection(db, 'invitations'));
    return snap.docs
      .map((d) =>
        mapInvitationDoc(d.id, d.data() as Record<string, unknown>)
      )
      .sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function adminLoadInvitationById(
  invitationId: string
): Promise<StoredInvitationRecord | null> {
  const path = `invitations/${invitationId}`;
  try {
    const snap = await getDoc(doc(db, 'invitations', invitationId));
    if (!snap.exists()) return null;
    return mapInvitationDoc(
      snap.id,
      snap.data() as Record<string, unknown>
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function adminCreateInvitationForClient(
  adminUser: User,
  fallbackConfig: InvitationConfig
): Promise<StoredInvitationRecord> {
  const invitationId = `inv-klien-${Date.now()}`;
  const path = `invitations/${invitationId}`;
  try {
    const safeConfig = sanitizeConfigForFirestore(fallbackConfig);
    await setDoc(doc(db, 'invitations', invitationId), {
      id: invitationId,
      ownerId: adminUser.uid,
      isPublished: false,
      isPaid: false,
      paymentStatus: 'unpaid',
      config: safeConfig,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      invitationId,
      ownerId: adminUser.uid,
      isPublished: false,
      isPaid: false,
      paymentStatus: 'unpaid',
      paymentMethod: '',
      invoiceCode: '',
      config: safeConfig,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function adminSetInvitationActivation(params: {
  invitationId: string;
  isPaid: boolean;
  packageId?: PackageId;
  packageName?: string;
  amount?: number;
  paymentMethod?: string;
  invoiceCode?: string;
}): Promise<void> {
  const invPath = `invitations/${params.invitationId}`;
  const invRef = doc(db, 'invitations', params.invitationId);
  try {
    const updatePayload: Record<string, unknown> = {
      isPaid: params.isPaid,
      isPublished: params.isPaid,
      paymentStatus: params.isPaid ? 'paid' : 'unpaid',
      updatedAt: serverTimestamp(),
    };
    if (params.packageId) updatePayload.packageId = params.packageId;
    if (params.packageName) {
      updatePayload.packageName = clampStr(params.packageName, 120);
    }
    if (typeof params.amount === 'number') {
      updatePayload.amount = Math.max(0, Math.round(params.amount));
    }
    if (params.paymentMethod) {
      updatePayload.paymentMethod = clampStr(params.paymentMethod, 64);
    }
    if (params.invoiceCode) {
      updatePayload.invoiceCode = clampStr(params.invoiceCode, 64);
    }
    if (params.isPaid) {
      updatePayload.paidAt = serverTimestamp();
    }
    await updateDoc(invRef, updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, invPath);
  }

  const orderId = `ord-${params.invitationId}`;
  const orderRef = doc(db, 'orders', orderId);
  try {
    const orderSnap = await getDoc(orderRef);
    if (orderSnap.exists()) {
      await updateDoc(orderRef, {
        status: params.isPaid ? 'paid' : 'pending',
        updatedAt: serverTimestamp(),
      });
    }
  } catch {
    // Non-fatal if there is no corresponding order doc
  }
}

export function subscribeInvitationGuests(
  invitationId: string,
  ownerUid: string,
  onUpdate: (guests: GuestInviteEntry[]) => void
): () => void {
  const path = `invitations/${invitationId}/guests`;
  const q = query(
    collection(db, 'invitations', invitationId, 'guests'),
    where('ownerId', '==', ownerUid)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items: GuestInviteEntry[] = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: (data.name as string) || '',
            createdAt: timestampToMs(data.createdAt),
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt);
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function addGuestsToDb(
  invitationId: string,
  ownerUid: string,
  names: string[]
): Promise<void> {
  const path = `invitations/${invitationId}/guests`;
  try {
    const cleanNames = names
      .map((n) => clampStr(n.trim(), 120))
      .filter((n) => n.length > 0);
    await Promise.all(
      cleanNames.map((name, idx) => {
        const guestId = `guest-${Date.now()}-${idx}-${Math.random()
          .toString(36)
          .slice(2, 6)}`;
        return setDoc(doc(db, 'invitations', invitationId, 'guests', guestId), {
          id: guestId,
          invitationId,
          ownerId: ownerUid,
          name,
          createdAt: serverTimestamp(),
        });
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeGuestFromDb(
  invitationId: string,
  guestId: string
): Promise<void> {
  const path = `invitations/${invitationId}/guests/${guestId}`;
  try {
    await deleteDoc(doc(db, 'invitations', invitationId, 'guests', guestId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeInvitationWishes(
  invitationId: string,
  onUpdate: (wishes: GuestWish[]) => void
): () => void {
  const path = `invitations/${invitationId}/wishes`;
  const q = query(
    collection(db, 'invitations', invitationId, 'wishes'),
    where('invitationPublished', '==', true)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items: GuestWish[] = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            nama: (data.nama as string) || '',
            kehadiran: (data.kehadiran === 'Berhalangan'
              ? 'Berhalangan'
              : 'Hadir') as 'Hadir' | 'Berhalangan',
            jumlah: typeof data.jumlah === 'number' ? data.jumlah : 1,
            ucapan: (data.ucapan as string) || '',
            createdAt: timestampToMs(data.createdAt),
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt);
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function submitWishToDb(
  invitationId: string,
  ownerId: string,
  wish: {
    nama: string;
    kehadiran: 'Hadir' | 'Berhalangan';
    jumlah: number;
    ucapan: string;
  }
): Promise<void> {
  const wishId = `wish-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const path = `invitations/${invitationId}/wishes/${wishId}`;
  try {
    await setDoc(doc(db, 'invitations', invitationId, 'wishes', wishId), {
      id: wishId,
      invitationId,
      ownerId,
      invitationPublished: true,
      nama: clampStr(wish.nama.trim(), 80),
      kehadiran: wish.kehadiran,
      jumlah: Math.max(0, Math.min(20, Math.round(wish.jumlah))),
      ucapan: clampStr(wish.ucapan.trim(), 400),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteWishFromDb(
  invitationId: string,
  wishId: string
): Promise<void> {
  const path = `invitations/${invitationId}/wishes/${wishId}`;
  try {
    await deleteDoc(doc(db, 'invitations', invitationId, 'wishes', wishId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
