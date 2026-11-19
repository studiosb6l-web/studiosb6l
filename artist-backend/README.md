# STUDIOSB6L — ativação de candidaturas musicais

## Requisitos
Conta Cloudflare com Workers, R2 e KV disponíveis. O GitHub Pages continua a servir o website; o Worker recebe as candidaturas e o R2 guarda ficheiros **privados**.

## Instalação
1. Criar o bucket R2 **studiosb6l-artist-tracks-private** (sem acesso público).
2. Criar um namespace Workers KV para candidaturas e copiar o respetivo ID para `artist-backend/wrangler.toml`, substituindo `REPLACE_WITH_YOUR_KV_NAMESPACE_ID`.
3. Instalar Node.js e Wrangler num computador autorizado: `npm install -g wrangler`, depois `wrangler login`.
4. Na pasta `artist-backend`, criar segredo administrativo: `wrangler secret put ADMIN_TOKEN` (usar uma chave longa e única, nunca a publicar).
5. Publicar: `wrangler deploy`. Copiar o endereço HTTPS `*.workers.dev` apresentado pelo Wrangler.
6. No website, antes de `/assets/artist-track-submit.js`, definir `window.STUDIOSB6L_ARTIST_API_BASE='https://NOME-DO-WORKER.workers.dev'` e publicar a alteração **apenas após testar o serviço**.
7. Testar com um artista de demonstração e 1–5 ficheiros, confirmar a resposta de referência, os objetos privados em R2 e o registo no KV.
8. Consultar candidaturas com `GET /api/admin/applications`, header `Authorization: Bearer <ADMIN_TOKEN>`. Alterar o estado com `PATCH /api/admin/applications/<id>` e JSON `{"status":"approved"}` ou `{"status":"rejected"}`. **A aprovação não publica as faixas automaticamente.**

## Antes de abrir ao público
- Implementar anti-spam/rate limiting (Cloudflare WAF/Turnstile), quotas e alertas de custos.
- Rever privacidade, retenção e eliminação de dados (RGPD); fornecer aviso e contactos adequados.
- Implementar inspeção dos ficheiros, moderação, remoção e revisão de direitos.
- Criar um painel de administração autenticado; os endpoints existentes são uma API, não um painel.
- Testar limites do plano Workers para uploads de até 40 MB e verificar formatos MIME no navegador.
- Configurar backups, retenção e eliminação de dados, e monitorizar custos de armazenamento.
- Para publicar música aprovada, criar uma rota de distribuição de áudio com regras de direitos e controlo de acesso, separada do bucket privado.

## Estado atual
A interface de seleção e pré-visualização funciona localmente. O botão de envio direto só é ativado quando `STUDIOSB6L_ARTIST_API_BASE` estiver configurado. **Não afirmar que o upload está operacional até realizar os testes acima.**
