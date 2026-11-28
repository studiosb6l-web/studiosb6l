import test from 'node:test';
import assert from 'node:assert/strict';
import {financeOwnerPanel} from './finance-owner-panel.mjs';
import {readVerifiedFinanceLedger,readFinanceHistory} from './finance-ledger-read.mjs';
test('missing financial sources remain unavailable',async()=>{
 assert.equal(await readVerifiedFinanceLedger(null,Date.now()),undefined);
 assert.deepEqual(await readFinanceHistory(null,Date.now()),[]);
 const response=financeOwnerPanel({});
 assert.equal(response.headers.get('Cache-Control'),'no-store');
 assert.match(await response.text(),/Indisponível/);
});
test('untrusted service labels are escaped',async()=>{
 const response=financeOwnerPanel({quotaWindows:[{service:'<script>alert(1)</script>',windowId:'test',status:'unavailable'}]});
 const html=await response.text();
 assert.ok(!html.includes('<script>'));
 assert.match(html,/&lt;script&gt;/);
});
test('database failure never produces verified zero balance',async()=>{
 const db={prepare(){throw new Error('unavailable')}};
 assert.equal(await readVerifiedFinanceLedger(db,Date.now()),undefined);
 assert.deepEqual(await readFinanceHistory(db,Date.now()),[]);
});
