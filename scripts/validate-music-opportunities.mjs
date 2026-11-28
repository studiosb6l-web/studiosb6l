import {readFileSync} from 'node:fs';
export function validateFeed(feed, approvedSources, now=Date.now()){
 if(!feed||typeof feed.enabled!=='boolean'||!Array.isArray(feed.items)||feed.items.length>100)throw Error('Invalid feed');
 if(!feed.enabled&&feed.items.length)throw Error('Disabled feed must be empty');
 if(feed.enabled&&!feed.items.length)throw Error('Enabled feed must contain verified opportunities');
 const ids=new Set();
 const urls=new Set();
 for(const item of feed.items){
  if(!item||item.verified!==true||!['id','title','country','source','sourceUrl','expiresAt'].every(k=>typeof item[k]==='string'&&item[k].trim()))throw Error('Missing verification or provenance');
  const url=new URL(item.sourceUrl);
  if(url.protocol!=='https:'||url.username||url.password||!approvedSources.some(s=>s.name===item.source&&s.origin===url.origin&&s.authorized===true))throw Error('Source not approved');
  if(!(Date.parse(item.expiresAt)>now)||ids.has(item.id))throw Error('Expired or duplicate opportunity');
  url.hash='';
  if(urls.has(url.href))throw Error('Duplicate opportunity source URL');
  urls.add(url.href);
  ids.add(item.id);
 }
 return true;
}
if(process.argv[1]&&import.meta.url===new URL('file:'+process.argv[1]).href){
 validateFeed(JSON.parse(readFileSync('data/music-opportunities.json','utf8')),JSON.parse(readFileSync('data/music-opportunity-sources.json','utf8')));
}
