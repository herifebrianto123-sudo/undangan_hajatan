import { EventCategory, WeddingEventItem } from '../types/invitation';

export interface UiLabels {
  guestPrefix: string;
  coverInviteNote: string;
  openButton: string;
  countdownTitle: string;
  unitDays: string;
  unitHours: string;
  unitMinutes: string;
  unitSeconds: string;
  saveCalendar: string;
  profileSectionTitle: string;
  brideRole: string;
  groomRole: string;
  eventsKicker: string;
  eventsTitle: string;
  fieldDate: string;
  fieldTime: string;
  fieldVenue: string;
  fieldDressCode: string;
  openMaps: string;
  galleryKicker: string;
  galleryTitle: string;
  galleryHint: string;
  videoKicker: string;
  videoTitle: string;
  rsvpKicker: string;
  rsvpTitle: string;
  rsvpCountPresent: string;
  rsvpCountAbsent: string;
  rsvpCountTotal: string;
  rsvpNameLabel: string;
  rsvpStatusLabel: string;
  rsvpPresentBtn: string;
  rsvpAbsentBtn: string;
  rsvpGuestsLabel: string;
  rsvpMessageLabel: string;
  rsvpMessagePlaceholder: string;
  rsvpSubmitBtn: string;
  giftsKicker: string;
  giftsTitle: string;
  giftsIntro: string;
  copyAccountBtn: string;
  footerThankYou: string;
  navHome: string;
  navProfile: string;
  navEvents: string;
  navGallery: string;
  navRsvp: string;
}

export const INDONESIAN_LABELS: UiLabels = {
  guestPrefix: 'Kepada Yth. Bapak/Ibu/Saudara/i',
  coverInviteNote:
    'Tanpa mengurangi rasa hormat, kami mengundang Anda untuk menghadiri acara kami.',
  openButton: 'Buka Undangan',
  countdownTitle: 'Menuju Hari Bahagia',
  unitDays: 'Hari',
  unitHours: 'Jam',
  unitMinutes: 'Menit',
  unitSeconds: 'Detik',
  saveCalendar: 'Simpan ke Google Calendar',
  profileSectionTitle: 'Profil & Keluarga',
  brideRole: 'Mempelai Wanita',
  groomRole: 'Mempelai Pria',
  eventsKicker: 'Rangkaian Acara',
  eventsTitle: 'Waktu & Tempat Pelaksanaan',
  fieldDate: 'Hari & Tanggal',
  fieldTime: 'Waktu',
  fieldVenue: 'Lokasi',
  fieldDressCode: 'Busana',
  openMaps: 'Buka Google Maps',
  galleryKicker: 'Momen Bahagia',
  galleryTitle: 'Galeri Foto',
  galleryHint: 'Ketuk foto untuk melihat dalam ukuran penuh.',
  videoKicker: 'Kisah Kami',
  videoTitle: 'Video Momen',
  rsvpKicker: 'RSVP & Buku Tamu',
  rsvpTitle: 'Kirim Doa & Konfirmasi Kehadiran',
  rsvpCountPresent: 'Hadir',
  rsvpCountAbsent: 'Berhalangan',
  rsvpCountTotal: 'Ucapan',
  rsvpNameLabel: 'Nama Tamu',
  rsvpStatusLabel: 'Status Kehadiran',
  rsvpPresentBtn: 'Hadir',
  rsvpAbsentBtn: 'Berhalangan',
  rsvpGuestsLabel: 'Jumlah Tamu',
  rsvpMessageLabel: 'Ucapan & Doa Restu',
  rsvpMessagePlaceholder: 'Tuliskan doa restu Anda di sini...',
  rsvpSubmitBtn: 'Kirim Ucapan & RSVP',
  giftsKicker: 'Tanda Kasih',
  giftsTitle: 'Kirim Hadiah & Amplop Digital',
  giftsIntro:
    'Doa restu Anda merupakan karunia terindah bagi kami. Apabila berkenan memberikan tanda kasih secara digital, dapat melalui rekening berikut:',
  copyAccountBtn: 'Salin Rekening',
  footerThankYou: 'Terima kasih atas kehadiran dan doa restu Anda',
  navHome: 'Beranda',
  navProfile: 'Profil',
  navEvents: 'Acara',
  navGallery: 'Galeri',
  navRsvp: 'Ucapan',
};

