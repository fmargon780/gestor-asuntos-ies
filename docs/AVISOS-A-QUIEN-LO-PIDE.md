# Avisos a quien lo pide, «Enviar estado» e informe para dirección (fila 182)

Acordado con Francisco el 26-sep-2026. Diseño cerrado. Es el «camino 1» del análisis
`claude/Analisis-estabilidad-crecimiento-2026-09-26.md` (proyecto de Claude): **el resto del centro
usa el gestor sin entrar en él**. Administración sigue siendo la única que escribe; los demás piden
y consultan por correo. **Va después de la fila 181** (usa el vocabulario y la línea de avisos).

Regla que manda en todo el documento: **ningún correo sale sin que alguien pulse «Enviar»**. La app
prepara; la persona confirma.

## Ficheros que se tocan

- `js/guias-editor.js` y `js/guias-paso-bloques.js` (punto 1: la casilla del hito)
- `js/ajustes-tipo.js` (punto 1: la casilla del tipo)
- `js/hitos-biblioteca.js` (punto 1: la casilla viaja con el modelo de la biblioteca)
- `js/hitos.js` (`marcar`) y `js/hitos-panel-lista.js`, `js/hito-mesa.js` (punto 2: al marcar hecho)
- `js/asuntos-archivar.js` o `js/ficha-archivo.js` (punto 2: al archivar)
- `js/correo-cuadro.js` y `js/correo.js` (puntos 2, 3 y 4: abrir el cuadro relleno)
- `js/lo-pide.js` (`correoDe`, `texto`: de ahí sale el destinatario)
- `js/plantillas.js` y `js/plantillas-centro.js` (punto 1: las dos plantillas nuevas)
- `js/ficha-asunto.js` o `js/ficha-nombre-acciones.js`, y `js/hito-mesa.js` (punto 3: el botón)
- `js/cuentas.js` (punto 4: el botón del informe; 401 líneas: si crece, partir en
  `cuentas-informe.js`)
- `docs/contexto/CORREO-Y-SENECA.md`, `docs/contexto/HITOS-Y-GUIAS.md`, `docs/CONTEXTO.md`
- Una prueba nueva en `pruebas/`

No leas el repositorio entero. Cambios quirúrgicos. `js/correo-cuadro.js` tiene 601 líneas: se parte
antes de tocarlo.

## Qué hay que hacer

### 1. Dónde se configura

- **En cada hito de la guía** (editor del paso), una casilla nueva: **«Al terminar este hito, avisar
  a quien lo pide»**, apagada de partida. Debajo, cuando está encendida, un desplegable «Con la
  plantilla:» con las plantillas de correo del tipo; por defecto **«Aviso de avance»**. La casilla y
  la plantilla son un campo más del paso: viajan con el modelo de la biblioteca (entran en
  `CAMPOS_COMPARABLES` de `js/hitos-biblioteca.js`) y llegan a los asuntos abiertos como cualquier
  cambio de guía.
- **En el tipo de asunto** (Ajustes › el tipo › Datos del tipo), otra casilla: **«Al cerrar el
  asunto, avisar a quien lo pide»**, apagada de partida, con su desplegable; por defecto **«Aviso de
  cierre»**.
- **Dos plantillas de correo nuevas**, creadas solas la primera vez que se entra tras este cambio si
  no existen (como hace «Cargar las plantillas del centro»), válidas para cualquier tipo:
  - «Aviso de avance»: asunto `{{TIPO}} · {{TERCERO}}: avance`; texto breve con
    `{{NOMBRE DE QUIEN LO PIDE}}`, «el asunto va por el hito {{HITO N}} de {{HITOS M}}: {{HITO
    TÍTULO}}», y la fecha. Los huecos que no existan aún se añaden a `js/plantillas-valores.js`.
  - «Aviso de cierre»: lo mismo, con «el asunto ha quedado cerrado el {{HOY}}».
  Se editan en Ajustes como las demás; se pueden borrar (entonces la casilla avisa de que falta la
  plantilla y no abre nada).

