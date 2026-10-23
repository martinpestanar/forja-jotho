'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  ShoppingBag, 
  Coins, 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  Glasses, 
  Crown, 
  Sun,
  Flame,
  Egg,
  Heart,
  Dna,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Tag,
  Plus,
  Minus,
  RefreshCw,
  Gift,
  Package,
  Shield,
  UserCheck,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { useTrainerStore } from '@/store/useTrainerStore';
import { soundFx } from '@/lib/soundFx';
import { LayeredSpriteCanvas } from '@/components/tuning/LayeredSpriteCanvas';
import { triggerGbaPokemonInjection, triggerGbaItemInjection } from '@/lib/gba/PokemonMemoryBridge';
import { HNS_ITEM_IDS } from '@/lib/gba/gbaSaveEngine';
import { POKEMON_ASSETS } from '@/lib/pokemonAssets';
import { EXPANDED_SHOP_CATALOG, ShopFloor, ShopProduct } from '@/lib/shopCatalog';
import { POKEMON_COSTUMES_CATALOG, TRAINER_SKINS_CATALOG } from '@/types/cosmetics';

const CATALOG_ITEMS = EXPANDED_SHOP_CATALOG;

const FLOORS: { id: ShopFloor; label: string; floorNum: string; icon: any }[] = [
  { id: 'eggs', label: 'Huevos de Crianza', floorNum: '1F', icon: Egg },
  { id: 'breeding', label: 'Genética & Crianza', floorNum: '2F', icon: Dna },
  { id: 'specials', label: 'Pokémon Especiales', floorNum: '3F', icon: Sparkles },
  { id: 'supplies', label: 'Bolsillos GBA', floorNum: '4F', icon: Zap },
  { id: 'pokemon_costumes', label: 'Equipamiento & Armaduras', floorNum: '5F', icon: Shield },
  { id: 'trainer_skins', label: 'Skins de Entrenador', floorNum: '6F', icon: UserCheck },
  { id: 'cosmetics', label: 'Auras & Títulos Web', floorNum: '7F', icon: Glasses },
];

