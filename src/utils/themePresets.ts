import heroCoupleImg from '../assets/images/hero_javanese_couple_1794740988086.jpg';
import bridePortraitImg from '../assets/images/bride_javanese_portrait_1794740988851.jpg';
import groomPortraitImg from '../assets/images/groom_javanese_portrait_1794740989415.jpg';
import pendopoGalleryImg from '../assets/images/gallery_pendopo_ceremony_1794740990534.jpg';
import ringsBatikImg from '../assets/images/gallery_rings_batik_1794740989444.jpg';
import birthdayImg from '../assets/images/event_birthday_celebration_1794762524489.jpg';
import khitananImg from '../assets/images/event_khitanan_portrait_1794762525882.jpg';
import syukuranImg from '../assets/images/event_syukuran_tumpeng_1794762526069.jpg';
import kelahiranImg from '../assets/images/event_kelahiran_aqiqah_1794762525849.jpg';
import {
  BackgroundPalette,
  BackgroundPaletteId,
  EventCategory,
  GalleryPhotoItem,
  InvitationConfig,
  ThemeId,
  ThemePreset,
} from '../types/invitation';
import { getCategoryTemplateCopy } from './i18nTemplates';

export const EVENT_CATEGORIES: {
  id: EventCategory;
  label: string;
  shortDesc: string;
}[] = [
  {
    id: 'pernikahan',
    label: 'Pernikahan',
    shortDesc: 'Akad nikah dan resepsi pernikahan',
  },
  {
    id: 'ulang-tahun',
    label: 'Ulang Tahun',
    shortDesc: 'Perayaan ulang tahun dan syukur usia',
  },
  {
    id: 'khitanan',
    label: 'Khitanan',
    shortDesc: 'Tasyakuran khitanan dan doa anak sholeh',
  },
  {
    id: 'syukuran',
    label: 'Syukuran',
    shortDesc: 'Syukuran rumah baru, pengajian, dan hajat keluarga',
  },
  {
    id: 'kelahiran',
    label: 'Kelahiran & Aqiqah',
    shortDesc: 'Kelahiran buah hati, aqiqah, dan pemberian nama',
  },
];

