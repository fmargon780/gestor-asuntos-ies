# El membrete lo monta la aplicación, con el manual de la Junta

Fila 149 de `docs/COLA.md`. Diseño cerrado con Francisco el 25-sep-2026.
Sustituye a la primera versión de esta misma fila, que solo cambiaba la letra.

## Qué pasa hoy

Desde la fila 81 (`docs/FIRMANTES-Y-MEMBRETE.md`), en Ajustes se sube una imagen de membrete
(`_GESTOR/PLANTILLAS/membrete.png`) y `js/membrete.js` escribe encima el nombre de la Consejería,
en Arial, dentro de una caja de cuatro números (x, y, ancho, alto).

Problemas:

- La letra no es la del manual.
- Cada centro tiene que fabricarse una imagen con el hueco justo, y ajustar los cuatro números a mano.
- El nombre del centro va metido en la imagen.
- El logo propio del centro sale en todos los documentos, sin poder quitarlo.

## Cómo tiene que quedar

La aplicación **dibuja el membrete entero**. Ya no se sube ninguna imagen de base.

### Lo fijo, igual para todos los centros

- **El símbolo de la Junta (la «A» en dos verdes).** Ya está en el repositorio, en vectorial:
  `img/junta-andalucia-simbolo.svg`, subido con esta fila. Se ha sacado del manual vigente.
  Verde claro `#348F40`, verde oscuro `#017836`.
- **«Junta de Andalucía»**, en Noto Sans HK **negrita (700)**, en negro `#221E1B`.

### Lo que se rellena en Ajustes → El centro → Membrete

1. **Consejería.** Texto. Si está vacío, vale «Consejería de Educación» (nombre vigente desde
   julio de 2026, Decreto del Presidente 9/2026). Se dibuja en Noto Sans HK **regular (400)**, en
   negro `#221E1B`.
2. **Nombre del centro.** Texto. Se dibuja en **MAYÚSCULAS**, Noto Sans HK regular, en verde oscuro
   `#017836`. Si Ajustes ya guarda el nombre del centro en otro sitio (`Plantillas`, «centro»,
   por defecto «IES Fuente Lucena»), **se usa ese mismo dato**: no se crea otro campo que haya que
   mantener igual a mano. En la sección Membrete se enseña y se edita ese mismo dato.
3. **Logo del centro.** Una imagen PNG o JPG, opcional. Se guarda tal cual en
   `_GESTOR/PLANTILLAS/logo-centro.png` (con `Carpetas.escribirBytes`, como hoy `membrete.png`).
   Botón para subirla y otro para quitarla (a la Papelera, como el resto de borrados).

Debajo, una **vista previa en vivo** del membrete entero, que cambia mientras se escribe, con los
valores del formulario aún sin guardar (como hoy hace `Membrete.dibujar`).

**Se quitan** de Ajustes el botón de subir la imagen del membrete y los cuatro números de la caja
(«Dónde va el nombre de la Consejería»). `membrete.png`, si existe, deja de usarse; no se borra.
Las claves `membreteCaja` que haya en `plantillas.json` se ignoran.

### Por plantilla de documento: con o sin el logo del centro

Cada plantilla de documento de Word (sección «Plantilla de documento de Word» de la pantalla de un
tipo, `js/plantillas-documento-ajustes.js`) lleva una casilla **«Con el logo del centro»**, que se
guarda en su entrada de `documentos` como `conLogoCentro`.

- **Marcada por defecto.** Una plantilla vieja sin la clave cuenta como marcada.
- Sin marcar: el membrete sale con el bloque de la Junta y la parte derecha en blanco (el lienzo
  mide lo mismo, para que el documento no cambie de maquetación).
- Si no hay logo subido, la casilla no cambia nada: la derecha sale en blanco.

`Membrete.montar(opciones)` recibe `{ conLogoCentro }` desde `js/plantillas-documento.js`, que
sabe qué plantilla se está generando.

## Las medidas

Salen de la «articulación horizontal» del manual. Todo va en proporción a **S**, la altura del
símbolo, para que valga a cualquier tamaño.

