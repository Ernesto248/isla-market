# 📱 Guía de Testing de Responsividad - Product Cards

**Objetivo:** Verificar que las tarjetas de productos se vean perfectas en todos los dispositivos

---

## 🎯 Cambios Realizados

### ✅ Problema Resuelto #1: Botones Desalineados

- **Antes:** Botones en diferentes alturas
- **Después:** Todos los botones alineados perfectamente

### ✅ Problema Resuelto #2: Texto de Stock Innecesario

- **Antes:** Mostraba "X unidades disponibles" siempre
- **Después:** Solo muestra cuando stock ≤ 5 o stock = 0

---

## 🧪 Testing Manual - Paso a Paso

### 1. Desktop (Pantalla Normal)

**Abrir en navegador:**

```
http://localhost:3000/products
```

**Verificar:**

- [ ] ¿Todos los botones "Agregar al Carrito" están alineados horizontalmente?
- [ ] ¿Productos con descripciones largas vs cortas tienen botones al mismo nivel?
- [ ] ¿Productos con stock > 5 NO muestran texto de stock?
- [ ] ¿Productos con stock ≤ 5 muestran "¡Solo quedan X unidades!" en naranja?
- [ ] ¿Producto "Blender" (sin stock) muestra "Sin stock disponible" en rojo?
- [ ] ¿Las tarjetas mantienen espaciado uniforme?

---

### 2. Responsive Testing con DevTools

**Abrir DevTools:**

- **Windows:** `F12` o `Ctrl + Shift + I`
- **Mac:** `Cmd + Option + I`

**Activar modo responsivo:**

- **Windows:** `Ctrl + Shift + M`
- **Mac:** `Cmd + Shift + M`

---

### 📱 Pantallas a Probar

#### A) iPhone SE (375px)

```
Configuración: iPhone SE / 375 x 667
```

**Verificar:**

- [ ] Tarjetas en **1 columna**
- [ ] Botones ocupan todo el ancho
- [ ] Texto legible sin zoom
- [ ] Imágenes se cargan correctamente
- [ ] Badge "Sin Stock" / "Destacados" visible
- [ ] Overlay "AGOTADO" centrado
- [ ] Touch targets suficientemente grandes (botones)

**Scroll vertical:**

- [ ] Scroll fluido
- [ ] No hay desbordamiento horizontal
- [ ] Footer visible correctamente

---

#### B) iPhone 12 Pro (390px)

```
Configuración: iPhone 12 Pro / 390 x 844
```

**Verificar:**

- [ ] Layout similar a iPhone SE
- [ ] Tarjetas en **1 columna**
- [ ] Espaciado adecuado
- [ ] Todos los elementos visibles

---

#### C) iPad Mini (768px)

```
Configuración: iPad Mini / 768 x 1024
```

**Verificar:**

- [ ] Tarjetas en **2 columnas**
- [ ] Botones alineados por fila (2 en horizontal)
- [ ] Hover effects funcionan (si hay mouse)
- [ ] Espaciado entre tarjetas apropiado
- [ ] Imágenes con buen aspect ratio

**Rotación landscape:**

- [ ] Grid se adapta (posiblemente 3 columnas)
- [ ] Botones siguen alineados

---

#### D) iPad Pro (1024px)

```
Configuración: iPad Pro 11" / 1024 x 1366
```

**Verificar:**

- [ ] Tarjetas en **3 columnas**
- [ ] Todos los botones alineados horizontalmente
- [ ] Espacio aprovechado eficientemente
- [ ] Sin elementos cortados

---

#### E) Desktop HD (1920px)

```
Configuración: Desktop / 1920 x 1080
```

**Verificar:**

- [ ] Grid de **4-5 columnas** (dependiendo del container)
- [ ] Alineación perfecta de todos los botones
- [ ] Productos destacados tienen badge visible
- [ ] Hover effects funcionan suavemente
- [ ] Imágenes en alta calidad

---

### 3. Probar Diferentes Productos

#### Producto CON Stock Alto (> 5 unidades)

```
Ejemplo: Bluetooth Headphones, iPad Air, etc.
```

**Debe mostrar:**

- ✅ Imagen a color
- ✅ Badge "Destacados" (si aplica)
- ✅ Precio visible
- ✅ **SIN texto de stock** (esto es clave!)
- ✅ Botón "Agregar al Carrito" habilitado (azul)

**No debe mostrar:**

- ❌ Texto de unidades disponibles
- ❌ Badge "Sin Stock"
- ❌ Overlay "AGOTADO"

---

#### Producto CON Stock Bajo (1-5 unidades)

```
Ejemplo: Miel de abeja (16 unidades) → Cambiar a 5 o menos
```

**Debe mostrar:**

- ✅ Imagen a color
- ✅ Badge "Destacados" (si aplica)
- ✅ Precio visible
- ✅ Texto naranja: "¡Solo quedan X unidades!"
- ✅ Botón "Agregar al Carrito" habilitado (azul)

**Sentimiento:**

- ⚠️ Urgencia visual
- ⚠️ Color naranja llama la atención
- ⚠️ Incentiva compra inmediata

---

#### Producto SIN Stock (0 unidades)

```
Ejemplo: Blender
```

**Debe mostrar:**

