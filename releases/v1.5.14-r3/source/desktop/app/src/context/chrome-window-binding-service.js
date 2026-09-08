const { boundsSimilarity } = require('./window-resolver');
const { normalizeChromeBounds } = require('./display-coordinate-normalizer');

function clone(v){return v?JSON.parse(JSON.stringify(v)):v;}
function isChrome(target={}){return /google chrome|chromium/i.test(`${target.appName||''} ${target.bundleId||''}`);}
function exactBoundsMatch(a={},b={},tolerance=1){
  const t=Math.max(0,Number(tolerance)||0);
  return ['x','y','width','height'].every((k)=>Math.abs(Number(a?.[k]||0)-Number(b?.[k]||0))<=t);
}

class ChromeWindowBindingService {
  constructor({registry=null,maxAgeMs=1500,minIou=0.90,minGap=0.10,displayProvider=null}={}){
    this.registry=registry; this.maxAgeMs=Math.max(500,Number(maxAgeMs)||1500); this.minIou=Math.max(0.5,Math.min(1,Number(minIou)||0.90)); this.minGap=Math.max(0.01,Math.min(0.5,Number(minGap)||0.10)); this.displayProvider=displayProvider; this.last=null;
  }
  displays(){try{return typeof this.displayProvider==='function'?(this.displayProvider()||[]):[];}catch{return[];}}
  resolve(target={}, {now=Date.now()}={}){
    if(!isChrome(target)) return this.record({state:'NOT_CHROME',candidateCount:0,selected:null});
    const targetBounds=target.bounds||target.windowBounds||null;
    if(!targetBounds) return this.record({state:'NO_BOUNDS_MATCH',candidateCount:0,selected:null,reason:'TARGET_BOUNDS_MISSING'});
    const diagnostics=this.registry?.diagnostics?.()||{};
    const all=Array.isArray(diagnostics.knownWindows)?diagnostics.knownWindows:[];
    if(!all.length) return this.record({state:diagnostics.extensionConnected?'NO_FRESH_HEARTBEAT':'EXTENSION_NOT_CONNECTED',candidateCount:0,selected:null,reason:diagnostics.extensionConnected?'EXTENSION_CONNECTED_NO_WINDOW_HEARTBEAT':'NO_BROWSER_TARGET_METADATA',extensionVersion:String(diagnostics.extensionVersion||''),lastHeartbeatAgeMs:diagnostics.heartbeatAgeMs});
    const fresh=all.filter(item=>Math.max(0,now-Number(item.updatedAt||item.observedAt||0))<=this.maxAgeMs);
    if(!fresh.length) return this.record({state:'NO_FRESH_HEARTBEAT',candidateCount:0,selected:null,reason:'BROWSER_TARGET_METADATA_STALE',extensionVersion:String(diagnostics.extensionVersion||''),lastHeartbeatAgeMs:diagnostics.heartbeatAgeMs});

    const requestedBrowserWindowId=Number(target?.browser?.windowId||target?.browserWindowId||0);
    const rows=fresh.map(item=>{
      const age=Math.max(0,now-Number(item.updatedAt||item.observedAt||0));
      const normalized=normalizeChromeBounds(item.windowBounds||null,this.displays());
      const iou=normalized.normalized?boundsSimilarity(targetBounds,normalized.normalized):0;
      const focused=item.focused===true;
      const requestedMatch=Boolean(requestedBrowserWindowId && Number(item.windowId||0)===requestedBrowserWindowId);
      const score=iou+(focused?0.03:0)+(requestedMatch?0.08:0)-Math.min(0.02,age/100000);
      const geometryExact=Boolean(normalized.normalized&&exactBoundsMatch(targetBounds,normalized.normalized,1));
      return {item,age,iou,score,focused,requestedMatch,geometryExact,rawBounds:clone(normalized.raw),normalizedBounds:clone(normalized.normalized),transform:normalized.transform,displayId:normalized.displayId};
    }).filter(x=>x.iou>=this.minIou).sort((a,b)=>b.score-a.score);
    if(!rows.length) return this.record({state:'NO_BOUNDS_MATCH',candidateCount:0,selected:null,reason:'NO_FRESH_BOUNDS_MATCH',extensionVersion:String(diagnostics.extensionVersion||''),lastHeartbeatAgeMs:diagnostics.heartbeatAgeMs,targetBounds:clone(targetBounds),freshCandidateCount:fresh.length});
    const first=rows[0],second=rows[1];
    const gap=second?first.iou-second.iou:1;
    const uniqueExactGeometry=Boolean(first.geometryExact && !second?.geometryExact);
    if(second&&gap<this.minGap&&!first.requestedMatch&&!uniqueExactGeometry) return this.record({state:'AMBIGUOUS',candidateCount:rows.length,selected:null,boundsIou:first.iou,runnerUpIou:second.iou,ambiguityGap:gap,extensionVersion:String(diagnostics.extensionVersion||first.item.extensionVersion||''),lastHeartbeatAgeMs:diagnostics.heartbeatAgeMs,candidates:rows.slice(0,4).map(x=>({browserWindowId:Number(x.item.windowId||0),tabId:Number(x.item.tabId||0),boundsIou:x.iou,ageMs:x.age,focused:x.focused,rawBounds:x.rawBounds,normalizedBounds:x.normalizedBounds}))});
    return this.record({state:'EXACT',candidateCount:rows.length,selected:clone(first.item),browserWindowId:Number(first.item.windowId||0),tabId:Number(first.item.tabId||0),matchedCgWindowId:Number(target.cgWindowId||0),boundsIou:first.iou,runnerUpIou:second?.iou||0,ambiguityGap:gap,timeDeltaMs:first.age,confidence:Math.min(1,0.8+first.iou*0.2),exactGeometryMatch:Boolean(first.geometryExact),extensionVersion:String(first.item.extensionVersion||diagnostics.extensionVersion||''),lastHeartbeatAgeMs:diagnostics.heartbeatAgeMs,rawBounds:first.rawBounds,normalizedBounds:first.normalizedBounds,coordinateTransform:first.transform,candidates:rows.slice(0,4).map(x=>({browserWindowId:Number(x.item.windowId||0),tabId:Number(x.item.tabId||0),boundsIou:x.iou,ageMs:x.age,focused:x.focused,rawBounds:x.rawBounds,normalizedBounds:x.normalizedBounds}))});
  }
  record(result){this.last={...result,checkedAt:Date.now()};return clone(this.last);}
  diagnostics(){return clone(this.last);}
}
module.exports={ChromeWindowBindingService,isChrome,exactBoundsMatch};
