# El código de verificación del documento

Acordado con Francisco el 17 de septiembre de 2026. Fila 19 de `docs/COLA.md`.

Es el punto 1 de `docs/PROXIMOS-ASUNTOS.md`, reducido a lo que de verdad se puede hacer.

## Lo que se pide, y lo que no

Los documentos electrónicos de la administración llevan impreso en el pie un **código de
verificación** y la **dirección de una página** donde ese código se teclea para comprobar que el
documento es auténtico y descargar la copia original firmada.

Francisco comprobó el 16-sep-2026, con un documento de Séneca firmado por su director, que esa
página no pide ni certificado ni captcha: al meter el código sale la lista de firmantes, los datos
del documento electrónico y tres enlaces (fichero original, firma y fichero ENI).

Lo que se pide es solo esto: **que él no tenga que teclear el código a mano**.

Lo que **no** se hace, y no hay que intentarlo:

- Traer la copia auténtica sola. La página de verificación no se abre con una dirección que lleve
  el código dentro: hay que rellenar su formulario. Y cada administración tiene la suya, así que
  aunque se resolviera una, no valdría para las demás. Nada de descargas automáticas, ni de
  `fetch` a esas páginas, ni de guardar el original en la carpeta del asunto.
- Poner nosotros la dirección de verificación. La dirección la pone **el propio documento**, sea de
  la Junta de Andalucía, de un ayuntamiento o de un juzgado. Así esto funciona con todos y no hay
  ninguna lista que mantener.

Solo como dato, no para escribirlo en el código: la de los documentos de Educación de la Junta de
Andalucía es `https://www.juntadeandalucia.es/educacion/verificafirma/verificarDocumento/`.

## 1. Leer el pie del documento

Se reutiliza lo que ya existe: `js/registro-lector.js` ya carga pdf.js (`js/lib/pdf.min.js`) solo
cuando hace falta y saca el texto de la primera página para leer el sello de Séneca. Hay que
aprovechar esa misma máquina; no se añade ninguna librería nueva y no se carga pdf.js al arrancar.

Lo más limpio: sacar de `registro-lector.js` la función que devuelve el texto de la primera página
(`textoDePrimeraPagina`) para poder usarla desde fuera, y hacer el trabajo nuevo en un módulo
propio, `js/verificacion.js`, con dos funciones:

    Verificacion.leerDelTexto(texto)   -> { codigo: '...', enlace: '...' }  (lo que encuentre)
    Verificacion.leerDelFichero(fich)  -> lo mismo, leyendo el PDF

Hay documentos de varias páginas donde el pie está en todas, y otros donde el código va al final.
Con la primera página basta: es lo que ya se hace con el sello y funciona.

**El código.** Se busca una de estas etiquetas, sin distinguir mayúsculas ni tildes, y se coge lo
que venga detrás:

    Código Seguro de Verificación
    Código seguro de verificación (CSV)
    Código de verificación
    CSV
    CVE

Detrás de la etiqueta puede haber dos puntos, un guion o nada. El código es la primera tirada
seguida de letras, números y los signos `+ / = - _ .`, de ocho caracteres o más. Si en la misma
página aparecen varios, se coge el primero.

**La dirección.** Cualquier `http://` o `https://` que aparezca en ese texto y cuya dirección
contenga alguna de estas palabras: `verifica`, `csv`, `cve`, `valida`, `cotejo`, `sede`. Se coge la
primera. Ojo con la basura pegada al final: se recortan los puntos, comas, paréntesis y comillas
que vengan detrás, porque en el pie la dirección suele ir dentro de una frase.

Si no encuentra nada, devuelve los dos campos vacíos. Nunca lanza un error: un documento que no
lleve código es lo más normal del mundo.

## 2. Los dos botones, en el visor

En `js/lector.js` (el visor, `Lector.abrir({ titulo, pie, blob, botones })`) y en quien lo llame.

Cuando lo que se abre es un PDF, se lee el pie mientras el documento se está pintando (sin hacer
esperar a nadie: el visor sale igual de rápido, y los botones aparecen cuando el texto esté leído).

- Si hay código **y** dirección, debajo del documento salen dos botones:

      [ Copiar el código ]   [ Abrir la verificación ]

- **Copiar el código** copia el código al portapapeles y el propio botón cambia un momento a
  "Copiado" (como ya se hace en `js/copiar.js`, si allí hay algo parecido; si no, se hace igual de
  simple). Al lado, en pequeño y en gris, el código tal cual, para que se vea qué se ha copiado.
- **Abrir la verificación** abre esa dirección en una pestaña nueva
  (`target="_blank"`, `rel="noopener"`).
- Si hay código pero no dirección, sale solo el botón de copiar.
- Si no hay código, no sale nada: ni botones, ni líneas, ni avisos. El visor queda exactamente
  como está hoy.

Nada se guarda: el código no se apunta en `asuntos.json` ni en ningún fichero compartido. Es un
botón para no teclear, no un dato del asunto.

## 3. Pruebas

Fichero nuevo `pruebas/verificacion.mjs`, del estilo de los que ya hay, probando
`Verificacion.leerDelTexto` con textos de pie de verdad (sin PDF, sin navegador):

1. Pie de un documento de Séneca: saca código y dirección.
2. Etiqueta "CSV:" a secas: saca el código.
3. Etiqueta "Código Seguro de Verificación" con tildes y en dos líneas: saca el código.
4. Dirección con un punto final pegado: el punto no entra en la dirección.
5. Varias direcciones en el texto: coge la de verificación, no la de la web del organismo.
6. Texto sin nada de esto: devuelve los dos campos vacíos y no revienta.
7. Un código de menos de ocho caracteres no se toma por código.

La batería completa (`npm test`) tiene que quedar en verde.

## 4. Al terminar

- `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md`: la línea del visor y la del lector de PDF, si las
  hay, se sustituyen; no se añaden nuevas debajo.
- `docs/HISTORIA.md`: esto, y por qué no se trae la copia auténtica sola.
- En `docs/PROXIMOS-ASUNTOS.md`, dejar dicho que el punto 1 se ha hecho en esta fila, y que la
  descarga automática de la copia auténtica se descartó a propósito.
- Esto no toca el script de Apps Script: Francisco no tiene que pegar nada.
