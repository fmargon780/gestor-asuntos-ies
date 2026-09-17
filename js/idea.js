/* ============================================================
   idea.js — el usuario IdEA del profesorado, del PAS y de los
   tutores legales, leído por el título de la columna del CSV.

   La mensajería de Séneca no usa direcciones de correo: usa el
   usuario IdEA de la persona (docs/DESTINATARIOS-EN-SENECA.md, 1).
   El del profesorado y el del PAS ya viene en el CSV de personal; el
   del alumnado llegará en un fichero aparte (todavía sin importar).

   Mismo patrón que js/dni.js: se busca por el TÍTULO de la columna,
   nunca por su posición, porque Séneca no siempre saca la misma
   columna ni la llama siempre igual.

     - Vale un título que lleve "idea" o "usuario".
     - No vale un título que lleve "clave", "contraseña", "pin" o
       "correo".
     - Un título con "tutor", "padre", "madre", "responsable" o
       "familia" es el usuario del TUTOR legal, no el de la persona:
       se guarda aparte, en usuarioDelTutor(persona, 1|2).
     - El valor solo se acepta si parece un usuario: de 4 a 30
       caracteres, sin espacios y sin arroba (si trae ya la arroba
       delante, se le quita antes de comprobarlo).

   Este fichero no toca ninguna pantalla ni guarda nada en `_GESTOR`:
   el usuario IdEA sale siempre del CSV, como el DNI. Sin pantalla que
   envolver, tampoco hay que preocuparse del orden de carga respecto a
   js/datos.js: cualquier otro módulo llama a `window.IdEA` en tiempo
   de ejecución, no al cargar.
   ============================================================ */
(function () {

  var RE_BUENO = /idea|usuario/;
  var RE_MALO = /clave|contrasena|pin|correo/;
  var RE_TUTOR = /tutor|padre|madre|responsable|familia/;

  function esTituloDeUsuario(titulo) {
    var t = U.normalizar(titulo);
    return RE_BUENO.test(t) && !RE_MALO.test(t);
  }

  function esTituloDeTutor(titulo) {
    return RE_TUTOR.test(U.normalizar(titulo));
  }

  /* Mismo patrón que LoPide.datosDeTutor para distinguir "Tutor legal
     1" de "Tutor legal 2" por el título de la columna. */
  function esTituloDelNumero(titulo, numero) {
    var t = U.normalizar(titulo);
    return numero === 1
      ? /tutor.*\b0*1\b|\b0*1\b.*tutor|primer\s*tutor/.test(t)
      : /tutor.*\b0*2\b|\b0*2\b.*tutor|segundo\s*tutor/.test(t);
  }

  /* El valor solo se acepta si parece un usuario IdEA: de 4 a 30
     caracteres, sin espacios y sin arroba. Si trae ya la arroba
     delante, se le quita antes de comprobarlo. Cadena vacía si no
     parece un usuario. */
  function valorDeUsuario(bruto) {
    var v = String(bruto || '').trim();
    if (v.charAt(0) === '@') v = v.slice(1);
    if (v.length < 4 || v.length > 30) return '';
    if (/\s/.test(v) || v.indexOf('@') !== -1) return '';
    return v;
  }

  /* El usuario IdEA de la propia persona, tal y como viene escrito
     (sin la arroba). Cadena vacía si no consta.

     `p.campos` solo trae las columnas que traen algo: aquí basta con
     mirarlas (a diferencia de js/dni.js, no hace falta la cabecera
     del CSV para avisar de que falta, porque este módulo nunca
     avisa de nada que falte: fila 47 de docs/COLA.md, punto 1). */
  function usuarioDe(persona) {
    var campos = (persona && persona.campos) || {};
    var claves = Object.keys(campos);
    for (var i = 0; i < claves.length; i++) {
      var titulo = claves[i];
      if (esTituloDeTutor(titulo) || !esTituloDeUsuario(titulo)) continue;
      var valor = valorDeUsuario(campos[titulo]);
      if (valor) return valor;
    }
    return '';
  }

  /* El usuario IdEA del tutor legal 1 o 2, aparte del de la propia
     persona: nunca se mezclan. */
  function usuarioDelTutor(persona, numero) {
    var campos = (persona && persona.campos) || {};
    var claves = Object.keys(campos);
    for (var i = 0; i < claves.length; i++) {
      var titulo = claves[i];
      if (!esTituloDeTutor(titulo) || !esTituloDeUsuario(titulo)) continue;
      if (!esTituloDelNumero(titulo, numero)) continue;
      var valor = valorDeUsuario(campos[titulo]);
      if (valor) return valor;
    }
    return '';
  }

  /* De cada miembro se saca su usuario IdEA (nunca el de sus
     tutores); sin repetidos (comparando en minúsculas), como
     `combinarCorreosDeGrupo` hace con los correos. `persona` ya viene
     resuelta (o null si no se ha encontrado). */
  function usuariosDeGrupo(miembrosConPersona) {
    var usuarios = [], vistos = {}, sinUsuario = [];
    (miembrosConPersona || []).forEach(function (m) {
      var usuario = usuarioDe(m.persona);
      if (!usuario) { sinUsuario.push(m.nombre); return; }
      var clave = usuario.toLowerCase();
      if (vistos[clave]) return;
      vistos[clave] = true;
      usuarios.push(usuario);
    });
    return { usuarios: usuarios, sinUsuario: sinUsuario };
  }

  window.IdEA = {
    usuarioDe: usuarioDe,
    usuarioDelTutor: usuarioDelTutor,
    usuariosDeGrupo: usuariosDeGrupo
  };

})();
