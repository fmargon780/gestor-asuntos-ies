/* ============================================================
   grupo-enviar.js — enviar a todas las personas del grupo de una vez (fila 295,
   docs/TRABAJO-EN-BLOQUE-ENVIAR-A-TODOS.md). La pantalla está en js/grupo-enviar-pantalla.js;
   los avisos sin documento, en js/grupo-avisos.js. Aquí vive lo que no se ve:

     - a quién se puede enviar (`clasificar`, sin efectos): con su documento (y su registro, si el
       trabajo lleva registro), sin enviar ya, y con alguna dirección; en listas aparte, quien no
       tiene correo, quien ya lo tiene y quien aún no está registrado;
     - el correo de cada una (`cuerpoPara`: saludo, texto con sus huecos y firma) y el `idEnvio`
       fijo (`idEnvioDe`: asunto, documento o aviso y PERSONA, no dirección);
     - la tanda (`enviarTanda`): de una en una, un correo por persona con todas sus direcciones en
       «Para»; cada envío bueno se apunta en `ficha.enviosPorPersona` (cada diez y al terminar);
       un fallo suelto sigue con las demás; el tope diario de Google, o tres fallos seguidos, paran
       la tanda y dejan `ficha.envioPendiente`; un solo PDF `CORREO` por tanda; cuando todas las
       que tienen correo tienen su envío, la tarea de comunicar del hito actual.
   Lo que valía de «Enviar a cada uno» (js/generar-para-relacionados.js) se mudó aquí.
   ============================================================ */
