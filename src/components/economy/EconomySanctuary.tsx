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
  Bot,
  Sprout,
  Building2,
  Receipt,
  CheckCircle2,
  Briefcase,
} from 'lucide-react';
import { useEconomyStore } from '@/store/useEconomyStore';
import { GoldenrodShop } from '@/components/shop/GoldenrodShop';
import { ElasticProgress, Stat } from '@/components/hq/ui/primitives';
import { soundFx } from '@/lib/soundFx';

type EcoTab = 'boveda' | 'mercado' | 'rentas' | 'impuestos' | 'meta' | 'bazar';

const TABS: { id: EcoTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'boveda', label: 'Bóveda', icon: Package },
  { id: 'mercado', label: 'Bolsa & Bot', icon: TrendingUp },
  { id: 'rentas', label: 'Rentas & Staking', icon: Sprout },
  { id: 'impuestos', label: 'Facturas Bill', icon: Receipt },
  { id: 'meta', label: 'Meta 50K', icon: Target },
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
  const [marketFilter, setMarketFilter] = useState<'all' | 'bonguri' | 'berry'>('all');
  const snapshot = useEconomyStore((s) => s.snapshot);
  const loading = useEconomyStore((s) => s.loading);
  const oracleText = useEconomyStore((s) => s.oracleText);
  const loadEconomy = useEconomyStore((s) => s.loadEconomy);
  const loadOracle = useEconomyStore((s) => s.loadOracle);
  const buy = useEconomyStore((s) => s.buy);
  const sell = useEconomyStore((s) => s.sell);
  const tradeWithBot = useEconomyStore((s) => s.tradeWithBot);
  const buyPassiveAsset = useEconomyStore((s) => s.buyPassiveAsset);
  const harvestPassiveRents = useEconomyStore((s) => s.harvestPassiveRents);
  const claimEmergencyWork = useEconomyStore((s) => s.claimEmergencyWork);
  const dispatchVaultItem = useEconomyStore((s) => s.dispatchVaultItem);
  const activateRescuePlan = useEconomyStore((s) => s.activateRescuePlan);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadEconomy().then(() => loadOracle('bulletin'));
    const onEconomyUpdated = (evt: Event) => {
      loadEconomy();
      const detail = (evt as CustomEvent)?.detail;
      if (detail?.reward && detail.reward > 0) {
        soundFx.playCoin();
        flash(`¡Sueldo HQ acreditado: +${currency(detail.reward)}!`);
      }
    };
    window.addEventListener('syndex:economy-updated', onEconomyUpdated);
    return () => window.removeEventListener('syndex:economy-updated', onEconomyUpdated);
  }, [loadEconomy, loadOracle]);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const wallet = snapshot?.wallet;
  const debt = snapshot?.tax_debt;
  const progress = Math.min(100, snapshot?.dratini_progress_pct ?? 0);
  const pending = <span className="text-[#B8B4A8]">—</span>;

  // Mapa rápido de lo que el usuario tiene en Bóveda para mostrar cantidad y P&L en la Bolsa
  const vaultByItem = useMemo(() => {
    const map = new Map<string, { qty: number; avgPrice: number }>();
    for (const v of snapshot?.vault ?? []) {
      const prev = map.get(v.item_id_or_species);
      const qty = (prev?.qty ?? 0) + v.quantity;
      const avgPrice = Number(v.avg_buy_price || v.payload_json?.unit_price || 0);
      map.set(v.item_id_or_species, { qty, avgPrice });
    }
    return map;
  }, [snapshot]);

  const sortedMarket = useMemo(() => {
    const rows = snapshot?.market ?? [];
    const filtered = rows.filter((r) => {
      if (marketFilter === 'bonguri') return r.item_id.startsWith('BONGURI_');
      if (marketFilter === 'berry') return !r.item_id.startsWith('BONGURI_');
      return true;
    });
    return [...filtered].sort((a, b) => {
      const aBong = a.item_id.startsWith('BONGURI_') ? 1 : 0;
      const bBong = b.item_id.startsWith('BONGURI_') ? 1 : 0;
      if (aBong !== bBong) return bBong - aBong;
      return (a.change_pct ?? 0) - (b.change_pct ?? 0); // Primero los más baratos/caídos para comprar
    });
  }, [snapshot, marketFilter]);

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

  const event = snapshot?.market_event;
  const botOrders = snapshot?.bot_orders ?? [];
  const fixedCosts = snapshot?.fixed_costs;
  const passiveCatalog = snapshot?.passive_catalog ?? [];
  const userAssets = snapshot?.user_assets ?? [];
  const ownedAssetsMap = new Map(userAssets.map((ua) => [ua.asset_code, ua]));

  return (
    <div className="@container space-y-4">
      {/* HUD económico unificado */}
      <div className="grid grid-cols-2 gap-2.5 @min-[520px]:grid-cols-4">
        <Stat
          label="Moneda Única"
          value={wallet === undefined ? pending : currency(wallet)}
          icon={Coins}
          accent="var(--hq-gold)"
          hint="App & Cartucho GBA"
        />
        <Stat
          label="Renta Pasiva"
          value={snapshot ? `+${currency(snapshot.daily_passive_rp ?? 0)}/día` : pending}
          icon={Sprout}
          accent="var(--hq-cto)"
          hint={snapshot?.productive_today ? 'Activa hoy' : 'Requiere 1 tarea'}
        />
        <Stat
          label="Factura Semanal"
          value={fixedCosts ? currency(fixedCosts.total_weekly) : pending}
          icon={Landmark}
          accent={debt && debt > 0 ? 'var(--hq-danger)' : 'var(--hq-ink-3)'}
          hint={debt && debt > 0 ? `Embargo: ${currency(debt)}` : `${currency(fixedCosts?.daily_slice ?? 0)}/día`}
        />
        <Stat
          label="Meta Shiny 50K"
          value={snapshot ? `${progress.toFixed(0)}%` : pending}
          icon={Target}
          accent="var(--hq-cmo)"
          hint={`${snapshot?.dratini_days_left ?? '—'} días est.`}
        />
      </div>

      {/* Barra de la meta */}
      <div className="hq-card p-3">
        <div className="flex items-center justify-between text-[10px]">
          <span className="hq-label">Meta Olimpo Shiny · {currency(snapshot?.dratini_price ?? 50000)}</span>
          <span className="hq-mono text-[#8A877E]">
            {snapshot?.dratini_days_left ?? '—'} días sin trading · ~35 días con Bolsa Bonguri
          </span>
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
        {/* ================= PESTAÑA 1: BÓVEDA ================= */}
        {tab === 'boveda' && (
          <div className="space-y-2">
            {(snapshot?.vault ?? []).length === 0 ? (
              <div className="hq-panel flex flex-col items-center gap-2 p-6 text-center">
                <Package className="h-5 w-5 text-[#8A877E]" />
                <p className="text-xs text-[#5E5C56]">Tu Bóveda de Ciudad Trigal está vacía.</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setTab('mercado')} className="hq-btn hq-btn-primary">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Ir a la Bolsa de Bonguris
                  </button>
                  <button type="button" onClick={() => setTab('bazar')} className="hq-btn hq-btn-ghost">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Ir al Bazar
                  </button>
                </div>
              </div>
            ) : (
              (snapshot?.vault ?? []).map((item) => {
                const avg = Number(item.avg_buy_price || item.payload_json?.unit_price || 0);
                return (
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
                        {avg > 0 ? ` · Costo prom: ${currency(avg)}` : ' · Cosechado'}
                      </div>
                    </div>
                    {item.item_type !== 'cosmetic' && (
                      <button
                        type="button"
                        onClick={() => handleDispatch(item.id)}
                        className="hq-btn hq-btn-ghost shrink-0"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Inyectar a GBA
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ================= PESTAÑA 2: BOLSA & BOT ================= */}
        {tab === 'mercado' && (
          <div className="space-y-3">
            {/* Banner de Evento Semanal y Rumor IA */}
            {event && (
              <div className="hq-card space-y-2 border-l-4 border-l-[#C49347] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="hq-chip text-[9px] font-semibold uppercase">
                    📰 Ciclo Semanal · {event.regime}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      loadOracle('director');
                      flash('Agente IA recalculando pulso del mercado…');
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#E8E5DD] bg-white px-2 py-1 text-[10px] font-medium text-[#5E5C56] hover:bg-[#F2EFE9]"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Pulso IA
                  </button>
                </div>
                <p className="text-xs font-semibold leading-snug text-[#1F1E1B]">{event.headline}</p>
                <p className="rounded-lg bg-[#FAF9F5] px-2.5 py-1.5 text-[11px] text-[#5E5C56]">
                  🔮 <strong>Insider:</strong> {event.rumor}
                </p>
              </div>
            )}

            {/* Boletín de voz del Oráculo */}
            <div className="hq-panel flex items-start gap-2 p-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--hq-cmo)' }} />
              <div className="min-w-0 flex-1">
                <span className="hq-label">Consejo del Oráculo Financiero</span>
                <p className="mt-0.5 text-[11px] leading-relaxed text-[#5E5C56]">
                  <TypeLine text={oracleText || 'Compra Bonguris cuando caigan -40% y véndelos al Bot en el rebote…'} />
                </p>
              </div>
            </div>

            {/* Libro de Órdenes Relámpago del Bot Mercader */}
            {botOrders.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="hq-label flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5 text-[#3B7A87]" />
                    Órdenes Relámpago del Bot (Stock Limitado Hoy)
                  </span>
                </div>
                <div className="grid gap-2 @min-[540px]:grid-cols-2">
                  {botOrders.map((order) => {
                    const isBotBuying = order.order_side === 'BUY_FROM_USER';
                    const owned = vaultByItem.get(order.item_id)?.qty ?? 0;
                    return (
                      <div key={order.id} className="hq-card flex flex-col justify-between gap-2.5 p-3">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="hq-mono text-[10px] font-semibold uppercase text-[#3B7A87]">
                              🤖 {order.bot_name}
                            </span>
                            <span className="hq-chip text-[9px]">
                              Cupo: {order.remaining_qty}/{order.max_qty}
                            </span>
                          </div>
                          <div className="mt-1 text-xs font-semibold text-[#1F1E1B]">
                            {isBotBuying ? `Compra tus ${order.display_name}` : `Remata ${order.display_name}`}
                          </div>
                          <p className="mt-0.5 text-[11px] leading-snug text-[#5E5C56]">{order.reason}</p>
                        </div>

                        <div className="flex items-center justify-between gap-2 border-t border-[#E8E5DD] pt-2">
                          <div>
                            <span className="hq-label">Precio Bot</span>
                            <div className="hq-mono text-xs font-bold text-[#1F1E1B]">
                              {currency(order.unit_price)}{' '}
                              <span className="text-[10px] font-normal text-[#8A877E]">
                                (Base {currency(order.base_price)})
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={async () => {
                                soundFx.playClick();
                                const res = await tradeWithBot(order.id, 1);
                                if (res.success) {
                                  soundFx.playCoin();
                                  confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
                                  flash(
                                    isBotBuying
                                      ? `Vendiste 1 unidad al Bot por ${currency(order.unit_price)}.`
                                      : `Compraste 1 unidad en oferta del Bot por ${currency(order.unit_price)}.`
                                  );
                                } else {
                                  soundFx.playDamage();
                                  flash(res.error || 'No se pudo ejecutar la orden.');
                                }
                              }}
                              className="hq-btn hq-btn-primary h-7 px-2.5 text-[10px]"
                            >
                              {isBotBuying ? `Vender 1 (Tienes ${owned})` : 'Comprar 1'}
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                soundFx.playClick();
                                const res = await tradeWithBot(order.id, 5);
                                if (res.success) {
                                  soundFx.playLevelUp();
                                  confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
                                  flash(`Operación x5 con el Bot completada (${currency(res.total ?? 0)}).`);
                                } else {
                                  soundFx.playDamage();
                                  flash(res.error || 'No se pudo ejecutar x5.');
                                }
                              }}
                              className="hq-btn hq-btn-ghost h-7 px-2 text-[10px]"
                            >
                              x5
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filtros de Pizarra de Cotizaciones */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="hq-label">Pizarra de Cotizaciones</span>
              <div className="flex gap-1">
                {(['all', 'bonguri', 'berry'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setMarketFilter(f)}
                    className={`rounded-lg border px-2 py-0.5 text-[10px] font-medium ${
                      marketFilter === f
                        ? 'border-[#1F1E1B] bg-[#1F1E1B] text-white'
                        : 'border-[#E8E5DD] bg-white text-[#5E5C56]'
                    }`}
                  >
                    {f === 'all' ? 'Todos' : f === 'bonguri' ? '🌰 Bonguris' : '🍓 Bayas'}
                  </button>
                ))}
              </div>
            </div>

            {sortedMarket.map((row) => {
              const up = (row.change_pct ?? 0) >= 0;
              const holding = vaultByItem.get(row.item_id);
              const pnlPct =
                holding && holding.avgPrice > 0
                  ? Math.round(((row.sell_price - holding.avgPrice) * 100) / holding.avgPrice)
                  : null;

              return (
                <div key={row.item_id} className="hq-card flex flex-wrap items-center justify-between gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 truncate text-xs font-semibold text-[#1F1E1B]">
                      {row.display_name}
                      {holding && holding.qty > 0 && (
                        <span className="hq-chip text-[9px]">
                          En Bóveda: x{holding.qty}
                          {pnlPct !== null ? ` (${pnlPct >= 0 ? '+' : ''}${pnlPct}%)` : ''}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span
                        className="hq-mono flex items-center gap-1 text-[10px] font-semibold"
                        style={{ color: up ? 'var(--hq-cto)' : 'var(--hq-danger)' }}
                      >
                        {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {up ? '+' : ''}
                        {row.change_pct ?? 0}% hoy
                      </span>
                      <span className="hq-mono text-[10px] text-[#8A877E]">
                        Base: {currency(row.base_price)}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <div className="mr-1 text-right">
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
                          flash(`${row.display_name} x1 guardada en Bóveda.`);
                        } else {
                          soundFx.playDamage();
                          flash(res.error || 'No se pudo comprar.');
                        }
                      }}
                      className="hq-btn hq-btn-primary h-7 px-2 text-[10px]"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        soundFx.playClick();
                        const res = await buy(row.item_id, 5);
                        if (res.success) {
                          soundFx.playCoin();
                          confetti({ particleCount: 25, spread: 45, origin: { y: 0.7 } });
                          flash(`${row.display_name} x5 acumuladas en Bóveda.`);
                        } else {
                          soundFx.playDamage();
                          flash(res.error || 'No se pudo comprar x5.');
                        }
                      }}
                      className="hq-btn hq-btn-primary h-7 px-2 text-[10px]"
                    >
                      +5
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
                      className="hq-btn hq-btn-ghost h-7 px-2 text-[10px]"
                    >
                      Vender {currency(row.sell_price)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= PESTAÑA 3: RENTAS PASIVAS & STAKING ================= */}
        {tab === 'rentas' && (
          <div className="space-y-3">
            <div className="hq-card flex flex-wrap items-center justify-between gap-3 p-3.5">
              <div>
                <span className="hq-label">Cosecha Diaria de Propiedades y Staking</span>
                <div className="mt-0.5 text-xs font-semibold text-[#1F1E1B]">
                  Flujo pasivo actual: +{currency(snapshot?.daily_passive_rp ?? 0)} / día + Bonguris de Huerto
                </div>
                <p className="mt-0.5 text-[11px] text-[#5E5C56]">
                  {snapshot?.productive_today
                    ? '✅ Día productivo verificado: tus propiedades están listas para pagar.'
                    : '⚡ Completa 1 tarea en el HQ o el Turno de Guardia para habilitar el cobro de hoy.'}
                </p>
              </div>
              <button
                type="button"
                disabled={!!snapshot?.rents_harvested_today}
                onClick={async () => {
                  soundFx.playClick();
                  const res = await harvestPassiveRents();
                  if (res.success) {
                    soundFx.playLevelUp();
                    confetti({ particleCount: 55, spread: 65, origin: { y: 0.7 } });
                    flash(
                      `¡Cosecha recibida: +${currency(res.earned_rp ?? 0)} y +${res.bonguris ?? 0} Bonguris en tu Bóveda!`
                    );
                  } else {
                    soundFx.playDamage();
                    flash(res.error || 'Aún no puedes cosechar hoy.');
                  }
                }}
                className="hq-btn hq-btn-primary shrink-0 disabled:opacity-40"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {snapshot?.rents_harvested_today ? 'Cosechado hoy' : 'Cobrar Rentas de Hoy'}
              </button>
            </div>

            <div className="grid gap-2.5 @min-[540px]:grid-cols-2">
              {passiveCatalog.map((asset) => {
                const owned = ownedAssetsMap.get(asset.asset_code)?.quantity ?? 0;
                return (
                  <div key={asset.asset_code} className="hq-card flex flex-col justify-between gap-3 p-3.5">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="hq-chip text-[9px] uppercase">{asset.category}</span>
                        <span className="hq-mono text-[10px] font-semibold text-[#5E5C56]">
                          Posees: {owned}/{asset.max_owned}
                        </span>
                      </div>
                      <h3 className="mt-1.5 text-xs font-semibold text-[#1F1E1B]">{asset.display_name}</h3>
                      <p className="mt-1 text-[11px] leading-snug text-[#5E5C56]">{asset.description}</p>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-[#E8E5DD] pt-2.5">
                      <div>
                        <div className="hq-mono text-xs font-semibold text-[#5A7D62]">
                          {asset.daily_yield_rp > 0
                            ? `+${currency(asset.daily_yield_rp)} / día`
                            : `+${asset.yield_item_qty} Bonguris / día`}
                        </div>
                        <div className="hq-mono text-[10px] text-[#8A877E]">
                          Mant. semanal: {currency(asset.weekly_upkeep)}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={owned >= asset.max_owned}
                        onClick={async () => {
                          soundFx.playClick();
                          const res = await buyPassiveAsset(asset.asset_code);
                          if (res.success) {
                            soundFx.playLevelUp();
                            confetti({ particleCount: 40, spread: 55, origin: { y: 0.7 } });
                            flash(`¡Adquiriste ${asset.display_name}!`);
                          } else {
                            soundFx.playDamage();
                            flash(res.error || 'No se pudo comprar.');
                          }
                        }}
                        className="hq-btn hq-btn-primary h-8 px-3 text-[11px] disabled:opacity-40"
                      >
                        Invertir {currency(asset.purchase_cost)}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= PESTAÑA 4: FACTURAS DE BILL E IMPUESTOS ================= */}
        {tab === 'impuestos' && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5 @min-[520px]:grid-cols-4">
              <Stat
                label="Servidor PC Bill"
                value={currency(fixedCosts?.bill_pc_weekly ?? 50)}
                accent="var(--hq-ink)"
                hint={`${snapshot?.pc_boxes ?? 1} Cajas activas / sem`}
              />
              <Stat
                label="Custodia Bóveda"
                value={currency(fixedCosts?.vault_weekly ?? 30)}
                accent="var(--hq-cmo)"
                hint={`${fixedCosts?.vault_items_count ?? 0} objetos guardados`}
              />
              <Stat
                label="Licencia & Seguro"
                value={currency(fixedCosts?.league_license_weekly ?? 50)}
                accent="var(--hq-cto)"
                hint="Centro Pokémon / sem"
              />
              <Stat
                label="Cuota Diaria"
                value={currency(fixedCosts?.daily_slice ?? snapshot?.tax_due ?? 0)}
                accent="var(--hq-gold)"
                hint="Lunes a Sábado"
              />
            </div>

            {/* Desglose y botón de Guardia de Emergencia anti-quiebra */}
            <div className="hq-card flex flex-wrap items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1F1E1B]">
                  <Briefcase className="h-3.5 w-3.5 text-[#3B7A87]" />
                  Turno de Guardia en Centro Pokémon (Anti-Quiebra)
                </div>
                <p className="mt-0.5 text-[11px] text-[#5E5C56]">
                  ¿Sin liquidez o con embargo de Bill? Haz un turno rápido de 15m hoy para ganar +60 ₽ y activar tus rentas.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  soundFx.playClick();
                  const res = await claimEmergencyWork();
                  if (res.success) {
                    soundFx.playCoin();
                    confetti({ particleCount: 30, spread: 45, origin: { y: 0.7 } });
                    flash(`¡Turno completado! +${currency(res.reward ?? 60)} acreditados.`);
                  } else {
                    soundFx.playDamage();
                    flash(res.error || 'Ya cumpliste el turno hoy.');
                  }
                }}
                className="hq-btn hq-btn-primary shrink-0"
              >
                Cobrar Turno (+₽60)
              </button>
            </div>

            {snapshot?.in_grace ? (
              <div className="hq-card flex items-start gap-2 p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--hq-cto)' }} />
                <p className="text-[11px] leading-relaxed text-[#5E5C56]">
                  Días de gracia activos hasta el {snapshot.grace_until}. Bill no cobra mantenimiento todavía.
                </p>
              </div>
            ) : (
              <div className="hq-card flex items-start gap-2 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--hq-gold)' }} />
                <p className="text-[11px] leading-relaxed text-[#5E5C56]">
                  La cuota diaria de almacenamiento (PC de Bill + Bóveda) se debita a medianoche. Los domingos son libres.
                </p>
              </div>
            )}

            <div className="hq-card flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#1F1E1B]">Plan de Reestructuración de Bill</div>
                <div className="mt-0.5 text-[11px] text-[#8A877E]">
                  {snapshot?.rescue_plan_active
                    ? `Activo hasta ${snapshot.rescue_until}`
                    : '7 días con facturas de almacenamiento a mitad de precio'}
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
                    flash('Plan de Reestructuración activado por 7 días.');
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
                <div className="hq-label">Recompensas de Combate GBA Hoy</div>
                <div className="hq-mono mt-0.5 text-xs font-semibold tabular-nums text-[#1F1E1B]">
                  {currency(snapshot?.expedition_week_paid ?? 0)} / {currency(snapshot?.expedition_week_cap ?? 650)}
                </div>
              </div>
              <span className="hq-chip text-[10px]">Moneda Espejo 1:1</span>
            </div>
          </div>
        )}

        {/* ================= PESTAÑA 5: META 50K ================= */}
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
                <span className="hq-label">Olimpo Shiny · 4 Meses vs. Mercado</span>
                <div className="hq-title mt-1 text-xl text-[#1F1E1B]">
                  Dratini · Larvitar · Beldum Shiny
                </div>
                <div className="hq-mono mt-1 text-xs tabular-nums text-[#5E5C56]">
                  {currency(wallet ?? 0)} de {currency(snapshot?.dratini_price ?? 50000)}
                </div>
                <ElasticProgress value={progress} accent="var(--hq-gold)" className="mt-3" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Stat label="Días a ritmo actual" value={snapshot?.dratini_days_left ?? '—'} accent="var(--hq-cto)" />
              <Stat
                label="Ingreso Diario Est."
                value={`~${currency(420 + (snapshot?.daily_passive_rp ?? 0))}`}
                accent="var(--hq-gold)"
                hint="tareas HQ + rentas"
              />
            </div>

            <div className="hq-panel p-3 text-[11px] leading-relaxed text-[#5E5C56]">
              Con ahorro normal (420 ₽/día) toma 120 días (4 meses). Comprando Bonguris en caída (-45%) y vendiendo al Bot Silph Co. (+65%), reduces el tiempo a 5-6 semanas.
            </div>
          </div>
        )}

        {/* ================= PESTAÑA 6: BAZAR ================= */}
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
