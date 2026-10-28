'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Coins,
  Landmark,
  Package,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldCheck,
  ShoppingBag,
  Send,
  AlertTriangle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useEconomyStore } from '@/store/useEconomyStore';
import { GoldenrodShop } from '@/components/shop/GoldenrodShop';
import { ElasticProgress, Stat } from '@/components/hq/ui/primitives';
import { soundFx } from '@/lib/soundFx';

type EcoTab = 'boveda' | 'mercado' | 'impuestos' | 'meta' | 'bazar';

const TABS: { id: EcoTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'boveda', label: 'Bóveda', icon: Package },
  { id: 'mercado', label: 'Mercado', icon: TrendingUp },
  { id: 'impuestos', label: 'Impuestos', icon: Landmark },
  { id: 'meta', label: 'Meta Dratini', icon: Target },
  { id: 'bazar', label: 'Bazar', icon: ShoppingBag },
];

function currency(value: number) {
  return `₽${Math.round(value || 0).toLocaleString('es-CO')}`;
}

function TypeLine({ text }: { text: string }) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      i += 2;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, 18);
    return () => clearInterval(timer);
  }, [text]);
  return <span>{shown}</span>;
}

export function EconomySanctuary({ initialTab = 'boveda' }: { initialTab?: EcoTab } = {}) {
  const [tab, setTab] = useState<EcoTab>(initialTab);
  const snapshot = useEconomyStore((s) => s.snapshot);
  const loading = useEconomyStore((s) => s.loading);
  const oracleText = useEconomyStore((s) => s.oracleText);
  const loadEconomy = useEconomyStore((s) => s.loadEconomy);
  const loadOracle = useEconomyStore((s) => s.loadOracle);
  const buy = useEconomyStore((s) => s.buy);
  const sell = useEconomyStore((s) => s.sell);
  const dispatchVaultItem = useEconomyStore((s) => s.dispatchVaultItem);
  const activateRescuePlan = useEconomyStore((s) => s.activateRescuePlan);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadEconomy().then(() => loadOracle('bulletin'));
    const onEconomyUpdated = () => {
      loadEconomy();
    };
    window.addEventListener('syndex:economy-updated', onEconomyUpdated);
    return () => window.removeEventListener('syndex:economy-updated', onEconomyUpdated);
  }, [loadEconomy, loadOracle]);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3200);
  };

  const wallet = snapshot?.wallet;
  const debt = snapshot?.tax_debt;
  const progress = Math.min(100, snapshot?.dratini_progress_pct ?? 0);
  // Antes de cargar, no mostramos ₽0: es un dato falso, no un saldo.
  const pending = <span className="text-[#B8B4A8]">—</span>;

  const sortedMarket = useMemo(() => {
    const rows = snapshot?.market ?? [];
    return [...rows].sort((a, b) => (b.change_pct ?? 0) - (a.change_pct ?? 0));
  }, [snapshot]);

  const handleDispatch = async (vaultId: string) => {
    soundFx.playClick();
    const res = await dispatchVaultItem(vaultId);
    if (res.success) {
      soundFx.playLevelUp();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ['#C49347', '#5A7D62', '#3B7A87'] });
      flash('Enviado al cartucho. Pulsa CONTINUAR en el juego.');
    } else {
      soundFx.playDamage();
      flash(res.error || 'No se pudo enviar.');
    }
  };

  return (
    <div className="@container space-y-4">
      {/* HUD económico */}
      <div className="grid grid-cols-2 gap-2.5 @min-[520px]:grid-cols-3">
        <Stat
          label="Wallet"
          value={wallet === undefined ? pending : currency(wallet)}
          icon={Coins}
          accent="var(--hq-gold)"
          hint="Pokédólares"
        />
        <Stat
          label="Deuda"
          value={debt === undefined ? pending : currency(debt)}
          icon={Landmark}
          accent={debt && debt > 0 ? 'var(--hq-danger)' : 'var(--hq-ink-3)'}
          hint={debt === undefined ? 'cargando' : debt > 0 ? 'bloquea compras' : 'al día'}
        />
        <Stat
          label="Dratini"
          value={snapshot ? `${progress.toFixed(0)}%` : pending}
          icon={Target}
          accent="var(--hq-cto)"
          hint="de la meta"
        />
      </div>

      {/* Barra de la meta */}
      <div className="hq-card p-3">
        <div className="flex items-center justify-between text-[10px]">
          <span className="hq-label">Meta Dratini Shiny · {currency(snapshot?.dratini_price ?? 40000)}</span>
          <span className="hq-mono text-[#8A877E]">{snapshot?.dratini_days_left ?? '—'} días</span>
        </div>
        <ElasticProgress value={progress} accent="var(--hq-gold)" className="mt-2" height={6} />
      </div>

      {/* Pestañas */}
      <div className="hq-scroll flex items-center gap-1.5 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                soundFx.playClick();
                setTab(t.id);
              }}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                active
                  ? 'border-[#1F1E1B] bg-[#1F1E1B] text-[#FAF9F5]'
                  : 'border-[#E8E5DD] bg-white text-[#5E5C56] hover:border-[#D5D1C5] hover:text-[#1F1E1B]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div key={tab} className="hq-fade-up space-y-3">
          {tab === 'boveda' && (
            <div className="space-y-2">
              {(snapshot?.vault ?? []).length === 0 ? (
                <div className="hq-panel flex flex-col items-center gap-2 p-6 text-center">
                  <Package className="h-5 w-5 text-[#8A877E]" />
                  <p className="text-xs text-[#5E5C56]">La Bóveda está vacía.</p>
                  <button type="button" onClick={() => setTab('bazar')} className="hq-btn hq-btn-ghost">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Ir al Bazar
                  </button>
                </div>
              ) : (
                (snapshot?.vault ?? []).map((item) => (
                  <div
                    key={item.id}
                    className="hq-card flex items-center justify-between gap-3 p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate text-xs font-semibold text-[#1F1E1B]">
                        {item.display_name}
                        {item.is_shiny && <Sparkles className="h-3 w-3 shrink-0 text-[#C49347]" />}
                      </div>
                      <div className="hq-mono mt-0.5 text-[10px] uppercase text-[#8A877E]">
                        {item.item_type} · x{item.quantity}
                      </div>
                    </div>
                    {item.item_type !== 'cosmetic' && (
                      <button
                        type="button"
                        onClick={() => handleDispatch(item.id)}
                        className="hq-btn hq-btn-ghost shrink-0"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Enviar
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'mercado' && (
            <div className="space-y-2">
              <div className="hq-panel flex items-start gap-2 p-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--hq-cmo)' }} />
                <div className="min-w-0 flex-1">
                  <span className="hq-label">Boletín del Oráculo</span>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[#5E5C56]">
                    <TypeLine text={oracleText || 'El Oráculo observa las bayas de la Ruta 34…'} />
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    loadOracle('bulletin');
                  }}
                  className="shrink-0 rounded-lg border border-[#E8E5DD] bg-white p-1.5 text-[#5E5C56] transition-colors hover:bg-[#F2EFE9]"
                  aria-label="Consultar al Oráculo"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              </div>

              {sortedMarket.map((row) => {
                const up = (row.change_pct ?? 0) >= 0;
                return (
                  <div key={row.item_id} className="hq-card flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-[#1F1E1B]">{row.display_name}</div>
                      <div
                        className="hq-mono mt-0.5 flex items-center gap-1 text-[10px]"
                        style={{ color: up ? 'var(--hq-cto)' : 'var(--hq-danger)' }}
                      >
                        {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {up ? '+' : ''}
                        {row.change_pct ?? 0}%
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="text-right">
                        <span className="hq-label">Compra</span>
                        <div className="hq-mono text-xs font-semibold tabular-nums text-[#1F1E1B]">
                          {currency(row.buy_price)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          soundFx.playClick();
                          const res = await buy(row.item_id, 1);
                          if (res.success) {
                            soundFx.playCoin();
                            confetti({ particleCount: 25, spread: 45, origin: { y: 0.7 }, colors: ['#C49347', '#5A7D62'] });
                            flash(`${row.display_name} comprada y guardada en la Bóveda.`);
                          } else {
                            soundFx.playDamage();
                            flash(res.error || 'No se pudo comprar.');
                          }
                        }}
                        className="hq-btn hq-btn-primary h-7 px-2.5 text-[10px]"
                      >
                        Comprar
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          soundFx.playClick();
                          const res = await sell(row.item_id, 1);
                          if (res.success) {
                            soundFx.playCoin();
                            flash(`Vendida por ${currency(row.sell_price)}.`);
                          } else {
                            soundFx.playDamage();
                            flash(res.error || 'No se pudo vender.');
                          }
                        }}
                        className="hq-btn hq-btn-ghost h-7 px-2.5 text-[10px]"
                      >
                        Vender {currency(row.sell_price)}
                      </button>
                    </div>
                  </div>
                );
              })}

              {sortedMarket.length === 0 && (
                <p className="py-4 text-center text-xs text-[#8A877E]">
                  El mercado abre con el primer tick diario.
                </p>
              )}
            </div>
          )}

          {tab === 'impuestos' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2.5">
                <Stat label="Impuesto diario" value={currency(snapshot?.tax_due ?? 0)} accent="var(--hq-ink)" />
                <Stat label="Hoy cobrado" value={currency(snapshot?.tax_due_today ?? 0)} accent="var(--hq-ink)" />
                <Stat label="Cajas PC" value={snapshot?.pc_boxes ?? 1} accent="var(--hq-cmo)" />
                <Stat label="Slots Bóveda" value={snapshot?.vault_slots ?? 20} accent="var(--hq-cmo)" />
              </div>

              {snapshot?.in_grace ? (
                <div className="hq-card flex items-start gap-2 p-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--hq-cto)' }} />
                  <p className="text-[11px] leading-relaxed text-[#5E5C56]">
                    Días de gracia activos hasta el {snapshot.grace_until}. Sin impuestos todavía.
                  </p>
                </div>
              ) : (
                <div className="hq-card flex items-start gap-2 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--hq-gold)' }} />
                  <p className="text-[11px] leading-relaxed text-[#5E5C56]">
                    El impuesto se cobra a medianoche de Bogotá. Los domingos no se cobra.
                  </p>
                </div>
              )}

              <div className="hq-card flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#1F1E1B]">Plan de Rescate</div>
                  <div className="mt-0.5 text-[11px] text-[#8A877E]">
                    {snapshot?.rescue_plan_active
                      ? `Activo hasta ${snapshot.rescue_until}`
                      : '7 días con impuesto a la mitad'}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!!snapshot?.rescue_plan_active}
                  onClick={async () => {
                    soundFx.playClick();
                    const res = await activateRescuePlan();
                    if (res.success) {
                      soundFx.playLevelUp();
                      flash('Plan de Rescate activado por 7 días.');
                    } else {
                      soundFx.playDamage();
                      flash(res.error || 'No se pudo activar.');
                    }
                  }}
                  className="hq-btn hq-btn-ghost shrink-0"
                >
                  Activar
                </button>
              </div>

              <div className="hq-card flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="hq-label">Expedición semanal</div>
                  <div className="hq-mono mt-0.5 text-xs font-semibold tabular-nums text-[#1F1E1B]">
                    {currency(snapshot?.expedition_week_paid ?? 0)} / {currency(snapshot?.expedition_week_cap ?? 350)}
                  </div>
                </div>
                <span className="hq-chip text-[10px]">Bono por jugar</span>
              </div>
            </div>
          )}

          {tab === 'meta' && (
            <div className="space-y-2.5">
              <div className="hq-card relative overflow-hidden p-5 text-center">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full"
                  style={{
                    background:
                      'radial-gradient(circle, color-mix(in srgb, var(--hq-gold) 20%, transparent), transparent 70%)',
                  }}
                />
                <div className="relative">
                  <span className="hq-label">Objetivo legendario</span>
                  <div className="hq-title mt-1 text-xl text-[#1F1E1B]">Dratini Shiny</div>
                  <div className="hq-mono mt-1 text-xs tabular-nums text-[#5E5C56]">
                    {currency(wallet ?? 0)} de {currency(snapshot?.dratini_price ?? 40000)}
                  </div>
                  <ElasticProgress value={progress} accent="var(--hq-gold)" className="mt-3" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Stat label="Días estimados" value={snapshot?.dratini_days_left ?? '—'} accent="var(--hq-cto)" />
                <Stat label="Ritmo diario" value="~₽430" accent="var(--hq-gold)" hint="tareas + expedición" />
              </div>

              <div className="hq-panel p-3 text-[11px] leading-relaxed text-[#5E5C56]">
                4–5 tareas al día más la Expedición semanal. Compra bayas baratas y véndelas en días altos.
              </div>
            </div>
          )}

          {tab === 'bazar' && <GoldenrodShop />}
      </div>

      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-24 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-xl border border-[#E8E5DD] bg-white px-3 py-2 text-center text-[11px] text-[#1F1E1B] shadow-[0_18px_48px_rgba(31,30,27,0.1)]"
            role="status"
          >
            {notice}
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="hq-mono text-center text-[10px] uppercase tracking-wide text-[#8A877E]">
          Sincronizando economía…
        </div>
      )}
    </div>
  );
}
