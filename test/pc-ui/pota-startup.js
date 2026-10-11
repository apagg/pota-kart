// Application startup and search wiring.
async function init(){st.textContent='Laster POTA-referanser for Norge og Sverige…';let x={shown:0,linked:0,unknown:[],unsupported:[],byCountry:{}};try{x=await loadPota()}catch(e){st.innerHTML='POTA-listen kunne ikke lastes: '+esc(e.message);return}
 await initializeGeometryAtlas();
 st.innerHTML='Kartet viser lagret geometri for valgt land. Parker uten verifisert geometri vises som punkt. Oversiktsgrenser er forenklet; zoom inn for detaljer.';
 document.getElementById('diag').innerHTML=`<b>Diagnostikk</b><br>${x.shown} POTA-referanser totalt · Norge: ${x.byCountry.NO||0} · Sverige: ${x.byCountry.SE||0}.<br><span class="small">Norsk støtte: verneområder, statlig sikrede og kartlagte friluftslivsområder i Naturbase, samt verifisert kulturminnegeometri fra Riksantikvaren. Kyststien Østfold er den eneste norske National Recreation Trail med verifisert geometri. Eksperimentelle WMS/WFS-Hvaler-lag er fjernet for stabilitet.</span>`;
}
function toggle(k){document.getElementById(k).addEventListener('change',e=>e.target.checked?layers[k].addTo(map):map.removeLayer(layers[k]));}
['np','nr','nvo','kr','hab','bird','pts'].forEach(toggle);
countryFilter.addEventListener('change',applyCountryFilter);
function search(){const q=norm(document.getElementById('q').value);if(!q)return;const c=countryFilter.value, pool=c==='ALL'?pota:pota.filter(x=>countryOf(x)===c);let t=pool.find(x=>norm(x.reference)===q)||pool.find(x=>norm(x.name).includes(q));if(t){showLink(t,true,true)}else st.innerHTML='Fant ikke «'+esc(document.getElementById('q').value)+'» i POTA-listen.'}
document.getElementById('search').onclick=search;document.getElementById('q').onkeydown=e=>{if(e.key==='Enter')search()};
init();

