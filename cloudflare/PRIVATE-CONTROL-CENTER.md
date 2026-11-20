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