var GrupoEnviar = (function () {

  var TOPE_DE_GOOGLE = /too many times|demasiadas veces|limit/i;
  var RE_FAMILIA = /tutor|famil|padre|madre/;
  var fallos = {};       /* por asunto: persona -> motivo del último fallo («No ha salido») */
  var marchando = {};    /* por asunto: hay una tanda en marcha */

  function fichaDe(a) {
    var viva = a && window.App && App.E && App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[a.nombre];
    return viva || (a && a.ficha) || {};
  }
  function clave(r) { return r.categoria + '|' + r.nombre; }
  function esAviso(trabajo) { return String(trabajo || '').indexOf('aviso:') === 0; }
  function soloElNombre(t) { return String(t || '').replace(/\s+\S*\d\S*\s*$/, '').trim(); }
  function enMarcha(a) { return !!(a && marchando[a.nombre]); }
  function fallosDe(a) { return (a && fallos[a.nombre]) || {}; }

  /* ---------- a quién ---------- */

  /* Las direcciones de una persona. Solo con alumnado se elige: el alumno (las que no son de tutor),
     la familia (las de tutor) o todas las de su ficha (`Destinatarios.correosDe`, la regla de siempre). */
  function direccionesDe(persona, categoria, aQuien) {
    var todas = Destinatarios.correosDe(persona);
    if (categoria === 'ALUMNADO' && (aQuien === 'alumno' || aQuien === 'familia')) {
      todas = todas.filter(function (c) { return RE_FAMILIA.test(U.normalizar(c.titulo)) === (aQuien === 'familia'); });
    }
    return todas.map(function (c) { return c.dir; });
  }

  /* Las fichas de las personas del grupo (por categoría|nombre), con las listas de siempre. */
  async function cargarPersonas(est) {
    var salida = {}, porCategoria = {};
    est.personas.forEach(function (p) { (porCategoria[p.categoria] = porCategoria[p.categoria] || []).push(p); });
    for (var cat in porCategoria) {
      var indice = {};
      try {
        var fuente = App.E.datos ? await Datos.cargar(App.E.datos, cat) : null;
        if (fuente) fuente.lista.forEach(function (x) { indice[App.textoTercero(x)] = x; });
      } catch (e) { indice = {}; }
      porCategoria[cat].forEach(function (p) { salida[clave(p)] = indice[p.nombre] || null; });
    }
    return salida;
  }

  /* PURA. { envian: [{ i, persona, hecho, correos }], sinCorreo, yaEnviado, sinRegistrar } del trabajo.
     ctx: { personas: { categoria|nombre -> ficha }, aQuien, registro }. */
  function clasificar(est, trabajo, ctx) {
    var c = { envian: [], sinCorreo: [], yaEnviado: [], sinRegistrar: [] };
    var aviso = esAviso(trabajo);
    est.personas.forEach(function (p, i) {
      var h = p.hechos[trabajo] || null;
      if (aviso) { if (h && h.enviado) { c.yaEnviado.push(p); return; } }
      else {
        if (!h || !h.generado) return;
        if (h.enviado) { c.yaEnviado.push(p); return; }
        if (ctx.registro && !h.registrado.length) { c.sinRegistrar.push(p); return; }
      }
      var correos = direccionesDe(ctx.personas[clave(p)], p.categoria, ctx.aQuien);
      if (!correos.length) { c.sinCorreo.push(p); return; }
      c.envian.push({ i: i, persona: p, hecho: h, correos: correos });
    });
    return c;
  }

  /* A cuántas se puede enviar ahora (lo que dice el botón «Enviar… (28)»). */
  async function contar(a, est, trabajo, registro) {
    if (!trabajo || !est.personas.length) return 0;
    var personas = await cargarPersonas(est);
    return clasificar(est, trabajo, { personas: personas, aQuien: 'todas', registro: registro }).envian.length;
  }

  /* ---------- el correo de cada una ---------- */

  /* Un identificador fijo por asunto, documento (o aviso) y PERSONA: el mismo documento no sale dos veces
     para la misma persona aunque se le cambie el correo o se pulse otra vez (js/correo-enviar.js, fila 130). */
  function idEnvioDe(a, que, persona) {
    var t = a.nombre + '|' + que + '|' + String(persona).toLowerCase();
    var h = 0;
    for (var i = 0; i < t.length; i++) { h = ((h << 5) - h + t.charCodeAt(i)) | 0; }
    return 'env-gr-' + (h >>> 0).toString(36) + '-' + t.length.toString(36);
  }

  function saludoPara(rel, valores) {
    var natural = (valores && valores.nombreNatural) || soloElNombre(rel.nombre);
    return rel.categoria === 'EMPRESAS' || rel.categoria === 'ADMINISTRACIONES' ? 'Buenos días:' : 'Hola, ' + natural + ':';
  }

  /* El texto, con los huecos de la persona rellenos; el saludo y la firma, como siempre. */
  function cuerpoPara(rel, valores, texto) {
    var medio = Plantillas.rellenar(texto || '', valores || {}).texto;
    return saludoPara(rel, valores) + '\n\n' + medio + '\n\n' + ((valores && valores.firma) || '');
  }

  async function valoresDe(a, rel) {
    try { return await Plantillas.valoresDePersona(a, rel, { fecha: U.hoyIso() }); }
    catch (e) { return { nombreNatural: soloElNombre(rel.nombre), firma: '' }; }
  }

  /* La plantilla de correo propia del tipo (la que se llama «certificado» o «envío», o la primera). */
  function plantillaPropia(lista) {
    return (lista || []).filter(function (p) { return /certificado|env[ií]o/i.test(p.nombre); })[0] || (lista || [])[0] || null;
  }

  /* ---------- apuntar en la ficha ---------- */

  async function cambiarFicha(a, fn) {
    await App.guardarRegistroFresco(async function (registro) {
      await App.comprobarNoCerrado(a.nombre);
      var f = registro.asuntos[a.nombre] || (registro.asuntos[a.nombre] = {});
      fn(f);
    });
  }

  /* Los envíos buenos, a la ficha: de una vez, sin repetir (persona + documento o aviso). */
  async function volcar(a, envios) {
    if (!envios.length) return;
    await cambiarFicha(a, function (f) {
      var lista = f.enviosPorPersona || [];
      var hay = {};
      lista.forEach(function (e) { hay[e.persona + '|' + (e.aviso || e.documento)] = true; });
      envios.forEach(function (e) { if (!hay[e.persona + '|' + (e.aviso || e.documento)]) lista.push(e); });
      f.enviosPorPersona = lista;
    });
  }

  /* ---------- la tanda ---------- */

  function motivoDe(r, e) {
    if (e) return U.mensajeDeError(e);
    return (r && r.motivo) || 'El envío no ha salido bien.';
  }

  /* lote: { trabajo, aviso: id|'', asunto, texto, tanda, items: [{ rel, correos, nombreDoc }] }.
     cb: { avanzar(i, total), parado() }. Devuelve { enviados, fallos, parado, tope, quedan }. */
  async function enviarTanda(a, lote, cb) {
    var res = { enviados: [], fallos: [], parado: false, tope: '', quedan: 0 };
    var sinGuardar = [], seguidos = 0, total = lote.items.length;
    marchando[a.nombre] = true;
    fallos[a.nombre] = fallos[a.nombre] || {};
    try {
      for (var i = 0; i < total; i++) {
        if (cb.parado()) { res.parado = true; break; }
        cb.avanzar(i + 1, total);
        var x = lote.items[i];
        try {
          var valores = await valoresDe(a, x.rel);
          var adjuntos = [];
          if (x.nombreDoc) {
            var fichero = await (await a.handle.getFileHandle(x.nombreDoc)).getFile();
            adjuntos.push({ nombre: x.nombreDoc, tipo: fichero.type || 'application/pdf', base64: await CorreoAdjuntos.aBase64(fichero) });
          }
          var r = await CorreoEnviar.enviar({
            para: x.correos.join(', '), cco: '', asunto: lote.asunto, cuerpo: cuerpoPara(x.rel, valores, lote.texto), hilo: '',
            adjuntos: adjuntos, idEnvio: idEnvioDe(a, lote.aviso ? 'aviso:' + lote.aviso : x.nombreDoc, clave(x.rel))
          });
          if (!r || !r.ok) throw new Error(motivoDe(r));
          var apunte = { persona: clave(x.rel), correo: x.correos.join(', '), cuando: U.ahora(), quien: App.E.usuario || '', tanda: lote.tanda };
          if (lote.aviso) apunte.aviso = lote.aviso; else apunte.documento = x.nombreDoc;
          res.enviados.push(apunte);
          sinGuardar.push(apunte);
          delete fallos[a.nombre][clave(x.rel)];
          seguidos = 0;
          if (sinGuardar.length >= 10) { await volcar(a, sinGuardar); sinGuardar = []; }
        } catch (e) {
          var motivo = motivoDe(null, e);
          res.fallos.push({ rel: x.rel, motivo: motivo });
          fallos[a.nombre][clave(x.rel)] = motivo;
          seguidos++;
          if (TOPE_DE_GOOGLE.test(motivo)) { res.tope = 'google'; break; }
          if (seguidos >= 3) { res.tope = 'seguidos'; break; }
        }
      }
      try { await volcar(a, sinGuardar); }
      catch (eVolcar) { U.accesorio('Enviados, pero no he podido apuntarlos en el asunto', eVolcar); }
    } finally { delete marchando[a.nombre]; }
    res.quedan = total - res.enviados.length;
    return res;
  }

  /* ---------- lo de después de la tanda ---------- */

  /* Un solo PDF `CORREO` por tanda: el texto de muestra y, debajo, las personas con su dirección, fecha y hora. */
  async function pdfDeLaTanda(a, lote, enviados, muestra) {
    function dos(n) { return (n < 10 ? '0' : '') + n; }
    function hora(c) { var d = new Date(c); return dos(d.getDate()) + '/' + dos(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + dos(d.getHours()) + ':' + dos(d.getMinutes()); }
    var lista = enviados.map(function (e) { return '· ' + soloElNombre(e.persona.slice(e.persona.indexOf('|') + 1)) + ' — ' + e.correo + ' — ' + hora(e.cuando); }).join('\n');
    return CorreoEnviadoPdf.guardar(a, {
      para: '(un correo a cada persona; abajo, la lista)', cco: '', asunto: lote.asunto,
      cuerpo: muestra + '\n\n— — —\nEnviado a ' + enviados.length + (enviados.length === 1 ? ' persona:' : ' personas:') + '\n' + lista,
      adjuntos: []
    }, null);
  }

  /* Tras la tanda: PDF, nota, «envío pendiente» y, si ya tienen todas su envío, la tarea de comunicar. */
  async function cerrarTanda(a, lote, res, muestra, quedanPorEnviar) {
    if (res.enviados.length) {
      var pdf = '';
      try { pdf = await pdfDeLaTanda(a, lote, res.enviados, muestra); }
      catch (e) { U.accesorio('Los correos han salido, pero no he podido guardar su PDF', e); }
      if (window.CorreoEnviadoPdf && pdf) CorreoEnviadoPdf.repintar && CorreoEnviadoPdf.repintar(a);
      try {
        await cambiarFicha(a, function (f) { if (pdf) (f.tandasDeEnvio = f.tandasDeEnvio || []).push({ id: lote.tanda, pdf: pdf }); });
        if (window.Notas) {
          var n = res.enviados.length;
          await Notas.anadirAuto(a, lote.aviso ? 'Aviso «' + lote.asunto + '» enviado a ' + n + (n === 1 ? ' persona.' : ' personas.')
            : 'Enviado a ' + n + (n === 1 ? ' persona' : ' personas') + ', cada una con su documento.');
        }
      } catch (e2) { U.accesorio('Enviados, pero no he podido apuntarlo en el asunto', e2); }
    }
    try {
      await cambiarFicha(a, function (f) {
        if (res.tope) f.envioPendiente = { trabajo: lote.trabajo, cuantos: quedanPorEnviar, cuando: U.ahora() };
        else if (!quedanPorEnviar) delete f.envioPendiente;
      });
    } catch (e3) { U.accesorio('No he podido apuntar lo que queda por enviar', e3); }
    if (!res.tope && !res.fallos.length && !res.parado && !quedanPorEnviar && window.Hitos && Hitos.marcarGuionPorAccion) {
      var h = window.PersonasDelGrupo ? PersonasDelGrupo.hitoActual(a) : null;
      if (h) await Hitos.marcarGuionPorAccion(a, h.id, 'comunicar');
    }
    if (window.GrupoEnviar) avisar();
  }

  /* El texto de «Quedan 140 por enviar» cuando se para. */
  function textoDeParada(res, quedan) {
    if (res.tope === 'google') return 'Google no deja enviar más por hoy. Quedan ' + quedan + ' por enviar. Mañana, pulsa «Seguir enviando».';
    return 'Han fallado tres envíos seguidos y paro aquí. Quedan ' + quedan + ' por enviar. Cuando quieras, pulsa «Seguir enviando».';
  }

  /* ---------- Inicio: «N envíos por terminar» ---------- */

  function avisar() {
    if (!window.AvisosLinea || !window.App || !App.E || !App.E.registro) return;
    try {
      var abiertos = (App.E.listaAbiertos || []).filter(function (a) {
        var f = (App.E.registro.asuntos || {})[a.nombre];
        return f && f.envioPendiente;
      });
      AvisosLinea.registrar('envios-pendientes', abiertos.length ? abiertos.length + (abiertos.length === 1 ? ' envío por terminar' : ' envíos por terminar') : '', false, null, abiertos);
    } catch (e) { /* un aviso de más o de menos, nunca un error */ }
  }
  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(avisar);

  /* ¿Se puede enviar desde aquí? No en solo consulta ni con el compañero al mando del asunto. */
  function puedeEnviar(a) {
    if (window.SoloConsulta && SoloConsulta.activo()) return false;
    if (window.Presencia && Presencia.ocupantePor && Presencia.ocupantePor(a.nombre)) return false;
    return true;
  }

  return {
    clasificar: clasificar, contar: contar, cargarPersonas: cargarPersonas, direccionesDe: direccionesDe,
    idEnvioDe: idEnvioDe, cuerpoPara: cuerpoPara, saludoPara: saludoPara, valoresDe: valoresDe, plantillaPropia: plantillaPropia,
    enviarTanda: enviarTanda, cerrarTanda: cerrarTanda, textoDeParada: textoDeParada,
    fallosDe: fallosDe, enMarcha: enMarcha, esAviso: esAviso, fichaDe: fichaDe, soloElNombre: soloElNombre,
    cambiarFicha: cambiarFicha, avisar: avisar, puedeEnviar: puedeEnviar
  };
})();
window.GrupoEnviar = GrupoEnviar;
