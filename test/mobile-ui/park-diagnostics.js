// Park statistics diagnostic markup.
function diagnosticHtml(stats){
 const unknown=stats.unknown||[], unsupported=stats.unsupported||[];
 const groupUnknown=a=>{const m={};for(const x of a){const tail=(x.name||'').split(/\s+/).slice(-2).join(' ')||'(uten navn)';m[tail]=(m[tail]||0)+1}return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,12)};
 const byType={};
 for(const x of unsupported){const k=x.type||'Ukjent kjent type';(byType[k]||(byType[k]=[])).push(x)}
 const typeGroups=Object.entries(byType).sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0],'sv'));
 let h=`<b>Diagnostikk</b><br>${stats.shown} POTA-referanser totalt.<br>${stats.linked} kan slås opp direkte eller automatisk hos Naturvårdsverket.`;
 if(unsupported.length){
   h+=`<br>${unsupported.length} har en kjent POTA-type, men trenger en annen offisiell datakilde for geometri.`;
   h+=`<br><br><b>Fordeling av disse ${unsupported.length}:</b><br>`+typeGroups.map(([k,a])=>`${esc(k)} (${a.length})`).join(', ');
   h+=`<div style="margin-top:8px">`+typeGroups.map(([k,a])=>`<details style="margin:4px 0"><summary><b>${esc(k)}</b> (${a.length})</summary><div style="padding:5px 0 4px 12px">${a.slice().sort((x,y)=>(x.reference||'').localeCompare(y.reference||'')).map(x=>`${esc(x.reference)} – ${esc(x.name)}`).join('<br>')}</div></details>`).join('')+`</div>`;
 }
 h+=`<br>${unknown.length} har fortsatt ukjent type.`;
 if(unknown.length){h+=`<br><br><b>Vanlige mønstre blant ukjente:</b><br>`+groupUnknown(unknown).map(([k,v])=>`${esc(k)} (${v})`).join(', ');h+=`<br><br><b>Ukjente referanser:</b><br>`+unknown.slice(0,80).map(x=>`${esc(x.reference)} – ${esc(x.name)}`).join('<br>');if(unknown.length>80)h+=`<br>… og ${unknown.length-80} til.`}
 return h;
}
