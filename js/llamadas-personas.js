/* ============================================================
   llamadas-personas.js — a quién se puede llamar (o quién ha llamado) en «Apuntar llamada»
   (13-nov-2026, fila 639, docs/639-LLAMAR-POR-TELEFONO.md).

   Las personas del asunto de las que la app conoce un teléfono, cada una con su papel: el tercero, sus tutores legales
   (con «tiene la custodia» junto a quien la tiene), quien pide el asunto y los relacionados. Una persona con dos teléfonos,
   una línea por teléfono. Solo lee, de los mismos sitios de donde ya los saca la app: nunca falla (lo que no se pueda saber, no sale).
   Devuelve [{ nombre, papel, telefono (como se ve), copia (solo números), custodia }].
   ============================================================ */
var LlamadasPersonas = (function () {

  function norm(t) { return U.normalizar(String(t || '')); }
  function digitos(t) { return String(t || '').replace(/\D+/g, ''); }
  function legible(t) { return window.FichaTerceroAlumno && FichaTerceroAlumno.telefonoLegible ? FichaTerceroAlumno.telefonoLegible(t) : String(t || '').trim(); }
  function soloElNombre(t) { return String(t || '').replace(/\s+\S*\d\S*\s*$/, '').trim(); }

  /* Los teléfonos que trae una persona del Centro de datos (un alumno, un tutor, un miembro del personal…). */
  function telefonosDe(persona, categoria) {
    if (!persona) return [];
    if (categoria === 'ALUMNADO' && window.FichaTerceroAlumno && FichaTerceroAlumno.contactoDelAlumno) return FichaTerceroAlumno.contactoDelAlumno(persona).telefonos;
    var campos = persona.campos || {}, lista = [];
    Object.keys(campos).forEach(function (k) {
      if (!/telefono|movil/.test(norm(k))) return;
      var v = String(campos[k] || '').trim();
      if (v && !lista.some(function (x) { return digitos(x) === digitos(v); })) lista.push(v);
    });
    return lista;
  }

  function custodiaEscrita(a) {
    try {
      if (!window.DatosDelAsunto) return '';
      var c = DatosDelAsunto.camposDelAsunto(a).filter(function (x) { return DatosDelAsunto.esTutorConCustodia(x.nombre); })[0];
      return c ? DatosDelAsunto.valorGuardado(a, c.clave) : '';
    } catch (e) { return ''; }
  }

  /* Quién tiene la custodia (el nombre del tutor), con lo que dice el asunto y, si no, lo que dice Séneca. */
  function conCustodia(a, persona, tutores) {
    var nombres = tutores.map(function (t) { return t.nombre; }).filter(Boolean);
    var escrita = custodiaEscrita(a);
    var quien = window.CorreoPara && CorreoPara.custodiaDe ? CorreoPara.custodiaDe(nombres, escrita) : (nombres.length === 1 ? nombres[0] : '');
    if (!escrita && persona && Datos.custodiaDe) {
      var deSeneca = Datos.custodiaDe(persona, tutores);
      if (deSeneca.numeros.length) {
        var t = tutores.filter(function (x) { return deSeneca.numeros.indexOf(x.numero) !== -1; })[0];
        if (t) quien = t.nombre;
      } else if (deSeneca.sinTutor) quien = '';
    }
    return quien;
  }

  async function personasDe(a) {
    var lista = [], vistos = {};
    function poner(nombre, papel, tels, custodia, grupo) {
      (tels || []).forEach(function (t) {
        var k = norm(nombre) + '|' + digitos(t);
        if (!digitos(t) || vistos[k]) return;
        vistos[k] = true;
        lista.push({ nombre: nombre, papel: papel, telefono: legible(t), copia: digitos(t), custodia: !!custodia, grupo: grupo || '' });   /* fila 659: el grupo es lo que dice «A quién» de la tarea */
      });
    }
    var base = null;
    try { base = window.FichaTercero && a ? await FichaTercero.datosBasicos(a) : null; } catch (e) { base = null; }
    var persona = base && base.persona;
    try {
      if (persona) {
        var propio = soloElNombre(persona.nombre) || soloElNombre((a.ficha && a.ficha.tercero) || '');
        var papel = 'el tercero';
        if (base.categoria === 'ALUMNADO') {
          var sexo = window.FichaTerceroAlumno && FichaTerceroAlumno.sexoDelAlumno ? FichaTerceroAlumno.sexoDelAlumno(persona) : '';
          papel = sexo === 'M' ? 'la alumna' : 'el alumno';
        }
        var tels = telefonosDe(persona, base.categoria);
        if (!tels.length && base.resumen && base.resumen.telefono && base.resumen.telefono.valor && base.categoria !== 'ALUMNADO') tels = [base.resumen.telefono.valor];
        poner(propio, papel, tels, false, 'tercero');
        if (base.categoria === 'ALUMNADO' && window.Datos && Datos.tutoresDe) {
          var tutores = Datos.tutoresDe(persona);
          var custodia = conCustodia(a, persona, tutores);
          tutores.forEach(function (t) {
            var etiqueta = window.FichaTerceroAlumno && FichaTerceroAlumno.etiquetaDeTutor ? FichaTerceroAlumno.etiquetaDeTutor(t) : 'tutor legal';
            poner(t.nombre || etiqueta, String(t.relacion || etiqueta).toLowerCase(), t.telefonos, !!custodia && t.nombre === custodia, 'tutor');
          });
          /* Los teléfonos de familia que no cuelgan de ningún tutor («Teléfono del tutor» a secas): salen como «La familia». */
          var conocidos = lista.map(function (x) { return x.copia; });
          Object.keys(persona.campos || {}).forEach(function (k) {
            var n = norm(k), v = String(persona.campos[k] || '').trim();
            if (!/tutor|padre|madre|responsable|familia/.test(n) || !/telefono|movil/.test(n) || !digitos(v) || conocidos.indexOf(digitos(v)) !== -1) return;
            conocidos.push(digitos(v));
            poner('La familia', 'tutores legales', [v], false, 'tutor');
          });
        }
      }
    } catch (e1) { /* sin los datos del tercero, salen los demás */ }
    try {
      var lp = a && a.ficha && a.ficha.loPide;
      if (lp && window.LoPide) {
        var c = LoPide.contactoDe(a.ficha);
        if (c.telefono) poner(lp.nombre || 'Quien lo pide', 'quien lo pide', [c.telefono], false, 'tercero');   /* fila 659: quien pide el asunto es el tercero */
      }
    } catch (e2) { /* sin quien lo pide */ }
    try {
      var rel = (a && a.ficha && a.ficha.relacionados) || [];
      if (rel.length && window.CorreoGrupos) {
        var resueltos = await CorreoGrupos.resolverMiembros(rel);
        resueltos.forEach(function (m) {
          var r = rel.filter(function (x) { return x.nombre === m.nombre; })[0];
          poner(soloElNombre(m.nombre), 'relacionado', telefonosDe(m.persona, (r && r.categoria) || 'ALUMNADO'), false, 'relacionado');
        });
      }
    } catch (e3) { /* sin los relacionados */ }
    return lista;
  }

  /* Fila 659: la persona que propone «A quién» de una tarea de llamar (la clave de GuiasToca: tercero, tutor, relacionado, profesores):
     la primera de su grupo (de la familia, la que tiene la custodia si la hay). «Sus profesores» no tienen teléfono aquí: ninguna. -1 si no hay. */
  function proponerA(personas, aQuien) {
    var grupo = aQuien === 'tutor' ? 'tutor' : (aQuien === 'tercero' ? 'tercero' : (aQuien === 'relacionado' ? 'relacionado' : ''));
    if (!grupo) return -1;
    var idx = -1;
    personas.forEach(function (p, i) { if (idx === -1 && p.grupo === grupo && (grupo !== 'tutor' || p.custodia)) idx = i; });
    if (idx === -1) personas.forEach(function (p, i) { if (idx === -1 && p.grupo === grupo) idx = i; });
    return idx;
  }

  return { personasDe: personasDe, telefonosDe: telefonosDe, digitos: digitos, proponerA: proponerA };
})();
window.LlamadasPersonas = LlamadasPersonas;
