# CI local — antes do push

Repositório **privado** no GitHub. **Não usamos GitHub Actions** — evita consumo de minutos e qualquer custo associado a CI na nuvem.

Toda verificação roda **na sua máquina**, antes de `git push`.

## Comando único

```bash
npm run ci
```

Equivalente a `npm test` (106 testes: sanity + HTTP).

O arquivo `tests/http.test.js` sobe `python3 server.py` na porta **9876** automaticamente — não precisa iniciar o servidor manualmente para a suíte.

## Fluxo recomendado

```bash
npm install          # postinstall sincroniza maplibre + ícones
npm run ci           # deve terminar com 106 pass, 0 fail
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

- HTML/CSS/JS parseável, sem inline handlers
- MapLibre self-host, OpenFreeMap no runtime
- Cache headers (`no-cache` projeto, `immutable` vendor)
- Assets POI, ícones SVG, filtro temático
- Design system carregado nas 4 superfícies

## O que a suíte **não** cobre

- WebGL / renderização do mapa (smoke manual)
- Contraste WCAG automatizado
- Fluxo e2e landing → centro

Ver [test-matrix.md](./test-matrix.md).
