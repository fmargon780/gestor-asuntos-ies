# Asuntos «Por liquidar» (fila 249)

Diseñado con Francisco el 1-oct-2026 en Cowork, a partir de su aviso de soporte del mismo día
(«Pantalla: Inicio», propuesta de mejora). Aviso completo:
https://drive.google.com/file/d/1wJmRM-7l-n5aa3csrNPcaSTjhjdBKwjL/view?usp=drivesdk

## Qué pasa hoy

Hay asuntos que, terminados, aún no se pueden archivar: hay que **liquidarlos** de forma
periódica con otro órgano del centro. Ejemplo: Administración cobra el seguro escolar cuando la
Secretaria no está, y cada cierto tiempo le entrega el dinero recibido (o un material que había
que recoger). Hoy esos asuntos se quedan en «En Administración» o se archivan sin dejar
constancia de la entrega.

## Qué quiere Francisco

1. **Casilla por tipo.** En Ajustes, en la pantalla de cada tipo de asunto, una casilla nueva:
   **«Hay que liquidarlo antes de archivar»** (desmarcada por defecto). Se guarda al cambiar,
   como todo en Ajustes (fila 198). Vive en el tipo (`App.E.tipos`, junto al resto de datos del
   tipo); «Unir con otro tipo» (fila 207) la conserva si la tenía el que se queda.
2. **Cuándo entra un asunto en «Por liquidar».** Un asunto de un tipo con la casilla entra en
   «Por liquidar» en el momento en que, de otro modo, se ofrecería archivarlo:
   - con guía: al marcar como hecho su último hito (hoy «Marcar como hecho» abre «Archivar el
     asunto» en la mesa; para estos tipos, en su lugar, el asunto pasa a «Por liquidar» y lo dice
     un aviso verde «Pasa a Por liquidar», con «Deshacer»);
   - sin guía o desde la ficha: el botón «Archivar el asunto» de la ficha cambia a **«Pasar a Por
     liquidar»** para estos tipos. El menú «⋮» de la tabla, igual.
   - El estado se guarda en la ficha del asunto (`_GESTOR/asuntos.json`, por ejemplo
     `porLiquidar: { desde: <fecha> }`), nunca en el nombre de la carpeta. La carpeta no se mueve.
   - Un asunto «Por liquidar» que se vuelva a tocar (se desmarca un hito, se añade uno) vuelve a
     su pestaña normal y sale de «Por liquidar».
3. **Pestaña nueva en Inicio: «Por liquidar»**, la quinta, después de «Dormidos», con su número
   (que cuenta lo filtrado, como las otras, fila 216). Los asuntos «Por liquidar» **salen de «En
   Administración» y de «En espera»**; siguen en «Todos los abiertos». La pestaña no aparece si
   no hay ningún tipo con la casilla marcada.
   - Misma tabla y mismos filtros que las demás pestañas. Una casilla por fila para marcar y una
     casilla en la cabecera para marcar todos los que se ven. Columna «Por liquidar desde».
   - Si algún tipo de los asuntos que se ven tiene un campo propio de clase **Importe en euros**
     (fila 244), columna «Importe» con su valor, y encima de la tabla la línea **«Marcados: N
     asuntos · Total: 123,45 €»**, que se pone al día al marcar. Si un tipo tiene varios campos de
     importe, se usa el primero; uno vacío o en ámbar cuenta 0 y la línea lo dice («2 sin
     importe»).
   - Botón **«Liquidar»**, apagado sin nada marcado.
4. **«Liquidar».** Abre un cuadro con:
   - Fecha (hoy, cambiable).
   - **Entrega:** la persona que ha entrado en la app (desplegable de nombres de la entrada),
     cambiable.
   - **Recibe:** por defecto quien ocupa el cargo de Secretaría en esa fecha (los cargos de
     Ajustes, como en la firma de los documentos); cambiable, con texto libre.
   - Nota opcional (por ejemplo, «Dinero en efectivo» o «Material recogido»).
   - La lista de asuntos marcados con su importe y el total.
   - Botón «Liquidar y archivar».
5. **Al aceptar**, por cada asunto marcado:
   - Se genera el PDF **LIQUIDACIÓN** y se guarda una copia en la carpeta de cada asunto, con el
     nombre de documento de la fila 239 (`AAMMDD LIQUIDACION D26-01234.pdf`, tipo de documento
     «LIQUIDACIÓN», creado solo si no existe). El PDF, una página (más si la lista no cabe), con el
     membrete del centro que ya dibuja la app: título «Liquidación», fecha, «Entrega» y «Recibe»
     con nombre, la nota si la hay, una tabla con cada asunto (número de asunto, tipo, tercero —sin
     el tercero si el asunto es reservado— e importe), el total, y abajo dos huecos de firma: «Entrega»
     y «Recibe». Se hace con pdf-lib, como `js/correo-enviado-pdf.js` y `js/indice-expediente.js`.
   - En el registro del asunto (fila 229) queda la línea automática «Liquidado el <fecha>: entrega
     <nombre>, recibe <nombre>».
   - El asunto se archiva por el camino normal de `js/asuntos-archivar.js`, sin volver a preguntar
     uno a uno (una sola confirmación para todos, la del propio cuadro).
   - Lo principal es archivar; si el PDF falla en un asunto, aviso ámbar (`U.accesorio`) y ese
     asunto **no** se archiva (se queda en «Por liquidar»), para no perder la constancia. Al final,
     un aviso verde: «Liquidados y archivados N asuntos. Total: 123,45 €».
