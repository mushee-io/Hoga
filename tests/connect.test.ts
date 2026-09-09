import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {newApiKey,hashSecret,signature} from '../src/lib/connect';
import {verifyTelegramInitData} from '../src/lib/telegram';

test('API keys have identifiable prefixes and only a stable hash is stored',()=>{const key=newApiKey();assert.match(key.plain,/^hoga_live_[A-Za-z0-9_-]{20,}$/);assert.match(key.prefix,/^hoga_live_[A-Za-z0-9_-]{8}$/);assert.equal(key.hash,hashSecret(key.plain));assert.notEqual(key.hash,key.plain);});
test('webhook signatures are deterministic HMAC-SHA256',()=>{assert.equal(signature('secret','payload'),createHmac('sha256','secret').update('payload').digest('hex'));});
test('Telegram init data needs a valid current server-side HMAC',()=>{const token='telegram-test-token',params=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),query_id:'query',user:JSON.stringify({id:42,first_name:'Ada',username:'ada'})});const data=[...params.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('\n');const secret=createHmac('sha256','WebAppData').update(token).digest();params.set('hash',createHmac('sha256',secret).update(data).digest('hex'));assert.deepEqual(verifyTelegramInitData(params.toString(),token),{id:'42',username:'ada',name:'Ada'});params.set('hash','0'.repeat(64));assert.throws(()=>verifyTelegramInitData(params.toString(),token));});
