/* ============================================================
   tipo-del-nombre-al-dia.js — fila 408
   (docs/CAMBIAR-TIPO-RENOMBRA-Y-TRAE-GUIA.md).

   Un asunto cuyo tipo en la ficha no coincide con el tipo que lleva el
   nombre de su carpeta (el cambio de tipo solo llegó a la ficha) se pone
   al día al entrar en la aplicación:

   1. La carpeta se renombra con el tipo de la ficha. SOLO cambia el
      tipo: la fecha, el número (A26-…) y el resto del nombre se quedan
      como están. Por AsuntoRenombrar.mover, como al editar un asunto.
   2. La ficha guarda `guiaPorOfrecer: { de, a }`: la pregunta de traer la
      guía del tipo nuevo está pendiente. La marca va en la ficha, no en el
      ordenador: la primera persona que entre con permiso para cambiar
      asuntos recibe la pregunta (HitosCambioDeTipo.ofrecer); conteste lo
      que conteste, la marca se quita y no se pregunta a nadie más.

   Manda el tipo de la ficha. Un nombre corto cambiado en Ajustes después
   de crear la carpeta no cuenta (Nombres.leer ya lo reconoce como el
   mismo tipo), ni un tipo de la ficha que ya no existe en la lista.
   Una carpeta cuyo nombre nuevo chocaría con otra se deja como está y
   avisa en ámbar. En «solo consultar» no se toca nada.
   ============================================================ */
window.TipoDelNombreAlDia = (function () {

  var hecho = false;       /* una vez por entrada */
  var corriendo = false;

  function soloConsulta() { return !!(window.SoloConsulta && SoloConsulta.activo()); }
  function hayCuadroAbierto() {
    var capa = document.getElementById('capa');
    return !!capa && !capa.classList.contains('oculto');
  }

  function tipoDeLista(nombre) {
    return (App.E.tipos || []).filter(function (t) { return t.tipo === nombre; })[0] || null;
  }

  /* Los asuntos abiertos con otro tipo de verdad en la ficha que en el nombre. */
  function desajustados() {
    return (App.E.listaAbiertos || []).filter(function (a) {
      var f = a.ficha || {};
      var l = a.leido || {};
      return !!(f.tipo && l.reconocido && l.tipo && f.tipo !== l.tipo && tipoDeLista(f.tipo));
    });
  }

  /* El nombre de la carpeta con el tipo de la ficha y todo lo demás igual. */
  function nombreConTipoDeLaFicha(a) {
    var m = String(a.nombre).match(/^(\d{6})\s+(A\d{2}-\d{4}\s+)?/);
    var tipo = tipoDeLista(a.ficha.tipo);
    if (!m || !tipo || a.leido.resto === undefined) return '';
    return U.limpiarNombre(m[1] + ' ' + (m[2] || '') + Nombres.tipoParaCarpeta(tipo).toUpperCase() + ' ' + a.leido.resto);
  }

  /* Renombra uno. Devuelve 'renombrado' | 'igual' | 'choca' | 'fallo'. */
  async function ponerAlDiaUno(a) {
    var nuevo = nombreConTipoDeLaFicha(a);
    if (!nuevo || nuevo === a.nombre) return 'igual';
    var de = a.leido.tipo, aTipo = a.ficha.tipo;
    try {
      if (await Carpetas.existe(App.E.abiertos, nuevo)) {
        U.aviso('No he podido poner al día el tipo de «' + a.nombre + '»: ya hay otra carpeta que se llama «' + nuevo + '».', 'ambar');
        return 'choca';
      }
      (App.E.recienRenombrados = App.E.recienRenombrados || {})[a.nombre] = nuevo;
      await Carpetas.renombrar(App.E.abiertos, a.nombre, nuevo);
    } catch (e) {
      if (App.E.recienRenombrados) delete App.E.recienRenombrados[a.nombre];
      U.aviso('No he podido poner al día el tipo de «' + a.nombre + '»: ' + U.mensajeDeError(e), 'ambar');
      return 'fallo';
    }
    try {
      await AsuntoRenombrar.mover(a.nombre, nuevo, { guiaPorOfrecer: { de: de, a: aTipo } });
    } catch (e2) {
      U.aviso('La carpeta de «' + nuevo + '» ya tiene el tipo nuevo, pero no he podido mover su ficha. Pulsa Recargar y míralo: ' +
        U.mensajeDeError(e2), 'ambar');
      return 'fallo';
    }
    var r = window.Nombres && Nombres.cabeEnRuta ? Nombres.cabeEnRuta(nuevo, '', a.ficha.categoria) : { cabe: true };
    if (!r.cabe) U.aviso('«' + nuevo + '» no cabe en la ruta de Dropbox: acórtalo cuando puedas.', 'ambar');   /* igual que al editar: avisa, no impide */
    return 'renombrado';
  }

  /* La pregunta de la guía, asunto por asunto, a quien la reciba primero. */
  async function ofrecerGuias() {
    var pendientes = (App.E.listaAbiertos || []).filter(function (a) { return a.ficha && a.ficha.guiaPorOfrecer; });
    var preguntadas = 0;
    for (var i = 0; i < pendientes.length; i++) {
      var a = pendientes[i], g = a.ficha.guiaPorOfrecer;
      try {
        await HitosCambioDeTipo.ofrecer(a.nombre, g.de, g.a);
      } catch (e) {
        U.aviso('No he podido traer la guía de «' + a.nombre + '»: ' + U.mensajeDeError(e), 'ambar');
        continue;   /* la marca se queda: se vuelve a intentar */
      }
      preguntadas++;
      try { await App.anotar(a.nombre, { guiaPorOfrecer: null }); }
      catch (e2) { U.aviso('No he podido apuntar que ya se contestó en «' + a.nombre + '»: ' + U.mensajeDeError(e2), 'ambar'); }
    }
    return preguntadas;
  }

  async function ponerAlDia() {
    if (corriendo || soloConsulta() || !window.App || !App.E || !App.E.registro) return { renombrados: 0, preguntadas: 0 };
    corriendo = true;
    var r = { renombrados: 0, preguntadas: 0, chocan: 0 };
    try {
      var lista = desajustados();
      for (var i = 0; i < lista.length; i++) {
        var estado = await ponerAlDiaUno(lista[i]);
        if (estado === 'renombrado') r.renombrados++;
        if (estado === 'choca') r.chocan++;
      }
      if (r.renombrados) await App.verAbiertos();
      r.preguntadas = await ofrecerGuias();
      if (r.preguntadas) await App.verAbiertos();
    } finally { corriendo = false; }
    return r;
  }

  /* Una vez al entrar, cuando la lista ya está pintada y no hay ningún cuadro abierto. */
  function alRefrescar() {
    if (hecho || corriendo || soloConsulta() || hayCuadroAbierto()) return;
    if (!window.App || !App.E || !App.E.registro || !(App.E.listaAbiertos || []).length) return;
    hecho = true;
    setTimeout(function () { ponerAlDia().catch(function () { /* accesorio: a la próxima entrada */ }); }, 800);
  }
  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(alRefrescar);

  return { ponerAlDia: ponerAlDia, desajustados: desajustados, nombreConTipoDeLaFicha: nombreConTipoDeLaFicha,
           _reiniciar: function () { hecho = false; }, _darPorHecho: function () { hecho = true; } };   /* las pruebas */
})();
