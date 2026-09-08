/**
 * PDF Report Generator for DrishtiXAI Screening Reports
 * Uses jsPDF for layout and html2canvas for image capture
 */

import jsPDF from 'jspdf';
import { Patient, Screening, SEVERITY_LABELS } from '@/types';
import { fmtDateTime, confPct, isDiabetic } from '@/lib/utils';

const BRAND_BLUE  = [29, 78, 216] as const;   // brand-700
const BRAND_LIGHT = [219, 234, 254] as const; // brand-100
const SLATE_900   = [15, 23, 42] as const;
const SLATE_600   = [71, 85, 105] as const;
const SLATE_200   = [226, 232, 240] as const;
const GREEN       = [21, 128, 61] as const;
const AMBER       = [180, 83, 9] as const;
const RED         = [185, 28, 28] as const;
const WHITE       = [255, 255, 255] as const;

function rgb(c: readonly [number, number, number]) {
  return { r: c[0], g: c[1], b: c[2] };
}

function priorityColor(p?: string | null): readonly [number, number, number] {
  if (p === 'urgent')   return RED;
  if (p === 'priority') return AMBER;
  return GREEN;
}

function severityColor(s?: number | null): readonly [number, number, number] {
  if (s == null) return SLATE_600;
  if (s === 0)   return GREEN;
  if (s <= 2)    return AMBER;
  return RED;
}

/** Draw a filled rounded rect (jsPDF doesn't have rounded natively — simulate with roundedRect) */
function filledBox(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  r: readonly [number, number, number],
  cornerRadius = 3,
) {
  const { r: cr, g, b } = rgb(r);
  doc.setFillColor(cr, g, b);
  doc.roundedRect(x, y, w, h, cornerRadius, cornerRadius, 'F');
}

/** Horizontal rule */
function hr(doc: jsPDF, y: number, left = 14, right = 196) {
  doc.setDrawColor(...SLATE_200);
  doc.setLineWidth(0.3);
  doc.line(left, y, right, y);
}

/** Section heading */
function sectionHead(doc: jsPDF, text: string, y: number) {
  filledBox(doc, 14, y, 182, 7, BRAND_LIGHT, 2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND_BLUE);
  doc.text(text.toUpperCase(), 17, y + 4.8);
  return y + 10;
}

/** Key-value row */
function kvRow(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  valueColor?: readonly [number, number, number],
) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...SLATE_600);
  doc.text(label, x, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...(valueColor ?? SLATE_900));
  doc.text(value, x + 40, y);
}

