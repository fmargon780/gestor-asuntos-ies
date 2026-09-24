# El masculino o el femenino, solo, en las plantillas

Acordado con Francisco el 24-sep-2026. Fila 111 de `docs/COLA.md`.

## Cómo trabajar esta instrucción

- Sube a `main` según las reglas de la cola (si la sesión es de la nube, pull request y fusión sola).
- Cambios quirúrgicos. No reescribas ficheros enteros que no sean nuevos.
- No leas el repositorio entero: con `docs/CONTEXTO.md`, el hijo de `docs/contexto/` de las
  plantillas, `js/plantillas.js`, `js/plantillas-documento.js`, `js/correo.js` y lo que ellos
  llamen, basta.
- Una sola tanda de pruebas al final. Comprueba lo publicado con `curl`.

## 1. Qué hay que conseguir

Francisco escribe las plantillas (de documento de Word y de correo) con las formas dobles de
siempre: «el/la alumno/a», «interesado/a», «D./Dña.», «hijo/a», «matriculado/a».

Al generar el documento o el correo, la aplicación **deja solo la forma que toca** según el sexo
de la persona: «el alumno» o «la alumna». Sin preguntar nada al generar.

Es una herramienta general, no un arreglo para «alumno/a»: vale para cualquier palabra escrita con
barra en la plantilla.

**No se inventa ninguna forma nueva de escribir para el caso normal.** Las plantillas del centro ya
cargadas (`plantillas/`) tienen que funcionar sin tocarlas.

## 2. Las reglas

1. **De quién es el sexo.** Por defecto, las barras se refieren a la **persona principal del
   asunto** (el tercero). Para otra persona dentro de la misma plantilla (la madre, un tutor
   legal, un tercero relacionado), decide tú una marca sencilla y déjala explicada en la ayuda de
   huecos de la pantalla de plantillas, con un ejemplo. Que sea fácil de escribir a mano en Word.
2. **Quien firma y quien da el visto bueno** llevan su propio sexo, el de la persona que ocupaba el
   cargo en la fecha del documento (ya existe `tratamiento firmante`, de la fila 81: aprovéchalo).
   «El/La Director/a» debe salir «La Directora» si firma una mujer. Si hace falta una marca para
   ligar una barra al firmante, la misma lógica del punto 1.
3. **Qué se reconoce como forma doble.** Como mínimo:
   - Palabra con terminación alternativa: `alumno/a`, `interesado/a`, `hijo/a`, `profesor/a`,
     `director/a`, `tutor/a`, `los/las`, `del/de la`, `al/a la`.
   - Dos palabras enteras separadas por barra: `el/la`, `D./Dña.`, `Don/Doña`, `padre/madre`,
     `Sr./Sra.`.
   - Con mayúscula inicial, se respeta: «El/La» → «El» o «La».
   - Si una barra no es una forma doble (una fecha `24/09/2026`, una ruta, `y/o`, una fracción,
     un registro, una dirección web), **no se toca**. Esto importa más que acertar en casos raros:
     antes de sustituir, compara con una lista de terminaciones y de pares conocidos; en la duda,
     se deja tal cual.
4. **Si no se sabe el sexo** de la persona, la forma doble se queda **tal cual, con la barra**.
   Nunca se elige una por defecto: un documento con «el/la alumno/a» es correcto; uno con «el
   alumno» para una alumna, no.
5. **Aviso.** Al generar, si quedó alguna forma doble sin resolver por falta del sexo, un aviso
   ámbar (`U.accesorio`) que diga de quién falta el dato y dónde ponerlo. El documento se genera
   igual.

## 3. De dónde sale el sexo

- **Alumnado**: de `RegAlum.csv`, si trae la columna (en Séneca suele llamarse «Sexo»; compruébalo
  en la cabecera del CSV, no en `p.campos`, regla del contexto). Si no la trae, se trata como
  «sin dato».
- **Tutores legales del alumno**: si el CSV lo trae, de ahí; si no, deducirlo de «padre»/«madre»
  no es fiable: sin dato.
- **Personal, terceros dados de alta a mano y cargos**: una casilla **Hombre / Mujer** en su ficha,
  que se rellena una vez y se guarda con el resto de sus datos. Empresas no la llevan: con una
  empresa, las barras se quedan como están.
- Si el cargo ya guarda un tratamiento (D./Dña.), sale de ahí sin pedir nada más.

## 4. Dónde se aplica

En todo lo que rellena huecos: `Plantillas.rellenar` (correo), la generación de documento de Word
(`js/plantillas-documento.js`) y el mensaje de Séneca si usa las mismas plantillas. Un solo sitio
que resuelva las formas dobles, llamado desde los tres; nada de copias del mismo código.

En el Word, cuidado con que una forma doble puede quedar partida entre varios trozos de texto del
propio fichero (igual que los huecos entre llaves). Usa el mismo remedio que ya se usa para los
huecos.

## 5. Pruebas

Casos mínimos en `pruebas/`:

- «el/la alumno/a matriculado/a» con alumna → «la alumna matriculada»; con alumno → «el alumno
  matriculado»; sin dato → igual que la entrada, y aviso.
- «El/La Director/a» con firmante mujer → «La Directora».
- Una frase con otra persona marcada (la marca que elijas) y con el tercero a la vez.
- Lo que no se toca: `24/09/2026`, `y/o`, `1/2`, `26EM1234/2026`, una dirección web.
- Mayúsculas y plantillas del centro ya cargadas: generar una de `plantillas/` y ver que sale
  limpia.

## 6. Al terminar

- Una línea en la sección 5 de `docs/CONTEXTO-CORTO.md` (sustituyendo la de plantillas, no
  añadiendo otra debajo).
- La explicación, con la marca para la segunda persona, en el hijo de `docs/contexto/` de las
  plantillas y en la ayuda de huecos de la propia pantalla.
- Entrada en `docs/HISTORIA.md`.
