/* Prueba del masculino o el femenino en las plantillas (24-sep-2026,
   fila 111 de docs/COLA.md, docs/GENERO-EN-PLANTILLAS.md).
   Nombres y DNI inventados.

     1. `Genero.resolver`: alumna, alumno y sin dato (se queda con la barra).
     2. «El/La Director/a» es de quien firma; «hijo/a:tutor1», del tutor 1.
     3. Lo que no se toca: fechas, «y/o», fracciones, registros, webs, huecos.
     4. `Plantillas.rellenar` con `valores.sexos`: sin dato, va a `faltan`
        diciendo dónde ponerlo.
     5. Word parte «alumno/a» en dos trozos -> se une y se resuelve.
     6. Los sexos de un asunto: la columna Sexo del RegAlum, la casilla de la
        ficha (`_GESTOR/sexos.json`) y el ocupante del cargo.
     7. Una plantilla del centro sale limpia (nada de sexo en `faltan`). */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
const errores = [];
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

const r = (texto, sexos) => pagina.evaluate(([t, s]) => Genero.resolver(t, s), [texto, sexos]);
const FRASE = 'El/la alumno/a interesado/a, D./Dña. Laura, y los/las profesores/as del/de la centro.';

console.log('--- 1. alumna, alumno, sin dato ---');
await comprobar('1. alumna', r(FRASE, { tercero: 'M' }).then(x => x.texto),
  'La alumna interesada, Dña. Laura, y las profesoras de la centro.');
await comprobar('1. alumno', r(FRASE, { tercero: 'H' }).then(x => x.texto),
  'El alumno interesado, D. Laura, y los profesores del centro.');
await comprobar('1. sin dato: tal cual, y cuenta lo que falta', r(FRASE, {}),
  { texto: FRASE, sinResolver: { tercero: 7 } });
await comprobar('1. compañero/a y profesor/a', r('compañero/a, profesor/a', { tercero: 'M' }).then(x => x.texto), 'compañera, profesora');
await comprobar('1. «Jefe/a» es un cargo: de quien firma, no del tercero',
  r('jefe/a, profesor/a', { tercero: 'M', firmante: 'H' }).then(x => x.texto), 'jefe, profesora');

console.log('--- 2. de quién es cada forma ---');
await comprobar('2. El/La Director/a con una directora; el alumno, chico',
  r('El/La Director/a certifica que el/la alumno/a', { tercero: 'H', firmante: 'M' }).then(x => x.texto),
  'La Directora certifica que el alumno');
await comprobar('2. hijo/a:tutor1 es del tutor 1, no del tercero',
  r('su padre/madre:tutor1 y su hijo/a', { tercero: 'M', tutor1: 'H' }).then(x => x.texto),
  'su padre y su hija');
await comprobar('2. marcado y sin dato: se queda sin la marca',
  r('el/la:tutor2 tutor/a:tutor2', { tercero: 'M' }), { texto: 'el/la tutor/a', sinResolver: { tutor2: 2 } });

console.log('--- 3. lo que no se toca ---');
const INTACTO = 'El 24/09/2026, y/o 1/2, registro 26EM1234/2026, https://www.ejemplo.es/a/b, ruta/de/algo, {hecho: Alta/Baja}, Ley 3/2004.';
await comprobar('3. fechas, y/o, fracciones, registros, webs, huecos', r(INTACTO, { tercero: 'M' }).then(x => x.texto), INTACTO);

console.log('--- 4. Plantillas.rellenar ---');
await comprobar('4. con sexo: resuelto y sin faltas',
  pagina.evaluate(() => Plantillas.rellenar('Estimado/a {nombre}', { nombre: 'Ana', sexos: { tercero: 'M' } })),
  { texto: 'Estimada Ana', faltan: [] });
await comprobar('4. sin sexo: la barra y dónde ponerlo',
  pagina.evaluate(() => Plantillas.rellenar('Estimado/a {nombre}', { nombre: 'Ana', sexos: {}, categoria: 'ALUMNADO' })),
  { texto: 'Estimado/a Ana', faltan: ['el sexo de la persona del asunto (en su ficha, «Datos y contacto» → Sexo, o la columna «Sexo» del RegAlum.csv)'] });
await comprobar('4. sin `valores.sexos` (vista previa): no se toca nada',
  pagina.evaluate(() => Plantillas.rellenar('Estimado/a', {})), { texto: 'Estimado/a', faltan: [] });

console.log('--- 5. Word parte la forma doble ---');
await comprobar('5. «alum» + «no/a» en dos trozos -> «alumna»',
  pagina.evaluate(() => {
    const faltan = [];
    const xml = '<w:p><w:r><w:t>La/</w:t></w:r><w:r><w:t xml:space="preserve">El alum</w:t></w:r><w:r><w:t>no/a {nombre}</w:t></w:r></w:p>';
    const salida = Docx.repararYRellenarParrafo(xml, { nombre: 'Ana', sexos: { tercero: 'M' } }, faltan);
    return { texto: salida.replace(/<[^>]*>/g, ''), faltan };
  }),
  { texto: 'La/El alumna Ana', faltan: [] });

console.log('--- 6. los sexos de un asunto ---');
await comprobar('6. RegAlum, casilla de la ficha y cargo',
  pagina.evaluate(async () => {
    const alumna = { nombre: 'Prueba Inventada, Lucía', id: '9999', categoria: 'ALUMNADO', campos: { 'Sexo': 'M' } };
    const profe = { nombre: 'Ejemplo Falso, Mario', documento: '00000001R', categoria: 'PERSONAL', campos: {} };
    const antes = await Genero.sexoDe(profe, 'PERSONAL');
    await Genero.guardar(profe, 'PERSONAL', 'H');
    const despues = await Genero.sexoDe(profe, 'PERSONAL');
    const empresa = await Genero.sexoDe({ nombre: 'Empresa Inventada SL', campos: {} }, 'EMPRESAS');
    const cargos = await Cargos.leer();
    const id = cargos.cargos[0].id;
    await Cargos.anadirOcupante(id, 'Directora Inventada', '2020-01-01', 'M');
    const firmante = await Cargos.enFecha(id, '2026-09-24');
    const s = await Genero.sexosDeAsunto(alumna, 'ALUMNADO', firmante, { tratamiento: 'El Secretario' });
    return { antes, despues, empresa, alumna: s.tercero, firmante: s.firmante, vistobueno: s.vistobueno };
  }),
  { antes: '', despues: 'H', empresa: '', alumna: 'M', firmante: 'M', vistobueno: 'H' });

console.log('--- 7. una plantilla del centro sale limpia ---');
await comprobar('7. certificado-personal: nada de sexo en «faltan» y la ley intacta',
  pagina.evaluate(async () => {
    const buffer = new Uint8Array(await (await fetch('plantillas/certificado-personal.docx')).arrayBuffer());
    const res = await Docx.rellenar(buffer, { centro: 'IES de Prueba', sexos: {} });
    const xml = await Docx.leerEntradaDeTexto(new Uint8Array(await res.blob.arrayBuffer()), 'word/document.xml');
    return { sexo: res.faltan.filter(f => /sexo/.test(f)), barras: (xml.match(/[A-Za-zñ]+\/as?\b/g) || []) };
  }),
  { sexo: [], barras: [] });

if (errores.length) { fallos++; console.log(errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' comprobación(es) ha(n) fallado.' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
