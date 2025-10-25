/**
 * Client types
 * defines data structures for client management
 * 
 */

// ============================================================================
// CREATE CLIENT
// ============================================================================
export interface CreateClientRequest {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    notes?: string;
}
export interface CreateClientResponse {
    client: ClientData;
    message: string;
}

// ============================================================================
// CLIENT DATA STRUCTURE
// ============================================================================
export interface ClientData {
    id: string;
    userId: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    address: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================================================
// GET ALL CLIENTS (WITH FILTERING)
// ============================================================================
export interface GetClientsQuery {
    search?: string;            // search by name, email, company
    limit?: number;
    offset?: number;            //skip this many results
}
export interface GetClientsResponse {
    clients: ClientData[];
    total: number;
}

// ============================================================================
// GET SINGLE CLIENT WITH STATS
// ============================================================================
export interface ClientWithStats extends ClientData {
    totalIncome: number;
    totalProjects: number;
    averageProjectValue: number;
    lastPaymentDate: Date | null;
}
export interface GetClientStatsResponse {
    client: ClientWithStats;
}

// ============================================================================
// UPDATE CLIENT
// ============================================================================
export interface UpdateClientRequest {
    name? : string;
    email? : string;
    phone? : string;
    company? : string;
    address? : string;
    notes? : string;
}
export interface UpdateClientResponse {
    client: ClientData;
    message: string;
}

// ============================================================================
// DELETE CLIENT
// ============================================================================
export interface DeleteClientResponse {
    message: string;
}