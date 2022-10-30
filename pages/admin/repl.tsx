import { useRef, useState } from 'react';

import { Button } from 'components';
import authServerSideProps from 'app/authServerSideProps';

// TODO(mime): This has a lot of work left to do.
// In particular, need to be able to unbundle server side code so we properly require local code()
//
// Also, this is disabled by default because it's so powerful (a powerful footgun, that is).
// Enabling this means you need to make damn sure the API you're calling is internally accessible only.
// See, DISABLED_FOR_SECURITY_DONT_ENABLE_UNLESS_YOU_KNOW_WHAT_YOURE_DOING
export default function REPL() {
  const [disabled, setDisabled] = useState(false);
  const [result, setResult] = useState('');
  const source = useRef<HTMLTextAreaElement | null>(null);

  async function handleClick() {
    setDisabled(true);
    const response = await fetch('DISABLED_FOR_SECURITY_DONT_ENABLE_UNLESS_YOU_KNOW_WHAT_YOURE_DOING', {
      method: 'POST',
      body: JSON.stringify({
        source: source.current?.value,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const json = await response.json();
    setResult(json);
    setDisabled(false);
  }

  return (
    <>
      <textarea
        ref={source}
        style={{ fontFamily: 'monospace', width: '100%', height: '50vh' }}
        placeholder="type code here..."
      ></textarea>
      <br />
      <Button disabled={disabled} variant="contained" color="primary" onClick={handleClick}>
        Run
      </Button>
      <pre>{JSON.stringify(result, undefined, 2)}</pre>
    </>
  );
}

export const getServerSideProps = authServerSideProps();
