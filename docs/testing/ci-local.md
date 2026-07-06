# CI local — antes do push

Repositório **privado** no GitHub. **Não usamos GitHub Actions** — evita consumo de minutos e qualquer custo associado a CI na nuvem.

Toda verificação roda **na sua máquina**, antes de `git push`.

## Comando único

```bash
npm run ci
```

Equivalente a `npm test` (**173 testes**: 144 sanity + 29 HTTP).

O arquivo `tests/http.test.js` sobe `python3 server.py` na porta **9876** automaticamente — não precisa iniciar o servidor manualmente para a suíte.

## Fluxo recomendado

```bash
npm install          # postinstall sincroniza maplibre + ícones + three
npm run ci           # deve terminar com 173 pass, 0 fail
git add …
git commit …
git push
```

## Smoke opcional (browser)

Após `npm run ci` verde:

```bash
python3 server.py
# outro terminal:
node scripts/smoke-centro.mjs
```

Checklist completo: [smoke-centro.md](./smoke-centro.md).

## Por que não GitHub Actions?

| Motivo | Detalhe |
|---|---|
| Repositório fechado | Minutos de Actions em repo privado entram na cota gratuita; autora prefere zero dependência |
| Custo | Nenhuma fatura de CI |
| Simplicidade | Site estático; `npm test` cobre regressões estruturais e HTTP |

Se o repositório tornar-se público no futuro, Actions gratuitos para projetos open source são uma opção — mas continua opcional.

## O que a suíte cobre

- Parse HTML/JS/CSS do Centro
- Integridade catálogo (**21 camadas**, phase-gates, layer-unlocks)
- Boot híbrido (`runMapBootPolicy`, POI `loadState` v3)
- HTTP 200 + cache headers via `server.py`
- Proibição `setHTML` no runtime
- Superfícies removidas (`/landing/` etc.) → 404
