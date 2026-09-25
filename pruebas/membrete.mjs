/* Prueba del membrete dibujado por la aplicación (25-sep-2026, fila 149,
   docs/MEMBRETE-LETRA-DEL-MANUAL.md). Sustituye a la de la fila 81.

   Sin navegador, `Membrete.componer` (SIN EFECTOS: dónde va cada cosa):
     1. Sin nada: «Consejería de Educación», el centro en mayúsculas y en
        verde, en la base del símbolo, y sin logo.
     2. Las medidas del manual: tamaños y líneas base en proporción a S.
     3. Una Consejería muy larga se parte en dos líneas; la última del
        centro sigue en la base del símbolo y el bloque sube.
     4. El logo: alto S + 20, a 60 px del borde derecho; uno muy ancho se
        escala por el ancho; con `conLogo: false`, no sale.
   Con el navegador y el disco de mentira:
     5. Sin nada en Ajustes, el membrete sale (2480 × 400) con la letra
        del manual y la derecha en blanco.
     6. Con logo subido sale a la derecha; `conLogoCentro: false`, no.
     7. Al generar, una plantilla vieja (sin la clave) pide el logo; una
        desmarcada, no.
     8. Si la letra no carga, el membrete sale igual, con Arial. */
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const RAIZ = fileURLToPath(new URL('../js/', import.meta.url));

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const cerca = (a, b) => Math.abs(a - b) < 0.01;

const contexto = { window: {} };
vm.createContext(contexto);
vm.runInContext(fs.readFileSync(RAIZ + 'membrete.js', 'utf8'), contexto);
const { Membrete } = contexto;
const S = Membrete.S;
const arriba = (400 - S) / 2;

/* ================= 1 ================= */
console.log('--- 1. sin nada en Ajustes ---');
const p1 = Membrete.componer({ centro: 'IES Fuente Lucena' });
comprobar('tres textos: la Junta, la Consejería por defecto y el centro en mayúsculas',
  p1.textos.map((t) => t.texto), ['Junta de Andalucía', 'Consejería de Educación', 'IES FUENTE LUCENA']);
comprobar('colores y pesos del manual', p1.textos.map((t) => t.color + ' ' + t.peso),
  ['#221E1B 700', '#221E1B 400', '#017836 400']);
comprobar('sin logo', p1.logo, null);
comprobar('lienzo de 2480 × 400', p1.lienzo, { ancho: 2480, alto: 400 });

/* ================= 2 ================= */
console.log('--- 2. las medidas ---');
comprobar('el símbolo: S de alto, a 60 px del borde, centrado', [p1.simbolo.x, p1.simbolo.y, p1.simbolo.alto], [60, arriba, S]);
const x = p1.simbolo.x + p1.simbolo.ancho + 0.2 * S;
comprobar('los textos empiezan 0,20·S a la derecha del símbolo', p1.textos.every((t) => cerca(t.x, x)), true);
comprobar('tamaños: 0,244·S, 0,144·S y 0,111·S', p1.textos.map((t, i) => cerca(t.tamano, [0.244, 0.144, 0.111][i] * S)), [true, true, true]);
comprobar('líneas base: 0,465·S, 0,735·S y 1,00·S desde lo alto del símbolo',
  p1.textos.map((t, i) => cerca(t.y, arriba + [0.465, 0.735, 1.0][i] * S)), [true, true, true]);

/* ================= 3 ================= */
console.log('--- 3. una Consejería muy larga ---');
const larga = 'Consejería de Desarrollo Educativo y Formación Profesional y de Universidades, Investigación e Innovación';
const p3 = Membrete.componer({ consejeria: larga, centro: 'IES Fuente Lucena' });
const lineasK = p3.textos.filter((t) => t.color === '#221E1B' && t.peso === 400);
comprobar('la Consejería va en dos líneas, con todo el texto', [lineasK.length, lineasK.map((t) => t.texto).join(' ')], [2, larga]);
const ultimo = p3.textos[p3.textos.length - 1];
comprobar('la última línea (el centro) sigue en la base del símbolo', cerca(ultimo.y, arriba + S), true);
comprobar('y el bloque sube: «Junta de Andalucía» más arriba que sin partir', p3.textos[0].y < p1.textos[0].y, true);
comprobar('ninguna línea pasa del 72 % del ancho (medida estimada)',
  p3.textos.slice(1).every((t) => t.x + t.texto.length * t.tamano * 0.56 <= 0.72 * 2480 + 0.5), true);
comprobar('la Junta no se sale por arriba', p3.textos[0].y - p3.textos[0].tamano > 0, true);

/* ================= 4 ================= */
console.log('--- 4. el logo ---');
const p4 = Membrete.componer({ centro: 'X', logo: { ancho: 300, alto: 300 } });
comprobar('alto S + 20, a 60 px del borde derecho, centrado', [p4.logo.alto, cerca(p4.logo.x + p4.logo.ancho, 2480 - 60), cerca(p4.logo.y, (400 - p4.logo.alto) / 2)], [S + 20, true, true]);
const p4b = Membrete.componer({ centro: 'X', logo: { ancho: 3000, alto: 300 } });
comprobar('uno muy ancho se escala por el ancho (25 % del lienzo)', [cerca(p4b.logo.ancho, 620), p4b.logo.alto < S], [true, true]);
comprobar('con conLogo: false, no sale', Membrete.componer({ centro: 'X', logo: { ancho: 300, alto: 300 }, conLogo: false }).logo, null);

