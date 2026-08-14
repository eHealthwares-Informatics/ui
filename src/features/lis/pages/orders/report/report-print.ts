/* Builds the SYNLAB-style printable report HTML from order/report data.
   Mirrors the backend ReportPdfService template so printed output matches the PDF. */

export interface PrintRow {
  name: string;
  value: string;
  range: string;
  units: string;
  flag: 'Low' | 'High' | 'Normal' | '';
}

export interface PrintGroup {
  title: string;
  rows: PrintRow[];
}

export interface PrintReportData {
  brand: string;
  patient: {
    name: string;
    sex: string;
    idNumber: string;
    dateOfBirth: string;
    age: string;
    phone: string;
    email: string;
    address: string;
  };
  report: {
    requisitionNumber: string;
    orderReference: string;
    collectionDate: string;
    requestDate: string;
    reportDate: string;
    reportUpdatedDate: string;
    reportType: string;
    priority: string;
    specimenType: string;
    comments: string;
    diagnosis: string;
    testsRequested: string;
  };
  groups: PrintGroup[];
}

export function buildReportHtml(data: PrintReportData): string {
  const esc = (v: string) =>
    String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const flagClass = (flag: string) => (flag === 'Low' || flag === 'High' ? 'low' : '');

  const patientCol = (rows: Array<[string, string]>) =>
    rows
      .map(([l, v]) => `<div class="label">${esc(l)}</div><div class="value">${esc(v)}</div>`)
      .join('');

  const groupRows = (g: PrintGroup) => {
    const header = `<tr class="group-row"><td colspan="5">${esc(g.title)}</td></tr>`;
    const rows = g.rows
      .map((r) => {
        const c = flagClass(r.flag);
        return `<tr>
          <td class="${c}">${esc(r.name)}</td>
          <td class="${c}">${esc(r.value)}</td>
          <td class="${c}">${esc(r.range)}</td>
          <td class="${c}">${esc(r.units)}</td>
          <td class="${c}">${esc(r.flag)}</td>
        </tr>`;
      })
      .join('');
    return header + rows;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(data.brand)} Report</title>
<style>
  @page { size: A4; margin: 12mm 12mm 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #e9e9e9; color: #202020; font-family: Arial, Helvetica, sans-serif; font-size: 10.5px; }
  .page { width: 210mm; min-height: 297mm; margin: 12px auto; padding: 10mm 9mm 8mm; background: #fff; box-shadow: 0 1px 8px rgba(0,0,0,.18); }
  .patient-header { border: 1px solid #222; border-radius: 3px; margin-bottom: 12px; overflow: hidden; }
  .patient-title { background: #202d5b; color: #fff; font-weight: 700; padding: 6px 9px; font-size: 11px; }
  .patient-grid { display: grid; grid-template-columns: 1fr 1fr; padding: 8px 10px 7px; column-gap: 28px; }
  .patient-col { display: grid; grid-template-columns: 105px 1fr; row-gap: 4px; }
  .label { font-weight: 700; }
  .value { text-align: left; }
  .report-box { border: 1px solid #333; border-radius: 3px; overflow: hidden; margin-bottom: 13px; }
  .section-bar { background: #202d5b; color: #fff; padding: 6px 10px; font-size: 11px; font-weight: 700; }
  .report-grid { display: grid; grid-template-columns: 1fr 1fr; padding: 10px 12px 11px; column-gap: 30px; }
  .report-col { display: grid; grid-template-columns: 125px 1fr; row-gap: 4px; }
  .report-col .label { font-weight: 700; }
  h1 { font-size: 25px; line-height: 1.1; font-weight: 400; margin: 8px 0 10px; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10px; }
  th, td { border: 1px solid #747985; padding: 5px 7px; height: 25px; vertical-align: middle; }
  th { background: #202d5b; color: white; text-align: left; font-weight: 700; font-size: 10.5px; }
  th:nth-child(1) { width: 21%; }
  th:nth-child(2) { width: 20%; }
  th:nth-child(3) { width: 21%; }
  th:nth-child(4) { width: 20%; }
  th:nth-child(5) { width: 18%; }
  .group-row td { background: #d7dcf3; font-weight: 700; padding: 5px 7px; height: 25px; }
  .low { color: #e21d25; font-weight: 700; }
  .footer { margin-top: 17px; border-top: 1px solid #777; padding-top: 10px; display: flex; justify-content: space-between; font-size: 9px; color: #333; }
  .footer strong { font-weight: 700; }
  .brand-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #777; padding: 0 2px 7px; margin-bottom: 8px; }
  .synlab { display: flex; align-items: center; color: #0d365a; font-size: 34px; letter-spacing: -2px; font-weight: 300; }
  .synlab .mark { font-size: 42px; line-height: 1; margin-left: 2px; transform: skew(-8deg); }
  .download-note { color: #41657e; font-size: 9px; line-height: 1.35; text-align: left; width: 43%; }
  @media print { body { background: #fff; } .page { margin: 0; width: auto; min-height: auto; padding: 0; box-shadow: none; } }
</style>
</head>
<body>
<div class="page">
  <div class="brand-header">
    <div class="synlab">SYNL<span>Λ</span>B <span class="mark">Y</span></div>
    <div class="download-note">Downloaded from PathProvider. SYNLAB's online<br>results delivery and health management platform</div>
  </div>

  <section class="patient-header">
    <div class="patient-title">Patient: ${esc(data.patient.name)}</div>
    <div class="patient-grid">
      <div class="patient-col">${patientCol([
        ['Sex', data.patient.sex],
        ['ID Number', data.patient.idNumber],
        ['Date of Birth', data.patient.dateOfBirth],
        ['Age', data.patient.age],
      ])}</div>
      <div class="patient-col">${patientCol([
        ['Mobile', data.patient.phone],
        ['Telephone', '—'],
        ['Email', data.patient.email],
        ['Address', data.patient.address],
      ])}</div>
    </div>
  </section>

  <section class="report-box">
    <div class="section-bar">Report Details</div>
    <div class="report-grid">
      <div class="report-col">${patientCol([
        ['Requisition Number', data.report.requisitionNumber],
        ['Order Reference', data.report.orderReference],
        ['Collection Date', data.report.collectionDate],
        ['Request Date', data.report.requestDate],
        ['Report Date', data.report.reportDate],
        ['Report Updated Date', data.report.reportUpdatedDate],
        ['Report Type', data.report.reportType],
        ['Priority', data.report.priority],
      ])}</div>
      <div class="report-col">${patientCol([
        ['Specimen Type', data.report.specimenType],
        ['Comments', data.report.comments],
        ['Diagnosis', data.report.diagnosis],
        ['Tests Requested', data.report.testsRequested],
      ])}</div>
    </div>
  </section>

  <h1>Laboratory Results</h1>

  <table>
    <thead>
      <tr><th>Name</th><th>Result</th><th>Range</th><th>Units</th><th>Flag</th></tr>
    </thead>
    <tbody>
      ${data.groups.map(groupRows).join('')}
    </tbody>
  </table>

  <div class="footer">
    <div>${esc(data.brand)} Portal 2026 / Requisition Number: <strong>${esc(data.report.requisitionNumber)}</strong></div>
    <div>Page 1</div>
  </div>
</div>
</body>
</html>`;
}

export function printReportHtml(html: string): void {
  const win = window.open('', '_blank', 'width=900,height=1100');
  if (!win) {
    throw new Error('Popup blocked — allow popups to print the report');
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 300);
}
