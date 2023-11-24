#! /usr/bin/env node
import 'dotenv/config';
import path from 'node:path';
import axios from 'axios';

async function report(status, data) {
  console.log('urtax: Report', status, data);
  await axios.put(process.env.UC_ENDPOINT, {
    status,
    ...data,
  });
}

async function reportStarted() {
  await report('STARTED');
}

async function reportCompleted(data) {
  await report('COMPLETED', { data });
}

async function reportFailed(err) {
  await report('FAILED', {
    error: {
      message: err.message,
    },
  });
}

async function run() {
  const params = {};
  for (let key in process.env) {
    if (key.startsWith('UC_PARAM_')) {
      params[key.replace('UC_PARAM_', '')] = process.env[key];
    }
  }
  console.log('urtax: LAUNCH', params);
  try {
    reportStarted();
    const modulePath = path.resolve(`index.js?r=${Date.now()}`)
    const mod = await import(modulePath);
    const output = await mod.default(params);
    await reportCompleted(output);
  } catch (err) {
    console.log('urtax - Something went wrong!');
    console.log(err);
    try {
      await reportFailed(err);
    } catch (err) {
      console.log('urtax: Attempt to report failure failed', err);
      throw err;
    }
  }
}
run();
