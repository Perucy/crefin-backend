/**
 * Invoice Types
 * Defines data structures for invoice tracking
 */

import { Decimal } from "@prisma/client/runtime/library";

// ============================================================================
// INVOICE STATUSES
// ============================================================================

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

// ============================================================================
// LINE ITEM
// ============================================================================

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;  // quantity * rate
}

// ============================================================================
// CREATE INVOICE
// ============================================================================

export interface CreateInvoiceRequest {
  clientId: string;
  amount: number;
  description: string;
  items?: InvoiceLineItem[];
  dueDate: string | Date;
  notes?: string;
  terms?: string;
}

export interface CreateInvoiceResponse {
  invoice: Invoice;
  message: string;
}

// ============================================================================
// INVOICE DATA
// ============================================================================

export interface Invoice {
  id: string;
  userId: string;
  clientId: string;
  invoiceNumber: string;
  amount: number;
  description: string;
  items: InvoiceLineItem[] | null;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  paidDate: Date | null;
  incomeLogId: string | null;
  notes: string | null;
  terms: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// INVOICE WITH RELATIONS
// ============================================================================

export interface InvoiceWithClient extends Invoice {
  client: {
    id: string;
    name: string;
    email: string | null;
    company: string | null;
  };
}

export interface InvoiceWithDetails extends InvoiceWithClient {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  incomeLog?: {
    id: string;
    amount: number;
    loggedAt: Date;
  } | null;
}

// ============================================================================
// GET INVOICES
// ============================================================================

export interface GetInvoicesQuery {
  status?: InvoiceStatus;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface GetInvoicesResponse {
  invoices: InvoiceWithClient[];
  total: number;
  summary: {
    totalDraft: number;
    totalSent: number;
    totalPaid: number;
    totalOverdue: number;
    amountPending: number;
    amountOverdue: number;
    amountPaid: number;
  };
}

// ============================================================================
// UPDATE INVOICE
// ============================================================================

export interface UpdateInvoiceRequest {
  amount?: number;
  description?: string;
  items?: InvoiceLineItem[];
  dueDate?: string | Date;
  notes?: string;
  terms?: string;
  status?: InvoiceStatus;
}

export interface UpdateInvoiceResponse {
  invoice: Invoice;
  message: string;
}

// ============================================================================
// MARK INVOICE AS PAID
// ============================================================================

export interface MarkInvoiceAsPaidRequest {
  paidDate: string | Date;
  notes?: string;
}

export interface MarkInvoiceAsPaidResponse {
  invoice: Invoice;
  income: {
    id: string;
    amount: number;
    loggedAt: Date;
  };
  message: string;
}

// ============================================================================
// EMAIL TEMPLATE
// ============================================================================

export interface InvoiceEmailTemplate {
  to: string;
  subject: string;
  body: string;
  pdfFilename: string;
}

// ============================================================================
// INVOICE SUMMARY
// ============================================================================

export interface InvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  invoicesByStatus: {
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
    cancelled: number;
  };
}