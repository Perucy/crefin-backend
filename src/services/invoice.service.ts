/**
 * Invoice Service
 * Business logic for invoice tracking
 */

import { Prisma } from '@prisma/client';
import { db } from '../config/database';
import {
    CreateInvoiceRequest,
    CreateInvoiceResponse,
    GetInvoicesQuery,
    GetInvoicesResponse,
    UpdateInvoiceRequest,
    UpdateInvoiceResponse,
    MarkInvoiceAsPaidRequest,
    MarkInvoiceAsPaidResponse,
    Invoice,
    InvoiceWithClient,
    InvoiceWithDetails,
    InvoiceEmailTemplate,
    ClientStats
} from '../types/invoice.types';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import * as mlService from './ml.service';

// ============================================================================
// HELPER: SERIALIZE INVOICE (Convert Prisma.Decimal to number)
// ============================================================================
const serializeInvoice = (invoice: any): Invoice => {
    return {
        ...invoice,
        amount: invoice.amount instanceof Prisma.Decimal ? invoice.amount.toNumber() : invoice.amount,
        items: invoice.items,
    };
};

const serializeInvoiceWithClient = (invoice: any): InvoiceWithClient => {
    return {
        ...invoice,
        amount: invoice.amount instanceof Prisma.Decimal ? invoice.amount.toNumber() : invoice.amount,
        items: invoice.items,
    };
};

const serializeInvoiceWithDetails = (invoice: any): InvoiceWithDetails => {
    return {
        ...invoice,
        amount: invoice.amount instanceof Prisma.Decimal ? invoice.amount.toNumber() : invoice.amount,
        items: invoice.items,
    };
};

// ============================================================================
// HELPER: GENERATE INVOICE NUMBER
// ============================================================================

/**
 * Generates unique invoice number in format: INV-YYYY-001
 */
const generateInvoiceNumber = async (userId: string): Promise<string> => {
    const year = new Date().getFullYear();

    //get count of invoices for the year
    const count = await db.invoice.count({
        where: {
            userId,
            invoiceNumber: {
                startsWith: `INV-${year}-`
            }
        }
    });

    //generate seq number
    const sequence = String(count + 1).padStart(3, '0');
    return `INV-${year}-${sequence}`;
};

// ============================================================================
// CREATE INVOICE
// ============================================================================

export const createInvoice = async (
    userId: string,
    data: CreateInvoiceRequest
): Promise<CreateInvoiceResponse> => {
    try {
        // 1. Verify client exists
        const client = await db.client.findUnique({
            where: { id: data.clientId }
        });

        if (!client || client.userId !== userId) {
            throw new NotFoundError('Client not found');
        }

        // 2. Generate invoice number
        const invoiceNumber = await generateInvoiceNumber(userId);

        // 3. Create invoice 
        const invoice = await db.invoice.create({
            data: {
                userId,
                clientId: data.clientId,
                invoiceNumber,
                amount: data.amount,
                description: data.description,
                items: data.items ? (JSON.parse(JSON.stringify(data.items)) as Prisma.JsonArray) : undefined,
                dueDate: new Date(data.dueDate),
                notes: data.notes,
                terms: data.terms,
            }
        });

        // 4. Get client payment history for ML prediction
        const clientInvoices = await db.invoice.findMany({
            where: {
                clientId: data.clientId,
                status: 'paid',
                paidDate: { not: null },
            },
            select: {
                issueDate: true,
                paidDate: true,
            },
        });

        // 5. Calculate client stats and get ML prediction
        const stats = calculateClientStats(clientInvoices);

        // 6. Call ML API if client has payment history
        if (stats.totalInvoices > 0) {
            const prediction = await mlService.predictPaymentTime({
                client_avg_payment_days: stats.avgPaymentDays,
                client_late_payment_rate: stats.latePaymentRate,
                client_payment_std: stats.paymentStd,
                client_total_invoices: stats.totalInvoices,
                client_payment_trend: stats.paymentTrend,
                amount: data.amount,
                issue_date: new Date().toISOString(),
            });

            // 7. Store prediction if ML service returned data
            if (prediction) {
                await db.invoice.update({
                    where: { id: invoice.id },
                    data: {
                        predictedPaymentDays: prediction.predicted_payment_days,
                        predictionConfidence: prediction.confidence_score,
                        predictedPaymentDate: new Date(prediction.predicted_payment_date),
                    },
                });
                
                logger.info('ML prediction added to invoice', {
                    userId,
                    invoiceId: invoice.id,
                    predictedDays: prediction.predicted_payment_days,
                    confidence: prediction.confidence_score,
                });
            }
        }

        logger.info('Invoice created', {
            userId,
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.amount.toString()
        });
                
        return {
            invoice: serializeInvoice(invoice),
            message: 'Invoice created successfully'
        };
    } catch (error) {
        logger.error('Failed to create invoice', { userId, error });
        throw error;
    }
};