6. **Reabrir** un asunto liquidado desde el ARCHIVO lo devuelve a abierto como hoy, sin
   «porLiquidar»; el PDF se queda en la carpeta.
7. **Exportar** (fila 241): columna opcional «Por liquidar desde», y el filtro de Situación de
   Inicio gana la opción «Por liquidar».

## Antes de empezar

- Leer `docs/contexto/ESTADO-DEL-ASUNTO.md`, `docs/contexto/PANTALLA.md`,
  `docs/contexto/ASUNTOS-ARCHIVO.md` y `docs/contexto/CAMPOS-Y-TIPOS.md`.
- El reparto de pestañas está en `js/inicio.js`, `js/inicio-tabla.js` y `js/que-me-toca.js`;
  archivar, en `js/asuntos-archivar.js`; la clase Importe, en `js/campos-clases.js`.
- Mirar cómo se resuelve hoy quién ocupa un cargo en una fecha (firma de documentos) y usar lo
  mismo para «Recibe».
- Textos con `docs/VOCABULARIO.md`; añadir «Por liquidar», «Liquidar» y «Liquidación».
- Un módulo nuevo (`js/por-liquidar.js`, y `js/por-liquidar-pdf.js` si hace falta) que se
  engancha por los puntos previstos, sin envolver (regla de `docs/CONTEXTO-CORTO.md` §6). Ningún
  fichero pasa de 600 líneas.

## Ficheros

- Nuevos: `js/por-liquidar.js`, `js/por-liquidar-pdf.js`, carga en `index.html` y en la copia
  sin internet.
- Tocados: `js/ajustes-tipo.js` (casilla), `js/inicio.js` / `js/inicio-tabla.js` /
  `js/que-me-toca.js` (pestaña y reparto), `js/hito-mesa.js` (último hito hecho),
  `js/ficha-asunto.js` (botón), `js/exportar-datos.js`, `js/novedades.js` (regla 21).
- Datos de demostración: un tipo «Seguro escolar» con la casilla marcada y un campo «Importe» de
  clase Importe en euros, con tres asuntos ya en «Por liquidar» (1,12 €, 1,12 € y uno vacío).
- Prueba nueva `pruebas/por-liquidar.mjs`, con los puntos de abajo.
- Documentación al terminar: `docs/CONTEXTO-CORTO.md` (§5, línea nueva y la de Inicio,
  sustituyendo), los hijos de `docs/contexto/` tocados, `docs/HISTORIA.md` y `docs/COLA.md`.

## Qué dirá Claude Code a Francisco al terminar

Los tipos con la casilla «Hay que liquidarlo antes de archivar» ya no se archivan al terminar:
pasan a la pestaña «Por liquidar» de Inicio. Allí se marcan varios, se ve el total y «Liquidar»
genera el PDF de entrega firmado por los dos y los archiva.

## Cómo sabemos que está bien

1. En Ajustes, en un tipo, marcar «Hay que liquidarlo antes de archivar»: se guarda sin pulsar
   nada más. En Inicio aparece la pestaña «Por liquidar». Con ningún tipo marcado, no aparece.
2. En un asunto de ese tipo con guía, marcar como hecho el último hito: no sale «Archivar el
   asunto»; sale el aviso verde «Pasa a Por liquidar» con «Deshacer». El asunto está en «Por
   liquidar» y ya no en «En Administración» ni en «En espera»; sí en «Todos los abiertos».
3. Pulsar «Deshacer»: el hito vuelve a estar sin hacer y el asunto vuelve a su pestaña.
4. En la ficha de un asunto de ese tipo, el botón dice «Pasar a Por liquidar»; en un asunto de
   otro tipo sigue diciendo «Archivar el asunto».
5. En «Por liquidar», marcar dos asuntos con importe y uno sin él: la línea dice «Marcados: 3
   asuntos · Total: 2,24 € (1 sin importe)». La casilla de la cabecera marca y desmarca todos.
6. «Liquidar»: el cuadro trae la fecha de hoy, quien ha entrado como «Entrega» y la persona de
   Secretaría como «Recibe», con la lista y el total. «Liquidar y archivar»: aviso verde
   «Liquidados y archivados 3 asuntos. Total: 2,24 €». Los tres están en el ARCHIVO.
7. En la carpeta de cada uno hay `AAMMDD LIQUIDACION D26-…pdf`. Abierto: membrete, título,
   fecha, Entrega, Recibe, la tabla con los tres asuntos, el total y los dos huecos de firma. Un
   asunto reservado sale sin el tercero.
8. En la ficha de un asunto liquidado, el registro dice «Liquidado el …: entrega …, recibe …».
9. Reabrir uno de ellos desde el ARCHIVO: vuelve a abierto, no en «Por liquidar», y el PDF
   sigue en su carpeta.
10. A 1280 px de ancho, las cinco pestañas caben en una fila y la tabla de «Por liquidar» cabe
    sin barra horizontal.
