#!/usr/bin/env bash

set -euo pipefail

NAME="${1:-xibo-test}"
TEMPLATE="${2:-}"

WORKSPACE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PARENT="$(dirname "$WORKSPACE")"
TARGET="$PARENT/$NAME"

echo "==> Removing previous '$NAME'..."

if [ -d "$TARGET" ]; then
    rm -rf "$TARGET"
fi

echo "==> Building xibo-modules..."

cd "$WORKSPACE"

npm run build

echo "==> Creating '$NAME'..."

if [ "$TEMPLATE" = "static" ] || [ "$TEMPLATE" = "element" ]; then
    npx xibo new "$NAME" "../$NAME"
elif [ -n "$TEMPLATE" ]; then
    npx xibo new "$TEMPLATE" "$NAME" "../$NAME"
else
    npx xibo new "$NAME" "../$NAME"
fi

echo "==> Installing local workspace..."

cd "$TARGET"

npm install "$WORKSPACE" --no-save

if [ "$TEMPLATE" = "static" ] || [ "$TEMPLATE" = "element" ]; then
    TEMPLATE_NAME="${NAME}Template"

    echo "==> Adding '$TEMPLATE' '$TEMPLATE_NAME'..."

    npx xibo add "$TEMPLATE" "$TEMPLATE_NAME"
fi

echo
echo "Xibo test project ready:"
echo "  Name: $NAME"

if [ -n "$TEMPLATE" ]; then
    echo "  Template: $TEMPLATE"
else
    echo "  Template: empty"
fi

echo "  Path: $TARGET"