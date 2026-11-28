const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>Number.isSafeInteger(v)&&v>=0?new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR'}).format(v/100):'Indisponível';
export function financeOwnerPanel(snapshot={}){
 const f=snapshot.finance?.status==='verified'?snapshot.finance:{};
 const a=snapshot.admission?.status==='recorded'?snapshot.admission:{};
 const cards=[['Adesões brutas do mês',a.grossAdmissionCents],['Receita líquida',f.netRevenueCents],['Despesas',f.spentCents],['Compromissos',f.committedCents],['Limite disponível',f.availableCents]];
 const rows=(snapshot.services||[]).map(q=>{
 const valid=q.status==='verified'&&Number.isSafeInteger(q.used)&&Number.isSafeInteger(q.limit)&&q.limit>0;
 const pct=valid?Math.round(q.used/q.limit*100):null;
 return '<p>'+esc(q.service)+' — '+(valid?esc(pct)+'% · '+(pct>=70?'Limite atingido':pct>=60?'Alerta':'Normal'):'Indisponível')+'</p>'+(valid?'<meter min="0" max="100" low="60" high="70" optimum="0" value="'+Math.min(100,pct)+'"></meter>':'');
 }).join('');
 const windows=(snapshot.quotaWindows||[]).map(q=>'<p>'+esc(q.service)+' · '+esc(q.windowId)+' — '+(q.status==='verified'?esc(q.used)+' utilizados + '+esc(q.reserved)+' reservados / '+esc(q.ceiling)+' teto operacional'+(q.stopped?' · STOP':''):'Indisponível')+'</p>').join('');
 const history=(snapshot.history||[]).filter(r=>[r.period_start,r.net_revenue_cents,r.spent_cents].every(v=>Number.isSafeInteger(v)&&v>=0));
 const max=Math.max(1,...history.flatMap(r=>[r.net_revenue_cents,r.spent_cents]));
 const chart=history.map(r=>'<article><b>'+esc(new Date(r.period_start).toISOString().slice(0,7))+'</b><p>Receita líquida: '+esc(money(r.net_revenue_cents))+'</p><meter min="0" max="'+max+'" value="'+r.net_revenue_cents+'"></meter><p>Despesas: '+esc(money(r.spent_cents))+'</p><meter min="0" max="'+max+'" value="'+r.spent_cents+'"></meter></article>').join('');
 const html='<!doctype html><html lang="pt"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Finanças | STUDIOSB6L</title><style>body{background:#101827;color:#eee;font:16px system-ui;margin:24px}main{max-width:1000px;margin:auto}h1,h2,a{color:#e1bf78}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}article{border:1px solid #75623b;border-radius:12px;padding:18px}strong{display:block;font-size:1.4rem;margin-top:8px}meter{width:100%}</style><main><a href="/administracao/">Administração</a><h1>Controlo financeiro</h1><p>STOP: '+(snapshot.stopService===true?'Ativo':'Estado global não confirmado')+' · Execução de despesas não autorizada</p><div class="grid">'+cards.map(([k,v])=>'<article>'+esc(k)+'<strong>'+esc(money(v))+'</strong></article>').join('')+'</div><p>Adesões brutas não representam receita líquida nem saldo bancário.</p><h2>Consumos e quotas</h2><p>Alerta: 60% · Limite: 70% · Reserva: 30%</p>'+(rows||windows||'<p>Dados de consumo indisponíveis.</p>')+'<h2>Histórico mensal — últimos 12 meses registados</h2>'+(chart||'<p>Histórico indisponível.</p>')+'<p><a href="/administracao/financas/">Atualizar indicadores</a></p></main></html>';
 return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'"}});
}
