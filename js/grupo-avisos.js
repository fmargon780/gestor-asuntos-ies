/* ============================================================
   grupo-avisos.js — «Enviar un aviso…»: un correo a cada persona del grupo, con su nombre, sin
   documento adjunto (fila 295, docs/TRABAJO-EN-BLOQUE-ENVIAR-A-TODOS.md, apartado 5).

   Usa la misma pantalla que «Enviar…» (js/grupo-enviar-pantalla.js, sin adjunto) y la misma tanda
   (js/grupo-enviar.js). Aquí solo está lo propio del aviso:
     - cada aviso queda en `ficha.avisosEnBloque` ({ id, asunto, cuando, quien, texto }); el texto se
       guarda una vez para poder «Seguir enviando» al día siguiente sin escribirlo otra vez;
     - sus envíos van a `ficha.enviosPorPersona` con `aviso: <id>` en vez de `documento`;
     - en la tabla es un trabajo más del desplegable «Qué se mira» («Aviso: <asunto> · 9-oct-2026»).
   ============================================================ */
var GrupoAvisos = (function () {

  /* Apunta un aviso nuevo en la ficha y devuelve su id. */
  async function registrar(a, asunto, texto) {
    var id = 'av' + Date.now().toString(36);
    await GrupoEnviar.cambiarFicha(a, function (f) {
      (f.avisosEnBloque = f.avisosEnBloque || []).push({ id: id, asunto: String(asunto || '').trim(), cuando: U.ahora(), quien: App.E.usuario || '', texto: texto || '' });
    });
    return id;
  }

  function deLaFicha(a) { return GrupoEnviar.fichaDe(a).avisosEnBloque || []; }

  /* Abre la pantalla para un aviso nuevo (o, con `id`, para seguir con uno que quedó a medias). */
  function abrir(a, id, conRegistro) {
    return GrupoEnviarPantalla.abrir(a, id ? { trabajo: 'aviso:' + id, conRegistro: conRegistro } : { aviso: true, conRegistro: conRegistro });
  }

  return { registrar: registrar, deLaFicha: deLaFicha, abrir: abrir };
})();
window.GrupoAvisos = GrupoAvisos;