- ✅ Imagen en **blanco y negro** (grayscale)
- ✅ Badge rojo "Sin Stock" (esquina superior izquierda)
- ✅ Overlay negro semi-transparente
- ✅ Texto blanco grande "AGOTADO" centrado en la imagen
- ✅ Precio visible (pero tenue)
- ✅ Texto rojo: "Sin stock disponible"
- ✅ Botón gris "Producto Agotado" deshabilitado

**Interacciones:**

- [ ] Hover sobre la imagen sigue funcionando
- [ ] Click en imagen/título lleva a página de detalles
- [ ] Click en botón muestra toast: "Producto sin stock"
- [ ] Click en botón NO navega (e.preventDefault funciona)

---

## 🎨 Comparación Visual Rápida

### Grid View - Todos los Productos

```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ A color │ │ A color │ │  B&N    │ │ A color │
│ Headph. │ │ Coffee  │ │ Blender │ │ iPad    │
│ $149.99 │ │ $24.99  │ │ $129.99 │ │ $599.99 │
│         │ │ ¡3 uni! │ │ Sin sto.│ │         │
│[Agregar]│ │[Agregar]│ │[Agotado]│ │[Agregar]│
└─────────┘ └─────────┘ └─────────┘ └─────────┘
    ↑           ↑           ↑           ↑
    TODOS LOS BOTONES AL MISMO NIVEL
```

**Puntos clave:**

- Botones en la **misma línea horizontal** ✓
- Stock solo visible cuando es relevante ✓
- Altura de tarjetas consistente ✓

---

## 🐛 Posibles Problemas a Verificar

### ❌ SI VES ESTO, HAY UN PROBLEMA:

1. **Botones desalineados verticalmente**

   - Causa: Flexbox no aplicado correctamente
   - Solución: Verificar clases `flex flex-col` en Card

2. **Texto de stock en productos con > 5 unidades**

   - Causa: Lógica condicional incorrecta
   - Solución: Revisar ternario `stock <= 5`

3. **Espacio vacío muy grande entre descripción y precio**

   - Causa: Espaciador flexible demasiado agresivo
   - Solución: Agregar `max-h` al espaciador si es necesario

4. **Tarjetas se rompen en mobile**

   - Causa: Grid no responsivo
   - Solución: Verificar clases del grid container padre

5. **Imágenes distorsionadas**
   - Causa: Aspect ratio incorrecto
   - Solución: Verificar `h-48` y `object-cover`

---

## ✅ Checklist Final

### Funcionalidad

- [ ] Agregar al carrito funciona (productos con stock)
- [ ] Toast de error funciona (productos sin stock)
- [ ] Navegación a detalles funciona (click en imagen/título)
- [ ] Botón de corazón aparece en hover

### Visual

- [ ] Todos los botones alineados en desktop
- [ ] Stock solo visible cuando ≤ 5 o = 0
- [ ] Colores correctos (verde/naranja/rojo)
- [ ] Badge "Sin Stock" visible en productos agotados
- [ ] Overlay "AGOTADO" centrado
- [ ] Imágenes en grayscale cuando sin stock

### Responsividad

- [ ] Mobile: 1 columna, botones full-width
- [ ] Tablet: 2 columnas, botones alineados
- [ ] Desktop: 3-4 columnas, alineación perfecta
- [ ] No hay scroll horizontal en ningún breakpoint

### Performance

- [ ] Carga rápida de imágenes
- [ ] Animaciones fluidas (hover, motion)
- [ ] Sin parpadeos o reflows

---

## 🚀 Comando para Probar

### Dev Server

```powershell
npm run dev
```

### Production Build (Recomendado para testing final)

```powershell
npm run build
npm start
```

---

## 📸 Screenshots a Tomar

1. **Desktop - Grid completo**

   - Mostrar 8-12 productos
   - Evidenciar botones alineados

2. **Mobile - Scroll vertical**

   - Mostrar 3-4 productos en columna
   - Capturar producto sin stock

3. **Tablet - 2 columnas**

   - Mostrar alineación por fila

4. **Hover States**

   - Producto con hover
   - Botón de corazón visible

5. **Producto sin stock - Detail**
   - Grayscale
   - Badge rojo
   - Overlay "AGOTADO"
   - Botón deshabilitado

---

## 🎯 Criterios de Éxito

### ✅ Test PASADO si:

1. Todos los botones están alineados horizontalmente (desktop)
2. Productos con stock > 5 NO muestran texto de stock
3. Productos con stock ≤ 5 muestran urgencia (naranja)
4. Productos sin stock muestran todos los indicadores visuales
5. Layout responsivo funciona en mobile, tablet, desktop
6. No hay errores en consola
7. Interacciones funcionan correctamente

### ❌ Test FALLADO si:

1. Botones en diferentes alturas
2. Texto de stock visible en todos los productos
3. Layout se rompe en algún breakpoint
4. Tarjetas sin stock no se distinguen visualmente
5. Errores en consola
6. Click en botón deshabilitado navega a detalles

---

**Tiempo estimado de testing:** 10-15 minutos  
**Prioridad:** Alta (afecta UX principal del e-commerce)  
**Status:** Listo para probar

---

## 🔗 Archivos Relacionados

- `components/products/product-card.tsx` - Componente modificado
- `md/FIX_CARD_ALIGNMENT.md` - Documentación detallada
- `md/FIX_STOCK_INDICATORS.md` - Indicadores visuales de stock
