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


## 6. Regras máximas — quotas e STOP EMERGÊNCIA (aprovadas em 2026-11-21)

**Estado:** especificação e interface a implementar; NÃO declarar botão funcional em produção sem integração backend, deploy e testes.

### Regra A — teto de 70% por quota gratuita diária
- Inventariar cada serviço e cada métrica faturável: Cloudflare Workers (requests e CPU), D1 (reads/writes/storage), R2, Queues, AI, APIs externas, robôs, traduções, indexação, email e quaisquer serviços adicionais. Quotas mensais ou não diárias exigem teto proporcional conservador, sem assumir que há quota diária.
- Mostrar no /admin/ por serviço: quota, unidade, consumo real, 70% teto operacional, 30% reserva, última leitura, estado e tendência histórica. Sem telemetria: mostrar «Indisponível», nunca números fictícios.
- Alertar em 50%, 60% e 65%; bloquear preventivamente novas operações não essenciais antes de 70%, tendo em conta consumo em trânsito, atraso de métricas e concorrência. Usar reservas atómicas de orçamento por pedido; falhar fechado se métricas não forem fiáveis.
- Proibir upgrade automático, overage, créditos pagos, fallback para fornecedores pagos e novas subscrições sem aprovação explícita do proprietário. Definir limites rígidos no próprio fornecedor quando disponíveis. O limite de 70% não constitui garantia de custo zero.

### Regra B — STOP EMERGÊNCIA global
- Painel privado /admin/: botão vermelho «STOP EMERGÊNCIA» com confirmação explícita e autenticação recente MFA/passkey. Não colocar botão de comando real em GitHub Pages público.
- Endpoint backend proprietário POST /admin/api/emergency-stop com autenticação, autorização, CSRF/origin, rate limit e idempotência; gravar estado global persistente `maintenance_mode=on`, `spending_lock=on` e auditoria. O próprio backend deve verificar as flags antes de cada operação, incluindo filas, cron jobs e webhooks que iniciem trabalho novo.
- Interromper novos registos, novas checkouts/cobranças iniciadas pela plataforma, robôs, filas, tarefas agendadas, publicações, chamadas de APIs e indexação. Não apagar dados, cancelar automaticamente pagamentos já capturados ou omitir obrigações de reembolso, segurança, conformidade e tratamento idempotente de webhooks. Manter plano mínimo de recuperação e suporte.
- Página pública de manutenção: HTTP 503 + Retry-After, sem divulgar motivos financeiros ou controlos internos. Texto PT: «Serviço temporariamente indisponível. Por favor, tente novamente mais tarde.» Traduzir para os idiomas do site. Não afirmar falsamente que ocorreu avaria.
- Recuperação apenas por ação manual do proprietário com MFA, testes de saúde, confirmação dupla e registo de auditoria. Nunca reativar automaticamente.
- Serviços externos já contratados podem continuar a cobrar; inventariar cada fornecedor, suspender jobs e aplicar caps/cancelamentos autorizados no próprio fornecedor. O STOP não é garantia de custo zero.

### Desenho do /admin/
- Cartão «Consumo da quota gratuita»: barra segmentada verde até 70% e reserva dourada de 30%, com valor real por serviço, alertas, filtro por período, histórico e hora de atualização. Mostrar «Sem dados» quando não há integração.
- Cartão «Estado geral»: normal / limite preventivo / emergência / indisponível.
- Cartão «STOP EMERGÊNCIA»: botão vermelho de grande dimensão, confirmação em duas etapas, estado persistente, lista de sistemas suspensos, hora e responsável, opção de reativação apenas após verificação.
- Acessível no telemóvel e computador; nunca embutir segredos, métricas privadas ou controlos administrativos em HTML público.

### Testes obrigatórios antes de produção
1. Testar autenticação, MFA, autorização e CSRF; utilizador não autorizado não pode acionar ou reverter STOP.
2. Simular 50/60/65/70%, métricas atrasadas e indisponíveis, corrida de pedidos e rollover de quotas.
3. Verificar que STOP bloqueia novas operações em todos os caminhos, inclusive filas e cron, sem perder dados.
4. Verificar checkout já iniciado, webhook Stripe repetido, reembolso e reconciliação; sem cobranças reais de teste.
5. Verificar manutenção 503, idiomas, SEO e disponibilidade do login administrativo de recuperação.
6. Testar reversão manual, logs e backups; publicar apenas com aprovação de segurança e custos, relatar URLs e evidências reais.
