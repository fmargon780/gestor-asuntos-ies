/* ============================================================
   usuarios.js — la lista de nombres de quien entra (19-sep-2026, fila
   72, docs/DETALLES-DE-MANTENIMIENTO.md, punto 2).

   Al entrar se escribía un nombre en un campo de texto libre, sin
   lista ni comprobación. Ese nombre queda escrito para siempre en
   cada nota, en cada línea de historial de hito y en la señal de
   presencia: "Francisco", "francisco" y "Francisco M." quedaban como
   tres personas distintas.

   Se guarda en `_GESTOR/usuarios.json`, compartido con el resto de
   ordenadores, igual que `grupos.json` o `tipos.json`. **No** se
   tocan los nombres ya escritos en notas e historiales: eso es
   historia y no se reescribe, esto solo evita que el problema siga
   creciendo.
   ============================================================ */
var Usuarios = (function () {

  var FICHERO = 'usuarios.json';

  /* La lista de nombres, o vacía si el fichero no existe todavía o no
     se puede leer (primera vez, o sin permiso). */
  async function cargar(gestor) {
    var leido = null;
    try { leido = await Carpetas.leerJson(gestor, FICHERO); } catch (e) { leido = null; }
    return (leido && Array.isArray(leido.nombres)) ? leido.nombres.slice() : [];
  }

  /* Añade un nombre si no estaba ya, con comparación exacta a
     propósito: unificar "Francisco" y "francisco" a mano sería
     adivinar cuál de los dos es el bueno, y no es lo que pide esta
     fila. Nunca impide entrar: un fallo aquí se traga, la sesión
     sigue igual que si esto no existiera. */
  async function anadirSiHaceFalta(gestor, nombre) {
    var limpio = String(nombre || '').trim();
    if (!limpio || !gestor) return;
    try {
      var actual = await cargar(gestor);
      if (actual.indexOf(limpio) !== -1) return;
      actual.push(limpio);
      await Copias.guardar(gestor, FICHERO, { nombres: actual });
    } catch (e) { /* no pasa nada: el nombre ya ha entrado en la sesión */ }
  }

  return { FICHERO: FICHERO, cargar: cargar, anadirSiHaceFalta: anadirSiHaceFalta };
})();
