/* ============================================================
   problemas-textos.js — los textos de cada tarjeta de «Problemas»
   (fila 291, docs/PROBLEMAS-CON-SU-SOLUCION.md).

   Solo frases, con las palabras de docs/VOCABULARIO.md. Cada función
   devuelve la descripción de una tarjeta SIN los botones que hacen
   algo: el módulo que detecta el problema le pone `alPulsar` a cada
   acción, en el mismo orden (`Problemas.registrar`, js/problemas.js).
   Un título nunca lleva «huérfano», «ficha sin carpeta», «envoltura»,
   «json» ni el nombre de un fichero.
   ============================================================ */
var ProblemasTextos = (function () {

  var NO_SE_SABE = 'No se sabe por qué; no es por nada que hayas hecho.';
  var QUIEN = 'Esto lo hace quien montó la aplicación.';

  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  function diasDeCopias() {
    try { return window.Copias && Copias.diasCaducidad ? Copias.diasCaducidad() : 90; } catch (e) { return 90; }
  }

  /* a) El fichero de alumnado. `estado`: { falta } o { dias }. */
  function alumnado(estado) {
    var falta = !!estado.falta;
    return {
      titulo: falta ? 'Falta el fichero de alumnado' : 'El fichero de alumnado tiene ' + plural(estado.dias, 'día', 'días'),
      que: falta ? 'No se puede buscar alumnado ni ver su contacto.'
        : 'Los datos de contacto del alumnado y de sus familias pueden estar anticuados.',
      porque: 'El fichero se baja de Séneca a mano y en esta época del curso cambia a menudo.',
      urgente: falta,
      acciones: [
        { texto: 'Traer el alumnado', normal: true, cambia: false, id: 'problema-alumnado-traer',
          explica: 'Abre Herramientas, donde se sube el fichero nuevo.' },
        { texto: 'Ya lo he bajado, vuelve a mirar', cambia: false, id: 'problema-alumnado-mirar',
          explica: 'Comprueba otra vez la fecha del fichero.' }
      ]
    };
  }

  /* b) Asuntos que han perdido su carpeta. `elementos`: [{ nombre, detalle }] */
  function carpetas(elementos) {
    var n = elementos.length;
    var dias = diasDeCopias();
    return {
      titulo: n === 1 ? '1 asunto ha perdido su carpeta' : n + ' asuntos han perdido su carpeta',
      que: 'La app tiene apuntado el asunto, pero no encuentra su carpeta en Dropbox.',
      porque: 'Alguien cambió el nombre de la carpeta o la movió a mano, fuera de la app.',
      antes: 'Asunto por asunto:',
      elementos: elementos.map(function (e) {
        return {
          nombre: e.nombre, detalle: e.detalle,
          acciones: [
            { texto: 'Buscar su carpeta', normal: true,
              explica: 'Eliges la carpeta que es ahora la suya. El asunto queda como estaba, con sus hitos y sus notas.' },
            { texto: 'El asunto ya no existe', peligro: true,
              explica: 'Se quita de la lista. Queda en las copias de seguridad durante ' + plural(dias, 'día', 'días') + ', por si era un error.' }
          ]
        };
      })
    };
  }

  /* c) Hitos de asuntos que ya no existen. `elementos`: [{ nombre, detalle }] */
  function hitos(elementos) {
    var n = elementos.length;
    var dias = diasDeCopias();
    return {
      titulo: n === 1 ? 'Hay hitos guardados de 1 asunto que ya no existe con ese nombre'
        : 'Hay hitos guardados de ' + n + ' asuntos que ya no existen con ese nombre',
      que: 'La app guarda los hitos de cada asunto junto al nombre de su carpeta. Estos nombres ya no corresponden a ninguna carpeta.',
      porque: 'El asunto cambió de nombre hace tiempo, o su carpeta se movió a mano.',
      antes: 'Por cada nombre:',
      elementos: elementos.map(function (e) {
        return {
          nombre: e.nombre, detalle: e.detalle,
          acciones: [
            { texto: 'Son de este asunto…', normal: true,
              explica: 'Eliges el asunto al que pertenecen. Los hitos pasan a él.' },
            { texto: 'Quitar', peligro: true,
              explica: 'Quita esos hitos. Quedan en las copias de seguridad durante ' + plural(dias, 'día', 'días') + '.' }
          ]
        };
      })
    };
  }

  /* d) Dos ordenadores guardaron a la vez. `elementos`: [{ nombre, detalle, fila }] */
  function conflictos(elementos) {
    var n = elementos.length;
    return {
      titulo: n === 1 ? '1 cosa se guardó a la vez en dos ordenadores' : n + ' cosas se guardaron a la vez en dos ordenadores',
      que: 'Dropbox ha guardado dos versiones y la app no ha podido unirlas sola.',
      porque: 'Dos personas cambiaron lo mismo casi en el mismo momento.',
      antes: 'Una por una:',
      elementos: elementos.map(function (e) {
        return {
          nombre: e.nombre, detalle: e.detalle, queCambia: e.queCambia || undefined,
          acciones: e.igual ? [
            { texto: 'Resolver', explica: 'Se queda la de este ordenador. La otra se guarda en las copias de seguridad.' }
          ] : e.fila ? [
            { texto: 'Dejar los de este ordenador', explica: 'Se quedan los datos de este ordenador. Los del otro quedan en las copias de seguridad.' },
            { texto: 'Quedarse con los del otro', explica: 'Se guardan los datos del otro ordenador para esta persona.' }
          ] : [
            { texto: 'Quedarse con el de este ordenador', explica: 'Se queda lo de este ordenador. Lo del otro se guarda en las copias de seguridad.' },
            { texto: 'Quedarse con el otro', explica: 'Se queda lo del otro ordenador. Lo de este se guarda en las copias de seguridad.' }
          ]
        };
      })
    };
  }

  /* e) Plazo de conservación cumplido: los textos de siempre. `elementos`: [{ nombre, dato, detalle }] */
  function conservacion(elementos) {
    var n = elementos.length;
    return {
      titulo: n === 1 ? '1 asunto archivado ha cumplido su plazo de conservación'
        : n + ' asuntos archivados han cumplido su plazo de conservación',
      que: 'Estos asuntos del ARCHIVO ya han cumplido el plazo de su tipo. Nada se borra solo.',
      porque: 'Cada tipo de asunto lleva su plazo de conservación, según las tablas de valoración de la Junta de Andalucía.',
      elegir: true,
      antes: 'Elige los que quieras:',
      elementos: elementos,
      acciones: [
        { texto: 'Mandar a la papelera', id: 'btn-conservacion-papelera',
          explica: 'Los elegidos pasan a la papelera, con su carpeta entera. Desde allí se pueden devolver a su sitio.' },
        { texto: 'Conservar más tiempo…', id: 'btn-conservacion-mas',
          explica: 'Apunta que los elegidos se conservan más años, contando desde hoy. Nada se borra.' }
      ]
    };
  }

  /* f) Una parte de la aplicación no se ha cargado bien. `detalle`: texto técnico. */
  function envolturas(detalle) {
    return {
      titulo: 'Una parte de la aplicación no se ha cargado bien',
      que: 'Algunas funciones pueden no responder.',
      porque: NO_SE_SABE,
      detalle: detalle,
      soporte: 'Si al recargar sigue saliendo.',
      acciones: [
        { texto: 'Recargar la página', normal: true, cambia: false, id: 'problema-recargar',
          explica: 'Vuelve a cargar la aplicación. No se pierde nada guardado.' }
      ]
    };
  }

  /* g) No llegan correos a la bandeja. */
  function bandeja(dias) {
    return {
      titulo: 'No llegan correos a la bandeja',
      que: 'Hace ' + plural(dias, 'día', 'días') + ' que no entra ningún correo en «Ha llegado».',
      porque: 'Lo más probable es que el recolector de Gmail esté dejando los correos en otra carpeta de Drive con el mismo nombre.',
      pasos: [
        'Abre Drive y busca «GESTOR-BANDEJA». Si hay dos carpetas con ese nombre, la buena es la que está suelta en «Mi unidad», no dentro de otra carpeta.',
        'Aquí, en Este ordenador → «Bandeja de correos», pulsa «Cambiar la carpeta» y señala la buena.',
        'Si solo hay una, comprueba en Gmail que los correos que esperas llevan la etiqueta GESTOR.',
        'Si sigue sin llegar nada, el fallo está en el script de Google. ' + QUIEN
      ],
      soporte: 'Si después de esto sigue sin llegar nada.',
      acciones: [
        { texto: 'Ver la bandeja', cambia: false, id: 'problema-bandeja-ver', explica: 'Abre «Bandeja de correos», para cambiar la carpeta.' }
      ]
    };
  }

  /* h) El envío de correo está anticuado. */
  function script() {
    return {
      titulo: 'El envío de correo está anticuado',
      que: 'Los correos se siguen enviando, pero sin las últimas mejoras.',
      porque: 'El script de Gmail que está puesto en Google es más antiguo que la aplicación.',
      quien: QUIEN,
      pasos: [
        'Copia el código nuevo del script de Gmail en el proyecto «Gestor - Correos» de script.google.com, en lugar del que hay, y guarda.',
        'Pulsa «Implementar» → «Gestionar implementaciones» → el lápiz → «Versión: Nueva versión» → «Implementar». Así la dirección no cambia.',
        'Vuelve aquí, a Este ordenador → «Enviar correo», y pulsa «Probar». No hay que pegar ninguna dirección nueva.'
      ],
      soporte: 'Para que lo haga quien montó la aplicación.',
      acciones: [
        { texto: 'Ver «Enviar correo»', cambia: false, id: 'problema-script-ver', explica: 'Abre «Enviar correo», para probar el envío.' }
      ]
    };
  }

  /* i) La ruta más larga no cabe. `m`: lo que devuelve Nombres.medidor. */
  function rutas(m) {
    var clave = (m.masOcupa && m.masOcupa.clave) || '';
    var arreglo = {
      dropbox: 'Pon la carpeta de Dropbox más cerca de la raíz del disco, para que su ruta sea más corta.',
      archivo: 'La carpeta ARCHIVO no se mueve. Acorta la ruta de Dropbox de este ordenador.',
      categoria: 'Ponle un nombre más breve a la categoría más larga.',
      tercero: 'Acorta el nombre del tercero más largo, en su ficha.',
      tipo: 'Ponle un nombre corto más breve al tipo de asunto más largo, en los Ajustes de ese tipo.',
      previas: 'Acorta el nombre de la subcarpeta de versiones previas.',
      documento: 'Ponle un nombre corto más breve al tipo de documento más largo, en Lo de cada día → «Tipos de documento».'
    }[clave] || 'Acorta lo que más ocupa.';
    return {
      titulo: 'La ruta más larga no cabe',
      que: 'Algún documento puede no guardarse en este ordenador porque su ruta completa es demasiado larga: se pasa ' +
        plural(-m.margen, 'carácter', 'caracteres') + '.',
      porque: 'Lo que más ocupa es ' + (m.masOcupa ? m.masOcupa.texto : 'la ruta') + '.',
      pasos: [arreglo, 'Pulsa «Volver a calcular»: si ya cabe, esta tarjeta desaparece.'],
      acciones: [
        { texto: 'Ver las rutas', cambia: false, id: 'problema-rutas-ver', explica: 'Abre «Largo de las rutas», con el detalle del peor caso.' },
        { texto: 'Volver a calcular', cambia: false, id: 'problema-rutas-calcular', explica: 'Mide otra vez el margen que queda.' }
      ]
    };
  }

  /* j) Faltan cosas por configurar en este ordenador. */
  function configurar(n) {
    return {
      titulo: n === 1 ? 'Falta 1 cosa por configurar en este ordenador' : 'Faltan ' + n + ' cosas por configurar en este ordenador',
      que: 'Al entrar, la aplicación comprueba que tiene todo lo que necesita para trabajar en este ordenador, y algo falta.',
      porque: 'Son cosas que se ponen una vez en cada ordenador y todavía no se han puesto.',
      acciones: [
        { texto: 'Verlas', normal: true, cambia: false, id: 'problema-configurar-ver',
          explica: 'Abre la lista, con un botón «Arreglarlo» en cada una.' }
      ]
    };
  }

  /* k) Tareas de puesta a punto pendientes. */
  function fichasArchivo(n) {
    return {
      titulo: n === 1 ? '1 ficha del ARCHIVO por poner en orden' : n + ' fichas del ARCHIVO por poner en orden',
      que: 'La ficha de estos asuntos archivados sigue en la lista general, en vez de en su propia carpeta.',
      porque: 'Son asuntos archivados antes de que cada uno llevara su ficha en su carpeta.',
      acciones: [
        { texto: 'Mover ' + plural(n, 'ficha', 'fichas'), normal: true, id: 'problema-fichas-mover',
          explica: 'Baja a su propia carpeta la ficha de cada asunto archivado. No se pierde ningún dato: se copia tal cual.' }
      ]
    };
  }

  function contacto(n) {
    return {
      titulo: n === 1 ? 'Falta guardar el contacto de 1 asunto abierto' : 'Falta guardar el contacto de ' + n + ' asuntos abiertos',
      que: 'Estos asuntos abiertos no llevan guardada una foto del contacto de su tercero.',
      porque: 'Se abrieron antes de que la aplicación guardara el contacto en cada asunto.',
      acciones: [
        { texto: 'Guardar el contacto de ' + plural(n, 'asunto', 'asuntos'), normal: true, id: 'problema-contacto-guardar',
          explica: 'Busca al tercero de cada asunto en el fichero de hoy y guarda una foto de su contacto. Si esa persona deja de estar en el fichero, el asunto seguirá enseñando sus datos.' }
      ]
    };
  }

  return {
    NO_SE_SABE: NO_SE_SABE, QUIEN: QUIEN, plural: plural,
    alumnado: alumnado, carpetas: carpetas, hitos: hitos, conflictos: conflictos, conservacion: conservacion,
    envolturas: envolturas, bandeja: bandeja, script: script, rutas: rutas, configurar: configurar,
    fichasArchivo: fichasArchivo, contacto: contacto
  };
})();
window.ProblemasTextos = ProblemasTextos;
