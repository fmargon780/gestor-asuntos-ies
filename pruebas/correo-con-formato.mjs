/* Prueba de la fila 772 de docs/COLA.md (docs/758-CORREOS-MAS-COMODOS.md, parte 2): negrita y tablas en el correo.
   Con Chromium real y la copia de pruebas (?demo=1&auto=1):
   1. la barra del Texto de la plantilla (negrita, cursiva, subrayado, listas, tabla y sus filas y columnas), pegar desde Word,
      «Así le llega» con formato, guardar y volver a abrir, el texto sencillo para Séneca (filas de tabla con « · »);
   2. una plantilla de antes, solo de texto, se abre igual;
   3. el cuadro de Correo trae el formato, deja retocarlo con la misma barra, y al enviar sale `cuerpoHtml` con sus estilos; con el
      script sin actualizar sale la línea ámbar y el envío se da por bueno; «Copiar Cuerpo» copia con formato;
   4. lo de dentro: limpiar (nada de `script`, `style` ni `on…`), rellenar (un valor con `<` y `&` no mete etiquetas, las marcas
      {si:…} en párrafos y casillas), el PDF con formato y el envío a un grupo. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 950 } });
pagina.setDefaultTimeout(8000);
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.removeItem('gestor-demo-script-al-dia'); } catch (e) { /* sin almacenamiento */ }");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 20000 });
await pagina.waitForFunction(() => window.Demo && !Demo.montando && window.Plantillas && Plantillas.enMemoria() && (Plantillas.enMemoria().lista || []).some((p) => p.id === 'pl-demo-libros'), null, { timeout: 40000 });