export const BACKGROUND_PALETTES: BackgroundPalette[] = [
  {
    id: 'cream-sogan',
    name: 'Krem & Cokelat Emas',
    swatchPrimary: '#FAF6EE',
    swatchSecondary: '#231A14',
    swatchAccent: '#9E7328',
    bgCanvas: '#FAF6EE',
    bgSurface: '#F2EAD9',
    bgCover: '#231A14',
    textPrimary: '#241C16',
    textMuted: '#5E4F43',
    textOnCover: '#FAF6EE',
    accent: '#9E7328',
    accentOnCover: '#D8B26A',
    border: 'rgba(158, 115, 40, 0.24)',
    isDarkCanvas: false,
  },
  {
    id: 'ivory-charcoal',
    name: 'Ivory & Arang Klasik',
    swatchPrimary: '#FFFFFF',
    swatchSecondary: '#18181B',
    swatchAccent: '#854D0E',
    bgCanvas: '#FCFBF9',
    bgSurface: '#F4F1EC',
    bgCover: '#18181B',
    textPrimary: '#18181B',
    textMuted: '#52525B',
    textOnCover: '#FAFAFA',
    accent: '#854D0E',
    accentOnCover: '#EAB308',
    border: 'rgba(24, 24, 27, 0.14)',
    isDarkCanvas: false,
  },
  {
    id: 'sage-linen',
    name: 'Linen & Hijau Sage',
    swatchPrimary: '#F6F7F3',
    swatchSecondary: '#1D2B24',
    swatchAccent: '#3F624D',
    bgCanvas: '#F6F7F3',
    bgSurface: '#E9EDE5',
    bgCover: '#1D2B24',
    textPrimary: '#1A241E',
    textMuted: '#4A5B50',
    textOnCover: '#F6F7F3',
    accent: '#3F624D',
    accentOnCover: '#C9B37E',
    border: 'rgba(63, 98, 77, 0.22)',
    isDarkCanvas: false,
  },
  {
    id: 'midnight-gold',
    name: 'Malam Klasik & Emas',
    swatchPrimary: '#1A1411',
    swatchSecondary: '#29201B',
    swatchAccent: '#D8B26A',
    bgCanvas: '#1A1411',
    bgSurface: '#261D18',
    bgCover: '#120D0A',
    textPrimary: '#F7F2E8',
    textMuted: '#C7B8A5',
    textOnCover: '#FAF6EE',
    accent: '#D8B26A',
    accentOnCover: '#D8B26A',
    border: 'rgba(216, 178, 106, 0.24)',
    isDarkCanvas: true,
  },
  {
    id: 'terracotta-sand',
    name: 'Pasir & Merah Bata',
    swatchPrimary: '#FBF5F1',
    swatchSecondary: '#3A1F18',
    swatchAccent: '#9A3412',
    bgCanvas: '#FBF5F1',
    bgSurface: '#F3E5DC',
    bgCover: '#3A1F18',
    textPrimary: '#291712',
    textMuted: '#6B483D',
    textOnCover: '#FBF5F1',
    accent: '#9A3412',
    accentOnCover: '#FDBA74',
    border: 'rgba(154, 52, 18, 0.22)',
    isDarkCanvas: false,
  },
  {
    id: 'alabaster-navy',
    name: 'Alabaster & Biru Klasik',
    swatchPrimary: '#F8FAFC',
    swatchSecondary: '#0F1F38',
    swatchAccent: '#1E3A8A',
    bgCanvas: '#F8FAFC',
    bgSurface: '#EDF2F7',
    bgCover: '#0F1F38',
    textPrimary: '#0F172A',
    textMuted: '#475569',
    textOnCover: '#F8FAFC',
    accent: '#1E3A8A',
    accentOnCover: '#E2B86B',
    border: 'rgba(30, 58, 138, 0.18)',
    isDarkCanvas: false,
  },
  {
    id: 'blush-ivory',
    name: 'Ivory Lembut & Mawar',
    swatchPrimary: '#FDF8F7',
    swatchSecondary: '#4A252D',
    swatchAccent: '#9D4657',
    bgCanvas: '#FDF8F7',
    bgSurface: '#F7ECEA',
    bgCover: '#4A252D',
    textPrimary: '#2C181C',
    textMuted: '#6E4A52',
    textOnCover: '#FDF8F7',
    accent: '#9D4657',
    accentOnCover: '#F4C6CE',
    border: 'rgba(157, 70, 87, 0.2)',
    isDarkCanvas: false,
  },
  {
    id: 'emerald-cream',
    name: 'Krem & Hijau Zamrud',
    swatchPrimary: '#F8FAF7',
    swatchSecondary: '#113025',
    swatchAccent: '#155E44',
    bgCanvas: '#F8FAF7',
    bgSurface: '#EAF2ED',
    bgCover: '#113025',
    textPrimary: '#13261E',
    textMuted: '#445C52',
    textOnCover: '#F8FAF7',
    accent: '#155E44',
    accentOnCover: '#D8C27A',
    border: 'rgba(21, 94, 68, 0.2)',
    isDarkCanvas: false,
  },
];

export const DESIGN_STYLE_LABELS: Record<
  ThemePreset['designStyle'],
  { label: string; summary: string }
> = {
  'classic-arch': {
    label: 'Model Klasik Simetris',
    summary: 'Sampul lengkung klasik, profil simetris & seksi acara gelap',
  },
  'editorial-broadsheet': {
    label: 'Model Editorial Majalah',
    summary: 'Sampul foto penuh, garis tipis tegas, jadwal terang & galeri figur',
  },
  'modern-asymmetric': {
    label: 'Model Modern Split-Screen',
    summary: 'Sampul bagi-dua cerah, sans-serif tegas, timeline bernomor & mosaik',
  },
  'botanical-postage': {
    label: 'Model Kartu Pos Botani',
    summary: 'Bingkai kartu ganda, aksen garis putus-putus & galeri cetak foto',
  },
  'royal-monogram': {
    label: 'Model Monogram Sinematik',
    summary: 'Monogram berlian, hero panorama gelap & galeri layar lebar',
  },
};

