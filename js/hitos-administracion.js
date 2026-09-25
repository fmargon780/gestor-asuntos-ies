/* ============================================================
   hitos-administracion.js — el responsable fijo «Administración»
   (25-sep-2026, fila 159, docs/RESPONSABLE-ADMINISTRACION.md).

   Un paso de una guía no es de una persona: es del puesto. Aquí:

     - `asegurar(responsables)`: «Administración» (id `administracion`,
       marca de Administración, `fijo`) va siempre la primera en
       `hitos.json › ajustes.responsables`. La llama
       `Hitos.normalizarAjustes` (js/hitos.js). En Ajustes › Hitos no se
       quita, ni se renombra, ni se le quita la marca (js/hitos-ajustes.js).
     - `esPersona(r)`: un responsable que es una persona del personal de
       Administración (Francisco, Diego): con la marca de Administración,
       que no es «Administración» ni un cargo (Dirección, Jefatura,
       Secretaría, Vicedirección).
     - `paraGuia(ajustes)`: lo que ofrece «Responsable por defecto» en el
       editor de una guía y de un modelo de la biblioteca:
       «Administración» y los demás responsables que no son personas (los
       papeles fijos los añade quien llama). En un asunto concreto siguen
       saliendo todos, personas incluidas («este paso lo llevo yo»).
     - Una sola vez (marca `_GESTOR/responsable-migrado.json`, fuera de
       los dieciocho): los pasos de `guias.json` y los modelos de
       `hitos-biblioteca.json` con una persona de responsable pasan a
       «Administración». Los hitos de los asuntos ya creados no se tocan.
       Y, en la biblioteca de hitos, «Firma de Secretaría» y «Visto bueno
       de Dirección» si no hay ya uno con ese título.
     - «Qué me toca» (`cuentaPara`): al filtrar por una persona salen
       sus hitos y los de «Administración»; por «Administración», solo
       esos.

   Se carga justo después de js/hitos.js.
   ============================================================ */
