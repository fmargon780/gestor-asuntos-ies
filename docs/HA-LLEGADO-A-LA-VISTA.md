# Fila 214 — «Ha llegado» abre «Ver todo» a la vista

Diseñada con Francisco el 28-sep-2026 (conversación de Cowork). Diseño cerrado por él.

## El fallo

En Inicio, la línea «Ha llegado: N correos · N documentos por clasificar» (fila 212,
`js/inicio.js`, `trozoHaLlegado`) llama a `App.irVista('clasificar', soloQue)`
(`js/asuntos-lista-montones.js`). Eso quita `oculto` a `#zona-clasificar`, pero:

- `#zona-clasificar` está en `index.html` **después** de `#inicio-cuerpo` (pestañas + tabla).
- Nada esconde `#inicio-cuerpo` mientras se ve «Ver todo», ni lleva la pantalla arriba.

Resultado: la lista aparece debajo de toda la tabla de asuntos, fuera de la pantalla. Francisco
pulsa y «no pasa nada». Afecta igual a «N correos» y al botón de siempre de «Ver todo».

## Lo que tiene que pasar

1. Al entrar en «Ver todo» (`App.E.vista === 'clasificar'`, venga de «N correos», de «N
   documentos por clasificar» o de cualquier otro sitio), **se esconde `#inicio-cuerpo`** (las
   cuatro pestañas, filtros, «Filtrado por…» y la tabla) y `#zona-clasificar` queda arriba, justo
   debajo de la fila «Ha llegado» / avisos. La cabecera (título, tablón, buscador) no cambia.
2. Se sube la pantalla hasta arriba (`scrollTo` de la zona de trabajo que tenga el
   desplazamiento; mirar cuál es, puede no ser `window`), para que se vea sin buscarla.
3. «← Volver» (`#btn-ha-llegado-volver`) y cualquier `App.irVista` con otra vista vuelven a
   enseñar `#inicio-cuerpo` exactamente como estaba: misma pestaña, filtros y orden (no se
   repinta de cero ni se pierde lo filtrado).
4. Todo lo demás de «Ver todo» sigue igual: «solo correos» / «solo documentos», «Ver también…»,
   bandeja plegada o desplegada, «Ya los he visto».
5. Al recargar la página, si `vista-abiertos` guardado en `localStorage` era `clasificar`, se
   abre igual que al pulsar: tabla escondida, «Ver todo» a la vista. Si eso resulta raro al
   probarlo, arrancar siempre en la tabla (`departamento`) y decirlo en la nota de la fila.

## Cómo

- El cambio va en `App.irVista` (una clase en `#pantalla-abiertos`, por ejemplo
  `viendo-clasificar`, y la regla en `css/inicio.css` que esconde `#inicio-cuerpo`). Sin
  envolturas nuevas (regla de `CONTEXTO-CORTO.md`, sección 6).
- Mirar que ningún otro módulo pinte dentro de `#inicio-cuerpo` contando con que se ve mientras
  está «Ver todo» abierto (p. ej. el repintado de `js/inicio.js`: que siga pintando escondido sin
  romperse).

## Pruebas

- Ampliar `pruebas/inicio-a-todo-el-ancho.mjs` (o una nueva `pruebas/ha-llegado-a-la-vista.mjs`):
  pulsar «N documentos por clasificar» → `#inicio-cuerpo` no visible, `#zona-clasificar` visible
  y su parte de arriba dentro de la pantalla (`getBoundingClientRect().top` menor que la altura
  de la ventana), con una tabla de asuntos larga (40 asuntos o más) para que el fallo de hoy se
  reproduzca. Lo mismo con «N correos». «← Volver» → tabla visible, con la pestaña y el filtro
  que había.
- `npm test` completo en verde antes de subir.

## Al terminar

Cláusulas comunes de `docs/REPARTO-DE-LA-COLA-2026-09-27.md` (a `main` sin pull request, como
mucho tres subidas, nada se sube en rojo). Comprobar lo publicado con `curl`. Poner al día
`docs/CONTEXTO-CORTO.md` (línea de «Inicio» en la sección 5: «Ver todo» sustituye a la tabla
mientras está abierto), el hijo de `docs/contexto/` que toque y `docs/HISTORIA.md`.
