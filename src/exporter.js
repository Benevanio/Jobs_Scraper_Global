import { createWriteStream, mkdirSync } from "fs";
import { dirname } from "path";
import PDFDocument from "pdfkit";
import XLSX from "xlsx";
import { logInfo } from "./logger.js";

function ensureParentDir(filePath) {
  const dir = dirname(filePath);
  if (dir && dir !== ".") {
    mkdirSync(dir, { recursive: true });
  }
}

export function exportToExcel(rows, outputFile) {
  ensureParentDir(outputFile);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Vagas");
  XLSX.writeFile(workbook, outputFile);

  logInfo(`Arquivo gerado: ${outputFile}`);
}

function cleanJobUrl(url) {
  try {
    const match = url.match(/\/jobs\/view\/[^?#]*-(\d{6,})/);
    if (match) return `https://www.linkedin.com/jobs/view/${match[1]}`;
  } catch {}
  return url;
}

export function exportToPDF(rows, outputFile) {
  ensureParentDir(outputFile);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });
    const stream = createWriteStream(outputFile);

    doc.pipe(stream);
    stream.on("error", reject);
    stream.on("finish", resolve);

    // Título
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Vagas LinkedIn – Brasil (Remoto)", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(9).font("Helvetica").text(`Total: ${rows.length} vagas`, { align: "center" });
    doc.moveDown(1);

    const cols = [
      { key: "palavra",  label: "Palavra-chave", width: 110 },
      { key: "titulo",   label: "Título",         width: 160 },
      { key: "empresa",  label: "Empresa",        width: 130 },
      { key: "local",    label: "Local",          width: 100 },
      { key: "link",     label: "Link",           width: 280 }
    ];

    const rowH = 18;
    const startX = doc.page.margins.left;

    function drawRow(rowData, isHeader) {
      let x = startX;
      const y = doc.y;

      if (isHeader) {
        doc.rect(x, y, cols.reduce((s, c) => s + c.width, 0), rowH).fill("#2c3e50");
      } else {
        doc.rect(x, y, cols.reduce((s, c) => s + c.width, 0), rowH).fillAndStroke("#f9f9f9", "#dddddd");
      }

      doc.font(isHeader ? "Helvetica-Bold" : "Helvetica").fontSize(8);

      for (const col of cols) {
        const raw = String(rowData[col.key] ?? "");
        const isLink = col.key === "link" && !isHeader;
        const text = isLink ? cleanJobUrl(raw) : raw;

        if (isLink) {
          doc
            .fillColor("#0563C1")
            .text(text, x + 3, y + 4, { width: col.width - 6, lineBreak: false });
          doc.link(x + 3, y + 4, col.width - 6, 10, text);
        } else {
          doc
            .fillColor(isHeader ? "white" : "#222222")
            .text(text, x + 3, y + 4, { width: col.width - 6, lineBreak: false, ellipsis: true });
        }
        x += col.width;
      }

      doc.y = y + rowH;
    }

    drawRow({ palavra: "Palavra-chave", titulo: "Título", empresa: "Empresa", local: "Local", link: "Link" }, true);

    for (let i = 0; i < rows.length; i++) {
      if (doc.y + rowH > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        drawRow({ palavra: "Palavra-chave", titulo: "Título", empresa: "Empresa", local: "Local", link: "Link" }, true);
      }
      drawRow(rows[i], false);
    }

    doc.end();
    logInfo(`PDF gerado: ${outputFile}`);
  });
}
