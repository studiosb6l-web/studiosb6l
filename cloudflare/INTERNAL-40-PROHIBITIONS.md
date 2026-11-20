# STUDIOSB6L — 60 proibições internas

Política interna, não publicar na interface pública. A presença desta lista NÃO significa que todos os bloqueios estejam ativos. As regras financeiras devem ser implementadas nos serviços de pagamento, faturação e automatização antes de serem consideradas operativas. Nunca prometer risco financeiro zero.

| Nº | Regra | Estado verificado no código-fonte |
|---|---|---|
| 1 | Bloquear despesas sem autorização explícita | Pendente de implementação/testes no serviço responsável |
| 2 | Bloquear operações com custo desconhecido | Pendente de implementação/testes no serviço responsável |
| 3 | Bloquear saldo ou margem operacional negativa | Pendente de implementação/testes no serviço responsável |
| 4 | Bloquear compras automáticas de robôs | Pendente de implementação/testes no serviço responsável |
| 5 | Bloquear subscrições automáticas de serviços | Pendente de implementação/testes no serviço responsável |
| 6 | Bloquear renovações pagas não aprovadas | Pendente de implementação/testes no serviço responsável |
| 7 | Bloquear upgrades automáticos de planos | Pendente de implementação/testes no serviço responsável |
| 8 | Bloquear chamadas pagas de IA sem teto de custos | Pendente de implementação/testes no serviço responsável |
| 9 | Bloquear excesso de utilização de APIs pagas | Pendente de implementação/testes no serviço responsável |
| 10 | Bloquear cobranças duplicadas | Pendente de implementação/testes no serviço responsável |
| 11 | Bloquear pagamentos sem confirmação do processador | Pendente de implementação/testes no serviço responsável |
| 12 | Bloquear reembolsos sem validação de identidade | Pendente de implementação/testes no serviço responsável |
| 13 | Bloquear alteração de IBAN sem autorização forte | Pendente de implementação/testes no serviço responsável |
| 14 | Bloquear alteração de preços sem aprovação | Pendente de implementação/testes no serviço responsável |
| 15 | Bloquear alteração de comissões sem aprovação | Pendente de implementação/testes no serviço responsável |
| 16 | Bloquear pagamentos a terceiros não verificados | Pendente de implementação/testes no serviço responsável |
| 17 | Bloquear publicação automática de candidaturas | Parcial no Worker de candidaturas; implantação pendente |
| 18 | Bloquear perfis rejeitados ou suspensos | Pendente de implementação/testes no serviço responsável |
| 19 | Bloquear emails duplicados nas candidaturas | Parcial no Worker de candidaturas; implantação pendente |
| 20 | Bloquear candidaturas sem consentimento | Parcial no Worker de candidaturas; implantação pendente |
| 21 | Bloquear dados de candidatura inválidos | Parcial no Worker de candidaturas; implantação pendente |
| 22 | Bloquear pedidos de origens não autorizadas | Parcial no Worker de candidaturas; implantação pendente |
| 23 | Bloquear pedidos excessivamente grandes | Parcial no Worker de candidaturas; implantação pendente |
| 24 | Bloquear websites de candidatura com URL insegura | Parcial no Worker de candidaturas; implantação pendente |
| 25 | Bloquear pedidos a rotas administrativas inexistentes | Parcial no Worker de candidaturas; implantação pendente |
| 26 | Bloquear divulgação de credenciais e tokens | Pendente de implementação/testes no serviço responsável |
| 27 | Bloquear escrita na base de dados sem ligação válida | Parcial no Worker de candidaturas; implantação pendente |
| 28 | Bloquear perfis falsos e identidade fraudulenta | Pendente de implementação/testes no serviço responsável |
| 29 | Bloquear manipulação de visualizações e métricas | Pendente de implementação/testes no serviço responsável |
| 30 | Bloquear spam e inscrições automatizadas | Pendente de implementação/testes no serviço responsável |
| 31 | Bloquear ficheiros com malware | Pendente de implementação/testes no serviço responsável |
| 32 | Bloquear conteúdo ilegal ou sem direitos | Pendente de implementação/testes no serviço responsável |
| 33 | Bloquear venda de faixas sem autorização de direitos | Pendente de implementação/testes no serviço responsável |
| 34 | Bloquear publicação de conteúdo privado | Pendente de implementação/testes no serviço responsável |
| 35 | Bloquear recolha de dados pessoais desnecessários | Pendente de implementação/testes no serviço responsável |
| 36 | Bloquear acesso não autorizado a dados de utilizadores | Pendente de implementação/testes no serviço responsável |
| 37 | Bloquear alterações de permissões sem aprovação | Pendente de implementação/testes no serviço responsável |
| 38 | Bloquear remoção de registos de auditoria | Pendente de implementação/testes no serviço responsável |
| 39 | Bloquear alterações de produção sem testes | Pendente de implementação/testes no serviço responsável |
| 40 | Bloquear lançamento de funcionalidades sem avaliação de custos | Pendente de implementação/testes no serviço responsável |

