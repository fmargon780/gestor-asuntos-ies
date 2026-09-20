/* ============================================================
   cargar-biblioteca.mjs — fila 80 de docs/COLA.md, docs/CARGAR-
   BIBLIOTECA.md: programa de una sola vez que lee los tres documentos
   de contenido (docs/contenido/BIBLIOTECA-*.md) y genera el fichero de
   datos estáticos que la aplicación carga con el botón de Ajustes →
   Mantenimiento "Cargar la biblioteca del centro" (js/cargar-
   biblioteca.js).

   Se ejecuta a mano, con Node, cada vez que el contenido cambie:

       node herramientas/cargar-biblioteca.mjs

   Escribe datos-biblioteca/biblioteca-centro.json. No toca nada de
   _GESTOR: eso solo lo hace el botón, dentro del navegador de
   Francisco, fusionando con lo que ya tenga.

   La notación de los documentos de contenido está descrita en
   docs/CARGAR-BIBLIOTECA.md, apartado 2:

       ### CORTO — Nombre largo del tipo
       Encarga: Jefatura de Estudios · Campos: Colectivo
       NUEVO
       1. [i] Título del hito · Responsable · plazo · reunir: A; B · comunica: C · norma: Cita {bloque|clave}

   Decisiones de este programa, para que quede escrito por qué:

   - El tramo de "plazo" del documento (casi siempre una frase, no un
     número de días) NO se convierte al campo `plazo` de la aplicación
     (que es una fecha calculada, `{dias, desde}`): eso dejaría casi
     todos los plazos mal rellenados por una interpretación mía. Se
     deja tal cual, como parte de la explicación del hito (regla 3 de
     docs/CARGAR-BIBLIOTECA.md: "los plazos que el documento deja
     vacíos, se dejan vacíos"). Lo mismo con "comunica:": es a quién se
     avisa, no la plantilla del correo (esa se escribe con el uso), así
     que entra como una frase más de la explicación.
   - "Un hito que se repite en varios tipos se guarda UNA SOLA VEZ"
     (regla 3): se deduplica por título + responsable, exactos. Dos
     hitos con el mismo título pero distinto responsable son dos
     modelos distintos a propósito (de verdad los hace gente distinta).
   - "Mismos hitos que X." (COMPRA/SUMINISTRO/OBRA/CONTRATO MENOR, en
     EMPRESAS): en vez de repetir los diez pasos de COMPRA, esos tipos
     apuntan a la misma lista de modelos ya creada para COMPRA.
   - Dos campos (`Colectivo`, en PERSONAL; `Objeto`, en EMPRESAS) son de
     lista cerrada, con sus valores explicados en la prosa de cada
     documento, no en la propia línea "Campos:". Sus valores se dejan
     aquí, a mano, en CAMPOS_LISTA_CONOCIDOS: es más fiable que intentar
     adivinar una enumeración dentro de un párrafo.
   - Un tipo de EMPRESAS que ya existe hoy con un nombre distinto del
     nombreCorto del documento (CONTRATO MENOR, que hoy se llama
     CONTRATO) se apunta en RENOMBRES_ESPECIALES: la prosa que lo dice
     ("hay que renombrarlo") no se intenta parsear sola.
   ============================================================ */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const DOCS = [
  { fichero: 'docs/contenido/BIBLIOTECA-ALUMNADO.md', categoria: 'ALUMNADO' },
  { fichero: 'docs/contenido/BIBLIOTECA-PERSONAL.md', categoria: 'PERSONAL' },
  { fichero: 'docs/contenido/BIBLIOTECA-EMPRESAS-Y-OTROS.md', categoria: null }   /* se decide por "# EMPRESAS"/"# OTROS" */
];

/* Ver el comentario de arriba: valores que el documento explica en
   prosa, no en la propia línea "Campos:". */
const CAMPOS_LISTA_CONOCIDOS = {
  'Colectivo': ['Personal docente', 'Personal funcionario de administración general', 'Personal laboral'],
  'Objeto': ['obra', 'suministro', 'servicio']
};

/* Ver el comentario de arriba: un nombreCorto del documento que no
   coincide con el nombre que el tipo tiene hoy en la aplicación. */
const RENOMBRES_ESPECIALES = {
  'CONTRATO MENOR': 'CONTRATO'
};

let contadorModelo = 0;
function nuevoIdModelo() { contadorModelo++; return 'b' + contadorModelo; }
function nuevoIdRequisito(n) { return 'r' + n; }
function nuevoIdNormativa(n) { return 'n' + n; }

/* ---------- leer un documento y partirlo en bloques "### ..." ---------- */