var HitosAdministracion = (function () {

  var ID = 'administracion';
  var NOMBRE = 'Administración';
  var MARCA = 'responsable-migrado.json';
  var CARGOS = ['direccion', 'jefatura', 'jefaturadeestudios', 'secretaria', 'vicedireccion'];
  /* Los dos hitos de la biblioteca del centro para los certificados que
     firma Secretaría con el visto bueno de Dirección
     (datos-biblioteca/biblioteca-centro.json). */
  var MODELOS_FIRMA = ['b-firma-secretaria', 'b-visto-bueno-direccion'];

  /* Mete en la biblioteca de hitos los modelos de `ids` que falten (ni
     por su id ni por su título). Lo usan la pasada única de aquí y
     js/cargar-biblioteca.js. Devuelve cuántos ha metido. */
  function faltanPorTitulo(biblioteca, candidatos) {
    var ids = {}, titulos = {};
    ((biblioteca && biblioteca.modelos) || []).forEach(function (m) { ids[m.id] = true; titulos[hueso(m.titulo)] = true; });
    return (candidatos || []).filter(function (m) { return !ids[m.id] && !titulos[hueso(m.titulo)]; });
  }

  async function anadirModelosDeFirma() {
    if (!window.HitosBiblioteca || !window.App || !App.leerFicheroDeLaApp) return 0;
    var datos = await App.leerFicheroDeLaApp('datos-biblioteca/biblioteca-centro.json', 'json');
    var candidatos = ((datos && datos.modelos) || []).filter(function (m) { return MODELOS_FIRMA.indexOf(m.id) !== -1; });
    var n = 0;
    await HitosBiblioteca.cambiar(function (d) {
      faltanPorTitulo(d, candidatos).forEach(function (m) { d.modelos.push(JSON.parse(JSON.stringify(m))); n++; });
      return d;
    });
    return n;
  }

  function hueso(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, ''); }

  function asegurar(responsables) {
    var lista = (responsables || []).filter(function (r) { return r.id !== ID; });
    return [{ id: ID, nombre: NOMBRE, clase: 'centro', administracion: true, fijo: true }].concat(lista);
  }

  function esCargo(r) { return CARGOS.indexOf(hueso(r.id)) !== -1 || CARGOS.indexOf(hueso(r.nombre)) !== -1; }

  function esPersona(r) { return !!(r && r.administracion && r.id !== ID && !esCargo(r)); }

  function paraGuia(ajustes) {
    return asegurar((ajustes && ajustes.responsables) || []).filter(function (r) { return !esPersona(r); });
  }

  /* ¿Este hito sale al filtrar «Qué me toca» por `filtro`? */
  function cuentaPara(idResponsable, filtro, ajustes) {
    if (!filtro) return true;
    if (idResponsable === filtro) return true;
    if (idResponsable !== ID) return false;
    var r = ((ajustes && ajustes.responsables) || []).filter(function (x) { return x.id === filtro; })[0];
    return esPersona(r);
  }

  /* ---------- una sola vez: las guías y la biblioteca, a Administración ---------- */

  function recorrerPasos(pasos, fn) {
    (pasos || []).forEach(function (p) {
      if (!p) return;
      fn(p);
      (p.opciones || []).forEach(function (o) { recorrerPasos(o && o.pasos, fn); });
    });
  }

  function enFila(fichero, fn) { return window.ColaGuardado ? ColaGuardado.poner(fichero, fn) : fn(); }

  var hecho = false, corriendo = false;

  async function hacer() {
    var g = window.Gestor && Gestor.carpetaGestor();
    if (!g || !window.Hitos) return null;
    if (await Carpetas.existeFichero(g, MARCA)) { hecho = true; return null; }
    var ajustes = (await Hitos.leer()).ajustes;
    var personas = {};
    (ajustes.responsables || []).forEach(function (r) { if (esPersona(r)) personas[r.id] = true; });
    var cuenta = { pasos: 0, modelos: 0 };
    function cambiar(p, clave) { if (p && personas[p.responsable]) { p.responsable = ID; cuenta[clave]++; } }

    await enFila('guias.json', async function () {
      var guias = (await Carpetas.leerJson(g, 'guias.json')) || {};
      Object.keys(guias).forEach(function (tipo) { recorrerPasos(guias[tipo], function (p) { cambiar(p, 'pasos'); }); });
      if (cuenta.pasos) await Copias.guardar(g, 'guias.json', guias);
    });
    if (cuenta.pasos && window.GuiasDelCentro && GuiasDelCentro.recargar) {
      try { await GuiasDelCentro.recargar(); } catch (e) { /* se relee al volver a entrar */ }
    }
    await enFila('hitos-biblioteca.json', async function () {
      var bib = await Carpetas.leerJson(g, 'hitos-biblioteca.json');
      var modelos = bib && (Array.isArray(bib) ? bib : bib.modelos);
      if (!Array.isArray(modelos)) return;
      modelos.forEach(function (m) { cambiar(m, 'modelos'); });
      if (cuenta.modelos) await Copias.guardar(g, 'hitos-biblioteca.json', bib);
    });
    try { cuenta.modelosDeFirma = await anadirModelosDeFirma(); } catch (e) { cuenta.modelosDeFirma = 0; }
    await Carpetas.guardarJson(g, MARCA, { hechoEl: U.ahora(), hechoPor: (window.App && App.E && App.E.usuario) || '',
      pasos: cuenta.pasos, modelos: cuenta.modelos, modelosDeFirma: cuenta.modelosDeFirma });
    hecho = true;
    return cuenta;
  }

  function intentar() {
    if (hecho || corriendo) return;
    if (!window.Gestor || !Gestor.carpetaGestor() || !window.App || !App.E || !App.E.listaAbiertos) return;
    corriendo = true;
    /* Un poco después de entrar, como js/reunir-migracion.js. */
    setTimeout(function () {
      hacer().catch(function (e) {
        U.accesorio('No he podido pasar las guías a «Administración» (se intentará al volver a entrar)', e);
        hecho = true;
      }).then(function () { corriendo = false; });
    }, 2500);
  }

  function enganchar() { if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(intentar); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
  else enganchar();

  return { ID: ID, NOMBRE: NOMBRE, MARCA: MARCA, asegurar: asegurar, esPersona: esPersona, esCargo: esCargo,
           paraGuia: paraGuia, cuentaPara: cuentaPara, hacer: hacer, MODELOS_FIRMA: MODELOS_FIRMA,
           faltanPorTitulo: faltanPorTitulo, anadirModelosDeFirma: anadirModelosDeFirma };
})();
window.HitosAdministracion = HitosAdministracion;