## Critérios de ativação

Cada regra exige: responsável técnico, ponto de aplicação no backend, testes de bloqueio e permissão, registo de auditoria, monitorização e verificação em produção. Custos desconhecidos: negar por defeito. Nenhuma aprovação automática de perfis. Não bloquear funções legítimas sem avaliação.

## Regras adicionais 41–60 — propostas para aplicação nos serviços responsáveis

| Nº | Regra | Estado |
|---|---|---|
| 41 | Proibir transferências financeiras automáticas não autorizadas | Pendente de implementação e testes no backend responsável |
| 42 | Proibir criação de contas pagas por agentes de IA | Pendente de implementação e testes no backend responsável |
| 43 | Proibir contratação automática de serviços externos | Pendente de implementação e testes no backend responsável |
| 44 | Bloquear custos estimados acima dos limites autorizados | Pendente de implementação e testes no backend responsável |
| 45 | Proibir alterações automáticas de contas bancárias de beneficiários | Pendente de implementação e testes no backend responsável |
| 46 | Impedir pagamentos a artistas sem validação de titularidade e direitos | Pendente de implementação e testes no backend responsável |
| 47 | Bloquear levantamentos suspeitos para verificação | Pendente de implementação e testes no backend responsável |
| 48 | Impedir comissões negativas ou acima do contratado | Pendente de implementação e testes no backend responsável |
| 49 | Proibir descontos que tornem transações deficitárias | Pendente de implementação e testes no backend responsável |
| 50 | Impedir duplicação de pagamentos, reembolsos e transferências | Pendente de implementação e testes no backend responsável |
| 51 | Bloquear tentativas repetidas de acesso não autorizado | Pendente de implementação e testes no backend responsável |
| 52 | Impedir contas múltiplas usadas para manipular resultados | Pendente de implementação e testes no backend responsável |
| 53 | Bloquear publicação de música sem validação adequada de direitos | Pendente de implementação e testes no backend responsável |
| 54 | Impedir utilização não autorizada de identidades e marcas | Pendente de implementação e testes no backend responsável |
| 55 | Bloquear alterações críticas por IA sem autorização | Pendente de implementação e testes no backend responsável |
| 56 | Impedir eliminação não autorizada de bases de dados e backups | Pendente de implementação e testes no backend responsável |
| 57 | Bloquear exportações não autorizadas de dados pessoais | Pendente de implementação e testes no backend responsável |
| 58 | Impedir lançamento de funcionalidades com custos não avaliados | Pendente de implementação e testes no backend responsável |
| 59 | Suspender serviços ao atingir limites financeiros aprovados, quando tecnicamente possível | Pendente de implementação e testes no backend responsável |
| 60 | Impedir reativação de funcionalidades bloqueadas sem autorização e auditoria | Pendente de implementação e testes no backend responsável |

## Mecanismos transversais

- Política de negação por defeito para custos não autorizados; limites por serviço e alertas de orçamento.
- Permissões mínimas para agentes e registo de decisões, sem contratar robôs automaticamente.
- Suspensão de emergência de operações financeiras e automações, preservando os serviços essenciais.
- Regras não substituem controles Stripe/PayPal, segurança de autenticação ou conformidade legal; testar em ambiente de ensaio antes da produção.
