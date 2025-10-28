/**
 * Invoice Controller
 * HTTP request handlers for invoice endpoints
 */

import { Request, Response, NextFunction } from 'express';
import * as invoiceService from '../services/invoice.service';
import { sendSuccess } from '../utils/response';

// ============================================================================
// CREATE INVOICE
// ============================================================================

export const createInvoice = async (
    req: Request, 
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }
        const result = await invoiceService.createInvoice(userId, req.body);
        
        return sendSuccess(res, result, result.message);
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// GET ALL INVOICES
// ============================================================================

export const getInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }
        const result = await invoiceService.getInvoices(userId, req.query);
        
        return sendSuccess(res, result);
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// GET SINGLE INVOICE
// ============================================================================

export const getInvoiceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        
        if (!userId) {
            return next(new Error('User not authenticated'));
        }
        const invoice = await invoiceService.getInvoiceById(userId, id);
        
        return sendSuccess(res, { invoice });
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// UPDATE INVOICE
// ============================================================================

export const updateInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        
        if (!userId) {
            return next(new Error('User not authenticated'));
        }
        const result = await invoiceService.updateInvoice(userId, id, req.body);
        
        return sendSuccess(res, result, result.message);
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// MARK INVOICE AS PAID
// ============================================================================

export const markInvoiceAsPaid = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }
        
        const result = await invoiceService.markInvoiceAsPaid(userId, id, req.body);
        
        return sendSuccess(res, result, result.message);
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// DELETE INVOICE
// ============================================================================

export const deleteInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        
        if (!userId) {
            return next(new Error('User not authenticated'));
        }

        const result = await invoiceService.deleteInvoice(userId, id);
        
        return sendSuccess(res, result, 'Invoice deleted successfully');
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// GET EMAIL TEMPLATE
// ============================================================================

export const getInvoiceEmailTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId) {
            return next(new Error('User not authenticated'));
        }
        const template = await invoiceService.getInvoiceEmailTemplate(userId, id);
        
        return sendSuccess(res, { template });
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// DOWNLOAD INVOICE PDF
// ============================================================================

export const downloadInvoicePDF = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        if (!userId) {
            return next(new Error('User not authenticated'));
        }
        
        // Get invoice details
        const invoice = await invoiceService.getInvoiceById(userId, id);
        
        // TODO: Generate PDF (we'll implement this next)
        // For now, return a placeholder response
        return res.status(501).json({
            success: false,
            message: 'PDF generation not yet implemented',
            invoice: {
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber
            }
        });
    } catch (error) {
        next(error);
    }
};