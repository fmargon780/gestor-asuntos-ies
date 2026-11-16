# 685 — Actas de la mesa electoral (Consejo Escolar)

Idea de Francisco, 16-nov-2026. Sin diseñar: no programar hasta pasar por el recorrido (`METODO.md`).

## Lo que escribió Francisco

«Que en el tipo de asunto Elecciones al Consejo Escolar se añadan estas plantillas para que el año
que viene salgan solas.» Las plantillas son las cuatro actas de constitución de la mesa electoral y
de elección de representantes que el director le pidió actualizar el 16-nov-2026: una por sector
(madres y padres, alumnado, profesorado y PAS).

## Qué se hizo en el chat ese día

Claude hizo las cuatro actas en Word, con los candidatos de las papeletas, los miembros de cada
mesa y la normativa vigente. **No se copian aquí**: llevan nombres de personas (también de menores)
y el repositorio es público. Lo que sirve para las plantillas está en este documento, sin nombres.

## El modelo (igual en los cuatro sectores)

Entre corchetes, lo que cambia. Los nombres de las marcas son provisionales: se deciden al diseñar.

> **ACTA DE CONSTITUCIÓN DE LA MESA ELECTORAL Y DE ELECCIÓN DE REPRESENTANTES [SECTOR]**
> Elecciones al Consejo Escolar · Curso [CURSO]
>
> En el Centro [CENTRO] y siendo las [HORA] horas del día [FECHA], se reúnen, bajo la presidencia
> del Sr. Director [DIRECTOR], [las personas / el alumnado / el profesorado / el miembro del
> personal de administración y servicios] que abajo se relaciona(n):
> • [miembros de la mesa, uno por línea]
>
> Procediéndose a:
> 1.- Constituir la Mesa Electoral, formada por el Presidente y [el sector] elegido(s) por sorteo
> público, cuyo(s) nombre(s) figura(n) arriba.
> 2.- Dar lectura a las candidaturas presentadas: [candidaturas del sector; en madres y padres,
> con la asociación que las presentó]
> 3.- Declarar abierta la votación a las ____ horas.
> 4.- Finalizada la votación, a las ____ horas, se procede al escrutinio de votos, con el siguiente
> resultado: votos válidos, en blanco, nulos y total emitidos (en madres y padres, además, cuántos
> por voto electrónico y cuántos por doble sobre). Tabla «Candidatura · Nº de votos» con una fila
> por candidatura.
> 5.- En consecuencia, han sido elegidos/as como representantes [del sector] en el Consejo
> Escolar: [tantas líneas en blanco como puestos; en madres y padres, con columna de siglas de la
> asociación o federación].
> 6.- Se hace constar que contra el acto electoral (SI/NO) se ha presentado reclamación escrita u
> oral.
> 7.- [Referencia normativa: ver más abajo]
>
> Y sin más asuntos que tratar, se levanta la sesión a las ____ horas del día indicado, lo que como
> Secretario/a de la Mesa Electoral certifico, con el Vº.Bº. del Presidente/a de la misma.
> Firmas: EL/LA PRESIDENTE/A (Vº.Bº.) · EL/LA SECRETARIO/A DE LA MESA · EL O LOS RECLAMANTES ·
> DEMÁS COMPONENTES DE LA MESA.

Diferencias por sector: el texto del encabezado y del punto 1; PAS en singular (un puesto, una
candidatura); madres y padres con la línea de votos por modalidad y la columna de siglas.

## Qué cambia cada año

| Dato | De dónde podría salir |
|---|---|
| Curso y nombre del centro | Ya existen (`{{CURSO}}`, `{{CENTRO}}`) |
| Director | `cargos.json` (Dirección) |
| Fecha y hora de la votación de cada sector | Las fija la resolución de cada convocatoria; hoy no están en la app |
| Miembros de cada mesa (titulares del sorteo) | Los da Séneca tras el sorteo; hoy no he visto dónde estarían en la app |
| Candidaturas de cada sector | Tarjeta «Candidaturas» (filas 347 y 571): sector, estado (solo las admitidas) y AMPA |
| Puestos a elegir por sector | 5, 5, 8 y 1 con 12 unidades o más; 3, 4, 6 y 1 con menos; uno menos en madres y padres si la AMPA designa representante (misma regla que las papeletas, fila 571) |
| «D./Dª» | La app ya deja la forma que toca por el sexo de la persona (`docs/GENERO-EN-PLANTILLAS.md`) |
| Referencia normativa (punto 7) | Cambia con cada convocatoria: ver abajo |

