/* ============================================================
   campos-calculados-editor.js — crear y cambiar un campo calculado
   (fila 56, 18-sep-2026, docs/CAMPOS-CATALOGO-Y-CALCULADOS.md, 6).

   Vive dentro del panel de js/campos-catalogo.js (pestaña
   Calculados), no en un cuadro aparte: solo hay un `U.preguntar` y ya
   está ocupado por la pantalla del tipo si acaso, así que este
   formulario se pinta directo en el hueco que le pasan.

   La vista previa se prueba con una persona de verdad de la primera
   categoría marcada (`Datos.cargar`); "Probar con otro" pasa a la
   siguiente que traiga algo en el origen elegido.
   ============================================================ */
var CamposCalculadosEditor = (function () {

  var CATEGORIAS = ['ALUMNADO', 'PERSONAL', 'EMPRESAS', 'OTROS'];
  var ETIQUETA_OPERACION = {
    quitarFinal: 'Quitar los últimos caracteres', quitarInicio: 'Quitar los primeros caracteres',
    partir: 'Partir por un signo', equivalencias: 'Tabla de equivalencias',
    juntar: 'Juntar dos campos', deFecha: 'Sacar un dato de una fecha'
  };

  function $(raiz, id) { return raiz.querySelector('#' + id); }

  function abrir(caja, ctx) {
    var existente = ctx.existente;
    /* Estado del formulario, siempre en memoria hasta que se guarda. */
    var estado = existente
      ? {
          nombre: existente.nombre || '', categorias: (existente.categorias || []).slice(),
          origen: existente.origen || { clase: 'grupo' },
          operacion: existente.operacion || 'quitarFinal',
          parametros: Object.assign({}, existente.parametros || {})
        }
      : {
          nombre: '', categorias: [], origen: { clase: 'grupo' },
          operacion: 'quitarFinal', parametros: { n: 1, soloSiEsLetra: true }
        };
    var personaPrueba = null;
    var candidatosProbados = 0;

    function categoriaPrincipal() { return estado.categorias[0] || CATEGORIAS[0]; }

    async function columnasDeCategoria(categoria) {
      try {
        var r = App.E.datos ? await Datos.cargar(App.E.datos, categoria) : null;
        return (r && r.cabecera) || (window.Datos && Datos.LISTAS[categoria] && Datos.LISTAS[categoria].cabecera) || [];
      } catch (e) { return []; }
    }

    function calculadosDisponibles() {
      return (App.E.campos.calculados || []).filter(function (c) { return !existente || c.id !== existente.id; });
    }

    async function pintar() {
      var columnas = await columnasDeCategoria(categoriaPrincipal());
      caja.innerHTML =
        '<div class="campos-calc-form">' +
          '<label class="etiqueta" style="margin-top:0">Nombre del campo</label>' +
          '<input id="calc-nombre" class="campo" value="' + U.escapar(estado.nombre) + '">' +
          '<div id="calc-nombre-aviso" class="nota"></div>' +

          '<label class="etiqueta">Vale para</label>' +
          '<div class="campos-calc-categorias">' + CATEGORIAS.map(function (cat) {
            return '<label class="interruptor interruptor-fila"><input type="checkbox" data-cat="' + cat + '"' +
              (estado.categorias.indexOf(cat) !== -1 ? ' checked' : '') + '><span>' + cat + '</span></label>';
          }).join('') + '</div>' +

          '<label class="etiqueta">De dónde sale</label>' +
          '<select id="calc-origen-clase" class="campo">' +
            '<option value="grupo"' + (estado.origen.clase === 'grupo' ? ' selected' : '') + '>El grupo (forma compacta)</option>' +
            '<option value="columna"' + (estado.origen.clase === 'columna' ? ' selected' : '') + '>Una columna de la ficha</option>' +
            '<option value="calculado"' + (estado.origen.clase === 'calculado' ? ' selected' : '') + '>Otro campo calculado</option>' +
          '</select>' +
          (estado.origen.clase === 'columna'
            ? '<select id="calc-origen-columna" class="campo">' + columnas.map(function (col) {
                return '<option value="' + U.escapar(col) + '"' + (estado.origen.columna === col ? ' selected' : '') + '>' + U.escapar(col) + '</option>';
              }).join('') + '</select>'
            : '') +
          (estado.origen.clase === 'calculado'
            ? '<select id="calc-origen-calculado" class="campo">' + calculadosDisponibles().map(function (c) {
                return '<option value="' + c.id + '"' + (estado.origen.id === c.id ? ' selected' : '') + '>' + U.escapar(c.nombre) + '</option>';
              }).join('') + '</select>'
            : '') +

          '<label class="etiqueta">Qué le hago</label>' +
          '<select id="calc-operacion" class="campo">' + Object.keys(ETIQUETA_OPERACION).map(function (op) {
            return '<option value="' + op + '"' + (estado.operacion === op ? ' selected' : '') + '>' + ETIQUETA_OPERACION[op] + '</option>';
          }).join('') + '</select>' +
          '<div id="calc-parametros"></div>' +

          '<div class="vista-previa" id="calc-preview" style="margin-top:14px"></div>' +

          '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">' +
            '<button type="button" class="boton" id="calc-cancelar">Cancelar</button>' +
            '<button type="button" class="boton boton-principal" id="calc-guardar">' +
              (existente && existente.id ? 'Guardar los cambios' : 'Crear y añadir') + '</button>' +
          '</div>' +
        '</div>';

      pintarParametros();
      enganchar();
      await actualizarPreview();
    }

    /* ---------- los parámetros, según la operación elegida ---------- */

    function pintarParametros() {
      var c = $(caja, 'calc-parametros');
      var p = estado.parametros;
      if (estado.operacion === 'quitarFinal') {
        c.innerHTML =
          '<label class="etiqueta">Cuántos caracteres</label>' +
          '<input id="p-n" class="campo" type="number" min="1" max="20" value="' + (p.n || 1) + '">' +
          '<label class="interruptor interruptor-fila" style="margin-top:6px">' +
          '<input type="checkbox" id="p-solo-letra"' + (p.soloSiEsLetra ? ' checked' : '') + '>' +
          '<span>Solo si es una letra</span></label>';
      } else if (estado.operacion === 'quitarInicio') {
        c.innerHTML = '<label class="etiqueta">Cuántos caracteres</label>' +
          '<input id="p-n" class="campo" type="number" min="1" max="20" value="' + (p.n || 1) + '">';
      } else if (estado.operacion === 'partir') {
        c.innerHTML =
          '<label class="etiqueta">El signo</label>' +
          '<input id="p-signo" class="campo" maxlength="1" style="width:60px" value="' + U.escapar(p.signo || '') + '">' +
          '<label class="etiqueta">Qué parte</label>' +
          '<select id="p-lado" class="campo">' +
            '<option value="antes"' + (p.lado !== 'despues' ? ' selected' : '') + '>Lo de antes</option>' +
            '<option value="despues"' + (p.lado === 'despues' ? ' selected' : '') + '>Lo de después</option>' +
          '</select>' +
          '<label class="etiqueta">De cuál</label>' +
          '<select id="p-ocurrencia" class="campo">' +
            '<option value="primera"' + (p.ocurrencia !== 'ultima' ? ' selected' : '') + '>La primera vez que sale</option>' +
            '<option value="ultima"' + (p.ocurrencia === 'ultima' ? ' selected' : '') + '>La última vez que sale</option>' +
          '</select>';
      } else if (estado.operacion === 'equivalencias') {
        var textoPares = (p.pares || []).map(function (x) { return (x.de || '') + ' -> ' + (x.a || ''); }).join('\n');
        c.innerHTML =
          '<label class="etiqueta">Tabla, una equivalencia por línea, así: <code>ALU -&gt; Alumnado</code></label>' +
          '<textarea id="p-pares" class="campo" rows="4">' + U.escapar(textoPares) + '</textarea>' +
          '<label class="interruptor interruptor-fila" style="margin-top:6px">' +
          '<input type="checkbox" id="p-ignorar-mayus"' + (p.ignorarMayusculas ? ' checked' : '') + '>' +
          '<span>No distinguir mayúsculas ni acentos</span></label>' +
          '<label class="etiqueta">Si no está en la tabla</label>' +
          '<select id="p-si-no-esta" class="campo">' +
            '<option value="dejar"' + (p.siNoEsta !== 'vaciar' ? ' selected' : '') + '>Dejar el valor tal cual</option>' +
            '<option value="vaciar"' + (p.siNoEsta === 'vaciar' ? ' selected' : '') + '>Dejarlo vacío</option>' +
          '</select>';
      } else if (estado.operacion === 'juntar') {
        var origen2 = p.origen2 || { clase: 'columna' };
        c.innerHTML =
          '<label class="etiqueta">Con qué otro campo</label>' +
          '<select id="p-origen2-clase" class="campo">' +
            '<option value="columna"' + (origen2.clase === 'columna' ? ' selected' : '') + '>Una columna de la ficha</option>' +
            '<option value="grupo"' + (origen2.clase === 'grupo' ? ' selected' : '') + '>El grupo (forma compacta)</option>' +
            '<option value="calculado"' + (origen2.clase === 'calculado' ? ' selected' : '') + '>Otro campo calculado</option>' +
          '</select>' +
          '<div id="p-origen2-detalle"></div>' +
          '<label class="etiqueta">Separador</label>' +
          '<input id="p-separador" class="campo" style="width:100px" value="' + U.escapar(p.separador || '') + '">';
      } else if (estado.operacion === 'deFecha') {
        c.innerHTML =
          '<label class="etiqueta">Qué dato</label>' +
          '<select id="p-que" class="campo">' +
            '<option value="edad"' + (p.que === 'edad' || !p.que ? ' selected' : '') + '>La edad de hoy</option>' +
            '<option value="anio"' + (p.que === 'anio' ? ' selected' : '') + '>El año</option>' +
            '<option value="anioAcademico"' + (p.que === 'anioAcademico' ? ' selected' : '') + '>El curso académico</option>' +
          '</select>';
      }
    }

    async function pintarOrigen2Detalle() {
      var cont = $(caja, 'p-origen2-detalle');
      if (!cont) return;
      var p = estado.parametros;
      var origen2 = p.origen2 || { clase: 'columna' };
      if (origen2.clase === 'columna') {
        var columnas = await columnasDeCategoria(categoriaPrincipal());
        cont.innerHTML = '<select id="p-origen2-columna" class="campo">' + columnas.map(function (col) {
          return '<option value="' + U.escapar(col) + '"' + (origen2.columna === col ? ' selected' : '') + '>' + U.escapar(col) + '</option>';
        }).join('') + '</select>';
        var sel = $(caja, 'p-origen2-columna');
        if (sel) sel.onchange = function () { estado.parametros.origen2 = { clase: 'columna', columna: sel.value }; actualizarPreview(); };
        if (columnas.length && !origen2.columna) estado.parametros.origen2 = { clase: 'columna', columna: columnas[0] };
      } else if (origen2.clase === 'calculado') {
        var opciones = calculadosDisponibles();
        cont.innerHTML = '<select id="p-origen2-calculado" class="campo">' + opciones.map(function (c) {
          return '<option value="' + c.id + '"' + (origen2.id === c.id ? ' selected' : '') + '>' + U.escapar(c.nombre) + '</option>';
        }).join('') + '</select>';
        var sel2 = $(caja, 'p-origen2-calculado');
        if (sel2) sel2.onchange = function () { estado.parametros.origen2 = { clase: 'calculado', id: sel2.value }; actualizarPreview(); };
        if (opciones.length && !origen2.id) estado.parametros.origen2 = { clase: 'calculado', id: opciones[0].id };
      } else {
        cont.innerHTML = '';
        estado.parametros.origen2 = { clase: 'grupo' };
      }
    }

    /* ---------- enganchar cada campo del formulario ---------- */

    function enganchar() {
      $(caja, 'calc-nombre').oninput = function () { estado.nombre = this.value; avisoNombre(); };
      Array.prototype.forEach.call(caja.querySelectorAll('[data-cat]'), function (c) {
        c.onchange = function () {
          estado.categorias = CATEGORIAS.filter(function (cat) {
            var caja2 = caja.querySelector('[data-cat="' + cat + '"]');
            return caja2 && caja2.checked;
          });
          repintarConservando();
        };
      });

      $(caja, 'calc-origen-clase').onchange = function () {
        var clase = this.value;
        estado.origen = clase === 'grupo' ? { clase: 'grupo' }
          : clase === 'columna' ? { clase: 'columna', columna: '' }
          : { clase: 'calculado', id: '' };
        repintarConservando();
      };
      var selCol = $(caja, 'calc-origen-columna');
      if (selCol) { if (!estado.origen.columna) estado.origen.columna = selCol.value; selCol.onchange = function () { estado.origen.columna = this.value; actualizarPreview(); }; }
      var selCal = $(caja, 'calc-origen-calculado');
      if (selCal) { if (!estado.origen.id) estado.origen.id = selCal.value; selCal.onchange = function () { estado.origen.id = this.value; actualizarPreview(); }; }

      $(caja, 'calc-operacion').onchange = function () {
        estado.operacion = this.value;
        estado.parametros = valoresPorDefecto(estado.operacion);
        pintarParametros();
        engancharParametros();
        actualizarPreview();
      };
      engancharParametros();

      $(caja, 'calc-cancelar').onclick = function () { ctx.alCancelar(); };
      $(caja, 'calc-guardar').onclick = guardar;
      avisoNombre();
    }

    function valoresPorDefecto(op) {
      if (op === 'quitarFinal') return { n: 1, soloSiEsLetra: true };
      if (op === 'quitarInicio') return { n: 1 };
      if (op === 'partir') return { signo: ' ', lado: 'antes', ocurrencia: 'primera' };
      if (op === 'equivalencias') return { pares: [], ignorarMayusculas: false, siNoEsta: 'dejar' };
      if (op === 'juntar') return { origen2: { clase: 'columna', columna: '' }, separador: '-' };
      if (op === 'deFecha') return { que: 'edad' };
      return {};
    }

    function engancharParametros() {
      var p = estado.parametros;
      var campoN = $(caja, 'p-n');
      if (campoN) campoN.oninput = function () { p.n = parseInt(this.value, 10) || 1; actualizarPreview(); };
      var soloLetra = $(caja, 'p-solo-letra');
      if (soloLetra) soloLetra.onchange = function () { p.soloSiEsLetra = this.checked; actualizarPreview(); };
      var signo = $(caja, 'p-signo');
      if (signo) signo.oninput = function () { p.signo = this.value.charAt(0) || ''; actualizarPreview(); };
      var lado = $(caja, 'p-lado');
      if (lado) lado.onchange = function () { p.lado = this.value; actualizarPreview(); };
      var ocurrencia = $(caja, 'p-ocurrencia');
      if (ocurrencia) ocurrencia.onchange = function () { p.ocurrencia = this.value; actualizarPreview(); };
      var pares = $(caja, 'p-pares');
      if (pares) pares.oninput = function () {
        p.pares = this.value.split('\n').map(function (linea) {
          var partes = linea.split('->');
          return { de: (partes[0] || '').trim(), a: (partes[1] || '').trim() };
        }).filter(function (x) { return x.de; });
        actualizarPreview();
      };
      var ignorarMayus = $(caja, 'p-ignorar-mayus');
      if (ignorarMayus) ignorarMayus.onchange = function () { p.ignorarMayusculas = this.checked; actualizarPreview(); };
      var siNoEsta = $(caja, 'p-si-no-esta');
      if (siNoEsta) siNoEsta.onchange = function () { p.siNoEsta = this.value; actualizarPreview(); };
      var origen2Clase = $(caja, 'p-origen2-clase');
      if (origen2Clase) origen2Clase.onchange = function () {
        p.origen2 = this.value === 'grupo' ? { clase: 'grupo' } : this.value === 'calculado' ? { clase: 'calculado', id: '' } : { clase: 'columna', columna: '' };
        pintarOrigen2Detalle().then(actualizarPreview);
      };
      if (origen2Clase) pintarOrigen2Detalle();
      var separador = $(caja, 'p-separador');
      if (separador) separador.oninput = function () { p.separador = this.value; actualizarPreview(); };
      var que = $(caja, 'p-que');
      if (que) que.onchange = function () { p.que = this.value; actualizarPreview(); };
    }

    function avisoNombre() {
      var aviso = $(caja, 'calc-nombre-aviso');
      if (!aviso) return;
      var nombre = estado.nombre.trim();
      if (!nombre) { aviso.textContent = 'Escribe el nombre del campo.'; return; }
      var otros = (App.E.campos.calculados || [])
        .filter(function (c) { return !existente || c.id !== existente.id; })
        .map(function (c) { return c.nombre; });
      var cerca = U.parecidos(nombre, otros);
      var mismo = cerca.filter(function (c) { return c.igual; })[0];
      aviso.textContent = mismo
        ? 'Ya hay un campo calculado así, escrito: ' + mismo.nombre + '.'
        : (cerca.length ? 'Ojo, se parece a: ' + cerca.slice(0, 3).map(function (c) { return c.nombre; }).join(', ') + '.' : '');
    }

    function repintarConservando() { pintar(); }

    /* ---------- la vista previa ---------- */

    async function buscarPersonaDePrueba(receta) {
      var categoria = categoriaPrincipal();
      var fuente;
      try { fuente = App.E.datos ? await Datos.cargar(App.E.datos, categoria) : null; } catch (e) { fuente = null; }
      var lista = (fuente && fuente.lista) || [];
      if (!lista.length) return null;
      for (var i = candidatosProbados; i < lista.length; i++) {
        var valorOrigen = Calculo.valorDeOrigen(receta.origen, lista[i], App.E.campos);
        if (valorOrigen) { candidatosProbados = i + 1; return lista[i]; }
      }
      return null;
    }

    async function actualizarPreview(probarOtro) {
      var caja2 = $(caja, 'calc-preview');
      if (!caja2 || !window.Calculo) return;
      var receta = { origen: estado.origen, operacion: estado.operacion, parametros: estado.parametros };
      if (!probarOtro) candidatosProbados = 0;
      personaPrueba = await buscarPersonaDePrueba(receta);
      if (!personaPrueba) {
        caja2.innerHTML = '<p class="nota">No hay con quién probarlo todavía.</p>';
        return;
      }
      var valorOrigen = Calculo.valorDeOrigen(receta.origen, personaPrueba, App.E.campos);
      var resultado = Calculo.evaluar(receta, personaPrueba, App.E.campos);
      var nombrePersona = (window.App && App.textoTercero) ? App.textoTercero(personaPrueba) : (personaPrueba.nombre || '(sin nombre)');
      caja2.innerHTML =
        '<p><strong>Probando con:</strong> ' + U.escapar(nombrePersona) + ' ' +
        '<button type="button" class="boton boton-chico" id="calc-probar-otro">Probar con otro</button></p>' +
        '<p><strong>Valor de partida:</strong> ' + (U.escapar(valorOrigen) || '<span class="suave">(vacío)</span>') + '</p>' +
        '<p><strong>Receta:</strong> ' + U.escapar(Calculo.describir(receta, App.E.campos)) + '</p>' +
        '<p><strong>Resultado:</strong> ' + (U.escapar(resultado) || '<span class="suave">(vacío)</span>') + '</p>';
      $(caja2, 'calc-probar-otro').onclick = function () { actualizarPreview(true); };
    }

    /* ---------- guardar ---------- */

    async function guardar() {
      var calculado = {
        id: existente && existente.id ? existente.id : ('c' + Date.now() + Math.floor(Math.random() * 1000)),
        nombre: estado.nombre.trim(), categorias: estado.categorias,
        origen: estado.origen, operacion: estado.operacion, parametros: estado.parametros
      };
      var motivos = Calculo.validar(calculado, App.E.campos);
      if (motivos.length) { U.aviso(motivos[0], 'malo'); return; }
      U.mientrasGuarda($(caja, 'calc-guardar'), async function () {
        try {
          var esNuevo = !(existente && existente.id);
          App.E.campos = await Campos.guardarCalculados(App.E.gestor, function (calculados) {
            var i = calculados.findIndex(function (c) { return c.id === calculado.id; });
            if (i === -1) calculados.push(calculado); else calculados[i] = calculado;
            return calculados;
          });
          U.aviso('Campo calculado ' + calculado.nombre + ' guardado.', 'bueno');
          ctx.alGuardar(calculado, esNuevo);
        } catch (e) { U.aviso('No he podido guardarlo: ' + e.message, 'malo'); }
      });
    }

    pintar();
  }

  return { abrir: abrir };
})();
window.CamposCalculadosEditor = CamposCalculadosEditor;
