import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  CheckCircle2,
  Copy,
  CreditCard,
  Edit3,
  MessageCircle,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  adminCreateInvitationForClient,
  adminSetInvitationActivation,
  listAllInvitationsForAdmin,
  listAllOrdersForAdmin,
  saveBillingSettings,
  StoredInvitationRecord,
} from '../services/invitationDb';
import {
  BillingSettings,
  InvitationConfig,
  OrderRecord,
  PaymentAccountItem,
} from '../types/invitation';
import { createDefaultInvitationConfig } from '../utils/themePresets';

interface AdminPanelViewProps {
  user: User;
  billingSettings: BillingSettings;
  activeInvitationId: string | null;
  onEditInvitation: (record: StoredInvitationRecord) => void;
  onBackToStudio: () => void;
}

type AdminTab = 'orders' | 'billing';
type OrderFilter = 'all' | 'pending' | 'paid' | 'unpaid';

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export default function AdminPanelView({
  user,
  billingSettings,
  activeInvitationId,
  onEditInvitation,
  onBackToStudio,
}: AdminPanelViewProps) {
  const [tab, setTab] = useState<AdminTab>('orders');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [invitations, setInvitations] = useState<StoredInvitationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderFilter>('all');

  const [draftSettings, setDraftSettings] =
    useState<BillingSettings>(billingSettings);
  const [savingBilling, setSavingBilling] = useState(false);

  useEffect(() => {
    setDraftSettings(billingSettings);
  }, [billingSettings]);

  const notify = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2600);
  };

  const fetchAdminData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [allInv, allOrd] = await Promise.all([
        listAllInvitationsForAdmin(),
        listAllOrdersForAdmin(),
      ]);
      setInvitations(allInv);
      setOrders(allOrd);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Gagal memuat data undangan & pesanan.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAdminData();
  }, []);

  const orderByInvId = new Map<string, OrderRecord>();
  orders.forEach((o) => {
    orderByInvId.set(o.invitationId, o);
  });

  const combinedRows = invitations.map((inv) => ({
    inv,
    order: orderByInvId.get(inv.invitationId) || null,
  }));

  const filteredRows = combinedRows.filter(({ inv, order }) => {
    if (statusFilter === 'paid' && !inv.isPaid) return false;
    if (statusFilter === 'pending' && inv.paymentStatus !== 'pending')
      return false;
    if (statusFilter === 'unpaid' && (inv.isPaid || inv.paymentStatus === 'pending'))
      return false;

    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      inv.invitationId.toLowerCase().includes(q) ||
      inv.config.coverTitle.toLowerCase().includes(q) ||
      (inv.invoiceCode || '').toLowerCase().includes(q) ||
      (order?.ownerName || '').toLowerCase().includes(q) ||
      (order?.ownerEmail || '').toLowerCase().includes(q) ||
      (order?.whatsapp || '').toLowerCase().includes(q)
    );
  });

  const pendingCount = invitations.filter(
    (i) => !i.isPaid && i.paymentStatus === 'pending'
  ).length;
  const paidCount = invitations.filter((i) => i.isPaid).length;

  const handleToggleActivation = async (
    inv: StoredInvitationRecord,
    order: OrderRecord | null,
    nextPaid: boolean
  ) => {
    setBusyId(inv.invitationId);
    setErrorMsg(null);
    try {
      await adminSetInvitationActivation({
        invitationId: inv.invitationId,
        isPaid: nextPaid,
        packageId: order?.packageId || inv.packageId || 'self-edit',
        packageName:
          order?.packageName ||
          inv.packageName ||
          billingSettings.selfEditTitle,
        amount:
          typeof order?.amount === 'number'
            ? order.amount
            : typeof inv.amount === 'number'
            ? inv.amount
            : billingSettings.selfEditPrice,
        paymentMethod: order?.paymentMethod || inv.paymentMethod || 'Transfer',
        invoiceCode:
          order?.invoiceCode ||
          inv.invoiceCode ||
          `INV-${String(Date.now()).slice(-6)}`,
      });
      await fetchAdminData();
      notify(
        nextPaid
          ? `Undangan "${inv.config.coverTitle}" berhasil diaktifkan`
          : `Aktivasi "${inv.config.coverTitle}" dinonaktifkan`
      );
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal memperbarui status undangan.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateClientInvitation = async () => {
    setBusyId('create-new');
    setErrorMsg(null);
    try {
      const freshConfig: InvitationConfig = createDefaultInvitationConfig();
      const created = await adminCreateInvitationForClient(user, freshConfig);
      notify('Draft undangan klien baru dibuat. Membuka Editor...');
      onEditInvitation(created);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal membuat undangan klien baru.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBilling(true);
    setErrorMsg(null);
    try {
      await saveBillingSettings(draftSettings, user.email || '');
      notify('Harga paket, nomor WA, & rekening berhasil diperbarui');
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan pengaturan pembayaran.'
      );
    } finally {
      setSavingBilling(false);
    }
  };

  const handleAddAccount = () => {
    const newAcc: PaymentAccountItem = {
      id: `acc-${Date.now()}`,
      label: 'Rekening Baru',
      accountNumber: '',
      accountName: 'Heri Febrianto',
      notes: '',
      isActive: true,
    };
    setDraftSettings((prev) => ({
      ...prev,
      paymentAccounts: [...prev.paymentAccounts, newAcc],
    }));
  };

  const copyGuestLink = async (invId: string) => {
    const link = `${window.location.origin}${window.location.pathname}?inv=${encodeURIComponent(invId)}&to=${encodeURIComponent('Tamu Undangan')}&guest=1`;
    try {
      await navigator.clipboard.writeText(link);
      notify('Link undangan tamu disalin');
    } catch {
      notify('Silakan salin manual dari pratinjau');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9E7328] font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Panel Kontrol Admin · {user.email}</span>
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#241C16] mt-1">
            Kelola Pesanan, Harga &amp; Rekening
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void handleCreateClientInvitation()}
            disabled={busyId === 'create-new'}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#231A14] text-[#FAF6EE] text-xs sm:text-sm font-semibold hover:bg-[#382A20] flex items-center gap-1.5 disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Undangan Klien Baru</span>
          </button>
          <button
            type="button"
            onClick={onBackToStudio}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm font-semibold text-[#241C16] hover:bg-stone-50 whitespace-nowrap shrink-0"
          >
            Kembali ke Editor
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs text-[#5E4F43]">Total Undangan</p>
          <p className="font-serif text-2xl font-bold text-[#241C16] tabular-nums mt-1">
            {invitations.length}
          </p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs text-[#5E4F43]">Menunggu Konfirmasi Transfer</p>
          <p className="font-serif text-2xl font-bold text-amber-700 tabular-nums mt-1">
            {pendingCount}
          </p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs text-[#5E4F43]">Undangan Aktif (Lunas)</p>
          <p className="font-serif text-2xl font-bold text-emerald-700 tabular-nums mt-1">
            {paidCount}
          </p>
        </div>
      </div>

      {/* Segmented Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-3">
        <button
          type="button"
          onClick={() => setTab('orders')}
          className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
            tab === 'orders'
              ? 'bg-[#231A14] text-[#FAF6EE]'
              : 'bg-white border border-stone-200 text-[#5E4F43] hover:text-[#241C16]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Pesanan &amp; Daftar Undangan ({invitations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('billing')}
          className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
            tab === 'billing'
              ? 'bg-[#231A14] text-[#FAF6EE]'
              : 'bg-white border border-stone-200 text-[#5E4F43] hover:text-[#241C16]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Ubah Harga Paket &amp; Rekening ({draftSettings.paymentAccounts.length})</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800">
          {errorMsg}
        </div>
      )}

      {/* TAB 1: ORDERS & CLIENT INVITATIONS */}
      {tab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#5E4F43] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari judul undangan, invoice, email, atau WA..."
                className="w-full min-h-[42px] pl-10 pr-4 rounded-xl border border-stone-300 bg-white text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'all', label: 'Semua' },
                  { id: 'pending', label: 'Menunggu' },
                  { id: 'paid', label: 'Aktif' },
                  { id: 'unpaid', label: 'Draft' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === f.id
                      ? 'bg-[#231A14] text-[#FAF6EE]'
                      : 'bg-white border border-stone-200 text-[#5E4F43] hover:text-[#241C16]'
                  }`}
                >
                  {f.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => void fetchAdminData()}
                disabled={loading}
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-[#241C16] hover:bg-stone-50 flex items-center gap-1.5"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
                />
                <span>Segarkan</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-[#5E4F43]">
                Memuat daftar undangan &amp; pesanan...
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#5E4F43]">
                Belum ada undangan atau pesanan yang cocok dengan filter ini.
              </div>
            ) : (
              <div className="divide-y divide-stone-200">
                {filteredRows.map(({ inv, order }) => {
                  const isCurrentEditing =
                    activeInvitationId === inv.invitationId;
                  const statusLabel = inv.isPaid
                    ? 'Aktif · Lunas'
                    : inv.paymentStatus === 'pending'
                    ? 'Menunggu Konfirmasi'
                    : 'Draft Belum Pesan';
                  const statusClass = inv.isPaid
                    ? 'text-emerald-700'
                    : inv.paymentStatus === 'pending'
                    ? 'text-amber-700'
                    : 'text-[#5E4F43]';
                  const waDigits = (order?.whatsapp || '').replace(/[^\d]/g, '');
                  const waHref = waDigits
                    ? `https://wa.me/${waDigits.startsWith('0') ? `62${waDigits.slice(1)}` : waDigits}`
                    : null;

                  return (
                    <div
                      key={inv.invitationId}
                      className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-stone-50/70"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className={`font-semibold ${statusClass}`}>
                            {statusLabel}
                          </span>
                          <span aria-hidden="true" className="text-stone-300">
                            ·
                          </span>
                          <span className="font-mono text-[#5E4F43]">
                            {order?.invoiceCode || inv.invoiceCode || inv.invitationId}
                          </span>
                          {isCurrentEditing && (
                            <>
                              <span aria-hidden="true" className="text-stone-300">
                                ·
                              </span>
                              <span className="font-semibold text-[#9E7328]">
                                Sedang Dibuka di Editor
                              </span>
                            </>
                          )}
                        </div>

                        <p className="font-serif text-lg font-semibold text-[#241C16] truncate">
                          {inv.config.coverTitle}
                        </p>

                        <p className="text-xs text-[#5E4F43]">
                          {order ? (
                            <>
                              Pemesan: <strong className="text-[#241C16]">{order.ownerName}</strong> ({order.ownerEmail}) · WA: <strong className="tabular-nums">{order.whatsapp}</strong> · Paket: <strong className="text-[#241C16]">{order.packageName}</strong> (<strong className="tabular-nums">{formatRupiah(order.amount)}</strong> via {order.paymentMethod})
                            </>
                          ) : (
                            <>
                              Kategori: {inv.config.category} · ID: {inv.invitationId}
                            </>
                          )}
                        </p>

                        {order?.notes && (
                          <p className="text-xs text-[#5E4F43] italic">
                            Catatan: &ldquo;{order.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onEditInvitation(inv)}
                          className="min-h-[40px] px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-[#241C16] hover:bg-stone-100 flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Undangan</span>
                        </button>

                        {waHref && (
                          <a
                            href={waHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WA Klien</span>
                          </a>
                        )}

                        {inv.isPaid && (
                          <button
                            type="button"
                            onClick={() => void copyGuestLink(inv.invitationId)}
                            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-[#241C16] hover:bg-stone-100 flex items-center gap-1.5"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin Link</span>
                          </button>
                        )}

                        {inv.isPaid ? (
                          <button
                            type="button"
                            disabled={busyId === inv.invitationId}
                            onClick={() =>
                              void handleToggleActivation(inv, order, false)
                            }
                            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-red-200 bg-white text-xs font-semibold text-red-700 hover:bg-red-50 flex items-center gap-1.5 disabled:opacity-60"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Nonaktifkan</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busyId === inv.invitationId}
                            onClick={() =>
                              void handleToggleActivation(inv, order, true)
                            }
                            className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 flex items-center gap-1.5 disabled:opacity-60"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {busyId === inv.invitationId
                                ? 'Memproses...'
                                : 'Aktifkan Undangan'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EDITABLE PRICING & PAYMENT ACCOUNTS */}
      {tab === 'billing' && (
        <form onSubmit={handleSaveBilling} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Paket 1: Edit Sendiri */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-semibold text-[#241C16]">
                Paket 1 · Klien Edit Sendiri
              </h2>
              <div>
                <label className="block text-xs font-semibold text-[#5E4F43] mb-1">
                  Nama Paket
                </label>
                <input
                  type="text"
                  value={draftSettings.selfEditTitle}
                  onChange={(e) =>
                    setDraftSettings((s) => ({
                      ...s,
                      selfEditTitle: e.target.value,
                    }))
                  }
                  className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5E4F43] mb-1">
                  Harga (Rupiah)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={draftSettings.selfEditPrice}
                  onChange={(e) =>
                    setDraftSettings((s) => ({
                      ...s,
                      selfEditPrice: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 text-sm tabular-nums font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5E4F43] mb-1">
                  Deskripsi Paket
                </label>
                <textarea
                  rows={3}
                  value={draftSettings.selfEditDesc}
                  onChange={(e) =>
                    setDraftSettings((s) => ({
                      ...s,
                      selfEditDesc: e.target.value,
                    }))
                  }
                  className="w-full p-3 rounded-xl border border-stone-300 text-sm resize-none"
                />
              </div>
            </div>

            {/* Paket 2: Admin yang Editkan */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-semibold text-[#241C16]">
                Paket 2 · Admin yang Editkan (Terima Beres)
              </h2>
              <div>
                <label className="block text-xs font-semibold text-[#5E4F43] mb-1">
                  Nama Paket
                </label>
                <input
                  type="text"
                  value={draftSettings.adminAssistedTitle}
                  onChange={(e) =>
                    setDraftSettings((s) => ({
                      ...s,
                      adminAssistedTitle: e.target.value,
                    }))
                  }
                  className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5E4F43] mb-1">
                  Harga (Rupiah)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={draftSettings.adminAssistedPrice}
                  onChange={(e) =>
                    setDraftSettings((s) => ({
                      ...s,
                      adminAssistedPrice: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 text-sm tabular-nums font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5E4F43] mb-1">
                  Deskripsi Paket
                </label>
                <textarea
                  rows={3}
                  value={draftSettings.adminAssistedDesc}
                  onChange={(e) =>
                    setDraftSettings((s) => ({
                      ...s,
                      adminAssistedDesc: e.target.value,
                    }))
                  }
                  className="w-full p-3 rounded-xl border border-stone-300 text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* Admin WhatsApp */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-[#241C16]">
              Nomor WhatsApp Tujuan Konfirmasi Pembayaran
            </h2>
            <p className="text-xs text-[#5E4F43]">
              Masukkan nomor WhatsApp Anda (format 628... atau 08...). Tombol konfirmasi pembayaran klien akan langsung mengarah ke chat WhatsApp ini.
            </p>
            <input
              type="tel"
              value={draftSettings.adminWhatsapp}
              onChange={(e) =>
                setDraftSettings((s) => ({
                  ...s,
                  adminWhatsapp: e.target.value,
                }))
              }
              placeholder="Contoh: 6281234567890"
              className="w-full max-w-md min-h-[44px] px-4 rounded-xl border border-stone-300 text-sm tabular-nums"
            />
          </div>

          {/* Dynamic Payment Accounts List */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[#241C16]">
                  Daftar Rekening Bank &amp; E-Wallet Pembayaran
                </h2>
                <p className="text-xs text-[#5E4F43] mt-0.5">
                  Tambah, edit, atau nonaktifkan rekening tujuan transfer kapan saja.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddAccount}
                className="min-h-[40px] px-4 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-[#241C16] hover:bg-stone-50 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Rekening</span>
              </button>
            </div>

            <div className="space-y-3">
              {draftSettings.paymentAccounts.map((acc, idx) => (
                <div
                  key={acc.id}
                  className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#9E7328]">
                      Metode #{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setDraftSettings((s) => {
                            const next = [...s.paymentAccounts];
                            next[idx] = {
                              ...next[idx],
                              isActive: !next[idx].isActive,
                            };
                            return { ...s, paymentAccounts: next };
                          })
                        }
                        className={`min-h-[34px] px-3 py-1 rounded-lg border text-xs font-semibold ${
                          acc.isActive
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-white border-stone-300 text-stone-500'
                        }`}
                      >
                        {acc.isActive ? 'Aktif' : 'Disembunyikan'}
                      </button>

                      <button
                        type="button"
                        aria-label="Hapus rekening"
                        onClick={() =>
                          setDraftSettings((s) => ({
                            ...s,
                            paymentAccounts: s.paymentAccounts.filter(
                              (item) => item.id !== acc.id
                            ),
                          }))
                        }
                        className="min-w-[34px] min-h-[34px] rounded-lg border border-red-200 bg-white text-red-700 flex items-center justify-center hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={acc.label}
                      onChange={(e) =>
                        setDraftSettings((s) => {
                          const next = [...s.paymentAccounts];
                          next[idx] = { ...next[idx], label: e.target.value };
                          return { ...s, paymentAccounts: next };
                        })
                      }
                      placeholder="Nama Bank / E-Wallet (misal: BCA / DANA)"
                      className="min-h-[40px] px-3 rounded-lg border border-stone-300 bg-white text-xs font-semibold"
                    />
                    <input
                      type="text"
                      value={acc.accountNumber}
                      onChange={(e) =>
                        setDraftSettings((s) => {
                          const next = [...s.paymentAccounts];
                          next[idx] = {
                            ...next[idx],
                            accountNumber: e.target.value,
                          };
                          return { ...s, paymentAccounts: next };
                        })
                      }
                      placeholder="Nomor Rekening / No. E-Wallet"
                      className="min-h-[40px] px-3 rounded-lg border border-stone-300 bg-white text-xs tabular-nums"
                    />
                    <input
                      type="text"
                      value={acc.accountName}
                      onChange={(e) =>
                        setDraftSettings((s) => {
                          const next = [...s.paymentAccounts];
                          next[idx] = {
                            ...next[idx],
                            accountName: e.target.value,
                          };
                          return { ...s, paymentAccounts: next };
                        })
                      }
                      placeholder="Atas Nama Penerima"
                      className="min-h-[40px] px-3 rounded-lg border border-stone-300 bg-white text-xs"
                    />
                  </div>

                  <input
                    type="text"
                    value={acc.notes}
                    onChange={(e) =>
                      setDraftSettings((s) => {
                        const next = [...s.paymentAccounts];
                        next[idx] = { ...next[idx], notes: e.target.value };
                        return { ...s, paymentAccounts: next };
                      })
                    }
                    placeholder="Catatan singkat (misal: Transfer sesuai nominal & kirim bukti ke WA)"
                    className="w-full min-h-[38px] px-3 rounded-lg border border-stone-300 bg-white text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingBilling}
              className="min-h-[46px] px-6 py-3 rounded-xl bg-[#231A14] text-[#FAF6EE] text-sm font-semibold hover:bg-[#382A20] flex items-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>
                {savingBilling
                  ? 'Menyimpan...'
                  : 'Simpan Perubahan Harga & Rekening'}
              </span>
            </button>
          </div>
        </form>
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
