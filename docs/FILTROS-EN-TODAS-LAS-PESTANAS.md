# Los filtros de Inicio valen en las cuatro pestañas (fila 216)

Diseño cerrado con Francisco el 28-sep-2026 (idea 216: «Los filtros de la vista principal no
están funcionando»).

## Lo que ve Francisco

En Inicio abre «Filtros», elige una opción y la tabla no cambia: siguen saliendo todos los
asuntos.

## Por qué pasa

Desde la fila 209 (pestañas) los filtros se reparten mal entre las pestañas:

- **Situación, Plazo, Lo encarga y Tipo de asunto** (`#filtro-estado`, `#filtro-plazo`,
  `#filtro-organo`, `#filtro-tipo-asunto`) solo los aplica `App.listaAbiertosFiltrada`
  (`js/asuntos-lista-pintar.js`), que solo usa la pestaña «Todos los abiertos».
  `js/inicio-tabla.js` (`calcular`) no los mira: en «En Administración», «En espera» y
  «Dormidos» no hacen nada. Y la pestaña que suele estar abierta es «En Administración».
- **Responsable** (`#inicio-me-toca-responsable`) solo lo aplica `calcular`, así que no hace nada
  en «Todos los abiertos».
- `js/vista.js` (`filtrosPuestos`) no cuenta «Responsable» en «Filtros (N)».

## Lo que hay que hacer

1. **Los cinco filtros valen igual en las cuatro pestañas**: Responsable, Situación, Plazo, Lo
   encarga y Tipo de asunto. Un solo sitio decide si un asunto pasa los filtros (una función
   común, por ejemplo `App.pasaFiltrosInicio(asunto, hito)`), y la usan tanto
   `App.listaAbiertosFiltrada` como `InicioTabla` (`calcular`, para `adm`, `esp` y `dorm`). Nada
   de copiar la condición en dos sitios.
   - Responsable, en «Todos los abiertos» y «Dormidos»: se mira el hito actual del asunto (el
     primero sin terminar), con la misma regla que ya usa `calcular`
     (`HitosAdministracion.cuentaPara`). Un asunto sin hito actual no pasa si hay un responsable
     elegido.
   - Situación: si alguna opción no tiene sentido en una pestaña (por ejemplo, «dormidos» dentro
     de «En Administración»), se aplica igual; el resultado será una tabla vacía, con su texto de
     vacío de siempre. No se esconden opciones.
2. **El número de cada pestaña cuenta lo que queda después de filtrar**, en las cuatro (hoy
   `todos` ya lo hace con `listaAbiertosFiltrada`; las otras tres, tras el filtro nuevo).
3. **«Filtros (N)» cuenta los cinco**, Responsable incluido (`js/vista.js`), y el botón que limpia
   los filtros, si lo hay, limpia también Responsable. Quitar el comentario de `vista.js` que dice
   que Responsable no cuenta.
4. **Cambiar un filtro repinta la pestaña que está a la vista**, sea cual sea
   (`repintarLaPestanaActiva` ya existe; que Responsable use lo mismo en vez de su `onchange`
   propio).
5. El chip «Filtrado por…» (avisos) y el buscador de la cabecera siguen como están y se suman a
   los filtros.
6. «Ordenar» no cambia: sigue gobernando solo «Todos los abiertos».

## Pruebas

- Prueba nueva `pruebas/filtros-en-todas-las-pestanas.mjs`: con asuntos de varios tipos, plazos
  y responsables, para **cada una de las cuatro pestañas** y **cada uno de los cinco filtros**,
  elegir una opción y comprobar que la tabla y el número de la pestaña bajan a lo esperado; quitar
  el filtro y comprobar que vuelve todo. Comprobar «Filtros (N)» con Responsable puesto.
- Poner al día las pruebas que den por hecho que Responsable no cuenta o que los filtros solo
  valen en «Todos los abiertos» (`pruebas/inicio.mjs`, `pruebas/inicio-a-todo-el-ancho.mjs`,
  `pruebas/nombre-corto-en-los-filtros.mjs`, `pruebas/quien-encarga-cada-tipo.mjs`, si tocan).

## Al terminar

- `docs/CONTEXTO-CORTO.md`, línea de «Inicio»: sustituir la frase de los filtros por «Filtros
  (Responsable/Situación/Plazo/Lo encarga/Tipo de asunto), valen en las cuatro pestañas».
- El hijo de `docs/contexto/` de Inicio, igual. Una línea en `docs/HISTORIA.md`.
- Publicar y comprobar con `curl` que se sirve el `js/inicio-tabla.js` nuevo.