/* ================= con el navegador ================= */
const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
const errores = [];
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* Cuántos píxeles no blancos hay en un trozo del PNG. */
await pagina.evaluate(() => {
  window.__pintados = async (bytes, x0, x1) => {
    const bmp = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
    const ctx = c.getContext('2d'); ctx.drawImage(bmp, 0, 0);
    const d = ctx.getImageData(x0, 0, x1 - x0, bmp.height).data;
    let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 240 || d[i + 1] < 240 || d[i + 2] < 240) n++;
    return { n, ancho: bmp.width, alto: bmp.height };
  };
});

console.log('--- 5. sin nada en Ajustes ---');
const r5 = await pagina.evaluate(async () => {
  const m = await Membrete.montar({ conLogoCentro: true });
  const izq = await window.__pintados(m.bytes, 60, 400);
  const der = await window.__pintados(m.bytes, 1900, 2480);
  return { conNoto: m.conNoto, textos: m.plan.textos.map((t) => t.texto), ancho: izq.ancho, alto: izq.alto, simbolo: izq.n > 1000, derecha: der.n };
});
comprobar('sale, con la letra del manual, el símbolo pintado y la derecha en blanco', r5,
  { conNoto: true, textos: ['Junta de Andalucía', 'Consejería de Educación', 'IES FUENTE LUCENA'], ancho: 2480, alto: 400, simbolo: true, derecha: 0 });

console.log('--- 6. con logo ---');
await pagina.evaluate(async () => {
  const c = document.createElement('canvas'); c.width = 200; c.height = 200;
  const ctx = c.getContext('2d'); ctx.fillStyle = '#c00000'; ctx.fillRect(0, 0, 200, 200);
  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  await Membrete.guardarLogo(blob);
});
const r6 = await pagina.evaluate(async () => {
  const con = await Membrete.montar({ conLogoCentro: true });
  const sin = await Membrete.montar({ conLogoCentro: false });
  return [(await window.__pintados(con.bytes, 1900, 2480)).n > 10000, (await window.__pintados(sin.bytes, 1900, 2480)).n];
});
comprobar('con logo sale a la derecha; con la plantilla desmarcada, no', r6, [true, 0]);

console.log('--- 7. al generar, cada plantilla dice si lleva el logo ---');
const r7 = await pagina.evaluate(async () => {
  const pedidos = [];
  const original = Membrete.montar;
  Membrete.montar = async (o) => { pedidos.push(o && o.conLogoCentro); return null; };
  window.Docx.rellenar = async () => ({ blob: new Blob(['doc']), faltan: [] });
  const pl = await Carpetas.crear(App.E.gestor, 'PLANTILLAS');
  await Carpetas.escribirBytes(pl, 'p.docx', new Uint8Array([80, 75]), 'application/octet-stream');
  const asunto = { nombre: '260901 PRUEBA Inventada, Eva 1', handle: await App.E.abiertos.getDirectoryHandle('260901 PRUEBA Inventada, Eva 1', { create: true }), ficha: {}, leido: {} };
  for (const p of [{ id: 'a', nombre: 'Vieja', fichero: 'p.docx', tipoDocumento: 'X' }, { id: 'b', nombre: 'Sin logo', fichero: 'p.docx', tipoDocumento: 'X', conLogoCentro: false }]) {
    try { await PlantillasDocumento.generar(asunto, p, 'abierto'); } catch (e) { /* solo importa lo pedido */ }
  }
  Membrete.montar = original;
  return pedidos;
});
comprobar('la vieja (sin la clave) con logo; la desmarcada, sin', r7, [true, false]);

console.log('--- 8. si la letra no carga ---');
const r8 = await pagina.evaluate(async () => {
  const leer = App.leerFicheroDeLaApp;
  App.leerFicheroDeLaApp = (ruta, tipo) => (ruta.indexOf('fonts/') === 0 ? Promise.reject(new Error('sin letra')) : leer(ruta, tipo));
  Membrete._olvidarCargas();
  const m = await Membrete.montar({ conLogoCentro: false });
  App.leerFicheroDeLaApp = leer;
  Membrete._olvidarCargas();
  return m && { conNoto: m.conNoto, ancho: m.ancho, textos: (await window.__pintados(m.bytes, 400, 1800)).n > 1000 };
});
comprobar('sale igual, con Arial', r8, { conNoto: false, ancho: 2480, textos: true });

if (process.env.CAPTURAS) {
  fs.mkdirSync(new URL('./capturas/', import.meta.url), { recursive: true });
  const b64 = await pagina.evaluate(async () => {
    const m = await Membrete.dibujar({ centro: 'IES Fuente Lucena', consejeria: '', logo: null });
    let s = ''; m.bytes.forEach((b) => { s += String.fromCharCode(b); }); return btoa(s);
  });
  fs.writeFileSync(new URL('./capturas/membrete.png', import.meta.url), Buffer.from(b64, 'base64'));
}

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
