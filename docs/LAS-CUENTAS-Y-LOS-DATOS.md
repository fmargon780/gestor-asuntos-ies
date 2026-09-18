# Fila 67 — Las cuentas y los datos, por escrito

Sale del informe `docs/INFORME-CRITICO-2026-09-18.md`, partes 1.2 y 4 (punto 12).

Esta fila no toca código. Son dos papeles, y es de lo que más protege por lo poco que cuesta.

---

## 1. El problema

### 1.1 Todo cuelga de las cuentas personales de Francisco

El repositorio, el dominio `fmargon.com`, el proyecto de publicación y el script de Google están
en sus cuentas. Nadie más puede publicar un cambio, renovar el dominio ni tocar el script.

Si se va del centro, o se pone enfermo un mes, la aplicación **sigue funcionando** —los datos están
en el Dropbox del centro, eso está bien— pero queda congelada y sin mantenimiento posible.

Un centro educativo no puede depender de la cuenta personal de un auxiliar administrativo para una
herramienta que usa a diario.

### 1.2 Nadie ha escrito qué datos personales maneja la aplicación ni adónde van

El informe lo tiene, pero el informe es un documento técnico de 62 KB. Dirección necesita una
página.

## 2. Qué hay que hacer

Dos documentos. Los dos se escriben en `docs/` **y se dejan también en el Dropbox del centro**,
fuera de `_GESTOR`, en la raíz de la carpeta que ya comparten. El repositorio no le sirve de nada a
quien no sea Francisco.

### 2.1 `docs/LAS-CUENTAS.md` — para el relevo

Una página, sin jerga. Qué lleva:

- **Dónde vive cada cosa**: el repositorio (dónde, en qué cuenta, quién tiene acceso), el proyecto de
  publicación, el dominio y cuándo se renueva, el script de Google y en qué cuenta corre.
- **Cómo se publica un cambio**, en cuatro líneas: se sube al repositorio, Vercel publica solo, se
  comprueba con el navegador que la versión de abajo a la izquierda es la nueva.
- **Qué hacer si la web deja de responder**: mirar el panel de Vercel, mirar si el dominio ha
  caducado, y que mientras tanto la dirección de Vercel sigue viva.
- **Qué hacer si deja de llegar el correo a la bandeja**: entrar en `script.google.com`, proyecto
  "Gestor - Correos", ver si el disparador de cada minuto sigue puesto.
- **Qué NO hay que hacer nunca**: crear un segundo proyecto de Vercel, y tocar a mano los ficheros de
  `_GESTOR` desde el explorador.
- **A quién llamar**: quién sabe de esto hoy.

Y lo más importante, en la primera línea: **los datos no están aquí. Están en el Dropbox del centro
y no dependen de ninguna de estas cuentas.** Eso es lo que hay que leer primero si alguien se
asusta.

### 2.2 `docs/LOS-DATOS-DEL-CENTRO.md` — para dirección

Una página, en lenguaje de persona, que conteste a tres preguntas:

**1. Qué ficheros con datos personales crea la aplicación y dónde los deja.** Sale tal cual del
informe, apartado 1.2, la lista de `_GESTOR`, la de `_GESTOR/datos` y la de Google Drive. Diciendo
de cada uno qué lleva dentro, en castellano: no "`asuntos.json`", sino "la ficha de cada gestión,
con el nombre de la persona, las notas escritas y el teléfono de contacto".

**2. Qué sale del centro y qué no.** Las tres listas del informe, tal cual:

- *Esto sale*: el programa a Vercel; los correos, sus adjuntos y el hilo en PDF a Google Drive; y los
  documentos de un asunto que se mandan por correo, copiados a Drive y borrados después (quedan 30
  días en la papelera de Drive).
- *Esto no sale*: ningún fichero de `_GESTOR`, ningún listado de personas, nada de lo que se hace en
  Séneca, y nada al abrir, buscar, archivar, registrar o imprimir.
- *Esto no se ha podido comprobar*: los registros de acceso de Vercel, y qué conserva Google y
  durante cuánto.

**3. Cuánto tiempo se guarda cada cosa.** La papelera de la aplicación avisa a los 30 días pero no
borra sola. Las copias de seguridad guardan las últimas 30 de cada fichero. La papelera de Google
Drive, unos 30 días. Decirlo claro, aunque no quede bonito.

Que la página termine diciendo qué falta por decidir: si la papelera debe vaciarse sola, y cada
cuánto.

## 3. Y una cosa que sí hay que hacer, no solo escribir

Poner a **una segunda persona del centro** como colaboradora en el repositorio y en el proyecto de
Vercel. No hace falta que sepa programar: hace falta que exista alguien más con la llave.

Eso lo hace Francisco desde la web, en dos minutos. Cuando esté, se apunta en `docs/LAS-CUENTAS.md`
quién es.

## 4. Cómo se comprueba

No hay prueba automática. Lo que sí hay que comprobar:

1. Que los dos documentos están **también en el Dropbox del centro**, no solo en el repositorio.
2. Que alguien que no sea Francisco los lee y entiende qué haría si él no estuviera. Ese es el único
   criterio que vale.
3. Que las direcciones y nombres de cuenta que aparecen son los de verdad, comprobados uno a uno.

## 5. Qué NO hay que hacer

- **No** escribir contraseñas en ninguno de los dos documentos, ni en el repositorio ni en el
  Dropbox. Dónde está cada cosa y quién tiene acceso, sí. Cómo entrar, no.
- **No** mover todavía el repositorio ni el dominio a cuentas del centro. Eso es una decisión de
  dirección, y hasta que se tome, lo que protege es el papel.
- **No** meter aquí el informe entero. Son dos páginas, no sesenta.

## 6. Cuánto es

Una hora los dos papeles. Dos minutos la segunda persona en el repositorio.