export interface CategoryTemplateCopy {
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
  primaryPerson: {
    roleLabel: string;
    fullName: string;
    subBadge: string;
    parentsOrHost: string;
    origin: string;
  };
  events: WeddingEventItem[];
}

export function getCategoryTemplateCopy(
  category: EventCategory
): CategoryTemplateCopy {
  if (category === 'pernikahan') {
    return {
      coverKicker: 'Undangan Pernikahan',
      coverTitle: 'Raras & Bagas',
      coverDateText: 'Sabtu, 19 Desember 2026',
      heroKicker: 'Perayaan Pernikahan',
      heroSubtitle:
        'Semoga senantiasa diberkahi ketenteraman hati dan kebahagiaan yang abadi bersama.',
      openingGreeting: "Assalamu'alaikum Warahmatullahi Wabarakatuh",
      openingIntro:
        'Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan upacara pernikahan putra-putri kami:',
      quoteText:
        'Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.',
      quoteSource: 'QS. Ar-Rum · Ayat 21',
      couple: {
        brideNick: 'Raras',
        groomNick: 'Bagas',
        brideFull: 'Raraswati Kusumawardhani, S.Ars.',
        brideParents:
          'Putri pertama dari Bapak H. Sutrisno Hadiwijoyo & Ibu Hj. Endang Sri Lestari',
        brideOrigin: 'Yogyakarta',
        groomFull: 'Bagaswara Adi Pratama, S.T.',
        groomParents:
          'Putra kedua dari Bapak Ir. Bambang Wibisono & Ibu Ratna Dewi Anggraini',
        groomOrigin: 'Surakarta',
      },
      primaryPerson: {
        roleLabel: '',
        fullName: '',
        subBadge: '',
        parentsOrHost: '',
        origin: '',
      },
      events: [
        {
          id: 'akad',
          title: 'Akad Nikah & Ijab Kabul',
          subTitle: 'Prosesi Akad',
          dayDate: 'Sabtu, 19 Desember 2026',
          time: '08.00 – 10.00 WIB',
          venue: 'Gedung Graha Taman Sari',
          address: 'Jl. Tirtodipuran No. 42, Mantrijeron, Kota Yogyakarta 55143',
          dressCode: 'Kebaya / Batik Resmi',
          mapsUrl: 'https://maps.google.com/?q=Yogyakarta',
        },
        {
          id: 'resepsi',
          title: 'Resepsi Pernikahan',
          subTitle: 'Jamuan & Ramah Tamah',
          dayDate: 'Sabtu, 19 Desember 2026',
          time: '11.30 – 14.30 WIB',
          venue: 'Gedung Sasana Wiyata Utama',
          address: 'Jl. Rotowijayan No. 18, Kota Yogyakarta 55132',
          dressCode: 'Batik Nusantara / Formal',
          mapsUrl: 'https://maps.google.com/?q=Yogyakarta',
        },
      ],
    };
  }

  if (category === 'ulang-tahun') {
    return {
      coverKicker: 'Undangan Ulang Tahun',
      coverTitle: 'Kirana · 25 Tahun',
      coverDateText: 'Minggu, 27 Desember 2026',
      heroKicker: 'Perayaan Ulang Tahun',
      heroSubtitle:
        'Merayakan bertambahnya usia dengan rasa syukur, kehangatan, dan doa bersama sahabat serta keluarga tercinta.',
      openingGreeting: 'Salam Hangat & Bahagia',
      openingIntro:
        'Dengan penuh rasa syukur atas segala nikmat kehidupan, kami mengundang kehadiran Bapak/Ibu/Sahabat dalam acara perayaan ulang tahun:',
      quoteText:
        'Setiap tahun yang bertambah adalah pengingat indah untuk terus bersyukur, berbagi kebaikan, dan merayakan kebersamaan.',
      quoteSource: 'Catatan Syukur',
      couple: {
        brideNick: 'Kirana',
        groomNick: '25 Th',
        brideFull: '',
        brideParents: '',
        brideOrigin: 'Yogyakarta',
        groomFull: '',
        groomParents: '',
        groomOrigin: 'Yogyakarta',
      },
      primaryPerson: {
        roleLabel: 'Yang Berulang Tahun',
        fullName: 'Sekar Kirana Mahardika',
        subBadge: 'Genap 25 Tahun',
        parentsOrHost:
          'Putri dari Bapak Hendrawan Mahardika & Ibu Dewi Larasati',
        origin: 'Yogyakarta',
      },
      events: [
        {
          id: 'doa',
          title: 'Doa Syukur & Makan Malam',
          subTitle: 'Perayaan Ulang Tahun',
          dayDate: 'Minggu, 27 Desember 2026',
          time: '18.30 – 21.00 WIB',
          venue: 'Resto Taman Heritage Kotagede',
          address: 'Jl. Mondorakan No. 252, Kotagede, Yogyakarta',
          dressCode: 'Rapi Kasual · Nuansa Hangat',
          mapsUrl: 'https://maps.google.com/?q=Kotagede+Yogyakarta',
        },
      ],
    };
  }

  if (category === 'khitanan') {
    return {
      coverKicker: 'Undangan Walimatul Khitan',
      coverTitle: 'Ananda Rafa',
      coverDateText: 'Minggu, 20 Desember 2026',
      heroKicker: 'Tasyakuran Khitanan',
      heroSubtitle:
        'Semoga menjadi anak yang sholeh, berbakti kepada orang tua, cerdas, serta membawa keberkahan bagi agama dan sesama.',
      openingGreeting: "Assalamu'alaikum Warahmatullahi Wabarakatuh",
      openingIntro:
        'Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan syukuran walimatul khitan putra tercinta kami:',
      quoteText:
        'Ya Rabbku, jadikanlah aku dan anak cucuku orang-orang yang tetap mendirikan shalat, ya Tuhan kami, perkenankanlah doaku.',
      quoteSource: 'QS. Ibrahim · Ayat 40',
      couple: {
        brideNick: 'Walimatul Khitan',
        groomNick: 'Rafa',
        brideFull: '',
        brideParents: '',
        brideOrigin: 'Sleman',
        groomFull: '',
        groomParents: '',
        groomOrigin: 'Yogyakarta',
      },
      primaryPerson: {
        roleLabel: 'Putra Tercinta',
        fullName: 'Muhammad Rafa Al-Ghazali',
        subBadge: 'Usia 9 Tahun',
        parentsOrHost: 'Putra pertama dari Bapak Aditya Nugroho & Ibu Siti Aminah',
        origin: 'Sleman, Yogyakarta',
      },
      events: [
        {
          id: 'walimah',
          title: 'Doa Bersama & Resepsi Khitanan',
          subTitle: 'Syukuran Khitanan',
          dayDate: 'Minggu, 20 Desember 2026',
          time: '10.00 – 13.00 WIB',
          venue: 'Kediaman Keluarga & Balai Griya Asri',
          address: 'Jl. Kaliurang Km 8,5, Ngaglik, Sleman, Yogyakarta',
          dressCode: 'Busana Muslim / Batik',
          mapsUrl: 'https://maps.google.com/?q=Sleman+Yogyakarta',
        },
      ],
    };
  }

  if (category === 'syukuran') {
    return {
      coverKicker: 'Undangan Syukuran',
      coverTitle: 'Keluarga Bp. Prabowo',
      coverDateText: 'Jumat, 25 Desember 2026',
      heroKicker: 'Tasyakuran & Doa Bersama',
      heroSubtitle:
        'Memanjatkan rasa syukur kepada Tuhan Yang Maha Esa atas segala karunia, kelancaran rezeki, dan keselamatan keluarga.',
      openingGreeting: "Assalamu'alaikum Warahmatullahi Wabarakatuh",
      openingIntro:
        'Sebagai ungkapan rasa syukur kepada Allah SWT atas menempati rumah baru dan kesehatan keluarga, kami mengundang Bapak/Ibu/Saudara/i dalam acara:',
      quoteText:
        'Sesungguhnya jika kamu bersyukur, pasti Kami akan menambah (nikmat) kepadamu.',
      quoteSource: 'QS. Ibrahim · Ayat 7',
      couple: {
        brideNick: 'Tasyakuran',
        groomNick: 'Keluarga',
        brideFull: '',
        brideParents: '',
        brideOrigin: 'Bantul',
        groomFull: '',
        groomParents: '',
        groomOrigin: 'Yogyakarta',
      },
      primaryPerson: {
        roleLabel: 'Tuan Rumah',
        fullName: 'Keluarga Bapak H. Prabowo & Ibu Sri Wahyuni',
        subBadge: 'Syukuran Rumah Baru',
        parentsOrHost: 'Bersama seluruh putra-putri dan keluarga besar',
        origin: 'Kasihan, Bantul, Yogyakarta',
      },
      events: [
        {
          id: 'syukur',
          title: 'Pengajian, Doa Bersama & Ramah Tamah',
          subTitle: 'Tasyakuran Keluarga',
          dayDate: 'Jumat, 25 Desember 2026',
          time: '15.30 – 18.00 WIB',
          venue: 'Kediaman Baru Keluarga Prabowo',
          address: 'Perum Taman Tirto Asri Blok B-12, Kasihan, Bantul',
          dressCode: 'Busana Sopan / Batik',
          mapsUrl: 'https://maps.google.com/?q=Kasihan+Bantul+Yogyakarta',
        },
      ],
    };
  }

  return {
    coverKicker: 'Undangan Aqiqah & Kelahiran',
    coverTitle: 'Baby Arsakha',
    coverDateText: 'Sabtu, 26 Desember 2026',
    heroKicker: 'Tasyakuran Kelahiran & Aqiqah',
    heroSubtitle:
      'Alhamdulillah telah lahir buah hati kami dengan selamat. Mohon doa agar tumbuh sehat, sholeh, dan membawa keberkahan.',
    openingGreeting: "Assalamu'alaikum Warahmatullahi Wabarakatuh",
    openingIntro:
      'Dengan penuh rasa syukur atas kelahiran buah hati kami, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara tasyakuran aqiqah & pemberian nama:',
    quoteText:
      'Setiap anak tergadai dengan aqiqahnya; disembelihkan baginya pada hari ketujuh, dicukur rambutnya, dan diberi nama.',
    quoteSource: 'HR. Abu Dawud & Tirmidzi',
    couple: {
      brideNick: 'Aqiqah',
      groomNick: 'Arsakha',
      brideFull: '',
      brideParents: '',
      brideOrigin: 'Yogyakarta',
      groomFull: '',
      groomParents: '',
      groomOrigin: 'Yogyakarta',
    },
    primaryPerson: {
      roleLabel: 'Buah Hati Tercinta',
      fullName: 'Arsakha Danendra Wijaya',
      subBadge: 'Lahir 12 Desember 2026',
      parentsOrHost: 'Putra dari Bapak Dimas Wijaya & Ibu Nadia Kusuma',
      origin: 'Yogyakarta',
    },
    events: [
      {
        id: 'aqiqah',
        title: 'Prosesi Aqiqah & Cukur Rambut',
        subTitle: 'Tasyakuran Kelahiran',
        dayDate: 'Sabtu, 26 Desember 2026',
        time: '09.30 – 12.00 WIB',
        venue: 'Kediaman Keluarga Wijaya',
        address: 'Jl. Palagan Tentara Pelajar No. 88, Ngaglik, Sleman',
        dressCode: 'Busana Putih / Pastel',
        mapsUrl: 'https://maps.google.com/?q=Ngaglik+Sleman+Yogyakarta',
      },
    ],
  };
}