// ============================================================================
// GET INVOICES
// ============================================================================
export const getInvoices = async (
    userId: string,
    query: GetInvoicesQuery
): Promise<GetInvoicesResponse> => {
    try {
        //buid where clause
        const where: any = { userId };

        //check status filter
        if (query.status) {
            where.status = query.status;
        }

        //check clientId filter
        if (query.clientId) {
            where.clientId = query.clientId;
        }

        //date range filter
        if (query.startDate || query.endDate) {
            where.issueDate = {};
            if (query.startDate) {
                where.issueDate.gte = new Date(query.startDate);
            }
            if (query.endDate) {
                where.issueDate.lte = new Date(query.endDate);
            }
        }

        //total count
        const total = await db.invoice.count({ where });

        //fetch invoices
        const invoices = await db.invoice.findMany({
            where,
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        company: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: query.limit || 50,
            skip: query.offset || 0,            
        });

        // Calculate summary statistics
        const allInvoices = await db.invoice.findMany({
            where: { userId },
            select: {
                status: true,
                amount: true
            }
        });
    
        const summary = {
            totalDraft: allInvoices.filter(i => i.status === 'draft').length,
            totalSent: allInvoices.filter(i => i.status === 'sent').length,
            totalPaid: allInvoices.filter(i => i.status === 'paid').length,
            totalOverdue: allInvoices.filter(i => i.status === 'overdue').length,
            amountPending: allInvoices
                .filter(i => i.status === 'sent')
                .reduce((sum, i) => sum + Number(i.amount), 0),
            amountOverdue: allInvoices
                .filter(i => i.status === 'overdue')
                .reduce((sum, i) => sum + Number(i.amount), 0),
            amountPaid: allInvoices
                .filter(i => i.status === 'paid')
                .reduce((sum, i) => sum + Number(i.amount), 0),
        };
        
        logger.info('Invoices fetched', { userId, total, count: invoices.length });
        
        return {
            invoices: invoices.map(serializeInvoiceWithClient),
            total,
            summary
        };
    } catch (error) {
        logger.error('Failed to get invoices', { userId, error });
        throw error;
    }
};

// ============================================================================
// GET SINGLE INVOICE
// ============================================================================
export const getInvoiceById = async (
    userId: string,
    invoiceId: string
): Promise<InvoiceWithDetails> => {
    try {
        const invoice = await db.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        company: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                incomeLog: {
                    select: {
                        id: true,
                        amount: true,
                        loggedAt: true
                    }
                }
            }
        });

        if (!invoice) {
            throw new NotFoundError('Invoice not found');
        }
        
        if (invoice.userId != userId) {
            throw new NotFoundError('Invoice not found');
        }

        logger.info('Invoice fetched by ID', { userId, invoiceId });

        return serializeInvoiceWithDetails(invoice);
    } catch (error) {
        logger.error('Failed to get invoice by ID', { userId, invoiceId, error });
        throw error;
    }
};

