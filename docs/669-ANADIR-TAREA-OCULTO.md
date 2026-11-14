# 669 — «+ Añadir tarea» abre un formulario que no se ve

## Lo que escribió el usuario
Aviso de usuario (algo no funciona), enviado desde el botón de soporte
(aviso completo: https://drive.google.com/file/d/1ex-I6DofeiEEnXKS6suZE5cLYo4SeHi3/view?usp=drivesdk):

> App: Gestor de Asuntos · Repositorio: fmargon780/gestor-asuntos-ies · Pantalla: Ficha de un asunto
> Contexto: web · perfil Administración · Quién lo envía: Francisco Javier Marmolejo González
> Fecha: 2026-11-14 18:49 · Versión de la app: 14-nov-2026 · 17:41 · botón 20-oct-2026 · fila 34
>
> Texto: Entro en un hito, le doy al botón de Crear Tareas y desparece el botón y no ocurre nada

Sin nota de Francisco.

## Lo que entendió Claude (acordado con Francisco el 14-nov-2026)
- El botón es «+ Añadir tarea» del hito (fila 660).
- Causa: al pulsarlo, el formulario se monta, pero queda oculto. La regla de la fila 551 que oculta
  la caja antigua «Nueva tarea…» cuando el plan de las guías está aplicado oculta `.tcd-nueva`, y
  la fila 660 usa ese mismo nombre para el formulario nuevo. En el instituto el plan está aplicado;
  en las pruebas con datos inventados, no, y por eso no se vio.
- Qué verá quien use la app: al pulsar «+ Añadir tarea» aparece, debajo de las tareas del hito, el
  formulario de la tarea nueva («Qué se hace», nombre, «Añadir» y «Cancelar»), igual que en la
  pantalla de prueba aprobada de la fila 660 (`docs/pantallas/650.html`), también con el plan de
  las guías aplicado.
- Nada más cambia.

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea
- Nada aparte.

## Notas técnicas de Claude
- Reproducido: en `?demo=1&auto=1`, SANCION de Fuentes Calvo, con
  `document.documentElement.classList.add('plan-guias-aplicado')`, al pulsar `.tcd-abrir-form`
  el botón se va, `.tcd-nueva .at-que` existe pero no se ve (`offsetParent` nulo).
- Arreglo: quitar `.plan-guias-aplicado .tcd-nueva` de la regla de `css/comunes.css` (línea 12).
  La caja antigua «Nueva tarea…» ya no existe; `.tcd-nueva` solo lo usa ahora
  `js/hito-mesa-nueva-tarea.js`. Comprobar con una búsqueda que no queda otro uso de `.tcd-nueva`
  que deba seguir oculto.
- Repasar las demás piezas nuevas de la fila 660 (`js/anadir-hito.js`, `js/anadir-tarea.js`,
  «Cambiar…» de `js/hito-mesa-tarea-menu.js`, la marca de la guía) con el plan aplicado: que
  ninguna use otro nombre de los que oculta esa regla.
- Prueba nueva (o paso nuevo en `pruebas/crear-hitos-y-tareas.mjs`): con la clase
  `plan-guias-aplicado` puesta, «+ Añadir tarea» enseña el formulario visible y se puede añadir una
  tarea; lo mismo con «+ Añadir hito».

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar
- En un asunto del instituto, entra en un hito y pulsa «+ Añadir tarea»: sale el formulario debajo
  de las tareas.
- Añade una tarea con él y mira que aparece en el hito.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
