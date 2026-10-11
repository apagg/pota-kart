// POTA Kart 0.9.0: serve POTA park lists from the repository cache.
// This avoids browser CORS differences when the app runs on GitHub Pages.
(()=>{
  const nativeFetch=window.fetch.bind(window);
  window.fetch=(input,init)=>{
    const url=typeof input==='string'?input:(input&&input.url)||'';
    const m=url.match(/^https:\/\/api\.pota\.app\/(?:program|location)\/parks\/(NO|SE)(?:[/?#]|$)/i);
    if(m){
      const cc=m[1].toUpperCase();
      return nativeFetch(`data/pota-${cc}.json`,Object.assign({},init,{cache:'no-store'}));
    }
    return nativeFetch(input,init);
  };
})();