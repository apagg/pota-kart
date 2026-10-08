// Shared text normalization, HTML escaping and JSON fetch helpers.
function norm(s){return (s||'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function getJSON(url){const r=await fetch(url);if(!r.ok)throw Error(r.status+' '+r.statusText);return r.json()}

