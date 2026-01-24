import express from 'express';
import aj from './src/config/arcjet.js';
import { slidingWindow } from '@arcjet/node';
import dotenv from 'dotenv';
dotenv.config();

async function runRepro() {
  const req = {
    method: 'GET',
    path: '/test',
    headers: {
      'host': 'localhost:3000',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    ip: '127.0.0.1',
  };

  console.log('Testing Arcjet protection with mock request...');

  try {
    const role = 'guest';
    const limit = 5;

    const client = aj.withRule(
      slidingWindow({
        mode: 'LIVE',
        interval: '1m',
        max: limit,
        name: `${role}-rate-limit`,
      })
    );

    const decision = await client.protect(req);
    console.log('Decision:', decision.conclusion);
    if (decision.isError()) {
      console.error('Decision error:', decision.reason.message);
    }
  } catch (e) {
    console.error('Caught error:', e);
  }
}

runRepro();
