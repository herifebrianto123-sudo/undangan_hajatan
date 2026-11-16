import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Eye,
  Lock,
  LogIn,
  LogOut,
  MessageCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  BillingSettings,
  GuestInviteEntry,
  InvitationConfig,
  PackageId,
  PaymentState,
} from '../types/invitation';
import {
  EVENT_CATEGORIES,
  getPaletteById,
  getThemeById,
} from '../utils/themePresets';
import GoogleSignInButton from './GoogleSignInButton';

interface ShareAndPayViewProps {
  config: InvitationConfig;
  payment: PaymentState;
  billingSettings: BillingSettings;
  guests: GuestInviteEntry[];
  user: User | null;
  isAdmin?: boolean;
  invitationId: string | null;
  isBusy?: boolean;
  onSignInGoogle: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onSubmitOrder: (payload: {
    packageId: PackageId;
    packageName: string;
    amount: number;
    paymentMethod: string;
    invoiceCode: string;
    whatsapp: string;
    notes: string;
  }) => Promise<void>;
  onAddGuests: (names: string[]) => void;
  onRemoveGuest: (id: string) => void;
  onPreviewAsGuest: (guestName: string) => void;
  onOpenAdminPanel?: () => void;
  onBackToEditor: () => void;
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export default function ShareAndPayView({
  config,
  payment,
  billingSettings,
  guests,
  user,
  isAdmin = false,
  invitationId,
  isBusy = false,
  onSignInGoogle,
  onSignOut,
  onSubmitOrder,
  onAddGuests,
  onRemoveGuest,
  onPreviewAsGuest,
  onOpenAdminPanel,
  onBackToEditor,
}: ShareAndPayViewProps) {
  const theme = getThemeById(config.themeId);
  const palette = getPaletteById(config.paletteId);
  const categoryLabel =
    EVENT_CATEGORIES.find((c) => c.id === config.category)?.label ||
    config.category;

  const activeAccounts = billingSettings.paymentAccounts.filter(
    (a) => a.isActive
  );
  const accountOptions =
    activeAccounts.length > 0 ? activeAccounts : billingSettings.paymentAccounts;

  const [selectedPackage, setSelectedPackage] = useState<PackageId>(
    payment.packageId || 'self-edit'
  );
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    accountOptions[0]?.id || ''
  );
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [singleGuestInput, setSingleGuestInput] = useState('');
  const [bulkGuestInput, setBulkGuestInput] = useState('');
  const [showBulkBox, setShowBulkBox] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (
      accountOptions.length > 0 &&
      !accountOptions.some((a) => a.id === selectedAccountId)
    ) {
      setSelectedAccountId(accountOptions[0].id);
    }
  }, [accountOptions, selectedAccountId]);

  const activeAccount =
    accountOptions.find((a) => a.id === selectedAccountId) || accountOptions[0];

  const selectedPrice =
    selectedPackage === 'admin-assisted'
      ? billingSettings.adminAssistedPrice
      : billingSettings.selfEditPrice;
  const selectedPackageName =
    selectedPackage === 'admin-assisted'
      ? billingSettings.adminAssistedTitle
      : billingSettings.selfEditTitle;

  const notify = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2400);
  };

  const buildGuestShareUrl = (guestName: string) => {
    const base = `${window.location.origin}${window.location.pathname}`;
    const invParam = invitationId
      ? `inv=${encodeURIComponent(invitationId)}&`
      : '';
    return `${base}?${invParam}to=${encodeURIComponent(guestName)}&guest=1`;
  };

  const buildWhatsAppHref = (guestName: string) => {
    const link = buildGuestShareUrl(guestName);
    const message = `Kepada Yth. ${guestName},\n\nTanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara kami:\n\n*${config.coverTitle}*\n${config.coverDateText}\n\nBuka undangan digital Anda di sini:\n${link}\n\nMerupakan suatu kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  const buildAdminConfirmWaHref = () => {
    const invCode = payment.invoiceCode || `INV-${String(Date.now()).slice(-6)}`;
    const pkgName = payment.packageName || selectedPackageName;
    const amt = payment.amount || selectedPrice;
    const methodLabel = payment.method || activeAccount?.label || 'Transfer';
    const msg = `Halo Admin Undangan Studio,\n\nSaya ingin konfirmasi pembayaran undangan digital:\n• Kode Invoice: *${invCode}*\n• Paket: *${pkgName}*\n• Nominal: *${formatRupiah(amt)}*\n• Tujuan Transfer: ${methodLabel}\n• Nama Undangan: ${config.coverTitle}\n• Email Akun: ${user?.email || '-'}\n• ID Undangan: ${invitationId || '-'}\n${clientNotes.trim() ? `• Catatan: ${clientNotes.trim()}\n` : ''}\nBerikut saya lampirkan bukti transfernya. Terima kasih.`;
    const digits = billingSettings.adminWhatsapp.replace(/[^\d]/g, '');
    if (digits.length >= 8) {
      const normalized = digits.startsWith('0')
        ? `62${digits.slice(1)}`
        : digits;
      return `https://wa.me/${normalized}?text=${encodeURIComponent(msg)}`;
    }
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  const copyText = async (text: string, label = 'Berhasil disalin') => {
    try {
      await navigator.clipboard.writeText(text);
      notify(label);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      notify(label);
    }
  };

  const handleSubmitOrderForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitationId || !user) return;
    if (!clientWhatsapp.trim()) {
      notify('Masukkan nomor WhatsApp Anda terlebih dahulu');
      return;
    }
    const invoiceCode =
      payment.invoiceCode || `INV-${String(Date.now()).slice(-6)}`;
    await onSubmitOrder({
      packageId: selectedPackage,
      packageName: selectedPackageName,
      amount: selectedPrice,
      paymentMethod: activeAccount ? activeAccount.label : 'Transfer Bank',
      invoiceCode,
      whatsapp: clientWhatsapp.trim(),
      notes: clientNotes.trim(),
    });
    notify('Pesanan dibuat. Silakan transfer & kirim bukti ke WhatsApp Admin.');
  };

  const handleAddSingleGuest = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = singleGuestInput.trim();
    if (!cleaned) return;
    onAddGuests([cleaned]);
    setSingleGuestInput('');
  };

  const handleAddBulkGuests = () => {
    const lines = bulkGuestInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    onAddGuests(lines);
    setBulkGuestInput('');
    setShowBulkBox(false);
  };

  const activeFeaturesCount = Object.values(config.features).filter(Boolean).length;

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#9E7328] font-semibold">
            Distribusi Undangan · {categoryLabel}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#241C16] mt-1">
            {!user
              ? 'Masuk Akun untuk Publikasi Undangan'
              : payment.isPaid
              ? 'Bagikan ke Daftar Nama Tamu'
              : 'Pilih Paket & Aktivasi Undangan'}
          </h1>
          {user && (
            <p className="text-xs text-[#5E4F43] mt-1.5">
              Akun aktif: <strong className="text-[#241C16]">{user.displayName || user.email}</strong>
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && onOpenAdminPanel && (
            <button
              type="button"
              onClick={onOpenAdminPanel}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#9E7328]/40 bg-[#FAF6EE] text-xs sm:text-sm font-semibold text-[#241C16] hover:bg-[#F3EBD9]"
            >
              Panel Admin
            </button>
          )}
          {user && (
            <button
              type="button"
              onClick={onSignOut}
              disabled={isBusy}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm font-semibold text-[#5E4F43] hover:text-[#241C16] hover:bg-stone-50 flex items-center gap-1.5 disabled:opacity-60"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          )}
          <button
            type="button"
            onClick={onBackToEditor}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm font-semibold text-[#241C16] hover:bg-stone-50"
          >
            Kembali ke Editor
          </button>
        </div>
      </div>

      {/* AUTH GATE */}
      {!user ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-8 sm:p-10 max-w-2xl mx-auto text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF6EE] border border-[#9E7328]/30 flex items-center justify-center mx-auto text-[#9E7328]">
            <LogIn className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#241C16]">
              Masuk dengan Google Sebelum Aktivasi
            </h2>
            <p className="text-sm text-[#5E4F43] leading-relaxed">
              Seluruh pengaturan teks, daftar nama tamu, dan ucapan RSVP tersimpan di Firebase Firestore, sementara foto, video, dan musik tersimpan di Google Drive Anda agar link undangan personal dapat dibuka tamu dari perangkat mana pun.
            </p>
          </div>
          <div className="flex justify-center">
            <GoogleSignInButton
              label={isBusy ? 'Memproses...' : 'Masuk dengan Google'}
              onClick={onSignInGoogle}
              disabled={isBusy}
              className="min-h-[48px] px-7 py-3 text-sm"
            />
          </div>
        </div>
      ) : !payment.isPaid ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: 2 PACKAGE OPTIONS & SUMMARY */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-[#FAF6EE] border border-[#9E7328]/30 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2 text-[#9E7328]">
                <Lock className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Pilih Paket Layanan
                </span>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setSelectedPackage('self-edit')}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    selectedPackage === 'self-edit'
                      ? 'border-[#231A14] bg-white shadow-xs'
                      : 'border-stone-200 bg-white/60 hover:bg-white'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-[#241C16]">
                      {billingSettings.selfEditTitle}
                    </p>
                    <p className="font-serif text-xl font-bold text-[#241C16] tabular-nums shrink-0">
                      {formatRupiah(billingSettings.selfEditPrice)}
                    </p>
                  </div>
                  <p className="text-xs text-[#5E4F43] mt-1.5 leading-relaxed">
                    {billingSettings.selfEditDesc}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPackage('admin-assisted')}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    selectedPackage === 'admin-assisted'
                      ? 'border-[#231A14] bg-white shadow-xs'
                      : 'border-stone-200 bg-white/60 hover:bg-white'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-[#241C16] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#9E7328] shrink-0" />
                      <span>{billingSettings.adminAssistedTitle}</span>
                    </p>
                    <p className="font-serif text-xl font-bold text-[#241C16] tabular-nums shrink-0">
                      {formatRupiah(billingSettings.adminAssistedPrice)}
                    </p>
                  </div>
                  <p className="text-xs text-[#5E4F43] mt-1.5 leading-relaxed">
                    {billingSettings.adminAssistedDesc}
                  </p>
                </button>
              </div>

              <dl className="space-y-2 text-xs sm:text-sm border-t border-[#9E7328]/20 pt-4">
                <div className="flex justify-between gap-2">
                  <dt className="text-[#5E4F43]">Undangan</dt>
                  <dd className="font-semibold text-[#241C16] text-right truncate">
                    {config.coverTitle}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#5E4F43]">Tema &amp; Latar</dt>
                  <dd className="font-medium text-[#241C16] text-right">
                    {theme.name} · {config.useCustomBg ? 'Kustom' : palette.name}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#5E4F43]">Fitur Aktif</dt>
                  <dd className="font-semibold text-[#241C16] tabular-nums">
                    {activeFeaturesCount} dari 7 Fitur
                  </dd>
                </div>
                <div className="flex justify-between gap-2 pt-2 border-t border-[#9E7328]/20">
                  <dt className="font-medium text-[#241C16]">Total Tagihan</dt>
                  <dd className="font-serif text-2xl font-bold text-[#241C16] tabular-nums">
                    {formatRupiah(selectedPrice)}
                  </dd>
                </div>
              </dl>

              <p className="text-xs text-[#5E4F43] leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#9E7328] shrink-0 mt-0.5" />
                <span>
                  Link tamu otomatis terkunci sebelum pembayaran diverifikasi Admin. Setelah Admin menyetujui transfer Anda, fitur Daftar Tamu &amp; link WA langsung aktif seketika.
                </span>
              </p>
            </div>
          </div>

          {/* RIGHT: PAYMENT ACCOUNTS & WHATSAPP CONFIRMATION */}
          <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-6 space-y-6">
            {payment.paymentStatus === 'pending' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-900">
                  <Clock className="w-4 h-4 shrink-0" />
                  <p className="text-xs sm:text-sm font-semibold">
                    Menunggu Konfirmasi Admin · Kode {payment.invoiceCode}
                  </p>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Pesanan <strong>{payment.packageName}</strong> sebesar{' '}
                  <strong className="tabular-nums">
                    {formatRupiah(payment.amount)}
                  </strong>{' '}
                  via <strong>{payment.method}</strong> sudah tercatat. Kirim bukti transfer ke WhatsApp Admin agar undangan segera diaktifkan.
                </p>
                <div className="pt-1 flex flex-wrap gap-2">
                  <a
                    href={buildAdminConfirmWaHref()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-800 inline-flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Kirim Bukti Transfer ke WhatsApp Admin</span>
                  </a>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-sm font-semibold text-[#241C16] mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#9E7328]" />
                Pilih Rekening / Metode Pembayaran
              </h2>
              <div className="space-y-2.5">
                {accountOptions.map((acc) => {
                  const active = activeAccount?.id === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setSelectedAccountId(acc.id)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        active
                          ? 'border-[#231A14] bg-[#FAF6EE]'
                          : 'border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#241C16]">
                          {acc.label}
                        </p>
                        {acc.accountName && (
                          <span className="text-xs text-[#5E4F43]">
                            a.n. {acc.accountName}
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-sm font-semibold text-[#241C16] mt-1 tabular-nums">
                        {acc.accountNumber}
                      </p>
                      {acc.notes && (
                        <p className="text-xs text-[#5E4F43] mt-1">
                          {acc.notes}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeAccount && (
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-[#9E7328]">
                    Tujuan Transfer Dipilih · {activeAccount.label}
                  </p>
                  <p className="font-serif text-xl sm:text-2xl font-bold text-[#241C16] tabular-nums mt-0.5">
                    {activeAccount.accountNumber}
                  </p>
                  <p className="text-xs text-[#5E4F43]">
                    Penerima: {activeAccount.accountName || '-'} · Nominal:{' '}
                    <strong className="text-[#241C16] tabular-nums">
                      {formatRupiah(selectedPrice)}
                    </strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      activeAccount.accountNumber,
                      `Nomor ${activeAccount.label} disalin`
                    )
                  }
                  className="min-h-[40px] px-4 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold flex items-center gap-1.5 hover:bg-stone-100"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Nomor</span>
                </button>
              </div>
            )}

            <form onSubmit={handleSubmitOrderForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5E4F43] mb-1.5">
                  Nomor WhatsApp Anda (Wajib untuk koordinasi aktivasi)
                </label>
                <input
                  type="tel"
                  required
                  value={clientWhatsapp}
                  onChange={(e) => setClientWhatsapp(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#9E7328]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5E4F43] mb-1.5">
                  {selectedPackage === 'admin-assisted'
                    ? 'Catatan Materi / Request Desain untuk Admin'
                    : 'Catatan Tambahan (Opsional)'}
                </label>
                <textarea
                  rows={2}
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder={
                    selectedPackage === 'admin-assisted'
                      ? 'Misal: Mohon bantu isikan foto & jadwal akad, foto akan saya kirim via WA.'
                      : 'Contoh: Sudah transfer dari BCA a.n. Budi'
                  }
                  className="w-full p-3 rounded-xl border border-stone-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#9E7328]"
                />
              </div>

              <button
                type="submit"
                disabled={isBusy || !invitationId}
                className="w-full min-h-[48px] px-6 py-3.5 rounded-xl bg-[#231A14] text-[#FAF6EE] text-sm font-semibold hover:bg-[#382A20] active:scale-[0.99] transition-all disabled:opacity-60"
              >
                {isBusy
                  ? 'Menyimpan Pesanan...'
                  : payment.paymentStatus === 'pending'
                  ? `Perbarui Pesanan (${formatRupiah(selectedPrice)})`
                  : `Buat Pesanan ${formatRupiah(selectedPrice)} & Konfirmasi WA`}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* SUDAH AKTIF: KELOLA NAMA TAMU & BAGIKAN LINK WHATSAPP */
        <div className="space-y-8">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-950">
                  Undangan Aktif &amp; Siap Dibagikan
                </p>
                <p className="text-xs text-emerald-800">
                  {payment.packageName || 'Paket Aktif'} · Invoice{' '}
                  {payment.invoiceCode || '-'} · Metode {payment.method || '-'} ·
                  Kuota Tamu Tanpa Batas
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-900 tabular-nums">
              {guests.length} Nama Tamu Terdaftar
            </span>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[#241C16] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#9E7328]" />
                Tambah Nama Tamu Undangan
              </h2>
              <button
                type="button"
                onClick={() => setShowBulkBox((v) => !v)}
                className="text-xs font-semibold text-[#9E7328] hover:underline"
              >
                {showBulkBox ? 'Input Satu per Satu' : 'Tambah Banyak Sekaligus'}
              </button>
            </div>

            {!showBulkBox ? (
              <form
                onSubmit={handleAddSingleGuest}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="text"
                  value={singleGuestInput}
                  onChange={(e) => setSingleGuestInput(e.target.value)}
                  placeholder="Contoh: Bapak Budi Santoso & Keluarga"
                  className="flex-1 min-h-[44px] px-4 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#9E7328]"
                />
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#231A14] text-[#FAF6EE] text-sm font-semibold hover:bg-[#382A20] flex items-center justify-center gap-2 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Tamu</span>
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <textarea
                  rows={4}
                  value={bulkGuestInput}
                  onChange={(e) => setBulkGuestInput(e.target.value)}
                  placeholder={`Masukkan satu nama tamu per baris:\nBapak H. Ahmad Fauzi\nIbu Kartini & Keluarga\nRekan Kerja Divisi Desain`}
                  className="w-full p-3.5 rounded-xl border border-stone-300 text-sm resize-none"
                />
                <button
                  type="button"
                  onClick={handleAddBulkGuests}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#231A14] text-[#FAF6EE] text-sm font-semibold hover:bg-[#382A20]"
                >
                  Simpan Semua Nama Tamu
                </button>
              </div>
            )}
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#241C16] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#9E7328]" />
                Daftar Link Undangan Personal
              </h3>
            </div>

            {guests.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#5E4F43]">
                Belum ada nama tamu. Tambahkan nama tamu di atas untuk membuat link undangan khusus.
              </div>
            ) : (
              <div className="divide-y divide-stone-200">
                {guests.map((g) => (
                  <div
                    key={g.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[#241C16] truncate">
                        {g.name}
                      </p>
                      <p className="text-xs text-[#5E4F43] truncate mt-0.5">
                        {buildGuestShareUrl(g.name)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onPreviewAsGuest(g.name)}
                        className="min-h-[40px] px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-[#241C16] hover:bg-stone-50 flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Pratinjau</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            buildGuestShareUrl(g.name),
                            `Link untuk ${g.name} disalin`
                          )
                        }
                        className="min-h-[40px] px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-[#241C16] hover:bg-stone-50 flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Link</span>
                      </button>

                      <a
                        href={buildWhatsAppHref(g.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Kirim WA</span>
                      </a>

                      <button
                        type="button"
                        aria-label={`Hapus ${g.name}`}
                        onClick={() => onRemoveGuest(g.id)}
                        className="min-w-[40px] min-h-[40px] rounded-xl border border-red-200 text-red-700 bg-white flex items-center justify-center hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl bg-[#231A14] text-[#FAF6EE] border border-[#D8B26A]/45 text-xs sm:text-sm font-medium shadow-xl transition-all duration-200 ${
          toastMsg ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        {toastMsg}
      </div>
    </div>
  );
}
