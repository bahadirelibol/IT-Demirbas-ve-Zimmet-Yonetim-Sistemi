#!/bin/sh
set -e
i=0
until pnpm exec prisma migrate deploy; do
  i=$((i + 1))
  if [ "$i" -ge 20 ]; then
    echo "Veritabanı migrasyonu tamamlanamadı"
    exit 1
  fi
  echo "Veritabanı bekleniyor..."
  sleep 2
done
pnpm exec tsx prisma/seed.ts
node dist/main.js
