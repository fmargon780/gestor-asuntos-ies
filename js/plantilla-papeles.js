/* ============================================================
   plantilla-papeles.js — a quién propone una plantilla de correo, y su saludo y su firma
   (6-nov-2026, fila 555, docs/555-A-QUIEN-VA-CADA-CORREO.md). Sustituye al «Va a:» de la fila 348.

   Una plantilla de correo guarda `para`, `copia` y `oculta` (listas de papeles), `saludo` y `firma`:
     interesado · legales (tutores legales) · tutor (tutor/a del grupo) · profes · pide (quien lo pide) · relac (relacionados)
     · grupo:<id> (una lista del personal de Ajustes › Grupos)
   Al preparar un correo con ella, esos papeles salen ya puestos como personas de ese asunto (js/correo-para.js).
   Una plantilla sin papeles es válida. Saludo vacío: sale el de siempre; firma vacía: la general de Ajustes.

   - editor: antesDelTextoHTML (el saludo) y despuesDelTextoHTML (la firma y los tres campos), enganchar, leer, aFila.
   - deVaA(plantilla): PURA, el paso de lo que ya existe («Va a:» → papeles), una sola vez (js/plantilla-va-a-revision.js).
   - sinSaludo(texto): PURA, el texto sin su primera línea de saludo.
   ============================================================ */
