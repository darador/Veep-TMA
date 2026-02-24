"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Header } from "@/components/layout/Header"
import { User, Camera, Loader2, Lock, Save, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export default function ProfilePage() {
    const supabase = createClient()
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)

    // Password State
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [updatingPassword, setUpdatingPassword] = useState(false)

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUser(user)
                const { data } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                setProfile(data)
            }
            setLoading(false)
        }
        fetchProfile()
    }, [])

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        setUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `avatars/${user.id}-${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('inspections') // Reusing existing bucket for MVP
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Get URL
            const { data: { publicUrl } } = supabase.storage
                .from('inspections')
                .getPublicUrl(filePath)

            // 3. Update Profile
            const { error: updateError } = await supabase
                .from('users')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id)

            if (updateError) throw updateError

            setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }))
            toast.success("Foto de perfil actualizada correctamente")

        } catch (error) {
            console.error("Error uploading avatar:", error)
            toast.error("Error al subir la foto.")
        } finally {
            setUploading(false)
        }
    }

    const handlePasswordChange = async () => {
        if (password !== confirmPassword) {
            toast.warning("Las contraseñas no coinciden")
            return
        }
        if (password.length < 6) {
            toast.warning("La contraseña debe tener al menos 6 caracteres")
            return
        }

        setUpdatingPassword(true)
        const { error } = await supabase.auth.updateUser({ password: password })

        if (error) {
            toast.error(`Error: ${error.message}`)
        } else {
            toast.success("Contraseña actualizada correctamente")
            setPassword("")
            setConfirmPassword("")
        }
        setUpdatingPassword(false)
    }

    if (loading) return <div className="p-8 text-center">Cargando perfil...</div>

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <Header
                title="Mi Perfil"
                subtitle="Gestiona tus datos personales y seguridad."
            />

            <main className="container max-w-2xl mx-auto p-6 space-y-6">

                {/* Profile Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Información Personal</CardTitle>
                        <CardDescription>Tu identidad en la plataforma.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-zinc-100 flex items-center justify-center">
                                {profile?.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={profile.avatar_url}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-12 h-12 text-zinc-300" />
                                )}
                            </div>

                            <label
                                htmlFor="avatar-upload"
                                className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-md cursor-pointer hover:bg-primary/90 transition-colors"
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </div>

                        <div className="text-center sm:text-left space-y-1">
                            <h2 className="text-2xl font-bold">{profile?.full_name || "Usuario"}</h2>
                            <p className="text-muted-foreground">{profile?.email}</p>
                            <div className="flex items-center gap-2 justify-center sm:justify-start pt-2">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                                    {profile?.role || "Rol desconocido"}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Security Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5" />
                            Seguridad
                        </CardTitle>
                        <CardDescription>Actualiza tu contraseña.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nueva Contraseña</label>
                            <Input
                                type="password"
                                placeholder="******"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Confirmar Contraseña</label>
                            <Input
                                type="password"
                                placeholder="******"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                        <div className="pt-2">
                            <Button
                                onClick={handlePasswordChange}
                                disabled={updatingPassword || !password}
                                className="w-full sm:w-auto"
                            >
                                {updatingPassword ? (
                                    <>
                                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                                        Actualizando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 w-4 h-4" />
                                        Guardar Nueva Contraseña
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

            </main>
        </div>
    )
}