## La normativa del punto 7 (convocatoria 2026-27)

Texto que llevan las actas de este año:

> De acuerdo con el apartado quinto de la Resolución de 7 de septiembre de 2026, de la Dirección
> General de Inclusión, Convivencia y Participación, por la que se establece el calendario para el
> desarrollo de las elecciones de representantes en los Consejos Escolares de los centros docentes
> sostenidos con fondos públicos de la Comunidad Autónoma de Andalucía, a excepción de los centros
> específicos de educación permanente de personas adultas, para el curso 2026/2027 (BOJA núm. 177,
> de 11 de septiembre de 2026), y con el artículo 15 de la Orden de 7 de octubre de 2010, por la que
> se regula el desarrollo de los procesos electorales para la renovación y constitución de los
> Consejos Escolares de los centros docentes sostenidos con fondos públicos de la Comunidad
> Autónoma de Andalucía, a excepción de los centros específicos de educación permanente de personas
> adultas, modificada por la Orden de 23 de abril de 2024, quedarán los originales de las actas bajo
> custodia de la dirección del centro.

- La plantilla vieja (2022) citaba solo el artículo 15.2 de la Orden de 2010 «y se efectúa su
  convocatoria para el año 2010», y decía que las actas quedaban bajo custodia de **la Junta
  electoral**. La Orden de 2010 dice eso; la Resolución de 2026 (apartado quinto, punto 6) dice **la
  dirección del centro**. Las actas de este año siguen la Resolución.
- La Orden de 23 de abril de 2024 modifica los artículos 11, 13 y 15 (voto electrónico de las
  familias, patria potestad de un solo progenitor, constitución del Consejo). No toca el 15.2.
- La Resolución cambia en cada convocatoria (cada dos años, años pares). **El punto 7 no puede salir
  «solo» sin que alguien compruebe la resolución nueva**: hay que decidir cómo se avisa.
- Fuentes: BOJA 177 de 11-sep-2026 (https://www.juntadeandalucia.es/boja/2026/177/34), BOJA 87 de
  2024 (Orden de 23 de abril de 2024) y BOJA 200 de 13-oct-2010 (Orden de 7 de octubre de 2010).

## Lo visto en la app

- Las plantillas son ficheros `.md` de `plantillas/` con marcas `{{…}}` y `{campo:…}`; ejemplo con el
  mismo tipo: `plantillas/renuncia-junta-electoral.md` (`tipo: ELECCIONES CONSEJO ESCOLAR`). Hay
  tablas y firmas en ese formato, pero no he comprobado si admite el diseño de las actas (tabla con
  cabecera, líneas para rellenar, bloque de firmas que no se parte entre páginas).
- No hay hoy ninguna marca que traiga las candidaturas de un sector, ni los miembros de una mesa.
- `docs/544-PLAN-GUIAS.md` dice que «Votación por sectores» y «Actas de escrutinio» se quitaron de
  los hitos de Administración en la guía de las elecciones: esas actas las pide ahora el director a
  Administración, y habría que ver en qué hito y tarea cuelgan.
- Relacionada: fila 395 (documentos del centro tal como son, con tablas y cuadros).

## A decidir al diseñarla

- Cuatro plantillas (una por sector) o una sola que se adapte al sector.
- De dónde salen la fecha y la hora de cada sector y los miembros de cada mesa (campos del asunto,
  Séneca, otra cosa).
- Cómo se avisa de revisar la normativa cada convocatoria.
- Qué hace el acta si el sector tiene más o menos candidaturas que puestos, o si la AMPA designa
  representante.
- Si cuelgan de un hito concreto de la guía del tipo.

## Ficheros que mirar al diseñarla

`plantillas/renuncia-junta-electoral.md`, `docs/PLANTILLAS-DE-DOCUMENTO.md`,
`docs/GENERO-EN-PLANTILLAS.md`, `docs/CANDIDATURAS-CONSEJO-ESCOLAR.md`,
`docs/571-PAPELETAS-CONSEJO-ESCOLAR.md`, `docs/contexto/HITOS-Y-GUIAS.md`, `js/candidaturas-ficha.js`,
`js/candidaturas-papeletas.js`.
