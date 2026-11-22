# STUDIOSB6L — Centro de Inteligência sem custos variáveis

## Estado
Código preparado em branch de revisão. **Não está publicado, nem integrado no painel privado.**
A implementação inicial é um assistente FAQ determinístico; **não é um modelo de IA generativa**. Não faz chamadas externas nem processa pagamentos.

## Segurança e ativação
- Criar Worker separado e configurar `ASSISTANT_ENABLED=false` inicialmente.
- Não expor rotas administrativas neste Worker. O painel privado exige autenticação e autorização no backend antes de qualquer integração.
- Ativar o FAQ só após revisão de privacidade, limites de pedidos, prevenção de abuso e confirmação de quota gratuita.
- Não enviar nomes, emails, credenciais, mensagens privadas ou dados financeiros a modelos externos.
- Nunca ativar plano pago, upgrade ou cobrança automática.
- Se Workers AI for introduzido posteriormente, manter desativado por defeito e implementar contagem **atómica** de Neurons por dia, limite de 70% da quota gratuita, reserva de 30%, bloqueio em falha de medição e alertas no backend. Não confiar em contadores no browser.
- Validar quotas e condições de faturação na conta Cloudflare antes de ativar.
- STOP EMERGÊNCIA deverá impedir novas inferências server-side.

## Verificações antes da produção
1. Confirmar que `GET /health` apenas comprova a disponibilidade do gateway, não a API principal.
2. Confirmar que `POST /assist` devolve 503 enquanto desativado.
3. Testar entradas inválidas e não retenção de dados.
4. Integrar alertas persistentes no painel **apenas** depois de backend autenticado, D1 e permissões verificadas.
5. Testar custos e quotas no dashboard Cloudflare, sem faturação paga.

Não afirmar que registos, publicações, pagamentos ou a IA generativa estão operacionais por causa deste módulo.
