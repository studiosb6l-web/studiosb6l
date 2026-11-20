# Proteções financeiras — estado de implementação
Código de avaliação criado, **não ligado a produção**. Não é um robô em execução, um painel online, nem garante prejuízo zero.

## Gates obrigatórios
- Custos completos e confirmados em cêntimos: processamento, IVA/impostos, fornecedor, reembolsos, chargebacks, custos adicionais e margem mínima.
- Orçamento aprovado, reserva atómica de quota e hard cap real no fornecedor.
- Identidade verificada; inscrições duplicadas e padrões suspeitos seguem para revisão humana.
- Robôs podem comparar alternativas verificadas e recomendar suspensão, nunca gastar ou contratar.
- Painel financeiro só pode mostrar margem estimada com receitas liquidadas e despesas conciliadas; não contabilizar pagamentos pendentes como receita.
- Testar em staging e integrar no Worker/DB/Stripe com logs, alertas e circuit breaker. Validar limites de GitHub/Cloudflare e tarifas efetivas, incluindo custos fixos.
- Manter €2,99 de adesão única e restantes comissões/planos inalterados. Não ativar cobrança antes de identidade, webhooks e testes completos.
