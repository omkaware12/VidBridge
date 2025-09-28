const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

const generateReceiptPDF = (paymentData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: "A4", 
        margin: 60,
        bufferPages: true 
      });
      let buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const pageWidth = doc.page.width;
      const margin = 60;
      const contentWidth = pageWidth - (margin * 2);

      // HEADER SECTION WITH GEOMETRIC DESIGN
      // Create diagonal background similar to the receipt
      doc.save();
      doc.polygon([0, 0], [pageWidth, 0], [pageWidth, 120], [0, 180])
         .fillColor("#4a5568")
         .fill();
      
      doc.polygon([pageWidth * 0.6, 0], [pageWidth, 0], [pageWidth, 80])
         .fillColor("#718096")
         .fill();
      doc.restore();

      // MAIN TITLE
      doc.fontSize(24)
         .fillColor("#ffffff")
         .font("Helvetica-Bold")
         .text("Receipt from Vidbridge sandbox", margin, 60, {
           width: contentWidth,
           align: "left"
         });

      // RECEIPT NUMBER
      doc.fontSize(14)
         .fillColor("#a0aec0")
         .font("Helvetica")
         .text(`Receipt #${paymentData.receiptNumber || generateReceiptNumber()}`, margin, 95);

      // PAYMENT INFO SECTION
      const paymentInfoY = 160;
      
      // Amount section
      doc.fontSize(12)
         .fillColor("#718096")
         .font("Helvetica")
         .text("AMOUNT PAID", margin, paymentInfoY);
      
      doc.fontSize(16)
         .fillColor("#2d3748")
         .font("Helvetica-Bold")
         .text(`$${(paymentData.amount / 100).toFixed(2)}`, margin, paymentInfoY + 20);

      // Date section
      const dateX = margin + 150;
      doc.fontSize(12)
         .fillColor("#718096")
         .font("Helvetica")
         .text("DATE PAID", dateX, paymentInfoY);
      
      const paymentDate = new Date(paymentData.createdAt || Date.now());
      const formattedDate = paymentDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) + ', ' + paymentDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      doc.fontSize(16)
         .fillColor("#2d3748")
         .font("Helvetica-Bold")
         .text(formattedDate, dateX, paymentInfoY + 20);

      // Payment method section
      const methodX = pageWidth - margin - 120;
      doc.fontSize(12)
         .fillColor("#718096")
         .font("Helvetica")
         .text("PAYMENT METHOD", methodX, paymentInfoY);
      
      const paymentMethod = paymentData.paymentMethod || "VISA";
      const lastFour = paymentData.lastFour || "4242";
      
      doc.fontSize(16)
         .fillColor("#2d3748")
         .font("Helvetica-Bold")
         .text(`${paymentMethod} - ${lastFour}`, methodX, paymentInfoY + 20);

      // SUMMARY SECTION
      const summaryY = paymentInfoY + 80;
      doc.fontSize(14)
         .fillColor("#4a5568")
         .font("Helvetica-Bold")
         .text("SUMMARY", margin, summaryY);

      // Add separator line
      doc.strokeColor("#e2e8f0")
         .lineWidth(1)
         .moveTo(margin, summaryY + 25)
         .lineTo(pageWidth - margin, summaryY + 25)
         .stroke();

      // Item details
      const itemY = summaryY + 45;
      const planName = paymentData.plan || "DesignAli Starter Plan";
      
      doc.fontSize(14)
         .fillColor("#2d3748")
         .font("Helvetica")
         .text(`${planName} × 1`, margin, itemY);
      
      doc.fontSize(14)
         .fillColor("#2d3748")
         .font("Helvetica")
         .text(`$${(paymentData.amount / 100).toFixed(2)}`, pageWidth - margin - 60, itemY, {
           width: 60,
           align: "right"
         });

      // Amount paid section
      const totalY = itemY + 40;
      
      // Add separator line before total
      doc.strokeColor("#e2e8f0")
         .lineWidth(1)
         .moveTo(margin, totalY - 10)
         .lineTo(pageWidth - margin, totalY - 10)
         .stroke();

      doc.fontSize(16)
         .fillColor("#2d3748")
         .font("Helvetica-Bold")
         .text("Amount paid", margin, totalY);
      
      doc.fontSize(16)
         .fillColor("#2d3748")
         .font("Helvetica-Bold")
         .text(`$${(paymentData.amount / 100).toFixed(2)}`, pageWidth - margin - 60, totalY, {
           width: 60,
           align: "right"
         });

      // Currency conversion note (if applicable)
      if (paymentData.originalCurrency && paymentData.originalCurrency !== 'USD') {
        const conversionY = totalY + 25;
        const conversionText = `Charged ${paymentData.originalAmount || '₹1,650.74'} using 1 USD = ${paymentData.exchangeRate || '91.7078'} ${paymentData.originalCurrency || 'INR'} (includes 4% conversion fee)`;
        
        doc.fontSize(10)
           .fillColor("#718096")
           .font("Helvetica")
           .text(conversionText, margin, conversionY, {
             width: contentWidth
           });
      }

      // FOOTER SECTION
      const footerY = doc.y + 60;
      
      // Contact information
      doc.fontSize(12)
         .fillColor("#4a5568")
         .font("Helvetica")
         .text("If you have any questions, contact us at ", margin, footerY);
      
      // Email link styling
      doc.fillColor("#3182ce")
         .text("vidbridge007@gmail.com", doc.x, footerY, {
           link: "mailto:vidbridge007@gmail.com",
           underline: false
         });
      
      doc.fillColor("#4a5568")
         .text(".", doc.x, footerY);

      // Additional footer text
      const additionalFooterY = footerY + 40;
      doc.fontSize(10)
         .fillColor("#718096")
         .font("Helvetica")
         .text("Something wrong with the email? ", margin, additionalFooterY);
      
      doc.fillColor("#3182ce")
         .text("View it in your browser", doc.x, additionalFooterY, {
           link: "#",
           underline: true
         });
      
      doc.fillColor("#718096")
         .text(".", doc.x, additionalFooterY);

      // Partnership note
      const partnershipY = additionalFooterY + 20;
      doc.fontSize(10)
         .fillColor("#718096")
         .font("Helvetica")
         .text("You're receiving this email because you made a purchase at Vidbridge sandbox, which partners with ", margin, partnershipY, {
           width: contentWidth - 60
         });
      
      doc.fillColor("#3182ce")
         .text("Stripe", doc.x, partnershipY, {
           link: "https://stripe.com",
           underline: true
         });
      
      doc.fillColor("#718096")
         .text(" to provide invoicing and payment processing.", doc.x, partnershipY);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// Helper function to generate receipt number
const generateReceiptNumber = () => {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${timestamp}-${random}`;
};

module.exports = generateReceiptPDF;