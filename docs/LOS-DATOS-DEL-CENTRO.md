# Los datos del centro — para dirección

Fila 67 de la cola (`docs/LAS-CUENTAS-Y-LOS-DATOS.md`), 19-sep-2026. Una página, en lenguaje
llano, sobre qué datos personales maneja el Gestor de Asuntos, adónde van y cuánto se guardan. El
detalle técnico completo está en `docs/INFORME-CRITICO-2026-09-18.md`, apartado 1.2; esta página
es el resumen para enseñar.

**Deja también una copia de esta página en el Dropbox del centro**, no solo en el repositorio.

---

## 1. Qué ficheros con datos personales crea la aplicación, y dónde los deja

Todo vive en el Dropbox del centro. Nada de esto sale de ahí salvo lo que se explica en el punto 2.

**Dentro de `_GESTOR`** (los crea y los usa la propia aplicación):

- La ficha de cada gestión abierta: el nombre de la persona, su grupo, el estado del trámite, las
  notas que se han ido escribiendo, quién ha pedido la gestión (con el nombre del tutor legal si
  es menor), el teléfono o correo por el que se le contacta, y los correos de las personas
  relacionadas con el asunto.
- Los pasos del trámite de cada gestión (a quién le toca cada uno, sus fechas y su historial).
- Las notas rápidas del tablón: texto libre, puede llevar cualquier cosa que se apunte ahí.
- El nombre de cada carpeta ya archivada (lleva el nombre y el número de expediente escolar de la
  persona) y los nombres de sus documentos.
- Quién ha borrado qué: la papelera guarda los asuntos borrados **enteros**, con todos sus
  documentos, hasta que alguien los borre del todo a mano (avisa a los 30 días, pero no se vacía
  sola).
- Copias de seguridad: hasta 30 fotos guardadas de cada uno de estos ficheros, por si alguno se
  estropea, y nunca de más de 90 días (configurable en Ajustes → El centro).

**Dentro de `_GESTOR/datos`:**

- Los ficheros que ya bajaba el centro de Séneca (alumnado y personal), que la aplicación solo lee.
- Tres listas que crea la propia aplicación para quien no sale en esos ficheros: aspirantes a
  plaza sin matricular todavía (nombre, documento, número de expediente, fecha de nacimiento,
  teléfono y correo), personal que no aparece en Séneca (conserjería, limpieza, empresas de
  servicio) y empresas o proveedores, cada una con su nombre, contacto, teléfono y correo.

**En Google Drive**, en la carpeta `GESTOR-BANDEJA` de la cuenta de correo del centro
(`g.educaand.es`): una ficha por cada correo recogido (quién lo manda, a quién, el asunto y parte
del texto), el hilo completo en PDF, y una copia de los documentos que llegan adjuntos.

**En el ordenador de quien usa la aplicación:** solo el permiso sobre las dos carpetas del Dropbox
y el nombre escrito al entrar. Ningún dato de ninguna persona se queda guardado ahí.

## 2. Qué sale del centro y qué no

**Esto sale a internet:**

1. El programa en sí (no los datos de nadie), a la empresa que lo publica en la dirección
   `asuntos.fmargon.com`.
2. Los correos que se etiquetan para el gestor, con su texto, sus adjuntos y el hilo completo en
   PDF, a la carpeta de Google Drive de la cuenta de correo del centro.
3. Los documentos de una gestión que se mandan por correo desde la aplicación: se copian a esa
   misma carpeta de Drive para poder adjuntarlos, y se borran después (quedan unos 30 días más en
   la papelera de Google, como pasa con cualquier archivo que se borra en Drive).

**Esto no sale nunca:**

1. Ningún fichero de `_GESTOR`: ni la ficha de las gestiones, ni la papelera, ni las copias de
   seguridad.
2. Ningún listado de alumnado, de personal ni de familias.
3. Nada de lo que se hace en Séneca.
4. Nada al abrir, buscar, archivar, registrar o imprimir un documento: esas acciones se quedan en
   el propio ordenador y en el Dropbox del centro.

**Esto no se ha podido comprobar todavía:**

1. Qué queda registrado, por su cuenta, en los servidores de quien publica la aplicación (quién
   entra y cuándo; nunca datos de ninguna persona, porque esos no pasan por ahí).
2. Qué conserva Google de la carpeta `GESTOR-BANDEJA` y de su papelera, y durante cuánto tiempo
   exacto.

## 3. Cuánto tiempo se guarda cada cosa

- **La papelera de la aplicación** avisa a partir de los 30 días de que un asunto borrado sigue
  ahí, pero **no lo borra sola**: hace falta que alguien pulse el botón.
- **Las copias de seguridad** guardan las últimas 30 fotos de cada fichero. No se borran por
  fecha, solo cuando ya hay 30 más nuevas.
- **La papelera de Google Drive** conserva lo que se borra allí unos 30 días, como en cualquier
  cuenta de Google.

## Qué falta por decidir

- **Si la papelera de la aplicación debería vaciarse sola** pasado un tiempo, y a los cuántos
  días. Hoy no se borra nada sin que alguien lo pulse a propósito.
