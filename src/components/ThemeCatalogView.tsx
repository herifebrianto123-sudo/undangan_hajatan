import React, { useState } from 'react';
import { Check, Eye, Palette, SlidersHorizontal } from 'lucide-react';
import {
  BackgroundPalette,
  BackgroundPaletteId,
  DesignModelStyle,
  EventCategory,
  InvitationConfig,
  ThemeId,
  ThemePreset,
} from '../types/invitation';
import {
  CategoryTemplateCopy,
  getCategoryTemplateCopy,
} from '../utils/i18nTemplates';
import {
  BACKGROUND_PALETTES,
  DESIGN_STYLE_LABELS,
  EVENT_CATEGORIES,
  getCategoryMedia,
  getPaletteById,
  THEME_PRESETS,
} from '../utils/themePresets';
import { CategoryCrest } from './JavaneseOrnaments';

interface ThemeCatalogViewProps {
  config: InvitationConfig;
  onSelectPalette: (paletteId: BackgroundPaletteId) => void;
  onPreviewDemo: (
    category: EventCategory,
    themeId: ThemeId,
    paletteId: BackgroundPaletteId
  ) => void;
  onEditTheme: (
    category: EventCategory,
    themeId: ThemeId,
    paletteId: BackgroundPaletteId
  ) => void;
  onUpdateCustomBg: (hex: string, enabled: boolean) => void;
}

function getInitials(title: string): string {
  const words = title
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }
  return title.slice(0, 2).toUpperCase();
}

