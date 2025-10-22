# Iconos PWA

Para generar los iconos PNG necesarios para la PWA, puedes usar las siguientes opciones:

## Opción 1: Herramientas Online
1. Ve a https://realfavicongenerator.net/
2. Sube el archivo `icon-512x512.svg`
3. Descarga el paquete completo de iconos

## Opción 2: Usar ImageMagick (si tienes instalado)
```bash
# Instalar ImageMagick si no lo tienes
# Windows: choco install imagemagick
# macOS: brew install imagemagick
# Linux: sudo apt-get install imagemagick

# Convertir SVG a PNG en diferentes tamaños
magick convert icon-512x512.svg -resize 72x72 icon-72x72.png
magick convert icon-512x512.svg -resize 96x96 icon-96x96.png
magick convert icon-512x512.svg -resize 128x128 icon-128x128.png
magick convert icon-512x512.svg -resize 144x144 icon-144x144.png
magick convert icon-512x512.svg -resize 152x152 icon-152x152.png
magick convert icon-512x512.svg -resize 192x192 icon-192x192.png
magick convert icon-512x512.svg -resize 384x384 icon-384x384.png
magick convert icon-512x512.svg -resize 512x512 icon-512x512.png
```

## Opción 3: Crear versiones temporales básicas
Para propósitos de desarrollo, puedes crear versiones simples copiando el archivo SVG:

```bash
# Copiar el SVG como PNG temporalmente
cp icon-512x512.svg icon-72x72.png
cp icon-512x512.svg icon-96x96.png
cp icon-512x512.svg icon-128x128.png
cp icon-512x512.svg icon-144x144.png
cp icon-512x512.svg icon-152x152.png
cp icon-512x512.svg icon-192x192.png
cp icon-512x512.svg icon-384x384.png
cp icon-512x512.svg icon-512x512.png
```

Los navegadores modernos pueden manejar SVG en lugar de PNG para iconos de PWA.