### 2. Cuándo salta

- **Al marcar como hecho** un hito con la casilla encendida (desde la casilla de la lista, desde la
  mesa o porque el guion se completó y se aceptó «¿Damos el paso por hecho?»), **después** de
  guardar el cambio, si el asunto tiene «Lo pide» con correo (`LoPide.correoDe(ficha)`): se abre el
  cuadro de Correo de siempre, con destinatario, asunto y texto de la plantilla ya puestos, y dos
  botones: **«Enviar»** y **«Esta vez no»**. «Esta vez no» cierra sin más y no vuelve a preguntar por
  ese hito.
- **Al archivar** un asunto de un tipo con la casilla encendida: igual, con «Aviso de cierre»,
  **antes** de mover la carpeta (para que el cuadro tenga la ficha a mano); si se pulsa «Esta vez
  no», se archiva igual.
- Sin «Lo pide» o sin correo: no pasa nada, ni aviso.
- El correo enviado deja su nota en el asunto, como cualquier correo (`js/correo-rastro.js`).
- Si el cuadro de Correo ya está abierto por otra cosa, no se abre un segundo (`U.preguntar` es
  uno solo): se deja para la siguiente vez que se marque algo.

### 3. «Enviar estado», con un clic

- Botón **«Enviar estado»** en la ficha del asunto (junto a «El encargo») y en la cabecera de la
  mesa del hito. Abre el mismo cuadro con «Aviso de avance», destinatario quien lo pide (si no hay,
  vacío) y el hito actual. Sirve para contestar a un «¿cómo va lo mío?» sin escribir nada.

### 4. «Preparar informe para dirección»

- En la pantalla **Cuentas**, arriba a la derecha, botón **«Preparar informe para dirección»**.
  Abre el cuadro de Correo **sin destinatario** (lo elige quien lo manda), con asunto «Informe de
  asuntos · <fecha>» y este texto, calculado al momento con lo que Cuentas ya sabe:
  1. Abiertos por órgano que lo encarga (Secretaría, Dirección, Jefatura…), con el número.
  2. Vencidos (hito con plazo pasado), lista corta: tipo · tercero (tapado si es reservado) · días.
  3. Esperando a otros más de 15 días, lista corta igual.
  4. Cerrados desde el último informe (se guarda la fecha del último enviado en
     `_GESTOR/informes.json`, pequeño, releído antes de guardar; la primera vez, últimos 30 días).
  5. Tiempo medio de tramitación por tipo del curso, si Cuentas lo tiene.
- Texto plano, en párrafos cortos, sin tablas (Gmail lo respeta mejor). Los reservados salen sin el
  tercero.
- Sin recordatorio automático: Francisco lo decidió así. Solo el botón.

## Lo que no se hace

- Nada sale solo. Ni al marcar, ni al archivar, ni a una hora fija.
- No se abre la app a más usuarios ni se crea ninguna cuenta nueva.
- No se toca el script de Gmail: el cuadro de Correo envía como hoy.

## Prueba

Prueba de navegador con el disco de mentira: un tipo con la casilla encendida en el hito 2 y un
asunto con «Lo pide» con correo; marcar el hito 2 abre el cuadro relleno con el correo de quien lo
pide y el texto de «Aviso de avance»; «Esta vez no» lo cierra y no reabre; un asunto sin «Lo pide»
no abre nada; «Enviar estado» abre el cuadro desde la ficha; en Cuentas, «Preparar informe» abre el
cuadro con los cinco apartados. `npm test` entero al final.

## Al terminar

`docs/contexto/CORREO-Y-SENECA.md` (los avisos, las dos plantillas, el informe),
`docs/contexto/HITOS-Y-GUIAS.md` (la casilla del hito), `docs/CONTEXTO.md` (tabla de `_GESTOR`:
`informes.json`), `docs/CONTEXTO-CORTO.md` sección 5 (una línea). Entrada en `docs/HISTORIA.md`.
Sube directamente a `main`, sin pull request, en como mucho dos subidas.