function ThemeCardPreview({
  theme,
  palette,
  canvasColor,
  sampleCopy,
  heroImage,
  categoryLabel,
}: {
  theme: ThemePreset;
  palette: BackgroundPalette;
  canvasColor: string;
  sampleCopy: CategoryTemplateCopy;
  heroImage: string;
  categoryLabel: string;
}) {
  if (theme.designStyle === 'editorial-broadsheet') {
    return (
      <div
        className="relative h-52 overflow-hidden border-b"
        style={{
          backgroundColor: palette.bgCover,
          borderColor: palette.border,
        }}
      >
        <img
          src={heroImage}
          alt={`Pratinjau ${theme.name}`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/35" />
        <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/25 text-[9px] uppercase tracking-[0.24em] font-sans">
            <span>Edisi {categoryLabel}</span>
            <span className="tabular-nums">{sampleCopy.coverDateText}</span>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.22em] text-white/75 mb-1">
              {sampleCopy.heroKicker}
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium leading-none tracking-tight">
              {sampleCopy.coverTitle}
            </h2>
            <div className="mt-2.5 pt-2 border-t border-white/25 flex items-center justify-between text-[10px] text-white/80">
              <span className="truncate">{sampleCopy.events[0]?.venue}</span>
              <span className="font-mono uppercase tracking-wider shrink-0">
                01 · Jadwal
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (theme.designStyle === 'modern-asymmetric') {
    return (
      <div
        className="h-52 border-b grid grid-cols-12 overflow-hidden"
        style={{
          backgroundColor: canvasColor,
          borderColor: palette.border,
          color: palette.textPrimary,
        }}
      >
        <div className="col-span-7 p-4 sm:p-5 flex flex-col justify-between">
          <div className="space-y-1">
            <span
              className="block text-[9px] font-sans font-bold uppercase tracking-[0.2em]"
              style={{ color: palette.accent }}
            >
              {categoryLabel}
            </span>
            <div
              className="w-6 h-0.5"
              style={{ backgroundColor: palette.accent }}
            />
          </div>

          <div>
            <h2 className="font-sans text-lg sm:text-xl font-bold tracking-tight leading-tight">
              {sampleCopy.coverTitle}
            </h2>
            <p
              className="text-[10px] mt-1 font-medium"
              style={{ color: palette.textMuted }}
            >
              {sampleCopy.coverDateText}
            </p>
          </div>

          <div
            className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-wider pt-2 border-t"
            style={{ borderColor: palette.border, color: palette.textMuted }}
          >
            <span style={{ color: palette.accent }}>01</span>
            <span className="truncate">{sampleCopy.events[0]?.time}</span>
          </div>
        </div>

        <div className="col-span-5 relative h-full bg-stone-900">
          <img
            src={heroImage}
            alt={`Pratinjau ${theme.name}`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }

  if (theme.designStyle === 'botanical-postage') {
    return (
      <div
        className="h-52 p-3.5 border-b flex items-center justify-center"
        style={{
          backgroundColor: palette.bgSurface,
          borderColor: palette.border,
        }}
      >
        <div
          className="w-full h-full rounded-xl border p-3 flex items-center gap-3.5 relative"
          style={{
            backgroundColor: canvasColor,
            borderColor: palette.accent,
            color: palette.textPrimary,
          }}
        >
          <div
            className="w-24 h-36 shrink-0 rounded-2xl overflow-hidden border p-1 bg-white/60"
            style={{ borderColor: palette.border }}
          >
            <img
              src={heroImage}
              alt={`Pratinjau ${theme.name}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-1.5" style={{ color: palette.accent }}>
              <CategoryCrest
                category={theme.category}
                frameStyle="botanical"
                className="w-5 h-5 shrink-0"
              />
              <span className="text-[9px] uppercase tracking-[0.18em] font-semibold truncate">
                Kartu Undangan
              </span>
            </div>
            <h2 className="font-serif italic text-xl sm:text-2xl font-medium leading-tight truncate">
              {sampleCopy.coverTitle}
            </h2>
            <div
              className="border-t border-dashed pt-1.5 space-y-0.5"
              style={{ borderColor: palette.accent }}
            >
              <p
                className="text-[10px] truncate"
                style={{ color: palette.textMuted }}
              >
                {sampleCopy.coverDateText}
              </p>
              <p
                className="text-[10px] truncate font-medium"
                style={{ color: palette.accent }}
              >
                {sampleCopy.events[0]?.venue}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (theme.designStyle === 'royal-monogram') {
    const initials = getInitials(sampleCopy.coverTitle);
    return (
      <div
        className="relative h-52 overflow-hidden border-b flex flex-col items-center justify-center p-5 text-center"
        style={{
          backgroundColor: palette.bgCover,
          borderColor: palette.border,
          color: palette.textOnCover,
        }}
      >
        <img
          src={heroImage}
          alt={`Pratinjau ${theme.name}`}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        <div
          className="absolute inset-3 border pointer-events-none"
          style={{ borderColor: `${palette.accentOnCover}40` }}
        />
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div
            className="w-11 h-11 rotate-45 border flex items-center justify-center mb-1"
            style={{
              borderColor: palette.accentOnCover,
              backgroundColor: `${palette.bgCover}CC`,
            }}
          >
            <span
              className="-rotate-45 font-serif text-sm font-semibold tracking-wider"
              style={{ color: palette.accentOnCover }}
            >
              {initials}
            </span>
          </div>
          <p
            className="text-[9px] uppercase tracking-[0.26em]"
            style={{ color: palette.accentOnCover }}
          >
            {sampleCopy.coverKicker}
          </p>
          <h2 className="font-serif text-2xl font-medium leading-tight text-white">
            {sampleCopy.coverTitle}
          </h2>
          <p className="text-[10px] text-white/75 tracking-wider">
            {sampleCopy.coverDateText}
          </p>
        </div>
      </div>
    );
  }

  // Default: 'classic-arch'
  return (
    <div
      className="h-52 p-4 sm:p-5 border-b grid grid-cols-12 gap-3.5 items-center"
      style={{
        backgroundColor: canvasColor,
        borderColor: palette.border,
      }}
    >
      <div
        className="col-span-5 h-40 overflow-hidden border shadow-sm rounded-t-full rounded-b-lg"
        style={{
          borderColor: palette.accent,
          backgroundColor: palette.bgCover,
        }}
      >
        <img
          src={heroImage}
          alt={`Pratinjau ${theme.name}`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>

      <div
        className="col-span-7 space-y-1.5"
        style={{ color: palette.textPrimary }}
      >
        <div style={{ color: palette.accent }}>
          <CategoryCrest
            category={theme.category}
            frameStyle="arch"
            className="w-6 h-7"
          />
        </div>
        <p
          className="text-[9px] uppercase tracking-[0.2em] font-semibold"
          style={{ color: palette.accent }}
        >
          {categoryLabel}
        </p>
        <h2 className="font-serif text-xl font-medium leading-tight">
          {sampleCopy.coverTitle}
        </h2>
        <p
          className="text-[10px] leading-relaxed"
          style={{ color: palette.textMuted }}
        >
          {sampleCopy.coverDateText}
        </p>
      </div>
    </div>
  );
}

export default function ThemeCatalogView({
  config,
  onSelectPalette,
  onPreviewDemo,
  onEditTheme,
  onUpdateCustomBg,
}: ThemeCatalogViewProps) {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    EventCategory | 'all'
  >('all');
  const [selectedModelFilter, setSelectedModelFilter] = useState<
    DesignModelStyle | 'all'
  >('all');

  const activePalette = getPaletteById(config.paletteId);

  const visibleThemes = THEME_PRESETS.filter((t) => {
    const matchCategory =
      selectedCategoryFilter === 'all' || t.category === selectedCategoryFilter;
    const matchModel =
      selectedModelFilter === 'all' || t.designStyle === selectedModelFilter;
    return matchCategory && matchModel;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 space-y-8">
      {/* Header + Palette Control */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end border-b border-stone-200 pb-8">
        <div className="lg:col-span-7 space-y-3">
          <p className="text-xs uppercase tracking-[0.22em] text-[#9E7328] font-semibold">
            Katalog Desain Undangan Digital · 16 Tema · 5 Model Tata Letak
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium text-[#241C16] leading-[1.08]">
            Pernikahan, Ulang Tahun, Khitanan, Syukuran &amp; Kelahiran
          </h1>
          <p className="text-sm sm:text-base text-[#5E4F43] leading-relaxed max-w-2xl">
            Setiap desain hadir dengan model sampul, susunan tipografi, bentuk jadwal acara, dan gaya galeri yang berbeda. Pilih kategori acara, coba warna latar, lalu lihat demo atau langsung edit.
          </p>
        </div>

        {/* Pilihan Warna Latar */}
        <div className="lg:col-span-5 bg-[#F2EAD9]/75 border border-[#9E7328]/20 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5E4F43] flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#9E7328]" />
              Warna Latar Demo
            </span>
            <span className="text-xs font-medium text-[#241C16]">
              {config.useCustomBg
                ? `Kustom (${config.customBgColor})`
                : activePalette.name}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {BACKGROUND_PALETTES.map((pal) => {
              const selected = !config.useCustomBg && config.paletteId === pal.id;
              return (
                <button
                  key={pal.id}
                  type="button"
                  title={pal.name}
                  onClick={() => {
                    onUpdateCustomBg(config.customBgColor, false);
                    onSelectPalette(pal.id);
                  }}
                  className={`min-h-[40px] px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-medium transition-all ${
                    selected
                      ? 'border-[#231A14] bg-white text-[#241C16] shadow-sm'
                      : 'border-stone-300/80 bg-white/65 text-[#5E4F43] hover:bg-white'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-black/15 shrink-0"
                    style={{ backgroundColor: pal.swatchPrimary }}
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: pal.swatchSecondary }}
                  />
                </button>
              );
            })}

            <label
              className={`min-h-[40px] px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-all ${
                config.useCustomBg
                  ? 'border-[#231A14] bg-white text-[#241C16] shadow-sm'
                  : 'border-stone-300/80 bg-white/65 text-[#5E4F43] hover:bg-white'
              }`}
            >
              <input
                type="color"
                value={config.customBgColor}
                onChange={(e) => onUpdateCustomBg(e.target.value, true)}
                className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent p-0"
                aria-label="Pilih warna latar kustom"
              />
              <span>Kustom</span>
            </label>
          </div>
        </div>
      </section>

      {/* Filter Controls: Kategori Acara & Model Gaya */}
      <section aria-label="Filter Desain Undangan" className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('all')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors whitespace-nowrap ${
              selectedCategoryFilter === 'all'
                ? 'bg-[#231A14] text-[#FAF6EE] border-[#231A14]'
                : 'bg-white text-[#5E4F43] border-stone-200 hover:border-stone-300'
            }`}
          >
            Semua Acara ({THEME_PRESETS.length})
          </button>

          {EVENT_CATEGORIES.map((cat) => {
            const count = THEME_PRESETS.filter((t) => t.category === cat.id).length;
            const active = selectedCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#231A14] text-[#FAF6EE] border-[#231A14]'
                    : 'bg-white text-[#5E4F43] border-stone-200 hover:border-stone-300'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-[#5E4F43] mr-1">
            Variasi Model:
          </span>
          <button
            type="button"
            onClick={() => setSelectedModelFilter('all')}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
              selectedModelFilter === 'all'
                ? 'bg-[#9E7328] text-white border-[#9E7328]'
                : 'bg-white/70 text-[#5E4F43] border-stone-200 hover:bg-white'
            }`}
          >
            Semua Model
          </button>
          {(Object.keys(DESIGN_STYLE_LABELS) as DesignModelStyle[]).map(
            (styleKey) => {
              const active = selectedModelFilter === styleKey;
              return (
                <button
                  key={styleKey}
                  type="button"
                  onClick={() => setSelectedModelFilter(styleKey)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#9E7328] text-white border-[#9E7328]'
                      : 'bg-white/70 text-[#5E4F43] border-stone-200 hover:bg-white'
                  }`}
                >
                  {DESIGN_STYLE_LABELS[styleKey].label.replace('Model ', '')}
                </button>
              );
            }
          )}
        </div>
      </section>

      {/* Theme Grid */}
      <section aria-label="Daftar Desain Undangan">
        {visibleThemes.length === 0 ? (
          <div className="p-10 rounded-2xl border border-stone-200 bg-white text-center space-y-2">
            <p className="text-sm font-medium text-[#241C16]">
              Tidak ada desain yang cocok dengan kombinasi filter acara dan model ini.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategoryFilter('all');
                setSelectedModelFilter('all');
              }}
              className="text-xs font-semibold text-[#9E7328] hover:underline"
            >
              Tampilkan Semua Desain
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {visibleThemes.map((theme) => {
              const isSelected = config.themeId === theme.id;
              const previewPalette = isSelected
                ? activePalette
                : getPaletteById(theme.defaultPaletteId);
              const canvasColor =
                isSelected && config.useCustomBg
                  ? config.customBgColor
                  : previewPalette.bgCanvas;

              const sampleCopy = getCategoryTemplateCopy(theme.category);
              const sampleMedia = getCategoryMedia(theme.category);
              const categoryLabel =
                EVENT_CATEGORIES.find((c) => c.id === theme.category)?.label ||
                theme.category;

              return (
                <article
                  key={theme.id}
                  className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-[#9E7328] bg-white shadow-md'
                      : 'border-stone-200 bg-white hover:border-[#9E7328]/50'
                  }`}
                >
                  <ThemeCardPreview
                    theme={theme}
                    palette={previewPalette}
                    canvasColor={canvasColor}
                    sampleCopy={sampleCopy}
                    heroImage={sampleMedia.hero}
                    categoryLabel={categoryLabel}
                  />

                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-[#9E7328]">
                          {categoryLabel} · {theme.badgeText}
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#9E7328] shrink-0">
                            <Check className="w-3.5 h-3.5" />
                            Aktif
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-xl font-semibold text-[#241C16] mt-1">
                        {theme.name}
                      </h3>
                      <p className="mt-1.5 text-xs sm:text-sm text-[#5E4F43] leading-relaxed">
                        {theme.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          onPreviewDemo(
                            theme.category,
                            theme.id,
                            isSelected ? config.paletteId : theme.defaultPaletteId
                          )
                        }
                        className="min-h-[42px] px-3 py-2 rounded-xl border border-[#231A14]/25 text-[#241C16] text-xs font-semibold hover:bg-[#FAF6EE] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 shrink-0" />
                        <span className="whitespace-nowrap">Lihat Demo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onEditTheme(
                            theme.category,
                            theme.id,
                            isSelected ? config.paletteId : theme.defaultPaletteId
                          )
                        }
                        className="min-h-[42px] px-3 py-2 rounded-xl bg-[#231A14] text-[#FAF6EE] text-xs font-semibold hover:bg-[#382A20] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                        <span className="whitespace-nowrap">Pilih &amp; Edit</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
