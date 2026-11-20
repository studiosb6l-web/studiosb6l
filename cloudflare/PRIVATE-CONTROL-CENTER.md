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

## Administração central de utilizadores, mensagens e gráficos

**Estado: requisitos aprovados; implementação e ativação ainda pendentes.**

- Painel privado do proprietário `SAME`: lista pesquisável e paginada de utilizadores (artistas, bandas, escolas, promotores, empresas), filtros por tipo, estado e país; detalhes estritamente necessários à gestão.
- Ações administrativas autorizadas: aprovar, rejeitar, suspender, reativar e responder a candidaturas ou pedidos de suporte, com confirmação, motivo, permissões verificadas no backend e auditoria. Não permitir editar ou ler palavras-passe, dados de cartões ou comunicações privadas fora dos canais de suporte.
- Caixa de entrada de suporte: tickets e mensagens enviados voluntariamente à plataforma, resposta por canais oficiais, estado, prioridade e histórico; envio de email apenas por serviço autorizado e com custo previamente verificado.
- Gráficos e indicadores por período: visitas e origens (quando consentidas), inscrições, perfis aprovados, vendas liquidadas, taxas, comissões, reembolsos, custos, margem e alertas; dados reais de APIs autorizadas, com carimbo de atualização e estados 'indisponível' quando não ligados.
- Visão operacional: tarefas e custos dos robôs, erros de integrações, status de D1/Worker, logs de auditoria, indexação SEO e traduções.
- Segurança: autenticação com nome de utilizador, duas novas palavras-passe e MFA; permissões por operação; rate limits; CSRF; proteção contra XSS; minimização de dados e RGPD; logs sem segredos; exportação restrita; dupla confirmação para ações destrutivas e financeiras.
- Nunca permitir impersonação silenciosa de utilizadores, consulta indiscriminada de mensagens privadas ou alteração retroativa de transações. Suporte delegado apenas com consentimento, quando aplicável.
- Testes de aceitação: acesso não autenticado bloqueado; contas não aprovadas não publicadas; resposta de suporte autorizada; gráficos consistentes com fontes; ações administrativas auditadas; rollback; mobile; alertas de custo; integração sem quebra de funcionalidades.
