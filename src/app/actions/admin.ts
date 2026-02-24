"use server"

import { createAdminClient } from "@/lib/supabase/admin-client"
import { createClient } from "@/lib/supabase/server"

export async function resetUserPassword(userId: string, newPassword: string) {
    try {
        const supabase = await createClient()

        // 1. Verify current user is Admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: "No autorizado" }

        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return { success: false, error: "Prohibido: Solo los administradores pueden hacer esto" }
        }

        // 2. Perform Admin Update
        const adminClient = createAdminClient()
        const { error } = await adminClient.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        )

        if (error) return { success: false, error: error.message }

        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message || "Error interno del servidor" }
    }
}
