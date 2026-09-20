import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createStore } from '../server/store.js';
import { createApp } from '../server/app.js';
import { sendEnquiry } from '../server/email.js';

let mongo, repository, admin, config, app, delivered, failDelivery;
const makeBody = () => ({ requestId: randomUUID(), name: 'Test Visitor', email: 'visitor@example.com', service: 'Website', brief: 'I would like a website for my business.', website: '' });
const submit = body => request(app).post('/api/contact').set('Origin', 'http://localhost:5173').send(body);
before(async () => {
  mongo = await MongoMemoryServer.create({ binary: { downloadDir: 'work/mongodb-binaries' } });
  repository = createStore(mongo.getUri());
  admin = await mongoose.createConnection(mongo.getUri()).asPromise();
  config = { MONGODB_URI: mongo.getUri(), RESEND_API_KEY: 'test-only', EMAIL_FROM: 'Studio <studio@example.com>', CONTACT_TO: 'owner@example.com', RATE_LIMIT_SECRET: 'test-secret', ALLOWED_ORIGINS: 'http://localhost:5173' };
  app = createApp({ config, repository, deliver: async enquiry => { if (failDelivery) throw new Error('provider unavailable'); delivered.push(enquiry); return 'provider-test-id'; } });
});
beforeEach(async () => {
  delivered = []; failDelivery = false;
  await admin.db.collection('enquiries').deleteMany({});
  await admin.db.collection('contactlimits').deleteMany({});
});
after(async () => { await repository?.close(); await admin?.close(); await mongo?.stop(); });
test('persists enquiry, sends it once, and permits safe retries', async () => {
  const body = makeBody();
  assert.equal((await submit(body)).status, 200);
  assert.equal((await submit(body)).status, 200);
  assert.equal(delivered.length, 1);
  const saved = await repository.get(body.requestId);
  assert.equal(saved.status, 'sent'); assert.equal(saved.providerId, 'provider-test-id');
  assert.equal(saved.brief, body.brief);
});
test('invalid fields, header injection and unexpected recipients cannot send email', async () => {
  for (const change of [{email:'invalid'}, {name:'Injected\nBcc: person@example.com'}, {brief:'short'}, {to:'attacker@example.com'}, {service:'Unknown'}, {website:'spam.example'}]) {
    assert.equal((await submit({...makeBody(),...change})).status, 400);
  }
  assert.equal(delivered.length, 0);
});
test('blocks non-approved origins and malformed or oversized requests', async () => {
  assert.equal((await request(app).post('/api/contact').set('Origin','https://evil.example').send(makeBody())).status,403);
  assert.equal((await request(app).post('/api/contact').type('text').send('hello')).status,415);
  assert.equal((await request(app).post('/api/contact').type('json').send('{')).status,400);
  assert.equal((await submit({...makeBody(),brief:'x'.repeat(17000)})).status,413);
});
test('missing configuration reports unavailable instead of fake success', async () => {
  const response = await request(createApp({config:{ALLOWED_ORIGINS:'http://localhost:5173'}})).post('/api/contact').send(makeBody());
  assert.equal(response.status,503); assert.match(response.body.message,/temporarily unavailable/);
});
test('failed emails remain saved and a retry can deliver them', async () => {
  const body=makeBody(); failDelivery=true;
  assert.equal((await submit(body)).status,502);
  assert.equal((await repository.get(body.requestId)).status,'failed');
  failDelivery=false; assert.equal((await submit(body)).status,200);
  assert.equal((await repository.get(body.requestId)).status,'sent');
});
test('limits repeated submissions through MongoDB', async () => {
  for(let i=0;i<3;i++) assert.equal((await submit(makeBody())).status,200);
  assert.equal((await submit(makeBody())).status,429);
  assert.equal(delivered.length,3);
});
test('same request ID cannot be reused with changed data', async () => {
  const body=makeBody(); await submit(body);
  assert.equal((await submit({...body,brief:'A completely different project request.'})).status,409);
  assert.equal(delivered.length,1);
});
test('simultaneous submissions only claim one delivery', async () => {
  const body=makeBody(); const responses=await Promise.all([submit(body),submit(body)]);
  assert.ok(responses.some(r=>r.status===200));
  assert.ok(responses.every(r=>[200,409].includes(r.status)));
  assert.equal(delivered.length,1);
});
test('email transport uses fixed recipient, reply-to and idempotency key', async t => {
  let outgoing;
  t.mock.method(globalThis,'fetch',async (url, options)=>{outgoing={url, options,body:JSON.parse(options.body)};return {ok:true,json:async()=>({id:'accepted-id'})};});
  const body=makeBody();
  assert.equal(await sendEnquiry(body,config),'accepted-id');
  assert.deepEqual(outgoing.body.to,['owner@example.com']);
  assert.equal(outgoing.body.reply_to,body.email);
  assert.equal(outgoing.options.headers['Idempotency-Key'],`enquiry/${body.requestId}`);
  assert.equal(outgoing.url,'https://api.resend.com/emails');
});
