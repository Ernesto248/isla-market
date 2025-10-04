# 📱 Configuración de Open Graph para WhatsApp y Redes Sociales

## ✅ Cambios Realizados

### 1. **Metadatos Actualizados** (`app/layout.tsx`)

**Antes:**

- ❌ Textos en inglés
- ❌ Usando SVG (no compatible con WhatsApp)
- ❌ URLs relativas

**Ahora:**

- ✅ Textos en español
- ✅ Usando PNG (compatible con todas las plataformas)
- ✅ URLs absolutas
- ✅ Tamaño optimizado 1200x630px

**Metadatos aplicados:**

```
Título: "Isla Market - Envía Amor a Cuba"
Descripción: "Compra electrónicos, artículos para el hogar y alimentos para enviar a tus seres queridos en Cuba"
Idioma: es_ES
Imagen: og-image.png (1200x630px)
```

---

## 📋 Pasos para Completar la Configuración

### Paso 1: Generar la Imagen Open Graph

1. Se abrió automáticamente el archivo `scripts/generate-og-image.html` en tu navegador
2. Haz clic en el botón **"Descargar og-image.png"**
3. Guarda la imagen en la carpeta `public/` de tu proyecto

**Ruta final:** `public/og-image.png`

### Paso 2: Verificar la Imagen

Asegúrate de que `og-image.png` esté en:

```
isla-market/
  public/
    og-image.png  ← aquí
    island.svg
```

### Paso 3: Commit y Deploy

```bash
git add .
git commit -m "feat: add Open Graph image for social sharing"
git push
```

### Paso 4: Verificar Variable de Entorno en Vercel

Ve a tu proyecto en Vercel y asegúrate de que la variable de entorno esté configurada:

```
NEXT_PUBLIC_SITE_URL=https://isla-market.vercel.app
```

O actualízala con tu dominio personalizado si tienes uno.

---

## 🧪 Cómo Probar

### Opción 1: Debugger de Facebook (recomendado)

1. Ve a: https://developers.facebook.com/tools/debug/
2. Ingresa tu URL: `https://isla-market.vercel.app`
3. Haz clic en "Debug"
4. Verás la preview de cómo se ve
5. Si no se ve bien, haz clic en "Scrape Again"

### Opción 2: WhatsApp Web

1. Ve a: https://web.whatsapp.com
2. Envía tu URL a ti mismo o a un contacto de prueba
3. Debería mostrar:
   - 🏝️ La imagen con el logo de Isla Market
   - 📝 "Isla Market - Envía Amor a Cuba"
   - 📄 Descripción en español

### Opción 3: LinkedIn Post Inspector

1. Ve a: https://www.linkedin.com/post-inspector/
2. Ingresa tu URL
3. Verifica la preview

---

## 🔧 Solución de Problemas

### Problema: WhatsApp sigue mostrando la versión vieja

**Solución:** WhatsApp cachea las previews por hasta 7 días. Opciones:

1. **Limpiar caché de WhatsApp:**
   - Agrega un query string temporal: `https://isla-market.vercel.app?v=2`
2. **Usar el debugger de Facebook:**
   - Ve al debugger (link arriba)
   - Haz "Scrape Again" para forzar actualización
3. **Esperar:** El caché expira eventualmente

### Problema: La imagen no se muestra

**Verifica:**

1. ✅ Que `og-image.png` esté en la carpeta `public/`
2. ✅ Que hayas hecho deploy después de agregar la imagen
3. ✅ Que la URL sea accesible: `https://isla-market.vercel.app/og-image.png`

---

## 📊 Especificaciones Técnicas

### Tamaños de Imagen Open Graph

| Plataforma | Tamaño Recomendado | Ratio  |
| ---------- | ------------------ | ------ |
| Facebook   | 1200x630px         | 1.91:1 |
| WhatsApp   | 1200x630px         | 1.91:1 |
| Twitter    | 1200x675px         | 16:9   |
| LinkedIn   | 1200x627px         | 1.91:1 |

**Usamos:** 1200x630px (compatible con todas)

### Formato de Imagen

- ✅ **PNG** - Soporta transparencia, mejor calidad
- ✅ **JPG** - Alternativa con menor tamaño de archivo
- ❌ **SVG** - NO soportado por redes sociales

### Tamaño de Archivo

- Recomendado: < 1MB
- Máximo: < 8MB

---

## 🎨 Personalizar la Imagen

Si quieres personalizar la imagen Open Graph:

1. Abre `scripts/generate-og-image.html` en tu navegador
2. Edita el código JavaScript en la función `drawOGImage()`
3. Modifica:
   - Colores del gradiente
   - Posición del logo
   - Textos
   - Tamaños de fuente
4. Haz clic en "Regenerar"
5. Descarga la nueva versión

**O usa herramientas online:**

- [Canva](https://www.canva.com) - Plantillas gratuitas
- [Figma](https://www.figma.com) - Diseño profesional
- [OG Image Playground](https://og-playground.vercel.app/) - Generador online

---

## 📱 Vista Previa en Diferentes Plataformas

### WhatsApp

```
┌─────────────────────────┐
│  [Imagen 1200x630px]    │
├─────────────────────────┤
│ Isla Market - Envía     │
│ Amor a Cuba             │
├─────────────────────────┤
│ Compra electrónicos,    │
│ artículos para el...    │
├─────────────────────────┤
│ isla-market.vercel.app  │
└─────────────────────────┘
```

### Facebook

```
┌─────────────────────────┐
│  [Imagen grande]        │
├─────────────────────────┤
│ ISLA MARKET - ENVÍA     │
│ AMOR A CUBA             │
│                         │
│ Compra electrónicos,    │
│ artículos para el hogar │
│ y alimentos...          │
└─────────────────────────┘
```

---

## ✅ Checklist Final

Antes de compartir en redes sociales:

- [ ] `og-image.png` está en `public/`
- [ ] Cambios están en producción (deploy hecho)
- [ ] Variable `NEXT_PUBLIC_SITE_URL` configurada en Vercel
- [ ] Probado en Facebook Debugger
- [ ] Probado en WhatsApp
- [ ] Imagen se ve correctamente
- [ ] Texto está en español
- [ ] No hay errores en la consola

---

## 🚀 Próximos Pasos Opcionales

### Mejorar SEO

- [ ] Agregar Schema.org markup
- [ ] Crear sitemap.xml
- [ ] Configurar robots.txt
- [ ] Agregar más metadata (keywords, author, etc.)

### Redes Sociales

- [ ] Configurar Twitter Card específica
- [ ] Configurar Pinterest Rich Pins
- [ ] Agregar botones de compartir en el sitio

---

## 📚 Recursos Útiles

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- [Next.js Metadata](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)

---

**¿Necesitas ayuda?** Abre un issue en el repositorio o consulta la documentación de Next.js sobre metadata.
