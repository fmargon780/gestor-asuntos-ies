# Enlaces a la normativa: usar siempre la vista de un solo artículo

Apuntada el 29-sep-2026 desde la tarea 24 del repositorio `normativa-escolarizacion`.

El enlace correcto a un artículo es `https://normativa.fmargon.com/norma#r=<clave>`. El código
(`HitosBiblioteca.enlaceDeNormativa`, `js/hitos-biblioteca.js`) ya lo monta así cuando hay clave
y dirección base. Dos cosas hacen que a veces se abra la portada o no se abra desde el centro:

1. `POR_DEFECTO_NORMATIVA` en `js/plantillas.js` es `https://normativa-escolarizacion.vercel.app`,
   que la red del IES bloquea. Cambiarlo a `https://normativa.fmargon.com` (y el placeholder de
   `index.html`, y la nota de `docs/BIBLIOTECA-DE-HITOS.md`). Quien ya tenga guardada la
   dirección vieja en Ajustes debe verla sustituida (migrar `vercel.app` → `normativa.fmargon.com`
   al leer `plantillas.json`).
2. Las referencias sin clave que solo guardan una `url` (`/<bloque>#r=…` o la dirección base a
   secas) se usan tal cual. Si la url guardada es de ese sitio, convertirla a
   `<base>/norma#r=<clave>` cuando se pueda sacar la clave del `#r=`; si es solo la base, no
   enseñar enlace.

Del lado de normativa (ya hecho en la tarea 24): un `/#r=<clave>` que caiga en la portada
redirige a `/norma#r=<clave>`. La oposición vive aparte, en `/oposicion`, con contraseña; el
gestor nunca debe enlazar ahí.

Comprobación: en un hito, la cita con clave `ROC-40` abre `https://normativa.fmargon.com/norma#r=ROC-40`.
