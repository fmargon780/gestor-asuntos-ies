/* Apoyo de las pruebas de Etiquetas (fila 450): desde la fila 450 la hoja y el diseño se eligen en tarjetas que se
   despliegan encima de la hoja. `tarjetasSolas(pagina)` hace que, al pulsar o escribir en algo de la hoja (#et-modelo…)
   o del diseño (#et-diseno…), la tarjeta se despliegue sola si no lo estaba, para que las pruebas antiguas sigan
   escribiéndose igual. */
const TARJETA = [[/^#et-(buscar-modelo|modelo|medida-modelo|modelo-nuevo|modelo-cambiar|modelo-borrar)$/, 'hoja'],
  [/^#et-diseno(-nuevo|-duplicar|-editar|-borrar)?$/, 'diseno']];

export function tarjetasSolas(pagina) {
  async function abrir(selector) {
    if (typeof selector !== 'string') return;
    const par = TARJETA.find(([re]) => re.test(selector));
    if (!par) return;
    if (await pagina.locator(selector).count()) return;
    await pagina.click('[data-tarjeta="' + par[1] + '"]');
  }
  const click = pagina.click.bind(pagina), selectOption = pagina.selectOption.bind(pagina), fill = pagina.fill.bind(pagina), locator = pagina.locator.bind(pagina);
  pagina.click = async (s, o) => { await abrir(s); return click(s, o); };
  pagina.selectOption = async (s, v, o) => { await abrir(s); return selectOption(s, v, o); };
  pagina.fill = async (s, v, o) => { await abrir(s); return fill(s, v, o); };
  /* locator() es síncrono: abre la tarjeta antes de leer con un gancho en textContent. */
  pagina.locator = (s, o) => {
    const l = locator(s, o);
    const tc = l.textContent.bind(l);
    l.textContent = async (op) => { await abrir(s); return tc(op); };
    return l;
  };
  pagina.asegurar = abrir;
  return pagina;
}