- **Lienzo:** 2480 × 400 px (ancho de un A4 a 300 ppp), fondo blanco, PNG. El mismo tamaño
  para todos los centros.
- **Símbolo:** S = 270 px de alto, a 60 px del borde izquierdo, centrado en vertical.
- **Textos:** empiezan 0,20·S a la derecha del borde derecho del símbolo, alineados a la izquierda.
- **Tamaño de letra** (el tamaño de la fuente, no la altura de las mayúsculas):
  «Junta de Andalucía» 0,244·S; Consejería 0,144·S; nombre del centro 0,111·S.
  Es la proporción del manual: la Consejería, un 40 % menos que «Junta de Andalucía», y el
  centro, un 25 % menos que la Consejería.
- **Líneas base**, medidas desde lo alto del símbolo: «Junta de Andalucía» 0,465·S;
  Consejería 0,735·S; nombre del centro 1,00·S (**justo en la base del símbolo**; Francisco lo
  pidió así expresamente).
- **Textos largos:** la Consejería o el nombre del centro que no quepan antes del 72 % del ancho
  del lienzo se parten en dos líneas por un espacio, con 0,20·S entre líneas. Si hay líneas de
  más, todo el bloque de texto sube lo necesario para que la última línea siga en la base del
  símbolo. Si ni así cabe, se reduce la letra de ese texto hasta que quepa.
- **Logo del centro:** se escala para que su alto sea S + 20 px, sin deformarlo, alineado a la
  derecha a 60 px del borde. Si al escalarlo fuese más ancho del 25 % del lienzo, se escala por
  el ancho en vez de por el alto y se centra en vertical.

Esta composición, con el logo del IES Fuente Lucena, la ha dibujado Claude en Cowork el
25-sep-2026 y Francisco la ha dado por buena. La vista previa tiene que salir igual.

## La letra

- Crea `fonts/NotoSansHK-latin-400.woff2` y `fonts/NotoSansHK-latin-700.woff2`: Noto Sans HK de
  Google Fonts, recortada a los caracteres latinos (básico, Latin-1 y los signos del español:
  á é í ó ú ü ñ Á É Í Ó Ú Ü Ñ ¿ ¡ º ª · – — « » “ ” ‘ ’ €), por ejemplo con `pyftsubset` de
  fonttools. Entera pesa megas porque trae el chino; recortada, unas decenas de KB cada una.
- Tiene que ser **Noto Sans HK**, no «Noto Sans» a secas: sus letras latinas son distintas, y las
  de la HK son las del manual.
- Licencia OFL al lado (`fonts/OFL.txt`).
- Revisa `vercel.json` (`font-src` e `img-src` de la política de seguridad) para que dejen cargar
  la letra y el SVG desde el propio dominio.
- Cárgalas con la API `FontFace`, una sola vez (guarda la promesa), y espera a que estén listas
  antes de dibujar. **Si fallan, se dibuja con Arial**: el documento nunca se queda sin membrete
  por culpa de la letra. Igual con el SVG: si no carga, el documento sale sin membrete, como hoy
  cuando no hay imagen.

## Pruebas

En `pruebas/membrete.mjs` (o la que toque):

- sin nada en Ajustes, el membrete sale con «Consejería de Educación», el nombre del centro por
  defecto y la derecha en blanco;
- con logo subido, sale a la derecha; con la plantilla desmarcada, no sale;
- una plantilla vieja sin `conLogoCentro` sale con logo;
- un nombre de Consejería muy largo se parte en dos líneas y la última queda en la base del símbolo;
- si la letra no carga, el membrete sale igual, con Arial;
- la función que calcula dónde va cada cosa sigue siendo SIN EFECTOS (sin DOM ni canvas), como hoy
  `Membrete.medir`, y se prueba suelta.

Actualiza `docs/FIRMANTES-Y-MEMBRETE.md` y el contexto: el membrete ya no es una imagen subida.

## Qué verá Francisco

En Ajustes → El centro → Membrete: tres campos (Consejería, nombre del centro y logo) y el membrete
dibujado debajo. En cada plantilla de documento, la casilla «Con el logo del centro», marcada.
Los documentos salen con el membrete del manual de la Junta sin subir ninguna imagen de base.
