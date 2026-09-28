#!/bin/bash
# Fila 225 de la cola (docs/AVISO-ESPERANDO-PERMISO.md). Hook de Claude Code:
# deja una marca en la rama "avisos" cuando la sesión se para a pedir un
# permiso o a hacer una pregunta, para que el Centro de mando no la dé por
# parada. Se llama con un argumento: "esperando" o "libre".
#
# Nunca debe romper la sesión: cualquier error se traga y el script sale
# siempre con 0. No imprime nada en la salida estándar (Claude Code la lee).
set -u

MODO="${1:-}"
FLAG="${TMPDIR:-/tmp}/aviso-esperando.flag"
REPO_ROOT="${CLAUDE_PROJECT_DIR:-}"
if [ -z "$REPO_ROOT" ]; then
  REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || REPO_ROOT=""
fi

# Construye el JSON de ESPERANDO.json (en node, para no pelear con el
# escapado de comillas en bash) y averigua la fila EN CURSO leyendo
# docs/COLA.md de la copia de trabajo. No toca la copia de trabajo: solo
# la lee.
JS_DATOS='
const fs = require("fs");
const path = require("path");
const modo = process.argv[1] || "";
const repoRoot = process.argv[2] || "";

let entrada = "";
try { entrada = fs.readFileSync(0, "utf8"); } catch (e) { entrada = ""; }

let mensajeOriginal = "";
try {
  const j = JSON.parse(entrada);
  if (j && typeof j.message === "string") mensajeOriginal = j.message;
} catch (e) { /* JSON vacío o roto: mensaje vacío */ }

function filaEnCurso() {
  if (!repoRoot) return "";
  let contenido;
  try { contenido = fs.readFileSync(path.join(repoRoot, "docs/COLA.md"), "utf8"); }
  catch (e) { return ""; }
  const lineas = contenido.split("\n");
  for (const linea of lineas) {
    if (linea.charAt(0) !== "|") continue;
    const celdas = linea.split("|").map((s) => s.trim());
    if (celdas.length < 4) continue;
    const numero = celdas[1];
    const estado = celdas[celdas.length - 2];
    if (/^[0-9]+$/.test(numero) && /^EN CURSO\b/.test(estado)) return numero;
  }
  return "";
}

function recortada(s) {
  return String(s).replace(/\s+/g, " ").trim().slice(0, 200);
}

function ahora() {
  return new Date().toISOString().replace(/\.\d+Z$/, "Z");
}

let salida;
if (modo === "esperando") {
  salida = {
    estado: "esperando",
    fila: filaEnCurso(),
    motivo: /permission/i.test(mensajeOriginal) ? "permiso" : "pregunta",
    desde: ahora(),
    mensaje: recortada(mensajeOriginal),
  };
} else {
  salida = { estado: "libre", fila: "", motivo: "", desde: ahora(), mensaje: "" };
}
process.stdout.write(JSON.stringify(salida));
'

# Escribe el JSON recibido como ESPERANDO.json en la rama "avisos" del
# remoto "origin", con las órdenes de bajo nivel de git: no toca el índice
# ni la rama en la que está la copia de trabajo, ni siquiera lee el HEAD
# actual. Cada aviso es un commit suelto, sin padre.
escribir_avisos() {
  local payload="$1"
  [ -n "$REPO_ROOT" ] || return 1
  [ -n "$payload" ] || return 1

  local blob tree commit
  blob="$(printf '%s' "$payload" | git -C "$REPO_ROOT" hash-object -w --stdin 2>/dev/null)" || return 1
  [ -n "$blob" ] || return 1
  tree="$(printf '100644 blob %s\tESPERANDO.json\n' "$blob" | git -C "$REPO_ROOT" mktree 2>/dev/null)" || return 1
  [ -n "$tree" ] || return 1
  commit="$(GIT_AUTHOR_NAME="${GIT_AUTHOR_NAME:-aviso-esperando}" \
            GIT_AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-aviso-esperando@localhost}" \
            GIT_COMMITTER_NAME="${GIT_COMMITTER_NAME:-aviso-esperando}" \
            GIT_COMMITTER_EMAIL="${GIT_COMMITTER_EMAIL:-aviso-esperando@localhost}" \
            git -C "$REPO_ROOT" commit-tree "$tree" -m "aviso" 2>/dev/null)" || return 1
  [ -n "$commit" ] || return 1

  if command -v timeout >/dev/null 2>&1; then
    timeout 10 git -C "$REPO_ROOT" push -f origin "$commit:refs/heads/avisos" >/dev/null 2>&1
  else
    git -C "$REPO_ROOT" push -f origin "$commit:refs/heads/avisos" >/dev/null 2>&1
  fi
}

hacer_esperando() {
  local entrada datos
  entrada="$(cat 2>/dev/null)" || entrada=""
  datos="$(printf '%s' "$entrada" | node -e "$JS_DATOS" -- "esperando" "$REPO_ROOT" 2>/dev/null)" || datos=""
  escribir_avisos "$datos" || true
  : > "$FLAG" 2>/dev/null || true
}

hacer_libre() {
  cat >/dev/null 2>&1 || true
  [ -f "$FLAG" ] || return 0
  local datos
  datos="$(node -e "$JS_DATOS" -- "libre" "$REPO_ROOT" </dev/null 2>/dev/null)" || datos=""
  escribir_avisos "$datos" || true
  rm -f "$FLAG" 2>/dev/null || true
}

case "$MODO" in
  esperando) hacer_esperando ;;
  libre) hacer_libre ;;
  *) : ;;
esac

exit 0
