export default function CsvSummaryCard({ summary }) {
  if (!summary) {
    return (
      <div className="card">
        <h3>Uploaded CSV summary</h3>
        <p>No CSV processed yet.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h3>Uploaded CSV summary</h3>
      <p className="card-highlight">{summary.filename}</p>
      <p>{summary.rows} rows · {summary.columns} columns</p>
      <p>Normal: {summary.normal} · Attack: {summary.attack}</p>
    </div>
  )
}