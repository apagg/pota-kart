// Shared park palette: validated browser preferences, controls and legend swatches.
// Geometry and GPS membership are independent of these display-only colors.
const parkColors=(()=>{
 const KEY='pota-map-colors-v1';
 const defaults={normal:'#3388ff',never:'#f97316',activated:'#ca8a04',inside:'#15803d',overlap:'#a855f7'};
 const selectedDefaults={normal:'#1d4ed8',never:'#c2410c',activated:'#a16207',inside:'#15803d',overlap:'#7e22ce'};
 const keys=Object.keys(defaults),valid=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
 const fillDefaults={normal:25,selected:40,overlap:50};
 let fills={...fillDefaults},colors={...defaults},selected={},overlapMode='blend';
 try{
  const saved=JSON.parse(localStorage.getItem(KEY)||'null');
  if(saved?.version===1){
   for(const key of keys)if(valid(saved.colors?.[key]))colors[key]=saved.colors[key].toLowerCase();
   if(saved.overlapMode==='fixed')overlapMode='fixed';
   for(const key of Object.keys(fillDefaults))if(Number.isFinite(saved.fills?.[key])&&saved.fills[key]>=0&&saved.fills[key]<=100)fills[key]=saved.fills[key];
  }
 }catch(e){}
 const darker=value=>'#'+value.slice(1).match(/../g).map(x=>Math.round(parseInt(x,16)*.75).toString(16).padStart(2,'0')).join('');
 function mixOverlap(values){
  const rgb=values.filter(valid).map(value=>value.slice(1).match(/../g).map(x=>parseInt(x,16)));
  if(!rgb.length)rgb.push([51,136,255]);
  const fillColor='#'+[0,1,2].map(i=>Math.round(rgb.reduce((n,c)=>n+c[i],0)/rgb.length*.6).toString(16).padStart(2,'0')).join('');
  return {fillColor,color:darker(fillColor)};
 }
 function apply(){
  for(const key of Object.keys(fills)){const input=document.querySelector('[data-park-fill="'+key+'"]');input.value=fills[key];document.getElementById(input.id+'Value').textContent=fills[key]+' %';input.setAttribute('aria-valuetext',fills[key]+' prosent');}
  for(const key of keys){
   selected[key]=key==='inside'?colors[key]:colors[key]===defaults[key]?selectedDefaults[key]:darker(colors[key]);
   document.documentElement.style.setProperty('--park-'+key,colors[key]);
   document.documentElement.style.setProperty('--park-'+key+'-selected',selected[key]);
   const input=document.querySelector('[data-park-color="'+key+'"]');if(input)input.value=colors[key];
  }
  document.documentElement.style.setProperty('--park-normal-fill',colors.normal+'17');
  document.documentElement.style.setProperty('--park-inside-fill',colors.inside+'33');
  document.documentElement.style.setProperty('--park-overlap-fill',colors.overlap+'66');
  const mixed=overlapMode==='blend';
  document.getElementById('parkOverlapMode').value=overlapMode;
  document.getElementById('parkColorOverlap').disabled=mixed;
  document.getElementById('parkColorOverlap').parentElement.classList.toggle('color-disabled',mixed);
  document.documentElement.style.setProperty('--park-overlap-border',mixed?mixOverlap([colors.normal,colors.never,colors.activated]).color:selected.overlap);
  document.documentElement.style.setProperty('--park-overlap-swatch',mixed?`linear-gradient(135deg, ${colors.normal}, ${colors.never}, ${colors.activated})`:colors.overlap+'66');
  document.getElementById('overlapLegendLabel').textContent=mixed?'Overlapp – blandede parkfarger':'Overlapp mellom parker / 61 m stikorridor';
 }
 function save(){
  const status=document.getElementById('colorSettingsStatus');
  try{localStorage.setItem(KEY,JSON.stringify({version:1,colors,overlapMode,fills}));status.textContent='';}
  catch(e){status.textContent='Fargene brukes nå, men kunne ikke lagres i nettleseren.';}
 }
 function changed(){apply();save();document.dispatchEvent(new CustomEvent('pota:colors'));}
 function set(key,value){
  if(!keys.includes(key)||!valid(value))return false;
  colors[key]=value.toLowerCase();changed();return true;
 }
 function setOverlapMode(value){if(!['blend','fixed'].includes(value))return false;overlapMode=value;changed();return true;}
 function setFill(key,value){if(!Object.hasOwn(fillDefaults,key)||typeof value!=='number'||!Number.isFinite(value)||value<0||value>100)return false;fills[key]=value;changed();return true;}
 function reset(){colors={...defaults};fills={...fillDefaults};overlapMode='blend';changed();}
 for(const input of document.querySelectorAll('[data-park-fill]'))input.addEventListener('input',()=>setFill(input.dataset.parkFill,Number(input.value)));
 for(const input of document.querySelectorAll('[data-park-color]'))for(const event of ['input','change'])input.addEventListener(event,()=>set(input.dataset.parkColor,input.value));
 document.getElementById('resetParkColors').addEventListener('click',reset);
 document.getElementById('parkOverlapMode').addEventListener('change',e=>setOverlapMode(e.target.value));
 apply();
 return {get:(key,isSelected=false)=>isSelected?selected[key]:colors[key],set,setFill,opacity:key=>fills[key]/100,reset,mixOverlap,setOverlapMode,overlapMode:()=>overlapMode};
})();
