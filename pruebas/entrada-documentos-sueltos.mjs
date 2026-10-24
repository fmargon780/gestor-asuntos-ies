/* Prueba en navegador de verdad de la carpeta de entrada de documentos sueltos.

   Fila 455 de docs/COLA.md (docs/PASAR-A-DRIVE.md, apartado «Fila 455»).

   Cuatro escenarios, cada uno con una página nueva y el disco de mentira de pruebas/navegador.mjs:
     A. sin señalar la entrada: «Por clasificar» enseña lo de la raíz de abiertos, como antes;
     B. entrada señalada (otra carpeta): enseña los suyos, no los de la raíz de abiertos; clasificar
        uno lo lleva al asunto y desaparece de la entrada; y en Ajustes salen «Señalar» y
        «Usar la de asuntos vivos» (que vuelve a lo de antes);
     C. entrada señalada pero su carpeta no se encuentra: la frase de «solo se ven en el instituto»,
        la app funciona y no hay nada en Problemas por esto;
     D. sin señalar con `nube: "drive"` en `_GESTOR/rutas.json`: la misma frase. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const ASUNTO = '260903 FLEXIBILIDAD 26-27 Pacheco Pérez, Mercedes 019G';
const FRASE = 'Los documentos por clasificar solo se ven en el instituto.';

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let fallos = 0;
const errores = [];

async function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(await real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(await real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* Entra con un asunto y los ficheros de la raíz de abiertos; `antes` prepara lo demás. */
async function entrar(antes, parametros) {
  const pagina = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
  pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript(preparacion);
  await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
  await pagina.click('#btn-abiertos');
  await pagina.click('#btn-archivo');
  await pagina.fill('#campo-usuario', 'Francisco');
  await pagina.waitForSelector('#btn-entrar:not([disabled])');
  await pagina.evaluate(async ([asunto, antesTexto, p]) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
    g._hijos.set('asuntos.json', window.__disco.fich('asuntos.json', JSON.stringify({
      asuntos: { [asunto]: { tercero: 'Pacheco Pérez, Mercedes 019G', categoria: 'PERSONAL', situacion: 'A LA ESPERA DEL TERCERO' } }
    })));
    await window.__disco.abiertos.getDirectoryHandle(asunto, { create: true });
    window.__disco.abiertos._hijos.set('Solo en abiertos.pdf', window.__disco.fich('Solo en abiertos.pdf', 'raíz'));
    const entrada = await window.__disco.archivo.getDirectoryHandle('ENTRADA DEL CENTRO', { create: true });
    entrada._hijos.set('Oficio de la entrada.pdf', window.__disco.fich('Oficio de la entrada.pdf', 'oficio'));
    entrada._hijos.set('Escrito de la entrada.pdf', window.__disco.fich('Escrito de la entrada.pdf', 'escrito'));
    window.__entrada = entrada;
    // eslint-disable-next-line no-new-func
    await (new Function('window', 'return (async () => {' + antesTexto + '})()'))(window);
  }, [ASUNTO, antes, parametros || null]);
  await pagina.click('#btn-entrar');
  await pagina.waitForSelector('#aplicacion:not(.oculto)');
  await pagina.click('.panel[data-vista="clasificar"]');
  await pagina.waitForTimeout(600);
  return pagina;
}

const sueltos = (p) => p.locator('#lista-sueltos .tarjeta-suelto .tarjeta-nombre').allTextContents()
  .then(l => l.map(t => t.replace(/^(NUEVO)?(PDF)?/, '')).sort());

/* ---------- A. sin señalar ---------- */
{
  const p = await entrar('');
  await comprobar('A. sin señalar, «Por clasificar» enseña lo de la raíz de abiertos', sueltos(p), ['Solo en abiertos.pdf']);
  await p.close();
}

