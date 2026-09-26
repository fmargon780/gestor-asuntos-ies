/* ============================================================
   tutores-legales.js — los tutores legales, un tipo de tercero propio
   (25-sep-2026, fila 166, docs/TUTORES-LEGALES-COMO-TERCERO.md).

   - La lista de la categoría TUTORES LEGALES sale sola del RegAlum.csv:
     el índice de familias de js/personas-familias.js (unidos por DNI
     normalizado), con todos los hijos, matriculados y antiguos. No hay
     alta a mano.
   - En cuanto un tutor es tercero de un asunto, su foto de datos se
     guarda en `_GESTOR/datos/tutores.csv` (nombre, DNI, teléfonos,
     correos, domicilio y los Nº escolares de sus hijos): así no
     desaparece si sus hijos dejan el centro. La lista es la unión de
     las dos fuentes; si el RegAlum trae datos más nuevos, mandan esos y
     el fichero se pone al día. Siempre por `ColaGuardado`, con una copia
     del día en `_GESTOR/copias` antes de escribir.
   - El nombre del tercero es el del personal: «Apellido1 Apellido2,
     Nombre» + los 4 últimos caracteres del DNI (Nombres.terceroTutor).
   - La ficha del tutor (Personas y empresas) enseña sus hijos, cada uno
     pulsable; la del alumno, «Asuntos de sus tutores».

   Se engancha por puntos previstos, sin envolver nada:
   `Datos.registrarFuente`, `window.Gestor.alCrearAsunto` y
   `App.FICHAS_DE_CATEGORIA` / `App.trasPintarFicha` (js/archivo-personas.js).
   Carga después de js/puente.js y de js/archivo-personas.js.
   ============================================================ */
