/* Prueba en navegador de verdad de la fila 159 de docs/COLA.md
   (docs/RESPONSABLE-ADMINISTRACION.md):

   1. «Administración» es un responsable fijo, el primero, de Administración.
   2. En la guía (y en un modelo de la biblioteca), «Responsable por
      defecto» ofrece Administración y los cargos, no las personas.
   3. Una sola vez: los pasos de las guías y los modelos a nombre de una
      persona pasan a Administración; los hitos de un asunto, no.
   4. En la biblioteca de hitos, «Firma de Secretaría» y «Visto bueno de
      Dirección», sin duplicar uno que ya esté con ese título.
   5. «Qué me toca»: al filtrar por una persona salen también los de
      Administración; por Administración, solo esos. */
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

const ASUNTO = '260910 CERTIFICADO 26-27 Inventada Uno, Eva 9990001';
const GUIAS = { CERTIFICADO: [
  { id: 'p1', titulo: 'Preparar', cuerpo: '', opciones: [], responsable: 'yo' },
  { id: 'p2', titulo: 'Firmar', cuerpo: '', opciones: [], responsable: 'secretaria' }
] };
const HITOS = { ajustes: { responsables: [
  { id: 'yo', nombre: 'Francisco', administracion: true },
  { id: 'companero', nombre: 'Diego', administracion: true },
  { id: 'direccion', nombre: 'Dirección', administracion: false },
  { id: 'jefatura', nombre: 'Jefatura', administracion: false },
  { id: 'secretaria', nombre: 'Secretaría', administracion: false }
], noLectivos: [], festivos: [] }, porAsunto: {} };
const BIBLIOTECA = { modelos: [
  { id: 'm1', nombre: 'Revisar', titulo: 'Revisar', explicacion: '', responsable: 'companero', requisitos: [], normativa: [] },
  { id: 'm2', nombre: 'Visto bueno de Dirección', titulo: 'Visto bueno de Dirección', explicacion: '', responsable: 'direccion', requisitos: [], normativa: [] }
] };

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
await pagina.evaluate(async ([guias, hitos, bib, a1]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  for (const [n, t] of [['guias.json', guias], ['hitos.json', hitos], ['hitos-biblioteca.json', bib]]) {
    const h = await g.getFileHandle(n, { create: true });
    const w = await h.createWritable(); await w.write(JSON.stringify(t)); await w.close();
  }
  await window.__disco.abiertos.getDirectoryHandle(a1, { create: true });
}, [GUIAS, HITOS, BIBLIOTECA, ASUNTO]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async (a1) => {
  await App.anotar(a1, { abiertoEl: U.ahora(), tipo: 'CERTIFICADO', categoria: 'PERSONAL',
    tercero: 'Inventada Uno, Eva 9990001', curso: '26-27', grupo: '', descripcion: '', campos: {} });
  await App.verAbiertos();
}, ASUNTO);
/* Un hito de un asunto, a nombre de una persona, antes de la pasada. */
await pagina.locator('.tarjeta-nombre', { hasText: 'Inventada Uno' }).first().click();
await pagina.waitForSelector('#ficha-guia .hito[data-id="p1"]', { state: 'attached' });

const leer = (n) => pagina.evaluate(async (n) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  try { return JSON.parse(await (await (await g.getFileHandle(n)).getFile()).text()); } catch (e) { return null; }
}, n);
/* La pasada única (al entrar la lanza Gestor.alRefrescar; aquí, directa). */
const pasada = await pagina.evaluate(() => HitosAdministracion.hacer());
await comprobar('la pasada cuenta lo que ha cambiado', Promise.resolve(pasada), { pasos: 1, modelos: 1, modelosDeFirma: 1 });
await comprobar('y una segunda no hace nada (la marca)', pagina.evaluate(() => HitosAdministracion.hacer()), null);

console.log('--- 1. el responsable fijo ---');
await comprobar('«Administración» va la primera, fija y de Administración',
  pagina.evaluate(async () => { const r = (await Hitos.leer()).ajustes.responsables[0]; return [r.id, r.nombre, r.administracion, r.fijo]; }),
  ['administracion', 'Administración', true, true]);
await comprobar('Hitos.esDeAdministracion la cuenta como de Administración',
  pagina.evaluate(async () => Hitos.esDeAdministracion('administracion', (await Hitos.leer()).ajustes)), true);

console.log('--- 2. lo que ofrece la guía ---');
await comprobar('«Responsable por defecto»: Administración y los cargos, sin las personas',
  pagina.evaluate(async () => HitosAdministracion.paraGuia((await Hitos.leer()).ajustes).map((r) => r.id)),
  ['administracion', 'direccion', 'jefatura', 'secretaria']);
await comprobar('en un asunto concreto siguen las personas',
  pagina.evaluate(async () => (await Hitos.leer()).ajustes.responsables.map((r) => r.id)),
  ['administracion', 'yo', 'companero', 'direccion', 'jefatura', 'secretaria']);

console.log('--- 3. la pasada única ---');
await comprobar('en la guía, el paso de una persona pasa a Administración; el de un cargo, no',
  leer('guias.json').then((g) => g.CERTIFICADO.map((p) => p.responsable)), ['administracion', 'secretaria']);
await comprobar('en la biblioteca, el modelo de una persona también',
  leer('hitos-biblioteca.json').then((b) => b.modelos.filter((m) => m.id === 'm1')[0].responsable), 'administracion');
await comprobar('los hitos del asunto no se tocan (siguen a nombre de la persona)',
  leer('hitos.json').then((h) => h.porAsunto[ASUNTO].hitos.filter((x) => x.id === 'p1')[0].responsable), 'yo');

console.log('--- 4. los dos hitos de firma ---');
await comprobar('«Firma de Secretaría» entra; «Visto bueno de Dirección» ya estaba con ese título y no se duplica',
  leer('hitos-biblioteca.json').then((b) => b.modelos.map((m) => m.titulo)),
  ['Revisar', 'Visto bueno de Dirección', 'Firma de Secretaría']);
await comprobar('la firma, de Secretaría',
  leer('hitos-biblioteca.json').then((b) => b.modelos.filter((m) => m.titulo === 'Firma de Secretaría')[0].responsable), 'secretaria');

console.log('--- 5. «Qué me toca» ---');
await comprobar('por una persona: sus hitos y los de Administración; por Administración, solo esos',
  pagina.evaluate(async () => {
    const aj = (await Hitos.leer()).ajustes;
    const c = HitosAdministracion.cuentaPara;
    return [c('administracion', 'yo', aj), c('yo', 'yo', aj), c('companero', 'yo', aj),
            c('administracion', 'administracion', aj), c('yo', 'administracion', aj), c('administracion', 'direccion', aj)];
  }), [true, true, false, true, false, false]);

if (errores.length) { fallos++; console.log('ERRORES:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
