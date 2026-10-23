/* Shared deterministic Bitcoin state resolver: used verbatim in exports. */
const GENESIS={height:0,hash:'000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',timestamp:1231006505,transaction_count:1,total_fee:0,average_fee:0,median_fee:0,average_fee_rate:0};
let currentBlock={...GENESIS};
function hash32(value){let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function blockSettings(state){state.bitcoin??={};state.bitcoin.seed??=true;state.bitcoin.phase??=true;state.bitcoin.rules??={};return state.bitcoin}
function blockPhase(state,block){return blockSettings(state).phase?((block.height*.618033988749895+hash32(block.hash||'simulation')/4294967296)%1)*Math.PI*2:0}
function hasBlockEvolution(state){const b=blockSettings(state);return (b.seed&&['flow','cell','type','iso'].includes(state.engine))||(b.phase&&['flow','type','op','super'].includes(state.engine))||Object.values(b.rules[state.engine]||{}).some(r=>r.enabled&&Number(r.max)>Number(r.min))}
// Only immutable block properties: confirmations/next_block would break replay determinism.
const BLOCK_NUMERIC_FIELDS=['transaction_count','total_fee','average_fee','median_fee','average_fee_rate','min_fee','max_fee','min_fee_rate','max_fee_rate','subsidy','difficulty','nonce','total_size','total_weight','max_tx_size','version','bits','median_time'];
const BITCOIN_TEXT_FIELDS=[
 ['height','Bloc'],['date','Date UTC'],['time','Heure UTC'],['fees','Frais totaux · sat'],['fees_btc','Frais totaux · BTC'],
 ['average_fee','Frais moyens · sat'],['median_fee','Frais médians · sat'],['min_fee','Frais minimum · sat'],['max_fee','Frais maximum · sat'],
 ['fee_rate','Taux moyen · sat/vB'],['min_fee_rate','Taux minimum · sat/vB'],['max_fee_rate','Taux maximum · sat/vB'],
 ['transactions','Transactions'],['size','Taille · octets'],['weight','Poids · WU'],['max_tx_size','Plus grande transaction · octets'],
 ['subsidy','Subvention · sat'],['subsidy_btc','Subvention · BTC'],['difficulty','Difficulté'],['nonce','Nonce'],['version','Version'],['bits','Bits'],
 ['timestamp','Timestamp Unix'],['median_time','Temps médian Unix'],['hash','Hash complet'],['hash_short','Hash court · 12 derniers caractères'],
 ['previous_block','Hash précédent'],['merkle_root','Racine de Merkle']
];
function resolveText(text,block){
 const fields=Object.fromEntries(BLOCK_NUMERIC_FIELDS.map(key=>[key,block[key]]));
 const btc=value=>value==null?null:(value/100000000).toFixed(8);
 Object.assign(fields,{height:block.height,hash:block.hash,hash_short:block.hash?.slice(-12),previous_block:block.previous_block,merkle_root:block.merkle_root,timestamp:block.timestamp,
 date:block.timestamp==null?'N/A':new Date(block.timestamp*1000).toISOString().slice(0,10),time:block.timestamp==null?'N/A':new Date(block.timestamp*1000).toISOString().slice(11,19)+' UTC',
 transactions:block.transaction_count,fees:block.total_fee,fees_btc:btc(block.total_fee),subsidy_btc:btc(block.subsidy),fee_rate:block.average_fee_rate,size:block.total_size,weight:block.total_weight});
 return String(text).replace(/\{([a-z_]+)\}/g,(all,k)=>Object.hasOwn(fields,k)?String(fields[k]??'N/A'):all);
}
function ruleSpecs(state){return [...specs[state.engine],...(state.engine==='type'?[['density','Nombre de lignes',1,120,1],['repeatSize','Corps répété',1,80,.25],['size','Corps composé',1,80,.25],['tracking','Approche',0,10,.1],['leading','Interlignage',.6,3,.05],['width','Largeur des lettres',35,160,1],['y','Position Y',0,90,1],['slant','Inclinaison',-30,30,1]]:[])]}
function effectiveState(base,block){const state=structuredClone(base),settings=blockSettings(state),identity=block.hash||'simulation:'+block.height;
 if(settings.seed)state.seed=hash32(base.seed+'|'+identity);
 const available=new Map(ruleSpecs(state).map(row=>[row[0],row]));
 for(const [key,rule]of Object.entries(settings.rules[state.engine]||{})){if(!rule.enabled||!available.has(key))continue;const [, ,lo,hi,step]=available.get(key);let min=Number(rule.min),max=Number(rule.max);if(!Number.isFinite(min)||!Number.isFinite(max)||min>max||min<lo||max>hi)throw Error('Limites invalides : '+key);
 const first=Math.ceil((min-lo)/step-1e-8),last=Math.floor((max-lo)/step+1e-8);if(first>last)throw Error('Aucune valeur possible : '+key);
 const unit=hash32(base.seed+'|'+identity+'|'+state.engine+'|'+key)/4294967296;
 state.params[key]=+(lo+(first+Math.floor(unit*(last-first+1)))*step).toFixed(6);
 }
 if(state.params.text!==undefined)state.params.text=resolveText(state.params.text,block);
 for(const b of state.poster?.blocks||[])b.text=resolveText(b.text,block);
 return state;
}
function generate(){normalizeState();const base=s,oldPhase=phase;try{s=effectiveState(base,currentBlock);phase=blockPhase(base,currentBlock);return generateBase()}finally{s=base;phase=oldPhase}}
function validateBlock(data){if(!data||!Number.isSafeInteger(data.height)||data.height<0||!/^[0-9a-f]{64}$/.test(data.hash)||!Number.isFinite(data.timestamp)||data.timestamp<0||data.timestamp>8640000000000)throw Error('Réponse de bloc invalide');const result={height:data.height,hash:data.hash,timestamp:data.timestamp};for(const k of BLOCK_NUMERIC_FIELDS)result[k]=typeof data[k]==='number'&&Number.isFinite(data[k])&&data[k]>=0?data[k]:null;for(const k of ['previous_block','merkle_root'])result[k]=typeof data[k]==='string'&&/^[0-9a-f]{64}$/.test(data[k])?data[k]:null;return result}
// Aura uses same-origin on Ordinals and an explicit Ordinals origin elsewhere.
function getOrdinalsOrigin(loc=globalThis.location){
 const isHTTP=loc&&['http:','https:'].includes(loc.protocol);
 const isOrd=loc&&(loc.hostname==='ordinals.com'||loc.hostname.endsWith('.ordinals.com'));
 const isContent=loc&&/^\/content\/[0-9a-f]{64}i[0-9]+(?:\/|$)/.test(loc.pathname);
 return isHTTP&&(isOrd||isContent)?'':'https://ordinals.com';
}
async function recursiveJSON(base,path){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{const response=await fetch(base+path,{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('Endpoint '+path+' : HTTP '+response.status);return await response.json()}finally{clearTimeout(timer)}
}
async function readBlock(base,query){
 if(query!=='latest'&&(!Number.isSafeInteger(Number(query))||Number(query)<0))throw Error('Numéro de bloc invalide');
 const height=query==='latest'?await recursiveJSON(base,'/r/blockheight'):Number(query);
 if(!Number.isSafeInteger(height)||height<0)throw Error('Hauteur de bloc invalide');
 const block=validateBlock(await recursiveJSON(base,'/r/blockinfo/'+height));
 if(block.height!==height)throw Error('Bloc reçu incohérent');return block;
}
async function readLiveBlock(){
 const base=getOrdinalsOrigin();
 try{return await readBlock(base,'latest')}catch(error){if(base==='')return readBlock('https://ordinals.com','latest');throw error}
}
function artworkSVG(){generate();const cols=drawingPalette();return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dims.join(' ')}" role="img" aria-label="Bitcoin generative artwork">${paths.map(p=>`<path d="${dOf(p.points)}" fill="none" stroke="${cols[p.layer]}" stroke-width="${p.weight??s.weight}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg>`}
