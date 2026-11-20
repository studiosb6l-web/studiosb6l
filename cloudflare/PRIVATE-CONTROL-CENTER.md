# STUDIOSB6L — Centro de Controlo Privado (especificação de implementação)

**Estado:** plano técnico versionado; não está instalado nem ativo em produção. **Acesso:** exclusivamente backend autenticado, nunca GitHub Pages, ficheiros JSON públicos ou JavaScript do navegador. **Política:** 60 regras internas em `cloudflare/INTERNAL-40-PROHIBITIONS.md`.

## 1. Painel administrativo
- Autenticação forte (MFA), sessão curta, RBAC mínimo e separação entre proprietário, auditor e operador.
- Métricas obtidas do backend autorizado: receitas confirmadas, reembolsos, taxas, custos, comissões, pagamentos pendentes, margem líquida, inscrições pendentes, falhas e alertas.
- Não guardar chaves Stripe/PayPal nem dados bancários no frontend ou repositório; utilizar secrets no serviço responsável.
- Estados explícitos `verified`, `pending`, `unavailable`; nunca apresentar números inventados nem zero quando não há dados.

## 2. Suspensão de emergência
- Feature flags server-side por operação (pagamentos de saída, registo, publicação, APIs pagas); por defeito, desativar operações novas não aprovadas.
- Suspensão manual por proprietário autorizado ou automática apenas perante condições objetivas verificadas; preservar consulta, suporte e operações já liquidadas.
- Auditoria imutável: ator, data, motivo, operação, regra e autorização; recuperação só após verificação.

## 3. Testes e monitorização
- Testes diários não destrutivos de disponibilidade, formulários, navegação multilingue, URLs, robots/sitemap e endpoints de saúde.
- Testes financeiros exclusivamente em sandbox; nunca efetuar cobranças reais ou gerar custos para verificar funcionamento.
- Testes de abuso, duplicados, limites, idempotência, autenticação, autorização e falhas de dependências.
- Alertas para erros, excesso de orçamento, tentativas de acesso, falhas de backup e discrepâncias financeiras.

## 4. Backups e recuperação
- Backup encriptado de D1 e configurações essenciais, com acesso restrito e retenção definida; verificar custos antes de ativar.
- Cópia fora do ambiente principal, rotação de chaves, teste de restauração em ambiente isolado e métricas RPO/RTO.
- Não incluir dados pessoais em logs públicos; respeitar prazos de retenção e direitos de titulares.

## 5. Relatório financeiro
- Conciliação por identificadores únicos entre Stripe/PayPal, encomendas, taxas, comissões e reembolsos.
- Fórmula: margem realizada = receitas liquidadas - taxas - reembolsos - comissões devidas - custos efetivamente incorridos; indicar separadamente valores pendentes.
- Alertas por orçamento e margem, mas não afirmar garantia de lucro ou impossibilidade de perdas.
- Relatório diário interno e mensal com exportação autorizada, sem envio de dados financeiros a terceiros não aprovados.

## Critérios de aceitação antes de ativar
1. Verificar permissões, MFA e isolamento de dados.
2. Implementar serviços reais com testes unitários, integração e ensaio.
3. Confirmar custos e orçamento aprovados antes de ativar qualquer serviço pago.
4. Validar que nenhuma candidatura é publicada sem aprovação e nenhuma cobrança é acionada pelo painel.
5. Confirmar monitorização, rollback, backups e recuperação; documentar evidências e responsável.
6. Confirmar implantação e testes de produção sem transações reais de teste.

## Acesso exclusivo do proprietário — requisitos aprovados

- Entrada por nome de utilizador + **duas palavras-passe independentes**; nenhuma credencial ou hash deve constar em GitHub, HTML, JavaScript do navegador ou logs.
- Validar ambas as palavras-passe **no backend**, com hashes Argon2id (ou mecanismo gerido equivalente), salts únicos, comparação segura, proteção contra força bruta, limites de tentativas e mensagens de erro genéricas.
- Exigir também MFA resistente a phishing, preferencialmente passkey/WebAuthn, e política de recuperação de conta com verificação forte; duas palavras-passe não substituem MFA.
- Não ativar página de login, registo ou endpoint de autenticação até existirem armazenamento seguro de segredos, sessões HttpOnly/Secure/SameSite, CSRF, autorização por operação, rate limiting e auditoria.
- Página /admin/ só deve apresentar conteúdo privado após validação server-side; não incorporar dados administrativos no site estático. Implementar proteção de acesso ao nível Cloudflare antes de disponibilizar qualquer rota administrativa.
- Criar a conta de proprietário e as duas palavras-passe apenas através de configuração segura, nunca solicitar segredos no chat.
- Critérios de aceitação: login válido, falha isolada de cada palavra-passe, MFA, bloqueio por tentativas, recuperação, logout, expiração de sessão, ausência de dados antes do login e teste de acesso direto aos endpoints.

## Identificador de acesso aprovado

- Nome de utilizador reservado para a conta única de proprietário: `SAME`.
- As duas palavras-passe devem ser escolhidas novamente pelo proprietário no fluxo de configuração segura. Não utilizar nem copiar palavras-passe partilhadas em conversas.
- Estado: conta ainda não provisionada; não declarar login operacional até implantação e testes.
