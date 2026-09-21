# La clave de la copia pública — pasos para Francisco

La copia sin internet se descarga desde un repositorio público nuevo,
`gestor-asuntos-copia`. Esta sesión de Claude Code no ha podido
crearlo por su cuenta (sin permiso para crear repositorios nuevos en
GitHub) ni tocar `.github/workflows/` (bloqueado por su propia
configuración de seguridad), así que faltan estos pasos, una sola vez.
Si tienes una sesión de Claude Code en terminal (no en la nube), puede
hacer por ti los pasos 1, 2 y 4; si no, aquí están para hacerlos tú
mismo, con enlaces directos.

1. Crea el repositorio público, vacío. Entra en
   **https://github.com/new**, pon de nombre `gestor-asuntos-copia`
   (el propietario, arriba del nombre, tiene que ser `fmargon780`),
   marca **Public** y pulsa **Create repository**. No hace falta
   marcar nada más: la propia acción de GitHub lo rellena en la
   primera subida de código.

2. Añade el workflow, dentro de **este mismo repositorio privado**
   (`gestor-asuntos-ies`), no en el público: entra en
   **https://github.com/fmargon780/gestor-asuntos-ies/new/main?filename=.github/workflows/copia-publica.yml**,
   y pega ahí el contenido de `docs/copia-publica.yml.txt` (desde la
   línea "name:" hasta el final, sin las líneas de comentario de
   arriba). Pulsa **Commit changes…** y confirma sobre `main`.

3. Crea el token de acceso. Entra en
   **https://github.com/settings/personal-access-tokens/new**.

4. En **Repository access**, elige **Only select repositories** y
   marca **solo** `gestor-asuntos-copia` (nada más: el workflow lee
   este repositorio privado con su propio permiso de siempre, y solo
   necesita el token para escribir en el público).

5. En **Repository permissions**, pon **Contents: Read and write**.
   Todo lo demás, en **No access**. Pulsa **Generate token** y copia el
   código que sale (empieza por `github_pat_`): no se vuelve a
   enseñar.

6. Guarda ese código como secreto en este repositorio privado. Entra en
   **https://github.com/fmargon780/gestor-asuntos-ies/settings/secrets/actions/new**,
   pon de nombre **`COPIA_TOKEN`** y pega el código en **Secret**.
   Pulsa **Add secret**.

Con esto, cada vez que se suba código nuevo a `gestor-asuntos-ies`, la
copia pública se actualiza sola (el primer `push` después de guardar
el secreto ya la deja lista). Después, sigue `docs/INSTALAR-COPIA.md`
para instalar la copia en un ordenador del instituto.
