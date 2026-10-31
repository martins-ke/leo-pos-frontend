import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAiAssistantRequest,
  getVoiceFeatureFlag,
  setVoiceFeatureFlag,
} from './voiceFeature.js';
import { parseVoiceIntent } from './voiceGrammar.js';
import { buildAiQueryPlan } from './aiQueryRouter.js';

test('voice settings persist as a boolean flag', () => {
  setVoiceFeatureFlag(true);
  assert.equal(getVoiceFeatureFlag(), true);

  setVoiceFeatureFlag(false);
  assert.equal(getVoiceFeatureFlag(), false);
});

test('ai payload rejects blank input and sanitizes unsafe SQL-like content', () => {
  assert.throws(() => buildAiAssistantRequest('   '), /valid user question/i);

  const payload = buildAiAssistantRequest('What are today\'s sales? DROP TABLE users; -- x', {
    activeShopId: 'shop-1',
    userRole: 'OWNER',
  });

  assert.equal(payload.allowSql, false);
  assert.ok(payload.question.includes('What are today'));
  assert.ok(!payload.question.includes('DROP TABLE'));
  assert.ok(payload.allowedResources.includes('sales'));
});

test('common sales mishears resolve to the same sales intent', () => {
  const salesToday = parseVoiceIntent('sales today');
  const cellsToday = parseVoiceIntent('cells today');
  const sellsToday = parseVoiceIntent('sells today');

  assert.equal(salesToday.type, 'QUERY_ANALYTICS');
  assert.equal(cellsToday.type, 'QUERY_ANALYTICS');
  assert.equal(sellsToday.type, 'QUERY_ANALYTICS');
  assert.equal(salesToday.subType, 'TODAY_SALES');
  assert.equal(cellsToday.subType, 'TODAY_SALES');
  assert.equal(sellsToday.subType, 'TODAY_SALES');
});

test('ai business query planner routes natural questions to real backend actions', () => {
  const salesPlan = buildAiQueryPlan('What are our sales today?', { activeShopId: 'shop-1' });
  const stockPlan = buildAiQueryPlan('How much stock do we have left?', { activeShopId: 'shop-1' });
  const topPlan = buildAiQueryPlan('Which products sold the most?', { activeShopId: 'shop-1' });

  assert.equal(salesPlan.type, 'dashboard-summary');
  assert.equal(stockPlan.type, 'inventory-stock');
  assert.equal(topPlan.type, 'top-products');
  assert.equal(salesPlan.params.shopId, 'shop-1');
  assert.ok(stockPlan.endpoint.includes('/products'));
  assert.ok(topPlan.endpoint.includes('/sales'));
});
