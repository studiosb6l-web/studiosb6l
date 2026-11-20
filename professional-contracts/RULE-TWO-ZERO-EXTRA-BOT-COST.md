# REGRA N.º 2 — Robôs sem custo adicional por defeito

**Política STUDIOSB6L.** Nenhum robô tem autorização implícita para gerar custos, contratar serviços, comprar créditos ou ativar planos pagos.

1. Priorizar lógica local, rotinas programadas e recursos já contratados, sem custo incremental confirmado.
2. Antes da ativação, confirmar por fornecedor os limites gratuitos, quotas, tarifários, retenção, tráfego e eventuais custos indiretos (Cloudflare Workers/D1, armazenamento, email, IA e APIs).
3. Se o custo marginal não for verificável, manter o robô desativado (fail closed).
4. Robôs de IA/tradução/pesquisa externa permanecem desativados até orçamento explícito, limite rígido do fornecedor e cobertura económica validada.
5. Um limite de utilização no código não substitui um limite de faturação efetivo no fornecedor; quando não existir limite rígido, não ativar consumos variáveis sem controlo adicional e aprovação.
6. Suspender execução quando a quota gratuita acabar; nunca passar automaticamente para serviço pago.
7. Nenhum robô pode comprar, subscrever, contratar, mudar planos ou autorizar pagamentos.
8. Registar custos, utilização e decisões de bloqueio em painel administrativo privado; exigir autenticação forte e trilho de auditoria.
9. Esta regra complementa a **Regra n.º 1 — bloquear operações deficitárias ou com custos não verificados**. A meta de custo adicional zero não é garantia de faturação zero: verificar sempre a conta real.
10. Estado atual: política documentada em branch de desenvolvimento; **não significa robôs ativados nem proteções aplicadas em produção**.

Critério para ativação: custo incremental confirmado de 0 € dentro da quota, hard cap do fornecedor ou isolamento seguro, testes de abuso e consumo, observabilidade e autorização de publicação.
