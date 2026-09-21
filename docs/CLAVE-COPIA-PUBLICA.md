# Poner en marcha la copia sin internet — pasos para Francisco

Se hace una sola vez. Se puede hacer desde el ordenador del instituto, porque GitHub se abre allí.
Ninguna sesión de Claude puede hacer estos pasos: GitHub no les deja crear repositorios ni
tocar las acciones automáticas.

## A. Crear el sitio público

1. Abre **https://github.com/new**.
2. En el nombre escribe `gestor-asuntos-copia`. Marca **Public**. Marca también **Add a README
   file**. Pulsa **Create repository**.

## B. Activar la acción que lo rellena

3. Abre **https://github.com/fmargon780/gestor-asuntos-ies/blob/main/docs/copia-publica.yml.txt**.
   Arriba a la derecha del texto hay un botón con dos cuadraditos (**Copy raw file**). Púlsalo.
4. Abre **https://github.com/fmargon780/gestor-asuntos-ies/new/main?filename=.github/workflows/copia-publica.yml**.
   Pega en el cuadro grande (Ctrl+V). Pulsa **Commit changes…** y otra vez **Commit changes**.

## C. La clave

5. Abre **https://github.com/settings/personal-access-tokens/new**. En el nombre escribe
   `copia gestor`. En **Expiration** elige la fecha más lejana que deje.
6. En **Repository access** elige **Only select repositories** y marca **solo**
   `gestor-asuntos-copia`. En **Permissions → Repository permissions**, busca **Contents** y
   elige **Read and write**. Pulsa **Generate token** y luego el botón de copiar (el código empieza
   por `github_pat_`; no se vuelve a enseñar).
7. Abre **https://github.com/fmargon780/gestor-asuntos-ies/settings/secrets/actions/new**. En
   **Name** escribe `COPIA_TOKEN`. En **Secret** pega el código (Ctrl+V). Pulsa **Add secret**.

## D. Primera publicación

8. Abre **https://github.com/fmargon780/gestor-asuntos-ies/actions/workflows/copia-publica.yml**,
   pulsa **Run workflow** y otra vez **Run workflow**. En un par de minutos la copia está
   publicada. (Si no lo haces, se publica sola cada mañana y en cada mejora nueva.)

Después, sigue `docs/INSTALAR-COPIA.md` para instalarla en el ordenador del instituto.

Cuando caduque la clave del paso 5, la copia deja de actualizarse (sigue funcionando la que hay).
Entonces se repiten los pasos 5, 6 y 7.
