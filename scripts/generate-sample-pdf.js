import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function generateSamplePdf() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pagesData = [
    // Page 1: Cover & Title / Placeholder Notice
    {
      isCover: true,
      title: 'Darjeeling Himalayan Railway (DHR) — Tindharia Shed',
      subtitle: 'B-Class Locomotive Maintenance Manual (Sample / Placeholder)',
      noticeTitle: 'SAMPLE / PLACEHOLDER DOCUMENT FOR PIPELINE TESTING',
      noticeBody: [
        'NOTICE: This document is a standalone sample technical manual generated for testing the on-device RAG retrieval pipeline of Steam-Shed Assistant.',
        'This placeholder manual contains sample technical specifications for torque limits, pressure settings, running clearances, maintenance intervals, procedures, and spare part numbers.',
        'To be replaced with official DHR maintenance documentation once confirmed by event organizers.',
        'Document Code: bclass_maintenance_manual_sample.pdf',
        'Facility: Tindharia Locomotive Workshop & Running Shed'
      ]
    },
    // Page 2: Boiler & Injectors
    {
      title: 'B-Class Maintenance Manual (Sample / Placeholder)',
      subtitle: 'Section 2: Boiler & Section 3: Injector Systems — Page 2',
      sections: [
        {
          heading: 'Section 2.1 Safety Valve Pressure Setting',
          content: [
            'Safety valve set pressure: 160 psi (11.0 bar).',
            'Tolerance: Lift within +/- 2 psi of nominal set pressure.'
          ]
        },
        {
          heading: 'Section 2.2 Boiler Washout Interval',
          content: [
            'Recommended maintenance interval: Boiler washout is required every 30 days or 1,500 km, whichever comes first.'
          ]
        },
        {
          heading: 'Section 3.1 Injector Fitting Torque Specification',
          content: [
            'Injector fitting torque: 85 lb-ft (115 N·m).'
          ]
        },
        {
          heading: 'Section 3.2 Injector Inspection Interval',
          content: [
            'Recommended maintenance interval: Inspect injector fittings every 7 days of service.'
          ]
        }
      ]
    },
    // Page 3: Brake Rigging & Wheelsets
    {
      title: 'B-Class Maintenance Manual (Sample / Placeholder)',
      subtitle: 'Section 4: Brake Rigging & Section 5: Wheelsets — Page 3',
      sections: [
        {
          heading: 'Section 4.1 Brake Rigging Pin Torque',
          content: [
            'Brake rigging pin torque: 45 lb-ft (61 N·m), do not exceed 50 lb-ft.'
          ]
        },
        {
          heading: 'Section 4.2 Brake Rigging Inspection Interval',
          content: [
            'Recommended maintenance interval: Inspect brake rigging every 30 days or 1,000 km, whichever comes first.'
          ]
        },
        {
          heading: 'Section 4.3 Brake Rigging Inspection Procedure',
          content: [
            '6-step procedure to inspect brake rigging:',
            '1. Chock locomotive.',
            '2. Visually inspect pins and brackets.',
            '3. Check torque.',
            '4. Measure shoe thickness.',
            '5. Test full stroke.',
            '6. Log findings.'
          ]
        },
        {
          heading: 'Section 5.1 Wheel Tread Diameter & Tolerance',
          content: [
            'Nominal wheel tread diameter: 508 mm (20 in).',
            'Allowable wheel wear: 6 mm reduction from nominal diameter allowed before reprofiling.'
          ]
        },
        {
          heading: 'Section 5.2 Axle Bearing Clearance',
          content: [
            'Axle box bearing clearance: 0.15–0.25 mm.'
          ]
        }
      ]
    },
    // Page 4: Motion, Packing & Spare Parts Reference
    {
      title: 'B-Class Maintenance Manual (Sample / Placeholder)',
      subtitle: 'Section 6: Motion, Section 7: Packing & Section 8: Parts — Page 4',
      sections: [
        {
          heading: 'Section 6.1 Valve Gear Lubrication Schedule',
          content: [
            'Lubricant specification: Main rod bearings require Grade EP-2 grease.',
            'Lubrication interval: Lubricate valve gear pins and links every 100 km or daily.'
          ]
        },
        {
          heading: 'Section 6.2 Coupling Rod Bearing Clearance',
          content: [
            'Coupling rod bearing clearance: 0.10–0.20 mm.'
          ]
        },
        {
          heading: 'Section 7.1 Piston Rod Packing Replacement Procedure',
          content: [
            '6-step procedure to replace piston rod packing:',
            '1. Isolate cylinder.',
            '2. Remove gland nut and old packing.',
            '3. Inspect rod surface.',
            '4. Fit new rings staggered 90 degrees.',
            '5. Tighten gland snug (not over-compressed).',
            '6. Test run and check for leaks.'
          ]
        },
        {
          heading: 'Section 7.2 Piston Rod Packing Inspection Interval',
          content: [
            'Recommended maintenance interval: Check piston rod packing for leaks every 14 days of service.'
          ]
        },
        {
          heading: 'Section 8.1 Injector Spare Part Reference',
          content: [
            'Part number for injector delivery fitting union nut: BC-INJ-014 (brass, 3/4in BSP).'
          ]
        },
        {
          heading: 'Section 8.2 Brake Rigging Spare Part Reference',
          content: [
            'Part number for brake rigging clevis pin: BC-BRK-027 (case-hardened steel).'
          ]
        },
        {
          heading: 'Section 8.3 Axle Box Spare Part Reference',
          content: [
            'Part number for axle box bearing shell: BC-AXL-009 (order in pairs).'
          ]
        }
      ]
    }
  ];

  for (let i = 0; i < pagesData.length; i++) {
    const pageData = pagesData[i];
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
    const { width, height } = page.getSize();

    let y = height - 40;

    // Header border
    page.drawRectangle({
      x: 35,
      y: y - 12,
      width: width - 70,
      height: 48,
      color: rgb(0.93, 0.90, 0.84),
      borderColor: rgb(0.23, 0.21, 0.19),
      borderWidth: 1.2,
    });

    page.drawText(pageData.title, {
      x: 45,
      y: y + 20,
      size: 11,
      font: boldFont,
      color: rgb(0.23, 0.21, 0.19),
    });

    page.drawText(pageData.subtitle, {
      x: 45,
      y: y + 4,
      size: 9,
      font: font,
      color: rgb(0.40, 0.35, 0.30),
    });

    y -= 50;

    if (pageData.isCover) {
      y -= 20;
      page.drawRectangle({
        x: 35,
        y: y - 180,
        width: width - 70,
        height: 200,
        color: rgb(0.97, 0.95, 0.90),
        borderColor: rgb(0.61, 0.48, 0.24),
        borderWidth: 1.5,
      });

      page.drawText(pageData.noticeTitle, {
        x: 50,
        y: y,
        size: 11,
        font: boldFont,
        color: rgb(0.61, 0.48, 0.24),
      });

      y -= 25;

      for (const line of pageData.noticeBody) {
        page.drawText(line, {
          x: 50,
          y: y,
          size: 9.5,
          font: font,
          maxWidth: width - 100,
          lineHeight: 14,
          color: rgb(0.23, 0.21, 0.19),
        });
        y -= 28;
      }
    } else if (pageData.sections) {
      for (const section of pageData.sections) {
        y -= 10;
        page.drawRectangle({
          x: 35,
          y: y - 4,
          width: width - 70,
          height: 18,
          color: rgb(0.61, 0.48, 0.24),
        });

        page.drawText(section.heading, {
          x: 42,
          y: y,
          size: 9.5,
          font: boldFont,
          color: rgb(1, 1, 1),
        });

        y -= 18;

        for (const line of section.content) {
          page.drawCircle({
            x: 45,
            y: y + 3,
            size: 2,
            color: rgb(0.23, 0.21, 0.19),
          });

          page.drawText(line, {
            x: 54,
            y: y,
            size: 9,
            font: font,
            maxWidth: width - 90,
            lineHeight: 12,
            color: rgb(0.15, 0.13, 0.12),
          });

          y -= 16;
        }
      }
    }

    // Footer
    page.drawLine({
      start: { x: 35, y: 35 },
      end: { x: width - 35, y: 35 },
      thickness: 1,
      color: rgb(0.66, 0.60, 0.49),
    });

    page.drawText('Darjeeling Himalayan Railway • Tindharia Locomotive Works • Sample Maintenance Manual', {
      x: 35,
      y: 22,
      size: 8,
      font: font,
      color: rgb(0.45, 0.40, 0.35),
    });

    page.drawText(`Page ${i + 1} of ${pagesData.length}`, {
      x: width - 85,
      y: 22,
      size: 8,
      font: boldFont,
      color: rgb(0.23, 0.21, 0.19),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const destDir = path.resolve('public/sample-manuals');
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const destPath = path.join(destDir, 'bclass_maintenance_manual_sample.pdf');
  fs.writeFileSync(destPath, Buffer.from(pdfBytes));
  console.log('Sample PDF generated at:', destPath);
}

generateSamplePdf().catch(console.error);
