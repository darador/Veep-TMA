"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Trash2, UserCog, User, Pencil, AlertTriangle, KeyRound } from "lucide-react"
import { resetUserPassword } from "@/app/actions/admin"

type UserItem = {
    id: string
    email: string
    full_name: string
    role: 'supervisor' | 'technician' | 'admin'
}

export function UserList() {
    const supabase = createClient()
    const [users, setUsers] = useState<UserItem[]>([])
    const [loading, setLoading] = useState(true)

    // Create Form
    const [email, setEmail] = useState("")
    const [fullName, setFullName] = useState("")
    const [role, setRole] = useState<'technician' | 'supervisor'>('technician')

    // Edit State
    const [editingUser, setEditingUser] = useState<UserItem | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)

    // Delete State
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Password Reset State
    const [resetUser, setResetUser] = useState<UserItem | null>(null)
    const [newPassword, setNewPassword] = useState("")
    const [isResetOpen, setIsResetOpen] = useState(false)

    const fetchUsers = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error && data) {
            setUsers(data as UserItem[])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleAdd = async () => {
        if (!email || !fullName) return

        const { error } = await supabase
            .from('users')
            .insert([
                { email, full_name: fullName, role }
            ])

        if (!error) {
            setEmail("")
            setFullName("")
            fetchUsers()
        } else {
            console.error("Error creating user:", error)
            alert("Error creando usuario (Revisar consola. ¿Duplicate email?)")
        }
    }

    const openEdit = (user: UserItem) => {
        setEditingUser(user)
        setIsEditOpen(true)
    }

    const handleUpdate = async () => {
        if (!editingUser) return

        const { error } = await supabase
            .from('users')
            .update({
                full_name: editingUser.full_name,
                email: editingUser.email,
                role: editingUser.role
            })
            .eq('id', editingUser.id)

        if (!error) {
            setIsEditOpen(false)
            setEditingUser(null)
            fetchUsers()
        } else {
            alert("Error actualizando usuario")
            console.error(error)
        }
    }

    const confirmDelete = (id: string) => {
        setDeletingId(id)
    }

    const handleDelete = async () => {
        if (!deletingId) return

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', deletingId)

        if (!error) {
            setDeletingId(null)
            fetchUsers()
        } else {
            alert("Error eliminando usuario")
            console.error(error)
        }
    }

    const openReset = (user: UserItem) => {
        setResetUser(user)
        setNewPassword("")
        setIsResetOpen(true)
    }

    const handleResetPassword = async () => {
        if (!resetUser || !newPassword) return
        if (newPassword.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres")
            return
        }

        try {
            await resetUserPassword(resetUser.id, newPassword)
            alert("Contraseña actualizada correctamente")
            setIsResetOpen(false)
            setResetUser(null)
        } catch (error: any) {
            console.error(error)
            alert("Error: " + error.message)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>
                    Administra los permisos y roles del personal.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Add Form */}
                <div className="flex flex-col sm:flex-row gap-4 items-end bg-muted/30 p-4 rounded-lg border">
                    <div className="flex-1 space-y-2 w-full">
                        <label className="text-sm font-medium">Nombre Completo</label>
                        <Input
                            placeholder="Ej: Juan Pérez"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 space-y-2 w-full">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                            placeholder="juan@movistar.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Rol</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={role}
                            onChange={(e) => setRole(e.target.value as any)}
                        >
                            <option value="technician">Técnico</option>
                            <option value="supervisor">Supervisor</option>
                        </select>
                    </div>
                    <Button onClick={handleAdd}>Crear</Button>
                </div>

                {/* List */}
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        Cargando...
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                        No hay usuarios registrados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.full_name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            {user.role === 'admin' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                                    <UserCog className="w-3 h-3" />
                                                    Admin
                                                </span>
                                            ) : user.role === 'supervisor' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                    <UserCog className="w-3 h-3" />
                                                    Supervisor
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                                    <User className="w-3 h-3" />
                                                    Técnico
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEdit(user)}
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Cambiar Contraseña"
                                                    onClick={() => openReset(user)}
                                                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                >
                                                    <KeyRound className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:bg-destructive/10"
                                                    onClick={() => confirmDelete(user.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Usuario</DialogTitle>
                        <DialogDescription>
                            Modifica los datos del perfil local.
                        </DialogDescription>
                    </DialogHeader>
                    {editingUser && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nombre</label>
                                <Input
                                    value={editingUser.full_name}
                                    onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    value={editingUser.email}
                                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Nota: Cambiar esto no afecta el login (Supabase Auth).
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Rol</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                                >
                                    <option value="technician">Técnico</option>
                                    <option value="supervisor">Supervisor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                        <Button onClick={handleUpdate}>Guardar Cambios</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                            Eliminar Usuario
                        </DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro que deseas eliminar este usuario? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeletingId(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Password Reset Dialog */}
            <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-amber-600" />
                            Cambiar Contraseña
                        </DialogTitle>
                        <DialogDescription>
                            Establece una nueva contraseña para <b>{resetUser?.full_name}</b>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nueva Contraseña</label>
                            <Input
                                type="text"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Escribe la nueva clave. El usuario deberá usar está para ingresar.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsResetOpen(false)}>Cancelar</Button>
                        <Button onClick={handleResetPassword}>Actualizar Clave</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
