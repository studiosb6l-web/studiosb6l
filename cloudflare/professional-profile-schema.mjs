// Public professional fields only. Account email, credentials and billing are never profile fields.
const field=(id,label,type='text',required=false)=>({id,label,type,required});
export const SECTORS=Object.freeze({
 musician:{label:'Músico / Instrumentista',person:true,fields:[field('instruments','Instrumentos','list',true),field('genres','Géneros musicais','list'),field('experience','Experiência e atuações')]},
 singer:{label:'Cantor / Cantora',person:true,fields:[field('voice','Voz e repertório','text',true),field('genres','Estilos e géneros','list'),field('languages','Idiomas de interpretação','list')]},
 band:{label:'Banda / Grupo musical',person:true,fields:[field('instruments','Formação e instrumentos','list',true),field('genres','Géneros musicais','list',true),field('repertoire','Repertório e espetáculos')]},
 composer:{label:'Compositor',person:true,fields:[field('specialties','Áreas de composição','list',true),field('genres','Géneros e repertório','list'),field('formats','Formatos de entrega','list')]},
 producer:{label:'Produtor musical',person:true,fields:[field('specialties','Especialidades de produção','list',true),field('genres','Géneros musicais','list'),field('daws','Sistemas de produção / DAW','list')]},
 audio_engineer:{label:'Engenheiro de áudio',person:true,fields:[field('specialties','Gravação, mistura, pós-produção ou som ao vivo','list',true),field('daws','DAW e sistemas utilizados','list',true),field('formats','Formatos de trabalho','list'),field('studio','Estúdio, equipamento e condições técnicas')]},
 mastering:{label:'Técnico de masterização',person:true,fields:[field('formats','Formatos de entrada e entrega','list',true),field('workflow','Método de masterização e controlo de qualidade','text',true),field('genres','Géneros musicais','list'),field('delivery','Prazos e versões de entrega')]},
 teacher:{label:'Professor de música',person:true,fields:[field('instruments','Instrumentos ou disciplinas ensinadas','list',true),field('levels','Níveis de ensino','list',true),field('languages','Idiomas das aulas','list'),field('method','Método e qualificações profissionais')]},
 school:{label:'Escola de música',person:false,fields:[field('disciplines','Disciplinas e instrumentos','list',true),field('courses','Cursos e programas','text',true),field('facilities','Instalações e recursos'),field('languages','Idiomas de ensino','list')]},
 conservatory:{label:'Conservatório',person:false,fields:[field('disciplines','Departamentos e instrumentos','list',true),field('courses','Programas e ciclos de estudo','text',true),field('admissions','Admissões, provas e calendário'),field('collaborations','Orquestras, estágios e parcerias')]},
 student:{label:'Aluno / Novo talento',person:true,fields:[field('instruments','Instrumentos ou disciplinas','list',true),field('level','Nível de formação','text',true),field('goals','Formação e oportunidades procuradas'),field('languages','Idiomas de aprendizagem','list')]},
 promoter:{label:'Promotor',person:false,fields:[field('events','Tipos de concertos e eventos','list',true),field('territories','Países e regiões de atividade','list'),field('requirements','Artistas e serviços procurados')]},
 venue:{label:'Sala / Teatro / Auditório',person:false,fields:[field('venueType','Tipo de espaço','text',true),field('capacity','Lotação e configuração'),field('equipment','Palco, som e equipamento técnico','text',true),field('events','Tipos de programação','list')]},
 company:{label:'Empresa / Organização',person:false,fields:[field('business','Setor e atividade profissional','text',true),field('specialties','Serviços e especialidades','list',true),field('collaborations','Parcerias e necessidades')]}
});
export const SERVICES=Object.freeze({performance:'Atuação musical',singing:'Canto',composition:'Composição',production:'Produção musical',recording:'Gravação',mixing:'Mistura / Mixagem',mastering:'Masterização',live_sound:'Som ao vivo',postproduction:'Pós-produção',teaching:'Ensino / Formação',promotion:'Promoção de eventos',venue:'Espaços e salas',distribution:'Distribuição'});
const clean=(v,max)=>typeof v==='string'&&v.trim().length<=max&&!/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)?v.trim():null;
export function publicUrl(value){
 if(value==='')return '';
 if(typeof value!=='string'||value.length>500)return null;
 try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||/^(localhost|.*\.local|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[|2130706433)/i.test(u.hostname))return null;return u.href;}catch{return null;}
}
export function validateProfile(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||['plan','approved','accountId','status','paid','role'].some(k=>Object.hasOwn(input,k)))return null;
 if(!Object.hasOwn(SECTORS,input.kind))return null;const sector=SECTORS[input.kind];
 const data={kind:input.kind};
 for(const [key,max] of [['name',120],['country',100],['city',100],['bio',1000]]){data[key]=clean(input[key],max);if(!data[key]||data[key].length<(key==='bio'?20:2))return null;}
 for(const key of ['photoUrl','website']){data[key]=publicUrl(input[key]||'');if(data[key]===null)return null;}
 if(!sector.person&&!data.website)return null;
 for(const key of ['services','seeking']){if(!Array.isArray(input[key])||input[key].length>13||input[key].some(v=>!Object.hasOwn(SERVICES,v)))return null;data[key]=[...new Set(input[key])];}
 if(!data.services.length&&!data.seeking.length)return null;
 if(!['onsite','remote','both'].includes(input.workMode))return null;data.workMode=input.workMode;
 for(const key of ['available','publishConsent','matchingConsent','showcaseConsent','photoRights']){if(typeof input[key]!=='boolean')return null;data[key]=input[key];}
 if(data.photoUrl&&!data.photoRights)return null;
 if(data.showcaseConsent&&(!sector.person||!data.photoUrl||!data.photoRights||!data.publishConsent))return null;
 data.details={};
 for(const field of sector.fields){
  let value=input.details?.[field.id]??(field.type==='list'?[]:'');
  if(field.type==='list'){if(!Array.isArray(value)||value.length>12)return null;value=[...new Set(value.map(v=>clean(v,80)))];if(value.some(v=>v===null))return null;value=value.filter(Boolean);}
  else{value=clean(value,500);if(value===null)return null;}
  if(field.required&&!value.length)return null;data.details[field.id]=value;
 }
 if(new TextEncoder().encode(JSON.stringify(data)).length>6000)return null;
 return data;
}
export function publicProfile(id,data){return{id,...data,sector:SECTORS[data.kind]?.label,profileUrl:'/perfil/?id='+encodeURIComponent(id)};}
