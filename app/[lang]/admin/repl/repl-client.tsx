'use client';

import { Typography } from 'components';
import { useState } from 'react';

export default function ReplClient() {
  const [result, setResult] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/repl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: input }),
      });

      const json = await response.json();
      setResult(json.result);
    } catch (error) {
      setResult('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Typography variant="h1">REPL</Typography>
      <form onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter code here..."
          rows={10}
          cols={80}
          style={{ width: '100%', marginBottom: '10px' }}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Running...' : 'Run Code'}
        </button>
      </form>
      {result && (
        <div>
          <Typography variant="h3">Result:</Typography>
          <pre style={{ background: '#f5f5f5', padding: '10px', whiteSpace: 'pre-wrap' }}>{result}</pre>
        </div>
      )}
    </div>
  );
}
