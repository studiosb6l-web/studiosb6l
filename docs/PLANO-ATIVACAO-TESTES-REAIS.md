# STUDIOSB6L — Ativação funcional para testes reais

## Decisão do proprietário (21-11-2026)
A plataforma deve permitir testes com pessoas reais em Portugal, em todas as categorias. **A única funcionalidade que deve permanecer sem cobranças reais é o processamento de pagamentos.** Não confundir uma interface de demonstração com uma função operacional.

## Prioridade de execução
1. Configurar Cloudflare Worker + D1 (ou infraestrutura equivalente já aprovada) em ambiente operacional seguro; não ativar serviços pagos.
2. Autenticação real: inscrição, verificação de email, início/fim de sessão, recuperação de palavra-passe, hashing forte, proteção contra força bruta, cookies HttpOnly/Secure/SameSite, CSRF quando aplicável.
3. Cinco perfis e permissões: conservatórios/escolas, professores, estudantes, novos talentos, entidades/promotores. Cada conta deve entrar no seu painel, editar dados e gerir visibilidade/consentimento.
4. Correspondências reais por categoria, instrumento, competências, formação, localização, disponibilidade e objetivo. Não expor dados privados nem contactos sem consentimento.
5. Oportunidades e candidaturas: publicar, procurar, candidatar-se, acompanhar estado e moderar abusos.
6. Mensagens privadas entre contas autenticadas, bloqueio/denúncia e moderação.
7. Painel de administração autenticado com estatísticas agregadas, relatórios de erros e controlo de acessos; nunca embutir credenciais no frontend.
8. Fluxos de compra/inscrição podem ser simulados sem cobrança; impedir qualquer cobrança real até autorização posterior e testes de ponta a ponta.

## Segurança e custos obrigatórios
- Não exceder 70% de qualquer quota gratuita diária; reservar 30% de margem.
- Não ativar planos pagos, robôs de custo não verificado, nem cobranças reais.
- Proteção RGPD; minimizar dados; especial atenção a estudantes menores de idade e consentimento dos responsáveis.
- STOP EMERGÊNCIA controlado no backend para suspender serviços não essenciais e mostrar aviso ao utilizador, sem bloquear acesso administrativo de recuperação.
- Logs sem palavras-passe, tokens ou dados sensíveis.
- Separar ambiente de testes de produção, com dados e contas isolados quando possível.

## Critérios de aceitação — pessoa real em Portugal
- Cria conta com email próprio e confirma email.
- Entra com palavra-passe, termina sessão, recupera acesso.
- Escolhe categoria, guarda perfil e volta a encontrá-lo após sair e entrar.
- Publica uma oportunidade, encontra correspondência com segunda conta autorizada.
- Envia e recebe mensagem entre duas contas.
- Testa num telemóvel e num computador.
- Reporta erros com identificador de incidente sem revelar dados privados.
- Não sofre qualquer cobrança.
- Administrador vê estado dos testes e consegue suspender serviços com STOP EMERGÊNCIA.

## Estado conhecido
Frontend de Educação e demonstrador de correspondências existem em educacao/index.html.
**Ainda não há confirmação de autenticação real, D1 ligada, mensagens reais ou pagamentos desativados ao nível do backend.**
Não anunciar como operacional até os critérios acima passarem em produção.