/* ---------- B. señalada ---------- */
{
  const p = await entrar("await window.Almacen.guardar('entrada', window.__entrada);");
  await comprobar('B. señalada, enseña los documentos de esa carpeta y no los de la raíz de abiertos',
    sueltos(p), ['Escrito de la entrada.pdf', 'Oficio de la entrada.pdf']);

  await p.locator('#lista-sueltos .tarjeta-suelto').filter({ hasText: 'Oficio de la entrada.pdf' })
    .getByRole('button', { name: 'Guardar en un asunto' }).click();
  await p.waitForSelector('#enlace-todos');
  await p.fill('#enlace-buscar', 'Pacheco');
  await p.waitForTimeout(300);
  await p.click('#enlace-todos .enlace-asunto');
  await p.waitForTimeout(900);
  await comprobar('clasificar uno lo lleva a la carpeta del asunto (aunque sea de otra carpeta)',
    p.evaluate(async (a) => { const c = await window.__disco.abiertos.getDirectoryHandle(a); const n = []; for await (const x of c.entries()) n.push(x[0]); return n; }, ASUNTO),
    ['Oficio de la entrada.pdf']);
  await comprobar('y desaparece de la entrada',
    p.evaluate(async () => { const n = []; for await (const x of window.__entrada.entries()) n.push(x[0]); return n.sort(); }),
    ['Escrito de la entrada.pdf']);
  await comprobar('y no ha tocado la raíz de abiertos',
    p.evaluate(async () => { const n = []; for await (const x of window.__disco.abiertos.entries()) if (x[1].kind === 'file') n.push(x[0]); return n; }),
    ['Solo en abiertos.pdf']);

  await p.waitForSelector('#doc-guardar');
  await p.click('#cuadro-aceptar');
  await p.waitForTimeout(500);

  /* Ajustes → Mantenimiento: los dos botones, y «Usar la de asuntos vivos» vuelve a lo de siempre. */
  await p.evaluate(() => { App.ir('ajustes'); setTimeout(() => App.irASeccionDeAjustes(document.getElementById('entrada-ajustes')), 300); });
  await p.waitForSelector('#entrada-ajustes button', { state: 'visible' });
  await comprobar('en Ajustes salen «Señalar» y «Usar la de asuntos vivos»',
    p.locator('#entrada-ajustes button').allTextContents(), ['Señalar', 'Usar la de asuntos vivos']);
  await comprobar('con la frase de debajo',
    p.locator('#entrada-ajustes .nota').textContent(), 'Es donde el resto del centro deja los documentos para Administración.');
  await p.getByRole('button', { name: 'Usar la de asuntos vivos' }).click();
  await p.waitForTimeout(600);
  await comprobar('«Usar la de asuntos vivos» vuelve a leer la raíz de abiertos',
    p.evaluate(() => (App.E.sueltos || []).map(s => s.nombre)), ['Solo en abiertos.pdf']);
  await p.close();
}

/* ---------- C. señalada pero no se encuentra ---------- */
{
  const p = await entrar("window.__entrada.entries = function () { const e = new Error('no existe'); e.name = 'NotFoundError'; throw e; }; await window.Almacen.guardar('entrada', window.__entrada);");
  await comprobar('C. sin encontrar la carpeta, «Por clasificar» dice la frase', p.locator('#lista-sueltos .vacio').textContent(), FRASE);
  await comprobar('y no enseña ninguna tarjeta', p.locator('#lista-sueltos .tarjeta-suelto').count(), 0);
  await comprobar('la app sigue funcionando (Ajustes se abre)', p.evaluate(() => { App.ir('ajustes'); return !!document.getElementById('entrada-ajustes'); }), true);
  await comprobar('sin avisos de la entrada en Problemas',
    p.evaluate(() => JSON.stringify(window.Problemas && Problemas.lista ? Problemas.lista() : []).toLowerCase().indexOf('entrada') === -1), true);
  await p.close();
}

/* ---------- D. sin señalar, con la nube en Drive ---------- */
{
  const p = await entrar(`const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
    g._hijos.set('rutas.json', window.__disco.fich('rutas.json', JSON.stringify({ nube: 'drive' })));`);
  await comprobar('D. sin señalar y con nube «drive», la misma frase', p.locator('#lista-sueltos .vacio').textContent(), FRASE);
  await p.close();
}

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
