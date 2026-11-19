# B6L CONNECT — fontes reais candidatas (19-11-2026)

Estas páginas foram identificadas como diretórios de oportunidades musicais. **Não são feeds RSS validados e não autorizam scraping.** Não inserir URLs destas páginas em discovery_sources.feed_url sem confirmar API/RSS, permissões e condições de uso.

- ULYSSES Platform — https://ulysses-platform.eu/upcoming-and-open-opportunities — composição, chamadas internacionais.
- Sound and Music — https://soundandmusic.org/opportunities/ — oportunidades para compositores.
- Independent Society of Musicians — https://www.ism.org/composers/ — concursos e comissões.
- American Composers Forum — https://composersforum.org/opportunities/submit-an-opportunity — chamadas e submissões.
- ILINM — https://explore.ilinm.org/calls/ — diretório internacional.

## Sequência de ativação
1. Obter o ID verdadeiro da base D1 existente e confirmar cópia de segurança.
2. Aplicar cloudflare/connect-schema.sql à base D1 escolhida; nunca apagar a tabela artists.
3. Confirmar uma fonte RSS/Atom autorizada, com HTTPS e hostname fixo, antes de a ativar em discovery_sources.
4. Configurar binding DB, ALLOWED_FEED_HOSTS e cron em cloudflare/discovery-wrangler.example.toml, adaptando ao nome real do Worker.
5. Publicar o Worker, testar /health e a execução do cron; verificar logs e contagens D1.
6. Criar revisão humana de oportunidades pendentes; só depois marcar status='verified'.
7. Ligar o frontend ao endpoint real da API. Atualmente /connect/opportunities.json é apenas um ponto de integração e não há endpoint publicado nesse caminho.
8. Implementar autenticação antes de permitir mensagens ou notificações privadas; nunca confiar num ID de utilizador fornecido pelo browser.

O cron previsto é de 6 em 6 horas, 24/7. Não significa pesquisa contínua a cada segundo. A execução depende dos limites e disponibilidade Cloudflare.