function bloquesDe(texto) {
  const lineas = texto.split('\n');
   const bloques = [];
  let categoriaActual = null;
  let actual = null;
  for (const linea of lineas) {
    const cab1 = linea.match(/^#\s+(.+)$/);
    if (cab1) { categoriaActual = cab1[1].trim().toUpperCase(); continue; }
    const cab3 = linea.match(/^###\s+(.+)$/);
    if (cab3) {
      if (actual) bloques.push(actual);
      actual = { cabecera: cab3[1].trim(), categoria: categoriaActual, lineas: [] };
      continue;
    }
    if (/^---\s*$/.test(linea)) { if (actual) { bloques.push(actual); actual = null; } continue; }
    if (actual) actual.lineas.push(linea);
  }
  if (actual) bloques.push(actual);
  return bloques;
}

/* ---------- una línea numerada, en un hito ya en la forma de la app ---------- */

function esPrefijado(segmento) { return /^(reunir|comunica|norma):/.test(segmento.trim()); }

function normativaDeTexto(texto) {
  if (!texto) return [];
  return texto.split(' + ').map((trozo) => trozo.trim()).filter(Boolean).map((trozo, i) => {
    const m = trozo.match(/^(.*?)\s*\{([a-z]+)\|(.+)\}\s*$/);
    if (m) {
      return { id: nuevoIdNormativa(i), cita: m[1].trim(), bloque: m[2], clave: m[3].trim().replace(/\s+/g, '-'), url: '' };
    }
    return { id: nuevoIdNormativa(i), cita: trozo, bloque: '', clave: '', url: '' };
  });
}

function requisitosDeTexto(texto) {
  if (!texto) return [];
  return texto.split(';').map((t) => t.trim()).filter(Boolean).map((t, i) => (
    { id: nuevoIdRequisito(i), texto: t, clase: 'documento', obligatorio: false }
  ));
}

function primeraMayuscula(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function terminaEnPunto(s) { return /[.!?]$/.test(s); }

function lineaAHito(linea) {
  const m = linea.match(/^\d+\.\s+(.*)$/);
  if (!m) return null;
  let resto = m[1];
  let soloInformativo = false;
  if (resto.startsWith('[i] ')) { soloInformativo = true; resto = resto.slice(4); }

  const segmentos = resto.split(' · ').map((s) => s.trim());
  const titulo = segmentos[0];
  let idx = 1;
  let responsable = '';
  let plazoTexto = '';
  if (idx < segmentos.length && !esPrefijado(segmentos[idx])) { responsable = segmentos[idx]; idx++; }
  if (idx < segmentos.length && !esPrefijado(segmentos[idx])) { plazoTexto = segmentos[idx]; idx++; }

  let reunirTexto = '', comunicaTexto = '', normaTexto = '';
  for (; idx < segmentos.length; idx++) {
    const s = segmentos[idx];
    if (/^reunir:/.test(s)) reunirTexto = s.replace(/^reunir:\s*/, '');
    else if (/^comunica:/.test(s)) comunicaTexto = s.replace(/^comunica:\s*/, '');
    else if (/^norma:/.test(s)) normaTexto = s.replace(/^norma:\s*/, '');
    else plazoTexto = plazoTexto ? plazoTexto + '; ' + s : s;
  }

  const partesExplicacion = [];
  if (plazoTexto) partesExplicacion.push(primeraMayuscula(plazoTexto) + (terminaEnPunto(plazoTexto) ? '' : '.'));
  if (comunicaTexto) partesExplicacion.push('Se comunica a ' + comunicaTexto + '.');

  return {
    titulo: titulo,
    responsable: responsable,
    explicacion: partesExplicacion.join(' '),
    requisitos: requisitosDeTexto(reunirTexto),
    soloInformativo: soloInformativo,
    normativa: normativaDeTexto(normaTexto)
  };
}

/* ---------- "Campos: A; B (op1 / op2)" ---------- */

function camposDeTexto(texto) {
  if (!texto) return [];
  return texto.split(';').map((t) => t.trim()).filter(Boolean).map((t) => {
    const m = t.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    const nombre = (m ? m[1] : t).trim();
    if (CAMPOS_LISTA_CONOCIDOS[nombre]) {
      return { nombre: nombre, clase: 'lista', valores: CAMPOS_LISTA_CONOCIDOS[nombre] };
    }
    if (m) {
      return { nombre: nombre, clase: 'lista', valores: m[2].split('/').map((v) => v.trim()).filter(Boolean) };
    }
    return { nombre: nombre, clase: 'texto', valores: [] };
  });
}

/* ---------- un bloque "### ..." entero, ya interpretado ---------- */

function interpretarBloque(bloque) {
  const mCab = bloque.cabecera.match(/^(.+?)\s+—\s+(.+)$/);
  const nombreCorto = mCab ? mCab[1].trim() : '';
  const nombreLargo = mCab ? mCab[2].trim() : bloque.cabecera.trim();

  let nuevo = false;
  let campos = [];
  let mismosHitosQue = null;
  const hitos = [];

  for (const linea of bloque.lineas) {
    const l = linea.trim();
    if (!l) continue;
    if (l === 'NUEVO') { nuevo = true; continue; }
    if (/^Encarga:/.test(l)) continue;
    if (/^Campos:/.test(l)) { campos = camposDeTexto(l.replace(/^Campos:\s*/, '')); continue; }
    const mMismos = l.match(/^Mismos hitos que ([^.]+)\./);
    if (mMismos) { mismosHitosQue = mMismos[1].trim(); continue; }
    if (/^\d+\.\s/.test(l)) { const h = lineaAHito(l); if (h) hitos.push(h); continue; }
    /* El resto ("Nota del tipo:", "Aviso de caducidad...", prosa
       suelta): no se modela en tipos.json/hitos-biblioteca.json/
       guias.json, así que aquí no hace falta guardarlo. */
  }

  return {
    nombreCorto: (nombreCorto === nombreLargo) ? '' : nombreCorto,
    nombreCortoDeReferencia: nombreCorto || nombreLargo,   /* para "Mismos hitos que X" y RENOMBRES_ESPECIALES */
    nombreLargo: nombreLargo,
    categoria: bloque.categoria,
    nuevo: nuevo,
    campos: campos,
    mismosHitosQue: mismosHitosQue,
    hitos: hitos
  };
}

/* ---------- montar la salida entera ---------- */

function generar() {
  const tipos = [];
  const camposPorTipo = {};
  const modelos = [];
  const modelosPorClave = new Map();   /* "titulo|responsable" -> modelo, para deduplicar */
  const guiasPorTipo = {};
  const guiaPorReferencia = new Map();   /* nombreCortoDeReferencia -> lista de ids, para "Mismos hitos que" */

  for (const doc of DOCS) {
    const texto = fs.readFileSync(RAIZ + doc.fichero, 'utf8');
    const bloques = bloquesDe(texto).map(interpretarBloque);
    for (const b of bloques) {
      const categoria = doc.categoria || b.categoria;
      if (!categoria) throw new Error('Sin categoría para "' + b.nombreLargo + '" en ' + doc.fichero);

      const nombreCortoReal = RENOMBRES_ESPECIALES[b.nombreCortoDeReferencia] || b.nombreCorto;
      tipos.push({
        nombreCorto: nombreCortoReal,
        nombreLargo: b.nombreLargo,
        categoria: categoria,
        nuevo: b.nuevo
      });

      if (b.campos.length) camposPorTipo[b.nombreLargo] = b.campos;

      let idsDeLaGuia;
      if (b.mismosHitosQue) {
        idsDeLaGuia = guiaPorReferencia.get(b.mismosHitosQue);
        if (!idsDeLaGuia) {
          throw new Error('"' + b.nombreLargo + '" dice "Mismos hitos que ' + b.mismosHitosQue +
            '", pero ese tipo todavía no se ha leído (tiene que ir antes en el documento).');
        }
      } else {
        idsDeLaGuia = b.hitos.map((h) => {
          const clave = h.titulo.trim().toLowerCase() + '|' + h.responsable.trim().toLowerCase();
          let modelo = modelosPorClave.get(clave);
          if (!modelo) {
            modelo = {
              id: nuevoIdModelo(), nombre: h.titulo, titulo: h.titulo, explicacion: h.explicacion,
              responsable: h.responsable, requisitos: h.requisitos, soloInformativo: h.soloInformativo,
              normativa: h.normativa
            };
            modelosPorClave.set(clave, modelo);
            modelos.push(modelo);
          }
          return modelo.id;
        });
      }
      guiasPorTipo[b.nombreLargo] = idsDeLaGuia;
      guiaPorReferencia.set(b.nombreCortoDeReferencia, idsDeLaGuia);
    }
  }

  return { version: 1, tipos: tipos, camposPorTipo: camposPorTipo, modelos: modelos, guiasPorTipo: guiasPorTipo };
}

const salida = generar();
const destino = RAIZ + 'datos-biblioteca/biblioteca-centro.json';
fs.writeFileSync(destino, JSON.stringify(salida, null, 2) + '\n');

const nuevos = salida.tipos.filter((t) => t.nuevo).length;
console.log('Escrito ' + destino + ':');
console.log('  ' + salida.tipos.length + ' tipos (' + nuevos + ' nuevos, ' + (salida.tipos.length - nuevos) + ' ya existentes con nombre corto)');
console.log('  ' + salida.modelos.length + ' modelos en la biblioteca');
console.log('  ' + Object.keys(salida.guiasPorTipo).length + ' guías');
console.log('  ' + Object.keys(salida.camposPorTipo).length + ' tipos con campos propios');
