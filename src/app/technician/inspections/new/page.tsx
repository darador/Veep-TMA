"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckCircle2, AlertTriangle, XCircle, ArrowLeft, Camera, Image as ImageIcon, Loader2 } from "lucide-react"

type EppItem = {
    id: string
    name: string
    category: string
    is_critical: boolean
}

type InspectionItemStatus = 'ok' | 'damaged' | 'missing' | 'needs_replacement'

type InspectionData = {
    [key: string]: {
        status: InspectionItemStatus
        photo_url?: string
    }
}

function InspectionFormContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const inspectionId = searchParams.get('inspectionId')

    const supabase = createClient()
    const [epps, setEpps] = useState<EppItem[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState<InspectionData>({})
    const [uploading, setUploading] = useState<string | null>(null)

    useEffect(() => {
        const fetchCatalog = async () => {
            const { data, error } = await supabase
                .from('epp_catalog')
                .select('*')
                .eq('is_active', true)
                .order('category')
                .order('name')

            if (data) {
                setEpps(data)
                // Initialize form data
                const initialData: InspectionData = {}
                data.forEach(item => {
                    initialData[item.id] = { status: 'ok' }
                })
                setFormData(initialData)
            }
            setLoading(false)
        }
        fetchCatalog()
    }, [])

    const handleStatusChange = (id: string, status: InspectionItemStatus) => {
        setFormData(prev => ({
            ...prev,
            [id]: { ...prev[id], status }
        }))
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(itemId)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}-${itemId}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('inspections')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('inspections')
                .getPublicUrl(filePath)

            setFormData(prev => ({
                ...prev,
                [itemId]: { ...prev[itemId], photo_url: publicUrl }
            }))

        } catch (error) {
            console.error("Error uploading image:", error)
            alert("Error al subir la imagen. Intenta nuevamente.")
        } finally {
            setUploading(null)
        }
    }

    const handleSubmit = async () => {
        if (!confirm("¿Confirmas el envío del reporte?")) return
        setSubmitting(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("No authentifcated user")

            let finalInspectionId = inspectionId

            if (finalInspectionId) {
                // UPDATE existing inspection
                const { error: updateError } = await supabase
                    .from('inspections')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString()
                    })
                    .eq('id', finalInspectionId)

                if (updateError) throw updateError
            } else {
                // CREATE new inspection
                const { data: inspection, error: inspError } = await supabase
                    .from('inspections')
                    .insert({
                        technician_id: user.id,
                        type: 'voluntary', // Auto-inspección
                        status: 'completed'
                    })
                    .select()
                    .single()

                if (inspError) throw inspError
                finalInspectionId = inspection.id
            }

            // 2. Create Items
            // Note: If updating, we assume items weren't created yet or we append. 
            // For MVP strictness, we just insert.
            const itemsToInsert = epps.map(epp => ({
                inspection_id: finalInspectionId,
                epp_id: epp.id,
                status: formData[epp.id].status,
                photo_url: formData[epp.id].photo_url || null
            }))

            const { error: itemsError } = await supabase
                .from('inspection_items')
                .insert(itemsToInsert)

            if (itemsError) throw itemsError

            router.push('/technician')

        } catch (error) {
            console.error("Error submitting inspection:", error)
            alert("Error al enviar la inspección. Intenta nuevamente.")
        } finally {
            setSubmitting(false)
        }
    }

    // Group by category
    const groupedEpps = epps.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = []
        acc[item.category].push(item)
        return acc
    }, {} as Record<string, EppItem[]>)

    if (loading) return <div className="p-8 text-center">Cargando catálogo...</div>

    return (
        <div className="p-4 max-w-2xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">
                        {inspectionId ? "Completar Auditoría" : "Nueva Inspección"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {inspectionId ? "Solicitada por Supervisor" : "Revisión de Equipos"}
                    </p>
                </div>
            </div>

            {Object.entries(groupedEpps).map(([category, items]) => (
                <Card key={category}>
                    <CardHeader className="py-4 bg-muted/20">
                        <CardTitle className="text-base">{category}</CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y">
                        {items.map(item => (
                            <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{item.name}</span>
                                        {item.is_critical && (
                                            <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-bold uppercase tracking-wider">
                                                Crítico
                                            </span>
                                        )}
                                    </div>

                                    {/* Photo Preview & Control */}
                                    <div className="flex items-center gap-2">
                                        {uploading === item.id ? (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                Subiendo...
                                            </div>
                                        ) : formData[item.id]?.photo_url ? (
                                            <div className="relative group">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={formData[item.id].photo_url}
                                                    alt="Evidence"
                                                    className="w-12 h-12 rounded object-cover border"
                                                />
                                                <Button
                                                    size="icon"
                                                    variant="destructive"
                                                    className="w-5 h-5 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        [item.id]: { ...prev[item.id], photo_url: undefined }
                                                    }))}
                                                >
                                                    <XCircle className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    capture="environment"
                                                    className="hidden"
                                                    id={`file-${item.id}`}
                                                    onChange={(e) => handleImageUpload(e, item.id)}
                                                />
                                                <label
                                                    htmlFor={`file-${item.id}`}
                                                    className="flex items-center gap-1 text-xs text-blue-600 cursor-pointer hover:underline"
                                                >
                                                    <Camera className="w-3 h-3" />
                                                    {formData[item.id]?.status !== 'ok' ? 'Evidencia requerida' : 'Agregar foto'}
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex bg-muted p-1 rounded-lg self-start sm:self-auto">
                                    <button
                                        onClick={() => handleStatusChange(item.id, 'ok')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${formData[item.id]?.status === 'ok'
                                            ? 'bg-white text-green-700 shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        OK
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(item.id, 'needs_replacement')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${formData[item.id]?.status === 'needs_replacement'
                                            ? 'bg-white text-yellow-700 shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                        Desgaste
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(item.id, 'missing')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${formData[item.id]?.status === 'missing'
                                            ? 'bg-white text-red-700 shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Falta
                                    </button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
                <div className="max-w-2xl mx-auto">
                    <Button
                        onClick={handleSubmit}
                        className="w-full h-12 text-lg shadow-lg"
                        disabled={submitting}
                    >
                        {submitting ? "Enviando..." : "Finalizar Inspección"}
                    </Button>
                </div>
            </div>
        </div>
    )
}


export default function NewInspectionPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <InspectionFormContent />
        </Suspense>
    )
}
