import { NextRequest, NextResponse } from 'next/server';
import os from 'os';
import authenticate from '@/application/authentication';

export default authenticate(async function systemInfo(request: NextRequest) {
  if (request.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
      hostname: os.hostname(),
      nodeVersion: process.version,
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(systemInfo);
  } catch (error) {
    console.error('System info error:', error);
    return NextResponse.json({ error: 'Failed to get system info' }, { status: 500 });
  }
}, true /* isSuperuser */);
