/**
 * Client Service
 * Business logic for client management
 */

import { db } from '../config/database';
import {
    CreateClientRequest,
    CreateClientResponse,
    GetClientsQuery,
    GetClientsResponse,
    ClientData,
    ClientWithStats,
    GetClientStatsResponse,
    UpdateClientRequest,
    UpdateClientResponse,
    DeleteClientResponse,
} from '../types/client.types';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

// ============================================================================
// CREATE CLIENT
// ============================================================================
export const createClient = async (    
    userId: string,
    data: CreateClientRequest
): Promise<CreateClientResponse> => {
    try {
        const client = await db.client.create({
            data: {
                userId,
                name: data.name,
                email: data.email ?? null,
                phone: data.phone ?? null,
                company: data.company ?? null,
                notes: data.notes ?? null,
            },
        });

        logger.info('Client created', { userId, clientId: client.id, name: client.name });

        return {
            client,
            message: 'Client created successfully',
        };
    } catch (error) {
        logger.error('Failed to create client', { error, userId });
        throw error;
    }
};

// ============================================================================
// GET ALL CLIENTS
// ============================================================================
export const getClients = async (
    userId: string,
    query: GetClientsQuery
): Promise<GetClientsResponse> => {
    try {
        // Build WHERE clause for filtering
        const where: any = { userId };

        // Add search filter if provided
        // OR condition: search in name OR email OR company
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },      // Case-insensitive search
                { email: { contains: query.search, mode: 'insensitive' } },
                { company: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        // Get total count 
        const total = await db.client.count({ where });

        // Fetch clients with pagination
        const clients = await db.client.findMany({
            where,
            orderBy: { createdAt: 'desc' },              // Newest first
            take: query.limit || 50,                      // Default 50 results
            skip: query.offset || 0,                      // Default start at 0
        });

        logger.info('Clients fetched', { userId, total, count: clients.length });

        return {
            clients,
            total,
        };
    } catch (error) {
        logger.error('Failed to fetch clients', { userId, error });
        throw error;
    }
};

// ============================================================================
// GET CLIENT BY ID WITH STATS
// ============================================================================
export const getClientById = async (
    userId: string,
    clientId: string
): Promise<GetClientStatsResponse> => {
    try {
        // Fetch client
        const client = await db.client.findUnique({
            where: { id: clientId },
        });

        // Check if exists
        if (!client) {
            throw new NotFoundError('Client not found');
        }

        // Check ownership (prevent users from accessing others' clients)
        if (client.userId !== userId) {
            throw new NotFoundError('Client not found');
        }

        // Fetch all income logs for this client
        // IMPORTANT: Links client to income through clientName field
        const incomeLogs = await db.incomeLog.findMany({
            where: {
                userId,
                clientName: client.name,                    // Match by name (we'll improve this later)
            },
            orderBy: { loggedAt: 'desc' },
        });

        // Calculate statistics
        const totalIncome = incomeLogs.reduce(
            (sum, log) => sum + Number(log.amount),       // Convert Decimal to number
            0
        );

        const totalProjects = incomeLogs.length;

        const averageProjectValue = totalProjects > 0 
            ? totalIncome / totalProjects 
            : 0;

        const lastPaymentDate = incomeLogs.length > 0 
            ? incomeLogs[0].loggedAt                      // Already sorted desc, so first = latest
            : null;

        // Combine client data with stats
        const clientWithStats: ClientWithStats = {
            ...client,                                     // Spread operator: copies all fields
            totalIncome,
            totalProjects,
            averageProjectValue,
            lastPaymentDate,
        };

        logger.info('Client fetched with stats', { userId, clientId });

        return {
            client: clientWithStats,
        };
    } catch (error) {
        logger.error('Failed to fetch client', { userId, clientId, error });
        throw error;
    }
};

// ============================================================================
// UPDATE CLIENT
// ============================================================================
export const updateClient = async (
    userId: string,
    clientId: string,
    data: UpdateClientRequest
): Promise<UpdateClientResponse> => {
    try {
        // Verify client exists and user owns it
        const existingClient = await db.client.findUnique({
            where: { id: clientId },
        });

        if (!existingClient) {
            throw new NotFoundError('Client not found');
        }

        if (existingClient.userId !== userId) {
            throw new NotFoundError('Client not found');
        }

        // Update client (only provided fields)
        const updatedClient = await db.client.update({
            where: { id: clientId },
            data: {
                name: data.name ?? existingClient.name,              // Keep old if not provided
                email: data.email !== undefined ? data.email : existingClient.email,
                phone: data.phone !== undefined ? data.phone : existingClient.phone,
                company: data.company !== undefined ? data.company : existingClient.company,
                address: data.address !== undefined ? data.address : existingClient.address,
                notes: data.notes !== undefined ? data.notes : existingClient.notes,
            },
        });

        logger.info('Client updated', { userId, clientId });

        return {
            client: updatedClient,
            message: 'Client updated successfully',
        };
    } catch (error) {
        logger.error('Failed to update client', { userId, clientId, error });
        throw error;
    }
};

// ============================================================================
// DELETE CLIENT
// ============================================================================
export const deleteClient = async (
    userId: string,
    clientId: string
): Promise<DeleteClientResponse> => {
    try {
        // Verify client exists and user owns it
        const client = await db.client.findUnique({
            where: { id: clientId },
        });

        if (!client) {
            throw new NotFoundError('Client not found');
        }

        if (client.userId !== userId) {
            throw new NotFoundError('Client not found');
        }

        // Delete client
        await db.client.delete({
            where: { id: clientId },
        });

        logger.info('Client deleted', { userId, clientId });

        return {
            message: 'Client deleted successfully',
        };
    } catch (error) {
        logger.error('Failed to delete client', { userId, clientId, error });
        throw error;
    }
};