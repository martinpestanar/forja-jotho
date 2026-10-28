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
    setShown('');
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

export function EconomySanctuary() {
  const [tab, setTab] = useState<EcoTab>('boveda');
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

  const wallet = snapshot?.wallet ?? 0;
  const debt = snapshot?.tax_debt ?? 0;
  const progress = Math.min(100, snapshot?.dratini_progress_pct ?? 0);

  const sortedMarket = useMemo(() => {
    const rows = snapshot?.market ?? [];
    return [...rows].sort((a, b) => (b.change_pct ?? 0) - (a.change_pct ?? 0));
  }, [snapshot]);

  const handleDispatch = async (vaultId: string) => {
    soundFx.playClick();
    const res = await dispatchVaultItem(vaultId);
    if (res.success) {
      soundFx.playLevelUp();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      flash('📦 Enviado al cartucho. Pulsa CONTINUAR en el juego.');
    } else {
      soundFx.playDamage();
      flash(`⚠️ ${res.error}`);
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-[#E8E5DD] p-3 shadow-sm space-y-3">
      {/* HUD económico */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-[#F4F1EA] border-2 border-black p-2 shadow-[3px_3px_0_#000]">
          <div className="flex items-center gap-1 text-[10px] font-black uppercase text-[#706E66]">
            <Coins className="w-3 h-3" /> Wallet
          </div>
          <div className="font-editorial text-lg font-black text-[#1F1E1B] leading-tight">{currency(wallet)}</div>
        </div>
        <div className={`rounded-xl border-2 p-2 shadow-[3px_3px_0_#000] ${debt > 0 ? 'bg-rose-50 border-rose-500' : 'bg-[#F4F1EA] border-black'}`}>
          <div className="flex items-center gap-1 text-[10px] font-black uppercase text-[#706E66]">
            <Landmark className="w-3 h-3" /> Deuda
          </div>
          <div className={`font-editorial text-lg font-black leading-tight ${debt > 0 ? 'text-rose-600' : 'text-[#1F1E1B]'}`}>
            {currency(debt)}
          </div>
        </div>
        <div className="rounded-xl bg-[#F4F1EA] border-2 border-black p-2 shadow-[3px_3px_0_#000]">
          <div className="flex items-center gap-1 text-[10px] font-black uppercase text-[#706E66]">
            <Target className="w-3 h-3" /> Dratini
          </div>
          <div className="font-editorial text-lg font-black text-[#1F1E1B] leading-tight">{progress.toFixed(0)}%</div>
        </div>
      </div>

      {/* Barra elástica de la meta */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-bold text-[#706E66]">
          <span>Meta Dratini Shiny · {currency(snapshot?.dratini_price ?? 40000)}</span>
          <span>{snapshot?.dratini_days_left ?? '—'} días</span>
        </div>
        <div className="h-3 rounded-full bg-[#E8E5DD] border border-black/20 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#D97043] via-[#D4A359] to-[#6E8B68]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          />
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                soundFx.playClick();
                setTab(t.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase whitespace-nowrap border-2 transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
                active
                  ? 'bg-[#E60012] text-white border-black shadow-[2px_2px_0_#000]'
                  : 'bg-white text-[#706E66] border-black/20 hover:border-black'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="space-y-3"
        >
          {tab === 'boveda' && (
            <div className="space-y-2">
              {(snapshot?.vault ?? []).length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-black/20 p-4 text-center">
                  <p className="text-xs font-bold text-[#706E66]">La Bóveda está vacía.</p>
                  <button
                    onClick={() => setTab('bazar')}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-[11px] font-black border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    Ir al Bazar
                  </button>
                </div>
              ) : (
                (snapshot?.vault ?? []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-[#F4F1EA] border-2 border-black/20 p-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-black text-[#1F1E1B] truncate">
                        {item.display_name}
                        {item.is_shiny && <span className="ml-1 text-[#D4A359]">✦</span>}
                      </div>
                      <div className="text-[10px] font-bold text-[#706E66] uppercase">
                        {item.item_type} · x{item.quantity}
                      </div>
                    </div>
                    {item.item_type !== 'cosmetic' && (
                      <button
                        onClick={() => handleDispatch(item.id)}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#6E8B68] text-white text-[10px] font-black border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                      >
                        <Send className="w-3 h-3" /> Enviar
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'mercado' && (
            <div className="space-y-2">
              <div className="rounded-xl bg-[#F4F1EA] border-2 border-black p-2 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#D4A359] mt-0.5 shrink-0" />
                <p className="text-[11px] font-bold leading-snug text-[#1F1E1B]">
                  <TypeLine text={oracleText || 'El Oráculo observa las bayas de la Ruta 34...'} />
                </p>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    loadOracle('bulletin');
                  }}
                  className="shrink-0 p-1 rounded border border-black/20 hover:border-black"
                  title="Consultar al Oráculo"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              {sortedMarket.map((row) => {
                const up = (row.change_pct ?? 0) >= 0;
                return (
                  <div key={row.item_id} className="rounded-xl border-2 border-black/15 p-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-black text-[#1F1E1B] truncate">{row.display_name}</div>
                      <div className={`text-[10px] font-black flex items-center gap-1 ${up ? 'text-[#22C55E]' : 'text-rose-600'}`}>
                        {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {up ? '+' : ''}{row.change_pct ?? 0}%
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="text-right">
                        <div className="text-[9px] font-bold text-[#706E66] uppercase">Compra</div>
                        <div className="text-xs font-black text-[#1F1E1B]">{currency(row.buy_price)}</div>
                      </div>
                      <button
                        onClick={async () => {
                          soundFx.playClick();
                          const res = await buy(row.item_id, 1);
                          if (res.success) {
                            soundFx.playCoin();
                            confetti({ particleCount: 25, spread: 45, origin: { y: 0.7 } });
                            flash(`🛒 ${row.display_name} comprada y guardada en la Bóveda.`);
                          } else {
                            soundFx.playDamage();
                            flash(`⚠️ ${res.error}`);
                          }
                        }}
                        className="px-2 py-1.5 rounded-lg bg-[#2563EB] text-white text-[10px] font-black border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                      >
                        Comprar
                      </button>
                      <button
                        onClick={async () => {
                          soundFx.playClick();
                          const res = await sell(row.item_id, 1);
                          if (res.success) {
                            soundFx.playCoin();
                            flash(`💰 Vendida por ${currency(row.sell_price)}.`);
                          } else {
                            soundFx.playDamage();
                            flash(`⚠️ ${res.error}`);
                          }
                        }}
                        className="px-2 py-1.5 rounded-lg bg-white text-[#1F1E1B] text-[10px] font-black border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                      >
                        Vender {currency(row.sell_price)}
                      </button>
                    </div>
                  </div>
                );
              })}
              {sortedMarket.length === 0 && (
                <p className="text-xs font-bold text-[#706E66] text-center py-3">
                  El mercado abre con el primer tick diario.
                </p>
              )}
            </div>
          )}

          {tab === 'impuestos' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-[#F4F1EA] border-2 border-black p-2">
                  <div className="text-[10px] font-black uppercase text-[#706E66]">Impuesto diario</div>
                  <div className="text-base font-black text-[#1F1E1B]">{currency(snapshot?.tax_due ?? 0)}</div>
                </div>
                <div className="rounded-xl bg-[#F4F1EA] border-2 border-black p-2">
                  <div className="text-[10px] font-black uppercase text-[#706E66]">Hoy cobrado</div>
                  <div className="text-base font-black text-[#1F1E1B]">{currency(snapshot?.tax_due_today ?? 0)}</div>
                </div>
                <div className="rounded-xl bg-[#F4F1EA] border-2 border-black p-2">
                  <div className="text-[10px] font-black uppercase text-[#706E66]">Cajas PC</div>
                  <div className="text-base font-black text-[#1F1E1B]">{snapshot?.pc_boxes ?? 1}</div>
                </div>
                <div className="rounded-xl bg-[#F4F1EA] border-2 border-black p-2">
                  <div className="text-[10px] font-black uppercase text-[#706E66]">Slots Bóveda</div>
                  <div className="text-base font-black text-[#1F1E1B]">{snapshot?.vault_slots ?? 20}</div>
                </div>
              </div>

              {snapshot?.in_grace ? (
                <div className="rounded-xl bg-emerald-50 border-2 border-emerald-500 p-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <p className="text-[11px] font-bold text-emerald-800">
                    Días de gracia activos hasta el {snapshot.grace_until}. Sin impuestos todavía.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-amber-50 border-2 border-amber-500 p-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <p className="text-[11px] font-bold text-amber-800">
                    El impuesto se cobra a medianoche de Bogotá. Los domingos no se cobra.
                  </p>
                </div>
              )}

              <div className="rounded-xl border-2 border-black/15 p-2 flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-black text-[#1F1E1B]">Plan de Rescate</div>
                  <div className="text-[10px] font-bold text-[#706E66]">
                    {snapshot?.rescue_plan_active
                      ? `Activo hasta ${snapshot.rescue_until}`
                      : '7 días con impuesto a la mitad'}
                  </div>
                </div>
                <button
                  disabled={!!snapshot?.rescue_plan_active}
                  onClick={async () => {
                    soundFx.playClick();
                    const res = await activateRescuePlan();
                    if (res.success) {
                      soundFx.playLevelUp();
                      flash('🛡️ Plan de Rescate activado por 7 días.');
                    } else {
                      soundFx.playDamage();
                      flash(`⚠️ ${res.error}`);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#D4A359] text-[#1F1E1B] text-[10px] font-black border-2 border-black shadow-[2px_2px_0_#000] disabled:opacity-50 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  Activar
                </button>
              </div>

              <div className="rounded-xl bg-[#F4F1EA] border-2 border-black/15 p-2 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase text-[#706E66]">Expedición semanal</div>
                  <div className="text-xs font-black text-[#1F1E1B]">
                    {currency(snapshot?.expedition_week_paid ?? 0)} / {currency(snapshot?.expedition_week_cap ?? 350)}
                  </div>
                </div>
                <div className="text-[10px] font-bold text-[#706E66]">Bono por jugar</div>
              </div>
            </div>
          )}

          {tab === 'meta' && (
            <div className="space-y-2">
              <div className="rounded-xl bg-gradient-to-br from-[#F4F1EA] to-[#E8E5DD] border-2 border-black p-3 text-center shadow-[3px_3px_0_#000]">
                <div className="text-[10px] font-black uppercase text-[#706E66]">Objetivo legendario</div>
                <div className="font-editorial text-xl font-black text-[#1F1E1B]">Dratini Shiny ✦</div>
                <div className="text-xs font-bold text-[#706E66]">
                  {currency(wallet)} de {currency(snapshot?.dratini_price ?? 40000)}
                </div>
                <div className="mt-2 h-3 rounded-full bg-white border border-black/20 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#22C55E] to-[#D4A359]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: 'spring', stiffness: 100, damping: 16 }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-[#F4F1EA] border-2 border-black/15 p-2 text-center">
                  <div className="text-[10px] font-black uppercase text-[#706E66]">Días estimados</div>
                  <div className="text-lg font-black text-[#1F1E1B]">{snapshot?.dratini_days_left ?? '—'}</div>
                </div>
                <div className="rounded-xl bg-[#F4F1EA] border-2 border-black/15 p-2 text-center">
                  <div className="text-[10px] font-black uppercase text-[#706E66]">Ritmo diario</div>
                  <div className="text-lg font-black text-[#1F1E1B]">~430 ₽</div>
                </div>
              </div>
              <div className="rounded-xl bg-white border-2 border-black/10 p-2 text-[11px] font-bold text-[#706E66]">
                4–5 tareas al día + Expedición semanal. Compra bayas baratas y véndelas en días altos.
              </div>
            </div>
          )}

          {tab === 'bazar' && <GoldenrodShop />}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-3 py-2 rounded-xl bg-[#1F1E1B] text-white text-[11px] font-bold shadow-lg max-w-[90vw] text-center"
          >
            {notice}
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="text-center text-[10px] font-black uppercase text-[#706E66]">Sincronizando economía…</div>
      )}
    </div>
  );
}
