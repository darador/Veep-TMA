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
import { Trash2, AlertTriangle, CheckCircle2, Archive, ArchiveRestore } from "lucide-react"

type EppItem = {
    id: string
    name: string
    category: string
    is_critical: boolean
    is_active: boolean
}

export function EppCatalog() {
    const supabase = createClient()
    const [items, setItems] = useState<EppItem[]>([])
    const [loading, setLoading] = useState(true)

    // Form state
    const [newName, setNewName] = useState("")
    const [newCategory, setNewCategory] = useState("General")
    const [isCritical, setIsCritical] = useState(false)

    const fetchItems = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('epp_catalog')
            .select('*')
            .order('is_active', { ascending: false }) // Active first
            .order('created_at', { ascending: false })

        if (!error && data) {
            setItems(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchItems()
    }, [])

    const handleAdd = async () => {
        if (!newName) return

        const { error } = await supabase
            .from('epp_catalog')
            .insert([
                { name: newName, category: newCategory, is_critical: isCritical, is_active: true }
            ])

        if (!error) {
            setNewName("")
            setNewCategory("General")
            setIsCritical(false)
            fetchItems()
        }
    }

    const toggleStatus = async (item: EppItem) => {
        const { error } = await supabase
            .from('epp_catalog')
            .update({ is_active: !item.is_active })
            .eq('id', item.id)

        if (!error) {
            fetchItems()
        } else {
            console.error("Error updating EPP status:", error)
            alert("Error actualizando estado del ítem.")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar PERMANENTEMENTE este ítem? (Se recomienda ARCHIVAR en su lugar)")) return

        const { error } = await supabase
            .from('epp_catalog')
            .delete()
            .eq('id', id)

        if (!error) {
            fetchItems()
        } else {
            console.error("Error deleting EPP:", error)
            if (error.code === '23503') { // foreign_key_violation
                alert("No se puede eliminar este ítem porque está siendo usado en inspecciones históricas.\n\nPor favor usa el botón de 'Archivar' para ocultarlo sin perder el historial.")
            } else {
                alert(`Error al eliminar: ${error.message}`)
            }
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Catálogo de EPP</CardTitle>
                <CardDescription>
                    Define los elementos que los técnicos deben verificar.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Add Form */}
                <div className="flex flex-col sm:flex-row gap-4 items-end bg-muted/30 p-4 rounded-lg border">
                    <div className="flex-1 space-y-2 w-full">
                        <label className="text-sm font-medium">Nombre del EPP</label>
                        <Input
                            placeholder="Ej: Casco de Seguridad"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Categoría</label>
                        <Input
                            placeholder="Ej: Cabeza"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2 flex flex-col items-center justify-center pb-2 px-2">
                        <label className="text-sm font-medium cursor-pointer flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={isCritical}
                                onChange={(e) => setIsCritical(e.target.checked)}
                                className="w-4 h-4 text-primary"
                            />
                            Es Crítico
                        </label>
                    </div>
                    <Button onClick={handleAdd}>Agregar</Button>
                </div>

                {/* List */}
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        Cargando...
                                    </TableCell>
                                </TableRow>
                            ) : items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No hay elementos en el catálogo.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => (
                                    <TableRow key={item.id} className={!item.is_active ? 'opacity-50 bg-muted/20' : ''}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.category}</TableCell>
                                        <TableCell>
                                            {item.is_critical ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Crítico
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Estándar
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {item.is_active ? (
                                                <span className="text-xs font-medium text-green-600">Activo</span>
                                            ) : (
                                                <span className="text-xs font-medium text-muted-foreground">Archivado</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => toggleStatus(item)}
                                                    title={item.is_active ? "Archivar" : "Restaurar"}
                                                    className={item.is_active ? "text-orange-500 hover:text-orange-600 hover:bg-orange-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                                                >
                                                    {item.is_active ? <Archive className="w-4 h-4" /> : <ArchiveRestore className="w-4 h-4" />}
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDelete(item.id)}
                                                    title="Eliminar permanentemente"
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
        </Card>
    )
}
