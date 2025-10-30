/**
 * Invoice PDF Generator
 * Generates PDF invoices using PDFKit
 */
import PDFDocument from 'pdfkit';
import { InvoiceWithDetails, InvoiceLineItem } from '../types/invoice.types';

// ============================================================================
// HELPER: FORMAT CURRENCY
// ============================================================================

const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// ============================================================================
// HELPER: FORMAT DATE
// ============================================================================

const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// ============================================================================
// GENERATE INVOICE HEADER
// ============================================================================
const generateHeader = (doc: PDFKit.PDFDocument, invoice: InvoiceWithDetails) => {
    //company name/logo area top left
    doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(invoice.user.name, 50, 50);

    doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Email: ${invoice.user.email}`, 50, 75)
        .text(`Phone: ${invoice.user.phone}`, 50, 90);

    //invoice title and number(top right)
    doc
        .fontSize(20)
        .font('Helvetica-Bold')  // ← FIXED: Added missing dot
        .text('INVOICE', 400, 50, { align: 'right' });

    //horizontal line
    doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, 120)
        .lineTo(550, 120)
        .stroke();

};
// ============================================================================
// GENERATE CLIENT INFORMATION
// ============================================================================
export const generateClientInfo = (doc: PDFKit.PDFDocument, invoice: InvoiceWithDetails) => {
    const clientTop = 140;

    //billed to section
    doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('BILLED TO:', 50, clientTop);

    doc
        .fontSize(10)
        .font('Helvetica')
        .text(invoice.client.name, 50, clientTop + 15)
        .text(invoice.client.company || '', 50, clientTop + 30)
        .text(invoice.client.email || '', 50, clientTop + 45);

    //invoice details right side
    doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Invoice Date:', 350, clientTop)
        .text('Due Date:', 350, clientTop + 15)
        .text('Status:', 350, clientTop + 30);

    doc
        .font('Helvetica')
        .text(formatDate(invoice.issueDate), 450, clientTop)
        .text(formatDate(invoice.dueDate), 450, clientTop + 15)
        .text(invoice.status.toUpperCase(), 450, clientTop + 30);

    if (invoice.paidDate) {  // ← FIXED: Changed from invoice.invoiceNumber to invoice.paidDate
        doc
            .font('Helvetica-Bold')
            .text('Paid Date:', 350, clientTop + 45);
        doc
            .font('Helvetica')
            .text(formatDate(invoice.paidDate), 450, clientTop + 45);
    }

};

// ============================================================================
// GENERATE LINE ITEMS TABLE
// ============================================================================
export const generateTable = (doc: PDFKit.PDFDocument, invoice: InvoiceWithDetails) => {
    const tableTop = 250;
    const itemsTableTop = tableTop + 30;

    //table header
    doc
        .fontSize(10)  // ← FIXED: Added missing dot
        .font('Helvetica-Bold');

    //header background
    doc
        .rect(50, tableTop, 500, 20)
        .fillAndStroke('#f0f0f0', '#aaaaaa');

    //header text
    doc
        .fillColor('#000000')
        .text('Description', 60, tableTop + 5)
        .text('Qty', 320, tableTop + 5)
        .text('Rate', 380, tableTop + 5)
        .text('Amount', 480, tableTop + 5, { align: 'right' });

    //line items
    let position = itemsTableTop;

    if (invoice.items && Array.isArray(invoice.items)) {
        const items = invoice.items as InvoiceLineItem[];
        
        items.forEach((item, index) => {
            // Alternating row colors
            if (index % 2 === 0) {
                doc
                .rect(50, position - 5, 500, 20)
                .fill('#fafafa');
            }

            doc
                .fillColor('#000000')
                .fontSize(10)
                .text(item.description, 60, position)
                .text(item.quantity.toString(), 320, position)
                .text(formatCurrency(item.rate), 380, position)
                .text(formatCurrency(item.amount), 480, position, { align: 'right' });

            position += 25;
        });
    } else {
        // If no line items, show description as single item
        doc
            .fillColor('#000000')
            .fontSize(10)
            .text(invoice.description, 60, position)
            .text('1', 320, position)
            .text(formatCurrency(invoice.amount), 380, position)
            .text(formatCurrency(invoice.amount), 480, position, { align: 'right' });

        position += 25;
    }

    // Subtotal, Tax, Total section
    const summaryTop = position + 20;

    // Horizontal line before summary
    doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(350, summaryTop)
        .lineTo(550, summaryTop)
        .stroke();

    // Subtotal
    doc
        .fontSize(10)
        .font('Helvetica')
        .text('Subtotal:', 350, summaryTop + 10)
        .text(formatCurrency(invoice.amount), 480, summaryTop + 10, { align: 'right' });

    // Total (bold)
    doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Total:', 350, summaryTop + 35)
        .text(formatCurrency(invoice.amount), 480, summaryTop + 35, { align: 'right' });

    return summaryTop + 70;
};

// ============================================================================
// GENERATE PAYMENT TERMS
// ============================================================================

const generateFooter = (doc: PDFKit.PDFDocument, invoice: InvoiceWithDetails, currentY: number) => {
    const footerTop = currentY + 30;

    // Payment Terms
    if (invoice.terms) {
        doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('Payment Terms:', 50, footerTop);

        doc
            .font('Helvetica')
            .text(invoice.terms, 50, footerTop + 15, {
                width: 500,
                align: 'left'
            });
    }

    // Notes
    if (invoice.notes) {
        doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('Notes:', 50, footerTop + 50);

        doc
            .font('Helvetica')
            .text(invoice.notes, 50, footerTop + 65, {
                width: 500,
                align: 'left'
            });
    }

    // Thank you message at bottom
    doc
        .fontSize(10)
        .font('Helvetica-Oblique')
        .text(
            'Thank you for your business!',
            50,
            700,
            { align: 'center', width: 500 }
        );

    // Footer line
    doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, 720)
        .lineTo(550, 720)
        .stroke();

    // Contact info in footer
    doc
        .fontSize(8)
        .font('Helvetica')
        .text(
            `${invoice.user.email} | ${invoice.user.phone || ''}`,
            50,
            730,
            { align: 'center', width: 500 }
        );
};
// ============================================================================
// MAIN: GENERATE INVOICE PDF
// ============================================================================

/**
 * Generate invoice PDF and return as buffer
 * @param invoice - Invoice with full details
 * @returns Promise<Buffer> - PDF as buffer
 */
export const generateInvoicePDF = (invoice: InvoiceWithDetails): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        try {
            //generate pdf document
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: `Invoice ${invoice.invoiceNumber}`,
                    Author: invoice.user.name,
                    Subject: `Invoice for ${invoice.client.name}`,  // ← FIXED: typo "fpr" → "for"
                    Creator: 'Crefin',
                    Producer: 'Crefin Invoice System'
                }
            });

            //buffer to store pdf
            const chunks: Buffer[] = [];

            //collect data chunks 
            doc.on('data', (chunk) => chunks.push(chunk));

            doc.on('end', () => {
                //combine all chunks into a complete buffer
                const result = Buffer.concat(chunks);
                resolve(result); //make the complete pdf as a buffer available to the caller
            });

            //handle errors
            doc.on('error', (err) => {
                reject(err);
            });

            //generate the pdf content
            generateHeader(doc, invoice);
            generateClientInfo(doc, invoice);
            const summaryY = generateTable(doc, invoice);
            generateFooter(doc, invoice, summaryY);

            //finalize PDF
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};