#!/bin/bash
# vercel.json llama a este script como "ignoreCommand" (fila 48,
# docs/NO-GASTAR-PUBLICACIONES.md): en el propio JSON no cabe la receta
# entera, el límite de Vercel son 256 caracteres.
#
# Sale con 0 para saltarse la publicación, con 1 para publicar.
# Ante cualquier duda, publica (sale 1).
# Fila 222 (docs/COPIA-DE-PRUEBAS.md): la rama "pruebas" también publica
# (es la copia de pruebas, pruebas.fmargon.com); las demás ramas de
# trabajo (claude/**) se siguen saltando, como hasta ahora.
if [ "$VERCEL_GIT_COMMIT_REF" != "main" ] && [ "$VERCEL_GIT_COMMIT_REF" != "pruebas" ]; then
  exit 0
fi

BASE="${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"
git cat-file -e "$BASE^{commit}" 2>/dev/null || exit 1

git diff --quiet "$BASE" HEAD -- . \
  ":(exclude)docs" ":(exclude)pruebas" ":(exclude).github" ":(exclude)*.md" \
  && exit 0 || exit 1