/** Fetch an image URL and convert it to base64 for embedding in PDF */
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res  = await fetch(url);
    const blob = await res.blob();
    return new Promise<string>(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateScreeningPDF(
  screening: Screening,
  patient: Patient,
  fundusImageUrl: string | null,
  gradcamImageUrl: string | null,
): Promise<void> {
  const doc  = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const PW   = 210;  // page width mm
  const PH   = 297;  // page height mm
  const ML   = 14;   // margin left
  const MR   = 14;   // margin right
  const CW   = PW - ML - MR; // content width

  // ── Header ──────────────────────────────────────────────────────────────────
  filledBox(doc, 0, 0, PW, 28, BRAND_BLUE, 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...WHITE);
  doc.text('DrishtiXAI', ML, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(191, 219, 254);  // blue-200
  doc.text('Diabetic Retinopathy Screening Report', ML, 18);

  // Right side: report meta
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text(`Screening ID: #${screening.id}`, PW - MR, 10, { align: 'right' });
  doc.text(`Date: ${fmtDateTime(screening.screening_date)}`, PW - MR, 15, { align: 'right' });
  doc.text(`Status: ${screening.status.replace(/_/g, ' ').toUpperCase()}`, PW - MR, 20, { align: 'right' });

  if (screening.is_demo_mode) {
    filledBox(doc, PW - MR - 25, 23, 25, 5, [251, 191, 36] as const, 2);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 53, 15);
    doc.text('⚠ DEMO MODE', PW - MR - 12.5, 26.5, { align: 'center' });
  }

  let y = 35;

  // ── Disclaimer ─────────────────────────────────────────────────────────────
  filledBox(doc, ML, y, CW, 7, [254, 243, 199] as const, 2);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(...AMBER);
  doc.text(
    'RESEARCH PROTOTYPE — NOT FOR CLINICAL USE. Predictions require validation by a qualified ophthalmologist.',
    ML + 2, y + 4.5,
  );
  y += 10;

  // ── Diagnosis summary banner ─────────────────────────────────────────────────
  const sev      = screening.predicted_severity;
  const diabetic = isDiabetic(sev);
  const bannerBg: readonly [number, number, number] = diabetic
    ? (sev! >= 3 ? [254, 226, 226] as const : [254, 243, 199] as const)
    : [209, 250, 229] as const;
  const bannerBorder: readonly [number, number, number] = diabetic
    ? (sev! >= 3 ? RED : AMBER)
    : GREEN;

  filledBox(doc, ML, y, CW, 16, bannerBg, 3);
  doc.setDrawColor(...bannerBorder);
  doc.setLineWidth(0.5);
  doc.roundedRect(ML, y, CW, 16, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...bannerBorder);
  doc.text(
    diabetic ? '⚠  Diabetic Retinopathy Detected' : '✓  No Diabetic Retinopathy Detected',
    ML + 4, y + 7,
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const subColor = diabetic ? AMBER : GREEN;
  doc.setTextColor(subColor[0], subColor[1], subColor[2]);
  const sevText = sev != null ? SEVERITY_LABELS[sev] : '—';
  const confText = screening.prediction_confidence != null ? confPct(screening.prediction_confidence) : '—';
  doc.text(`${sevText}  ·  Confidence: ${confText}  ·  Referral: ${(screening.referral_priority ?? 'routine').toUpperCase()}`, ML + 4, y + 13);
  y += 20;

  // ── Patient information ───────────────────────────────────────────────────
  y = sectionHead(doc, 'Patient Information', y);

  const col1 = ML;
  const col2 = ML + CW / 2;
  kvRow(doc, 'Full Name:',      patient.full_name,                           col1, y);
  kvRow(doc, 'Patient ID:',     patient.patient_id,                          col2, y);
  y += 7;
  kvRow(doc, 'Age / Gender:',  `${patient.age} years / ${patient.gender}`,   col1, y);
  kvRow(doc, 'Eye Screened:',   `${screening.eye_side.toUpperCase()} Eye`,   col2, y);
  y += 7;
  kvRow(doc, 'Location:',       [patient.village_name, patient.district, patient.state].filter(Boolean).join(', ') || '—', col1, y);
  kvRow(doc, 'Facility:',       screening.performed_by ? `User #${screening.performed_by}` : '—', col2, y);
  y += 7;
  kvRow(doc, 'Has Diabetes:',   patient.has_diabetes   ?? '—', col1, y);
  kvRow(doc, 'Hypertension:',   patient.has_hypertension ?? '—', col2, y);
  y += 10;
  hr(doc, y); y += 6;

  // ── AI Analysis results ───────────────────────────────────────────────────
  y = sectionHead(doc, 'AI Analysis Results', y);

  if (sev != null) {
    kvRow(doc, 'DR Severity:',  sevText,                 col1, y, severityColor(sev));
    kvRow(doc, 'Severity Level:', `Level ${sev} / 4`,   col2, y);
    y += 7;
    kvRow(doc, 'Confidence:',   confText,                col1, y,
          (screening.prediction_confidence ?? 0) >= 0.8 ? GREEN
          : (screening.prediction_confidence ?? 0) >= 0.6 ? AMBER : RED);
    kvRow(doc, 'Review Required:', screening.requires_human_review ? 'Yes' : 'No', col2, y,
          screening.requires_human_review ? RED : GREEN);
    y += 7;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...SLATE_600);
    doc.text('Analysis not yet performed.', col1, y);
    y += 7;
  }

  // Image quality
  kvRow(doc, 'Image Quality:',
    (screening.image_quality ?? 'unknown').toUpperCase(),
    col1, y,
    screening.image_quality === 'good' ? GREEN
    : screening.image_quality === 'acceptable' ? AMBER : RED,
  );
  if (screening.quality_score != null) {
    kvRow(doc, 'Quality Score:', `${(screening.quality_score * 100).toFixed(1)}%`, col2, y);
  }
  y += 7;

  if (screening.quality_guidance) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...AMBER);
    const lines = doc.splitTextToSize(`Guidance: ${screening.quality_guidance}`, CW);
    doc.text(lines, col1, y);
    y += lines.length * 4.5 + 2;
  }
  y += 2;
  hr(doc, y); y += 6;

  // ── Referral recommendation ───────────────────────────────────────────────
  y = sectionHead(doc, 'Referral Recommendation', y);

  const pColor = priorityColor(screening.referral_priority);
  kvRow(doc, 'Priority:',
    (screening.referral_priority ?? 'routine').toUpperCase(), col1, y, pColor);
  y += 7;

  if (screening.referral_reasoning) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SLATE_600);
    const lines = doc.splitTextToSize(screening.referral_reasoning, CW);
    doc.text(lines, col1, y);
    y += lines.length * 4.5 + 3;
  }
  hr(doc, y); y += 6;

  // ── Explainability summary ────────────────────────────────────────────────
  if (screening.has_explanation && screening.explanation_summary) {
    y = sectionHead(doc, 'AI Explanation (Grad-CAM)', y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SLATE_600);
    const lines = doc.splitTextToSize(screening.explanation_summary, CW);
    doc.text(lines, col1, y);
    y += lines.length * 4.5 + 4;
    hr(doc, y); y += 6;
  }

  // ── Clinician review (if done) ────────────────────────────────────────────
  if (screening.status === 'clinician_reviewed') {
    y = sectionHead(doc, 'Clinician Review', y);

    kvRow(doc, 'Agreement:',
      screening.clinician_agrees ? 'Agrees with AI' : 'Disagrees with AI',
      col1, y,
      screening.clinician_agrees ? GREEN : RED,
    );
    kvRow(doc, 'Final Referral:',
      (screening.final_referral_priority ?? 'routine').toUpperCase(),
      col2, y,
      priorityColor(screening.final_referral_priority),
    );
    y += 7;

    if (screening.clinician_severity != null) {
      kvRow(doc, 'Clinical Assessment:',
        SEVERITY_LABELS[screening.clinician_severity],
        col1, y, severityColor(screening.clinician_severity));
      y += 7;
    }

    if (screening.clinician_notes) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...SLATE_600);
      const lines = doc.splitTextToSize(`Notes: ${screening.clinician_notes}`, CW);
      doc.text(lines, col1, y);
      y += lines.length * 4.5 + 3;
    }
    hr(doc, y); y += 6;
  }

  // ── Images page (page 2) ─────────────────────────────────────────────────
  const imagesToEmbed: { url: string; label: string }[] = [];
  if (fundusImageUrl) imagesToEmbed.push({ url: fundusImageUrl, label: 'Fundus Retinal Image' });
  if (gradcamImageUrl) imagesToEmbed.push({ url: gradcamImageUrl, label: 'Grad-CAM Attention Heatmap' });

  if (imagesToEmbed.length > 0) {
    doc.addPage();

    // Page 2 header strip
    filledBox(doc, 0, 0, PW, 16, BRAND_BLUE, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...WHITE);
    doc.text('Retinal Images', ML, 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(191, 219, 254);
    doc.text(`Patient: ${patient.full_name}  ·  Screening #${screening.id}`, ML, 14);

    let imgY = 22;
    const imgW = imagesToEmbed.length === 1 ? CW : CW / 2 - 3;
    let imgX = ML;

    for (let i = 0; i < imagesToEmbed.length; i++) {
      const { url, label } = imagesToEmbed[i];
      const b64 = await fetchImageAsBase64(url);

      // Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...BRAND_BLUE);
      doc.text(label, imgX, imgY);

      const boxY = imgY + 3;
      const boxH = 110;

      if (b64) {
        doc.addImage(b64, 'JPEG', imgX, boxY, imgW, boxH);
        // border
        doc.setDrawColor(...SLATE_200);
        doc.setLineWidth(0.3);
        doc.rect(imgX, boxY, imgW, boxH, 'S');
      } else {
        filledBox(doc, imgX, boxY, imgW, boxH, SLATE_200, 2);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(...SLATE_600);
        doc.text('Image unavailable', imgX + imgW / 2, boxY + boxH / 2, { align: 'center' });
      }

      if (imagesToEmbed.length === 2 && i === 0) {
        imgX = ML + imgW + 6;
      } else {
        imgY = boxY + boxH + 10;
        imgX = ML;
      }
    }

    // Grad-CAM note
    if (gradcamImageUrl) {
      const noteY = imagesToEmbed.length === 2 ? 22 + 3 + 110 + 10 : imgY;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(...SLATE_600);
      doc.text(
        'Note: Grad-CAM heatmap shows model attention regions. Warm colours (red/yellow) indicate higher influence on the prediction.',
        ML, noteY + 5, { maxWidth: CW },
      );
    }
  }

  // ── Footer on all pages ──────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    filledBox(doc, 0, PH - 10, PW, 10, [15, 23, 42] as const, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('DrishtiXAI  ·  SIH26038  ·  Research Prototype — NOT FOR CLINICAL USE', ML, PH - 3.5);
    doc.text(`Page ${p} / ${totalPages}`, PW - MR, PH - 3.5, { align: 'right' });
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  const filename = `DrishtiXAI_Screening_${patient.patient_id}_${screening.id}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(filename);
}
