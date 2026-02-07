"use server"

import { createAdminClient } from "@/lib/supabase/admin-client"
import { createClient } from "@/lib/supabase/server"

export async function resetUserPassword(userId: string, newPassword: string) {
    const supabase = await createClient()

    // 1. Verify current user is Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        throw new Error("Forbidden: Only admins can reset passwords")
    }

    // 2. Perform Admin Update
    const adminClient = createAdminClient()
    const { error } = await adminClient.auth.admin.updateUserById(
        userId,
        { password: newPassword }
    )

    if (error) throw new Error(error.message)

    return { success: true }
}