export const GoldenrodShop: React.FC = () => {
  const profile = useTrainerStore((s) => s.profile);
  const purchaseShopItemRpc = useTrainerStore((s) => s.purchaseShopItemRpc);
  const theme = useTrainerStore((s) => s.theme);
  const isLight = theme === 'light_gbc';

  const [currentFloor, setCurrentFloor] = useState<ShopFloor>('eggs');
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct>(CATALOG_ITEMS[0]);
  const [quantity, setQuantity] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Cosméticos equipados en preview
  const [equippedGlasses, setEquippedGlasses] = useState<boolean>(true);
  const [equippedAura, setEquippedAura] = useState<boolean>(true);
  const [equippedCap, setEquippedCap] = useState<boolean>(false);

  const pokedollars = profile?.pokedollars ?? 0;
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

  const ownedSpeciesIds = new Set<number>([
    starterSpeciesId,
    ...partySpeciesIds,
  ]);

  const floorItems = CATALOG_ITEMS.filter((item) => item.floor === currentFloor);
  const dailyDeal = CATALOG_ITEMS.find((item) => item.isDailyDeal);

  // Calcular precio total con multiplicador de cantidad (sólo para ítems apilables)
  const isStackable = selectedProduct.type === 'item';
  const effectiveCost = selectedProduct.isDailyDeal && selectedProduct.discountPct
    ? Math.round(selectedProduct.cost * (1 - selectedProduct.discountPct / 100))
    : selectedProduct.cost;
  const totalCost = isStackable ? effectiveCost * quantity : effectiveCost;
  const canAfford = pokedollars >= totalCost;

  // Validación de posesión previa del Pokémon para equipamientos
  const isCostumeLocked = selectedProduct.type === 'pokemon_costume' &&
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
      showToast(`🔒 Requiere tener a ${selectedProduct.speciesName || 'este Pokémon'} en tu equipo o inventario.`);
      return;
    }

    if (!canAfford) {
      soundFx.playDamage();
      showToast(`⚠️ Saldo insuficiente: necesitas ₽${totalCost.toLocaleString()} Pokédólares.`);
      return;
    }

    soundFx.playClick();
    setIsProcessing(true);

    try {
      // 1. Invocar RPC rpc_purchase_shop_item en Supabase
      const result = await purchaseShopItemRpc(selectedProduct.id, totalCost);

      if (!result.success) {
        soundFx.playDamage();
        showToast(result.error || 'No se pudo completar la compra');
        return;
      }

      // 2. Procesar según la naturaleza del producto
      if (selectedProduct.type === 'egg' || selectedProduct.type === 'pokemon') {
        // Inyectar Pokémon o Huevo al Equipo/PC
        triggerGbaPokemonInjection({
          speciesId: selectedProduct.speciesId || 175,
          level: selectedProduct.level || 5,
          nickname: selectedProduct.type === 'egg' ? 'HUEVO' : selectedProduct.name.toUpperCase(),
          isShiny: !!selectedProduct.isShiny,
          perfectIVs: !!selectedProduct.perfectIVs,
          targetDestination: 'auto',
        });
        soundFx.playLevelUp();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#06B6D4', '#E60012'],
        });
        showToast(`✨ ¡${selectedProduct.name} recibido! Revisa tu Equipo o PC Box 1.`);
      } else if (selectedProduct.type === 'item' && selectedProduct.gbaItemId) {
        // Inyectar ítem apilado a la RAM del GBA
        triggerGbaItemInjection(
          selectedProduct.gbaItemId,
          quantity,
          selectedProduct.pocket || 'ITEMS',
          selectedProduct.name
        );
        soundFx.playCoin();
        confetti({ particleCount: 30, spread: 45, origin: { y: 0.6 } });
        showToast(`🎒 ¡${quantity}x ${selectedProduct.name} inyectado a tu mochila GBA!`);
      } else if (selectedProduct.type === 'cosmetic') {
        const currentInventory = profile?.cosmetics_inventory || [];
        const updatedInventory = currentInventory.includes(selectedProduct.id)
          ? currentInventory
          : [...currentInventory, selectedProduct.id];

        useTrainerStore.getState().updateProfile({
          cosmetics_inventory: updatedInventory,
        });

        if (selectedProduct.id === 'COSMETIC_CYBER_VISOR') setEquippedGlasses(true);
        if (selectedProduct.id === 'COSMETIC_NEON_AURA') setEquippedAura(true);
        if (selectedProduct.id === 'COSMETIC_TRAINER_CAP') setEquippedCap(true);
        soundFx.playCoin();
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
        showToast(`👑 ¡Cosmético añadido a tu inventario! Pruébalo en el Taller Tuning.`);
      } else if (selectedProduct.type === 'pokemon_costume') {
        const currentInventory = profile?.cosmetics_inventory || [];
        const updatedInventory = currentInventory.includes(selectedProduct.id)
          ? currentInventory
          : [...currentInventory, selectedProduct.id];

        useTrainerStore.getState().updateProfile({
          cosmetics_inventory: updatedInventory,
        });

        // Equipar automáticamente al Pokémon correspondiente
        if (selectedProduct.speciesId && selectedProduct.costumeId) {
          useTrainerStore.getState().setPokemonCostume(selectedProduct.speciesId, selectedProduct.costumeId);
        }

        soundFx.playLevelUp();
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 }, colors: ['#F59E0B', '#10B981', '#E60012'] });
        showToast(`🛡️ ¡${selectedProduct.name} equipado en tu ${selectedProduct.speciesName || 'Pokémon'}!`);
      } else if (selectedProduct.type === 'trainer_skin') {
        const currentInventory = profile?.cosmetics_inventory || [];
        const updatedInventory = currentInventory.includes(selectedProduct.id)
          ? currentInventory
          : [...currentInventory, selectedProduct.id];

        useTrainerStore.getState().updateProfile({
          cosmetics_inventory: updatedInventory,
        });

        if (selectedProduct.skinId) {
          useTrainerStore.getState().setTrainerSkin(selectedProduct.skinId);
        }

        soundFx.playLevelUp();
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 }, colors: ['#06B6D4', '#F59E0B', '#E60012'] });
        showToast(`👑 ¡Skin equipada: ${selectedProduct.name}!`);
      }

      // Resetear contador
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
    <div className="h-full flex flex-col gap-3 font-mono select-none">
      {/* Toast Notificación con Sonido */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className={`p-2.5 rounded-xl text-xs font-black flex items-center justify-between gap-2 border-2 shadow-[4px_4px_0_#000] z-20 ${
              isLight
                ? 'bg-amber-300 text-slate-950 border-black'
                : 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              <span>{notification}</span>
            </div>
            <span className="text-[10px] opacity-75 font-mono">PULSA CONTINUAR EN GBA</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Departamental: Ciudad Trigal + Saldo + Avatar Preview */}
      <div
        className={`p-3 rounded-xl border-2 flex flex-col md:flex-row items-center justify-between gap-3 transition-all ${
          isLight
            ? 'bg-[#FFFFFF] border-black shadow-[4px_4px_0_#000]'
            : 'bg-[#121214] border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border-2 flex items-center justify-center ${
              isLight
                ? 'bg-[#E60012] text-white border-black shadow-[2px_2px_0_#000]'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/50'
            }`}
          >
            <ShoppingBag className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-black/10">
                GOLDENROD DEPT. STORE
              </span>
              <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                <Flame className="w-3 h-3 fill-amber-500" /> Crianza & Mercado Negro GBA
              </span>
            </div>
            <h2 className="text-base font-black tracking-tight uppercase">
              Centro Comercial de Ciudad Trigal
            </h2>
          </div>
        </div>

        {/* Saldo y Avatar Tuneado */}
        <div className="flex items-center gap-3 self-end md:self-center">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold block">SALDO POKÉDÓLARES:</span>
            <span className="text-xl font-black text-amber-400 flex items-center justify-end gap-1">
              <Coins className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>₽{pokedollars.toLocaleString()}</span>
            </span>
          </div>

          <div
            className={`p-1 rounded-xl border-2 ${
              isLight ? 'bg-slate-100 border-black' : 'bg-slate-950 border-slate-700'
            }`}
          >
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

      {/* Banner de Oferta Relámpago del Día */}
      {dailyDeal && (
        <div
          onClick={() => {
            soundFx.playClick();
            setSelectedProduct(dailyDeal);
            setCurrentFloor(dailyDeal.floor);
          }}
          className={`p-2 px-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
            isLight
              ? 'bg-gradient-to-r from-amber-200 via-rose-100 to-amber-200 border-black shadow-[3px_3px_0_#000] hover:translate-x-0.5'
              : 'bg-gradient-to-r from-amber-950/60 via-purple-950/40 to-slate-900 border-amber-500/50 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#E60012] animate-pulse" />
            <span className="text-xs font-black uppercase text-[#E60012]">
              ¡OFERTA FLASH DEL DÍA!
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {dailyDeal.name} con -{dailyDeal.discountPct}% de descuento
            </span>
          </div>
          <span className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <span>₽{Math.round(dailyDeal.cost * (1 - (dailyDeal.discountPct || 0) / 100))}</span>
            <span className="line-through text-[10px] text-slate-400">₽{dailyDeal.cost}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      )}

      {/* Selector de Pisos (Estilo Ascensor Departamental de Pokémon) */}
      <div
        className={`flex items-center gap-1.5 overflow-x-auto pb-1 border-b-2 ${
          isLight ? 'border-black/20' : 'border-slate-800'
        }`}
      >
        {FLOORS.map((floor) => {
          const Icon = floor.icon;
          const isActive = currentFloor === floor.id;
          return (
            <button
              key={floor.id}
              onClick={() => {
                soundFx.playClick();
                setCurrentFloor(floor.id);
                // Preseleccionar el primer ítem del piso
                const first = CATALOG_ITEMS.find((i) => i.floor === floor.id);
                if (first) setSelectedProduct(first);
                setQuantity(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap border-2 ${
                isActive
                  ? isLight
                    ? 'bg-[#E60012] text-white border-black shadow-[2px_2px_0_#000]'
                    : 'bg-amber-500 text-slate-950 border-black font-black shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : isLight
                  ? 'bg-white border-black/30 text-slate-700 hover:border-black'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="px-1 py-0.2 rounded bg-black/20 text-[10px] font-mono">
                {floor.floorNum}
              </span>
              <Icon className="w-3.5 h-3.5" />
              <span>{floor.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido Principal: Catálogo de Productos + Inspector de Compra */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        {/* Lado Izquierdo: Catálogo de Ítems del Piso Activo (7 Cols) */}
        <div className="lg:col-span-7 overflow-y-auto pr-1 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {floorItems.map((prod) => {
              const isSelected = selectedProduct.id === prod.id;
              const isLocked = prod.type === 'pokemon_costume' &&
                !!prod.speciesId &&
                !ownedSpeciesIds.has(prod.speciesId);
              const price = prod.isDailyDeal && prod.discountPct
                ? Math.round(prod.cost * (1 - prod.discountPct / 100))
                : prod.cost;

              return (
                <div
                  key={prod.id}
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedProduct(prod);
                    setQuantity(1);
                  }}
                  className={`p-3 rounded-xl border-2 flex flex-col justify-between cursor-pointer transition-all relative ${
                    isLocked
                      ? 'opacity-60 bg-black/5 border-slate-700/40 grayscale-30'
                      : isSelected
                      ? isLight
                        ? 'bg-amber-100 border-black shadow-[3px_3px_0_#000]'
                        : 'bg-amber-500/15 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                      : isLight
                      ? 'bg-white border-black/30 hover:border-black'
                      : 'bg-[#18181b] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-black/10 uppercase">
                        {prod.badge}
                      </span>
                      {isLocked ? (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/50 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> NO POSEÍDO
                        </span>
                      ) : prod.isDailyDeal ? (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#E60012] text-white">
                          -{prod.discountPct}% OFF
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3 my-2">
                      <div className="w-14 h-14 flex items-center justify-center shrink-0 bg-black/5 rounded-lg border border-black/10">
                        {prod.type === 'pokemon_costume' && prod.costumeId ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={POKEMON_COSTUMES_CATALOG.find((c) => c.id === prod.costumeId)?.costumeSpriteUrl || prod.previewImage}
                            alt={prod.name}
                            className="max-h-12 max-w-12 object-contain filter drop-shadow-md"
                          />
                        ) : prod.type === 'trainer_skin' && prod.previewImage ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={prod.previewImage}
                            alt={prod.name}
                            className="max-h-12 max-w-12 object-contain filter drop-shadow-md"
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
                            className="w-10 h-10 object-contain"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-amber-500" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-black text-xs uppercase leading-tight truncate">
                          {prod.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                          {prod.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-black/10">
                    <span className="text-xs font-black text-amber-500 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      <span>₽{price.toLocaleString()}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      {prod.type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lado Derecho: Inspector de Compra Dopamínico (5 Cols) */}
        <div
          className={`lg:col-span-5 rounded-xl p-4 border-2 flex flex-col justify-between ${
            isLight
              ? 'bg-[#FFFFFF] border-black shadow-[4px_4px_0_#000]'
              : 'bg-[#0f172a] border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-black/15">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-500">
                  {selectedProduct.badge}
                </span>
                <h3 className="font-black text-base uppercase leading-tight">
                  {selectedProduct.name}
                </h3>
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-black/10 uppercase">
                {selectedProduct.type}
              </span>
            </div>

            {/* Escaparate Visual del Producto */}
            <div
              className={`h-40 w-full flex items-center justify-center my-3 rounded-2xl border-2 border-dashed relative ${
                isLight
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-black/30 border-amber-500/30'
              }`}
            >
              {selectedProduct.type === 'pokemon_costume' && selectedProduct.costumeId ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={POKEMON_COSTUMES_CATALOG.find((c) => c.id === selectedProduct.costumeId)?.costumeSpriteUrl || selectedProduct.previewImage}
                  alt={selectedProduct.name}
                  className="h-32 object-contain filter drop-shadow-[0_8px_14px_rgba(0,0,0,0.6)] transition-transform hover:scale-110"
                />
              ) : selectedProduct.type === 'trainer_skin' && selectedProduct.previewImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={selectedProduct.previewImage}
                  alt={selectedProduct.name}
                  className="h-32 object-contain filter drop-shadow-[0_8px_14px_rgba(0,0,0,0.6)] transition-transform hover:scale-110"
                />
              ) : selectedProduct.speciesId ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={
                    selectedProduct.type === 'egg'
                      ? 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lucky-egg.png'
                      : POKEMON_ASSETS.getAnimatedSprite(
                          selectedProduct.speciesId,
                          selectedProduct.isShiny
                        )
                  }
                  alt={selectedProduct.name}
                  className="h-28 object-contain filter drop-shadow-[0_8px_10px_rgba(0,0,0,0.5)] transition-transform hover:scale-110"
                />
              ) : selectedProduct.previewImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={selectedProduct.previewImage}
                  alt={selectedProduct.name}
                  className="w-20 h-20 object-contain filter drop-shadow-md transition-transform hover:scale-125"
                />
              ) : (
                <Package className="w-16 h-16 text-amber-500" />
              )}

              {/* Insignia Shiny si aplica */}
              {selectedProduct.isShiny && (
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-400 text-black text-[10px] font-black rounded flex items-center gap-1 border border-black shadow-[1px_1px_0_#000]">
                  <Sparkles className="w-3 h-3 fill-black" />
                  <span>SHINY</span>
                </div>
              )}
            </div>

            {/* Descripción y Especificaciones */}
            <div
              className={`p-3 rounded-xl text-xs leading-relaxed mb-3 ${
                isLight
                  ? 'bg-slate-100 text-slate-700 border border-black/10'
                  : 'bg-black/20 text-slate-300 border border-slate-800'
              }`}
            >
              <p className="mb-2">{selectedProduct.description}</p>
              {selectedProduct.perfectIVs && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-bold">
                  <Dna className="w-3.5 h-3.5" />
                  <span>Genética: 31 IVs en PS, Ataque, Defensa, Velocidad.</span>
                </div>
              )}
              {selectedProduct.gbaItemId && (
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  <span>Offset GBA: 0x{selectedProduct.gbaItemId.toString(16).toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Selector de Cantidad Dinámico (Para Ítems Apilables) */}
            {isStackable && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-black/5 border border-black/10 mb-3">
                <span className="text-xs font-bold text-slate-400">CANTIDAD:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setQuantity((q) => Math.max(1, q - 1));
                    }}
                    className={`w-7 h-7 rounded-lg font-black flex items-center justify-center border transition-all ${
                      isLight
                        ? 'bg-white border-black text-black hover:bg-slate-200'
                        : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-black text-sm">{quantity}</span>
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setQuantity((q) => Math.min(20, q + 1));
                    }}
                    className={`w-7 h-7 rounded-lg font-black flex items-center justify-center border transition-all ${
                      isLight
                        ? 'bg-white border-black text-black hover:bg-slate-200'
                        : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex gap-1 ml-1">
                    {[5, 10].map((batch) => (
                      <button
                        key={batch}
                        onClick={() => {
                          soundFx.playClick();
                          setQuantity(batch);
                        }}
                        className="px-2 py-1 text-[10px] font-black rounded bg-black/10 hover:bg-black/20"
                      >
                        x{batch}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desglose de Pago & Botón Dopamínico de Compra */}
          <div className="pt-2 border-t border-black/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400">TOTAL A DEBITAR:</span>
              <span className="text-lg font-black text-amber-500 flex items-center gap-1">
                <Coins className="w-4 h-4 fill-amber-500" />
                <span>₽{totalCost.toLocaleString()}</span>
              </span>
            </div>

            {isCostumeLocked && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-400 text-xs font-bold flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0 text-rose-500" />
                <span>Requiere tener a <strong>{selectedProduct.speciesName}</strong> en tu equipo o PC para desbloquear esta armadura.</span>
              </div>
            )}

            <button
              disabled={isCostumeLocked || !canAfford || isProcessing}
              onClick={handleBuy}
              className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isCostumeLocked
                  ? 'bg-rose-950/60 text-rose-400 border-rose-600/50'
                  : canAfford
                  ? isLight
                    ? 'bg-amber-400 hover:bg-amber-500 text-black border-black shadow-[3px_3px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 border-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              {isCostumeLocked ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>POKÉMON NO OBTENIDO</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>
                    {isProcessing
                      ? 'TRANFIRIENDO A RAM...'
                      : canAfford
                      ? `CONFIRMAR COMPRA (${selectedProduct.type.toUpperCase()})`
                      : 'SALDO INSUFICIENTE'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
