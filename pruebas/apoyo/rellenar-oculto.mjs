/* Fila 629: año académico, descripción corta, fecha límite y «quién lo pide» de «Nuevo asunto» solo se enseñan en los
   tipos que los piden al crear; el resto de las pruebas los siguen escribiendo, aunque no se vean, con esta ayuda
   (pone el valor y avisa al formulario igual que una tecla). */
export async function rellenarOculto(pagina, selector, valor) {
  await pagina.$eval(selector, (e, v) => {
    e.value = v;
    e.dispatchEvent(new Event('input', { bubbles: true }));
    e.dispatchEvent(new Event('change', { bubbles: true }));
  }, valor);
}