export const THEME_PRESETS: ThemePreset[] = [
  // PERNIKAHAN (4 Desain — 4 Model Berbeda)
  {
    id: 'keraton-klasik',
    category: 'pernikahan',
    name: 'Klasik Nusantara',
    subtitle: 'Model Klasik Simetris · Elegan Tradisional',
    description:
      'Sampul emblem simetris gelap, hero terbagi dengan bingkai lengkung, kartu mempelai berpasangan, dan seksi acara berlatar kontras.',
    defaultPaletteId: 'cream-sogan',
    designStyle: 'classic-arch',
    frameStyle: 'arch',
    layoutVariant: 'classic-split',
    patternType: 'kawung',
    badgeText: 'Klasik Simetris',
  },
  {
    id: 'asmaradana-minimalis',
    category: 'pernikahan',
    name: 'Editorial Minimalis',
    subtitle: 'Model Editorial Majalah · Garis Tegas',
    description:
      'Sampul foto penuh bergradasi, tata letak koran editorial bergaris tipis, profil horizontal bergantian, serta jadwal acara di latar terang.',
    defaultPaletteId: 'ivory-charcoal',
    designStyle: 'editorial-broadsheet',
    frameStyle: 'editorial',
    layoutVariant: 'centered-editorial',
    patternType: 'none',
    badgeText: 'Editorial Majalah',
  },
  {
    id: 'tamansari-botanical',
    category: 'pernikahan',
    name: 'Taman Asri Botanical',
    subtitle: 'Model Kartu Pos Botani · Lembut Alami',
    description:
      'Sampul bergaya kartu undangan cetak berbingkai ganda, hitung mundur kapsul lembut, kartu acara berbingkai putus-putus, dan galeri cetak foto.',
    defaultPaletteId: 'sage-linen',
    designStyle: 'botanical-postage',
    frameStyle: 'botanical',
    layoutVariant: 'framed-card',
    patternType: 'floral',
    badgeText: 'Kartu Pos Botani',
  },
  {
    id: 'senja-pendopo',
    category: 'pernikahan',
    name: 'Malam Keemasan',
    subtitle: 'Model Monogram Sinematik · Kontras Mewah',
    description:
      'Sampul monogram berlian dengan foto panorama penuh, bar hitung mundur melayang, dua kolom acara simetris, dan galeri layar lebar.',
    defaultPaletteId: 'midnight-gold',
    designStyle: 'royal-monogram',
    frameStyle: 'royal',
    layoutVariant: 'royal-banner',
    patternType: 'parang',
    badgeText: 'Monogram Sinematik',
  },

  // ULANG TAHUN (3 Desain — 3 Model Berbeda)
  {
    id: 'ultah-tanggap-warsa',
    category: 'ulang-tahun',
    name: 'Perayaan Hangat Klasik',
    subtitle: 'Model Kartu Pos Botani · Hangat Bersahaja',
    description:
      'Desain kartu perayaan berbingkai ganda dengan tata letak lembut, jadwal acara beraksen garis putus-putus, dan galeri gaya cetak foto.',
    defaultPaletteId: 'cream-sogan',
    designStyle: 'botanical-postage',
    frameStyle: 'botanical',
    layoutVariant: 'framed-card',
    patternType: 'floral',
    badgeText: 'Kartu Pos Hangat',
  },
  {
    id: 'ultah-kontemporer',
    category: 'ulang-tahun',
    name: 'Selebrasi Kontemporer',
    subtitle: 'Model Modern Split-Screen · Tipografi Tegas',
    description:
      'Sampul terbagi dua sisi cerah dengan tipografi modern bersih, hero lanskap asimetris, jadwal timeline bernomor 01/02, dan galeri mosaik.',
    defaultPaletteId: 'blush-ivory',
    designStyle: 'modern-asymmetric',
    frameStyle: 'editorial',
    layoutVariant: 'classic-split',
    patternType: 'none',
    badgeText: 'Modern Split-Screen',
  },
  {
    id: 'ultah-malam-gala',
    category: 'ulang-tahun',
    name: 'Bintang Malam Gala',
    subtitle: 'Model Monogram Sinematik · Eksklusif Malam',
    description:
      'Tampilan pesta malam dengan sampul monogram berlian, banner hero foto penuh gelap, serta galeri panorama layar lebar.',
    defaultPaletteId: 'midnight-gold',
    designStyle: 'royal-monogram',
    frameStyle: 'royal',
    layoutVariant: 'royal-banner',
    patternType: 'parang',
    badgeText: 'Monogram Gala',
  },

  // KHITANAN (3 Desain — 3 Model Berbeda)
  {
    id: 'khitan-nusantara',
    category: 'khitanan',
    name: 'Walimatul Khitan Nusantara',
    subtitle: 'Model Klasik Simetris · Kubah Teduh',
    description:
      'Sampul emblem simetris berpadu bingkai lengkung kubah, profil ananda berbingkai rapi, serta kartu acara di seksi kontras.',
    defaultPaletteId: 'emerald-cream',
    designStyle: 'classic-arch',
    frameStyle: 'arch',
    layoutVariant: 'classic-split',
    patternType: 'kawung',
    badgeText: 'Klasik Simetris',
  },
  {
    id: 'khitan-putra-sholeh',
    category: 'khitanan',
    name: 'Cahaya Putra Sholeh',
    subtitle: 'Model Modern Split-Screen · Bersih & Khidmat',
    description:
      'Sampul split-screen modern berlatar terang, susunan tipografi sans-serif rapi, alur jadwal bernomor, dan galeri mosaik.',
    defaultPaletteId: 'alabaster-navy',
    designStyle: 'modern-asymmetric',
    frameStyle: 'editorial',
    layoutVariant: 'classic-split',
    patternType: 'none',
    badgeText: 'Modern Split-Screen',
  },
  {
    id: 'khitan-ksatria-jawa',
    category: 'khitanan',
    name: 'Putra Harapan Klasik',
    subtitle: 'Model Editorial Majalah · Berwibawa',
    description:
      'Sampul foto penuh bergradasi gelap, judul editorial terpusat dengan garis pembatas tipis, dan jadwal acara bergaya majalah.',
    defaultPaletteId: 'cream-sogan',
    designStyle: 'editorial-broadsheet',
    frameStyle: 'editorial',
    layoutVariant: 'centered-editorial',
    patternType: 'none',
    badgeText: 'Editorial Majalah',
  },

  // SYUKURAN (3 Desain — 3 Model Berbeda)
  {
    id: 'syukur-wilujengan',
    category: 'syukuran',
    name: 'Tasyakuran Hangat Nusantara',
    subtitle: 'Model Klasik Simetris · Kekeluargaan',
    description:
      'Tata letak klasik simetris dengan sentuhan hangat untuk acara syukuran rumah baru, kelulusan, maupun selamatan keluarga.',
    defaultPaletteId: 'terracotta-sand',
    designStyle: 'classic-arch',
    frameStyle: 'arch',
    layoutVariant: 'classic-split',
    patternType: 'kawung',
    badgeText: 'Klasik Simetris',
  },
  {
    id: 'syukur-kubah-harmoni',
    category: 'syukuran',
    name: 'Kubah Harmoni',
    subtitle: 'Model Kartu Pos Botani · Pengajian & Doa',
    description:
      'Tampilan kartu undangan cetak yang tenang dengan ornamen lembut, cocok untuk pengajian, doa bersama, dan silaturahmi.',
    defaultPaletteId: 'sage-linen',
    designStyle: 'botanical-postage',
    frameStyle: 'botanical',
    layoutVariant: 'framed-card',
    patternType: 'floral',
    badgeText: 'Kartu Pos Tenang',
  },
  {
    id: 'syukur-pendopo-berkah',
    category: 'syukuran',
    name: 'Balai Berkah Minimalis',
    subtitle: 'Model Editorial Majalah · Resmi & Santun',
    description:
      'Gaya editorial formal dengan garis tipis berstruktur dan jadwal waktu bernomor besar untuk mengundang kolega maupun kerabat.',
    defaultPaletteId: 'ivory-charcoal',
    designStyle: 'editorial-broadsheet',
    frameStyle: 'editorial',
    layoutVariant: 'centered-editorial',
    patternType: 'none',
    badgeText: 'Editorial Resmi',
  },

  // KELAHIRAN & AQIQAH (3 Desain — 3 Model Berbeda)
  {
    id: 'lahir-tasmiyah-lembut',
    category: 'kelahiran',
    name: 'Tasmiyah & Aqiqah Lembut',
    subtitle: 'Model Kartu Pos Botani · Pastel Hangat',
    description:
      'Sampul kartu berbingkai ganda bernuansa lembut dengan galeri cetakan foto buah hati yang hangat penuh kasih.',
    defaultPaletteId: 'blush-ivory',
    designStyle: 'botanical-postage',
    frameStyle: 'botanical',
    layoutVariant: 'framed-card',
    patternType: 'floral',
    badgeText: 'Kartu Pos Pastel',
  },
  {
    id: 'lahir-tedhak-siten',
    category: 'kelahiran',
    name: 'Kasih Bunda Nusantara',
    subtitle: 'Model Klasik Simetris · Tradisi Keluarga',
    description:
      'Gaya klasik simetris dengan lengkungan elegan dan seksi acara berlatar kontras untuk acara syukuran kelahiran dan aqiqah.',
    defaultPaletteId: 'cream-sogan',
    designStyle: 'classic-arch',
    frameStyle: 'arch',
    layoutVariant: 'classic-split',
    patternType: 'kawung',
    badgeText: 'Klasik Keluarga',
  },
  {
    id: 'lahir-bintang-kecil',
    category: 'kelahiran',
    name: 'Bintang Kecil Minimalis',
    subtitle: 'Model Modern Split-Screen · Sejuk Modern',
    description:
      'Sampul split-screen modern yang cerah dengan profil bayi menyamping, timeline acara bersih, dan galeri mosaik.',
    defaultPaletteId: 'alabaster-navy',
    designStyle: 'modern-asymmetric',
    frameStyle: 'editorial',
    layoutVariant: 'classic-split',
    patternType: 'none',
    badgeText: 'Modern Split-Screen',
  },
];