const abrir = async (id) => {
  await pagina.evaluate((i) => {
    const p = i ? Plantillas.enMemoria().lista.find((x) => x.id === i || x.nombre === i) : null;
    PlantillasAjustes.abrirCuadroDePlantilla(p, p ? null : { tipo: 'MATRICULA', categoria: 'ALUMNADO' }, () => {});
  }, id);
  await pagina.waitForSelector('#capa:not(.oculto) #pl-llega');
  await pagina.waitForFunction(() => document.getElementById('pl-previa').textContent !== '');
};
const cerrar = async () => { await pagina.click('#cuadro-cancelar'); await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto')); };
const html = (id) => pagina.evaluate((i) => document.getElementById(i).html, id);
const filasYColumnas = (id) => pagina.evaluate((i) => {
  const t = document.querySelector('#' + i + ' table');
  return t ? [t.querySelectorAll('tr').length, t.querySelector('tr').children.length] : null;
}, id);
const caretAlFinal = (id) => pagina.evaluate((i) => {
  const t = document.getElementById(i); t.focus();
  const r = document.createRange(); r.selectNodeContents(t); r.collapse(false);
  const s = getSelection(); s.removeAllRanges(); s.addRange(r);
}, id);
const seleccionar = (id, texto) => pagina.evaluate(([i, x]) => {
  const t = document.getElementById(i); t.focus();
  const w = document.createTreeWalker(t, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) { const k = n.data.indexOf(x); if (k !== -1) {
    const r = document.createRange(); r.setStart(n, k); r.setEnd(n, k + x.length);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; } }
  return false;
}, [id, texto]);
const boton = (cmd) => pagina.click('#capa:not(.oculto) [data-cfe="' + cmd + '"]');

console.log('--- la barra del Texto de la plantilla ---');
await abrir('');
await comprobar('1. el Texto lleva su barra: Negrita, Cursiva, Subrayado, Lista con puntos, Lista numerada y Tabla', pagina.evaluate(() =>
  Array.from(document.querySelectorAll('#pl-texto-rt .cfe-barra > [data-cfe]')).map((b) => b.textContent)),
['Negrita', 'Cursiva', 'Subrayado', 'Lista con puntos', 'Lista numerada', 'Tabla']);
await comprobar('1. la barra está encima del Texto', pagina.evaluate(() =>
  document.querySelector('#pl-texto-rt .cfe-barra').getBoundingClientRect().bottom <= document.getElementById('pl-texto').getBoundingClientRect().top + 1), true);
await comprobar('1. con el cursor fuera de una tabla no salen las filas y columnas', pagina.evaluate(() =>
  getComputedStyle(document.querySelector('#pl-texto-rt .cfe-en-tabla')).display), 'none');
await comprobar('1. «Séneca» y el Saludo y la Firma siguen en texto sencillo', pagina.evaluate(() =>
  [document.getElementById('pl-saludo').tagName, document.getElementById('pl-firma').tagName, document.getElementById('pl-texto-seneca').tagName]), ['TEXTAREA', 'TEXTAREA', 'TEXTAREA']);

await pagina.click('#pl-texto');
await pagina.keyboard.type('Hola uno dos tres cuatro');
await seleccionar('pl-texto', 'uno');
await boton('bold');
await seleccionar('pl-texto', 'dos');
await boton('italic');
await seleccionar('pl-texto', 'tres');
await boton('underline');
await comprobar('2. Negrita, Cursiva y Subrayado sobre lo elegido', html('pl-texto'), '<p>Hola <b>uno</b> <i>dos</i> <u>tres</u> cuatro</p>');
await seleccionar('pl-texto', 'uno');
await boton('bold');
await comprobar('2. pulsar otra vez Negrita la quita', html('pl-texto'), '<p>Hola uno <i>dos</i> <u>tres</u> cuatro</p>');
await seleccionar('pl-texto', 'dos');
await boton('italic');
await seleccionar('pl-texto', 'tres');
await boton('underline');
await comprobar('2. Cursiva y Subrayado también se quitan', html('pl-texto'), '<p>Hola uno dos tres cuatro</p>');

await caretAlFinal('pl-texto');
await pagina.keyboard.press('Enter');
await pagina.keyboard.type('Primero');
await boton('insertUnorderedList');
await pagina.keyboard.press('Enter');
await pagina.keyboard.type('Segundo');
await comprobar('3. Lista con puntos', pagina.evaluate(() => Array.from(document.querySelectorAll('#pl-texto ul > li')).map((l) => l.textContent)), ['Primero', 'Segundo']);
await pagina.keyboard.press('Enter');
await pagina.keyboard.press('Enter');
await boton('insertOrderedList');
await pagina.keyboard.type('Uno');
await pagina.keyboard.press('Enter');
await pagina.keyboard.type('Dos');
await comprobar('3. Lista numerada', pagina.evaluate(() => Array.from(document.querySelectorAll('#pl-texto ol > li')).map((l) => l.textContent)), ['Uno', 'Dos']);
await pagina.keyboard.press('Enter');
await pagina.keyboard.press('Enter');
await pagina.keyboard.type('Y una tabla:');
await pagina.keyboard.press('Enter');

console.log('--- la tabla ---');
await boton('tabla');
await comprobar('4. «Tabla» pregunta cuántas filas y columnas', pagina.evaluate(() => [document.querySelector('#pl-texto-rt .cfe-filas').value, document.querySelector('#pl-texto-rt .cfe-columnas').value]), ['3', '3']);
await pagina.fill('#pl-texto-rt .cfe-filas', '2');
await pagina.fill('#pl-texto-rt .cfe-columnas', '3');
await pagina.click('#pl-texto-rt .cfe-meter');
await comprobar('4. mete una tabla de 2 filas y 3 columnas', filasYColumnas('pl-texto'), [2, 3]);
await comprobar('4. con el cursor dentro de la tabla salen «+ Fila», «− Fila», «+ Columna» y «− Columna»', pagina.evaluate(() => {
  const e = document.querySelector('#pl-texto-rt .cfe-en-tabla');
  return [getComputedStyle(e).display !== 'none', Array.from(e.querySelectorAll('[data-cfe]')).map((b) => b.textContent)];
}), [true, ['+ Fila', '− Fila', '+ Columna', '− Columna']]);
await pagina.keyboard.type('Dato');
await pagina.keyboard.press('Tab');
await pagina.keyboard.type('Cuánto');
await pagina.keyboard.press('Tab');
await pagina.evaluate(() => document.getElementById('pl-texto').insertarTexto('{nombre}'));
await comprobar('4. se escribe en las casillas, el Tabulador pasa a la siguiente y un campo variable entra en una casilla', pagina.evaluate(() =>
  Array.from(document.querySelectorAll('#pl-texto table td')).map((c) => c.textContent)), ['Dato', 'Cuánto', '{nombre}', '', '', '']);
await boton('fila-mas');
await comprobar('4. «+ Fila» añade una fila', filasYColumnas('pl-texto'), [3, 3]);
await boton('columna-mas');
await comprobar('4. «+ Columna» añade una columna a todas las filas', filasYColumnas('pl-texto'), [3, 4]);
await boton('columna-menos');
await comprobar('4. «− Columna» la quita', filasYColumnas('pl-texto'), [3, 3]);
await boton('fila-menos');
await comprobar('4. «− Fila» la quita', filasYColumnas('pl-texto'), [2, 3]);

console.log('--- pegar desde Word ---');
await caretAlFinal('pl-texto');
await pagina.evaluate(() => {
  const dt = new DataTransfer();
  dt.setData('text/html', '<html><body><style>p{color:red}</style><p style="color:red;font-size:30pt;font-family:Arial">Pegado <b style="color:blue">en negrita</b>, <span style="font-style:italic">en cursiva</span> y <font color="red">con color</font></p>' +
    '<ul><li>Uno</li><li>Dos</li></ul><table style="width:300px" border="1"><tr><td style="background:yellow">A1</td><td class="x" onclick="alert(1)">B1</td></tr></table><script>alert(1)</script></body></html>');
  dt.setData('text/plain', 'Pegado en negrita');
  document.getElementById('pl-texto').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
});
const pegado = await pagina.evaluate(() => { const t = document.getElementById('pl-texto'); return { b: !!t.querySelector('b'), i: !!t.querySelector('i'), ul: t.querySelectorAll('ul').length, tablas: t.querySelectorAll('table').length,
  sucio: / (style|class|color|face|size|width|border|onclick)=|<script|<font|<span|<style/i.test(t.innerHTML), celdas: Array.from(t.querySelectorAll('table td')).map((c) => c.textContent).join('|') }; });
await comprobar('5. al pegar quedan la negrita, la cursiva, las listas y las tablas, y no el color, la letra ni los estilos', Promise.resolve([pegado.b, pegado.i, pegado.ul >= 2, pegado.tablas, pegado.sucio]), [true, true, true, 2, false]);
await comprobar('5. el texto de las casillas pegadas llega', Promise.resolve(pegado.celdas.indexOf('A1|B1') !== -1), true);
await comprobar('5. un texto sencillo pegado separa los párrafos por las líneas en blanco y deja los saltos de línea', (async () => {
  await caretAlFinal('pl-texto');
  await pagina.evaluate(() => {
    const dt = new DataTransfer(); dt.setData('text/plain', 'Uno\n\nDos\ntres');
    document.getElementById('pl-texto').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  });
  return pagina.evaluate(() => document.getElementById('pl-texto').html.endsWith('<p>Uno</p><p>Dos<br>tres</p>'));
})(), true);
// Lo pegado sobra: se deja solo lo que se ha escrito antes (negrita, listas y la tabla de arriba).
await pagina.evaluate(() => {
  const t = document.getElementById('pl-texto');
  Array.from(t.querySelectorAll('table')).slice(1).forEach((x) => x.remove());
  t.querySelectorAll('ul').forEach((u, i) => { if (i > 0) u.remove(); });
  Array.from(t.querySelectorAll(':scope > div, :scope > p')).filter((p) => /Pegado|^Uno$|^Dos|tres/.test(p.textContent)).forEach((p) => p.remove());
  t.dispatchEvent(new Event('input', { bubbles: true }));
});

console.log('--- «Así le llega» ---');
await pagina.evaluate(() => { const t = document.getElementById('pl-texto'); t.ponerHtml('<p>Hola <b>{nombre}</b>, mira esto:</p><table><tbody><tr><td>Dato</td><td>{nombre}</td></tr><tr><td>Otro</td><td>x</td></tr></tbody></table><ul><li>uno</li><li>dos</li></ul>'); });
await pagina.waitForFunction(() => document.querySelector('#pl-previa table'));
await comprobar('6. «Así le llega» enseña la negrita, la tabla y la lista, con los datos puestos y sin llaves', pagina.evaluate(() => {
  const p = document.getElementById('pl-previa');
  return [!!p.querySelector('b'), p.querySelectorAll('table tr').length, p.querySelectorAll('li').length, /[{}]/.test(p.textContent), getComputedStyle(p.querySelector('td')).borderTopWidth];
}), [true, 2, 2, false, '1px']);

console.log('--- guardar y volver a abrir ---');
await pagina.fill('#pl-nombre', 'Prueba del formato');
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));
await pagina.waitForFunction(() => Plantillas.enMemoria().lista.some((p) => p.nombre === 'Prueba del formato'));
await comprobar('7. se guarda el texto sencillo (cada fila de la tabla en una línea, casillas con « · ») y el html con formato', pagina.evaluate(() => {
  const p = Plantillas.enMemoria().lista.find((x) => x.nombre === 'Prueba del formato');
  return [p.texto, p.html];
}), ['Hola {nombre}, mira esto:\n\nDato · {nombre}\nOtro · x\n\n- uno\n- dos',
  '<p>Hola <b>{nombre}</b>, mira esto:</p><table><tbody><tr><td>Dato</td><td>{nombre}</td></tr><tr><td>Otro</td><td>x</td></tr></tbody></table><ul><li>uno</li><li>dos</li></ul>']);
