# STUDIOSB6L — Regras internas de proibição 21–40

**Privado — não publicar no website nem mostrar sinais antifraude aos utilizadores.**

Estas regras são requisitos de implementação e teste; a existência deste ficheiro não prova aplicação em produção. Devem ser aplicadas do lado do servidor com controlos verificáveis, registos de auditoria e revisão humana das exceções. Não realizar despesas ou operações financeiras reais durante os testes.

21. Bloquear operações que excedam orçamentos explicitamente aprovados.

22. Impedir saldos negativos não autorizados em contas internas de artistas e profissionais.

23. Impedir transferências automáticas para contas bancárias não verificadas.

24. Suspender comissões e pagamentos sujeitos a disputas, reembolsos ou fraude, respeitando contratos e lei.

25. Impedir subscrições e renovações automáticas sem consentimento expresso.

26. Impedir contas múltiplas usadas para manipular classificações, oportunidades ou benefícios.

27. Impedir identidades falsas e credenciais profissionais fraudulentas.

28. Bloquear anúncios de trabalho, contratos ou eventos fraudulentos.

29. Impedir manipulação de bilhetes, reservas, vendas e estatísticas.

30. Bloquear operações com indícios de branqueamento de capitais ou outras atividades financeiras ilícitas e encaminhar para revisão adequada.

31. Impedir que robôs alterem configurações financeiras sem aprovação humana registada.

32. Impedir que robôs apaguem dados, contratos ou ficheiros críticos sem aprovação e recuperação verificada.

33. Interromper ciclos automáticos descontrolados e consumos excessivos de recursos.

34. Impedir que IA afirme oportunidades, contratos, pagamentos ou verificações sem evidência.

35. Impedir comunicações externas automáticas em nome da STUDIOSB6L sem autorização específica.

36. Impedir instalação de código ou dependências não verificadas em produção.

37. Impedir divulgação de credenciais, palavras-passe e chaves de API.

38. Impedir desativação não autorizada de controlos de segurança, auditoria e antifraude.

39. Impedir tratamento de dados de menores sem salvaguardas e autorizações legalmente exigidas.

40. Impedir alterações irreversíveis sem aprovação, cópias de segurança e avaliação de risco.

## Critérios de implementação

- Bloquear por defeito ações de risco quando faltar prova de autorização, sem suspender indiscriminadamente utilizadores legítimos.
- Testar cenários positivos, negativos, concorrência, duplicados, limites de custo, recuperação, regressões e proteção de dados.
- Exigir limites rígidos e comprovados de custos; sem limites, manter serviços opcionais desligados.
- Publicar apenas após testes, revisão, plano de reversão e confirmação de acesso à infraestrutura.
- Reportar separadamente: documentado, integrado, testado e efetivamente em produção.
