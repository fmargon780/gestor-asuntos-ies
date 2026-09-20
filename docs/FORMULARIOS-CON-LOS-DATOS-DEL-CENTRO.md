# Fila 84 · El impreso, con los datos del centro ya puestos

Acordado con Francisco el 20-sep-2026. **Sube directamente a `main`, sin abrir ninguna petición
de cambios.** Cambios quirúrgicos, sin leer el repositorio entero, y una sola pasada de pruebas
al final.

**Esta fila va después de la 82**, y la necesita: usa su catálogo de formularios.

Lee antes `docs/CONTEXTO.md`, `docs/FORMULARIOS-OFICIALES.md` (la fila 82) y
`docs/contexto/DOCUMENTOS-PDF.md` (la parte de pdf-lib). No hace falta ninguna otra zona.

---

## Por qué

Cuando se manda un impreso oficial a una familia, a un trabajador o a una empresa para que lo
rellene, hoy se manda en blanco del todo. Los datos del centro son siempre los mismos y el año
académico también: escribirlos a mano en cada impreso es trabajo repetido, y encima es donde más
erratas salen (un código de centro mal copiado).

## La regla que manda en esta fila

**Solo se rellenan los datos del centro y el año académico. Nada más.**

Los datos de la persona —nombre, apellidos, documento, domicilio, teléfono, correo, los tutores—
**los escribe ella**, aunque la aplicación los tenga. Es a propósito, y es decisión de Francisco:
así, al recibir el impreso de vuelta, se ve si algún dato suyo ha cambiado. Un impreso que llega
con los datos ya puestos no sirve para comprobar nada.

Si alguien pide más adelante rellenar también los datos de la persona, **no se hace sin volver a
hablarlo**: está descartado a sabiendas, no olvidado.

---

## Parte 1 · Los impresos en blanco, dentro de la aplicación

Los PDF no se bajan de la web de la Junta en el momento de usarlos: desde el navegador del centro
eso falla (la página de origen no lo permite, y la red del instituto bloquea lo que no hace
falta). Se guardan copiados.

- Carpeta nueva en el repositorio: **`formularios/`**, con el PDF en blanco de cada entrada del
  catálogo cuya vía sea `descarga` o `centro`. El nombre del fichero es la clave del catálogo con
  los dos puntos cambiados por un guion: `O-III.pdf`, `O11-VI.pdf`.
- `datos/formularios.json` (el de la fila 82) gana en cada entrada una clave `f` con ese nombre
  de fichero. Las entradas de vía `protocolo` y `seneca` no llevan ninguna: no hay impreso.
- **Si esta sesión no tiene salida a internet** para descargarlos (le pasó a la fila 63): haz
  igualmente todo lo demás, deja `formularios/` con los que hayas podido, y apunta una fila nueva
  en `docs/COLA.md` que diga cuáles faltan por copiar. El mecanismo funciona con los que haya.

## Parte 2 · Qué se rellena, y cómo se decide

### Los huecos permitidos

Solo estos siete, y ninguno más:

| Hueco | De dónde sale |
|---|---|
| `{{CENTRO}}` | `plantillas.json` → `centro` |
| `{{CODIGO CENTRO}}` | `plantillas.json` → `codigo` |
| `{{DIRECCION CENTRO}}` | `plantillas.json` → `direccion` |
| `{{LOCALIDAD}}` | `plantillas.json` → `localidad` |
| `{{PROVINCIA}}` | `plantillas.json` → `provincia` (**clave nueva**, con su campo en Ajustes → El centro) |
| `{{CURSO}}` | El año académico del asunto (`2026/2027`) |
| `{{HOY}}` | La fecha de hoy |

**Ningún hueco de persona entra aquí.** Si al configurar un impreso alguien intenta asignar un
dato de persona, el desplegable no se lo ofrece: solo salen estos siete.

### El mapa de cada impreso

Fichero compartido nuevo: **`_GESTOR/formularios-campos.json`**.

    { "O:III": { "nombre_centro": "{{CENTRO}}", "codigo_centro": "{{CODIGO CENTRO}}" } }

- La clave de fuera es la del catálogo; dentro, el nombre de cada casilla del PDF y el hueco que
  le toca. Las casillas que no estén en el mapa se quedan en blanco.
- Es uno de los ficheros compartidos: `Copias.guardar`, relectura antes de escribir, comprobación
  de fichero roto, y conflictos a mano en Ajustes (cambia poquísimo). **Los ficheros compartidos
  pasan a ser dieciséis** (quince tras la fila 81): corrige esa cuenta en `docs/CONTEXTO.md`.

### La propuesta automática

