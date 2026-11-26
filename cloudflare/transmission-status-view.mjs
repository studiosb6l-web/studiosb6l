// Render only the sanitized public status; never pass administrative data.
export function renderTransmissionStatus(root,status,labels){
 const doc=root.ownerDocument;
 root.replaceChildren();
 const add=(tag,value)=>{const el=doc.createElement(tag);el.textContent=String(value);root.append(el);return el;};
 add('h2',labels.title);
 if(!status?.canAttend){add('p',labels.noAccess);return;}
 add('p',status.canHost?labels.hostBenefits:labels.attendBenefits);
 add('p',labels.used+': '+status.usedMinutes+' min');
 add('p',labels.remaining+': '+status.remainingMinutes+' min');
 const total=status.usedMinutes+status.remainingMinutes;
 if(total>0){const bar=add('progress','');bar.max=total;bar.value=status.usedMinutes;bar.setAttribute('aria-label',labels.used);}
 add('p',labels.renews+': '+new Date(status.renewsAt).toLocaleDateString(labels.locale));
 if(!status.available)add('p',labels.unavailable);
 if(status.session){
 const seconds=status.session.remainingSeconds;
 const timer=add('p',labels.sessionRemaining+': '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'));
 timer.setAttribute('role','timer');
 if(status.session.warning){const warning=add('p',labels.warning);warning.setAttribute('role','status');}
 }
}
