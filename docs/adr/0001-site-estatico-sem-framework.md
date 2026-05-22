# ADR-0001: Site Estático Sem Framework

## Status

Accepted

## Decisão

Manter o projeto_centro como **site estático com HTML/CSS/JavaScript vanilla**, sem framework frontend (React, Vue, Svelte, etc.).

## Contexto

O projeto_centro é um site narrativo/cartográfico focado em conteúdo estático e mapa interativo (MapLibre GL JS). Não possui:
- Formulários com envio de dados
- Autenticação real (o login em `arquivista/` é temático/narrativo)
- Backend ou banco de dados
- Estado compartilhado entre páginas
- Roteamento dinâmico

## Alternativas Consideradas

### React / Next.js

- **Pró:** Ecossistema grande, componentes reutilizáveis
- **Contra:** Overhead de bundle, necessidade de SSR/SSG para SEO, complexidade desnecessária para site estático

### Vue / Nuxt

- **Pró:** Menos verboso que React
- **Contra:** Mesma complexidade sem benefício real para o escopo

### SPA (Single Page Application)

- **Pró:** Navegação sem recarregar
- **Contra:** Sem roteamento que justifique SPA. Múltiplas páginas HTML já funcionam.

## Trade-offs

| Aspecto | Positivo | Negativo |
|---|---|---|
| Dependências | Zero dependências de framework | CDNs manuais sem gerenciamento de versão |
| Deploy | Cópia de arquivos estáticos — qualquer CDN ou servidor HTTP | Sem CI/CD configurado |
| Performance | Carregamento inicial rápido (sem JS framework) | Assets não otimizados |
| Manutenção | HTML/CSS/JS vanilla é universalmente compreensível | Lógica de UI manual |
| Testes | Sem framework de teste (precisa de setup manual) | `node:test` cobre sanity, mas não E2E |

## Consequências

- **Positivas:** Site leve, deploy simplificado, sem lock-in de framework
- **Negativas:** Gerenciamento manual de CDNs, sem hot-reload, testes E2E requerem ferramenta externa

## Nota metodológica

Decisões deste ADR foram revisadas com análise estruturada (framework CAPRI, externo ao repo). Componentes equivalentes: arquitetura (PDA), stack (TE), testes (TC).
