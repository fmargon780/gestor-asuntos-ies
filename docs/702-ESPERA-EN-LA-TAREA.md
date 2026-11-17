# 702 — La espera es de la tarea, con su día para volver a mirar

Parte del tema 692 (el molde nuevo). Va detrás de la fila 701.

## Lo que escribió Francisco
Idea de Francisco: un aviso en Inicio «N esperas por reclamar».

(La espera con su día, la fila «Reclamar a…» y el aviso los vio en la pantalla de prueba y los dio por buenos, parte a parte.)

## Lo que entendió Claude (acordado con Francisco el 17-nov-2026)
- La espera no es una tarea aparte: es un estado de la tarea nuestra que la provoca. Una tarea está por hacer, esperando o hecha.
- En el ⋮ de una tarea sin hacer, **«Esperando a…»** abre una ventana pequeña: «A quién esperamos» (Familia, Tercero, Dirección, Jefatura, Secretaría, Tutor/a del grupo) y **«Qué día volver a mirarlo»**. Botones «Cancelar» y «Poner en espera».
- Debajo de la tarea sale: «Esperando a <quién> desde el <día> · volver a mirarlo el <día>», con tres botones: **«Ya ha llegado»** (la tarea queda hecha), **«Cambiar el día»** y **«Dejar de esperar»** (vuelve a por hacer).
- Mientras la primera tarea sin hacer espera, el panel dice «Esperando a <quién> · volver a mirarlo el <día>» y el asunto está en la pestaña **«En espera»** de Inicio, con «Esperando a <quién> · hasta el <día>» y «Le toca a» <quién>.
- **Al llegar el día, el asunto vuelve solo a «En Administración».** El panel dice «Toca volver a mirarlo: <tarea>». Bajo la tarea: «Se espera a <quién> desde el <día>. Tocaba volver a mirarlo el <día>.», y «Cambiar el día» pasa a decir «Seguir esperando…». En Inicio, «Por dónde va» dice **«Reclamar a <quién> · espera desde el <día>»**.
- **Aviso de Inicio «N esperas por reclamar»:** uno solo para todo Inicio, con su cuenta, en la línea de avisos donde hoy sale «N listos para enviar». Al pulsarlo, Inicio enseña solo esos asuntos, con «Ver todo» para volver. Sin ventana que salte ni sonido.

**No se habló y no está en la pantalla de prueba; lo propone Claude y lo aprueba Francisco al leer esto:**
- «Qué día volver a mirarlo» nace vacío y es obligatorio para poner la espera.
- La lista de «A quién esperamos» es la misma de hoy en «Esperando a…».
- El «Esperando a…» de la cabecera no sale en un asunto sin hitos: se espera desde la tarea.

## Pantalla de prueba
- Aprobada el 17-nov-2026: `docs/pantallas/692.html` · https://claude.ai/artifact/HyjmGcwogUBkAmwcq6TEwV

## Qué NO se hace en esta tarea
- La espera de una firma, con su día propuesto: fila 704.
- Avisar por correo o con sonido cuando vence una espera.
- Cambiar «Esperando a…» en los asuntos con hitos.

## Notas técnicas de Claude
- Leer antes `docs/notas-diseno/692.md` («Lo visto en el código») y `docs/notas-diseno/692-documentos.md`. Reglas del plan (`docs/PLAN-2026-11.md`): lo nuevo se añade, no sustituye; un asunto con hitos y un tipo sin la marca no cambian en nada.
- Cambios quirúrgicos: se tocan solo los ficheros nombrados aquí y los nuevos. Ficheros nuevos por debajo de 400 líneas, apuntados en su lista `js/cargar-piezas-N.js`. Una sola tanda de pruebas al final.
- Colores, letras y botones, los de la app; la pantalla de prueba solo dice qué hay y dónde va.
- Hoy la espera es del hito (`esperandoA`, `esperandoDesde`; `js/estado-hito.js`: `aQuienSePuedeEsperar`, `ponerEsperando`). Aquí se guarda en la tarea, `{ quien, desde, volver }`, en un fichero nuevo `js/tarea-espera.js`.
- El estado (`js/sin-hitos-estado.js`, fila 700): con espera viva, lado de espera y `esperando`; con el día llegado (hoy ≥ `volver`), lado de Administración y una marca `reclamar`.
- Aviso de Inicio: donde se pinta «N listos para enviar» (`HacerEsteHitoSello.avisar`, `js/inicio.js`); el filtro, como los de `js/inicio-tabla.js`.
- «Hoy» se mira al pintar; no hace falta ninguna tarea de fondo.

## Cómo lo comprueba el segundo revisor
- «Esperando a…» está en el ⋮ de una tarea sin hacer y su ventana pide a quién y qué día; sin día no deja poner la espera.
- La línea bajo la tarea y sus tres botones hacen lo que dice el texto.
- Con la primera tarea sin hacer en espera, el asunto está en «En espera» con «Esperando a X · hasta el día».
- Poniendo el día de volver en hoy o antes, el asunto está en «En Administración» con «Reclamar a X · espera desde el día», y el panel dice «Toca volver a mirarlo».
- El aviso «N esperas por reclamar» cuenta bien, filtra al pulsarlo y «Ver todo» lo quita. Sin esperas vencidas no sale.
- Los asuntos con hitos no cambian.

## Qué mirar al terminar
- Poner una tarea esperando a la familia con día de mañana: mirar el panel e Inicio › «En espera».
- Cambiar el día a hoy: mirar «Reclamar a…» y el aviso de Inicio.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