var TutoresLegales = (function () {

  var CAT = 'TUTORES LEGALES';
  var FICHERO = 'tutores.csv';

  function def() { return Datos.LISTAS[CAT]; }
  function compacto(t) { return U.normalizar(t || '').replace(/[\s.\-]/g, ''); }

  function claveDe(t) {
    var d = compacto(t.documento);
    if (d) return 'd:' + d;
    return 'n:' + U.normalizar(t.nombre || '').replace(/\s+/g, ' ').trim();
  }

  /* ---------- los hijos, en el CSV: «Apellidos, Nombre (Nº escolar); …» ---------- */

  function hijosATexto(hijos) {
    return (hijos || []).map(function (h) { return h.nombre + (h.id ? ' (' + h.id + ')' : ''); }).join('; ');
  }

  function hijosDeTexto(texto) {
    return String(texto || '').split(/\s*;\s*/).filter(Boolean).map(function (trozo) {
      var m = trozo.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
      return { nombre: (m ? m[1] : trozo).trim(), id: m ? m[2].trim() : '', unidad: '', curso: '', matriculado: false };
    });
  }

  function claveHijo(h) { return h.id ? 'i:' + h.id : 'n:' + U.normalizar(h.nombre || ''); }

  function unirHijos(a, b) {
    var vistos = {}, salida = [];
    (a || []).concat(b || []).forEach(function (h) {
      var k = claveHijo(h);
      if (vistos[k]) return;
      vistos[k] = true;
      salida.push(h);
    });
    return salida;
  }

  /* ---------- la persona, como las demás listas de Datos ---------- */

  function persona(d) {
    var tel = d.telefonos || [], cor = d.correos || [];
    var campos = {};
    function poner(titulo, valor) { if (valor) campos[titulo] = valor; }
    poner('Documento', d.documento);
    poner('Teléfono', tel[0]); poner('Teléfono 2', tel[1]);
    poner('Correo', cor[0]); poner('Correo 2', cor[1]);
    poner('Domicilio', d.domicilio);
    poner('Hijos', hijosATexto(d.hijos));
    if (d.sexo) campos['Sexo'] = d.sexo;
    var nombre = d.nombre || '';
    return {
      nombre: nombre, nombreNatural: d.nombreNatural || (Datos.nombreNatural ? Datos.nombreNatural(nombre) : nombre),
      documento: d.documento || '', telefonos: tel.slice(), correos: cor.slice(),
      domicilio: d.domicilio || '', hijos: (d.hijos || []).slice(),
      categoria: CAT, deSeneca: true, enElCentro: true, enRegAlum: !!d.enRegAlum, guardado: !!d.guardado,
      referencia: '', nif: '', comercial: '', puesto: '', fechaCese: '', campos: campos,
      busca: U.normalizar([nombre, d.nombreNatural || '', d.documento || ''].concat(tel, cor,
        (d.hijos || []).map(function (h) { return h.nombre; })).join(' '))
    };
  }

  /* Del índice de familias del RegAlum a los datos de un tutor. */
  function datosDeFamilia(f) {
    return {
      nombre: f.nombreApellidos || f.nombre, nombreNatural: f.nombre, documento: f.documento,
      telefonos: f.telefonos.slice(), correos: f.correos.slice(), domicilio: f.domicilio || '',
      sexo: f.sexo || '', enRegAlum: true,
      hijos: f.hijos.map(function (p) {
        return { id: p.id || '', nombre: p.nombre || '', unidad: p.unidad || '', curso: p.curso || '',
                 matriculado: !!p.matriculado, persona: p };
      })
    };
  }

  /* Una fila de tutores.csv (objeto columna → valor) a los datos de un tutor. */
  function datosDeFila(c) {
    return {
      nombre: c['Nombre'] || '', documento: c['Documento'] || '',
      telefonos: [c['Teléfono'], c['Teléfono 2']].filter(Boolean),
      correos: [c['Correo'], c['Correo 2']].filter(Boolean),
      domicilio: c['Domicilio'] || '', hijos: hijosDeTexto(c['Hijos']), guardado: true
    };
  }

  function filaDe(p) {
    return def().cabecera.map(function (c) { return (p.campos && p.campos[c]) || (c === 'Nombre' ? p.nombre : ''); });
  }

  /* Función pura: la unión del RegAlum y de lo guardado. Devuelve
     { lista, alDia }: `alDia`, los guardados cuyos datos del RegAlum son
     distintos de los del fichero (hay que ponerlo al día). */
  function unir(delRegAlum, guardados) {
    var porClave = {}, orden = [];
    (delRegAlum || []).forEach(function (d) {
      var k = claveDe(d);
      if (porClave[k]) return;
      porClave[k] = d; orden.push(k);
    });
    var alDia = [];
    (guardados || []).forEach(function (g) {
      var k = claveDe(g);
      var r = porClave[k];
      if (!r) { porClave[k] = g; orden.push(k); return; }
      r.guardado = true;
      r.hijos = unirHijos(r.hijos, g.hijos);
      var antes = filaDe(persona(g)).join('\u0001');
      if (filaDe(persona(r)).join('\u0001') !== antes) alDia.push(r);
    });
    var lista = orden.map(function (k) { return persona(porClave[k]); });
    lista.sort(function (a, b) { return U.normalizar(a.nombre) < U.normalizar(b.nombre) ? -1 : 1; });
    return { lista: lista, alDia: alDia.map(persona) };
  }

  /* ---------- leer ---------- */

  async function leerGuardados(dirDatos) {
    var texto = await Carpetas.leerTexto(dirDatos, FICHERO);
    if (!texto) return [];
    var t = Datos.aTabla(texto).filas;
    var cab = (t[0] || []).map(function (x) { return String(x).trim(); });
    return t.slice(1).map(function (fila) {
      var c = {};
      cab.forEach(function (titulo, i) { var v = String(fila[i] === undefined ? '' : fila[i]).trim(); if (v) c[titulo] = v; });
      return datosDeFila(c);
    }).filter(function (d) { return d.nombre; });
  }

  /* La fuente de la categoría. Se guarda en la caché de Datos (así
     `Datos.olvidar` la tira), atada a la lista de alumnado de la que
     salió: un RegAlum nuevo la rehace. */
  async function cargar(dirDatos) {
    var I = Datos._interno;
    var alumnado = null;
    try { alumnado = await Datos.cargar(dirDatos, 'ALUMNADO'); } catch (e) { alumnado = null; }
    var ya = I.CACHE[CAT];
    if (ya && ya._alumnado === alumnado) return ya;
    var delRegAlum = alumnado && window.PersonasFamilias
      ? PersonasFamilias.indice(alumnado.lista, true).familias.map(datosDeFamilia) : [];
    var guardados = [];
    try { guardados = await leerGuardados(dirDatos); } catch (e) { guardados = []; }
    var r = unir(delRegAlum, guardados);
    var fuente = { lista: r.lista, fichero: FICHERO, cabecera: def().cabecera.slice(), _alumnado: alumnado };
    I.CACHE[CAT] = fuente;
    if (r.alDia.length) {
      guardarVarios(dirDatos, r.alDia).catch(function () { /* accesorio: se reintenta la próxima vez */ });
    }
    return fuente;
  }

  /* ---------- guardar ---------- */

  function hoyAaMmDd() {
    var d = new Date();
    function dos(n) { return String(n).padStart(2, '0'); }
    return String(d.getFullYear()).slice(2) + dos(d.getMonth() + 1) + dos(d.getDate());
  }

  /* La copia del día, antes de la primera escritura del día. */
  async function copiaDelDia(textoAntes) {
    var g = window.App && App.E && App.E.gestor;
    if (!g || !textoAntes) return;
    var copias = await Carpetas.crear(g, 'copias');
    var nombre = 'tutores-' + hoyAaMmDd() + '.csv';
    if (!(await Carpetas.existeFichero(copias, nombre))) await Carpetas.escribirTexto(copias, nombre, textoAntes);
  }

  function enFila(fn) { return window.ColaGuardado ? ColaGuardado.poner(FICHERO, fn) : fn(); }

  /* Añade o pone al día a estos tutores en tutores.csv (releyendo dentro
     de la cola, para sumar lo del otro ordenador). */
  function guardarVarios(dirDatos, personas) {
    return enFila(async function () {
      var textoAntes = await Carpetas.leerTexto(dirDatos, FICHERO);
      var guardados = [];
      if (textoAntes) guardados = await leerGuardados(dirDatos);
      var porClave = {}, orden = [];
      guardados.forEach(function (g) { var k = claveDe(g); if (!porClave[k]) { porClave[k] = persona(g); orden.push(k); } });
      personas.forEach(function (p) {
        var k = claveDe(p);
        var antes = porClave[k];
        var nuevo = persona({
          nombre: p.nombre, documento: p.documento, telefonos: p.telefonos, correos: p.correos,
          domicilio: p.domicilio, hijos: unirHijos(p.hijos, antes ? antes.hijos : [])
        });
        if (!antes) orden.push(k);
        porClave[k] = nuevo;
      });
      var filas = orden.map(function (k) { return filaDe(porClave[k]); });
      filas.sort(function (a, b) { return U.normalizar(a[0]) < U.normalizar(b[0]) ? -1 : 1; });
      var texto = Datos.aCsv(def().cabecera, filas);
      if (texto === textoAntes) return;
      try { await copiaDelDia(textoAntes); } catch (e) { /* la copia no para el guardado */ }
      await Carpetas.escribirTexto(dirDatos, FICHERO, texto);
      delete Datos._interno.CACHE[CAT];
      delete Datos._interno.CACHE[CAT + '_MANUAL'];
    });
  }

  function guardar(dirDatos, p) { return guardarVarios(dirDatos, [p]); }

  /* ---------- lo que se ve ---------- */

  function nombreDePila(h) {
    var t = String(h.nombre || '');
    var coma = t.indexOf(',');
    return coma === -1 ? t : t.slice(coma + 1).trim();
  }

  /* Debajo del nombre, en los buscadores. */
  function pie(p) {
    var hijos = (p.hijos || []).map(function (h) {
      return nombreDePila(h) + (h.matriculado && h.unidad ? ' (' + h.unidad + ')' : '');
    });
    return [p.documento ? 'DNI ' + p.documento : 'Sin DNI',
            hijos.length ? 'Tutor/a de ' + hijos.join(', ') : '',
            p.enRegAlum ? '' : 'datos guardados (sin hijos en el RegAlum)'].filter(Boolean).join('  ·  ');
  }

  function fila(titulo, valorHtml) {
    return '<div class="ficha-dato"><span>' + U.escapar(titulo) + '</span><span>' + valorHtml + '</span></div>';
  }

  var hijosVistos = [];

  /* La ficha del tutor en Personas y empresas. */
  function htmlFicha(p) {
    hijosVistos = p.hijos || [];
    var html = '';
    html += fila('DNI', U.escapar(p.documento || 'Sin DNI en el RegAlum'));
    if (p.telefonos.length) html += fila('Teléfonos', U.escapar(p.telefonos.join('  ·  ')));
    if (p.correos.length) html += fila('Correos', U.escapar(p.correos.join('  ·  ')));
    if (p.domicilio) html += fila('Domicilio', U.escapar(p.domicilio));
    if (hijosVistos.length) {
      html += '<div class="ficha-dato ficha-hijos"><span>Hijos</span><span>' + hijosVistos.map(function (h, i) {
        var detalle = h.matriculado ? (h.unidad || 'matriculado') : 'ya no está matriculado';
        return '<button type="button" class="enlace" data-hijo="' + i + '">' + U.escapar(h.nombre) + '</button>' +
          ' <span class="suave">(' + U.escapar(detalle) + ')</span>';
      }).join('<br>') + '</span></div>';
    }
    if (!p.enRegAlum) {
      html += '<p class="nota">Sus hijos ya no están en el RegAlum.csv: son los datos guardados cuando ' +
        'fue tercero de un asunto.</p>';
    }
    return html;
  }

  async function alumnoDeHijo(h) {
    if (h.persona) return h.persona;
    try {
      var a = await Datos.cargar(App.E.datos, 'ALUMNADO');
      return a.lista.filter(function (x) { return h.id ? x.id === h.id : U.normalizar(x.nombre) === U.normalizar(h.nombre); })[0] || null;
    } catch (e) { return null; }
  }

  function engancharFicha(caja) {
    var lista = hijosVistos;
    Array.prototype.forEach.call(caja.querySelectorAll('[data-hijo]'), function (b) {
      b.onclick = async function () {
        var alumno = await alumnoDeHijo(lista[parseInt(b.dataset.hijo, 10)]);
        if (!alumno) { U.aviso('Ese alumno ya no está en el RegAlum.csv.', 'ambar'); return; }
        var sel = document.getElementById('filtro-personas');
        if (sel && sel.value !== 'ALUMNADO') { sel.value = 'ALUMNADO'; await App.pintarPersonas(); }
        App.verFicha(alumno);
      };
    });
  }

  /* ---------- los asuntos de un tercero (abiertos y del ARCHIVO) ---------- */

  async function asuntosDe(categoria, texto) {
    var salida = [];
    var clave = U.normalizar(texto);
    (App.E.listaAbiertos || []).forEach(function (a) {
      var t = (a.ficha && a.ficha.tercero) || '';
      if ((t && t === texto) || (!t && U.normalizar(a.nombre).slice(-clave.length) === clave)) {
        salida.push({ nombre: a.nombre, donde: 'Abierto' });
      }
    });
    try {
      var cat = await App.E.archivo.getDirectoryHandle(categoria);
      var ter = await cat.getDirectoryHandle(texto);
      (await Carpetas.subcarpetas(ter)).forEach(function (c) { salida.push({ nombre: c.nombre, donde: 'Archivado' }); });
    } catch (e) { /* todavía no tiene carpeta en el archivo */ }
    salida.sort(function (a, b) { return a.nombre < b.nombre ? 1 : -1; });
    return salida;
  }

  /* Los tutores (de la categoría) de un alumno: los que lo tienen de hijo. */
  async function tutoresDelAlumno(alumno) {
    var fuente = await Datos.cargar(App.E.datos, CAT);
    var suyos = Datos.tutoresDe ? Datos.tutoresDe(alumno).map(claveDe) : [];
    return fuente.lista.filter(function (t) {
      if (suyos.indexOf(claveDe(t)) !== -1) return true;
      return (t.hijos || []).some(function (h) { return alumno.id && h.id === alumno.id; });
    });
  }

  /* El bloque «Asuntos de sus tutores» de la ficha del alumno. Sin
     ninguno, no sale. */
  async function asuntosDeSusTutores(alumno) {
    var tutores = await tutoresDelAlumno(alumno);
    var salida = [];
    for (var i = 0; i < tutores.length; i++) {
      var texto = Nombres.terceroTutor(tutores[i]);
      var suyos = await asuntosDe(CAT, texto);
      suyos.forEach(function (a) { a.tutor = tutores[i].nombreNatural || tutores[i].nombre; salida.push(a); });
    }
    return salida;
  }

  var turnoFicha = 0;
  async function pintarAsuntosDeSusTutores(p, caja) {
    if (!p || p.categoria !== 'ALUMNADO' || !App.E.datos) return;
    var turno = ++turnoFicha;
    var lista = [];
    try { lista = await asuntosDeSusTutores(p); } catch (e) { return; }
    if (turno !== turnoFicha || !lista.length || !caja.isConnected) return;
    var div = document.createElement('div');
    div.className = 'ficha-asuntos-tutores';
    div.innerHTML = '<div class="ficha-dato"><span>Asuntos de sus tutores</span><span>' + lista.map(function (a, i) {
      return (a.donde === 'Abierto'
        ? '<button type="button" class="enlace" data-asunto-tutor="' + i + '">' + U.escapar(a.nombre) + '</button>'
        : U.escapar(a.nombre)) + ' <span class="suave">(' + U.escapar(a.tutor + ' · ' + a.donde) + ')</span>';
    }).join('<br>') + '</span></div>';
    Array.prototype.forEach.call(div.querySelectorAll('[data-asunto-tutor]'), function (b) {
      b.onclick = function () {
        var a = lista[parseInt(b.dataset.asuntoTutor, 10)];
        if (!(window.Navegacion && Navegacion.abrirAbierto(a.nombre))) App.ir('abiertos');
      };
    });
    /* Fila 175: el ancla pasó a "Sus asuntos" (antes, "Ver sus asuntos",
       que ya no existe: esa lista sale sola). */
    var sitio = caja.querySelector('#ficha-persona-acciones') || caja.querySelector('#titulo-sus-asuntos');
    if (sitio) caja.insertBefore(div, sitio); else caja.appendChild(div);
  }

  /* ---------- los enganches ---------- */

  Datos.registrarFuente(CAT, cargar);

  if (window.Gestor && Gestor.alCrearAsunto) {
    Gestor.alCrearAsunto.push(function (nombre, datos, tercero) {
      if (!tercero || tercero.categoria !== CAT || !App.E.datos) return null;
      return guardar(App.E.datos, tercero);
    });
  }
  if (window.App && App.FICHAS_DE_CATEGORIA) App.FICHAS_DE_CATEGORIA[CAT] = { html: htmlFicha, enganchar: engancharFicha };
  if (window.App && App.trasPintarFicha) App.trasPintarFicha.push(pintarAsuntosDeSusTutores);

  return {
    CATEGORIA: CAT, FICHERO: FICHERO,
    cargar: cargar, unir: unir, guardar: guardar, pie: pie,
    hijosATexto: hijosATexto, hijosDeTexto: hijosDeTexto,
    tutoresDelAlumno: tutoresDelAlumno, asuntosDeSusTutores: asuntosDeSusTutores, asuntosDe: asuntosDe
  };
})();
window.TutoresLegales = TutoresLegales;
