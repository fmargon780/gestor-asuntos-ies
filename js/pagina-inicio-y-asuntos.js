/* Fila 560: pieza de la página (antes dentro de index.html, líneas 139-477). Escribe, en el mismo sitio donde
   estaba, el mismo HTML, mientras se carga la página (docs/560-PARTIR-FICHEROS-GRANDES.md). */
document.write(`<div id="aplicacion" class="oculto">

  <nav class="lateral">
    <div class="marca">Gestor de Asuntos</div>
    <button class="pestana activa" data-pantalla="abiertos"><span>Inicio</span><span class="cuenta" id="cuenta-abiertos"></span><span class="cuenta cuenta-roja oculto" id="cuenta-vencidos-inicio"></span></button>
    <button class="pestana pestana-encargo" data-pantalla="encargo-nuevo"><span>Nuevo encargo</span></button>
    <button class="pestana pestana-encargo" data-pantalla="encargos-mios"><span>Mis encargos</span></button>
    <button class="pestana" data-pantalla="nuevo"><span>Nuevo asunto</span></button>
    <button class="pestana" data-pantalla="archivo"><span>Archivo</span></button>
    <button class="pestana" data-pantalla="personas"><span>Personas y empresas</span></button>
    <!-- Fila 200, apartado 7 (docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md):
         js/barra.js inserta "Impresos" y "Cuentas" justo detrás del
         botón de "Personas y empresas" (referencia.parentNode.
         insertBefore(b, referencia.nextSibling)), así que puesto aquí
         "Herramientas" queda detrás de esos dos al cargar la página:
         Inicio · Nuevo asunto · Archivo · Personas y empresas ·
         Impresos · Cuentas · Herramientas, línea, Ajustes. -->
    <button class="pestana" data-pantalla="herramientas"><span>Herramientas</span></button>
    <div class="separador-lateral"></div>
    <button class="pestana" data-pantalla="ajustes"><span>Ajustes</span></button>
    <div class="lateral-pie">
      <div class="usuario" id="usuario-pie"></div>
    </div>
  </nav>

  <main class="contenido">

    <section id="pantalla-abiertos" class="pantalla">
      <header class="cabecera">
        <!-- Fila 353: el título se queda en la página (js/barra.js cuelga
             "+ Nuevo asunto" detrás) pero oculto a la vista: solo lectores. -->
        <h2 class="solo-lectores">Inicio</h2>
        <!-- El tablón compacto (fila 212, docs/INICIO-A-TODO-EL-ANCHO.md):
             en el hueco libre entre "+ Nuevo asunto" (lo cuelga js/barra.js
             justo detrás del <h2>) y el buscador. js/tablon.js cuelga
             #tablon aquí dentro. -->
        <div id="inicio-tablon-hueco" class="inicio-tablon-hueco"></div>
        <div class="acciones">
          <input id="buscar-abiertos" class="campo"
                 placeholder="Buscar en todos los asuntos abiertos: nombre, tipo o tercero">
        </div>
        <!-- Fila 353 (docs/INICIO-MAS-COMPACTO.md): "Ha llegado" (js/inicio.js)
             y el cuadro de avisos (js/avisos-linea.js) suben a la fila de la
             cabecera, detrás del buscador. Se esconden con la cabecera
             encogida (css/cabecera-fija.css). Antes (fila 212) eran una fila
             aparte debajo de la cabecera. -->
        <div id="inicio-fila-superior" class="inicio-fila-superior">
          <div id="inicio-ha-llegado-linea" class="inicio-ha-llegado-linea"></div>
          <div id="avisos-linea" class="oculto"></div>
        </div>
      </header>

      <!-- Elemento de compatibilidad, invisible a ojo (css/inicio.css):
           varias pruebas de pruebas/ siguen pulsando
           ".panel[data-vista=\\"clasificar\\"]" para abrir "Ver todo" con
           documentos y correos juntos (comportamiento de siempre, sin
           filtrar por uno solo). El botón grande de antes ha
           desaparecido de la vista; este sigue haciendo lo mismo. -->
      <button type="button" class="panel panel-legado-oculto" data-vista="clasificar"
              aria-hidden="true" tabindex="-1"></button>

      <!-- LA TABLA ÚNICA, A TODO EL ANCHO (fila 212, sobre la fila 209,
           docs/INICIO-EN-PESTANAS.md): fuera la columna izquierda de
           "Ha llegado" (ahora es la línea de arriba); las pestañas y la
           tabla única (#inicio-todos-asuntos) ocupan todo el ancho. -->
      <div id="inicio-cuerpo" class="inicio-cuerpo">
      <div id="inicio-derecha" class="inicio-derecha">

        <div id="inicio-todos-asuntos">
          <div class="inicio-tabla-cabecera">
            <!-- Las cuatro pestañas (fila 209, apartado 4): mismo patrón
                 que las de Ajustes (.pestana-ajustes), con un número y,
                 en "En Administración", el rojo de los vencidos. -->
            <div id="inicio-pestanas" class="inicio-pestanas" role="tablist">
              <button type="button" class="inicio-pestana" data-pestana="adm">En Administración
                <span class="cuenta cuenta-lista"></span>
                <span class="cuenta cuenta-roja oculto"></span></button>
              <button type="button" class="inicio-pestana" data-pestana="esp">En espera
                <span class="cuenta cuenta-lista"></span></button>
              <button type="button" class="inicio-pestana" data-pestana="todos">Todos los abiertos
                <span class="cuenta cuenta-lista"></span></button>
              <!-- Fila 249, docs/POR-LIQUIDAR.md: la quinta, solo si algún tipo
                   lleva «Hay que liquidarlo antes de archivar». -->
              <button type="button" class="inicio-pestana oculto" data-pestana="liq">Por liquidar
                <span class="cuenta cuenta-lista"></span></button>
            </div>
            <div class="inicio-tabla-cabecera-acciones">
              <span class="suave">(<span id="cuenta-lista-abiertos"></span>)</span>
              <button id="btn-recargar" class="boton">Actualizar</button>
              <button type="button" id="btn-filtros" class="boton" aria-expanded="false"
                      aria-controls="filtros-abiertos">Filtros</button>
              <span class="exportar-envoltorio" id="exportar-envoltorio">
                <button type="button" id="btn-exportar" class="boton" aria-haspopup="true"
                        aria-expanded="false">Exportar ▾</button>
                <span id="exportar-menu" class="exportar-menu oculto">
                  <button type="button" id="btn-exportar-hoja">Hoja de cálculo</button>
                  <button type="button" id="btn-exportar-pdf">Informe en PDF</button>
                </span>
              </span>
            </div>
          </div>

          <!-- Los desplegables viven aquí, plegados. Sueltos en la barra
               se salían de linea y las etiquetas acababan lejos de su
               campo. Los seis valen igual en las cuatro pestañas (fila
               216, docs/FILTROS-EN-TODAS-LAS-PESTANAS.md). -->
          <div id="filtros-abiertos" class="filtros oculto">
            <label class="filtro">
              <span class="filtro-rotulo">Responsable</span>
              <select id="inicio-me-toca-responsable" class="campo"><option value="">Todos</option></select>
            </label>
            <label class="filtro">
              <span class="filtro-rotulo">Situación</span>
              <select id="filtro-estado" class="campo">
                <option value="">Todos</option>
              </select>
            </label>
            <label class="filtro">
              <span class="filtro-rotulo">Plazo</span>
              <select id="filtro-plazo" class="campo">
                <option value="">Todos los plazos</option>
                <option value="vencidos">Solo los vencidos</option>
                <option value="pronto">Vencidos y de esta semana</option>
                <option value="conplazo">Solo los que tienen plazo</option>
                <option value="sinplazo">Solo los que no tienen plazo</option>
              </select>
            </label>
            <label class="filtro">
              <span class="filtro-rotulo">Lo encarga</span>
              <select id="filtro-organo" class="campo">
                <option value="">Todos</option>
                <option value="SECRETARIA">Secretaría</option>
                <option value="DIRECCION">Dirección</option>
                <option value="JEFATURA">Jefatura de Estudios</option>
                <option value="VARIOS">Varios</option>
                <option value="SIN">Sin asignar</option>
              </select>
            </label>
            <label class="filtro">
              <span class="filtro-rotulo">Tipo de asunto</span>
              <select id="filtro-tipo-asunto" class="campo">
                <option value="">Todos</option>
              </select>
            </label>
            <div class="filtro filtro-fechas" id="filtro-fechas">
              <span class="filtro-rotulo">Fechas</span>
              <span class="filtro-fechas-par">
                <label class="filtro-fecha"><span class="filtro-fecha-rotulo">Desde</span>
                  <input type="date" id="filtro-fecha-desde" class="campo" aria-label="Fechas: desde"></label>
                <label class="filtro-fecha"><span class="filtro-fecha-rotulo">Hasta</span>
                  <input type="date" id="filtro-fecha-hasta" class="campo" aria-label="Fechas: hasta"></label>
              </span>
            </div>
            <!-- Fila 368: solo sale si la persona ha movido alguna columna (js/inicio-columnas.js). -->
            <button type="button" id="restablecer-columnas" class="enlace oculto">Restablecer columnas</button>
          </div>

          <!-- El chip "Filtrado por…" (fila 209, apartado 7): sale al
               pulsar un aviso de la franja de arriba que lleve asuntos
               detrás (js/avisos-linea.js → InicioTabla.filtrarPorAviso). -->
          <div id="inicio-filtrado-por" class="oculto">
            Filtrado por: <span id="inicio-filtrado-por-texto"></span>
            <button type="button" id="inicio-quitar-filtro">✕ Quitar</button>
          </div>

          <!-- Fila 249: en «Por liquidar», el total de lo marcado y el botón «Liquidar». -->
          <div id="inicio-liquidar-barra" class="inicio-liquidar-barra oculto">
            <span id="inicio-liquidar-marcados" class="inicio-liquidar-marcados"></span>
            <button type="button" id="inicio-liquidar-boton" class="boton boton-principal" disabled>Liquidar</button>
          </div>

          <div class="inicio-tabla-envoltorio">
            <table class="inicio-tabla">
              <thead id="inicio-thead-normal">
                <tr>
                  <th data-col="plazo">Plazo</th><th data-col="tercero">Tercero</th><th data-col="tipo">Tipo</th>
                  <th data-col="hito">Hito actual</th><th data-col="quien">Le toca a</th><th data-col="inicio">Inicio</th><th></th>
                </tr>
              </thead>
              <thead id="inicio-thead-liquidar" class="oculto"></thead>
              <tbody id="inicio-tabla-cuerpo"></tbody>
            </table>
          </div>
        </div>

      </div>
      </div><!-- /#inicio-cuerpo -->

      <!-- "Ver todo" (el panel de "clasificar" reaprovechado) activa esto
           con App.irVista('clasificar'), reutilizando #zona-clasificar
           TAL CUAL (mismo contenido interno de siempre), con un
           "← Volver" nuevo para no depender de los botones ocultos. -->
      <div id="zona-clasificar" class="oculto">
        <div class="sueltos-cabecera">
          <button type="button" id="btn-ha-llegado-volver" class="boton boton-volver">← Volver a Inicio</button>
          <!-- Fila 212: si se llega desde "N correos" o "N documentos por
               clasificar" (js/inicio.js), App.irVista deja aquí el enlace
               para ver también lo otro (App.pintarSoloQueClasificar). -->
          <button type="button" id="sueltos-ver-tambien" class="enlace oculto"></button>
          <p class="explica">Documentos sueltos en la carpeta de asuntos abiertos, todavía sin
             carpeta propia. Aquí es donde aparece lo que os deja el equipo directivo.</p>
          <button id="btn-sueltos-visto" class="boton oculto">Ya los he visto</button>
          <span class="marca-nueva oculto" id="nuevos-sueltos"></span>
        </div>

        <!-- La bandeja de correos (js/bandeja-correos.js, js/bandeja-pantalla.js),
             plegada detrás de esta barra y siempre arrancando así (fila 27,
             17-sep-2026, docs/CORREOS-DENTRO-DE-POR-CLASIFICAR.md). Los dos
             elementos nacen aquí, ya no los crea JavaScript. -->
        <!-- Fila 289: los encargos de los directivos, arriba (js/encargos-llegada.js). -->
        <div id="zona-encargos" class="oculto"></div>

        <div id="correos-sin-clasificar" class="oculto">
          <button type="button" id="btn-correos-sin-clasificar" class="boton" aria-expanded="false">
            Correos sin clasificar (<span id="cuenta-correos-sin-clasificar">0</span>)
          </button>
          <div id="bandeja-correos" class="oculto"></div>
        </div>

        <div id="lista-sueltos" class="lista"></div>
      </div>

    </section>

    <section id="pantalla-asunto" class="pantalla oculto">
      <div id="ficha-asunto-cuerpo"></div>
    </section>

    <section id="pantalla-nuevo" class="pantalla oculto">
      <!-- Fila 629 (docs/629-NUEVO-ASUNTO-MAS-SIMPLE.md): el título «Nuevo asunto» no se ve (el nombre ya está en el menú); el h2 se queda, escondido, porque js/usabilidad.js cuelga de él el «← Volver» de la cabecera. -->
      <header class="cabecera cabecera-nuevo"><h2 class="titulo-escondido">Nuevo asunto</h2></header>

      <div id="aviso-pendiente" class="aviso aviso-ambar oculto"></div>

      <div class="formulario">
        <!-- Fila 629: fijos solo la fecha de inicio, el tipo y el tercero, en una fila de tres recuadros. -->
        <div class="nuevo-tres-recuadros">
          <div id="bloque-fecha" class="recuadro-nuevo recuadro-fecha">
            <label class="recuadro-titulo" for="campo-fecha">Fecha de inicio</label>
            <div class="recuadro-cuerpo"><input id="campo-fecha" type="date" class="campo"></div>
          </div>

          <div id="bloque-tipos" class="recuadro-nuevo">
            <div class="recuadro-titulo">Qué tipo de asunto</div>
            <div class="recuadro-cuerpo">
              <div id="tercero-propuesto-nuevo" class="aviso-en-vivo oculto"></div>
              <button type="button" id="guia-resumen-nuevo" class="guia-resumen oculto"></button>
              <div id="guia-nuevo" class="oculto"></div>
              <div id="tipo-linea-nuevo" class="oculto"></div>   <!-- fila 257: js/tipo-en-linea.js -->
              <div class="tipos" id="tipos-lista"></div>
              <p class="nota">¿Falta un tipo? Créalo con «+ Crear tipo nuevo», aquí mismo, o ve a
                 <button type="button" class="enlace" id="ir-a-ajustes">Ajustes</button>
                 para completar su guía, sus campos y sus plantillas.</p>
            </div>
          </div>

          <div id="bloque-tercero" class="recuadro-nuevo">
            <div class="recuadro-titulo" id="etiqueta-tercero">Tercero</div>
            <div class="recuadro-cuerpo">
              <p class="nota oculto" id="categorias-admite"></p>   <!-- fila 493: «TIPO admite: Otros · Administraciones.» -->
              <div class="categorias" id="categorias-lista"></div>
              <input id="buscar-tercero" class="campo" placeholder="Escribe dos letras del nombre">
              <button type="button" class="enlace" id="btn-grupo-nuevo">Es para un grupo de personas</button>   <!-- fila 293: js/asunto-de-grupo.js -->
              <div id="actividad-nuevo-caja" class="oculto"></div>   <!-- fila 306: js/actividades-formulario.js -->
              <div id="resultados-tercero" class="resultados"></div>
              <div id="tercero-elegido" class="elegido oculto"></div>
            </div>
          </div>
        </div>

        <div id="bloque-detalles">
          <!-- Fila 629: «Datos del asunto», a todo el ancho. Solo sale con tipo y tercero elegidos y si el tipo pide algo.
               Los cinco datos de siempre (año académico, descripción corta, fecha límite, quién lo pide, por qué vía)
               se enseñan solo en los tipos que los pidan al crear (js/asuntos-nuevo-datos-fijos.js); si no se enseñan,
               se guardan igualmente con lo que valgan por sí solos (el curso en marcha, el plazo de la guía). -->
          <div id="bloque-campos" class="recuadro-nuevo oculto">
            <div class="recuadro-titulo">Datos del asunto</div>
            <div class="recuadro-cuerpo">
              <div id="datos-fijos-nuevo" class="campos-lista datos-fijos-nuevo">
                <div class="campo-fila oculto" id="dato-nuevo-curso">
                  <label class="etiqueta" for="campo-curso">Año académico</label>
                  <input id="campo-curso" class="campo" placeholder="26-27">
                </div>
                <div class="campo-fila oculto" id="dato-nuevo-descripcion">
                  <label class="etiqueta" for="campo-descripcion">Descripción corta</label>
                  <input id="campo-descripcion" class="campo" placeholder="Por ejemplo: Cambio de optativa">
                </div>
                <div class="campo-fila oculto" id="dato-nuevo-limite">
                  <label class="etiqueta" for="campo-limite">Fecha límite</label>
                  <input id="campo-limite" type="date" class="campo">
                  <p id="nota-limite" class="nota oculto"></p>
                </div>
                <div class="campo-fila oculto" id="grupo-lopide">
                  <div id="lopide-caja-nuevo" class="lopide-nuevo"></div>
                </div>
              </div>
              <div id="campos-lista-nuevo" class="campos-lista"></div>
            </div>
          </div>

          <div class="vista-previa vista-previa-nuevo">
            <div id="vista-nombre" class="vista-nombre oculto"></div>
            <div id="vista-ruta" class="vista-ruta oculto"></div>
          </div>

          <button id="btn-crear" class="boton boton-principal boton-ancho">Crear el asunto</button>
        </div>
      </div>
    </section>

    <section id="pantalla-archivo" class="pantalla oculto">
      <header class="cabecera">
        <h2>Archivo</h2>
        <div class="acciones">
          <input id="buscar-archivo" class="campo" placeholder="Buscar en todo el archivo">
          <!-- Fila 177 (docs/ARCHIVO-POR-CURSO-Y-RUTAS.md, punto 1): el
               índice del ARCHIVO está partido por curso académico; este
               selector elige cuál se lee (o todos a la vez). Las
               opciones las rellena js/archivo-personas.js con los
               cursos que de verdad hay en el resumen guardado. -->
          <select id="selector-curso-archivo" class="campo" style="width:auto" aria-label="Curso"></select>
        </div>
      </header>
      <p class="explica" id="explica-archivo">Leyendo el archivo…</p>
      <div id="lista-archivo" class="lista"></div>
    </section>

    <section id="pantalla-personas" class="pantalla oculto">
      <header class="cabecera">
        <h2>Personas y empresas</h2>
        <div class="acciones">
          <select id="filtro-personas" class="campo"><!-- las categorías las pone Nombres.opcionesCategorias --></select>
          <input id="buscar-personas" class="campo" placeholder="Escribe un nombre">
        </div>
      </header>
      <p id="personas-aviso-aspirantes" class="explica oculto">Cuando tengas su Nº de identificación escolar, escríbelo en su ficha. Sus carpetas cambian de nombre solas.</p>
      <div class="dos-paneles">
        <div id="lista-personas" class="lista"></div>
        <div id="ficha-persona" class="ficha"><p class="explica">Elige a alguien de la lista para ver su ficha.</p></div>
      </div>
    </section>

    <!-- Fila 200, apartado 7 (docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md):
         la pestaña "Herramientas": lo que se usa de vez en cuando, no
         un ajuste de verdad. Cuatro bloques que vivían en
         Ajustes → Mantenimiento. Los pinta App.pintarHerramientas
         (js/herramientas.js), cada vez que se entra en esta pantalla. -->
`);