// ============================================================================
// UPDATE INVOICE
// ============================================================================
export const updateInvoice = async (
    userId: string,
    invoiceId: string,
    data: UpdateInvoiceRequest
): Promise<UpdateInvoiceResponse> => {
    try {
        //veriify invoice
        const existingInvoice = await db.invoice.findUnique({
            where: { id: invoiceId }
        });

        if (!existingInvoice || existingInvoice.userId !== userId) {
            throw new NotFoundError('Invoice not found');
        }

        //can't update paid invoices
        if (existingInvoice.status === 'paid' && data.status !== 'paid') {
            throw new Error('Cannot update a paid invoice');
        }

        //update invoice
        const invoice = await db.invoice.update({
            where: { id: invoiceId },
            data: {
                amount: data.amount,
                description: data.description,
                items: data.items ? (JSON.parse(JSON.stringify(data.items)) as Prisma.JsonArray) : undefined,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                notes: data.notes,
                terms: data.terms,
                status: data.status,
            }
        });
         
        logger.info('Invoice updated', { userId, invoiceId });
    
        return {
            invoice: serializeInvoice(invoice),
            message: 'Invoice updated successfully'
        };
    } catch (error) {
        logger.error('Failed to update invoice', { userId, invoiceId, error });
        throw error;
    }
};

// ============================================================================
// MARK INVOICE AS PAID (AUTO-CREATE INCOME)
// ============================================================================
export const markInvoiceAsPaid = async (
    userId: string,
    invoiceId: string,
    data: MarkInvoiceAsPaidRequest
): Promise<MarkInvoiceAsPaidResponse> => {
    try {
        //get invoice with client info
        const invoice = await db.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                client: true
            }
        });

        if (!invoice || invoice.userId !== userId) {
            throw new NotFoundError('Invoice not found');
        }

        if (invoice.status === 'paid') {
            throw new Error('Invoice is already marked as paid');
        }

        const paidDate = new Date(data.paidDate);

        // use transaction to ensure both operations succeed or fail together
        const result = await db.$transaction(async (tx) => {
            //create income log
            const income = await tx.incomeLog.create({
                data: {
                    userId,
                    amount: invoice.amount,
                    clientId: invoice.clientId,
                    clientName: invoice.client.name,
                    projectName: invoice.description,
                    source: 'invoice',
                    notes: data.notes || `Payment for invoice ${invoice.invoiceNumber}`,
                    loggedAt: paidDate,
                }
            });

            //update invoice
            const updatedInvoice = await tx.invoice.update({
                where: { id: invoiceId },
                data: {
                    status: 'paid',
                    paidDate,
                    incomeLogId: income.id,
                }
            });

            return { income, invoice: updatedInvoice };
        });

        logger.info('Invoice marked as paid and income created', {
            userId,
            invoiceId,
            incomeId: result.income.id,
            amount: result.income.amount.toString()
        });

        return {
            invoice: serializeInvoice(result.invoice),
            income: {
                id: result.income.id,
                amount: result.income.amount instanceof Prisma.Decimal ? result.income.amount.toNumber() : Number(result.income.amount),
                loggedAt: result.income.loggedAt
            },
            message: 'Invoice marked as paid and income logged successfully'
        };
    } catch (error) {
        logger.error('Failed to mark invoice as paid', { userId, invoiceId, error });
        throw error;
    }
};

// ============================================================================
// DELETE INVOICE
// ============================================================================

export const deleteInvoice = async (
    userId: string,
    invoiceId: string
): Promise<{ message: string }> => {
    try {
        // Verify ownership
        const invoice = await db.invoice.findUnique({
            where: { id: invoiceId }
        });
        
        if (!invoice || invoice.userId !== userId) {
            throw new NotFoundError('Invoice not found');
        }
        
        // Can't delete paid invoices
        if (invoice.status === 'paid') {
            throw new Error('Cannot delete paid invoice');
        }
        
        // Delete invoice
        await db.invoice.delete({
            where: { id: invoiceId }
        });
        
        logger.info('Invoice deleted', { userId, invoiceId });
        
        return {
            message: 'Invoice deleted successfully'
        };
    } catch (error) {
        logger.error('Failed to delete invoice', { userId, invoiceId, error });
        throw error;
    }
};

// ============================================================================
// GET EMAIL TEMPLATE
// ============================================================================

