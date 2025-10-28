/**
 * Invoice Service
 * Business logic for invoice tracking
 */

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
} from '../types/invoice.types';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

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
        const client = await db.client.findUnique({
            where: { id: data.clientId }
        });

        if (!client || client.userId !== userId) {
            throw new NotFoundError('Client not found');
        }

        //generate invoice number
        const invoiceNumber = await generateInvoiceNumber(userId);

        //create invoice 
        const invoice = await db.invoice.create({
            data: {
                userId,
                clientId: data.clientId,
                invoiceNumber,
                amount: data.amount,
                description: data.description,
                items: data.items || null,
                dueDate: new Date(data.dueDate),
                notes: data.notes,
                terms: data.terms,
            }
        });

            logger.info('Invoice created', {
                userId,
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                amount: invoice.amount.toString()
            });
                
            return {
                invoice: invoice as Invoice,
                message: 'Invoice created successfully'
            };
    } catch (error) {
        logger.error('Failed to create invoice', { userId, error });
        throw error;
    }
};