'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  ShoppingBag,
  Coins,
  Sparkles,
  Zap,
  Glasses,
  Flame,
  Egg,
  Dna,
  Shield,
  UserCheck,
  Lock,
  Tag,
  Plus,
  Minus,
  Package,
  ArrowUpRight,
  Check,
} from 'lucide-react';
import { useTrainerStore } from '@/store/useTrainerStore';
import { useEconomyStore } from '@/store/useEconomyStore';
import { soundFx } from '@/lib/soundFx';
import { LayeredSpriteCanvas } from '@/components/tuning/LayeredSpriteCanvas';
import { POKEMON_ASSETS } from '@/lib/pokemonAssets';
import { EXPANDED_SHOP_CATALOG, ShopFloor, ShopProduct } from '@/lib/shopCatalog';
import { POKEMON_COSTUMES_CATALOG } from '@/types/cosmetics';

const CATALOG_ITEMS = EXPANDED_SHOP_CATALOG;

const FLOORS: { id: ShopFloor; label: string; floorNum: string; icon: any }[] = [
  { id: 'eggs', label: 'Huevos de Crianza', floorNum: '1F', icon: Egg },
  { id: 'breeding', label: 'Genética & Crianza', floorNum: '2F', icon: Dna },
  { id: 'mints', label: 'Máquinas de Naturaleza', floorNum: '2F-B', icon: Sparkles },
  { id: 'specials', label: 'Pokémon Especiales', floorNum: '3F', icon: Sparkles },
  { id: 'supplies', label: 'Bolsillos GBA', floorNum: '4F', icon: Zap },
  { id: 'tms', label: 'Máquinas Técnicas (MT)', floorNum: '4F-B', icon: Zap },
  { id: 'pokemon_costumes', label: 'Equipamiento & Armaduras', floorNum: '5F', icon: Shield },
  { id: 'trainer_skins', label: 'Skins de Entrenador', floorNum: '6F', icon: UserCheck },
  { id: 'cosmetics', label: 'Auras & Títulos Web', floorNum: '7F', icon: Glasses },
];

function currency(value: number) {
  return `₽${Math.round(value || 0).toLocaleString('es-CO')}`;
}

