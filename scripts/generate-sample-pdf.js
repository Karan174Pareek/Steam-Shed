import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function generateSamplePdf() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pagesData = [
    {
      title: 'Darjeeling Himalayan Railway — B-Class Locomotive Maintenance Manual',
      subtitle: 'Technical Specifications & Overhaul Reference — Tindharia Mechanical Workshop',
      sections: [
        {
          heading: 'Section 2.1: Safety Valve Pressure Setting',
          content: [
            'Safety valve set pressure: 160 psi (11.0 bar).',
            'Tolerance: Valves must lift cleanly within +/- 2 psi of nominal set pressure.',
            'Configuration: Dual Ramsbottom spring-loaded safety valves mounted on boiler firebox wrapper.',
            'Inspection: Test on steam before each running shift.'
          ]
        },
        {
          heading: 'Section 2.2: Boiler Washout Interval',
          content: [
            'Recommended maintenance interval: Boiler washout is required every 30 days or 1,500 km, whichever comes first.',
            'Procedure: Remove all mud plugs, washout plugs, and inspect crown sheet for scale accumulation.',
            'Fusible plugs renewal: Replace bronze lead-core fusible plugs every 45 days or 2,000 km.'
          ]
        },
        {
          heading: 'Section 3.1: Injector Fitting Torque Specification',
          content: [
            'Torque on injector fitting: Tighten delivery and steam union nuts to 85 lb-ft (115 N·m).',
            'Gasket spec: Use annealed copper sealing washers.',
            'Warning: Do not overtighten beyond 95 lb-ft to prevent stripping bronze union threads.'
          ]
        },
        {
          heading: 'Section 3.2: Injector Inspection Interval',
          content: [
            'Inspection interval: Inspect injector fittings, steam cones, and delivery check valves every 7 days of service.',
            'Check for steam leakage, lime deposit buildup, and test suction pickup under 120 psi boiler pressure.'
          ]
        }
      ]
    },
    {
      title: 'Darjeeling Himalayan Railway — B-Class Locomotive Maintenance Manual',
      subtitle: 'Brake Rigging, Wheelsets & Running Tolerances — Tindharia Shed',
      sections: [
        {
          heading: 'Section 4.1: Brake Rigging Pin Torque',
          content: [
            'Brake rigging pin torque: Tighten to 45 lb-ft (61 N·m). Do not exceed 50 lb-ft.',
            'Fastener locking: All brake pin castle nuts must be secured with new split cotter pins.'
          ]
        },
        {
          heading: 'Section 4.2: Brake Rigging Inspection Interval',
          content: [
            'Recommended maintenance interval: Inspect brake rigging every 30 days or 1,000 km, whichever comes first.',
            'Brake block to wheel tyre clearance: Maintain nominal 4.5 mm to 6.0 mm clearance in released position.'
          ]
        },
        {
          heading: 'Section 4.3: Brake Rigging Inspection Procedure',
          content: [
            '6-step procedure for brake rigging inspection:',
            '1. Chock locomotive wheels securely on level shed track.',
            '2. Visually inspect all hanger pins, levers, and mounting brackets for cracks or elongation.',
            '3. Check torque on all pivot and clevis pins (target 45 lb-ft).',
            '4. Measure brake shoe thickness; condemn if worn under 10 mm.',
            '5. Test full brake cylinder stroke and verify equal shoe contact.',
            '6. Log findings in shed maintenance register.'
          ]
        },
        {
          heading: 'Section 5.1: Wheel Tread Diameter & Tolerance',
          content: [
            'Nominal wheel tread diameter: 508 mm (20 in).',
            'Allowable wheel wear: Maximum 6 mm reduction from nominal diameter allowed before tyre reprofiling is required.',
            'Condemnation limit: Discard tyre when thickness reaches 25 mm.'
          ]
        },
        {
          heading: 'Section 5.2: Axle Bearing Clearance',
          content: [
            'Axle box bearing clearance: 0.15–0.25 mm running clearance between bronze journal shell and axle neck.',
            'Horncheek lateral side play: Discard liner if side play exceeds 2.5 mm.'
          ]
        }
      ]
    },
    {
      title: 'Darjeeling Himalayan Railway — B-Class Locomotive Maintenance Manual',
      subtitle: 'Motion, Packing Procedures & Spare Parts Reference — Tindharia Shed',
      sections: [
        {
          heading: 'Section 6.1: Valve Gear Lubrication Schedule',
          content: [
            'Lubricant specification: Main rod bearings and eccentric straps require Grade EP-2 grease.',
            'Lubrication interval: Lubricate valve gear pins, motion links, and slide bars every 100 km or daily before departure.'
          ]
        },
        {
          heading: 'Section 6.2: Coupling Rod Bearing Clearance',
          content: [
            'Coupling rod bearing clearance: 0.10–0.20 mm diametral clearance on crank pins.',
            'Eccentric crank pin fastening nut torque: 185 N·m (136 lb-ft).'
          ]
        },
        {
          heading: 'Section 7.1: Piston Rod Packing Replacement Procedure',
          content: [
            '6-step procedure for piston rod packing replacement:',
            '1. Isolate cylinder and ensure steam chest is fully depressurized.',
            '2. Remove gland nuts and extract old metallic/graphite packing rings.',
            '3. Inspect piston rod surface for scoring or ovality (must be < 0.05 mm).',
            '4. Fit new packing rings with split joints staggered at 90 degrees.',
            '5. Tighten gland nuts snug and evenly (do not over-compress).',
            '6. Conduct test run under steam and check for leaks.'
          ]
        },
        {
          heading: 'Section 7.2: Piston Rod Packing Inspection Interval',
          content: [
            'Inspection interval: Piston rod packing must be checked for steam leakage every 14 days of service.'
          ]
        },
        {
          heading: 'Section 8: Spare Parts Reference',
          content: [
            'Official DHR spare part numbers:',
            '• Injector delivery fitting union nut: Part No. BC-INJ-014 (brass, 3/4in BSP).',
            '• Brake rigging clevis pin: Part No. BC-BRK-027 (case-hardened steel).',
            '• Axle box bearing shell: Part No. BC-AXL-009 (order in pairs).',
            '• Piston rod metallic packing ring set: Part No. BC-CYL-033.'
          ]
        }
      ]
    }
  ];

  for (let i = 0; i < pagesData.length; i++) {
    const pageData = pagesData[i];
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait in points
    const { width, height } = page.getSize();

    let y = height - 45;

    // Header border
    page.drawRectangle({
      x: 35,
      y: y - 10,
      width: width - 70,
      height: 44,
      color: rgb(0.93, 0.90, 0.84),
      borderColor: rgb(0.23, 0.21, 0.19),
      borderWidth: 1.2,
    });

    // Page title
    page.drawText(pageData.title, {
      x: 45,
      y: y + 18,
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

    y -= 45;

    for (const section of pageData.sections) {
      y -= 10;
      // Section header banner
      page.drawRectangle({
        x: 35,
        y: y - 4,
        width: width - 70,
        height: 18,
        color: rgb(0.61, 0.48, 0.24), // Brass accent tone
      });

      page.drawText(section.heading, {
        x: 42,
        y: y,
        size: 9.5,
        font: boldFont,
        color: rgb(1, 1, 1),
      });

      y -= 20;

      for (const line of section.content) {
        // Bullet
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

        y -= 16;
      }
    }

    // Footer
    page.drawLine({
      start: { x: 35, y: 35 },
      end: { x: width - 35, y: 35 },
      thickness: 1,
      color: rgb(0.66, 0.60, 0.49),
    });

    page.drawText('Darjeeling Himalayan Railway • Tindharia Locomotive Works • B-Class Official Reference', {
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
