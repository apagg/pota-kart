// Shared park palette: validated browser preferences, controls and legend swatches.
// Geometry and GPS membership are independent of these display-only colors.
const parkColors=(()=>{
 const KEY='pota-map-colors-v1';
 const defaults={normal:'#3388ff',never:'#f97316',activated:'#ca8a04',inside:'#15803d',overlap:'#a855f7'};
 const selectedDefaults={normal:'#1d4ed8',never:'#c2410c',activated:'#a16207',inside:'#15803d',overlap:'#7e22ce'};
 const keys=Object.keys(defaults),valid=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
 let colors={...defaults},selected={};
 try{
  const saved=JSON.parse(localStorage.getItem(KEY)||'null');
  if(saved?.version===1)for(const key of keys)if(valid(saved.colors?.[key]))colors[key]=saved.colors[key].toLowerCase();
 }catch(e){}
 const darker=value=>'#'+value.slice(1).match(/../g).map(x=>Math.round(parseInt(x,16)*.75).toString(16).padStart(2,'0')).join('');
 function apply(){
  for(const key of keys){
   selected[key]=key==='inside'?colors[key]:colors[key]===defaults[key]?selectedDefaults[key]:darker(colors[key]);
   document.documentElement.style.setProperty('--park-'+key,colors[key]);
   document.documentElement.style.setProperty('--park-'+key+'-selected',selected[key]);
   const input=document.querySelector('[data-park-color="'+key+'"]');if(input)input.value=colors[key];
  }
  document.documentElement.style.setProperty('--park-normal-fill',colors.normal+'17');
  document.documentElement.style.setProperty('--park-inside-fill',colors.inside+'33');
  document.documentElement.style.setProperty('--park-overlap-fill',colors.overlap+'66');
 }
 function save(){
  const status=document.getElementById('colorSettingsStatus');
  try{localStorage.setItem(KEY,JSON.stringify({version:1,colors}));status.textContent='';}
  catch(e){status.textContent='Fargene brukes nå, men kunne ikke lagres i nettleseren.';}
 }
 function changed(){apply();save();document.dispatchEvent(new CustomEvent('pota:colors'));}
 function set(key,value){
  if(!keys.includes(key)||!valid(value))return false;
  colors[key]=value.toLowerCase();changed();return true;
 }
 function reset(){colors={...defaults};changed();}
 for(const input of document.querySelectorAll('[data-park-color]'))for(const event of ['input','change'])input.addEventListener(event,()=>set(input.dataset.parkColor,input.value));
 document.getElementById('resetParkColors').addEventListener('click',reset);
 apply();
 return {get:(key,isSelected=false)=>isSelected?selected[key]:colors[key],set,reset};
})();
