export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    role: 'supervisor' | 'technician' | 'admin'
                    full_name: string | null
                    created_at: string
                    supervisor_id: string | null
                }
                Insert: {
                    id: string
                    email: string
                    role?: 'supervisor' | 'technician' | 'admin'
                    full_name?: string | null
                    created_at?: string
                    supervisor_id?: string | null
                }
                Update: {
                    id?: string
                    email?: string
                    role?: 'supervisor' | 'technician' | 'admin'
                    full_name?: string | null
                    created_at?: string
                    supervisor_id?: string | null
                }
            }
            epp_catalog: {
                Row: {
                    id: string
                    name: string
                    category: string
                    is_critical: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    category: string
                    is_critical?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    category?: string
                    is_critical?: boolean
                    created_at?: string
                }
            }
            // Add other tables as needed (inspections, inspection_items)
        }
    }
}
