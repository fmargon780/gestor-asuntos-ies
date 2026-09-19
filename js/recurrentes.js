/* ============================================================
   recurrentes.js — los asuntos que se repiten.

   Hay gestiones que vuelven cada mes, cada trimestre o cada curso: la
   misma factura del mismo proveedor, el mismo parte, la misma revisión.
   Aquí se apuntan una vez y la aplicación avisa cuando toca.

   Las carpetas NO se crean solas. La aplicación dice "toca crear esto"
   y hasta que no se pulsa el botón no se crea nada: crear carpetas en
   silencio en un Dropbox compartido llenaría el sitio de carpetas
   vacías que nadie ha pedido.

   Se cuelga de window.Gestor y no toca app.js.
   ============================================================ */
(function () {

  var FICHERO = 'recurrentes.json';

  /* Cada cuánto vuelve un asunto. El día se guarda aparte. */
  var PERIODOS = [
    { clave: 'mensual',    texto: 'Cada mes' },
    { clave: 'trimestral', texto: 'Cada tres meses' },
    { clave: 'anual',      texto: 'Una vez al año' }
  ];

  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
               'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  var lista = [];
  var yaLeido = false;

  function $(id) { return document.getElementById(id); }

  function textoPeriodo(clave) {
    for (var i = 0; i < PERIODOS.length; i++) {
      if (PERIODOS[i].clave === clave) return PERIODOS[i].texto;
    }
    return clave || '';
  }

  /* ---------- las cuentas de cuándo toca ----------

     Cada recurrente guarda la última vez que se creó. A partir de ahí
     se calcula el siguiente. Si nunca se ha creado, el siguiente es el
     primero que caiga desde hoy hacia delante. */

  function fechaIso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
           '-' + String(d.getDate()).padStart(2, '0');
  }

  function deIso(iso) {
    var p = String(iso || '').split('-');
    if (p.length !== 3) return null;
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return isNaN(d.getTime()) ? null : d;
  }

  /* El día del mes que toca, sin salirse del mes: si alguien pide el 31
     y el mes tiene 30, se queda en el 30. */
  function conDia(ano, mes, dia) {
    var ultimo = new Date(ano, mes + 1, 0).getDate();
    return new Date(ano, mes, Math.min(dia || 1, ultimo));
  }

  function saltoEnMeses(periodo) {
    if (periodo === 'mensual') return 1;
    if (periodo === 'trimestral') return 3;
    return 12;
  }

  /* La próxima fecha en que toca crear este asunto. */
  function proxima(r) {
    var dia = parseInt(r.dia, 10) || 1;
    var hoy = new Date();
    hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    var desde = deIso(r.ultima);
    if (desde) {
      /* Ya se creó alguna vez: el siguiente sale de sumar el periodo. */
      var f = conDia(desde.getFullYear(), desde.getMonth() + saltoEnMeses(r.periodo), dia);
      if (r.periodo === 'anual' && r.mes) {
        f = conDia(desde.getFullYear() + 1, parseInt(r.mes, 10) - 1, dia);
      }
      return f;
    }

    /* Nunca se ha creado: la primera vez que caiga de hoy en adelante. */
    if (r.periodo === 'anual') {
      var mes = (parseInt(r.mes, 10) || 1) - 1;
      var f1 = conDia(hoy.getFullYear(), mes, dia);
      if (f1 < hoy) f1 = conDia(hoy.getFullYear() + 1, mes, dia);
      return f1;
    }
    var f2 = conDia(hoy.getFullYear(), hoy.getMonth(), dia);
    if (f2 < hoy) f2 = conDia(hoy.getFullYear(), hoy.getMonth() + saltoEnMeses(r.periodo), dia);
    return f2;
  }

  /* Los que ya tocan hoy o antes. */
  function pendientes() {
    var hoy = new Date();
    hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return lista.filter(function (r) {
      if (r.parado) return false;
      var f = proxima(r);
      return f && f <= hoy;
    });
  }

  /* ---------- guardar y leer la lista ---------- */

  async function cargar() {
    var g = window.Gestor.carpetaGestor();
    if (!g) return;
    try {
      var leido = await Carpetas.leerJson(g, FICHERO);
      lista = (leido && leido.length) ? leido : [];
    } catch (e) {
      lista = [];
      U.aviso('No he podido leer los asuntos que se repiten: ' + e.message, 'malo');
    }
  }

  async function guardar() {
    var g = window.Gestor.carpetaGestor();
    if (!g) return;
    lista = await App.fusionarConDisco(FICHERO, lista, function (r) { return r.id; });
    await Copias.guardar(g, FICHERO, lista);
  }

  /* ---------- crear el asunto que toca ---------- */

  /* El nombre se monta igual que los demás: la fecha del día en que se
     crea, el tipo, el año académico si el recurrente lo lleva, el texto
     libre y el tercero al final. */
  function nombreDe(r, fecha) {
    return Nombres.montar({
      fecha: fecha,
      tipo: r.tipo,
      curso: r.curso || U.cursoDeFecha(fecha),
      grupo: '',
      descripcion: r.descripcion || '',
      tercero: r.tercero
    });
  }

  async function crearUno(r) {
    var hoy = U.hoyIso();
    var nombre = nombreDe(r, hoy);
    if (!nombre) throw new Error('el nombre sale vacío');

    var abiertos = window.Gestor.carpetaAbiertos();
    if (await Carpetas.existe(abiertos, nombre)) {
      throw new Error('ya hay un asunto abierto con ese nombre');
    }
    await Carpetas.crear(abiertos, nombre);

    var ficha = {
      estado: 'abierto', tipo: r.tipo, categoria: r.categoria,
      tercero: r.tercero, curso: r.curso || U.cursoDeFecha(hoy),
      grupo: '', descripcion: r.descripcion || '',
      situacion: '', via: '', viaDato: '',
      recurrente: r.id,
      abiertoEl: U.ahora(), abiertoPor: window.Gestor.usuario()
    };
    if (r.plazo) ficha.limite = Plazos.sumarDias(hoy, r.plazo);
    await window.Gestor.anotar(nombre, ficha);

    r.ultima = hoy;
    return nombre;
  }

  async function crearLosQueTocan() {
    var toca = pendientes();
    if (!toca.length) return;

    var hechos = 0, fallos = [];
    for (var i = 0; i < toca.length; i++) {
      try {
        await crearUno(toca[i]);
        hechos++;
      } catch (e) {
        fallos.push(toca[i].tipo + ' ' + toca[i].tercero + ': ' + e.message);
      }
    }
    await guardar();
    await window.Gestor.recargar();
    pintarPanel();
    pintarTabla();

    if (fallos.length) {
      U.aviso('Creados ' + hechos + '. No se han podido crear ' + fallos.length + '.', 'malo');
    } else {
      U.aviso(hechos === 1 ? 'Asunto creado.' : hechos + ' asuntos creados.', 'bueno');
    }
  }

  /* ---------- el panel de la pantalla de asuntos ---------- */

  function pintarPanel() {
    var caja = $('panel-recurrentes');
    if (!caja) return;
    var toca = pendientes();
    if (!toca.length) {
      caja.classList.add('oculto');
      caja.innerHTML = '';
      return;
    }

    caja.className = 'aviso aviso-ambar';
    caja.innerHTML = '<strong>Toca crear ' +
      (toca.length === 1 ? '1 asunto que se repite' : toca.length + ' asuntos que se repiten') +
      '.</strong><ul class="recurrentes-lista">' +
      toca.map(function (r) {
        return '<li>' + U.escapar(r.tipo + '  ·  ' + r.tercero +
               (r.descripcion ? '  ·  ' + r.descripcion : '')) + '</li>';
      }).join('') + '</ul>';

    var botones = document.createElement('div');
    botones.className = 'avisos-botones';

    var b = document.createElement('button');
    b.className = 'boton boton-principal';
    b.textContent = toca.length === 1 ? 'Crear el asunto' : 'Crear los ' + toca.length;
    b.onclick = function () { b.disabled = true; crearLosQueTocan(); };
    botones.appendChild(b);

    var ver = document.createElement('button');
    ver.className = 'boton';
    ver.textContent = 'Ver la lista en Ajustes';
    ver.onclick = function () {
      var pestana = document.querySelector('.pestana[data-pantalla="ajustes"]');
      if (pestana) pestana.click();
    };
    botones.appendChild(ver);

    caja.appendChild(botones);
    caja.classList.remove('oculto');
  }

  /* ---------- la tabla de Ajustes ----------

     `filaDeRecurrente` es la misma fila tanto para esta tabla (que ya
     no tiene sitio en el HTML, pero se deja funcionando por si algún
     módulo la sigue llamando) como para la lista filtrada por tipo que
     pinta la sección "Se repite" de la pantalla de un tipo (17-sep-
     2026, fila 39, js/ajustes-tipo.js): una sola función, para no
     acabar con dos filas que hacen lo mismo. `alRefrescar` son las
     funciones a llamar después de parar/quitar uno, además de
     `pintarPanel` (que siempre hay que refrescar). */

  function filaDeRecurrente(r, alRefrescar) {
    var f = document.createElement('div');
    f.className = 'fila-tipo';

    var cuando = proxima(r);
    var pie = textoPeriodo(r.periodo) +
      (r.periodo === 'anual' && r.mes ? ' en ' + MESES[parseInt(r.mes, 10) - 1] : '') +
      ', día ' + (r.dia || 1) +
      '  ·  siguiente: ' + (cuando ? Plazos.legible(fechaIso(cuando)) : '—') +
      (r.ultima ? '  ·  última vez: ' + Plazos.legible(r.ultima) : '  ·  nunca creado');

    f.innerHTML = '<span class="nombre-tipo">' +
      U.escapar(r.tipo + '  ·  ' + r.tercero) + '</span>' +
      '<span class="suave recurrente-pie">' + U.escapar(pie) + '</span>';

    function refrescarTodo() {
      pintarPanel();
      (alRefrescar || []).forEach(function (fn) { fn(); });
    }

    var parar = document.createElement('button');
    parar.className = 'boton' + (r.parado ? '' : ' boton-marcado');
    parar.textContent = r.parado ? 'Parado' : 'Activo';
    parar.title = r.parado ? 'Volver a activarlo' : 'Dejarlo en pausa sin borrarlo';
    parar.onclick = async function () {
      r.parado = !r.parado;
      await guardar();
      refrescarTodo();
    };
    f.appendChild(parar);

    var quitar = document.createElement('button');
    quitar.className = 'boton boton-peligro';
    quitar.textContent = 'Quitar';
    quitar.onclick = async function () {
      var ok = await U.preguntar('Quitar el asunto recurrente',
        '<p>Se quita <strong>' + U.escapar(r.tipo + ' · ' + r.tercero) + '</strong> ' +
        'de la lista de los que se repiten.</p>' +
        '<p class="nota">Las carpetas que ya se crearon no se tocan.</p>', 'Quitar');
      if (!ok) return;
      lista = lista.filter(function (x) { return x.id !== r.id; });
      await guardar();
      refrescarTodo();
      U.aviso('Quitado de la lista.', 'bueno');
    };
    f.appendChild(quitar);

    return f;
  }

  function pintarTabla() {
    var caja = $('tabla-recurrentes');
    if (!caja) return;
    caja.innerHTML = '';
    if (!lista.length) {
      caja.innerHTML = '<div class="vacio">Todavía no hay ningún asunto recurrente.</div>';
      return;
    }
    lista.forEach(function (r) { caja.appendChild(filaDeRecurrente(r, [pintarTabla])); });
  }

  /* ---------- la sección "Se repite" de la pantalla de un tipo ----------

     Solo las filas de ESE tipo, más un botón para añadir uno nuevo ya
     con el tipo puesto (17-sep-2026, fila 39). Varias filas si son
     varios terceros, como pide la ficha del encargo. */
  function pintarEnContenedor(contenedor, filtroTipo) {
    if (!contenedor) return;
    var deEsteTipo = lista.filter(function (r) { return r.tipo === filtroTipo; });

    var caja = document.createElement('div');
    caja.className = 'lista';
    if (!deEsteTipo.length) {
      caja.innerHTML = '<div class="vacio">Todavía no se repite ningún asunto de este tipo.</div>';
    } else {
      deEsteTipo.forEach(function (r) {
        caja.appendChild(filaDeRecurrente(r, [function () { pintarEnContenedor(contenedor, filtroTipo); }]));
      });
    }

    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'boton';
    boton.style.marginTop = '8px';
    boton.textContent = '+ Añadir uno';
    boton.onclick = function () {
      alta(filtroTipo, function () { pintarEnContenedor(contenedor, filtroTipo); });
    };

    contenedor.innerHTML = '';
    contenedor.appendChild(caja);
    contenedor.appendChild(boton);
  }

  /* ---------- alta de un recurrente ---------- */

  /* `tipoPreset`: desde la sección "Se repite" de la pantalla de un
     tipo (js/ajustes-tipo.js) se abre ya con ese tipo elegido, para no
     tener que buscarlo en el desplegable. `alGuardar` se llama además
     de `pintarTabla`/`pintarPanel` cuando se guarda, para que esa
     sección se repinte con la fila nueva. */
  async function alta(tipoPreset, alGuardar) {
    var tipos = window.Gestor.tipos();
    if (!tipos.length) {
      U.aviso('Primero hacen falta tipos de asunto, aquí mismo en Ajustes.', 'malo');
      return;
    }

    var opciones = '';
    Nombres.CATEGORIAS.forEach(function (cat) {
      var deEsta = tipos.filter(function (t) { return t.categoria === cat; });
      if (!deEsta.length) return;
      opciones += '<optgroup label="' + cat + '">' +
        deEsta.map(function (t) {
          return '<option value="' + U.escapar(t.tipo) + '">' + U.escapar(t.tipo) + '</option>';
        }).join('') + '</optgroup>';
    });

    var meses = MESES.map(function (m, i) {
      return '<option value="' + (i + 1) + '">' + m + '</option>';
    }).join('');

    var promesa = U.preguntar('Asunto que se repite',
      '<p class="explica">La aplicación avisará cuando toque. La carpeta no se crea ' +
      'sola: se crea cuando pulses el botón del aviso.</p>' +
      '<label class="etiqueta">Tipo de asunto</label>' +
      '<select id="rec-tipo" class="campo">' + opciones + '</select>' +
      '<label class="etiqueta">Tercero</label>' +
      '<input id="rec-tercero" class="campo" placeholder="Tal cual va al final del nombre">' +
      '<label class="etiqueta">Descripción corta <span class="suave">(opcional)</span></label>' +
      '<input id="rec-descripcion" class="campo">' +
      '<div class="dos-columnas">' +
        '<div><label class="etiqueta">Cada cuánto</label>' +
        '<select id="rec-periodo" class="campo">' +
        PERIODOS.map(function (p) {
          return '<option value="' + p.clave + '">' + p.texto + '</option>';
        }).join('') + '</select></div>' +
        '<div><label class="etiqueta">Día del mes</label>' +
        '<input id="rec-dia" type="number" min="1" max="31" class="campo" value="1"></div>' +
      '</div>' +
      '<div id="rec-bloque-mes" class="oculto">' +
        '<label class="etiqueta">Mes</label>' +
        '<select id="rec-mes" class="campo">' + meses + '</select>' +
      '</div>' +
      '<label class="etiqueta">Días de plazo <span class="suave">(opcional)</span></label>' +
      '<input id="rec-plazo" type="number" min="0" class="campo" placeholder="En blanco, sin fecha límite">' +
      '<div class="vista-previa">' +
        '<div class="vista-rotulo">Se llamará, si se creara hoy</div>' +
        '<div id="rec-vista" class="vista-nombre"></div>' +
      '</div>', 'Guardar');

    function refrescar() {
      var esAnual = $('rec-periodo').value === 'anual';
      $('rec-bloque-mes').classList.toggle('oculto', !esAnual);
      $('rec-vista').textContent = nombreDe({
        tipo: $('rec-tipo').value,
        tercero: $('rec-tercero').value.trim(),
        descripcion: $('rec-descripcion').value.trim()
      }, U.hoyIso());
    }

    if (tipoPreset && tipos.some(function (t) { return t.tipo === tipoPreset; })) {
      $('rec-tipo').value = tipoPreset;
    }

    ['rec-tipo', 'rec-tercero', 'rec-descripcion', 'rec-periodo']
      .forEach(function (id) { $(id).oninput = refrescar; $(id).onchange = refrescar; });
    refrescar();

    var ok = await promesa;
    if (!ok) return;

    var tercero = U.limpiarNombre($('rec-tercero').value);
    if (!tercero) { U.aviso('Hace falta el tercero: va siempre al final del nombre.', 'malo'); return; }

    var tipo = $('rec-tipo').value;
    var plazo = parseInt($('rec-plazo').value, 10);

    lista.push({
      id: 'r' + Date.now(),
      tipo: tipo,
      categoria: Nombres.categoriaDeTipo(tipos, tipo),
      tercero: tercero,
      descripcion: $('rec-descripcion').value.trim(),
      periodo: $('rec-periodo').value,
      dia: parseInt($('rec-dia').value, 10) || 1,
      mes: $('rec-periodo').value === 'anual' ? parseInt($('rec-mes').value, 10) : null,
      plazo: (!isNaN(plazo) && plazo > 0) ? plazo : null,
      ultima: '',
      parado: false
    });

    await guardar();
    pintarTabla();
    pintarPanel();
    if (typeof alGuardar === 'function') alGuardar();
    U.aviso('Asunto recurrente guardado.', 'bueno');
  }

  /* ---------- arranque ---------- */

  async function arrancar() {
    if (!window.Gestor || !window.Gestor.carpetaGestor()) return;
    yaLeido = true;
    await cargar();
    pintarTabla();
    pintarPanel();
  }

  function enganchar() {
    if (!window.Gestor) return;
    var boton = $('btn-anadir-recurrente');
    if (boton) boton.onclick = function () { alta(); };

    /* La primera vez que la aplicación pinta la lista de asuntos ya hay
       carpetas abiertas, que es cuando se puede leer _GESTOR. */
    window.Gestor.alRefrescar.push(function () {
      if (!yaLeido && window.Gestor.carpetaGestor()) arrancar();
      else pintarPanel();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enganchar);
  } else {
    enganchar();
  }

  /* Público, para la sección "Se repite" de la pantalla de un tipo
     (17-sep-2026, fila 39, js/ajustes-tipo.js). */
  window.Recurrentes = {
    pintarEnContenedor: pintarEnContenedor,
    alta: alta,
    /* para pruebas/recurrentes.mjs (fila 69, docs/PRUEBAS-QUE-FALTAN.md, 2.3) */
    _cargar: cargar,
    _pendientes: pendientes,
    _crearLosQueTocan: crearLosQueTocan
  };
})();
