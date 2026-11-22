# STUDIOSB6L — Entrega de tarefas para ChatGPT Work (2026-11-22)

## Trabalhos que exigem acesso operacional Cloudflare / navegador
1. Abrir Cloudflare com sessão autorizada e inspecionar o código EFETIVAMENTE publicado do Worker `studiosb6l-artists-api`, bindings, D1/KV/R2, secrets (sem copiar valores), rotas e logs, e confrontar com o frontend `/conta/`.
2. Testar registo, login, logout, recuperação de acesso, persistência de sessão, CORS, SameSite/Secure/HttpOnly, RBAC dos seis perfis, acesso proibido a administração, proteção contra abuso e MFA administrativo. Usar contas de teste de privilégio mínimo; não reutilizar passwords expostas em chats.
3. Auditar rotas de navegação, botões, mobile/desktop, painel admin, mensagens e métricas reais. Corrigir apenas com backup, testes, revisão e rollback.
4. Implementar STOP EMERGÊNCIA server-side com autenticação forte, confirmação, auditoria, aviso aos utilizadores e procedimento de reativação. Não desligar sistemas essenciais sem plano de recuperação.
5. Rever quotas/custos reais de Cloudflare, GitHub Actions, serviços de IA e pagamentos. Manter reserva mínima de 30% dos limites gratuitos, pausar tarefas não essenciais aos 70%, bloquear ativações automáticas de billing e obter aprovação antes de qualquer despesa.
6. Validar pagamentos apenas em sandbox e webhooks server-side; não realizar cobranças reais nem ativar faturação sem validação jurídica e financeira.
7. Verificar PR #27 e testes de segurança, integrar apenas se aprovado, e confirmar publicação e funcionamento com testes ponta-a-ponta.

## Critérios de comunicação
Reportar com evidências concretas o que foi verificado, alterado, publicado e ainda pendente. Não afirmar que a plataforma está operacional sem testes reais. Se Work não tiver sessão Cloudflare autorizada, solicitar ligação; não simular acesso. Percentagem global de referência: 35% ESTIMADOS, não medição automatizada.

## Links
- Repo: https://github.com/studiosb6l-web/studiosb6l
- PR: https://github.com/studiosb6l-web/studiosb6l/pull/27
- Site: https://www.studiosb6l.com
- Conta: https://www.studiosb6l.com/conta/