export const GoldenrodShop: React.FC = () => {
  const profile = useTrainerStore((s) => s.profile);
  const purchaseShopItemRpc = useTrainerStore((s) => s.purchaseShopItemRpc);

  const [currentFloor, setCurrentFloor] = useState<ShopFloor>('eggs');
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct>(CATALOG_ITEMS[0]);
  const [quantity, setQuantity] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [tmFilter, setTmFilter] = useState<string>('todos');

  const economyPrices = useEconomyStore((s) => s.prices);
  const loadPrices = useEconomyStore((s) => s.loadPrices);
  const oracleText = useEconomyStore((s) => s.oracleText);
  const loadOracle = useEconomyStore((s) => s.loadOracle);

  useEffect(() => {
    loadPrices();
    loadOracle('greeting');
  }, [loadPrices, loadOracle]);

  const priceOf = (product: ShopProduct) => economyPrices[product.id] ?? product.cost;

  // Cosméticos equipados en preview
  const [equippedGlasses] = useState<boolean>(true);
  const [equippedAura] = useState<boolean>(true);
  const [equippedCap] = useState<boolean>(false);

  // La wallet real vive en la economía; el perfil es solo respaldo visual.
  const economyWallet = useEconomyStore((s) => s.snapshot?.wallet);
  const pokedollars = economyWallet ?? profile?.pokedollars ?? 0;
  const starter = profile?.starter_pokemon ?? 'cyndaquil';

  // Conjunto de especies que el alumno posee actualmente en su inventario / equipo / starter
  const starterSpeciesMap: Record<string, number> = {
    cyndaquil: 155,
    totodile: 158,
    chikorita: 152,
  };
  const starterSpeciesId = starterSpeciesMap[starter] || 155;
  const partySpeciesIds = (profile?.gba_party_json || [])
    .map((p: any) => Number(p?.speciesId))
    .filter((id: number) => !isNaN(id) && id > 0);

  const ownedSpeciesIds = new Set<number>([starterSpeciesId, ...partySpeciesIds]);

  const floorItems = CATALOG_ITEMS.filter((item) => item.floor === currentFloor);
  const visibleFloorItems =
    currentFloor === 'tms' && tmFilter !== 'todos'
      ? floorItems.filter((item) => item.moveType === tmFilter)
      : floorItems;
  const tmTypes = Array.from(
    new Set(CATALOG_ITEMS.filter((i) => i.floor === 'tms').map((i) => i.moveType).filter(Boolean))
  ) as string[];
  const dailyDeal = CATALOG_ITEMS.find((item) => item.isDailyDeal);
  const activeFloor = FLOORS.find((floor) => floor.id === currentFloor);

  // Calcular precio total con multiplicador de cantidad (sólo para ítems apilables)
  const isStackable = selectedProduct.type === 'item';
  const effectiveCost = priceOf(selectedProduct);
  const totalCost = isStackable ? effectiveCost * quantity : effectiveCost;
  const canAfford = pokedollars >= totalCost;

  // Validación de posesión previa del Pokémon para equipamientos
  const isCostumeLocked =
    selectedProduct.type === 'pokemon_costume' &&
    !!selectedProduct.speciesId &&
    !ownedSpeciesIds.has(selectedProduct.speciesId);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleBuy = async () => {
    if (isProcessing) return;

    if (isCostumeLocked) {
      soundFx.playDamage();
      showToast(`Requiere tener a ${selectedProduct.speciesName || 'este Pokémon'} en tu equipo o inventario.`);
      return;
    }

    if (!canAfford) {
      soundFx.playDamage();
      showToast(`Saldo insuficiente: necesitas ${currency(totalCost)}.`);
      return;
    }

    soundFx.playClick();
    setIsProcessing(true);

    try {
      // 1. Invocar RPC: el precio SIEMPRE lo decide el servidor
      const result = await purchaseShopItemRpc(selectedProduct.id, quantity);

      if (!result.success) {
        soundFx.playDamage();
        showToast(result.error || 'No se pudo completar la compra');
        return;
      }

      // 2. Todo lo comprado nace en la Bóveda (nada se pierde si el emulador está cerrado)
      if (
        selectedProduct.type === 'item' ||
        selectedProduct.type === 'pokemon' ||
        selectedProduct.type === 'egg'
      ) {
        soundFx.playLevelUp();
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#C49347', '#5A7D62', '#3B7A87', '#D97043'],
        });
        showToast(`${selectedProduct.name} guardado en la Bóveda. Envíalo al juego desde Santuario.`);
      } else {
        soundFx.playCoin();
        confetti({ particleCount: 30, spread: 45, origin: { y: 0.6 }, colors: ['#C49347', '#D97043'] });
        showToast(`${selectedProduct.name} desbloqueado en tu inventario.`);
      }

      await useTrainerStore.getState().loadSessionProfileRpc();
      await useEconomyStore.getState().loadEconomy();

      setQuantity(1);
    } catch (err: any) {
      console.error(err);
      soundFx.playDamage();
      showToast('Error procesando la transacción.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="@container space-y-4">
      {/* Aviso flotante */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="hq-card flex items-start gap-2 p-3"
            role="status"
          >
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#5A7D62]" />
            <span className="text-xs leading-relaxed text-[#1F1E1B]">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Encabezado del Bazar */}
      <div className="hq-card relative overflow-hidden p-4">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--hq-gold) 18%, transparent), transparent 70%)',
          }}
        />
        <div className="relative flex flex-col gap-3 @min-[560px]:flex-row @min-[560px]:items-center @min-[560px]:justify-between">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
              style={{
                color: 'var(--hq-gold)',
                borderColor: 'color-mix(in srgb, var(--hq-gold) 25%, transparent)',
                backgroundColor: 'color-mix(in srgb, var(--hq-gold) 10%, white)',
              }}
            >
              <ShoppingBag className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <span className="hq-label">Bazar de Ciudad Trigal</span>
              <h2 className="hq-title text-lg leading-tight text-[#1F1E1B] sm:text-xl">
                Departamento Goldenrod
              </h2>
              <p className="mt-0.5 text-[11px] text-[#8A877E]">
                Todo lo que compras nace en tu Bóveda y viaja al cartucho.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className="text-right">
              <span className="hq-label">Saldo</span>
              <div className="hq-mono text-lg font-semibold tabular-nums text-[#1F1E1B]">
                {currency(pokedollars)}
              </div>
            </div>
            <div className="rounded-xl border border-[#E8E5DD] bg-[#FAF9F5] p-1">
              <LayeredSpriteCanvas
                starter={starter}
                size="sm"
                cosmeticGlasses={equippedGlasses}
                cosmeticAura={equippedAura}
                cosmeticHat={equippedCap}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Destacado del día + Oráculo */}
      <div className="grid gap-2.5 @min-[700px]:grid-cols-2">
        {dailyDeal && (
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setSelectedProduct(dailyDeal);
              setCurrentFloor(dailyDeal.floor);
            }}
            className="hq-card hq-card-interactive flex items-center justify-between gap-3 p-3 text-left"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border"
                style={{
                  color: 'var(--hq-gold)',
                  borderColor: 'color-mix(in srgb, var(--hq-gold) 25%, transparent)',
                  backgroundColor: 'color-mix(in srgb, var(--hq-gold) 10%, white)',
                }}
              >
                <Tag className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <span className="hq-label">Destacado del día</span>
                <div className="truncate text-xs font-semibold text-[#1F1E1B]">{dailyDeal.name}</div>
              </div>
            </div>
            <span className="hq-mono flex shrink-0 items-center gap-1 text-xs font-semibold text-[#1F1E1B]">
              {currency(priceOf(dailyDeal))}
              <ArrowUpRight className="h-3.5 w-3.5 text-[#8A877E]" />
            </span>
          </button>
        )}

        {oracleText && (
          <div className="hq-panel flex items-start gap-2 p-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--hq-cmo)' }} />
            <div className="min-w-0">
              <span className="hq-label">Oráculo del Bazar</span>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[#5E5C56]">{oracleText}</p>
            </div>
          </div>
        )}
      </div>

      {/* Selector de pisos */}
      <div className="hq-card p-2">
        <div className="hq-scroll flex items-center gap-1.5 overflow-x-auto">
          {FLOORS.map((floor) => {
            const Icon = floor.icon;
            const isActive = currentFloor === floor.id;
            return (
              <button
                key={floor.id}
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setCurrentFloor(floor.id);
                  const first = CATALOG_ITEMS.find((i) => i.floor === floor.id);
                  if (first) setSelectedProduct(first);
                  setQuantity(1);
                }}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'border-[#1F1E1B] bg-[#1F1E1B] text-[#FAF9F5]'
                    : 'border-[#E8E5DD] bg-white text-[#5E5C56] hover:border-[#D5D1C5] hover:text-[#1F1E1B]'
                }`}
              >
                <span className={`hq-mono text-[9px] ${isActive ? 'text-[#FAF9F5]/60' : 'text-[#8A877E]'}`}>
                  {floor.floorNum}
                </span>
                <Icon className="h-3.5 w-3.5" />
                <span>{floor.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtro de tipos para MT */}
      {currentFloor === 'tms' && (
        <div className="flex flex-wrap items-center gap-1.5">
          {['todos', ...tmTypes].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                soundFx.playClick();
                setTmFilter(type);
              }}
              className={`hq-chip text-[10px] capitalize transition-colors ${
                tmFilter === type ? 'border-[#1F1E1B] text-[#1F1E1B]' : 'hover:border-[#D5D1C5]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {/* Catálogo + inspector */}
      <div className="grid gap-4 @min-[880px]:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-2.5">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <span className="hq-label">{activeFloor?.floorNum} · catálogo</span>
              <h3 className="hq-title truncate text-base text-[#1F1E1B]">{activeFloor?.label}</h3>
            </div>
            <span className="hq-mono shrink-0 text-[10px] text-[#8A877E]">
              {visibleFloorItems.length} productos
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 @min-[520px]:grid-cols-2">
            {visibleFloorItems.map((prod) => {
              const isSelected = selectedProduct.id === prod.id;
              const isLocked =
                prod.type === 'pokemon_costume' && !!prod.speciesId && !ownedSpeciesIds.has(prod.speciesId);
              const price = priceOf(prod);

              return (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedProduct(prod);
                    setQuantity(1);
                  }}
                  className={`hq-card hq-card-interactive flex flex-col justify-between p-3 text-left ${
                    isSelected ? 'border-[#1F1E1B]' : ''
                  } ${isLocked ? 'opacity-60' : ''}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="hq-mono truncate text-[9px] uppercase tracking-wide text-[#8A877E]">
                        {prod.badge}
                      </span>
                      {isLocked ? (
                        <span className="hq-mono flex shrink-0 items-center gap-1 text-[9px] uppercase text-[#8A877E]">
                          <Lock className="h-2.5 w-2.5" /> Bloqueado
                        </span>
                      ) : prod.isDailyDeal ? (
                        <span
                          className="hq-mono shrink-0 rounded-full px-1.5 py-0.5 text-[9px] uppercase"
                          style={{
                            color: 'var(--hq-gold)',
                            backgroundColor: 'color-mix(in srgb, var(--hq-gold) 12%, white)',
                          }}
                        >
                          Destacado
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#E8E5DD] bg-[#FAF9F5]">
                        {prod.type === 'pokemon_costume' && prod.costumeId ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={
                              POKEMON_COSTUMES_CATALOG.find((c) => c.id === prod.costumeId)?.costumeSpriteUrl ||
                              prod.previewImage
                            }
                            alt={prod.name}
                            className="max-h-12 max-w-12 object-contain"
                          />
                        ) : prod.type === 'trainer_skin' && prod.previewImage ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={prod.previewImage}
                            alt={prod.name}
                            className="max-h-12 max-w-12 object-contain"
                          />
                        ) : prod.speciesId ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={
                              prod.type === 'egg'
                                ? 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lucky-egg.png'
                                : POKEMON_ASSETS.getAnimatedSprite(prod.speciesId, prod.isShiny)
                            }
                            alt={prod.name}
                            className="max-h-12 max-w-12 object-contain"
                          />
                        ) : prod.previewImage ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={prod.previewImage}
                            alt={prod.name}
                            className="h-10 w-10 object-contain"
                          />
                        ) : (
                          <Package className="h-7 w-7 text-[#C49347]" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="truncate text-xs font-semibold text-[#1F1E1B]">{prod.name}</h4>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[#8A877E]">
                          {prod.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-[#E8E5DD] pt-2">
                    <span className="hq-mono flex items-center gap-1 text-xs font-semibold tabular-nums text-[#1F1E1B]">
                      <Coins className="h-3.5 w-3.5" style={{ color: 'var(--hq-gold)' }} />
                      {currency(price)}
                    </span>
                    <span className="hq-mono text-[9px] uppercase tracking-wide text-[#8A877E]">
                      {prod.type}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Inspector de compra */}
        <div className="hq-card self-start p-4 @min-[880px]:sticky @min-[880px]:top-4">
          <div className="flex items-start justify-between gap-2 border-b border-[#E8E5DD] pb-3">
            <div className="min-w-0">
              <span className="hq-label">{selectedProduct.badge}</span>
              <h3 className="hq-title mt-0.5 text-base leading-tight text-[#1F1E1B]">
                {selectedProduct.name}
              </h3>
            </div>
            <span className="hq-chip shrink-0 text-[9px] uppercase">{selectedProduct.type}</span>
          </div>

          {/* Escaparate */}
          <div
            className="relative mt-3 flex h-40 w-full items-center justify-center overflow-hidden rounded-2xl border border-[#E8E5DD]"
            style={{
              background:
                'radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--hq-gold) 10%, white), #FAF9F5 70%)',
            }}
          >
            {selectedProduct.type === 'pokemon_costume' && selectedProduct.costumeId ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={
                  POKEMON_COSTUMES_CATALOG.find((c) => c.id === selectedProduct.costumeId)?.costumeSpriteUrl ||
                  selectedProduct.previewImage
                }
                alt={selectedProduct.name}
                className="h-32 object-contain transition-transform duration-300 hover:scale-105"
              />
            ) : selectedProduct.type === 'trainer_skin' && selectedProduct.previewImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={selectedProduct.previewImage}
                alt={selectedProduct.name}
                className="h-32 object-contain transition-transform duration-300 hover:scale-105"
              />
            ) : selectedProduct.speciesId ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={
                  selectedProduct.type === 'egg'
                    ? 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lucky-egg.png'
                    : POKEMON_ASSETS.getAnimatedSprite(selectedProduct.speciesId, selectedProduct.isShiny)
                }
                alt={selectedProduct.name}
                className="h-28 object-contain transition-transform duration-300 hover:scale-105"
              />
            ) : selectedProduct.previewImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={selectedProduct.previewImage}
                alt={selectedProduct.name}
                className="h-20 w-20 object-contain transition-transform duration-300 hover:scale-110"
              />
            ) : (
              <Package className="h-14 w-14 text-[#C49347]" />
            )}

            {selectedProduct.isShiny && (
              <span
                className="hq-mono absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] uppercase"
                style={{
                  color: 'var(--hq-gold)',
                  backgroundColor: 'color-mix(in srgb, var(--hq-gold) 14%, white)',
                  border: '1px solid color-mix(in srgb, var(--hq-gold) 30%, transparent)',
                }}
              >
                <Sparkles className="h-2.5 w-2.5" />
                Shiny
              </span>
            )}
          </div>

          <div className="hq-panel mt-3 p-3">
            <p className="text-[11px] leading-relaxed text-[#5E5C56]">{selectedProduct.description}</p>
            {selectedProduct.perfectIVs && (
              <div className="mt-2 flex items-start gap-1.5 text-[10px] font-medium text-[#5A7D62]">
                <Dna className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>Genética: 31 IVs en PS, Ataque, Defensa y Velocidad.</span>
              </div>
            )}
            {selectedProduct.gbaItemId && (
              <div className="hq-mono mt-1.5 text-[10px] text-[#8A877E]">
                ID de bolsillo GBA: 0x{selectedProduct.gbaItemId.toString(16).toUpperCase()}
              </div>
            )}
          </div>

          {/* Cantidad */}
          {isStackable && (
            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-[#E8E5DD] bg-white px-2.5 py-2">
              <span className="hq-label">Cantidad</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setQuantity((q) => Math.max(1, q - 1));
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E8E5DD] bg-white text-[#1F1E1B] transition-colors hover:bg-[#F2EFE9]"
                  aria-label="Restar una unidad"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="hq-mono w-7 text-center text-sm font-semibold tabular-nums text-[#1F1E1B]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setQuantity((q) => Math.min(20, q + 1));
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E8E5DD] bg-white text-[#1F1E1B] transition-colors hover:bg-[#F2EFE9]"
                  aria-label="Sumar una unidad"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                {[5, 10].map((batch) => (
                  <button
                    key={batch}
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setQuantity(batch);
                    }}
                    className="hq-mono rounded-lg border border-[#E8E5DD] px-1.5 py-1 text-[10px] text-[#5E5C56] transition-colors hover:bg-[#F2EFE9]"
                  >
                    x{batch}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 space-y-2 border-t border-[#E8E5DD] pt-3">
            <div className="flex items-center justify-between">
              <span className="hq-label">Total a debitar</span>
              <span className="hq-mono flex items-center gap-1 text-lg font-semibold tabular-nums text-[#1F1E1B]">
                <Coins className="h-4 w-4" style={{ color: 'var(--hq-gold)' }} />
                {currency(totalCost)}
              </span>
            </div>

            {isCostumeLocked && (
              <div
                className="flex items-start gap-2 rounded-xl p-2.5 text-[11px] leading-relaxed"
                style={{
                  color: 'var(--hq-danger)',
                  backgroundColor: 'color-mix(in srgb, var(--hq-danger) 8%, white)',
                  border: '1px solid color-mix(in srgb, var(--hq-danger) 25%, transparent)',
                }}
              >
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Requiere tener a <strong>{selectedProduct.speciesName}</strong> en tu equipo o PC para
                  desbloquear esta armadura.
                </span>
              </div>
            )}

            <button
              type="button"
              disabled={isCostumeLocked || !canAfford || isProcessing}
              onClick={handleBuy}
              className="hq-btn hq-btn-primary w-full justify-center"
            >
              {isCostumeLocked ? (
                <>
                  <Lock className="h-4 w-4" />
                  Pokémon no obtenido
                </>
              ) : isProcessing ? (
                <>
                  <Flame className="h-4 w-4" />
                  Procesando…
                </>
              ) : canAfford ? (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  Confirmar compra · {currency(totalCost)}
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4" />
                  Saldo insuficiente
                </>
              )}
            </button>

            {selectedProduct.type !== 'cosmetic' && !isCostumeLocked && (
              <p className="text-center text-[10px] leading-relaxed text-[#8A877E]">
                Se guarda en la Bóveda. Desde ahí lo envías al cartucho.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
