import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getTotalPredictions,
  getAttackCount,
  getNormalCount,
  getAttackRate,
  getCriticalThreatCount,
  getHighThreatCount,
  getMediumThreatCount,
  getLowThreatCount,
  getRecentThreats,
  getDetectionAccuracy,
} from "./storageService";

function openPrintableReportWindow(reportData) {
  const reportWindow = window.open("", "_blank", "noopener,noreferrer");

  if (!reportWindow) {
    return false;
  }

  const rows = reportData.topThreats.length
    ? reportData.topThreats
        .map(
          (threat, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${threat.timestamp || ""}</td>
              <td>${threat.label || ""}</td>
              <td>${((Number(threat.confidence) || 0) * 100).toFixed(1)}%</td>
              <td>${threat.source || ""}</td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="5">No recent prediction logs available.</td></tr>`;

  reportWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>CyberXAI Executive Security Report</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; margin: 32px; }
          h1 { margin-bottom: 4px; }
          .meta { color: #475569; margin-bottom: 24px; }
          .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 24px; }
          .summary div { border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 13px; }
          th { background: #e2e8f0; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <button onclick="window.print()">Print / Save as PDF</button>
        <h1>CyberXAI Executive Security Report</h1>
        <p class="meta">Generated: ${reportData.timestamp}</p>
        <div class="summary">
          <div><strong>Total Predictions:</strong> ${reportData.total}</div>
          <div><strong>Total Attacks:</strong> ${reportData.attacks}</div>
          <div><strong>Total Normal Traffic:</strong> ${reportData.normal}</div>
          <div><strong>Attack Rate:</strong> ${reportData.attackRate}%</div>
          <div><strong>Average Detection Confidence:</strong> ${reportData.accuracy}%</div>
          <div><strong>Threat Posture:</strong> ${reportData.posture}</div>
        </div>
        <h2>Recent Predictions</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Timestamp</th>
              <th>Prediction</th>
              <th>Confidence</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `);
  reportWindow.document.close();
  reportWindow.focus();

  return true;
}

export const generateExecutiveReport = () => {
  try {
  const total = getTotalPredictions();
  const topThreats = getRecentThreats(10);

  if (total === 0 && topThreats.length === 0) {
    alert("No threat intelligence data available for report generation.");
    return;
  }

  const doc = new jsPDF();
  const timestamp = new Date().toLocaleString();
  const filenameTime = new Date().toISOString().replace(/[:.]/g, "-");

  // Colors
  const primaryColor = [15, 23, 42];
  const secondaryColor = [8, 145, 178];
  
  // Footer Function
  const addFooter = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(
        "CyberXAI - Intrusion Detection & Explainability Platform",
        105,
        285,
        { align: "center" }
      );
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
    }
  };

  // 1. Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("CyberXAI Executive Security Report", 105, 20, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${timestamp}`, 105, 30, { align: "center" });

  let currentY = 50;

  // 2. Executive Summary
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary", 14, currentY);
  currentY += 10;

  const attacks = getAttackCount();
  const normal = getNormalCount();
  const attackRate = getAttackRate();
  const accuracy = getDetectionAccuracy();
  let posture = "Stable";
  if (Number(attackRate) > 40 || getCriticalThreatCount() > 0) posture = "Critical Risk";
  else if (Number(attackRate) > 15 || getHighThreatCount() > 0) posture = "Elevated Warning";
  const reportData = {
    total,
    attacks,
    normal,
    attackRate,
    accuracy,
    posture,
    timestamp,
    topThreats,
  };

  // Draw Summary Box
  doc.setFillColor(248, 250, 252);
  doc.rect(14, currentY, 182, 35, "F");
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, currentY, 182, 35, "S");

  doc.setFontSize(12);
  doc.setTextColor(50);
  doc.text(`Total Predictions: ${total}`, 20, currentY + 10);
  doc.text(`Total Attacks: ${attacks}`, 110, currentY + 10);
  doc.text(`Total Normal Traffic: ${normal}`, 20, currentY + 20);
  doc.text(`Attack Rate: ${attackRate}%`, 110, currentY + 20);
  doc.text(`Average Detection Confidence: ${accuracy}%`, 20, currentY + 30);
  
  currentY += 45;

  // 3. Threat Statistics
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Threat Statistics (Severity Distribution)", 14, currentY);
  currentY += 10;

  autoTable(doc, {
    startY: currentY,
    head: [["Severity Level", "Threat Count", "Risk Level"]],
    body: [
      ["Critical", getCriticalThreatCount(), "Immediate Action Required"],
      ["High", getHighThreatCount(), "Review Priority"],
      ["Medium", getMediumThreatCount(), "Investigate"],
      ["Low", getLowThreatCount(), "Monitor"]
    ],
    headStyles: { fillColor: secondaryColor },
    theme: "grid",
    margin: { left: 14, right: 14 }
  });

  currentY = (doc.lastAutoTable?.finalY || currentY) + 15;

  // 4. Top Threats Section
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Top Detected Threats", 14, currentY);
  currentY += 10;

  const threatBody = topThreats.map((t, idx) => [
    idx + 1,
    t.timestamp,
    t.label,
    `${(Number(t.confidence) * 100).toFixed(1)}%`,
    t.source.substring(0, 30) // truncate source
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["#", "Timestamp", "Threat Type", "Confidence", "Source"]],
    body: threatBody,
    headStyles: { fillColor: [220, 38, 38] }, // Red for threats
    theme: "striped",
    margin: { left: 14, right: 14 },
    styles: { fontSize: 10 }
  });

  currentY = (doc.lastAutoTable?.finalY || currentY) + 15;

  // 5. XAI Summary & Recommendations
  if (currentY > 200) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Explainable AI (XAI) & Security Recommendations", 14, currentY);
  currentY += 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(70);
  
  const recommendationsText = `Current Threat Posture: ${posture}

Based on the recent network traffic analysis, CyberXAI recommends the following actions:

1. Threat Mitigation: Review and quarantine systems associated with Critical and High severity alerts.
2. Firewall Hardening: If attack rate is elevated, enforce stricter ingress/egress filtering rules.
3. Feature Monitoring: Pay close attention to connections with high 'count' or anomalous 'duration' 
   as these features strongly correlate with active intrusions in the current model.
4. Continuous Audit: Keep monitoring the prototype monitoring view to ensure defenses remain resilient.
`;

  doc.text(recommendationsText, 14, currentY, { maxWidth: 180 });

  // Add Footers to all pages
  addFooter(doc);

  // Save PDF
  doc.save(`CyberXAI_Executive_Report_${filenameTime}.pdf`);
  } catch (error) {
    console.error("PDF report generation failed:", error);

    const openedFallback = openPrintableReportWindow({
      total: getTotalPredictions(),
      attacks: getAttackCount(),
      normal: getNormalCount(),
      attackRate: getAttackRate(),
      accuracy: getDetectionAccuracy(),
      posture: "Unavailable",
      timestamp: new Date().toLocaleString(),
      topThreats: getRecentThreats(10),
    });

    if (!openedFallback) {
      alert("PDF report generation failed. Please try CSV export.");
    }
  }
};
