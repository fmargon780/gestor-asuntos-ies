# Poner en marcha el botón de soporte (para Francisco, una sola vez)

El botón «Soporte» del Gestor ya está en la aplicación, pero no llega a ningún sitio hasta que
pones en marcha su buzón. Son cinco pasos, unos diez minutos. No hace falta tocar código.

**Qué hace el buzón:** cuando alguien envía un aviso, el buzón lo guarda entero en tu Drive
(carpeta `SOPORTE-AVISOS`) y apunta una IDEA nueva en la cola de la app, **sin** el texto ni la
captura (el repositorio es público). Tú ves la IDEA en el Centro de mando y abres el aviso
completo con su enlace.

## 1. Crear el permiso de GitHub

1. Entra en https://github.com/settings/personal-access-tokens/new (con tu cuenta `fmargon780`).
2. Nombre: `Soporte del Gestor`. Caducidad: la más larga que te deje (un año).
3. «Repository access» → «Only select repositories» → elige **todos** los repositorios de la lista
   del buzón (están en `REPOS_PERMITIDOS`, arriba de `apps-script/soporte.gs`): `gestor-asuntos-ies`,
   `bd-alumnado-ies`, `ausencias-guardias-ies`, `normativa-escolarizacion`,
   `migracion-dropbox-drive`, `Disciplina-IES`, `club-tolox-corre`, `comparador-listas`,
   `Partituras-de-Caja-Clara`, `Cancionero-Parroquia`, `Parroquia_Conteo_Colectas` y
   `ERP-Nutricion`. (El buzón ya acepta avisos de todos; cada app los manda cuando tenga su botón.)
4. «Permissions» → «Repository permissions» → **Contents: Read and write**. Nada más.
5. «Generate token» y **copia el texto que empieza por `github_pat_`**. Solo se enseña una vez.

## 2. Crear el proyecto en Google

1. Entra en https://script.google.com con la cuenta **`g.educaand.es`** (los avisos pueden traer
   datos del alumnado, así que es la cuenta buena).
2. «Nuevo proyecto» y ponle de nombre **`Gestor - Soporte`**.
3. Abre el fichero de código (`Código.gs`), borra todo lo que tenga y pega el contenido entero de
   `apps-script/soporte.gs` (está en el repositorio). Guarda.
4. En la rueda de la izquierda, «Configuración del proyecto» → abajo, «Propiedades de la
   secuencia de comandos» → «Añadir propiedad»: nombre **`GITHUB_TOKEN`**, valor: el texto
   `github_pat_…` del paso 1. Guarda.
5. Arriba, elige la función **`prepararTodo`** y pulsa «Ejecutar». Google pedirá permisos (Drive,
   conexión externa y enviar correo): autorízalos. Al terminar, en «Registro de ejecución» sale
   «Carpeta de avisos lista», una línea por cada repositorio («Bien: …», «Sin cola: …» o «OJO: …») y
   un resumen. Los que digan **«OJO»** son los repositorios a los que le falta permiso al paso 1
   (añádelos al permiso en GitHub). «Sin cola» quiere decir que el permiso llega pero ese repositorio
   aún no tiene su lista de tareas: no es un problema. Te llega también un correo de prueba con el
   mismo resumen.

## 3. Publicarlo como aplicación web

1. «Implementar» → «Nueva implementación» → tipo «Aplicación web».
2. «Ejecutar como»: **Yo**. «Quién tiene acceso»: **Cualquier usuario**.
3. «Implementar» y copia la dirección que termina en `/exec`.

**Si la cuenta `g.educaand.es` no te deja elegir «Cualquier usuario»** (lo bloquea la Consejería),
repite los pasos 2 y 3 con tu cuenta personal `fjmarmolejoglez@gmail.com`. Funciona igual; solo
cambia dónde queda la carpeta `SOPORTE-AVISOS` (en el Drive de esa cuenta). Apunta aquí cuál has
usado: ______________.

## 4. Decirle al Gestor dónde está el buzón

1. En el Gestor: Ajustes → El centro → **Buzón de soporte**.
2. Pega la dirección `/exec` en «Dirección del buzón de soporte» y sal del campo. Sale «Dirección
   del buzón de soporte guardada». Vale para los dos ordenadores.

## 5. Probarlo

1. Pulsa el botón «Soporte» (abajo a la derecha), elige «Propongo una mejora», escribe «Prueba del
   buzón» y envía. Tiene que salir «Recibido. Gracias».
2. En tu Drive, `SOPORTE-AVISOS` → `Gestor de Asuntos`: el aviso, en un fichero de texto.
3. En el Centro de mando, una IDEA nueva «Aviso de usuario: mejora en «…»».

Si el paso 1 dice que no se ha podido contactar con el buzón, revisa la dirección; si dice que el
buzón no ha contestado bien, casi seguro que en el paso 3 no elegiste «Cualquier usuario».

## Cuando cambie el script

Si alguna vez se cambia `apps-script/soporte.gs`, hay que:

1. Pegarlo otra vez en el proyecto (borrando antes todo el contenido del fichero de código) y guardar.
2. Ejecutar **`prepararTodo`**, autorizar el permiso nuevo si lo pide (el de correo) y leer el
   registro: los repositorios con «OJO» son los que le faltan al permiso de GitHub.
3. «Implementar» → «Administrar implementaciones» → lápiz → «Nueva versión» (la dirección `/exec`
   no cambia).

**Si un aviso se guarda en Drive pero no sale en el Centro de mando,** te llega un correo (como mucho
uno por app y día) con el motivo y el enlace al aviso; no lleva el texto de quien lo escribió.
