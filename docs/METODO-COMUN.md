# Reglas comunes para Claude Code

> Copia exacta de `METODO-COMUN.md` del repositorio `fmargon780/metodo-apps`.
> **No se edita aquí.** Cuando el método cambia, Claude sustituye este fichero entero en todas las
> apps. Si una regla de este fichero choca con `CLAUDE.md` de la app, manda `CLAUDE.md` solo en lo
> propio de la app (cómo se publica, ramas, revisor, pruebas propias); en todo lo demás manda
> este fichero.

## 1. Al empezar cada sesión (y nada más)

Lee solo esto, en este orden:

1. `docs/LECCIONES.md` de la app (errores ya conocidos y qué hacer en su lugar).
2. La sección «Lecciones para Claude Code» de este fichero (abajo).
3. `docs/CONTEXTO-CORTO.md` (o `docs/CONTEXTO.md` si la app no tiene el corto).
4. La fila de `docs/COLA.md` que vas a trabajar y su instrucción, con la ficha.

Lee código solo cuando lo necesites para la tarea. No leas la historia ni documentos antiguos
salvo que la instrucción lo pida.

## 2. La ficha manda

1. Se programa solo lo que dice la «Ficha del cambio». Nada de mejoras de paso.
2. Lo que está en «Pendiente» de la ficha no se programa.
3. Las filas IDEA y EN DISEÑO no son trabajo: nunca se cogen, ni se marcan, ni se estiman, ni se
   mueven. «La primera PENDIENTE» se cuenta saltándolas.

## 3. Cuándo se para la sesión

**A. Pregunta para la persona** (Francisco u otra), solo en dos casos:
- aparece algo que la ficha no cubre y que **cambia lo que ve o hace la usuaria**;
- el cambio sale **más del doble** de lo estimado.

Cómo se pregunta: en lenguaje llano, una sola pregunta, con las opciones numeradas y sus pros y
contras, **sin marcar ninguna como recomendada**. Si la persona está en la conversación, se le
pregunta allí. Si la sesión va sola, la fila pasa a BLOQUEADA con
«PREGUNTA PARA FRANCISCO: …», `main` no se toca y la sesión para. La respuesta se apunta en la
ficha, en «Respuestas de la persona durante el trabajo».

**B. Atasco técnico** (no es para la persona): si un mismo arreglo falla **dos veces**, no se
sigue probando a ciegas.
1. Se apunta en la nota de la fila qué se intentó y qué falló, en pocas líneas.
2. La fila pasa a BLOQUEADA con «ATASCO PARA CLAUDE: <resumen en una línea>».
3. `main` no se toca y la sesión para. Lo revisa Claude en la siguiente conversación.

Las demás decisiones técnicas las toma la sesión y las deja escritas en la nota de la fila.

## 4. Aprender de los errores

1. Cuando un error **se repite** o **hace perder más de 15 minutos**, se apunta una línea en
   `docs/LECCIONES.md` de la app: qué falló · por qué, en una frase · qué hacer en su lugar.
2. Si la lección sirve para cualquier app (una herramienta que no funciona, un permiso que no
   existe), se apunta además en la nota de la fila con la etiqueta «LECCIÓN GENERAL», para que
   Claude la pase al método.
3. Si una lección ya no es cierta, se corrige o se borra esa línea, no se añade otra debajo.
4. `docs/LECCIONES.md` no pasa de 60 líneas: si crece, se resume.

## 5. Ahorro de tiempo y de cuota

1. Pruebas parciales mientras se trabaja (solo lo tocado y lo de «Cómo se comprueba»); la pasada
   completa, una vez antes de subir, o una vez al día si tarda más de 10 minutos
   (`docs/PASADA-DIARIA.md`).
2. No se espera ni se persigue a GitHub Actions si solo pasa pruebas, salvo que la publicación
   misma vaya por ahí.
3. Como mucho tres subidas por fila (EN CURSO, el cambio, HECHA), nunca fichero a fichero.
4. Ningún fichero de código pasa de 400 líneas: el que haya que tocar y las pase, se parte antes.
5. `docs/CONTEXTO-CORTO.md` no pasa de 160 líneas; `docs/COLA.md`, de 40 KB. Lo cerrado va a
   `docs/HISTORIA.md`. Se actualizan sustituyendo la línea vieja, no añadiendo otra debajo.
6. Estimación: en la subida que marca EN CURSO se pone al día `docs/ESTIMACIONES.md` (minutos de
   cada fila que queda). Al marcar HECHA se escribe la hora de Madrid: `HECHA (26-oct-2026 14:05)`.

## 6. Comprobar y publicar

1. Antes de publicar, se repasa la ficha **punto por punto** y se deja escrito en la nota de la
   fila (y en la petición de cambios, si la hay): cumplido / no cumplido y por qué. Un punto no
   cumplido no se publica.
2. Pruebas: las de «Cómo se comprueba», más una comprobación general de que lo que ya funcionaba
   sigue funcionando.
3. **Una fila solo es HECHA cuando está en `main`, publicada y comprobada** en la dirección real.
   Si no se puede comprobar por una causa ajena, queda SIN PUBLICACIÓN COMPROBADA y el mensaje
   final empieza con «AVISO: no he podido comprobar que los cambios estén publicados.»
4. Al empezar cada sesión, lo primero es comprobar que la última publicación salió bien. Si está
   rota por nuestro código, arreglarla es lo único que se hace.
5. Una publicación por ficha. Cómo se publica en esta app lo dice su `CLAUDE.md`.
6. Si la persona dice que no ve un cambio, primero se comprueba si se publicó. Nunca se supone
   caché del navegador sin comprobarlo.

## Lecciones para Claude Code (de todas las apps)

Copia de las lecciones generales de `LECCIONES.md` del método que afectan a Claude Code.

| Qué no funciona | Por qué | Qué hacer en su lugar |
|---|---|---|
| Subir ficheros de código grandes con las herramientas de ficheros de GitHub | Se cortan al subir | Subir con git. Si git no puede, dejar la fila EN CURSO y decirlo |
| Crear repositorios desde la sesión | Las sesiones solo tienen permiso sobre sus propios repositorios | No se intenta; lo hace Claude desde la conversación (ver `LECCIONES.md` del método) |
