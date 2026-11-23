# STUDIOSB6L — Inventário funcional e prontidão (2026-11-22)

## Método
Inspeção estática de ficheiros existentes no GitHub. Não foram executados testes ponta-a-ponta, consultas à D1, pagamentos ou verificações de sessão em produção. A percentagem abaixo é uma estimativa de planeamento, NÃO uma medição automatizada.

## Verificado no código
| Área | Evidência | Limite |
|---|---|---|
| Home | index.html existe; formulário privado preventDefault/reset sem API; viewport width=1024 | Acesso privado é demonstração; validar mobile |
| Conta | conta/index.html existe e envia POST para Worker workers.dev nos endpoints /api/auth/login, /api/auth/register e /api/auth/logout com credentials:include | Não comprovada resposta real, cookies, CORS, sessão ou autorização |
| Rede | rede/index.html tem categorias, filtro de pesquisa e pedido via mailto | Não há evidência de persistência ou marketplace operacional neste ficheiro |
| Admin | admin/index.html contém métricas '—', 'Aguardando base de dados', serviços disabled e integrações pendentes | Interface demonstrativa; não é painel administrativo funcional |
| Loja | music-store.html existe e contém links Payhip | Transações, direitos de acesso, comissões e webhooks não validados |
| SEO | sitemap.xml existe | Indexação e cobertura não verificadas |
| Recuperação | 404.html existe e aponta para /conta/ | Validar todas as rotas |

## Estimativa conservadora de prontidão: 35/100
Estimativa subjetiva de maturidade global, com grande incerteza por falta de acesso ao Worker efetivamente publicado e dados operacionais. Não representa 35% de testes passados nem 35% de funcionalidades comprovadamente ativas. Não atribuir 100% até concluir testes reais e controlo financeiro.

## Critérios de aceitação para 100%
1. Registo, login, logout, recuperação de acesso e sessões reais, com hash robusto, cookies seguros, MFA admin e proteção contra abuso.
2. Seis perfis com autorização server-side, CRUD de conteúdo, moderação e privacidade testados.
3. Mensagens e notificações persistidas e seguras.
4. Centro administrativo com métricas reais, auditoria e STOP EMERGÊNCIA funcional e reversível.
5. Pagamentos reais apenas após validação legal, antifraude, webhooks e reconciliação; testes sem cobranças reais.
6. Quotas monitorizadas com suspensão preventiva de tarefas não essenciais antes de 70% do limite gratuito; zero ativação automática de billing.
7. Testes E2E em desktop/mobile, acessibilidade, 404, performance, backups, rollback e monitorização.
8. Deploy controlado, confirmação externa de produção e ensaio de recuperação de falhas.

## Segurança de lançamento
Manter a produção intacta enquanto existirem pendências. Não usar credenciais de testes conhecidas como passwords de produção. Nunca publicar segredos no GitHub.
