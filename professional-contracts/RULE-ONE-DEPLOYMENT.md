# STUDIOSB6L — Regra financeira n.º 1 (proposta de implementação)

**Adesão:** 2,99 € uma única vez, obrigatória para criar uma conta; sem renovação automática. Website público pode continuar acessível sem conta. Não confundir com donativo voluntário. Preço final ao consumidor e IVA devem ser validados antes da publicação. Não cobrar de novo a quem já tem adesão paga válida. Definir transição justa para contas existentes antes da ativação.

**Restantes modalidades:** funcionalidades profissionais/empresariais opcionais e restantes comissões permanecem separadas, sem alteração dos valores já aprovados. Nenhuma cobrança real deve ser ativada até verificação da integração, autorização e testes.

**Regra 1 — evitar operações deficitárias:** bloquear por defeito se custo, taxas, impostos, risco de reembolso/chargeback, margem, limites ou medição forem desconhecidos. Exigir limite rígido no fornecedor, reserva atómica de quota, preço aprovado, consentimento e pagamento confirmado no servidor antes de serviços pagos. Não presumir que 2,99 € financiam consumo ilimitado. Robôs só podem recomendar a alternativa segura mais económica, suspender operações e alertar; não podem contratar, gastar, mudar preços ou desbloquear serviços por iniciativa própria.

**Publicação segura pendente:** implementar gateway real de adesão Stripe/PayPal, webhook assinado, idempotência, D1 com estado da adesão, gestão de reembolsos e chargebacks, IVA/faturação, RGPD, testes E2E, hard caps verificados e rollback. Sem isso, publicar apenas o código de preparação, nunca uma cobrança ou bloqueio de registo em produção.

**Limitação:** não existe garantia matemática de lucro ou prejuízo zero, especialmente em custos fixos, atrasos de medição, fraudes e disputas. Reconciliar custos e receitas regularmente.
