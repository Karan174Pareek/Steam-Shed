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
      title: 'Darjeeling Himalayan Railway (DHR) — Tindharia Works',
      subtitle: 'B-Class 0-4-0ST Locomotive Maintenance Manual (Sample)',
      noticeTitle: 'SAMPLE / PLACEHOLDER DOCUMENT FOR TESTING',
      noticeBody: [
        'NOTICE: This document is a standalone technical specification generated exclusively for testing the on-device RAG retrieval pipeline of Steam-Shed Assistant.',
        'This placeholder manual contains sample technical specifications for torque limits, pressure settings, running clearances, maintenance intervals, procedures, and spare part numbers.',
        'This document is to be replaced with official DHR documentation once confirmed by organizers.',
        'Document Identifier: DHR-TS-SAMPLE-REV2',
        'Effective Facility: Tindharia Mechanical Workshop & Running Shed'
      ]
    },
    // Page 2: Boiler & Injectors
    {
      title: 'Darjeeling Himalayan Railway — B-Class Maintenance Manual (Sample)',
      subtitle: 'Boiler Operating & Injector Specifications — Page 2',
      sections: [
        {
          heading: 'Section 2.1 Safety Valve Pressure Setting',
          content: [
            'Safety valve set pressure: 160 psi (11.0 bar).',
            'Lift tolerance: Both valves must lift cleanly within ±2 psi of nominal set pressure.',
            'Design: Dual Ramsbottom duplex spring-loaded safety valves mounted on boiler firebox wrapper.',
            'Verification: Pressure gauge check and safety valve lift test required before every running turn.'
          ]
        },
        {
          heading: 'Section 2.2 Boiler Washout Interval',
          content: [
            'Maintenance interval: Boiler washout is required every 30 days or 1,500 km, whichever comes first.',
            'Procedure overview: Extinguish fire, cool boiler gradually, remove all washout and mud plugs, wash scale accumulation with pressurized water jet, and inspect internal crown sheet.',
            'Fusible plug renewal: Renew firebox crown fusible plugs with certified lead core every 45 days or 2,000 km.'
          ]
        },
        {
          heading: 'Section 3.1 Injector Fitting Torque Specification',
          content: [
            'Injector fitting torque: Tighten delivery and steam union nuts to 85 lb-ft (115 N·m).',
            'Sealing: Fit new annealed copper sealing washers on union mating faces.',
            'Caution: Do not overtighten beyond 95 lb-ft to prevent stripping bronze union threads.'
          ]
        },
        {
          heading: 'Section 3.2 Injector Inspection Interval',
          content: [
            'Inspection interval: Inspect injector fittings, steam cones, and delivery check valves every 7 days of service.',
            'Operation test: Check for steam/water leakage and verify reliable water pickup under 120–160 psi boiler pressure.'
          ]
        }
      ]
    },
    // Page 3: Brake Rigging, Wheelsets & Tolerances
    {
      title: 'Darjeeling Himalayan Railway — B-Class Maintenance Manual (Sample)',
      subtitle: 'Brake Rigging, Wheelset Tolerances & Running Gear — Page 3',
      sections: [
        {
          heading: 'Section 4.1 Brake Rigging Pin Torque',
          content: [
            'Brake rigging pin torque: 45 lb-ft (61 N·m), do not exceed 50 lb-ft.',
            'Fastener retention: All brake rigging clevis and pivot pins must be positively locked with new split cotter pins.'
          ]
        },
        {
          heading: 'Section 4.2 Brake Rigging Inspection Interval',
          content: [
            'Inspection interval: Brake rigging must be inspected every 30 days or 1,000 km, whichever comes first.',
            'Clearance setting: Maintain brake block to wheel tyre clearance of 4.5 mm to 6.0 mm in released position.'
          ]
        },
        {
          heading: 'Section 4.3 Brake Rigging Inspection Procedure',
          content: [
            '6-step procedure for brake rigging inspection:',
            '1. Chock locomotive wheels securely on level shed track.',
            '2. Visually inspect all hanger pins, levers, and mounting brackets for wear or cracks.',
            '3. Check torque on all pivot and clevis pins (target 45 lb-ft).',
            '4. Measure brake shoe thickness (condemn if worn below 10 mm).',
            '5. Test full brake cylinder stroke and verify equal shoe contact on all wheels.',
            '6. Log findings and clearance measurements in shed register.'
          ]
        },
        {
          heading: 'Section 5.1 Wheel Tread Diameter & Tolerance',
          content: [
            'Nominal wheel tread diameter: 508 mm (20 in).',
            'Allowable wheel wear: Maximum 6 mm reduction from nominal diameter allowed before tyre reprofiling is required.',
            'Condemnation thickness: Condemn tyre when radial tread thickness reduces to 25 mm.'
          ]
        },
        {
          heading: 'Section 5.2 Axle Bearing Clearance',
          content: [
            'Axle box bearing clearance: 0.15–0.25 mm running clearance between bronze journal shell and axle neck.',
            'Axle box horncheek side play: Maximum allowable lateral clearance before liner replacement is 2.5 mm.'
          ]
        }
      ]
    },
    // Page 4: Motion, Packing & Spare Parts Reference
    {
      title: 'Darjeeling Himalayan Railway — B-Class Maintenance Manual (Sample)',
      subtitle: 'Motion, Packing Procedures & Spare Parts Reference — Page 4',
      sections: [
        {
          heading: 'Section 6.1 Valve Gear Lubrication Schedule',
          content: [
            'Lubricant specification: Main rod bearings and eccentric straps require Grade EP-2 grease.',
            'Lubrication interval: Lubricate valve gear pins, motion links, and slide bars every 100 km or daily before departure.'
          ]
        },
        {
          heading: 'Section 6.2 Coupling Rod Bearing Clearance',
          content: [
            'Coupling rod bearing clearance: 0.10–0.20 mm diametral running clearance on crank pins.',
            'Eccentric crank pin fastening nut torque: 185 N·m (136 lb-ft).'
          ]
        },
        {
          heading: 'Section 7.1 Piston Rod Packing Replacement Procedure',
          content: [
            '6-step procedure for piston rod packing replacement:',
            '1. Isolate cylinder and verify steam chest is completely depressurized.',
            '2. Remove gland nuts and extract old metallic/graphite packing rings.',
            '3. Inspect piston rod surface for scoring or ovality (must be < 0.05 mm).',
            '4. Fit new packing rings with split joints staggered at 90 degrees.',
            '5. Tighten gland nuts snug and evenly (do not over-compress).',
            '6. Conduct test run under steam and check for leaks.'
          ]
        },
        {
          heading: 'Section 7.2 Piston Rod Packing Inspection Interval',
          content: [
            'Inspection interval: Check piston rod packing for steam leaks every 14 days of service.'
          ]
        },
        {
          heading: 'Section 8.1 Injector Spare Part Number Reference',
          content: [
            'Injector delivery fitting union nut part number: BC-INJ-014 (brass, 3/4in BSP).'
          ]
        },
        {
          heading: 'Section 8.2 Brake Rigging Spare Part Number Reference',
          content: [
            'Brake rigging clevis pin part number: BC-BRK-027 (case-hardened steel).'
          ]
        },
        {
          heading: 'Section 8.3 Axle Box Spare Part Number Reference',
          content: [
            'Axle box bearing shell part number: BC-AXL-009 (order in pairs).'
          ]
        },
        {
          heading: 'Section 8.4 Cylinder Spare Part Number Reference',
          content: [
            'Piston rod metallic packing ring set part number: BC-CYL-033.'
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
      // Notice box
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
        size: 12,
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
        y -= 30;
      }
    } else if (pageData.sections) {
      for (const section of pageData.sections) {
        y -= 8;
        // Section header banner
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
            size: 8.5,
            font: font,
            maxWidth: width - 90,
            lineHeight: 11,
            color: rgb(0.15, 0.13, 0.12),
          });

          y -= 15;
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

  const destPath1 = path.join(destDir, 'DHR_B_Class_Loco_Maintenance_Spec.pdf');
  const destPath2 = path.join(destDir, 'bclass_maintenance_manual_sample.pdf');
  fs.writeFileSync(destPath1, Buffer.from(pdfBytes));
  fs.writeFileSync(destPath2, Buffer.from(pdfBytes));
  console.log('Sample DHR manual PDFs generated successfully at:', destPath1, 'and', destPath2);
}

generateSamplePdf().catch(console.error);
