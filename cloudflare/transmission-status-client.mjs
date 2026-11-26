import {renderTransmissionStatus} from './transmission-status-view.mjs';
// Caller mounts this only in the authenticated account area.
export function mountTransmissionStatus(root,labels,{fetcher=globalThis.fetch,intervalMs=15000}={}){
 let stopped=false,busy=false,controller;
 const refresh=async()=>{
 if(stopped||busy||root.ownerDocument.visibilityState==='hidden')return;
 busy=true;controller=new AbortController();
 try{
 const response=await fetcher('/api/transmissions/status',{credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});
 if(response.status===401||response.status===403){stopped=true;clearInterval(timer);root.ownerDocument.removeEventListener('visibilitychange',refresh);root.replaceChildren();return;}
 if(!response.ok)throw new Error('Unavailable');
 const status=await response.json();
 if(!stopped)renderTransmissionStatus(root,status,labels);
 }catch{
 if(!stopped){root.replaceChildren();const p=root.ownerDocument.createElement('p');p.textContent=labels.unavailable;root.append(p);}
 }finally{busy=false;}
 };
 const timer=setInterval(refresh,Math.max(15000,intervalMs));
 root.ownerDocument.addEventListener('visibilitychange',refresh);
 void refresh();
 return ()=>{stopped=true;clearInterval(timer);root.ownerDocument.removeEventListener('visibilitychange',refresh);controller?.abort();};
}
