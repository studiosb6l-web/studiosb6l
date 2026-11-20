# STUDIOSB6L — Política de custos e limites
Estado: código inicial em branch de desenvolvimento, **não instalado** na infraestrutura.
- Orçamento inicial: **0 EUR/dia e 0 EUR/mês para despesas incrementais**. Sem subscrições pagas, upgrades ou serviços com custos variáveis sem autorização explícita do proprietário.
- O custo de uma funcionalidade **não autoriza automaticamente** cobrar ao cliente. Antes de qualquer cobrança: preço visível, termos, consentimento, impostos, política de reembolso e checkout aprovado.
- Guardar orçamento por serviço e por utilizador, limites diários/mensais e quotas; bloquear novas operações antes do limite, notificar a administração, manter leitura e funções essenciais quando possível.
- Robôs: monitorizar consumo, projeção, erros, tarifas, API calls, armazenamento, IA/tradução, vídeo, emails, assinaturas, Stripe e Cloudflare.
- Enforçar limites com reserva atómica (D1 transaction/Durable Objects) antes de chamar fornecedores, reconciliação e margem de segurança. Implementar hard caps no próprio fornecedor quando suportados.
- **Não é possível garantir despesa zero só com robôs**: custos base, operações já iniciadas, atraso de métricas e fornecedores sem hard caps podem faturar. Configurar alertas externos e limites nas contas.
- Preços e tarifas devem ser verificados na conta de cada fornecedor; não inventar margens nem prometer rentabilidade.
- Respeitar contratos e legislação aplicável, incluindo requisitos de transparência e direitos do consumidor.