await abrir('Prueba del formato');
await comprobar('7. al volver a abrirla, el formato sigue', html('pl-texto'), '<p>Hola <b>{nombre}</b>, mira esto:</p><table><tbody><tr><td>Dato</td><td>{nombre}</td></tr><tr><td>Otro</td><td>x</td></tr></tbody></table><ul><li>uno</li><li>dos</li></ul>');
await comprobar('7. y su texto sencillo es el de siempre', pagina.evaluate(() => document.getElementById('pl-texto').value), 'Hola {nombre}, mira esto:\n\nDato · {nombre}\nOtro · x\n\n- uno\n- dos');
await cerrar();

console.log('--- una plantilla de antes ---');
const antes = await pagina.evaluate(() => { const p = Plantillas.enMemoria().lista.find((x) => x.id === 'pl-demo-libros'); return { texto: p.texto, html: p.html || null }; });
await abrir('pl-demo-libros');
await comprobar('8. una plantilla de solo texto no lleva html guardado', Promise.resolve(antes.html), null);
await comprobar('8. se abre con el mismo texto, ahora en el recuadro con formato', pagina.evaluate(() => document.getElementById('pl-texto').value), antes.texto.trim());
await comprobar('8. y sin formato (sin negritas ni tablas)', pagina.evaluate(() => !document.getElementById('pl-texto').querySelector('b,i,u,table,ul,ol')), true);
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));
await pagina.waitForTimeout(400);
await comprobar('8. guardarla sin tocar el formato deja su texto igual y sin html', pagina.evaluate(() => { const p = Plantillas.enMemoria().lista.find((x) => x.id === 'pl-demo-libros'); return [p.texto.trim(), p.html || null]; }), [antes.texto.trim(), null]);

