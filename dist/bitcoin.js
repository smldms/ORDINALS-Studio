/* Shared deterministic Bitcoin state resolver: used verbatim in exports. */
const GENESIS={height:0,hash:'000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',timestamp:1231006505,transaction_count:1,total_fee:0,average_fee:0,median_fee:0,average_fee_rate:0};
let currentBlock={...GENESIS};
function hash32(value){let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function blockSettings(state){state.bitcoin??={seed:true,rules:{}};return state.bitcoin}
function resolveText(text,block){const fields={height:block.height,hash:block.hash,date:block.timestamp==null?'N/A':new Date(block.timestamp*1000).toISOString().slice(0,10),time:block.timestamp==null?'N/A':new Date(block.timestamp*1000).toISOString().slice(11,19)+' UTC',transactions:block.transaction_count,total_fee:block.total_fee,average_fee:block.average_fee,median_fee:block.median_fee,fee_rate:block.average_fee_rate};return String(text).replace(/\{([a-z_]+)\}/g,(all,k)=>Object.hasOwn(fields,k)?String(fields[k]??'N/A'):all)}
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
function generate(){normalizeState();const base=s,oldPhase=phase;try{s=effectiveState(base,currentBlock);phase=0;return generateBase()}finally{s=base;phase=oldPhase}}
function validateBlock(data){if(!data||!Number.isSafeInteger(data.height)||data.height<0||!/^[0-9a-f]{64}$/.test(data.hash)||!Number.isFinite(data.timestamp)||data.timestamp<0||data.timestamp>8640000000000)throw Error('Réponse de bloc invalide');const result={height:data.height,hash:data.hash,timestamp:data.timestamp};for(const k of ['transaction_count','total_fee','average_fee','median_fee','average_fee_rate'])result[k]=typeof data[k]==='number'&&Number.isFinite(data[k])&&data[k]>=0?data[k]:null;return result}
async function recursiveJSON(base,path){const response=await fetch(base+path,{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Endpoint '+path+' : HTTP '+response.status);return response.json()}
async function readBlock(base,query){if(query!=='latest'&&(!Number.isSafeInteger(Number(query))||Number(query)<0))throw Error('Numéro de bloc invalide');const id=query==='latest'?await recursiveJSON(base,'/r/blockhash'):String(query);if(query==='latest'&&!/^[0-9a-f]{64}$/.test(id))throw Error('Hash de bloc invalide');const block=validateBlock(await recursiveJSON(base,'/r/blockinfo/'+id));if(query==='latest'?block.hash!==id:block.height!==Number(query))throw Error('Bloc reçu incohérent');return block}
function artworkSVG(){generate();const cols=drawingPalette();return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dims.join(' ')}" role="img" aria-label="Bitcoin generative artwork">${paths.map(p=>`<path d="${dOf(p.points)}" fill="none" stroke="${cols[p.layer]}" stroke-width="${p.weight??s.weight}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg>`}
