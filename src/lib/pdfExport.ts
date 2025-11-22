import jsPDF from "jspdf";

interface DiagnosticData {
  diagnosis_summary: string;
  probable_causes: string[];
  estimated_cost_min: number;
  estimated_cost_max: number;
  urgency: string;
  scam_alerts: string[] | null;
  fix_instructions: string;
  created_at: string;
  appliances?: { name: string; type: string } | null;
  properties?: { name: string } | null;
}

export const exportDiagnosticToPDF = (diagnostic: DiagnosticData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = 20;

  // Header with logo and brand
  doc.setFillColor(37, 99, 235); // Primary blue
  doc.rect(0, 0, pageWidth, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("FixSense", margin, 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("AI-Powered Appliance Diagnostics", margin, 32);

  // Reset text color
  doc.setTextColor(0, 0, 0);
  yPosition = 55;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Diagnostic Report", margin, yPosition);
  yPosition += 10;

  // Date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date(diagnostic.created_at).toLocaleDateString()}`, margin, yPosition);
  yPosition += 15;

  // Appliance Info
  if (diagnostic.appliances || diagnostic.properties) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Appliance Information", margin, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    if (diagnostic.appliances) {
      doc.text(`Name: ${diagnostic.appliances.name}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Type: ${diagnostic.appliances.type}`, margin, yPosition);
      yPosition += 6;
    }
    
    if (diagnostic.properties) {
      doc.text(`Property: ${diagnostic.properties.name}`, margin, yPosition);
      yPosition += 6;
    }
    
    yPosition += 8;
  }

  // Urgency Badge
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Urgency Level:", margin, yPosition);
  
  const urgencyColor: [number, number, number] = diagnostic.urgency === "critical" ? [220, 38, 38] : 
                       diagnostic.urgency === "warning" ? [245, 158, 11] : [34, 197, 94];
  doc.setFillColor(urgencyColor[0], urgencyColor[1], urgencyColor[2]);
  doc.roundedRect(margin + 40, yPosition - 5, 30, 7, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(diagnostic.urgency.toUpperCase(), margin + 43, yPosition);
  doc.setTextColor(0, 0, 0);
  yPosition += 15;

  // Diagnosis Summary
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Diagnosis Summary", margin, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const summaryLines = doc.splitTextToSize(diagnostic.diagnosis_summary, maxWidth);
  doc.text(summaryLines, margin, yPosition);
  yPosition += summaryLines.length * 5 + 8;

  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  // Probable Causes
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Probable Causes", margin, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  diagnostic.probable_causes.forEach((cause, index) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    const causeLines = doc.splitTextToSize(`${index + 1}. ${cause}`, maxWidth - 5);
    doc.text(causeLines, margin + 5, yPosition);
    yPosition += causeLines.length * 5 + 3;
  });
  yPosition += 5;

  // Estimated Cost
  if (yPosition > 260) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Estimated Repair Cost", margin, yPosition);
  yPosition += 7;

  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.text(`$${diagnostic.estimated_cost_min} - $${diagnostic.estimated_cost_max}`, margin, yPosition);
  doc.setTextColor(0, 0, 0);
  yPosition += 10;

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Prices may vary by location and technician. Always get multiple quotes.", margin, yPosition);
  doc.setTextColor(0, 0, 0);
  yPosition += 12;

  // Scam Alerts
  if (diagnostic.scam_alerts && diagnostic.scam_alerts.length > 0) {
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFillColor(254, 242, 242);
    doc.rect(margin - 5, yPosition - 5, maxWidth + 10, diagnostic.scam_alerts.length * 15 + 15, "F");

    doc.setTextColor(220, 38, 38);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("⚠ Scam Protection Alerts", margin, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    diagnostic.scam_alerts.forEach((alert, index) => {
      const alertLines = doc.splitTextToSize(`• ${alert}`, maxWidth - 5);
      doc.text(alertLines, margin + 5, yPosition);
      yPosition += alertLines.length * 5 + 3;
    });
    
    doc.setTextColor(0, 0, 0);
    yPosition += 10;
  }

  // Fix Instructions
  if (yPosition > 220) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Repair Instructions", margin, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const instructionLines = doc.splitTextToSize(diagnostic.fix_instructions, maxWidth);
  instructionLines.forEach((line: string) => {
    if (yPosition > 280) {
      doc.addPage();
      yPosition = 20;
    }
    doc.text(line, margin, yPosition);
    yPosition += 5;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | Generated by FixSense`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Save the PDF
  const fileName = `FixSense_Diagnostic_${new Date(diagnostic.created_at).toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
