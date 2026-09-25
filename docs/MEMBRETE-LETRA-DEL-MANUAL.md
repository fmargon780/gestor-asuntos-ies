# El nombre de la Consejería, con la letra del manual de la Junta

Fila 149 de `docs/COLA.md`. Pedido por Francisco el 25-sep-2026.

## Qué pasa hoy

`js/membrete.js` escribe el nombre de la Consejería encima de la imagen del membrete
(fila 81, `docs/FIRMANTES-Y-MEMBRETE.md`). Lo escribe con `Arial, Helvetica, sans-serif` y en el
color `#1E1A1E`.

El manual de identidad corporativa vigente de la Junta de Andalucía pide la letra
**Noto Sans HK** (licencia libre OFL): «Junta de Andalucía» en negrita y el nombre de la
Consejería en regular, en negro `#221E1B`.

Francisco ha rehecho el membrete del centro con el manual nuevo. La imagen ya trae
«Junta de Andalucía» y el nombre del centro, y deja vacío el hueco de la Consejería para que lo
escriba la aplicación. Con Arial, esa línea desentona con las otras dos.

## Qué hay que hacer

1. **Traer la letra al repositorio, sin depender de nadie de fuera.**
   - Crea `fonts/NotoSansHK-Regular-latin.woff2`: Noto Sans HK de Google Fonts, en peso 400,
     recortada a los caracteres latinos (básico, Latin-1 y los signos del español: á é í ó ú ü
     ñ Á É Í Ó Ú Ü Ñ ¿ ¡ º ª · – — « » “ ” ‘ ’ €). Por ejemplo, con `pyftsubset`, de fonttools.
     Entera pesa megas porque trae el chino; recortada tiene que quedar en unas decenas de KB.
   - Tiene que ser **Noto Sans HK** y no «Noto Sans» a secas, porque las letras latinas de las
     dos son distintas. Las de la HK son las del manual.
   - Añade la licencia OFL al lado (`fonts/OFL.txt`).
   - Revisa la política de seguridad de `vercel.json` (`font-src`) para que deje cargar la letra
     desde el propio dominio.

2. **Usarla al dibujar.** En `Membrete.dibujar`, antes de escribir el texto:
   - Carga la letra con la API `FontFace` (una sola vez; guarda la promesa) y espera a que esté
     lista. Si falla la carga, sigue con Arial como hasta ahora: el membrete nunca se queda sin
     salir por culpa de la letra.
   - `ctx.font = m.tamano + 'px "Noto Sans HK Membrete", Arial, Helvetica, sans-serif'` (o el
     nombre de familia que le des en `FontFace`).
   - Color `#221E1B`.
   - Ajusta `FACTOR_ANCHO_CARACTER` de `medir` a la anchura media real de esta letra (mídela; es
     algo más estrecha que Arial). `medir` sigue sin tocar DOM ni canvas.

3. **Valores por defecto para el membrete nuevo.** Hoy son los del membrete viejo.
   - En `js/plantillas.js`, `POR_DEFECTO_MEMBRETE_CAJA = { x: 16.2, y: 65.8, ancho: 38.8, alto: 9.8 }`.
     Son las medidas exactas del hueco de la Consejería en el membrete nuevo, que mide
     2480 × 400 píxeles.
   - Si en `plantillas.json` del centro la caja guardada sigue siendo **exactamente** la vieja
     por defecto (`10.3 / 43.2 / 20.7 / 10.0`), trátala como no puesta y usa la nueva. Si
     Francisco la ha cambiado a mano, se respeta.
   - En `index.html`, el ejemplo del campo «Nombre de la Consejería» pasa a ser
     «Consejería de Educación», que es el nombre vigente desde julio de 2026 (Decreto del
     Presidente 9/2026). Si el valor guardado está vacío, el valor por defecto es también
     «Consejería de Educación».

4. **Pruebas.** Amplía `pruebas/membrete.mjs` (o la que toque) para comprobar que
   - la vista previa de Ajustes y un documento generado usan la letra nueva, y que si la letra
     no carga el membrete sale igual, con Arial;
   - la caja vieja por defecto se sustituye por la nueva y una caja cambiada a mano se respeta.

## Qué verá Francisco

En Ajustes → El centro → Membrete, al subir el membrete nuevo, «Consejería de Educación» sale ya
en su sitio y con la misma letra que «Junta de Andalucía» y que el nombre del centro, sin tocar
ningún número.