export function getPaletteById(id: BackgroundPaletteId): BackgroundPalette {
  return BACKGROUND_PALETTES.find((p) => p.id === id) || BACKGROUND_PALETTES[0];
}

export function getThemeById(id: string): ThemePreset {
  return THEME_PRESETS.find((t) => t.id === id) || THEME_PRESETS[0];
}

export function getCategoryMedia(category: EventCategory): {
  hero: string;
  bride: string;
  groom: string;
  gallery: GalleryPhotoItem[];
} {
  if (category === 'pernikahan') {
    return {
      hero: heroCoupleImg,
      bride: bridePortraitImg,
      groom: groomPortraitImg,
      gallery: [
        { id: 'gal-1', src: heroCoupleImg, caption: 'Potret Utama Mempelai Berdua' },
        { id: 'gal-2', src: pendopoGalleryImg, caption: 'Suasana Sakral Tempat Acara' },
        { id: 'gal-3', src: bridePortraitImg, caption: 'Potret Mempelai Wanita' },
        { id: 'gal-4', src: groomPortraitImg, caption: 'Potret Mempelai Pria' },
        { id: 'gal-5', src: ringsBatikImg, caption: 'Cincin Emas & Kain Tradisional' },
      ],
    };
  }

  if (category === 'ulang-tahun') {
    return {
      hero: birthdayImg,
      bride: birthdayImg,
      groom: pendopoGalleryImg,
      gallery: [
        { id: 'gal-1', src: birthdayImg, caption: 'Perayaan Hangat di Taman' },
        { id: 'gal-2', src: pendopoGalleryImg, caption: 'Suasana Kebersamaan Keluarga & Sahabat' },
      ],
    };
  }

  if (category === 'khitanan') {
    return {
      hero: khitananImg,
      bride: khitananImg,
      groom: khitananImg,
      gallery: [
        { id: 'gal-1', src: khitananImg, caption: 'Potret Ananda Tercinta' },
        { id: 'gal-2', src: pendopoGalleryImg, caption: 'Tempat Pelaksanaan Acara' },
      ],
    };
  }

  if (category === 'syukuran') {
    return {
      hero: syukuranImg,
      bride: syukuranImg,
      groom: pendopoGalleryImg,
      gallery: [
        { id: 'gal-1', src: syukuranImg, caption: 'Hidangan Tumpeng Syukuran & Doa Bersama' },
        { id: 'gal-2', src: pendopoGalleryImg, caption: 'Suasana Hangat Silaturahmi' },
      ],
    };
  }

  return {
    hero: kelahiranImg,
    bride: kelahiranImg,
    groom: kelahiranImg,
    gallery: [
      { id: 'gal-1', src: kelahiranImg, caption: 'Momen Damai Buah Hati Tercinta' },
      { id: 'gal-2', src: ringsBatikImg, caption: 'Rangkaian Melati & Syukuran Keluarga' },
    ],
  };
}