Al abrir un impreso por primera vez en Ajustes, la aplicación lee sus casillas con pdf-lib
(`PDFDocument.load(...).getForm().getFields()`) y **propone sola** el hueco de cada una, mirando
su nombre sin mayúsculas ni tildes:

| Si el nombre de la casilla contiene | Propone |
|---|---|
| `centro`, `denominacion`, `instituto` (y no `codigo`) | `{{CENTRO}}` |
| `codigo` | `{{CODIGO CENTRO}}` |
| `domicilio` o `direccion` junto a `centro` | `{{DIRECCION CENTRO}}` |
| `localidad` o `municipio` | `{{LOCALIDAD}}` |
| `provincia` | `{{PROVINCIA}}` |
| `curso` junto a `escolar` o `academico`, o `ano academico` | `{{CURSO}}` |
| `fecha` | `{{HOY}}` |

La propuesta es solo eso: Francisco la confirma o la cambia en un desplegable, y se guarda. Una
casilla que no case con ninguna regla sale sin asignar.

`Formularios.proponerMapa(nombresDeCasillas)` es una función **sin efectos**, en
`js/formularios-rellenar.js`, y es lo que se prueba.

### La pantalla

**Ajustes → El centro**, bloque nuevo **"Impresos oficiales"**: la lista de los impresos que
tienen PDF, cada uno con su estado ("sin configurar", "N casillas puestas") y un `<details>` con
la tabla de casillas y sus desplegables. Un aviso en gris en los impresos que **no tienen
casillas rellenables** (ver abajo): ahí no hay nada que configurar.

## Parte 3 · El botón

**"Preparar para el tercero"**, junto a cada formulario, en el panel de hitos y en la línea
"Formularios" de la ficha del asunto (las dos que monta la fila 82).

Al pulsarlo:

1. Lee el PDF de `formularios/`.
2. Rellena las casillas del mapa con los valores del centro y del curso del asunto, y **deja en
   solo lectura** solo las que ha rellenado (`field.enableReadOnly()`), para que nadie las cambie
   sin querer. **No se aplana el formulario** (`flatten()`): las demás casillas tienen que seguir
   escribiéndose, que de eso se trata.
3. Guarda el PDF en la carpeta del asunto, con el nombre de siempre
   (`Nombres.montarDocumento`: fecha de hoy, tipo de documento `IMPRESO`, y como texto adicional
   el nombre del formulario), sin pisar nada si ya existe.
4. Deja una nota en el asunto con `Notas.anadir` ("Preparado el impreso &lt;nombre&gt;").
5. Refresca la ficha, para que el impreso salga ya en la lista de documentos y se pueda adjuntar
   al correo o mandar por Séneca con lo que ya existe.

**Si el PDF no trae casillas rellenables** (`getFields()` vacío, o pdf-lib lanza un error al leer
el formulario): no se inventa nada ni se escribe texto encima. Se avisa en una línea ("Este
impreso no se puede rellenar: se guarda en blanco") y se guarda el PDF tal cual, con el mismo
nombre y la misma nota. El trámite sigue; solo cambia que la familia escribe también los datos
del centro.

---

## Qué hay que actualizar al terminar

- `docs/CONTEXTO-CORTO.md`, sección 5: una línea sobre el impreso preparado con los datos del
  centro.
- `docs/CONTEXTO.md`: la tabla de `_GESTOR` (`formularios-campos.json`), la cuenta de ficheros
  compartidos, y `plantillas.json` con `provincia`.
- `docs/contexto/DOCUMENTOS-PDF.md`: esta fila entera.
- `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`: `js/formularios-rellenar.js`, `formularios/`,
  `pruebas/formularios-rellenar.mjs`.
- `docs/HISTORIA.md`: una entrada con fecha, **con la regla de "solo los datos del centro"
  escrita y su porqué**, para que nadie la deshaga sin saberlo.
- `docs/CONTEXTO-CORTO.md`, sección 7 (Descartado): "rellenar también los datos de la persona en
  un impreso oficial — a propósito no, para poder comprobar al recibirlo si algo ha cambiado".

## Pruebas

`pruebas/formularios-rellenar.mjs` (sin navegador, con `vm`, como `pruebas/separar-unir.mjs`):
monta con pdf-lib un PDF con formulario y cuatro casillas; comprueba que `proponerMapa` acierta
con las siete reglas y no propone nada para una casilla llamada `apellidos`; que al rellenar solo
cambian las casillas del mapa; que las rellenadas quedan en solo lectura y las demás siguen
escribiéndose; y que un PDF sin formulario no rompe nada y devuelve el aviso.
