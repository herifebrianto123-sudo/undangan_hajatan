export type EventCategory =
  | 'pernikahan'
  | 'ulang-tahun'
  | 'khitanan'
  | 'syukuran'
  | 'kelahiran';

export type ThemeId =
  | 'keraton-klasik'
  | 'asmaradana-minimalis'
  | 'tamansari-botanical'
  | 'senja-pendopo'
  | 'ultah-tanggap-warsa'
  | 'ultah-kontemporer'
  | 'ultah-malam-gala'
  | 'khitan-nusantara'
  | 'khitan-putra-sholeh'
  | 'khitan-ksatria-jawa'
  | 'syukur-wilujengan'
  | 'syukur-kubah-harmoni'
  | 'syukur-pendopo-berkah'
  | 'lahir-tasmiyah-lembut'
  | 'lahir-tedhak-siten'
  | 'lahir-bintang-kecil';

export type BackgroundPaletteId =
  | 'cream-sogan'
  | 'ivory-charcoal'
  | 'sage-linen'
  | 'midnight-gold'
  | 'terracotta-sand'
  | 'alabaster-navy'
  | 'blush-ivory'
  | 'emerald-cream';

export interface BackgroundPalette {
  id: BackgroundPaletteId;
  name: string;
  swatchPrimary: string;
  swatchSecondary: string;
  swatchAccent: string;
  bgCanvas: string;
  bgSurface: string;
  bgCover: string;
  textPrimary: string;
  textMuted: string;
  textOnCover: string;
  accent: string;
  accentOnCover: string;
  border: string;
  isDarkCanvas: boolean;
}

export type DesignModelStyle =
  | 'classic-arch'
  | 'editorial-broadsheet'
  | 'modern-asymmetric'
  | 'botanical-postage'
  | 'royal-monogram';

export interface ThemePreset {
  id: ThemeId;
  category: EventCategory;
  name: string;
  subtitle: string;
  description: string;
  defaultPaletteId: BackgroundPaletteId;
  designStyle: DesignModelStyle;
  frameStyle: 'arch' | 'editorial' | 'botanical' | 'royal';
  layoutVariant: 'classic-split' | 'centered-editorial' | 'framed-card' | 'royal-banner';
  patternType: 'kawung' | 'none' | 'floral' | 'parang';
  badgeText: string;
}

export interface FeatureToggles {
  showMusic: boolean;
  showCountdown: boolean;
  showQuote: boolean;
  showGallery: boolean;
  showVideo: boolean;
  showRsvp: boolean;
  showGifts: boolean;
}

export interface WeddingEventItem {
  id: string;
  title: string;
  subTitle: string;
  dayDate: string;
  time: string;
  venue: string;
  address: string;
  dressCode: string;
  mapsUrl: string;
}

export interface GalleryPhotoItem {
  id: string;
  src: string;
  caption: string;
}

export interface GiftAccountItem {
  id: string;
  bank: string;
  accountNumber: string;
  accountHolder: string;
}

export interface PrimaryPersonProfile {
  roleLabel: string;
  fullName: string;
  subBadge: string;
  parentsOrHost: string;
  origin: string;
}

export interface InvitationConfig {
  category: EventCategory;
  themeId: ThemeId;
  paletteId: BackgroundPaletteId;
  customBgColor: string;
  useCustomBg: boolean;
  targetDateISO: string;
  coverKicker: string;
  coverTitle: string;
  coverDateText: string;
  heroKicker: string;
  heroSubtitle: string;
  openingGreeting: string;
  openingIntro: string;
  quoteText: string;
  quoteSource: string;
  couple: {
    brideNick: string;
    groomNick: string;
    brideFull: string;
    brideParents: string;
    brideOrigin: string;
    groomFull: string;
    groomParents: string;
    groomOrigin: string;
  };
  primaryPerson: PrimaryPersonProfile;
  images: {
    hero: string;
    bride: string;
    groom: string;
  };
  gallery: GalleryPhotoItem[];
  video: {
    src: string;
    caption: string;
  };
  music: {
    mode: 'builtin' | 'custom';
    customUrl: string;
    label: string;
  };
  events: WeddingEventItem[];
  gifts: GiftAccountItem[];
  features: FeatureToggles;
}

export interface GuestInviteEntry {
  id: string;
  name: string;
  createdAt: number;
}

export type PackageId = 'self-edit' | 'admin-assisted';

export type PaymentStatus = 'unpaid' | 'pending' | 'paid';

export interface PaymentAccountItem {
  id: string;
  label: string;
  accountNumber: string;
  accountName: string;
  notes: string;
  isActive: boolean;
}

export interface BillingSettings {
  selfEditTitle: string;
  selfEditDesc: string;
  selfEditPrice: number;
  adminAssistedTitle: string;
  adminAssistedDesc: string;
  adminAssistedPrice: number;
  adminWhatsapp: string;
  paymentAccounts: PaymentAccountItem[];
}

export interface PaymentState {
  isPaid: boolean;
  paymentStatus?: PaymentStatus;
  packageId?: PackageId;
  packageName: string;
  amount: number;
  method: string;
  paidAt?: number;
  invoiceCode?: string;
}

export interface OrderRecord {
  id: string;
  invitationId: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  whatsapp: string;
  packageId: PackageId;
  packageName: string;
  amount: number;
  paymentMethod: string;
  invoiceCode: string;
  notes: string;
  status: 'pending' | 'paid' | 'cancelled';
  createdAtMs: number;
  updatedAtMs: number;
}
