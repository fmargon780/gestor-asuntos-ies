/* Fila 560 (docs/560-PARTIR-FICHEROS-GRANDES.md): index.html ya no lleva el HTML de las ventanas ni las etiquetas
   <script> de las piezas de código: las escriben, con document.write, js/pagina-*.js y js/cargar-piezas-*.js.
   Esta ayuda vuelve a armar el index.html «de antes» (con las ventanas y las etiquetas <script src> en su sitio y en
   su orden) para las pruebas que leen el texto de la página sin abrir un navegador. */
import fs from 'node:fs';

export function indexEntero(raiz) {
  const r = raiz.endsWith('/') ? raiz : raiz + '/';
  let html = fs.readFileSync(r + 'index.html', 'utf8');
  html = html.replace(/<script src="(js\/pagina-[^"]+)"><\/script>/g, (_, f) => {
    const t = fs.readFileSync(r + f, 'utf8');
    const ini = t.indexOf('document.write(`') + 'document.write(`'.length;
    const fin = t.lastIndexOf('`);');
    return '<script src="' + f + '"></script>' + t.slice(ini, fin).replace(/\\([\\`$])/g, '$1').replace(/<\\\/script/g, '</script');
  });
  html = html.replace(/<script src="(js\/cargar-piezas-[^"]+)"><\/script>/g, (_, f) => {
    const t = fs.readFileSync(r + f, 'utf8');
    return '<script src="' + f + '"></script>\n' + [...t.matchAll(/^\s*'(js\/[^']+)',/gm)].map((m) => '<script src="' + m[1] + '"></script>').join('\n');
  });
  return html;
}