export function createConfigForCategoryAndTheme(
  category: EventCategory,
  themeId: ThemeId,
  paletteId: BackgroundPaletteId
): InvitationConfig {
  const copy = getCategoryTemplateCopy(category);
  const media = getCategoryMedia(category);

  return {
    category,
    themeId,
    paletteId,
    customBgColor: getPaletteById(paletteId).bgCanvas,
    useCustomBg: false,
    targetDateISO: '2026-12-19T08:00:00+07:00',
    ...copy,
    images: {
      hero: media.hero,
      bride: media.bride,
      groom: media.groom,
    },
    gallery: media.gallery,
    video: {
      src: '',
      caption: 'Cuplikan Video Momen Spesial',
    },
    music: {
      mode: 'builtin',
      customUrl: '',
      label: 'Musik Instrumental Lembut (Bawaan)',
    },
    gifts: [
      {
        id: 'bca',
        bank: 'Bank BCA',
        accountNumber: '8610492817',
        accountHolder: copy.couple.brideFull || copy.primaryPerson.fullName,
      },
      {
        id: 'mandiri',
        bank: 'Bank Mandiri',
        accountNumber: '1370019482035',
        accountHolder: copy.couple.groomFull || copy.primaryPerson.fullName,
      },
    ],
    features: {
      showMusic: true,
      showCountdown: true,
      showQuote: true,
      showGallery: true,
      showVideo: true,
      showRsvp: true,
      showGifts: true,
    },
  };
}

export function createDefaultInvitationConfig(): InvitationConfig {
  return createConfigForCategoryAndTheme(
    'pernikahan',
    'keraton-klasik',
    'cream-sogan'
  );
}

export function resolveEmbedVideoUrl(rawUrl: string): {
  kind: 'none' | 'iframe' | 'video';
  src: string;
} {
  const url = rawUrl.trim();
  if (!url) return { kind: 'none', src: '' };

  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{6,})/
  );
  if (ytMatch && ytMatch[1]) {
    return {
      kind: 'iframe',
      src: `https://www.youtube.com/embed/${ytMatch[1]}`,
    };
  }

  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return {
      kind: 'iframe',
      src: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
    };
  }

  return { kind: 'video', src: url };
}
