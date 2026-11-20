// Consent-aware, public-opportunity keyword classification. No personal-data harvesting.
export const normalizeText = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const KEYWORDS = Object.freeze({
  employment: ['musician wanted','hiring musicians','music jobs','audition','vacancy','contratacion','audicion','empleo musical','emprego musica','procura-se musico','vaga musico','recrutement musicien','casting'],
  collaboration: ['collaboration','collaborator','looking for producer','collaboracion','colaboracao','parceria musical','collaboration musicale'],
  performance: ['festival submission','call for artists','open call','concert booking','festival de musica','convocatoria artistas','candidaturas artistas','appel a candidatures','concours musical'],
  licensing: ['sync licensing','music for film','film composer','music supervisor','licenciamento musical','musica para cinema','musica para filme','licencia musical','musique de film'],
  education: ['conservatory','music school','music teacher','conservatorio','conservatorio de musica','escola de musica','professor de musica','conservatoire','professeur de musique'],
  promotion: ['promote your music','artist showcase','music promotion','divulgar musica','divulgacao musical','promocion musical','promotion musicale']
});
export function classifyPublicOpportunity(input) {
  const text=normalizeText(input);
  const categories=Object.entries(KEYWORDS).map(([category,words])=>({
    category, matched:words.filter(word=>text.includes(normalizeText(word)))
  })).filter(item=>item.matched.length);
  return {categories, relevant:categories.length>0, requiresReview:true};
}
export function eligibleForPublicDiscovery(item) {
  return Boolean(item && item.sourceAuthorized === true && item.public === true && item.status === 'verified' && item.url && /^https:\/\//.test(item.url));
}