var PlantillaPapeles = (function () {

  var BASE = [
    { id: 'interesado', nombre: 'El interesado', buscar: 'interesado alumno alumna' },
    { id: 'legales', nombre: 'Tutores legales', buscar: 'tutores legales padre madre familia custodia' },
    { id: 'tutor', nombre: 'Tutor/a del grupo', buscar: 'tutor tutora grupo tutoria' },
    { id: 'profes', nombre: 'Sus profesores', buscar: 'sus profesores profesores profesorado docentes' },
    { id: 'pide', nombre: 'Quien lo pide', buscar: 'pide solicita' },
    { id: 'relac', nombre: 'Relacionados con el asunto', buscar: 'relacionados terceros' }
  ];
  var CAMPOS = ['para', 'copia', 'oculta'];
  var ROTULOS = { para: 'Para', copia: 'Copia', oculta: 'Copia oculta' };
  var estado = {};   /* prefijo -> { para: [], copia: [], oculta: [] } */

  function listasDelPersonal() {
    return ((window.Grupos && Grupos.lista()) || []).filter(function (g) {
      return (g.miembros || []).length && g.miembros.every(function (m) { return m.categoria === 'PERSONAL'; });
    });
  }

  /* Todos los papeles que se pueden poner: los de siempre y una línea por cada lista del personal. */
  function papeles() {
    return BASE.concat(listasDelPersonal().map(function (g) { return { id: 'grupo:' + g.id, nombre: g.nombre, buscar: 'lista personal grupo ' + g.nombre, lista: true }; }));
  }

  function nombreDe(id) {
    var p = papeles().filter(function (x) { return x.id === id; })[0];
    return p ? p.nombre : (/^grupo:/.test(id) ? 'Una lista que ya no existe' : id);
  }

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }

  /* ---------- el paso de lo que ya existe (PURA) ---------- */

  var RE_SALUDO = /^\s*(estimad[oa]s?|querid[oa]s?|apreciad[oa]s?|hola|buenos d[ií]as|buenas tardes|buenas noches|buenas)\b[^\n]*?[:,]/i;

  /* El texto sin su saludo (hasta los dos puntos o la coma de la primera línea) ni las líneas en blanco que lo seguían. */
  function sinSaludo(t) {
    var s = String(t || '');
    var m = RE_SALUDO.exec(s);
    if (!m || m[0].indexOf('\n') !== -1) return s;
    return s.slice(m[0].length).replace(/^[ \t]*\r?\n+/, '').replace(/^[ \t]+/, '');
  }

  /* «Va a: La familia» → Para: Tutores legales (alumnado) o El interesado; «El tutor o tutora» → Para: Tutor/a del grupo con saludo
     «Buenas:»; «Quien lo pide» → Para: Quien lo pide; sin «Va a» → sin papeles. Devuelve { para, copia, oculta, saludo? }. */
  function deVaA(p) {
    var r = { para: [], copia: [], oculta: [] };
    var v = p && p.vaA;
    if (v === 'familia') r.para = [p.categoria === 'ALUMNADO' ? 'legales' : 'interesado'];
    else if (v === 'tutor') { r.para = ['tutor']; r.saludo = 'Buenas:'; }
    else if (v === 'quien-lo-pide') r.para = ['pide'];
    return r;
  }

  /* Pasa una plantilla al modelo nuevo (una sola vez por plantilla, con marca). Devuelve true si la ha tocado. */
  function migrar(p) {
    if (!p || p.migradaA555) return false;
    var r = deVaA(p);
    if (p.para === undefined && r.para.length) p.para = r.para;
    if (r.saludo && p.saludo === undefined) { p.saludo = r.saludo; p.texto = sinSaludo(p.texto); }
    delete p.vaA;
    p.migradaA555 = true;
    return true;
  }

  /* ---------- el editor ---------- */

  function areaHTML(id, etiqueta, valor, filas) {
    return '<label class="etiqueta" for="' + id + '">' + esc(etiqueta) + '</label>' +
      '<textarea id="' + id + '" class="campo" rows="' + filas + '">' + esc(valor || '') + '</textarea>';
  }

  function antesDelTextoHTML(prefijo, existente) {
    return areaHTML(prefijo + '-saludo', 'Saludo', existente && existente.saludo, 1) +
      '<p class="nota">Vacío: sale el saludo de siempre, según la persona del asunto.</p>';
  }

  function despuesDelTextoHTML(prefijo, existente) {
    estado[prefijo] = {
      para: ((existente && existente.para) || []).slice(),
      copia: ((existente && existente.copia) || []).slice(),
      oculta: ((existente && existente.oculta) || []).slice()
    };
    return areaHTML(prefijo + '-firma', 'Firma', existente && existente.firma, 3) +
      '<p class="nota">Vacía: sale la firma general de Ajustes.</p>' +
      '<div class="plantilla-papeles">' + CAMPOS.map(function (c) { return CampoDestinatarios.html(prefijo + '-' + c, ROTULOS[c]); }).join('') +
      '<p class="nota">Escribe lo que es: tutor, tutores legales, sus profesores, quien lo pide, relacionados, el interesado, o el nombre de una lista del personal ' +
      '(director, secretaría…). Al preparar el correo con esta plantilla, salen ya puestos y se pueden cambiar. Si no pones a nadie, se eligen al enviar.</p></div>';
  }

  /* Los campos de saludo y firma, para que «Campo variable» entre también ahí. */
  function camposDeTexto(prefijo) {
    return [document.getElementById(prefijo + '-saludo'), document.getElementById(prefijo + '-firma')].filter(Boolean);
  }

  function enganchar(prefijo) {
    CAMPOS.forEach(function (campo) {
      CampoDestinatarios.montar(prefijo + '-' + campo, {
        opciones: function () {
          return papeles().map(function (p) {
            var donde = CAMPOS.filter(function (c) { return estado[prefijo][c].indexOf(p.id) !== -1; })[0];
            return { id: p.id, nombre: p.nombre, rol: p.lista ? 'Lista del personal' : 'Papel', buscar: p.buscar,
                     nota: donde ? 'Ahora en ' + ROTULOS[donde] + ': pasará a este campo' : '' };
          });
        },
        elegidos: function () { return estado[prefijo][campo].map(function (id) { return { id: id, nombre: nombreDe(id), correo: '' }; }); },
        alElegir: function (id) {
          CAMPOS.forEach(function (c) { estado[prefijo][c] = estado[prefijo][c].filter(function (x) { return x !== id; }); });
          estado[prefijo][campo].push(id);
          repintar(prefijo);
        },
        alQuitar: function (id) { estado[prefijo][campo] = estado[prefijo][campo].filter(function (x) { return x !== id; }); },
        sinResultado: function () { return 'Eso no es un papel ni una lista del personal. Prueba con: tutor, tutores legales, sus profesores, quien lo pide, relacionados o el interesado.'; }
      });
    });
  }

  function repintar(prefijo) {
    CAMPOS.forEach(function (c) {
      var raiz = document.getElementById(prefijo + '-' + c);
      if (!raiz) return;
      var cont = raiz.querySelector('.cdest-pastillas');
      if (!cont) return;
      cont.innerHTML = estado[prefijo][c].map(function (id) {
        return '<span class="cdest-pastilla" data-id="' + esc(id) + '"><button type="button" class="cdest-texto"><strong>' + esc(nombreDe(id)) +
          '</strong></button><button type="button" class="cdest-quitar" aria-label="Quitar ' + esc(nombreDe(id)) + '">×</button></span>';
      }).join('');
      Array.prototype.forEach.call(cont.querySelectorAll('.cdest-quitar'), function (b) {
        b.onclick = function () {
          var id = b.parentNode.getAttribute('data-id');
          estado[prefijo][c] = estado[prefijo][c].filter(function (x) { return x !== id; });
          repintar(prefijo);
        };
      });
    });
  }

  /* Lo escrito en el editor: { para, copia, oculta, saludo, firma }. */
  function leer(prefijo) {
    var e = estado[prefijo] || { para: [], copia: [], oculta: [] };
    function v(id) { var el = document.getElementById(id); return el ? el.value : ''; }
    return { para: e.para.slice(), copia: e.copia.slice(), oculta: e.oculta.slice(), saludo: v(prefijo + '-saludo').trim(), firma: v(prefijo + '-firma').replace(/\s+$/, '') };
  }

  /* Pone lo leído en la fila de `plantillas.json`: solo lo que trae algo. */
  function aFila(fila, extras) {
    var x = extras || {};
    CAMPOS.forEach(function (c) { if ((x[c] || []).length) fila[c] = x[c].slice(); });
    if (String(x.saludo || '').trim()) fila.saludo = x.saludo;
    if (String(x.firma || '').trim()) fila.firma = x.firma;
    fila.migradaA555 = true;
    return fila;
  }

  /* PURA. Los papeles de una plantilla, en palabras: «Para: Tutores legales · Copia oculta: Tutor/a del grupo». Vacío si no tiene. */
  function resumenDe(p) {
    return CAMPOS.map(function (c) {
      var lista = ((p && p[c]) || []).map(nombreDe);
      return lista.length ? ROTULOS[c] + ': ' + lista.join(', ') : '';
    }).filter(Boolean).join(' · ');
  }

  return { resumenDe: resumenDe, BASE: BASE, CAMPOS: CAMPOS, ROTULOS: ROTULOS, papeles: papeles, nombreDe: nombreDe, deVaA: deVaA, migrar: migrar, sinSaludo: sinSaludo,
           antesDelTextoHTML: antesDelTextoHTML, despuesDelTextoHTML: despuesDelTextoHTML, camposDeTexto: camposDeTexto,
           enganchar: enganchar, leer: leer, aFila: aFila };
})();
window.PlantillaPapeles = PlantillaPapeles;
