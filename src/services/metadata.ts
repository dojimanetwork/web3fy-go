import { pool } from '../config/database';

export interface Metadata {
    id?: number;
    type: string;
    category: string;
    url: string;
    description?: string | undefined;
    created_at?: Date;
    updated_at?: Date;
}

export class MetadataService {
    async getMetadata(type: string, category?: string): Promise<Metadata[]> {
        const client = await pool.connect();
        try {
            let query = 'SELECT * FROM metadata WHERE type = $1';
            const params: any[] = [type];

            if (category && category !== 'all') {
                query += ' AND category = $2';
                params.push(category);
            }

            query += ' ORDER BY category ASC';
            const result = await client.query(query, params);
            return result.rows;
        } finally {
            client.release();
        }
    }

    async upsertMetadata(metadata: Metadata): Promise<Metadata> {
        const client = await pool.connect();
        try {
            const query = `
                INSERT INTO metadata (type, category, url, description)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (type, category) 
                DO UPDATE SET 
                    url = EXCLUDED.url,
                    description = EXCLUDED.description,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *
            `;
            const result = await client.query(query, [
                metadata.type,
                metadata.category,
                metadata.url,
                metadata.description
            ]);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    async deleteMetadata(type: string, category: string): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query(
                'DELETE FROM metadata WHERE type = $1 AND category = $2',
                [type, category]
            );
        } finally {
            client.release();
        }
    }
} 