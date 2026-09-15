export function SkeletonLine({ className = '' }) {
  return <div className={`skeleton h-4 rounded-md ${className}`} />;
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card animate-pulse-soft space-y-3">
      <div className="skeleton h-5 w-2/3 rounded-md" />
      {[...Array(lines)].map((_, i) => (
        <div key={i} className="skeleton h-4 rounded-md" style={{ width: `${75 - i * 15}%` }} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {[...Array(cols)].map((_, i) => (
              <th key={i}><div className="skeleton h-3 w-20 rounded" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(rows)].map((_, r) => (
            <tr key={r}>
              {[...Array(cols)].map((_, c) => (
                <td key={c}>
                  <div className="skeleton h-4 rounded" style={{ width: `${60 + Math.random() * 30}%` }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonKPI({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="card p-6 space-y-3 animate-pulse-soft">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-7 w-32 rounded" />
        </div>
      ))}
    </div>
  );
}
