import {classifyPublicOpportunity,eligibleForPublicDiscovery} from './opportunity-keywords.mjs';
const templates={
 employment:{title:'Bolsa internacional de trabalho musical',action:'Criar oportunidade verificada com candidatura voluntária e filtros de especialidade e localização'},
 collaboration:{title:'Rede de colaborações musicais',action:'Sugerir perfis aprovados e permitir convite privado apenas com consentimento'},
 performance:{title:'Circuito de festivais e audições',action:'Criar candidatura a eventos e filtros por país, género e disponibilidade'},
 licensing:{title:'Licenciamento musical para audiovisual',action:'Criar pedido de sincronização com verificação de direitos e condições comerciais'},
 education:{title:'Rede de conservatórios e formação',action:'Relacionar escolas, professores e alunos com perfis e requisitos verificados'},
 promotion:{title:'Vitrina internacional de artistas',action:'Propor página de divulgação, catálogo aprovado e oportunidades de promoção opt-in'}
};
export function proposeSolutions(opportunity){
 if(!eligibleForPublicDiscovery(opportunity))return [];
 const categories=classifyPublicOpportunity([opportunity.title,opportunity.description].join(' ')).categories;
 return categories.map(({category,matched})=>({category,title:templates[category].title,proposal:templates[category].action,keywords:matched,source:opportunity.url,status:'draft_review_required',automaticallyPublished:false}));
}
