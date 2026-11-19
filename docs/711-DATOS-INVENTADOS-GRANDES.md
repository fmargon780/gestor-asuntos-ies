# 711 — Datos inventados del tamaño de un instituto, con casos raros

**Título llano:** Datos de demostración del tamaño de un instituto, con casos raros
**Para qué:** que lo que se pruebe en la demostración se parezca a lo que pasa en un instituto de verdad: mucha gente, muchos asuntos y los casos que dan problemas. Todo inventado.
**Partes:** segunda de dos; la primera es la 710 (probar antes de producción). No dependen una de otra.

## Lo que escribió Francisco (19-nov-2026)
«Yo no necesito que tú veas datos reales. ¿Podemos hacerlo todo con datos inventados y casos inventados?»

«Pruebas de todo tipo sobre los últimos cambios hechos en la app.»

## Lo que entendió Claude (acordado con Francisco el 19-nov-2026)
- Hoy la demostración trae 12 asuntos abiertos, 6 cerrados y 25 alumnos. Se queda corta: no se ven la lentitud con mucha gente, las listas largas ni los casos raros.
- Se añade un **juego grande**, que se pide con `?demo=1&auto=1&grande=1`. **Sin `grande=1` la demostración queda exactamente como hoy**: las pruebas que ya existen no cambian ni se alargan.
- **Todo inventado**, en el mismo estilo que los datos de hoy. Nada sale de los datos reales ni se copia de ellos, ni siquiera cambiándole los nombres.
- Tamaño, como orden de magnitud (una constante fácil de cambiar): unos 700 alumnos en varios grupos de ESO y Bachillerato, 60 personas de personal, 150 asuntos abiertos y 1.500 cerrados repartidos en tres cursos, con sus documentos.
- **Una lista de casos raros** en `docs/CASOS-DE-PRUEBA.md`, una línea por caso y cómo verlo en la demostración (qué buscar o dónde abrirlo). Como mínimo:
  - plazos: asunto vencido, dormido, esperando a un tercero, esperando a una Administración, reservado, recurrente;
  - personas: homónimos, hermanos, apellidos compuestos («de la», «del»), «Mª», ñ y tildes, nombres de pila de más de 40 caracteres, alumno sin número escolar, alumno que cambia de grupo, baja a mitad de curso, tutores con y sin custodia dicha, documento DNI, NIE y pasaporte;
  - terceros: empresa con nombre comercial, NIF repetido, Administración con varios departamentos;
  - asuntos: muchos del mismo tercero (parada de duplicados), uno con 50 documentos, uno con 30 tareas, uno cerrado y reabierto, uno del curso anterior;
  - documentos: Word y PDF, registrado, firmado y sellado, correo con adjunto, hilo largo;
  - configuración: tipo desactivado, plantilla sin uso, campo de lista vacío con «Solo si», plazos que caen en festivo o en el cambio de curso;
  - los listados de Séneca como llegan de verdad: CSV en Latin-1, con tildes y ñ en cabeceras y datos, `;` como separador, fechas `dd/mm/aaaa`.
- Las filas siguientes **añaden sus propios casos** a esa lista y a los datos, una línea cada uno, cuando su instrucción lo pida.
- La demostración grande **entra en pocos segundos**. Si con ese tamaño tarda más de unos 10 segundos en entrar, la sesión lo dice en la nota de la fila y reduce el tamaño hasta que no pase.
- Nada de esto se ve en producción ni cambia ninguna pantalla.

## Pantalla de prueba
- Sin pantalla: no cambia ninguna pantalla de la app; solo hay más datos en la demostración.

## Qué NO se hace en esta tarea
- Datos reales, ni copiados ni con los nombres cambiados (idea 496, descartada el 19-nov-2026).
- Cambiar el juego pequeño de hoy ni las pruebas que ya existen.
- La dirección de prueba antes de producción: es la fila 710.

## Notas técnicas de Claude
- Generador con **semilla fija** (los mismos datos siempre) en ficheros nuevos de `js/demo/`, cada uno por debajo de 400 líneas, apuntados en su lista `js/cargar-piezas-N.js`. Se cargan con importación dinámica solo cuando hay `grande=1`: en producción no se descarga ni un byte de más (`docs/COPIA-DE-PRUEBAS.md`, apartado 3).
- Para dar de alta y crear, las funciones de la propia app, como pide `docs/COPIA-DE-PRUEBAS.md` (apartado 2). Si montar 1.500 cerrados así tarda demasiado, escribir los ficheros directamente en el disco de mentira **con la forma que la app ya reconoce** y comprobar que `Base.leer` y el archivo los leen.
- Para miles de documentos no generar miles de PDF: reutilizar unos pocos binarios pequeños con nombres distintos.
- Nombres y apellidos de listas inventadas y combinadas con la semilla; los casos de la lista llevan nombres fijos y reconocibles para que se puedan buscar.
- Sin condiciones «si demo» repartidas por los módulos (`docs/COPIA-DE-PRUEBAS.md`, apartado 4).
- Pruebas nuevas `demo-grande`: con `grande=1` hay los alumnos y asuntos esperados, cada caso de `docs/CASOS-DE-PRUEBA.md` se encuentra por su nombre, entra en menos de unos segundos y sin `grande=1` todo sigue como hoy.
- Línea en `js/novedades.js`: no.
- `docs/CONTEXTO-CORTO.md` (apartado 5: una línea) y `docs/CONTEXTO.md` o el hijo que toque, `docs/HISTORIA.md`.

## Cómo lo comprueba el segundo revisor
- `?demo=1&auto=1&grande=1` entra, Inicio muestra muchos asuntos abiertos y «Archivo» ofrece tres cursos con asuntos cerrados.
- Cada caso de `docs/CASOS-DE-PRUEBA.md` se encuentra siguiendo lo que dice su línea (el revisor prueba al menos diez, repartidos por tipos).
- Con muchos datos, Inicio, Nuevo asunto y el buscador de personas siguen respondiendo sin quedarse colgados.
- Sin `grande=1`, la demostración es la de siempre (12 abiertos).
- Consola del navegador sin errores.
- En `https://asuntos.fmargon.com` no se descarga nada de `js/demo/`.

## Qué mirar al terminar
- Abre `?demo=1&auto=1&grande=1`: verás cientos de asuntos y personas.
- Abre `docs/CASOS-DE-PRUEBA.md`: la lista de casos raros, cada uno con cómo verlo.
- Abre `?demo=1&auto=1` a secas: sigue con pocos datos, como antes.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