console.log('--- el cuadro de Correo ---');
const montar = (idPlantilla) => pagina.evaluate(async (id) => {
  const a = (App.E.listaAbiertos || []).find((x) => ((x.leido && x.leido.tipo) || (x.ficha && x.ficha.tipo)) === 'MATRICULA');
  if (!a) return false;
  window.__envios = [];
  if (!window.__envolvi) {
    window.__envolvi = true;
    const orig = CorreoEnviar.enviar;
    CorreoEnviar.enviar = function (d, l) { window.__envios.push(JSON.parse(JSON.stringify(d))); return orig.apply(this, arguments); };
  }
  CorreoNucleo.abrirCuadro(a, false);   /* no se espera: la promesa acaba al cerrar el cuadro */
  return true;
}, idPlantilla);
const elegirPlantilla = async (nombre) => {
  await pagina.evaluate((n) => {
    const s = document.getElementById('correo-plantilla');
    const o = Array.from(s.options).find((x) => x.textContent === n);
    s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true }));
  }, nombre);
  await pagina.waitForFunction((n) => { const s = document.getElementById('correo-plantilla'); return s.options[s.selectedIndex].textContent === n; }, nombre);
};
await comprobar('9. hay un asunto de MATRICULA abierto para probar', montar(), true);
await pagina.waitForSelector('#correo-cuerpo-texto');
await elegirPlantilla('Prueba del formato');
await comprobar('9. el cuerpo es un recuadro con su barra y trae el formato de la plantilla, con los datos puestos', pagina.evaluate(() => {
  const c = document.getElementById('correo-cuerpo-texto');
  return [c.getAttribute('contenteditable'), document.querySelectorAll('#correo-cuerpo-texto-rt .cfe-barra [data-cfe]').length > 5, !!c.querySelector('b'), c.querySelectorAll('table tr').length, c.querySelectorAll('li').length, /[{}]/.test(c.textContent)];
}), ['true', true, true, 2, 2, false]);
await comprobar('9. el cuerpo empieza por el saludo y acaba con la firma', pagina.evaluate(() => {
  const ps = Array.from(document.querySelectorAll('#correo-cuerpo-texto > div, #correo-cuerpo-texto > p'));
  return [/^Estimados tutores legales de /.test(ps[0].textContent), /Un saludo|Atentamente|Secretar|cordial/i.test(ps[ps.length - 1].textContent) || ps.length > 2];
}), [true, true]);
await comprobar('9. se retoca con la misma barra: negrita sobre lo elegido', (async () => {
  await seleccionar('correo-cuerpo-texto', 'mira esto');
  await pagina.click('#correo-cuerpo-texto-rt [data-cfe="bold"]');
  return pagina.evaluate(() => Array.from(document.querySelectorAll('#correo-cuerpo-texto b')).some((b) => b.textContent === 'mira esto'));
})(), true);
await pagina.evaluate(() => CorreoPara.ponerDirecciones('para', ['familia@example.org']));
console.log('--- enviar ---');
await pagina.click('#correo-enviar');
await pagina.waitForSelector('#correo-confirmar-envio');
await comprobar('10. el resumen dice que lleva formato', pagina.evaluate(() => /Lleva formato/.test(document.getElementById('correo-resumen').textContent)), true);
await pagina.click('#correo-confirmar-envio');
await pagina.waitForFunction(() => /Correo enviado a/.test(document.getElementById('correo-resumen').textContent), null, { timeout: 15000 });
const envio = await pagina.evaluate(() => window.__envios[0]);
await comprobar('10. el envío lleva el texto sencillo y el cuerpo con formato', Promise.resolve([typeof envio.cuerpo, /[<>]/.test(envio.cuerpo), /\| |·/.test(envio.cuerpo) || /Dato · /.test(envio.cuerpo), /<b>/.test(envio.cuerpoHtml), /<table style="border-collapse:collapse/.test(envio.cuerpoHtml)]), ['string', false, true, true, true]);
await comprobar('10. las tablas del correo llevan su borde y su relleno en línea (para que salgan en Gmail)', Promise.resolve([/<td style="border:1px solid #888888;padding:4px 8px/.test(envio.cuerpoHtml), /<p style="margin:0 0 12px 0">/.test(envio.cuerpoHtml), /(script|onclick|class=)/.test(envio.cuerpoHtml)]), [true, true, false]);
await comprobar('10. con el script sin actualizar, sale la línea ámbar y el correo se da por enviado', pagina.evaluate(() => [
  document.getElementById('correo-sin-formato') ? document.getElementById('correo-sin-formato').textContent : null, /Correo enviado a/.test(document.getElementById('correo-resumen').textContent)]),
['El correo ha salido sin formato: falta actualizar el script de Gmail.', true]);

await pagina.click('#cuadro-aceptar').catch(() => {});
await pagina.waitForTimeout(300);
await pagina.evaluate(() => { try { localStorage.setItem('gestor-demo-script-al-dia', '1'); } catch (e) { /* nada */ } });
await montar();
await pagina.waitForSelector('#correo-cuerpo-texto');
await elegirPlantilla('Prueba del formato');
await pagina.evaluate(() => CorreoPara.ponerDirecciones('para', ['familia@example.org']));
await pagina.click('#correo-enviar');
await pagina.waitForSelector('#correo-confirmar-envio');
await pagina.click('#correo-confirmar-envio');
await pagina.waitForFunction(() => /Correo enviado a/.test(document.getElementById('correo-resumen').textContent), null, { timeout: 15000 });
await comprobar('11. con el script al día no sale la línea ámbar', pagina.evaluate(() => !document.getElementById('correo-sin-formato')), true);

await pagina.click('#cuadro-aceptar').catch(() => {});
await pagina.waitForTimeout(300);
await montar();
await pagina.waitForSelector('#correo-cuerpo-texto');
await comprobar('12. sin plantilla, el cuerpo trae el saludo, un hueco donde escribir y la firma', pagina.evaluate(() => {
  const c = document.getElementById('correo-cuerpo-texto');
  return [c.querySelectorAll(':scope > div, :scope > p').length >= 3, !c.querySelector('b,table,ul,ol')];
}), [true, true]);
await pagina.evaluate(() => CorreoPara.ponerDirecciones('para', ['familia@example.org']));
await pagina.click('#correo-enviar');
await pagina.waitForSelector('#correo-confirmar-envio');
await comprobar('12. un correo sin formato no lo dice en el resumen', pagina.evaluate(() => /Lleva formato/.test(document.getElementById('correo-resumen').textContent)), false);
await pagina.click('#correo-confirmar-envio');
await pagina.waitForFunction(() => /Correo enviado a/.test(document.getElementById('correo-resumen').textContent), null, { timeout: 15000 });
await comprobar('12. y sale como siempre: sin `cuerpoHtml` y sin la línea ámbar', pagina.evaluate(() => [window.__envios[window.__envios.length - 1].cuerpoHtml === undefined, !document.getElementById('correo-sin-formato')]), [true, true]);

console.log('--- Copiar Cuerpo ---');
await pagina.click('#cuadro-aceptar').catch(() => {});
await pagina.waitForTimeout(300);
await montar();
await pagina.waitForSelector('#correo-cuerpo-texto');
await elegirPlantilla('Prueba del formato');
await pagina.evaluate(() => { window.__copiado = null; navigator.clipboard.write = async (items) => { window.__copiado = items[0].types.slice(); }; });
await pagina.click('#correo-copiar-cuerpo');
await pagina.waitForFunction(() => window.__copiado);
await comprobar('13. «Copiar Cuerpo» copia con formato (html) y como texto', pagina.evaluate(() => window.__copiado.slice().sort()), ['text/html', 'text/plain']);
await pagina.click('#cuadro-aceptar').catch(() => {});
await pagina.waitForTimeout(300);

console.log('--- lo de dentro ---');
await comprobar('14. limpiar: solo lo admitido', pagina.evaluate(() => CorreoFormato.limpiar('<div class="x" style="color:red" onclick="a()"><span style="font-weight:700">Hola</span> <img src=x onerror=a()><script>a()</script><a href="http://x">enlace</a></div>')), '<p><b>Hola</b> enlace</p>');
await comprobar('14. rellenar: un valor con < y & no mete etiquetas', pagina.evaluate(() => {
  const r = CorreoFormato.rellenar('<p>Hola {nombre}</p><table><tbody><tr><td>{nombre}</td></tr></tbody></table>', { nombre: 'A <b>&</b> B' });
  return [r.html, r.faltan];
}), ['<p>Hola A &lt;b&gt;&amp;&lt;/b&gt; B</p><table><tbody><tr><td>A &lt;b&gt;&amp;&lt;/b&gt; B</td></tr></tbody></table>', []]);
await comprobar('14. rellenar: las marcas {si:…} quitan o dejan el párrafo, el elemento de lista o la casilla', pagina.evaluate(() => {
  const v = { camposLista: { Tipo: ['Sí', 'No'] }, campos: { Tipo: 'Sí' } };
  return CorreoFormato.rellenar('<p>{si:Tipo=Sí} Sale</p><p>{si:Tipo=No} No sale</p><ul><li>{si:Tipo=No} fuera</li><li>{si:Tipo=Sí} dentro</li></ul>' +
    '<table><tbody><tr><td>{si:Tipo=Sí} casilla</td><td>{si:Tipo=No} casilla no</td></tr></tbody></table>', v).html;
}), '<p>Sale</p><ul><li>dentro</li></ul><table><tbody><tr><td>casilla</td></tr></tbody></table>');
await comprobar('14. el PDF del correo lleva el cuerpo con formato (negrita, lista y tabla) sin fallar', pagina.evaluate(async () => {
  const bytes = await CorreoEnviadoPdf.pdfDe({ de: '', para: 'a@b.es', cco: '', fecha: '27/11/2026 12:00', asunto: 'Prueba', cuerpo: 'x',
    cuerpoHtml: '<p>Hola <b>negrita</b> <i>cursiva</i> <u>subrayado</u></p><ul><li>uno</li><li>dos</li></ul><table><tbody><tr><td>Concepto de la primera columna que es larguísimo y tiene que saltar de línea dentro de su casilla</td><td>12,50</td></tr><tr><td>b</td><td>c</td></tr></tbody></table>', adjuntos: [] });
  return [bytes.length > 1000, String.fromCharCode.apply(null, Array.from(bytes.slice(0, 5)))];
}), [true, '%PDF-']);
await comprobar('14. el envío a un grupo lleva el formato de la plantilla', pagina.evaluate(() => {
  const c = GrupoEnviar.cuerpoHtmlPara({ categoria: 'ALUMNADO', nombre: 'Ana García, X' }, { nombreNatural: 'Ana', firma: 'Secretaría' }, '<p>Un <b>aviso</b></p><table><tbody><tr><td>a</td></tr></tbody></table>');
  return [/<p style="margin:0 0 12px 0">Hola, Ana:<\/p>/.test(c), /<b>aviso<\/b>/.test(c), /<td style="border:1px solid/.test(c), /Secretaría/.test(c)];
}), [true, true, true, true]);

await comprobar('15. sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
