# STUDIOSB6L — Auditoria segura (21-11-2026)

## Estado
- Backup Git criado: `backup/pre-audit-2026-11-21` no commit `c6aabdc290882e6388872355f64328d72ffb938f`.
- Produção não alterada. Nenhum pagamento ou serviço pago ativado.
- Inspeção inicial de `index.html`, `admin/index.html`, `robots.txt`, `README.md`.

## Achados verificáveis
1. `index.html` define `<meta name="viewport" content="width=1024,initial-scale=1,minimum-scale=0.25,maximum-scale=5">`. A largura fixa 1024 pode forçar apresentação desktop em telemóveis; rever para `width=device-width,initial-scale=1` após testes visuais em todas as páginas.
2. `admin/index.html` tem viewport responsivo e `noindex,nofollow`, mas estes elementos **não** provam controlo de acesso. Validar autorização no servidor para todas as rotas administrativas e APIs.
3. `robots.txt` permite rastreamento público e aponta para `sitemap.xml`. Verificar URLs reais, hreflang e páginas localizadas antes de mudanças SEO.
4. `package.json` e `_headers` não foram encontrados nas localizações raiz consultadas. Isto não prova que faltem mecanismos de build ou cabeçalhos no alojamento.

## Portões antes de publicar
- Inventariar todas as rotas e dependências, incluindo Workers Cloudflare e base de dados.
- Criar backup restaurável de dados e configurações, com verificação de restauração.
- Auditar autenticação, permissões e ausência de credenciais em código público.
- Validar responsividade, acessibilidade e regressões em desktop e mobile.
- Confirmar limites gratuitos de 70%, reserva de 30%, sem serviços pagos automáticos.
- Validar STOP EMERGÊNCIA e respetiva autorização apenas no backend.
- Verificar pagamentos em ambiente de teste, nunca cobrar utilizadores reais durante auditoria.
- Só integrar após testes e aprovação; conservar rollback.

## Próxima correção candidata
Corrigir viewport de `index.html` num ramo de desenvolvimento, com revisão de layout e teste móvel antes de merge.
