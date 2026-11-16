export interface GuestWish {
  id: string;
  nama: string;
  kehadiran: 'Hadir' | 'Berhalangan';
  jumlah: number;
  ucapan: string;
  createdAt: number;
}

export const INITIAL_WISHES: GuestWish[] = [
  {
    id: 'wish-1',
    nama: 'Keluarga Besar Ir. Hendro Prawoto',
    kehadiran: 'Hadir',
    jumlah: 2,
    ucapan:
      'Selamat berbahagia untuk acara ini. Semoga senantiasa diberikan kelancaran, keberkahan, dan kebahagiaan oleh Tuhan Yang Maha Esa.',
    createdAt: Date.now() - 1000 * 60 * 48,
  },
  {
    id: 'wish-2',
    nama: 'Dian Pramesti & Suami',
    kehadiran: 'Hadir',
    jumlah: 2,
    ucapan:
      'InsyaAllah kami hadir tepat waktu bersama keluarga. Doa terbaik menyertai setiap langkah dan kebahagiaan keluarga besar.',
    createdAt: Date.now() - 1000 * 60 * 145,
  },
  {
    id: 'wish-3',
    nama: 'Raka Suryadiningrat',
    kehadiran: 'Berhalangan',
    jumlah: 1,
    ucapan:
      'Mohon maaf belum dapat hadir langsung karena sedang bertugas di luar kota. Doa terbaik selalu menyertai dari jauh.',
    createdAt: Date.now() - 1000 * 60 * 320,
  },
];
