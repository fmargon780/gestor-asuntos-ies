# Las cuentas — para el relevo

Fila 67 de la cola (`docs/LAS-CUENTAS-Y-LOS-DATOS.md`), 19-sep-2026. Una página, sin jerga: qué
hacer si Francisco no está.

**Deja también una copia de esta página en el Dropbox del centro** (fuera de `_GESTOR`, en la raíz
de la carpeta que ya comparten), no solo en el repositorio: quien la necesite puede no tener
acceso al repositorio.

---

## Lo primero que hay que saber

**Los datos no están aquí.** Están en el Dropbox del centro, y no dependen de ninguna de las
cuentas de esta página. Si algo de lo de abajo deja de funcionar, la aplicación puede quedarse sin
poder publicar cambios nuevos, pero **nada de lo que hay guardado se pierde ni se bloquea.**

## Dónde vive cada cosa

- **El programa**: repositorio `fmargon780/gestor-asuntos-ies` en GitHub, privado, rama `main`.
  Cuenta de GitHub: `fmargon780` (la personal de Francisco). Hoy es el único con acceso.
- **La publicación**: proyecto de Vercel `gestor-de-asuntos`, en la cuenta personal de Francisco
  (`fjmarmolejoglez@gmail.com`). **Un solo proyecto**: no crear otro nunca.
- **El dominio**: `fmargon.com`, comprado en esa misma cuenta de Vercel, con **renovación
  automática activada** (comprobado el 19-sep-2026: caduca el 18-sep-2027, y se renueva sola si la
  tarjeta sigue siendo válida). La aplicación se publica en el subdominio `asuntos.fmargon.com`.
- **El correo**: el script que recoge los correos etiquetados corre en Google Apps Script, dentro
  de la cuenta institucional `g.educaand.es` (no la personal), proyecto llamado **"Gestor -
  Correos"**. Guarda lo que recoge en una carpeta de Google Drive de esa misma cuenta,
  `GESTOR-BANDEJA`.

## Cómo se publica un cambio

1. El cambio se sube al repositorio (rama `main`).
2. Vercel lo publica solo, en unos minutos. No hay que darle a ningún botón.
3. Se comprueba en el navegador que la fecha y hora de abajo a la izquierda de la aplicación es la
   del cambio nuevo (si no lo es, o Vercel no ha terminado, o el navegador se ha quedado con la
   página vieja: recargar fuerte, `Ctrl+Shift+R`).
4. Si algo sale mal, el repositorio guarda todo el historial: se puede volver a la versión
   anterior.

## Si la web deja de responder

1. Mirar el panel de Vercel (`vercel.com`, con la cuenta `fjmarmolejoglez@gmail.com`): si la
   última publicación aparece en rojo, ahí dice por qué.
2. Comprobar que el dominio no ha caducado: en ese mismo panel, Domains. Si ha caducado y la
   renovación automática ha fallado (tarjeta caducada, por ejemplo), la dirección de Vercel
   `https://gestor-de-asuntos.vercel.app` sigue viva mientras tanto: se puede seguir trabajando
   desde ahí (avisando de que la red del centro puede bloquear `vercel.app`).
3. Vercel publica como máximo 100 veces al día en el plan gratuito. Si se ha agotado, hay que
   esperar al día siguiente.

## Si deja de llegar correo a la bandeja de "Por clasificar"

1. Entrar en `script.google.com` con la cuenta `g.educaand.es`, proyecto "Gestor - Correos".
2. Editor → Disparadores (el reloj, a la izquierda): comprobar que sigue habiendo uno cada minuto.
   Si no hay ninguno, o da error, hay que volver a ejecutar `prepararTodo()` una vez (está en el
   propio código, con instrucciones en el comentario de arriba del fichero).
3. Comprobar que la etiqueta `GESTOR` de Gmail sigue existiendo y que los correos que interesan la
   llevan puesta.

## Qué NO hay que hacer nunca

- Crear un segundo proyecto de Vercel "por si acaso". Es siempre el mismo, `gestor-de-asuntos`.
- Tocar a mano, desde el explorador de archivos o desde Dropbox en el navegador, los ficheros de
  `_GESTOR`. Se editan solo desde dentro de la aplicación.
- Cambiar el código pegado en `script.google.com` sin copiarlo también a
  `apps-script/gestor-correos.gs` en el repositorio (o al revés): son dos copias que tienen que
  decir lo mismo, y el repositorio no despliega ese fichero solo.

## A quién llamar

Hoy solo Francisco (auxiliar administrativo) sabe de esto. **Pendiente** (parte 3 de esta fila):
poner a una segunda persona del centro como colaboradora en el repositorio de GitHub y en el
proyecto de Vercel, para que no dependa de una sola cuenta. Cuando se haga, se apunta aquí quién
es y desde cuándo.
