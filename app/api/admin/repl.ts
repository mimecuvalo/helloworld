import { NextRequest, NextResponse } from 'next/server';
import authenticate from '@/application/authentication';

export default authenticate(async (request: NextRequest) => {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Also, this is disabled by default because it's so powerful (a powerful footgun, that is).
    // Enabling this means you need to make damn sure the API you're calling is internally accessible only.
    return NextResponse.json({
      result: 'DISABLED_FOR_SECURITY_DONT_ENABLE_UNLESS_YOU_KNOW_WHAT_YOURE_DOING',
      success: false,
    });

    // const body = await request.json();
    // const source = body.source || body.code;
    // let success = true;
    // let result = null;
    // try {
    //   result = eval(source);
    // } catch (ex) {
    //   success = false;
    //   console.log(ex);
    // }
    // return NextResponse.json({ result, success });
  } catch (error) {
    console.error('REPL error:', error);
    return NextResponse.json({ error: 'Failed to execute REPL' }, { status: 500 });
  }
}, true /* isSuperuser */);
