# STUDIOSB6L — suspensão de candidaturas (backend)

## Estado
O código em `cloudflare/artists-registration-worker.js` reconhece a variável de ambiente `STOP_REGISTRATIONS`. Esta alteração **não significa** que o Worker esteja publicado ou que a variável esteja configurada na Cloudflare.

## Procedimento seguro
1. Confirmar identidade e permissões de administrador na Cloudflare; fazer cópia da configuração atual.
2. Verificar a implantação do Worker e a ligação D1 `DB`, sem criar inscrições reais.
3. Para suspender **apenas novas candidaturas de artistas**, configurar `STOP_REGISTRATIONS=true` no ambiente do Worker e implantar a configuração. O endpoint POST `/api/applications` responderá HTTP 503 sem escrita na D1.
4. Confirmar com pedido de teste não destrutivo e consultar logs; o endpoint público de saúde não deve revelar estado interno da D1.
5. Para reabrir, retirar a flag ou definir `STOP_REGISTRATIONS=false` após autorização e verificação, documentando hora, motivo e responsável.

## Limites e riscos
- A flag **não suspende** pagamentos, logins, outros Workers, cron, filas ou serviços externos.
- A flag não é um botão de administração; não há endpoint público para alterar configurações.
- Não efetuar mudanças na Cloudflare sem acesso autorizado e sem plano de reversão.
- Executar `node --test tests/artists-registration-worker.test.mjs` e verificar GitHub Actions antes de produção.
- Não fazer cobranças reais de teste. Não ativar serviços pagos. Manter o limite preventivo de 70% das quotas gratuitas.
