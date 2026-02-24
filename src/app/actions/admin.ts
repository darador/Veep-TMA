"use server"

import { createAdminClient } from "@/lib/supabase/admin-client"
import { createClient } from "@/lib/supabase/server"

// Security check function
async function requireAdmin() {
    const supabase = await createClient()

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

    return { success: true, supabase }
}

export async function resetUserPassword(userId: string, newPassword: string) {
    try {
        const authCheck = await requireAdmin()
        if (!authCheck.success) return authCheck

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

export async function createUser(email: string, fullName: string, role: string) {
    try {
        const authCheck = await requireAdmin()
        if (!authCheck.success) return authCheck
        const supabase = authCheck.supabase!

        const adminClient = createAdminClient()

        // 1. Create in Supabase Auth (Auto-confirm email for ease)
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email: email,
            password: 'temporal_password_123', // Admin must reset it immediately or we can auto-generate
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: role
            }
        })

        if (authError) return { success: false, error: authError.message }
        if (!authData.user) return { success: false, error: "No se pudo crear el usuario en Auth." }

        // 2. Ensure the custom 'users' table is updated correctly. 
        // Note: A database trigger might automatically insert a row on `auth.users` creation.
        // We will try to update first, if no rows updated, we insert.
        const { error: updateError } = await supabase
            .from('users')
            .upsert({
                id: authData.user.id,
                email: email,
                full_name: fullName,
                role: role
            }, { onConflict: 'id' })

        if (updateError) {
            // Rollback auth user creation if custom table fails
            await adminClient.auth.admin.deleteUser(authData.user.id)
            return { success: false, error: "Error al registrar metadata del usuario: " + updateError.message }
        }

        return { success: true, userId: authData.user.id }

    } catch (err: any) {
        return { success: false, error: err.message || "Error interno del servidor" }
    }
}

