const ID=/^[A-Za-z0-9_-]{11}$/;
export function youtubeId(value){
 if(typeof value!=='string'||value.length>2048)return null;
 if(ID.test(value))return value;
 let u;try{u=new URL(value)}catch{return null}
 if(u.protocol!=='https:'||u.username||u.password||u.port)return null;
 const host=u.hostname;
 let id=null;
 if(host==='youtu.be')id=/^\/([^/]+)\/?$/.exec(u.pathname)?.[1];
 else if(['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(host)){
 if(u.pathname==='/watch'&&host!=='www.youtube-nocookie.com')id=u.searchParams.get('v');
 else id=/^\/(?:embed|shorts|live)\/([^/]+)\/?$/.exec(u.pathname)?.[1];
 }
 return ID.test(id??'')?id:null;
}
export function validateProfileVideos(values){
 if(!Array.isArray(values)||values.length>3)throw new TypeError('Maximum three videos');
 const ids=values.map(youtubeId);
 if(ids.some(id=>!id)||new Set(ids).size!==ids.length)throw new TypeError('Invalid or duplicate video');
 return ids;
}
export function embedUrl(id){
 if(typeof id!=='string'||!ID.test(id))throw new TypeError('Invalid video ID');
 return 'https://www.youtube-nocookie.com/embed/'+id;
}
