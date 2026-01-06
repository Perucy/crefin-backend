/**
 * Invoice Routes
 * Defines all invoice API endpoints
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validator';
import * as invoiceController from '../controllers/invoice.controller';
import { z } from 'zod';


const router = Router();
// ============================================================================
// LINE ITEM SCHEMA
// ============================================================================

export const lineItemSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().positive('Quantity must be positive'),
    rate: z.number().positive('Rate must be positive'),
    amount: z.number().positive('Amount must be positive'),
});

// ============================================================================
// CREATE INVOICE SCHEMA
// ============================================================================

export const createInvoiceSchema = z.object({
    clientId: z.string().uuid('Invalid client ID'),
    amount: z.number().positive('Amount must be positive'),
    description: z.string().min(1, 'Description is required'),
    items: z.array(lineItemSchema).optional(),
    dueDate: z.coerce.date(), 
    notes: z.string().optional(),
    terms: z.string().optional(),
});

// ============================================================================
// UPDATE INVOICE SCHEMA
// ============================================================================

export const updateInvoiceSchema = z.object({
    amount: z.number().positive('Amount must be positive').optional(),
    description: z.string().min(1, 'Description is required').optional(),
    items: z.array(lineItemSchema).optional(),
    dueDate: z.coerce.date().optional(), // ✅ FIXED
    notes: z.string().optional(),
    terms: z.string().optional(),
    status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
});

// ============================================================================
// GET INVOICES QUERY SCHEMA
// ============================================================================

export const getInvoicesQuerySchema = z.object({
    status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
    clientId: z.string().uuid('Invalid client ID').optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    offset: z.coerce.number().int().nonnegative().optional(),
});

// ============================================================================
// MARK AS PAID SCHEMA
// ============================================================================

export const markInvoiceAsPaidSchema = z.object({
    paidDate: z.coerce.date(), // ✅ FIXED
    notes: z.string().optional(),
});

// ============================================================================
// DELETE INVOICE SCHEMA
// ============================================================================

export const deleteInvoiceSchema = z.object({
    id: z.string().uuid('Invalid invoice ID'),
});

// ============================================================================
// INVOICE ENDPOINTS
// ============================================================================

/**
 * @route POST /api/v1/invoices
 * @desc Create a new invoice
 * @access Private
 */
router.post('/', authenticate, validate(createInvoiceSchema), invoiceController.createInvoice);

/**
 * @route GET /api/v1/invoices
 * @desc Get all invoices with optional filters
 * @access Private
 */
router.get('/', authenticate, validateQuery(getInvoicesQuerySchema), invoiceController.getInvoices);

/**
 * @route GET /api/v1/invoices/:id
 * @desc Get single invoice by ID
 * @access Private
 */
router.get('/:id', authenticate, invoiceController.getInvoiceById);

/**
 * @route PATCH /api/v1/invoices/:id
 * @desc Update invoice
 * @access Private
 */
router.patch('/:id', authenticate, validate(updateInvoiceSchema), invoiceController.updateInvoice);

/**
 * @route POST /api/v1/invoices/:id/mark-paid
 * @desc Mark invoice as paid (auto-creates income)
 * @access Private
 */
router.post('/:id/mark-paid', authenticate, validate(markInvoiceAsPaidSchema), invoiceController.markInvoiceAsPaid);

/**
 * @route DELETE /api/v1/invoices/:id
 * @desc Delete invoice
 * @access Private
 */
router.delete('/:id', authenticate, invoiceController.deleteInvoice);

/**
 * @route GET /api/v1/invoices/:id/email-template
 * @desc Get pre-filled email template for invoice
 * @access Private
 */
router.get('/:id/email-template', authenticate, invoiceController.getInvoiceEmailTemplate);

/**
 * @route GET /api/v1/invoices/:id/download
 * @desc Download invoice as PDF
 * @access Private
 */
router.get('/:id/download', authenticate, invoiceController.downloadInvoicePDF);

export default router;