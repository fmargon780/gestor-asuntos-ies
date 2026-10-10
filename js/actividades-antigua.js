/* ============================================================
   actividades-antigua.js — apuntar una actividad de un curso anterior
   (9-oct-2026, fila 310, docs/ACTIVIDADES-EXTRAESCOLARES-PANTALLA.md).

   Un cuadro corto, ancho: nombre, fechas, lugar, departamento, horas y
   profesorado. Sin alumnado, sin asunto y sin aviso al claustro. El
   profesorado se busca en PERSONAL como en el formulario de la fila 306
   (js/actividades-formulario.js); además se puede añadir a alguien que ya
   no está en el centro, con su nombre y, si se sabe, su DNI: va al registro
   tal cual, no se da de alta como tercero.

   - `abrir(actividad?)`: devuelve la actividad guardada, o null si se cancela.
   - `borrar(actividad)`: pregunta y la manda a la papelera.
   - `repetida(lista, r)`: PURA. ¿Ya hay otra con el mismo nombre y el mismo día de inicio?
   ============================================================ */
var ActividadesAntigua = (function () {

  function $(id) { return document.getElementById(id); }
  function esc(v) { return U.escapar(String(v === undefined || v === null ? '' : v)); }
  function n(t) { return U.normalizar(String(t || '')); }

  /* ---------- sin efectos ---------- */

  /* Otra actividad (distinta de `r.id`) con el mismo nombre y la misma fecha de inicio. */
  function repetida(lista, r) {
    return (lista || []).filter(function (a) {
      return a.id !== r.id && !a.enPapelera && a.inicio === r.inicio && n(a.nombre) === n(r.nombre);
    })[0] || null;
  }

  /* ¿Se puede guardar? Nombre, una fecha anterior a hoy y alguien de profesorado. */
  function valida(S, hoyIso) {
    return !!(S.nombre.trim() && S.inicio && S.inicio < hoyIso && S.profesorado.length);
  }

  function plantilla() {
    return '<div class="ant-form">' +
      '<div class="ant-col">' +
        '<label class="etiqueta act-et" for="ant-nombre">Nombre de la actividad</label>' +
        '<input id="ant-nombre" class="campo" maxlength="120" autocomplete="off">' +
        '<div class="act-dos">' +
          '<div><label class="etiqueta act-et" for="ant-inicio">Fecha de inicio</label><input id="ant-inicio" type="date" class="campo"></div>' +
          '<div><label class="etiqueta act-et" for="ant-fin">Fecha de fin</label><input id="ant-fin" type="date" class="campo"></div>' +
        '</div>' +
        '<label class="etiqueta act-et" for="ant-lugar">Lugar</label>' +
        '<input id="ant-lugar" class="campo" maxlength="200" autocomplete="off">' +
        '<label class="etiqueta act-et" for="ant-depto">Departamento que la organizó</label>' +
        '<input id="ant-depto" class="campo" maxlength="120" list="ant-deptos" autocomplete="off"><datalist id="ant-deptos"></datalist>' +
        '<label class="etiqueta act-et" for="ant-horas">Horas de dedicación <span class="nota">(no es obligatorio)</span></label>' +
        '<input id="ant-horas" type="number" min="0" step="0.5" class="campo act-horas">' +
      '</div>' +
      '<div class="ant-col">' +
        '<div class="etiqueta act-et">Profesorado que fue</div>' +
        '<div id="ant-profes" class="act-profes"></div>' +
        '<div class="act-acciones">' +
          '<button type="button" class="boton boton-chico" id="ant-mas-profe">+ Añadir profesorado</button>' +
          '<button type="button" class="boton boton-chico" id="ant-mas-fuera">+ Añadir a alguien que ya no está en el centro</button>' +
        '</div>' +
        '<div id="ant-fuera" class="ant-fuera oculto">' +
          '<label class="etiqueta act-et" for="ant-fuera-nombre">Nombre (Apellidos, Nombre)</label>' +
          '<input id="ant-fuera-nombre" class="campo" maxlength="120" autocomplete="off">' +
          '<label class="etiqueta act-et" for="ant-fuera-dni">DNI <span class="nota">(si se sabe)</span></label>' +
          '<input id="ant-fuera-dni" class="campo" maxlength="20" autocomplete="off">' +
          '<button type="button" class="boton boton-chico" id="ant-fuera-poner">Añadir</button>' +
        '</div>' +
        '<div id="ant-picker" class="act-picker oculto"></div>' +
      '</div>' +
    '</div>';
  }

  var abierto = false;

  /* `base`: una actividad antigua del registro para cambiarla, o nada para apuntar una nueva. */
  async function abrir(base) {
    if (abierto) return null;
    abierto = true;
    var hoy = U.hoyIso();
    var S = {
      id: base ? base.id : '', nombre: base ? base.nombre : '', inicio: base ? base.inicio : '', fin: base ? base.fin : '',
      lugar: base ? base.lugar : '', departamento: base ? base.departamento : '', horas: base && base.horas !== null ? base.horas : '',
      profesorado: base ? base.profesorado.map(function (p) { return { nombre: p.nombre, clave: p.clave, papel: p.papel }; }) : []
    };

    var capa = $('capa'), cuadro = capa.querySelector('.cuadro');
    var promesa = U.preguntar(base ? 'Cambiar la actividad antigua' : 'Apuntar una actividad antigua', plantilla(), 'Guardar');
    cuadro.classList.add('cuadro-ancho', 'cuadro-actividad-antigua');
    var aceptar = $('cuadro-aceptar');

    var campos = { nombre: 'ant-nombre', inicio: 'ant-inicio', fin: 'ant-fin', lugar: 'ant-lugar', departamento: 'ant-depto', horas: 'ant-horas' };
    Object.keys(campos).forEach(function (k) { $(campos[k]).value = S[k] === null || S[k] === undefined ? '' : S[k]; });
    var ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
    $('ant-inicio').max = ayer.getFullYear() + '-' + String(ayer.getMonth() + 1).padStart(2, '0') + '-' + String(ayer.getDate()).padStart(2, '0');
    var deptos = {};
    Actividades.lista().forEach(function (a) { if (a.departamento) deptos[a.departamento] = true; });
    $('ant-deptos').innerHTML = Object.keys(deptos).sort().map(function (d) { return '<option value="' + esc(d) + '">'; }).join('');

    function leer() { Object.keys(campos).forEach(function (k) { S[k] = $(campos[k]).value; }); }
    function revisar() { leer(); aceptar.disabled = !valida(S, hoy); }
    $('ant-nombre').oninput = revisar;
    $('ant-lugar').oninput = revisar;
    $('ant-depto').oninput = revisar;
    $('ant-horas').oninput = revisar;
    $('ant-inicio').onchange = $('ant-inicio').oninput = function () {
      S.inicio = this.value;
      if (S.inicio && (!$('ant-fin').value || $('ant-fin').value < S.inicio)) $('ant-fin').value = S.inicio;
      $('ant-fin').min = S.inicio || '';
      revisar();
    };
    $('ant-fin').onchange = $('ant-fin').oninput = function () {
      if (S.inicio && this.value && this.value < S.inicio) this.value = S.inicio;
      revisar();
    };
    if (S.inicio) $('ant-fin').min = S.inicio;

    function pintarProfes() {
      $('ant-profes').innerHTML = S.profesorado.length ? S.profesorado.map(function (p, i) {
        return '<div class="act-profe" data-i="' + i + '"><span class="act-profe-nombre">' + esc(p.nombre) + '</span>' +
          '<select class="campo act-papel" aria-label="Papel de ' + esc(p.nombre) + '">' +
            '<option value="acompana"' + (p.papel === 'organiza' ? '' : ' selected') + '>Acompaña</option>' +
            '<option value="organiza"' + (p.papel === 'organiza' ? ' selected' : '') + '>Organiza</option></select>' +
          '<button type="button" class="act-profe-quitar" title="Quitar" aria-label="Quitar a ' + esc(p.nombre) + '">×</button></div>';
      }).join('') : '<p class="nota">Nadie todavía.</p>';
      Array.prototype.forEach.call($('ant-profes').querySelectorAll('.act-profe'), function (f) {
        var i = +f.dataset.i;
        f.querySelector('.act-papel').onchange = function () { S.profesorado[i].papel = this.value; };
        f.querySelector('.act-profe-quitar').onclick = function () { S.profesorado.splice(i, 1); pintarProfes(); revisar(); };
      });
    }

    function cerrarPicker() { $('ant-picker').classList.add('oculto'); $('ant-picker').innerHTML = ''; }
    $('ant-mas-profe').onclick = function () {
      var caja = $('ant-picker');
      caja.classList.remove('oculto');
      caja.innerHTML = '<div class="act-picker-cabecera"><strong>Profesorado</strong>' +
        '<button type="button" class="boton boton-chico" id="ant-picker-cerrar">Cerrar</button></div><div id="ant-picker-sitio"></div>';
      $('ant-picker-cerrar').onclick = cerrarPicker;
      App.pintarBuscadorDeTercero($('ant-picker-sitio'), 'PERSONAL', function (marcados) {
        marcados.forEach(function (m) {
          var p = m.persona || {};
          if (S.profesorado.some(function (x) { return x.nombre === m.nombre; })) return;
          S.profesorado.push({ nombre: m.nombre, clave: Datos.clavePersona(p.documento, p.nombre || m.nombre), papel: 'acompana' });
        });
        cerrarPicker(); pintarProfes(); revisar();
      }, { multiple: true, categorias: ['PERSONAL'], textoBoton: function (c) { return 'Añadir los ' + c + ' señalados'; } });
    };
    $('ant-mas-fuera').onclick = function () { $('ant-fuera').classList.toggle('oculto'); $('ant-fuera-nombre').focus(); };
    $('ant-fuera-poner').onclick = function () {
      var nombre = U.limpiarNombre($('ant-fuera-nombre').value), dni = $('ant-fuera-dni').value.replace(/\s+/g, '').toUpperCase();
      if (!nombre) { U.aviso('Escribe el nombre de la persona.', 'ambar'); return; }
      if (S.profesorado.some(function (x) { return n(x.nombre) === n(nombre); })) { U.aviso('Esa persona ya está en la lista.', 'ambar'); return; }
      S.profesorado.push({ nombre: nombre, clave: Datos.clavePersona(dni, nombre), papel: 'acompana' });
      $('ant-fuera-nombre').value = ''; $('ant-fuera-dni').value = '';
      $('ant-fuera').classList.add('oculto');
      pintarProfes(); revisar();
    };

    pintarProfes(); revisar();
    $('ant-nombre').focus();

    var ok = await promesa;
    cuadro.classList.remove('cuadro-ancho', 'cuadro-actividad-antigua');
    aceptar.disabled = false;
    abierto = false;
    if (!ok) return null;
    leer();
    var horas = String(S.horas).trim() === '' ? null : Number(String(S.horas).replace(',', '.'));
    var r = {
      id: S.id, nombre: U.limpiarNombre(S.nombre), inicio: S.inicio, fin: S.fin || S.inicio, lugar: S.lugar.trim(),
      departamento: S.departamento.trim(), horas: isFinite(horas) ? horas : null,
      profesorado: S.profesorado.map(function (p) { return { nombre: p.nombre, clave: p.clave, papel: p.papel }; })
    };
    var otra = repetida(Actividades.lista(), r);
    if (otra && !(await U.preguntar('Ya hay una actividad con ese nombre ese día',
      '<p>Ya hay una actividad con ese nombre ese día. ¿Es otra distinta?</p>', 'Sí, es otra'))) return null;
    return Actividades.guardarAntigua(r);
  }

  async function borrar(a) {
    var ok = await U.preguntar('¿Mandar a la papelera?',
      '<p>La actividad «' + esc(a.nombre) + '» saldrá de la lista. Podrás recuperarla desde Herramientas → Papelera.</p>', 'Sí, a la papelera');
    if (!ok) return false;
    await Actividades.borrarAntigua(a.id);
    U.aviso('Actividad mandada a la papelera.', 'bueno');
    return true;
  }

  return { abrir: abrir, borrar: borrar, repetida: repetida, valida: valida };
})();
window.ActividadesAntigua = ActividadesAntigua;
