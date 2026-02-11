// api/health
import { testConnection } from '@/lib/db.js'

export default async function handler(req, res) {
    try {
        const isDbConnection = await testConnection();
        
        if(isDbConnection){
            return res.status(200).json({
                success: true,
                message: 'healthy',
                note: 'A request a day keeps the error away',
                timestamp: new Date().toISOString()
            });
        } else {
            return res.status(500).json({
                success: false,
    
                message: 'Database Connection failed',
                note:'I think I can still salvage it',
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            note:'A commit a day brings bugs production way',
            timestamp: new Date().toISOString()
        });
    }
}