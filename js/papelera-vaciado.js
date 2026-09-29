/* ============================================================
   papelera-vaciado.js — la papelera se vacía sola a los N días, con aviso y constancia (fila 203,
   docs/PAPELERA-SE-VACIA-SOLA.md).

   Lo que hay aquí:
     - los plazos (90 días para borrar, 7 de aviso), configurables en
       Ajustes › El centro › «Días de aviso» (`ajustesAvisos`, como los
       demás días);
     - qué cosas están a punto de borrarse y la fecha de cada una;
     - el vaciado: al entrar y una vez al día, las de fecha pasada se
       borran del todo, de una en una, releyendo antes `papelera.json`
       (si el otro ordenador ya la borró o la devolvió, se salta);
     - la constancia: `_GESTOR/papelera-borrados.json`, solo el rastro
       (nombre, qué era, de dónde, cuándo entró y cuándo se borró, cómo
       y quién), y el desplegable «Borrados del todo (N)».

   Se carga después de js/papelera-ajustes.js (usa sus textos por
   `Papelera._deDonde`). Se engancha por `Gestor.alRefrescar`, sin
   envolver nada.
   ============================================================ */
(function () {
  if (typeof Papelera === 'undefined' || !Papelera._interno) return;
  var I = Papelera._interno;

  var FICHERO = 'papelera-borrados.json';
  var DIAS_POR_DEFECTO = 90;
  var AVISO_POR_DEFECTO = 7;
  var CLAVE_FALLOS = 'papelera-borrado-fallos';
  var DIAS_FALLANDO_PARA_AVISAR = 3;
  var ANOS_DEL_REGISTRO = 2;
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  function $(id) { return document.getElementById(id); }

  /* ---------- los plazos ---------- */

  function ajustes() {
    return (window.App && App.E && App.E.registro && App.E.registro.ajustesAvisos) || {};
  }

  function diasPapelera() {
    var n = ajustes().diasPapelera;
    return (typeof n === 'number' && n > 0) ? n : DIAS_POR_DEFECTO;
  }

  function diasAviso() {
    var n = ajustes().diasAvisoPapelera;
    return (typeof n === 'number' && n >= 0) ? n : AVISO_POR_DEFECTO;
  }

  /* Días que le quedan a una ficha antes de borrarse del todo: 0 o
     menos, ya toca. Una fecha ilegible cuenta como de hoy: nunca se
     borra por no entenderla. */
  function diasQueFaltan(ficha) {
    return diasPapelera() - Papelera._diasDesde(ficha.cuando);
  }

  function fechaDeBorrado(ficha) {
    var d = new Date(ficha.cuando);
    if (isNaN(d.getTime())) d = new Date();
    d = new Date(d.getTime() + diasPapelera() * 86400000);
    return d;
  }

  function fechaBreve(d) { return d.getDate() + '-' + MESES[d.getMonth()]; }

  function fechaConAno(d) { return d.getDate() + '-' + MESES[d.getMonth()] + '-' + d.getFullYear(); }

  function seBorraPronto(ficha) { return diasQueFaltan(ficha) <= diasAviso(); }

  /* Lo que sale en el aviso de Inicio: n, la lista y la fecha de la
     primera en borrarse. */
  async function loQueSeBorraPronto() {
    var lista;
    try { lista = await I.leer(); } catch (e) { return { n: 0, lista: [], primera: null }; }
    var pronto = lista.filter(seBorraPronto);
    var primera = null;
    pronto.forEach(function (f) {
      var d = fechaDeBorrado(f);
      if (!primera || d < primera) primera = d;
    });
    return { n: pronto.length, lista: pronto, primera: primera };
  }

  /* ---------- la constancia ---------- */

  function enFila(fn) { return window.ColaGuardado ? ColaGuardado.poner(FICHERO, fn) : fn(); }

  async function leerBorrados() {
    var g = I.gestor();
    if (!g) return [];
    var leido = await Carpetas.leerJson(g, FICHERO);
    return (leido && Array.isArray(leido.borrados)) ? leido.borrados : [];
  }

  /* Como todo fichero compartido: releído justo antes de escribir. */
  async function cambiarBorrados(hacer) {
    var g = I.gestor();
    if (!g) return [];
    var salida = [];
    await enFila(async function () {
      var lista = await leerBorrados();
      salida = hacer(lista.slice()) || lista;
      await Copias.guardar(g, FICHERO, { borrados: salida });
    });
    return salida;
  }

  async function apuntarBorrado(ficha, como) {
    var automatico = como === 'automatico';
    var entrada = {
      nombre: ficha.nombre,
      queEra: Papelera._deDonde(ficha),
      deDonde: Papelera._origenTexto(ficha),
      entroEl: ficha.cuando || '',
      borradoEl: U.ahora(),
      como: automatico ? 'automatico' : 'a mano',
      quien: automatico ? 'la aplicación' : (I.quienSoy() || 'alguien')
    };
    await cambiarBorrados(function (l) { l.push(entrada); return l; });
    return entrada;
  }

  /* ---------- el vaciado ---------- */

  function hoyTexto() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function leerFallos() {
    try { return JSON.parse(window.localStorage.getItem(CLAVE_FALLOS) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function guardarFallos(f) {
    try { window.localStorage.setItem(CLAVE_FALLOS, JSON.stringify(f)); } catch (e) { /* sin memoria, no pasa nada */ }
  }

  /* Apunta que hoy ha fallado el borrado de `id`; devuelve en cuántos
     días distintos lleva fallando. Sin pantalla, para probarla. */
  function apuntarFallo(fallos, id, hoy) {
    var dias = fallos[id] || [];
    if (dias.indexOf(hoy) === -1) dias.push(hoy);
    fallos[id] = dias;
    return dias.length;
  }

  /* Borra del todo lo que ya pasó de su fecha. Devuelve cuántas se
     borraron y cuántas fallaron. Nunca lanza. */
  async function vaciarLoVencido() {
    var resultado = { borradas: 0, fallidas: 0 };
    var lista;
    try { lista = await I.leer(); } catch (e) { return resultado; }
    var vencidas = lista.filter(function (f) { return diasQueFaltan(f) <= 0; });
    var fallos = leerFallos();
    var hoy = hoyTexto();
    var avisarDe = [];
    for (var i = 0; i < vencidas.length; i++) {
      try {
        /* Dos ordenadores no se pisan: se relee antes de cada una. Si ya
           no está (la borró o la devolvió el otro), se salta. */
        var fresca = (await I.leer()).filter(function (x) { return x.id === vencidas[i].id; })[0];
        if (!fresca || diasQueFaltan(fresca) > 0) continue;
        await I.borrarDelTodo(fresca, 'automatico');
        delete fallos[fresca.id];
        resultado.borradas++;
      } catch (e) {
        resultado.fallidas++;
        if (apuntarFallo(fallos, vencidas[i].id, hoy) >= DIAS_FALLANDO_PARA_AVISAR) avisarDe.push(vencidas[i].nombre);
      }
    }
    guardarFallos(fallos);
    if (avisarDe.length) {
      U.aviso('La papelera lleva ' + DIAS_FALLANDO_PARA_AVISAR + ' días sin poder borrar del todo: ' +
        avisarDe.join(', ') + '. Puede que Dropbox lo tenga cogido.', 'ambar');
    }
    return resultado;
  }

  var ultimoVaciado = '';

  async function vaciarSiToca() {
    if (!I.gestor()) return;
    var hoy = hoyTexto();
    if (ultimoVaciado === hoy) return;
    if (window.ColaGuardado && ColaGuardado.hayGuardado()) return;
    ultimoVaciado = hoy;
    var r = await vaciarLoVencido();
    if (r.borradas) {
      if (window.AvisosQueFaltan) AvisosQueFaltan.repintarPapelera();
      U.aviso(r.borradas + (r.borradas === 1 ? ' cosa' : ' cosas') + ' de la papelera se ha borrado del todo ' +
        '(llevaba más de ' + diasPapelera() + ' días).', 'bueno');
      if (typeof App.pintarPapelera === 'function') { try { App.pintarPapelera(); } catch (e) { /* idem */ } }
    }
  }

  if (window.Gestor && Gestor.alRefrescar) {
    Gestor.alRefrescar.push(function () {
      vaciarSiToca().catch(function () { /* a la siguiente */ });
    });
  }

  /* ---------- «Borrados del todo (N)» ---------- */

  function textoDeBorrado(b) {
    return U.normalizar([b.nombre, b.queEra, b.deDonde, b.como === 'automatico' ? 'automatico' : 'a mano',
      b.quien, fechaConAno(new Date(b.borradoEl))].join(' '));
  }

  function limiteDelRegistro() {
    var d = new Date();
    d.setFullYear(d.getFullYear() - ANOS_DEL_REGISTRO);
    return d;
  }

  async function pintarBorrados() {
    var caja = $('tabla-borrados');
    if (!caja) return;
    var lista;
    try { lista = await leerBorrados(); }
    catch (e) {
      caja.innerHTML = '<div class="vacio">No he podido leer el registro: ' + U.escapar(U.mensajeDeError(e)) + '</div>';
      return;
    }
    if ($('papelera-borrados-titulo')) $('papelera-borrados-titulo').textContent = 'Borrados del todo (' + lista.length + ')';

    var campo = $('buscar-borrados');
    var palabras = campo ? U.normalizar(campo.value).split(' ').filter(Boolean) : [];
    var visibles = lista.filter(function (b) {
      if (!palabras.length) return true;
      var t = textoDeBorrado(b);
      return palabras.every(function (p) { return t.indexOf(p) !== -1; });
    }).reverse();
    if ($('cuenta-borrados')) $('cuenta-borrados').textContent = palabras.length ? (visibles.length + ' de ' + lista.length) : String(lista.length);

    caja.innerHTML = '';
    if (!visibles.length) {
      caja.innerHTML = '<div class="vacio">' + (lista.length ? 'Nada con esas palabras.' : 'Todavía no se ha borrado nada del todo.') + '</div>';
    }
    visibles.forEach(function (b) {
      var f = document.createElement('div');
      f.className = 'fila-tipo fila-papelera';
      var cuando = new Date(b.borradoEl);
      var como = b.como === 'automatico' ? 'automático · ' + b.quien : 'a mano · ' + b.quien;
      f.innerHTML = '<span class="papelera-icono">🗑</span><span style="flex:1">' +
        '<span class="nombre-tipo">' + U.escapar(b.nombre) + '</span><br>' +
        '<span class="suave">' + U.escapar([b.queEra, b.deDonde].filter(Boolean).join(' · ')) +
        '  ·  borrado el ' + U.escapar(isNaN(cuando.getTime()) ? '?' : fechaConAno(cuando)) +
        '  ·  ' + U.escapar(como) + '</span></span>';
      caja.appendChild(f);
    });

    var boton = $('btn-vaciar-registro');
    if (boton) {
      boton.textContent = 'Vaciar el registro de antes de ' + fechaConAno(limiteDelRegistro());
      boton.onclick = vaciarRegistroViejo;
    }
  }

  async function vaciarRegistroViejo() {
    var limite = limiteDelRegistro();
    var hay = (await leerBorrados()).filter(function (b) { return new Date(b.borradoEl) < limite; }).length;
    if (!hay) { U.aviso('No hay nada apuntado de antes de ' + fechaConAno(limite) + '.', 'ambar'); return; }
    var ok = await U.preguntar('Vaciar el registro',
      '<p>Se quitan del registro ' + hay + (hay === 1 ? ' apunte' : ' apuntes') + ' de antes de ' + fechaConAno(limite) + '.</p>' +
      '<p class="nota">Solo se pierde el rastro de lo que se borró entonces.</p>', 'Vaciar');
    if (!ok) return;
    try {
      await cambiarBorrados(function (l) { return l.filter(function (b) { return !(new Date(b.borradoEl) < limite); }); });
      U.aviso('Registro vaciado.', 'bueno');
    } catch (e) {
      U.aviso('No he podido vaciarlo: ' + U.mensajeDeError(e), 'malo');
    }
    pintarBorrados();
  }

  if ($('buscar-borrados')) $('buscar-borrados').oninput = function () { pintarBorrados(); };

  Object.assign(I, { apuntarBorrado: apuntarBorrado, pintarBorrados: pintarBorrados });
  Object.assign(Papelera, {
    diasPapelera: diasPapelera,
    diasAviso: diasAviso,
    diasQueFaltan: diasQueFaltan,
    fechaDeBorrado: fechaDeBorrado,
    fechaBreve: fechaBreve,
    seBorraPronto: seBorraPronto,
    loQueSeBorraPronto: loQueSeBorraPronto,
    leerBorrados: leerBorrados,
    vaciarLoVencido: vaciarLoVencido,
    _apuntarFallo: apuntarFallo
  });
})();
