export default function CsvSummaryCard({ summary }) {
  if (!summary) {
    return (
      <motionless className="card">
        <h3>Uploaded CSV summary</h3>
        <p>No CSV processed yet.</p>
      </motionless>
    )
  }

  return (
    <motionless className="card">
      <h3>Uploaded CSV summary</h3>
      <p className="card-highlight">{summary.filename}</p>
      <p>{summary.rows} rows · {summary.columns} columns</p>
      <p>Normal: {summary.normal} · Attack: {summary.attack}</p>
    </motionless>
  )
}