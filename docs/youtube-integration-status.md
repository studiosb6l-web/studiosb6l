# YouTube Data API — integração STUDIOSB6L

Estado em 18-11-2026:
- A chave YouTube Data API v3 foi criada na Google Cloud e limitada aos referenciadores `https://studiosb6l.com/*` e `https://www.studiosb6l.com/*`.
- O diretório `/concertos/artistas/` utiliza `video-discovery.js` para apresentar vídeos incorporados selecionados e permitir pré-visualização manual de ligações.
- **A pesquisa automática pela API ainda não está ligada**. A lista editorial existente não é uma validação oficial por API.

## Próxima implementação segura

1. Configurar a chave como segredo de um serviço de execução seguro (não publicar a chave no repositório, em HTML ou em JavaScript). Para automação no GitHub Actions, usar um segredo do repositório, por exemplo `YOUTUBE_API_KEY`, com a chave apropriada para pedidos do servidor. **A chave atualmente restrita a referenciadores de sites não deve ser reutilizada num processo do GitHub Actions**, pois esses pedidos não têm o referenciador do site.
2. Implementar um trabalho periódico com limite de quota, cache e registo de erros para pesquisar candidatos usando YouTube Data API v3.
3. Verificar identidade do canal e disponibilidade de incorporação antes de apresentar cada vídeo como oficial; não assumir que o primeiro resultado é oficial.
4. Publicar apenas identificadores de vídeos e metadados públicos verificados num ficheiro JSON, mantendo a chave fora do site.
5. Manter as incorporações por clique, carregamento diferido e avisos editoriais. Testar anúncios AdSense, experiência móvel e direitos de terceiros.
6. A integração de vídeos não atribui automaticamente receitas das visualizações de YouTube ao operador do site.

Nenhuma credencial deve ser partilhada em capturas ou mensagens. Esta documentação não ativa a automação.
