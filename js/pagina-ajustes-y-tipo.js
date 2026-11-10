/* Fila 560: pieza de la página (antes dentro de index.html, líneas 825-1033). Escribe, en el mismo sitio donde
   estaba, el mismo HTML, mientras se carga la página (docs/560-PARTIR-FICHEROS-GRANDES.md). */
document.write(`
      <!-- Fila 81, 20-sep-2026, docs/FIRMANTES-Y-MEMBRETE.md: los
           cargos del centro y quién los ha ocupado, con fechas. Las
           tarjetas se pintan solas, con js/cargos-ajustes.js. -->
      <details class="bloque-ajustes" id="bloque-cargos">
        <summary>
          <span class="bloque-titulo">Cargos del centro</span>
          <span class="bloque-pie">Quién firma cada documento, según la fecha</span>
        </summary>
        <div class="bloque-cuerpo">
      <p class="explica">Cada cargo lleva quién lo ha ocupado, con sus fechas. Al generar un
         documento, la firma la pone quien ocupaba el cargo <strong>en la fecha del
         documento</strong>, no quien lo ocupe hoy.</p>
      <div id="cargos-lista" class="lista"></div>
        </div>
      </details>

      <!-- Fila 149, 25-sep-2026, docs/MEMBRETE-LETRA-DEL-MANUAL.md: el
           membrete lo dibuja la aplicación (js/membrete.js) con el manual
           de la Junta; aquí, la Consejería, el nombre del centro y el logo. -->
      <details class="bloque-ajustes" id="bloque-membrete">
        <summary>
          <span class="bloque-titulo">Membrete</span>
          <span class="bloque-pie">Lo de arriba de cada documento: la Consejería, el centro y su logo</span>
        </summary>
        <div class="bloque-cuerpo">
      <p class="explica">El símbolo y «Junta de Andalucía» salen solos, con la letra del manual de
         la Junta. Aquí se escribe lo demás.</p>
      <label class="etiqueta">Consejería</label>
      <input id="membrete-consejeria" class="campo" placeholder="Consejería de Educación">
      <label class="etiqueta" style="margin-top:10px">Nombre del centro <span class="suave">(el mismo de «Datos del centro y firma»; sale en mayúsculas)</span></label>
      <input id="membrete-centro" class="campo" placeholder="IES Fuente Lucena">
      <label class="etiqueta" style="margin-top:10px">Logo del centro <span class="suave">(opcional; cada plantilla dice si lo lleva)</span></label>
      <div id="membrete-logo-estado" class="suave" style="margin-bottom:6px"></div>
      <button type="button" class="boton" id="membrete-elegir-logo">Subir el logo (PNG o JPG)</button>
      <button type="button" class="boton boton-peligro oculto" id="membrete-quitar-logo">Borrar el logo</button>
      <div><button type="button" class="boton" id="membrete-guardar" style="margin-top:10px">Guardar</button></div>
      <p class="nota">Vista previa (cambia mientras escribes; se guarda con «Guardar»):</p>
      <div id="membrete-vista-previa"></div>
        </div>
      </details>

      <!-- Fila 57, 18-sep-2026, docs/HUECO-PARA-SELLO-Y-FIRMA.md: las
           dos medidas que usa "Ajustar tamaño" (antes "Preparar el
           documento", fila 58). Las lee y las guarda js/ajustes-centro.js. -->
      <details class="bloque-ajustes" id="bloque-sello">
        <summary>
          <span class="bloque-titulo">Sello y firma en el papel</span>
          <span class="bloque-pie">Cuánto hueco dejar libre para el sello de Séneca y para la firma</span>
        </summary>
        <div class="bloque-cuerpo">
      <p class="explica">El botón "Ajustar tamaño" encoge un PDF para dejar libres estas dos
         bandas, de lado a lado de la hoja. Cada tipo de asunto dice si lleva sello, si lleva firma,
         o las dos cosas (en su propia pantalla, dentro de "Datos del tipo").</p>
      <div class="dos-columnas">
        <div><label class="etiqueta">Banda para el sello de registro (arriba)</label>
          <input id="margen-sello" type="number" min="0" max="6" step="0.1" class="campo campo-plazo"></div>
        <div><label class="etiqueta">Banda para la firma (abajo)</label>
          <input id="margen-firma" type="number" min="0" max="6" step="0.1" class="campo campo-plazo"></div>
      </div>
      <p class="nota">En centímetros, con un decimal. Entre 0 y 6 cm cada una.</p>
        </div>
      </details>

      <!-- Fila 84, 20-sep-2026, docs/FORMULARIOS-CON-LOS-DATOS-DEL-CENTRO.md:
           el mapa de casillas de cada impreso con PDF. Lo pinta y lo
           guarda js/formularios-rellenar.js. -->
      <details class="bloque-ajustes" id="bloque-impresos">
        <summary>
          <span class="bloque-titulo">Impresos</span>
          <span class="bloque-pie">Qué casilla de cada PDF recibe qué dato del centro</span>
        </summary>
        <div class="bloque-cuerpo">
      <p class="explica">Solo se rellenan los datos del centro y el año académico: los de la
         persona los sigue escribiendo ella, a propósito, para poder comprobar al recibir el
         impreso si alguno ha cambiado. Al pulsar "Leer las casillas del PDF" la primera vez, la
         aplicación propone sola un hueco para cada casilla, mirando su nombre; confírmalo o
         cámbialo aquí.</p>
      <div id="tabla-impresos-oficiales" class="lista"></div>
        </div>
      </details>

      <!-- Fila 288: una sola sección para el alumnado y el personal. Lleva dentro (js/ajustes-reparto.js
           las trae) «Ficheros de datos», «Aviso de fichero de alumnado viejo» y «Cómo se abrevia cada grupo». -->
      <details class="bloque-ajustes" id="bloque-alumnado-personal">
        <summary>
          <span class="bloque-titulo">Alumnado y personal</span>
          <span class="bloque-pie">Los ficheros de Séneca, cuándo avisar de que están viejos y cómo se abrevia cada grupo</span>
        </summary>
        <div class="bloque-cuerpo" id="alumnado-personal-cuerpo">
          <p class="explica">
            <button type="button" class="enlace ajustes-enlace-salto" id="alumnado-enlace-traer">Traer el alumnado</button> ·
            <button type="button" class="enlace ajustes-enlace-salto" id="alumnado-enlace-carpeta-bd">Carpeta de la base de datos de alumnado</button>
          </p>
        </div>
      </details>

      <!-- Fila 528 (docs/528-LISTA-DE-CAMPOS.md): la lista única de campos; la pinta js/campos-lista-pantalla.js. -->
      <details class="bloque-ajustes" id="bloque-lista-campos">
        <summary>
          <span class="bloque-titulo">Campos</span>
          <span class="bloque-pie">Todos los datos que se pueden usar en las plantillas, de dónde sale cada uno y dónde se usa</span>
        </summary>
        <div class="bloque-cuerpo" id="lista-campos-cuerpo"></div>
      </details>

      </div>

      <div id="ajustes-tab-ordenador" class="ajustes-tab oculto"></div>

      <div id="ajustes-tab-problemas" class="ajustes-tab oculto">
        <div id="problemas-todo-bien" class="aviso aviso-bueno oculto" data-fijo="1">Todo en orden. No hay nada que arreglar.</div>
      </div>

      <!-- Fila 288: sitio de paso donde los módulos cuelgan sus bloques; js/ajustes-reparto.js los lleva a su pestaña. No se ve. -->
      <div id="ajustes-tab-mantenimiento" class="ajustes-montaje oculto" hidden>

      <!-- Fila 200, apartado 6: "Avisos de vencimiento" (su campo
           #avisos-dias) se ha ido a El centro → "Días de aviso". -->

      <details class="bloque-ajustes" id="bloque-carpetas">
        <summary>
          <span class="bloque-titulo">Carpetas de este ordenador</span>
          <span class="bloque-pie">Las dos carpetas señaladas aquí</span>
        </summary>
        <div class="bloque-cuerpo">
      <div id="estado-carpetas" class="lista"></div>
      <!-- Fila 455: la carpeta de entrada de documentos sueltos (js/entrada-ajustes.js). -->
      <div id="entrada-ajustes" class="lista"></div>
      <!-- Fila 458: «Pasar a Drive» (js/pasar-a-drive-ajustes.js). -->
      <div id="pasar-a-drive-ajustes" class="lista"></div>
      <button id="btn-olvidar" class="boton">Volver a elegir las carpetas</button>
      <!-- Fila 260: la misma casilla que en la pantalla de entrada. Al cambiarla, la aplicación se recarga. -->
      <label class="interruptor solo-consulta-casilla" style="margin-top:12px">
        <input type="checkbox" id="ajustes-solo-consulta">
        <span>En este ordenador, solo consultar</span>
      </label>
      <p class="nota">La aplicación no guardará nada en las carpetas. Para cuando este ordenador trabaja sobre una copia.</p>
        </div>
      </details>

      <!-- El ayudante de Séneca (fila 47, docs/DESTINATARIOS-EN-SENECA.md):
           un enlace-marcador que Francisco arrastra una vez a la barra de
           marcadores. Lo pinta js/seneca-ayudante.js dentro de este hueco. -->
      <details class="bloque-ajustes" id="bloque-seneca">
        <summary>
          <span class="bloque-titulo">El ayudante de Séneca</span>
          <span class="bloque-pie">Un marcador que mete los destinatarios en Séneca uno a uno</span>
        </summary>
        <div class="bloque-cuerpo">
      <div id="ayudante-seneca-ajustes"></div>
        </div>
      </details>

      <!-- Fila 200, apartado 6 y 7: "Copias de seguridad" se ha partido:
           su párrafo explicativo se ha ido a El centro → "Copias de
           seguridad" (junto con la caducidad); la lista con los botones
           de restaurar (#tabla-copias) se ha ido entera a Herramientas
           → "Restaurar una copia de seguridad". -->

      <!-- fila 77, docs/DETALLES-DE-MANTENIMIENTO.md, punto 3: los
           tipos, estados, tipos de documento y recurrentes que se
           borran ya no desaparecen del todo (así el otro ordenador no
           los resucita); se quedan aquí, fuera de la vista, hasta que
           se quiten del todo pasados 90 días. Lo pinta
           js/borrados-fusion.js. -->
      <details class="bloque-ajustes" id="bloque-borrados-fusion">
        <summary>
          <span class="bloque-titulo">Borrados que se fusionan</span>
          <span class="bloque-pie">Lo que borraste, recordado un tiempo para que no reaparezca solo</span>
        </summary>
        <div class="bloque-cuerpo">
      <p class="explica">Cuando borras un tipo de asunto, un estado, un tipo de documento o un asunto que se
         repite, la aplicación se acuerda de que lo borraste, durante un tiempo. Así, si el otro ordenador
         todavía lo tenía abierto, no lo trae de vuelta al guardar. Aquí ves cuántos recuerdos hay de cada
         cosa. Al quitar los de hace más de 90 días, la aplicación los olvida del todo, sin vuelta atrás;
         lo que usas hoy no cambia.</p>
      <div id="tabla-borrados-fusion" class="lista"></div>
        </div>
      </details>

      <!-- Fila 200, apartado 7: "Papelera" se ha ido entera a
           Herramientas. -->

      </div>
    </section>

    <!-- La pantalla propia de un tipo de asunto (17-sep-2026, fila 39,
         docs/AJUSTES-POR-TIPO.md): pantalla entera, no cuadro emergente,
         con las siete secciones del tipo a la vista. La pinta entera
         js/ajustes-tipo.js, dentro de las dos columnas de aquí abajo. -->
    <section id="pantalla-tipo-asunto" class="pantalla oculto">
      <header class="cabecera">
        <h2 id="tipo-asunto-nombre"></h2>
        <span class="marca-categoria" id="tipo-asunto-categoria"></span>
      </header>
      <!-- Fila 198, apartado 1: la lista de comprobación, siempre
           visible encima de las secciones. La pinta js/ajustes-tipo-
           comprobacion.js. -->
      <div id="tipo-asunto-comprobacion"></div>
      <div id="tipo-asunto-cuerpo" class="tipo-asunto-columnas">
        <div class="tipo-asunto-columna" id="tipo-asunto-col-1"></div>
        <div class="tipo-asunto-columna" id="tipo-asunto-col-2"></div>
      </div>
    </section>

  </main>

</div>
`);
