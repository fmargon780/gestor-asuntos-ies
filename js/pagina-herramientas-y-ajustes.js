/* Fila 560: pieza de la página (antes dentro de index.html, líneas 478-824). Escribe, en el mismo sitio donde
   estaba, el mismo HTML, mientras se carga la página (docs/560-PARTIR-FICHEROS-GRANDES.md). */
document.write(`    <section id="pantalla-herramientas" class="pantalla oculto">
      <header class="cabecera"><h2>Herramientas</h2></header>

      <div id="control-registro-vista" class="oculto"></div>
      <div id="plantillas-vista" class="oculto"></div>
      <div id="actividades-vista" class="oculto"></div>
      <div id="etiquetas-vista" class="oculto"></div>

      <div id="herramientas-lista">

      <!-- Fila 259 (docs/CONTROL-DEL-REGISTRO.md): el control del registro de entrada y de salida.
           La vista a todo el ancho (#control-registro-vista) la pinta js/control-registro-pantalla.js
           y sustituye a esta lista mientras está abierta. -->
      <details class="bloque-ajustes" id="bloque-control-registro">
        <summary>
          <span class="bloque-titulo">Control del registro</span>
          <span class="bloque-pie">Los apuntes del registro de entrada y de salida de Séneca que no están en ningún asunto</span>
        </summary>
        <div class="bloque-cuerpo">
          <p class="explica">Sube los dos listados de Séneca y mira qué apuntes no tienen asunto.</p>
          <button type="button" class="boton" id="control-registro-abrir" data-solo-lectura>Abrir el control del registro</button>
        </div>
      </details>

      <!-- Fila 310 (docs/ACTIVIDADES-EXTRAESCOLARES-PANTALLA.md): todas las actividades extraescolares. La vista a todo el ancho
           (#actividades-vista) la pinta js/actividades-pantalla.js y sustituye a esta lista mientras está abierta. -->
      <details class="bloque-ajustes" id="bloque-actividades">
        <summary>
          <span class="bloque-titulo">Actividades extraescolares</span>
          <span class="bloque-pie">Todas las actividades del centro, con su alumnado y su profesorado, y las de cursos anteriores</span>
        </summary>
        <div class="bloque-cuerpo">
          <p class="explica" id="actividades-resumen"></p>
          <button type="button" class="boton" id="actividades-abrir" data-solo-lectura>Abrir</button>
        </div>
      </details>

      <!-- Fila 344 (docs/ETIQUETAS.md): imprimir etiquetas. La vista a todo el ancho (#etiquetas-vista) la pinta
           js/etiquetas-pantalla.js y sustituye a esta lista mientras está abierta. -->
      <details class="bloque-ajustes" id="bloque-etiquetas">
        <summary>
          <span class="bloque-titulo">Etiquetas</span>
          <span class="bloque-pie">Sobres, carpetas, exámenes o carnés: elige a quién, la hoja de etiquetas y qué lleva cada una</span>
        </summary>
        <div class="bloque-cuerpo">
          <p class="explica">Para alumnado o personal, con los modelos de hoja más corrientes y diseños propios.</p>
          <button type="button" class="boton" id="etiquetas-abrir" data-solo-lectura>Abrir las etiquetas</button>
        </div>
      </details>

      <!-- Fila 320 (docs/PANTALLA-DE-PLANTILLAS.md): todas las plantillas de Word y de correo. La vista a todo el ancho
           (#plantillas-vista) la pinta js/plantillas-pantalla.js y sustituye a esta lista mientras está abierta. -->
      <details class="bloque-ajustes" id="bloque-plantillas">
        <summary>
          <span class="bloque-titulo">Plantillas</span>
          <span class="bloque-pie">Todas las plantillas de Word y de correo del centro, y qué hitos las usan</span>
        </summary>
        <div class="bloque-cuerpo">
          <p class="explica" id="plantillas-resumen"></p>
          <button type="button" class="boton" id="plantillas-abrir" data-solo-lectura>Abrir las plantillas</button>
        </div>
      </details>

      <details class="bloque-ajustes" id="bloque-papelera">
        <summary>
          <span class="bloque-titulo">Papelera</span>
          <span class="bloque-pie">Lo borrado se guarda aquí hasta que se vacía solo, a los 90 días</span>
        </summary>
        <div class="bloque-cuerpo">
      <div class="papelera-buscador">
        <input id="buscar-papelera" class="campo" placeholder="Buscar en la papelera">
        <span id="cuenta-papelera" class="suave"></span>
      </div>
      <div id="aviso-papelera-vieja" class="aviso aviso-ambar oculto"></div>
      <div id="tabla-papelera" class="lista"></div>
      <details class="papelera-borrados" id="papelera-borrados">
        <summary id="papelera-borrados-titulo">Borrados del todo (0)</summary>
        <p class="explica">Solo el rastro de lo que se borró del todo (a mano o solo, al cumplirse el
           plazo); el contenido no se guarda.</p>
        <div class="papelera-buscador">
          <input id="buscar-borrados" class="campo" placeholder="Buscar en lo borrado del todo">
          <span id="cuenta-borrados" class="suave"></span>
        </div>
        <div id="tabla-borrados" class="lista"></div>
        <button type="button" class="boton boton-peligro" id="btn-vaciar-registro">Vaciar el registro</button>
      </details>
        </div>
      </details>

      <!-- "Traer el alumnado": dos botones que viven hoy en dos ficheros
           distintos (js/traer-datos.js, el de Séneca; js/alumnado-bd.js,
           el de la BD de alumnado), bajo un solo título; cada uno mete
           su fila en su propio hueco de aquí dentro. -->
      <details class="bloque-ajustes" id="bloque-traer-alumnado">
        <summary>
          <span class="bloque-titulo">Traer el alumnado</span>
          <span class="bloque-pie">Ficheros de Séneca y datos de la base de datos de alumnado</span>
        </summary>
        <div class="bloque-cuerpo">
      <div id="herramientas-lo-que-tengo"></div>
      <div id="herramientas-traer-seneca"></div>
      <div id="herramientas-traer-alumnado-bd"></div>
        </div>
      </details>

      <!-- "Tablas de datos": js/tablas-datos-pantalla.js crea aquí dentro
           su propio <details id="bloque-tablas-datos"> la primera vez
           que pinta (fila 110, docs/TABLAS-DE-DATOS.md). -->
      <div id="herramientas-tablas-datos-hueco"></div>

      <!-- "Restaurar una copia de seguridad": es el bloque "Copias de
           seguridad" de siempre (#tabla-copias, App.pintarCopias), solo
           que aquí sin su párrafo largo (que se ha quedado en El centro,
           junto con la caducidad) y con el título cambiado, porque
           "Copias de seguridad" ya nombra la sección de El centro
           (docs/HISTORIA.md, fila 200, explica por qué). -->
      <details class="bloque-ajustes" id="bloque-restaurar-copia">
        <summary>
          <span class="bloque-titulo">Restaurar una copia de seguridad</span>
          <span class="bloque-pie">Por si algún fichero compartido se estropea</span>
        </summary>
        <div class="bloque-cuerpo">
      <p class="explica">De cada fichero compartido, la última copia guardada (como mucho las
         últimas 30 de cada uno). El texto sobre cómo y cuándo se guardan, y la caducidad, están
         en Ajustes → El centro → Copias de seguridad.</p>
      <div id="tabla-copias" class="lista"></div>
        </div>
      </details>

      <!-- Fila 288 (docs/AJUSTES-EN-CUATRO-PESTANAS.md): las reparaciones que se usan muy de vez en
           cuando, que vivían en Ajustes → Mantenimiento. Sus módulos las cuelgan donde siempre;
           js/ajustes-reparto.js las trae aquí. -->
      <div id="herramientas-puesta-a-punto" class="herramientas-puesta">
        <h3 class="herramientas-puesta-titulo">Puesta a punto y reparaciones</h3>
        <p class="explica">Botones que se pulsan muy de vez en cuando.</p>
        <div id="herramientas-puesta-cuerpo"></div>
      </div>

      </div>
    </section>

    <section id="pantalla-ajustes" class="pantalla oculto">
      <header class="cabecera"><h2>Ajustes</h2></header>

      <div class="ajustes-barra">
        <div id="pestanas-ajustes" class="pestanas-ajustes" role="tablist">
          <button type="button" class="pestana-ajustes activa" data-ajustes-pestana="dia">Lo de cada día</button>
          <button type="button" class="pestana-ajustes" data-ajustes-pestana="centro">El centro</button>
          <button type="button" class="pestana-ajustes" data-ajustes-pestana="ordenador">Este ordenador</button>
          <button type="button" class="pestana-ajustes" data-ajustes-pestana="problemas">Problemas<span id="problemas-punto" class="problemas-punto oculto" aria-hidden="true"></span></button>
        </div>
        <input id="ajustes-buscar" class="campo ajustes-buscar" type="search" autocomplete="off" placeholder="Buscar en Ajustes…" aria-label="Buscar en Ajustes">
      </div>
      <div id="ajustes-resultados" class="ajustes-resultados oculto"></div>
      <p id="ajustes-linea-pestana" class="explica ajustes-linea"></p>

      <div id="ajustes-tab-dia" class="ajustes-tab">
      <div id="ajustes-tab-tipos" class="ajustes-tipos" data-fijo="1">
      <h3 class="ajustes-titulo-tipos">Tipos de asunto</h3>
      <p class="explica">Esta lista la comparten todos los ordenadores del centro:
         se guarda en la carpeta <code>_GESTOR</code>, dentro de la carpeta de asuntos abiertos.
         La lista de partida es una propuesta; cámbiala a vuestro gusto.
         Los días de plazo de cada tipo sirven para poner sola la fecha límite de los asuntos nuevos.
         Pulsa una tarjeta para entrar en todo lo suyo: campos, hitos, plantillas, plazo y recurrencia.</p>
      <div class="tipos-cabecera">
        <div id="pestanas-tipos" class="pestanas-categoria" role="tablist"></div>
        <input id="buscar-tipos" class="campo buscar-tipos"
               placeholder="Buscar o crear: busca un tipo; si no está, lo creas desde aquí">
      </div>
      <div id="tipos-buscando-info" class="suave tipos-buscando-info oculto"></div>
      <div id="tabla-tipos" class="rejilla-tipos"></div>
      <div id="crear-tipo-zona" class="crear-o-buscar-zona"></div>
      </div>
      </div>

      <div id="ajustes-tab-centro" class="ajustes-tab oculto">

      <!-- Fila 129 (docs/EL-HITO-ES-EL-ESTADO.md): la rejilla "Estados del asunto"
           ya no existe: el estado del asunto es su hito actual. -->

      <!-- Fila 200, apartado 6 (docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md):
           "Asuntos dormidos" y "Avisos de vencimiento" (que vivía en
           Mantenimiento) juntos en una sola sección; sus dos campos
           (#dias-dormido, #avisos-dias) siguen tal cual por dentro. -->
      <details class="bloque-ajustes" id="bloque-dias-aviso">
        <summary>
          <span class="bloque-titulo">Días de aviso</span>
          <span class="bloque-pie">Cuándo avisar de asuntos dormidos y de lo que está por vencer</span>
        </summary>
        <div class="bloque-cuerpo">
      <p class="explica">Un asunto abierto en el que no se ha escrito una nota, ni se ha cambiado
         de estado, ni se ha editado la ficha en todos estos días sale en el bloque "Dormidos" de
         "Qué me toca". Es de todo el centro: vale igual en los dos ordenadores.</p>
      <div class="alta-tipo">
        <label class="etiqueta-en-linea" for="dias-dormido">Avisar a partir de</label>
        <input id="dias-dormido" type="number" min="1" class="campo campo-plazo">
        <span class="suave">días</span>
      </div>
      <p class="explica">Al abrir la aplicación sale un aviso arriba con lo que ha vencido
         y lo que está a punto de vencer. Aquí eliges con cuánta antelación quieres el aviso.
         Esto es solo de este ordenador.</p>
      <div class="alta-tipo">
        <label class="etiqueta-en-linea" for="avisos-dias">Avisar con</label>
        <input id="avisos-dias" type="number" min="0" class="campo campo-plazo">
        <span class="suave">días de antelación (solo en este ordenador)</span>
      </div>
      <p class="explica">La papelera se vacía sola: lo que lleva en ella más de estos días se borra
         del todo, y antes se avisa en Inicio. Es de todo el centro.</p>
      <div class="alta-tipo">
        <label class="etiqueta-en-linea" for="dias-papelera">La papelera se vacía a los</label>
        <input id="dias-papelera" type="number" min="1" class="campo campo-plazo">
        <span class="suave">días</span>
      </div>
      <div class="alta-tipo">
        <label class="etiqueta-en-linea" for="dias-aviso-papelera">Avisar</label>
        <input id="dias-aviso-papelera" type="number" min="0" class="campo campo-plazo">
        <span class="suave">días antes</span>
      </div>
      <p class="explica">El control del registro (Herramientas) avisa en Inicio cuando hace más de estos
         días que no se suben los listados de Séneca. Es de todo el centro.</p>
      <div class="alta-tipo">
        <label class="etiqueta-en-linea" for="dias-registro">Registro de Séneca sin revisar:</label>
        <input id="dias-registro" type="number" min="1" class="campo campo-plazo">
        <span class="suave">días</span>
      </div>
        </div>
      </details>

      <!-- Fila 200, apartado 6: "Caducidad de las copias" y el texto
           explicativo de "Copias de seguridad" (que vivía en
           Mantenimiento) juntos aquí. La lista con los botones de
           restaurar se ha ido entera a Herramientas → "Restaurar una
           copia de seguridad" (decisión de diseño explicada en
           docs/HISTORIA.md, fila 200). -->
      <details class="bloque-ajustes" id="bloque-copias">
        <summary>
          <span class="bloque-titulo">Copias de seguridad</span>
          <span class="bloque-pie">Una copia diaria de cada fichero compartido, y cuándo se borran solas</span>
        </summary>
        <div class="bloque-cuerpo">
      <p class="explica">Antes de escribir cualquiera de los ficheros que se comparten con el
         resto de ordenadores, la aplicación guarda una copia de cómo estaba, una vez al día.
         Se guardan en <code>_GESTOR/copias</code>: como mucho las últimas 30 de cada uno. Si
         algún fichero se estropea, al entrar la aplicación lo dice y ofrece restaurar la
         última copia; para restaurar una copia, ve a Herramientas → Restaurar una copia de
         seguridad.</p>
      <div class="alta-tipo">
        <label class="etiqueta-en-linea" for="dias-caducidad-copias">Borrar las de más de</label>
        <input id="dias-caducidad-copias" type="number" min="1" class="campo campo-plazo">
        <span class="suave">días</span>
      </div>
      <p class="explica"><button type="button" class="enlace ajustes-enlace-salto" id="copias-enlace-restaurar">Restaurar una copia</button></p>
        </div>
      </details>

      <details class="bloque-ajustes" id="bloque-tipos-documento">
        <summary>
          <span class="bloque-titulo">Tipos de documento</span>
          <span class="bloque-pie">Los que salen al nombrar un documento dentro de un asunto</span>
        </summary>
        <div class="bloque-cuerpo">
      <p class="explica">Son los que salen al cambiar el nombre de un documento dentro de
         la carpeta de un asunto. También se comparten entre los ordenadores.</p>
      <div class="tipos-cabecera">
        <input id="buscar-tipos-doc" class="campo buscar-tipos"
               placeholder="Buscar o crear: busca un tipo; si no está, lo creas desde aquí">
      </div>
      <div id="tabla-tipos-documento" class="rejilla-tipos"></div>
      <div id="crear-tipo-doc-zona" class="crear-o-buscar-zona"></div>
        </div>
      </details>

      <details class="bloque-ajustes" id="bloque-grupos-personas">
        <summary>
          <span class="bloque-titulo">Grupos de personas</span>
          <span class="bloque-pie">Listas con nombre para relacionar de golpe o mandar un correo a varios</span>
        </summary>
        <div class="bloque-cuerpo">
      <p class="explica">Un grupo es una lista de personas con un nombre: "equipo directivo",
         "tutores de 1º"... Se monta una vez y se usa muchas, tanto para relacionar de golpe con
         un asunto como para poner los destinatarios de un correo (siempre en copia oculta).
         Esta lista se comparte con el resto de ordenadores del centro.</p>
      <div class="alta-tipo">
        <button id="btn-anadir-grupo" class="boton">+ Crear un grupo</button>
      </div>
      <div id="tabla-grupos-personas" class="lista"></div>
        </div>
      </details>

      <details class="bloque-ajustes" id="bloque-ficheros-datos">
        <summary>
          <span class="bloque-titulo">Ficheros de datos</span>
          <span class="bloque-pie">Qué CSV hay cargados y qué columnas se reconocen</span>
        </summary>
        <div class="bloque-cuerpo">
      <p class="explica">Van en <code>_GESTOR/datos</code>, dentro de la carpeta de asuntos abiertos.</p>
      <div id="estado-datos" class="lista"></div>
        </div>
      </details>

      <details class="bloque-ajustes" id="bloque-abreviar-grupos">
        <summary>
          <span class="bloque-titulo">Cómo se abrevia cada grupo</span>
          <span class="bloque-pie">Cómo queda escrito el grupo del alumno en el nombre</span>
        </summary>
        <div class="bloque-cuerpo">
      <p class="explica">Cuando pides que el nombre del asunto lleve el grupo del alumno,
         se escribe abreviado. Aquí tienes, grupo por grupo, lo que trae Séneca y lo que
         escribe la aplicación. Si alguno no te cuadra, dímelo.</p>
      <div id="tabla-grupos" class="lista"></div>
        </div>
      </details>

      <details class="bloque-ajustes" id="bloque-datos-centro">
        <summary>
          <span class="bloque-titulo">Datos del centro y firma</span>
          <span class="bloque-pie">Lo que rellena los campos variables de correos y documentos</span>
        </summary>
        <div class="bloque-cuerpo" id="centro-firma-cuerpo">
      <label class="etiqueta">Firma</label>
      <textarea id="plantillas-firma" class="campo" rows="3"></textarea>
      <div class="dos-columnas">
        <div><label class="etiqueta">Nombre del centro</label>
          <input id="plantillas-centro" class="campo"></div>
        <div><label class="etiqueta">Cargo de quien firma</label>
          <input id="plantillas-cargo" class="campo" placeholder="Director, Secretario…"></div>
      </div>
      <div class="dos-columnas">
        <div><label class="etiqueta">Localidad</label>
          <input id="plantillas-localidad" class="campo"></div>
        <div><label class="etiqueta">Código del centro</label>
          <input id="plantillas-codigo" class="campo"></div>
      </div>
      <!-- Fila 84, 20-sep-2026, docs/FORMULARIOS-CON-LOS-DATOS-DEL-CENTRO.md:
           para el hueco {{PROVINCIA}} de un impreso oficial. -->
      <label class="etiqueta">Provincia</label>
      <input id="plantillas-provincia" class="campo">
      <label class="etiqueta">Dirección del centro</label>
      <input id="plantillas-direccion" class="campo">
      <!-- Fila 79, 20-sep-2026, docs/BIBLIOTECA-DE-HITOS.md, apartado 4.7:
           el enlace de una referencia de normativa de un hito se monta
           contra esta dirección. Vacío, las citas se ven sin enlace. -->
      <label class="etiqueta">Dirección del sistema de normativa</label>
      <input id="plantillas-direccion-normativa" class="campo" placeholder="https://normativa.fmargon.com">
      <button type="button" class="boton" id="plantillas-guardar-firma">Guardar firma y centro</button>
        </div>
      </details>

      <details class="bloque-ajustes" id="bloque-asunto-extracto">
        <summary>
          <span class="bloque-titulo">Asunto y extracto</span>
          <span class="bloque-pie">Cómo se escribe el asunto de los correos y mensajes de Séneca, y el extracto del registro</span>
        </summary>
        <div class="bloque-cuerpo" id="asunto-extracto-cuerpo"></div>
      </details>
`);
