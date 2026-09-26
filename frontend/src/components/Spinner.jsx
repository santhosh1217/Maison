export default function Spinner({ fullPage = false }) {
  if (fullPage) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }
  return <div className="loading-wrap"><div className="spinner" /></div>;
}
