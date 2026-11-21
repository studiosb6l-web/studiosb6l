# Auditoria do Centro de Comando — 21-11-2026

## Evidência verificada em admin/index.html
- O painel declara explicitamente que a interface é preparada para integração e que não controla produção.
- Não há chamadas `fetch(` nem cabeçalho `Authorization` no ficheiro inspecionado.
- Indicadores, gráficos, perfis e finanças apresentam valores de substituição, não telemetria real.
- Botões de serviços, exportação e STOP EMERGÊNCIA estão `disabled`.
- O próprio painel assinala autenticação, MFA, logs e alertas como pendentes.

## Bloqueios de segurança
1. Não ativar controlo administrativo no cliente; exigir autenticação forte e autorização no backend para cada operação.
2. Não incluir palavras-passe, tokens, segredos ou dados privados no repositório público.
3. Não conectar Stripe/PayPal em produção sem validação de webhooks, idempotência, reconciliação, taxas e testes em sandbox.
4. Não anunciar STOP EMERGÊNCIA como funcional antes de implementação transacional e testes de recuperação.
5. Não expor dados pessoais ou de atividade no painel sem autorização e minimização RGPD.
6. Não ultrapassar 70% das quotas gratuitas; manter 30% de reserva e bloquear custos não autorizados.

## Requisitos para fechar a auditoria
- Inventário do Worker Cloudflare e respetivas rotas, bindings e regras de acesso (sem exportar segredos).
- Backup restaurável de D1/KV/R2 e configurações conforme recursos existentes.
- Testes de autenticação/roles, acessos negados, logout, MFA, rate limits e proteção contra CSRF conforme arquitetura.
- Testes end-to-end dos seis perfis, mobile e desktop, pagamentos sandbox e acessibilidade.
- CI/checks e aprovação antes de merge na main.

**Estado:** bloqueado para publicação; relatório técnico, não validação de backend.
