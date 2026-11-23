# STUDIOSB6L — Auditoria inicial de autenticação e segurança (2026-11-22)

## Evidência confirmada no GitHub
- Repositório: studiosb6l-web/studiosb6l; ramo principal main.
- index.html contém o formulário #b6l-private-form, campos username/password e botão Entrar.
- O handler submit chama preventDefault(), reset() e apenas altera #b6l-private-notice. Não faz pedido de autenticação ao backend.
- A própria interface avisa que a autenticação segura ainda está em configuração e não devem ser introduzidas credenciais reais.
- O meta viewport usa width=1024; requer testes visuais em dispositivos móveis antes de qualquer alteração, porque existe preferência por apresentação semelhante ao PC.

## Não verificado
- Código efetivamente publicado no Cloudflare Worker studiosb6l-artists-api; ligação à D1; endpoints de sessão; autenticação real; permissões; limites e custos Cloudflare; rotas de pagamento; implantação em produção.
- O formulário privado não deve ser confundido sem provas com o percurso de entrada de utilizadores normais/IZA.

## Plano seguro de implementação
1. Obter cópia do código publicado e inventário das rotas e bindings Cloudflare, sem divulgar secrets.
2. Validar endpoints, método de hash de passwords, rate limiting, MFA administrativo, sessões HttpOnly Secure SameSite, CSRF e permissões server-side.
3. Implementar autenticação de utilizador de testes com conta individual e password temporária, nunca credenciais hardcoded no frontend; proibir administração e pagamentos reais.
4. Integrar frontend com endpoints reais, estados de erro, logout e expiração de sessão.
5. Testar em ambiente de staging: login correto/incorreto, bloqueio de abuso, autorização entre perfis, mobile e desktop.
6. Confirmar custos/quota gratuita e regra de suspensão preventiva a 70%; não ativar billing automaticamente.
7. Publicar apenas após revisão, backup, testes e plano de rollback.

## Estado
Auditoria documental iniciada. Nenhuma correção de produção implementada ou validada. Não divulgar palavras-passe ou tokens em commits.
