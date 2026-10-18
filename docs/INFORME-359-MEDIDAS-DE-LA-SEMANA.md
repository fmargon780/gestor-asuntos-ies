# Informe 359 — Medidas de la semana (13 al 16-oct-2026)

Fila 359 de `docs/COLA.md`. Paso que la fila 335 dejó a Francisco: leer las cifras de la fila 332
que el buzón guarda en el Drive del centro (`SOPORTE-AVISOS/_MEDIDAS`,
`MEDIDAS gestor-asuntos-ies 2026-10.json`). No hizo falta que Francisco hiciera nada: una
conversación de Claude con Drive conectado las leyó el 18-oct-2026.

Datos: 4 días (13, 14, 15 y 16-oct), 4 ordenadores (`8fq896` y `w28tp5`, los del centro, con
casi todo el uso; `bf4g9v` y `uun3ce`, poco uso). Tiempos en milisegundos salvo que se diga.

## 1. Lo de cada día va rápido

| Qué | Media | Peor caso |
|---|---|---|
| Entrar (`entrar.total`) | 0,2–0,5 s | 0,7 s |
| Abrir un asunto (`asunto.abrir`) | 10 ms | 30 ms |
| Repintar la lista de Inicio (`lista.repintar`) | 30–45 ms | 3,2 s (una vez, 13-oct) |
| Leer `asuntos.json` | 3–5 ms | 0,4 s |
| Guardar un hito (`guardar.dura:hitos.json`) | 15–27 ms | 2,7 s |

Conclusión: nada que arreglar en el uso normal.

## 2. Lo lento

1. **Archivar un asunto** (`asunto.archivar`). Media de 3 s (13-oct, 200 archivados) que sube a
   5–11 s los días 14, 15 y 16. Peores casos: 30 s, 52 s y 58 s. Un caso de 29 minutos el 15-oct en
   `8fq896` (casi seguro el ordenador dormido o la pestaña en segundo plano; no cuenta).
   Es lo único que la usuaria nota que tarda.
2. **Guardar `asuntos.json`**. Media de 0,2 s, pero con colas: el 13-oct en `8fq896` un guardado
   esperó hasta 7,9 s a que acabara el anterior y la escritura llegó a 3,7–6,6 s. Muchos
   reintentos (`reintento:asuntos.json`: 126 el 13-oct, 103 el 15-oct en `8fq896`).
3. **Tres guardados «sin remedio» de `asuntos.json`** (`sin-remedio:asuntos.json`: 2 el 13-oct,
   1 el 15-oct, en `8fq896`). Es lo más importante del informe: un guardado que no se pudo hacer ni
   reintentando. Hay que saber si se perdió algo o si lo recogió el guardado siguiente.
4. **Congelones de unos 30 s** el 16-oct en `8fq896`: a la vez, leer `centro-de-datos.json`
   (30,5 s), leer `plantillas.json` (30,4 s) y escribir un PDF (30,8 s). Huele a Dropbox
   sincronizando; una vez en cuatro días.
5. `base.poner-al-dia` (tarea de fondo): media 1 s, peor 13 s. No bloquea nada; se deja.

## 3. Lo que sale para la cola

- Fila 360 (IDEA): archivar tarda de 3 a 11 s de media y hasta un minuto.
- Fila 361 (IDEA): los guardados «sin remedio» de `asuntos.json` y los muchos reintentos.

Los congelones de 30 s no se apuntan: una sola vez, y probablemente ajenos a la app.
