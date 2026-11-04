---
name: syndex-financial-intelligence
description: Reglas de Oro, arquitectura económica, severidad de precios, impuestos diarios, Bolsa de Valores de Trigal y prohibiciones inviolables del sistema financiero SynDex (Supabase RPCs, valdr_vault, economy_shop_prices).
---

# REGLA MAESTRA: Inteligencia Financiera SynDex & Modo Hardcore

SynDex opera bajo un **modelo financiero riguroso, de alta fricción y escasez programada**, diseñado para que el usuario sienta el verdadero peso de la disciplina y el costo de vida en Johto.

## 1. Prohibiciones Inviolables (Leyes de la Liga)
1. **TERMINANTEMENTE PROHIBIDO VENDER POKÉMON LEGENDARIOS O MÍTICOS:**
   - Mew, Celebi, Lugia, Ho-Oh, Suicune, Raikou, Entei, Mewtwo, Rayquaza, etc., **NUNCA se compran ni venden en tiendas, bazares o menús rápidos**.
   - Solo existen a través de **proezas reales en la ROM de GBA** (completar la historia, capturarlos con Poké Balls en el cartucho).
2. **Cero Regalías / Nada de Precios Simbólicos de \$30 o \$50:**
   - La economía debe sentirse **cara y difícil de conquistar**.
   - Las recompensas se ganan con hábitos diarios cumplidos en la vida real (gimnasio, lectura, foco).
3. **El Servidor SIEMPRE Manda (Cero confianza en el cliente):**
   - El precio de cualquier compra, inyección o transacción **lo calcula y valida la base de datos Supabase** (`rpc_purchase_shop_item`, `rpc_valdr_dispatch_vault_item`, `rpc_valdr_buy_market_item`).
   - El front-end JAMÁS envía el costo que desea pagar (`p_cost`). Solo envía el `p_item_id` y `p_qty`.

---

## 2. Los 3 Escalones de la Economía

### Nivel 1: Suministros Básicos GBA (Precios de Farmacia / Tienda Oficial)
- Poción (x3): **₽300**
- Superpoción (x2): **₽700**
- Poké Balls (x5): **₽1,000**
- Antídoto (x2): **₽200**
- *Requisito:* Debe tener partida activa en la ROM (`party_count >= 1`).

### Nivel 2: Genética, Crianza y Máquinas Técnicas (MT)
- Insumos de crianza y Piedras Evolutivas: **₽2,500 – ₽6,000**
- MTs de alto calibre (Terremoto, Rayo, Lanzallamas): **₽8,000 – ₽15,000**
- Piedra Eterna / Lazo Destino: **₽3,500**

### Nivel 3: La Gran Meta Financiera (Meta 50K - El Dragón Dorado)
- Dratini / Larvitar Shiny 6-IVs: **₽40,000 – ₽50,000**
- Requiere de **3 a 5 meses de disciplina implacable**, cosechas de Bonguris en el Rancho y operaciones estratégicas en la Bolsa de Valores de Ciudad Trigal.

---

## 3. Mantenimiento, Impuestos y Facturas de Bill
1. **Impuesto Diario de Johto:**
   - Tarifa fija por día + recargo por cajas activas en la PC de Bill + recargo por espacio en la Bóveda (`valdr_vault`).
   - Si no tienes saldo, se genera **Deuda Fiscal** con intereses.
2. **Despacho desde la Bóveda:**
   - Al comprar en la Bolsa o en el Bazar de Trigal, el ítem va primero a tu **Bóveda (`valdr_vault`)**.
   - Solo se despacha e inyecta al cartucho cuando tú decides consumirlo manualmente en la consola.

---

## 4. Checklist para Cualquier Modificación en el Código
- [ ] ¿Hay algún Pokémon legendario a la venta? ➔ **Elimínalo de inmediato.**
- [ ] ¿Los precios son baratos o de prueba? ➔ **Ajusta al estándar de escasez de Supabase.**
- [ ] ¿La compra se procesa por RPC de Supabase con deducción real de ledger? ➔ **Obligatorio.**
- [ ] ¿El usuario tiene cuenta nueva sin inicial? ➔ **Bloquea la inyección hasta que guarde en el juego.**