export const getInvoiceEmailTemplate = async (
  userId: string,
  invoiceId: string
): Promise<InvoiceEmailTemplate> => {
    try {
        const invoice = await db.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                client: true,
                user: true
            }
        });
        
        if (!invoice || invoice.userId !== userId) {
            throw new NotFoundError('Invoice not found');
        }
        
        // Format dates
        const formatDate = (date: Date) => {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };
        
        // Clean email body - NO attachment reminders!
        const body = `Hi ${invoice.client.name},

            I hope this email finds you well!

            Please find attached invoice ${invoice.invoiceNumber} for the work completed.

            Invoice Details:
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            Project:        ${invoice.description}
            Amount:         $${Number(invoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            Invoice Date:   ${formatDate(invoice.issueDate)}
            Due Date:       ${formatDate(invoice.dueDate)}
            Payment Terms:  ${invoice.terms || 'Net 30'}
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

            Payment Options:
            - Bank Transfer: [Your bank details]
            - PayPal: ${invoice.user.email}${invoice.user.phone ? `\n• Phone: ${invoice.user.phone}` : ''}

            If you have any questions, feel free to reach out.

            Thank you for your business!

            Best regards,
            ${invoice.user.name}
            ${invoice.user.email}`;
        
        return {
            to: invoice.client.email || '',
            subject: `Invoice ${invoice.invoiceNumber} from ${invoice.user.name}`,
            body,
            
            // Metadata for frontend to use
            pdfFilename: `Invoice-${invoice.invoiceNumber}.pdf`,
            pdfUrl: `/api/invoices/${invoiceId}/download`,
            
            // Instructions for frontend (not shown in email)
            instructions: {
                step1: 'Download PDF automatically',
                step2: 'Open email client with pre-filled template',
                step3: 'Attach PDF from Downloads folder',
                step4: 'Review and send email'
            }
        };
        
    } catch (error) {
        logger.error('Failed to generate email template', { 
            action: 'get_invoice_email_template',
            userId, 
            invoiceId, 
            error 
        });
        throw error;
    }
};

// ============================================================================
// HELPER: Calculate Client Payment Statistics
// ============================================================================

const calculateClientStats = (
    invoices: { issueDate: Date; paidDate: Date | null }[]
): ClientStats => {
  // Return zeros if no payment history
    if (invoices.length === 0) {
        return {
            avgPaymentDays: 0,
            latePaymentRate: 0,
            paymentStd: 0,
            totalInvoices: 0,
            paymentTrend: 0,
        };
    }

    // Calculate payment days for each invoice
    const paymentDays = invoices
        .filter((inv) => inv.paidDate !== null)
        .map((inv) => {
            const days = Math.floor(
                (new Date(inv.paidDate!).getTime() - new Date(inv.issueDate).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return days;
        });

    if (paymentDays.length === 0) {
        return {
            avgPaymentDays: 0,
            latePaymentRate: 0,
            paymentStd: 0,
            totalInvoices: 0,
            paymentTrend: 0,
            };
    }

    // Calculate average payment days
    const avgPaymentDays = 
        paymentDays.reduce((sum, days) => sum + days, 0) / paymentDays.length;

    // Calculate late payment rate (assuming 30 days is the due date)
    const lateCount = paymentDays.filter((days) => days > 30).length;
    const latePaymentRate = lateCount / paymentDays.length;

    // Calculate standard deviation
    const variance =
        paymentDays.reduce((sum, days) => sum + Math.pow(days - avgPaymentDays, 2), 0) /
        paymentDays.length;
    const paymentStd = Math.sqrt(variance);

    // Calculate payment trend (recent vs historical average)
    const recentCount = Math.min(5, paymentDays.length);
    const recentDays = paymentDays.slice(-recentCount);
    const recentAvg = recentDays.reduce((sum, days) => sum + days, 0) / recentCount;
    const paymentTrend = avgPaymentDays - recentAvg; // Positive = improving

    return {
        avgPaymentDays,
        latePaymentRate,
        paymentStd,
        totalInvoices: paymentDays.length,
        paymentTrend,
    };
};