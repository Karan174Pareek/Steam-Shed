import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function generateSamplePdf() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pagesData = [
    {
      title: 'Darjeeling Himalayan Railway — Tindharia Mechanical Workshop',
      subtitle: 'Technical Maintenance & Overhaul Specification: B-Class 0-4-0ST Locomotives',
      sections: [
        {
          heading: 'Section 1.0 — General Dimensions & Weight Distribution',
          content: [
            'Gauge: 2 feet 0 inches (610 mm) narrow gauge.',
            'Working adhesive weight: 14.0 tonnes in full working order with 400 imperial gallons of water and 1.0 tonne coal.',
            'Maximum axle load: 7.2 tonnes on driving axle.',
            'Rigid wheelbase: 5 feet 6 inches (1,676 mm), allowing minimum curve negotiation down to 50 feet radius.',
            'Cylinder bore and stroke: 11 inches diameter by 14 inches stroke.',
            'Coupled wheel diameter: 2 feet 2 inches (660 mm) on tyre tread.'
          ]
        },
        {
          heading: 'Section 1.1 — Boiler & Pressure Vessel Specifications',
          content: [
            'Maximum operating boiler pressure: 140 psi (9.65 bar).',
            'Safety valve configuration: Twin 2.0-inch Ramsbottom duplex safety valves set to lift precisely at 142 psi.',
            'Hydraulic test pressure: 210 psi cold water pressure required every 12 months during annual inspection.',
            'Fusible plugs: Dual lead-filled bronze alloy plugs in firebox crown plate must be renewed every 6 months or 12,000 miles, whichever comes first.',
            'Boiler barrel diameter: 3 feet 0.5 inches outside, constructed from 3/8 inch steel plate.',
            'Firebox heating surface: 40 square feet; tube heating surface: 310 square feet across 84 brass smoke tubes (1.5 inch outer diameter).'
          ]
        }
      ]
    },
    {
      title: 'Darjeeling Himalayan Railway — Shed Maintenance Manual',
      subtitle: 'B-Class 0-4-0ST Running Maintenance — Tindharia Shed',
      sections: [
        {
          heading: 'Section 2.3 — Brake Gear & Vacuum Apparatus',
          content: [
            'Brake system type: Ejector-driven vacuum automatic brake with auxiliary steam brake and hand screw apparatus.',
            'Vacuum brake operating level: Minimum 18 to 20 inches of mercury (Hg) required before departure from Tindharia, Kurseong, or Darjeeling.',
            'Brake block to wheel tyre clearance: 1/4 inch (6.35 mm) total clearance per block in released position.',
            'Brake hanger mounting pin torque: Tighten to 185 Nm (136 ft-lb) with cotter pin positively locked.',
            'Vacuum brake cylinder: 15-inch rolling ring cylinder mounted under rear bunker.',
            'Piston stroke travel: Normal operating stroke is 2.5 to 3.0 inches; maximum allowable stroke before manual slack adjustment is 4.0 inches (102 mm).'
          ]
        },
        {
          heading: 'Section 2.4 — Wheelsets & Tyre Profile Tolerances',
          content: [
            'Tyre tread condemnation thickness: Minimum allowable tyre thickness on tread centre line is 1.25 inches (31.8 mm).',
            'Wheel flange wear limit: Flange thickness must not be less than 13/16 inch (20.6 mm) measured at 9/16 inch below flange crest.',
            'Wheel gauge back-to-back distance: 1 foot 9.75 inches (+/- 1/16 inch) (552.5 mm).',
            'Axle box horncheek lateral clearance: 3/32 inch (2.4 mm) maximum allowable side play before liner replacement.'
          ]
        }
      ]
    },
    {
      title: 'Darjeeling Himalayan Railway — Shed Maintenance Manual',
      subtitle: 'B-Class 0-4-0ST Motion & Lubrication Specs',
      sections: [
        {
          heading: 'Section 3.2 — Running Gear, Motion & Lubrication',
          content: [
            'Valve gear type: Walschaerts external valve gear with inside admission piston valves.',
            'Eccentric crank pin fastening nut torque: 240 Nm (177 ft-lb).',
            'Connecting rod big-end brasses running clearance: 0.012 to 0.015 inches (0.30 to 0.38 mm); shim adjustment required if exceeding 0.025 inches.',
            'Crosshead slipper guide clearance: 0.010 inch nominal clearance; discard shims if clearance exceeds 0.028 inches.',
            'Steam cylinder lubrication: Mechanical displacement syphon lubricator reservoir filled with steam cylinder oil ISO VG 460.',
            'Cylinder lubricator feed rate: 4 to 6 drops per minute per cylinder under steam.',
            'Reversing screw shaft: Pack with Grade 2 Calcium Graphite Grease every 48 operating shed hours.'
          ]
        },
        {
          heading: 'Section 4.1 — Injectors & Boiler Feed Systems',
          content: [
            'Injectors: Two Gresham & Craven No. 5 self-acting combination live-steam injectors installed on cab spectacle plate.',
            'Minimum injector delivery pressure: 145 psi with boiler working pressure at 135 psi.',
            'Feed delivery pipe union nut torque: Tighten to 110 Nm (81 ft-lb). Inspect copper washer at every wash-out.',
            'Boiler check / clack valve lift limit: Maximum allowable lift of the internal bronze clack valve disc is 5/16 inch (7.9 mm). If lift exceeds 3/8 inch due to seat reaming, replace the disc.'
          ]
        }
      ]
    }
  ];

  for (let i = 0; i < pagesData.length; i++) {
    const pageData = pagesData[i];
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait in points
    const { width, height } = page.getSize();

    let y = height - 50;

    // Header border
    page.drawRectangle({
      x: 40,
      y: y - 10,
      width: width - 80,
      height: 48,
      color: rgb(0.93, 0.90, 0.84),
      borderColor: rgb(0.23, 0.21, 0.19),
      borderWidth: 1.5,
    });

    // Page title
    page.drawText(pageData.title, {
      x: 52,
      y: y + 20,
      size: 13,
      font: boldFont,
      color: rgb(0.23, 0.21, 0.19),
    });

    page.drawText(pageData.subtitle, {
      x: 52,
      y: y + 4,
      size: 10,
      font: font,
      color: rgb(0.40, 0.35, 0.30),
    });

    y -= 50;

    for (const section of pageData.sections) {
      y -= 15;
      // Section header banner
      page.drawRectangle({
        x: 40,
        y: y - 6,
        width: width - 80,
        height: 22,
        color: rgb(0.61, 0.48, 0.24), // Brass accent tone
      });

      page.drawText(section.heading, {
        x: 48,
        y: y,
        size: 11,
        font: boldFont,
        color: rgb(1, 1, 1),
      });

      y -= 26;

      for (const line of section.content) {
        // Bullet
        page.drawCircle({
          x: 48,
          y: y + 4,
          size: 2.5,
          color: rgb(0.23, 0.21, 0.19),
        });

        page.drawText(line, {
          x: 58,
          y: y,
          size: 9.5,
          font: font,
          maxWidth: width - 110,
          lineHeight: 13,
          color: rgb(0.15, 0.13, 0.12),
        });

        y -= 26;
      }
    }

    // Footer
    page.drawLine({
      start: { x: 40, y: 40 },
      end: { x: width - 40, y: 40 },
      thickness: 1,
      color: rgb(0.66, 0.60, 0.49),
    });

    page.drawText('Darjeeling Himalayan Railway • Tindharia Locomotive Works • Official Shed Copy', {
      x: 40,
      y: 26,
      size: 8,
      font: font,
      color: rgb(0.45, 0.40, 0.35),
    });

    page.drawText(`Page ${i + 1} of ${pagesData.length}`, {
      x: width - 90,
      y: 26,
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

  const destPath = path.join(destDir, 'DHR_B_Class_Loco_Maintenance_Spec.pdf');
  fs.writeFileSync(destPath, Buffer.from(pdfBytes));
  console.log('Sample DHR manual PDF generated successfully at:', destPath);
}

generateSamplePdf().catch(console.error);
