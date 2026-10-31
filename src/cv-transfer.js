const prefix='athar-cv-transfer-';
export function clearTransfers(storage){
  for(let i=storage.length-1;i>=0;i--){const key=storage.key(i);if(key?.startsWith(prefix)||key==='athar-cv-export-v1')storage.removeItem(key)}
}
export function prepareTransfer(storage,draft,id,now=Date.now()){
  clearTransfers(storage);
  storage.setItem(prefix+id,JSON.stringify({draft,createdAt:now}));
  return '/cv#'+id;
}
export function consumeTransfer(storage,id,now=Date.now()){
  if(!/^[a-f0-9-]{36}$/.test(id))throw Error('Invalid export');
  const raw=storage.getItem(prefix+id);storage.removeItem(prefix+id);
  const entry=JSON.parse(raw||'null');
  if(!entry?.draft||!Number.isFinite(entry.createdAt)||now-entry.createdAt>300000||now<entry.createdAt)throw Error('Expired export');
  return entry.draft;
}
