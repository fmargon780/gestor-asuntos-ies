/* ============================================================
   destinatarios.js — una sola regla para «a quién se envía» (fila 132,
   24-sep-2026, docs/ARREGLOS-POR-DENTRO.md, punto 5).

   Hasta hoy decidían tres sitios por su cuenta: el cuadro de Correo
   (js/correo-cuadro.js), «Comunicar» desde un hito
   (js/hitos-comunicar.js, js/hito-mesa-comunicar.js) y los
   destinatarios de Séneca (js/seneca-destinatarios.js). Si cambiaba una
   regla, los otros no se enteraban. Aquí vive la regla común; cada sitio
   sigue pintando su propio cuadro como antes. Donde había diferencias,
   manda la del cuadro de Correo (apuntado en docs/HISTORIA.md).

   - `correosDe(persona)`: todas las direcciones de su ficha, vengan en
     la columna que vengan (se buscan por la arroba), sin repetir.
   - `posibles(persona, preferente)`: esas direcciones con su marca de si
     van por defecto: con «Lo pide» (o la dirección de un hito), solo esa
     (y si no está en la ficha, va en «otro»); sin ella, todas.
   - `delGrupo(miembrosConPersona)`: las direcciones de un grupo (van en
     copia oculta) y quién no tiene ninguna.
   - `miembrosDeOpcion(valor)`: quiénes son los miembros de una opción
     del desplegable «Añadir un grupo», ya con su ficha (Correo y Séneca).
   - `deHito(responsable, datos)`: a quién va el «Comunicar» de un hito.

   Se carga antes de js/correo.js, js/correo-cuadro.js,
   js/seneca-destinatarios.js y js/hitos-comunicar.js.
   ============================================================ */
var Destinatarios = (function () {

  var RE_CORREO = /[^\s,;<>()"]+@[^\s,;<>()"]+\.[A-Za-z]{2,}/g;

  function correosDe(persona) {
    var salida = [], vistos = {};
    if (!persona) return salida;
    Object.keys(persona.campos || {}).forEach(function (columna) {
      var trozos = String(persona.campos[columna] || '').match(RE_CORREO);
      if (!trozos) return;
      trozos.forEach(function (dir) {
        var clave = dir.toLowerCase();
        if (vistos[clave]) return;
        vistos[clave] = true;
        salida.push({ titulo: columna, dir: dir });
      });
    });
    return salida;
  }

  function direccionesDe(persona) {
    return correosDe(persona).map(function (c) { return c.dir; });
  }

  /* { lista: [{ titulo, dir, porDefecto }], otro } */
  function posibles(persona, preferente, elegidosDeAntes) {
    var correos = correosDe(persona);
    var elegidos;
    var otro = '';
    if (window.LoPide && LoPide.elegirDestinatarios) {
      var r = LoPide.elegirDestinatarios(correos, preferente || '', elegidosDeAntes || {});
      elegidos = r.elegidos;
      otro = r.otro;
    } else {
      elegidos = Object.assign({}, elegidosDeAntes || {});
      correos.forEach(function (c) { if (elegidos[c.dir] === undefined) elegidos[c.dir] = true; });
    }
    return {
      lista: correos.map(function (c) { return { titulo: c.titulo, dir: c.dir, porDefecto: !!elegidos[c.dir] }; }),
      elegidos: elegidos,
      otro: otro
    };
  }

  /* De cada miembro, TODOS sus correos (un alumno puede traer el de los
     dos tutores). `persona` ya viene resuelta (o null). */
  function delGrupo(miembrosConPersona) {
    var direcciones = [], vistos = {}, sinCorreo = [];
    (miembrosConPersona || []).forEach(function (m) {
      var correos = correosDe(m.persona);
      if (!correos.length) { sinCorreo.push(m.nombre); return; }
      correos.forEach(function (c) {
        var clave = c.dir.toLowerCase();
        if (vistos[clave]) return;
        vistos[clave] = true;
        direcciones.push(c.dir);
      });
    });
    return { direcciones: direcciones, sinCorreo: sinCorreo };
  }

  async function miembrosDeOpcion(valor) {
    if (!valor || !window.CorreoGrupos) return [];
    var miembros;
    try { miembros = await CorreoGrupos.miembrosDeOpcion(valor); } catch (e) { miembros = []; }
    if (!miembros || !miembros.length) return [];
    return CorreoGrupos.resolverMiembros(miembros);
  }

  /* A quién va el «Comunicar» de un hito, según su responsable. `datos`:
     { nombreTercero, persona (la ficha del alumno, para el tutor),
       relacionados, relacionadosResueltos }. Devuelve { nombre, correoPreferente }. */
  function deHito(responsable, datos) {
    var d = datos || {};
    if (responsable === 'tutor') {
      if (d.persona && window.LoPide && LoPide.datosDeTutor) {
        var t1 = LoPide.datosDeTutor(d.persona.campos, 1);
        if (t1.correo || t1.nombre) return { nombre: t1.nombre || 'el tutor legal 1', correoPreferente: t1.correo };
        var t2 = LoPide.datosDeTutor(d.persona.campos, 2);
        if (t2.correo || t2.nombre) return { nombre: t2.nombre || 'el tutor legal 2', correoPreferente: t2.correo };
      }
      return { nombre: 'el tutor', correoPreferente: '' };
    }
    if (responsable === 'relacionado') {
      var relacionados = d.relacionados || [];
      if (!relacionados.length) return { nombre: d.nombreTercero || '', correoPreferente: '' };
      return {
        nombre: relacionados.map(function (r) { return r.nombre; }).join(', '),
        correoPreferente: delGrupo(d.relacionadosResueltos || []).direcciones.join(', ')
      };
    }
    /* Responsable del centro, o sin responsable: el tercero del asunto. */
    return { nombre: d.nombreTercero || '', correoPreferente: '' };
  }

  return {
    RE_CORREO: RE_CORREO, correosDe: correosDe, direccionesDe: direccionesDe, posibles: posibles,
    delGrupo: delGrupo, miembrosDeOpcion: miembrosDeOpcion, deHito: deHito
  };
})();
window.Destinatarios = Destinatarios;
