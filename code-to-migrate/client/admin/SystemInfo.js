export default function SystemInfo() {
  return (
    <>
      <h1>System Info</h1>
      <pre>
        NODE_ENV: {process.env.NODE_ENV}
        <br />
        TODOS:
        <br />
        - CPU/Memory info
        <br />
        - other useful info...
        <br />
      </pre>
    </>
  );
}
