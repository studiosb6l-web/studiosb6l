# STUDIOSB6L — Regras de proibição n.º 3 a 20

**Estado:** políticas documentadas no ramo de desenvolvimento; a execução automática depende de implementação, testes e publicação. Complementam as regras n.º 1 (não operar com prejuízo/custos não verificados) e n.º 2 (robôs sem custo incremental por defeito). Bloqueios de risco devem ser fail-closed; direitos de acesso, privacidade, retenção e reembolsos seguem a legislação aplicável.

## Regra n.º 03
Proibido ativar cobranças sem preço, moeda e consentimento explícitos.

## Regra n.º 04
Proibido cobrar duas vezes pela mesma inscrição ou transação; exigir idempotência.

## Regra n.º 05
Proibido conceder acesso pago antes da confirmação autenticada do pagamento.

## Regra n.º 06
Proibido armazenar números completos de cartões, CVV ou segredos de pagamento.

## Regra n.º 07
Proibido aceitar webhooks sem assinatura válida, data e origem verificadas.

## Regra n.º 08
Proibido publicar perfis ou dados pessoais sem consentimento e verificação aplicável.

## Regra n.º 09
Proibido divulgar dados privados de alunos, artistas, empresas ou utilizadores.

## Regra n.º 10
Proibido permitir acesso administrativo sem autenticação forte e permissões mínimas.

## Regra n.º 11
Proibido alterar comissões, preços ou condições contratuais sem aprovação registada.

## Regra n.º 12
Proibido pagar comissões ou levantamentos sem reconciliação e validação antifraude.

## Regra n.º 13
Proibido publicar música, imagens ou vídeos sem declaração de direitos e licenças.

## Regra n.º 14
Proibido aprovar automaticamente casos suspeitos, sanções ou identidade inconclusiva.

## Regra n.º 15
Proibido usar bots para spam, perfis falsos, avaliações falsas ou manipular métricas.

## Regra n.º 16
Proibido enviar informação confidencial a serviços externos de IA sem base legal e autorização.

## Regra n.º 17
Proibido ativar APIs, subscrições ou infraestruturas sem limite de custo verificável.

## Regra n.º 18
Proibido publicar alterações críticas sem testes, revisão e plano de reversão.

## Regra n.º 19
Proibido apagar registos financeiros, logs de auditoria ou backups fora da política de retenção.

## Regra n.º 20
Proibido afirmar que pagamentos, funcionalidades ou verificações estão ativos sem confirmação real.

## Implementação exigida
Associar cada regra a controlo técnico, testes, responsável e registo de auditoria. Nenhuma regra deste documento deve ser apresentada como bloqueio operacional antes de ser integrada e validada em produção.
