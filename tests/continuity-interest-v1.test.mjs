import test from 'node:test';
import assert from 'node:assert/strict';
import {continuityInterestRoutes} from '../continuity-interest-v1.js';

function DB(){const state={rows:new Map(),attempts:0};return{state,prepare(sql){let args=[];return{bind(...x){args=x;return this},async first(){return{count:state.attempts}},async run(){if(sql.includes('INSERT INTO continuity_interest_attempts'))state.attempts++;if(sql.includes('INSERT INTO continuity_interest('))state.rows.set(args[0],{email:args[0],intent:args[2],source:args[3]});return{success:true}}}},async batch(statements){return statements.map(()=>({success:true}))}}}
const request=body=>new Request('https://api.shiftsometimber.co.uk/v1/continuity-interest',{method:'POST',headers:{'content-type':'application/json','CF-Connecting-IP':'192.0.2.5'},body:JSON.stringify(body)});

test('captures an explicitly consented OOS continuity interest without promising treatment',async()=>{const db=DB(),response=await continuityInterestRoutes(request({email:'MATT@example.com',first_name:'Matt',intent:'disrupted',source:'start-here',consent:true}),{DB:db});assert.equal(response.status,201);const body=await response.json();assert.equal(body.status,'registered');assert.match(body.message,/No purchase, stock or treatment eligibility is promised/);assert.equal(db.state.rows.get('matt@example.com').intent,'disrupted')});
test('rejects absent consent and malformed email',async()=>{const db=DB();assert.equal((await continuityInterestRoutes(request({email:'bad',consent:true}),{DB:db})).status,400);assert.equal((await continuityInterestRoutes(request({email:'matt@example.com',consent:false}),{DB:db})).status,400)});
test('rate limits public capture',async()=>{const db=DB();db.state.attempts=8;assert.equal((await continuityInterestRoutes(request({email:'matt@example.com',consent:true}),{DB:db})).status,429)});
test('hands preflight back to the Worker CORS boundary',async()=>{const result=await continuityInterestRoutes(new Request('https://api.shiftsometimber.co.uk/v1/continuity-interest',{method:'OPTIONS'}),{DB:DB()});assert.equal(result,null)});
