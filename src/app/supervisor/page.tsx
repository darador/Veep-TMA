"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ClipboardCheck, Eye, User, PlusCircle, BarChart3, ListChecks, Search } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { Header } from "@/components/layout/Header"
import KPIDashboard from "@/components/features/supervisor/KPIDashboard"
import { toast } from "sonner"

export default function SupervisorPage() {
    const supabase = createClient()
    const [inspections, setInspections] = useState<any[]>([])
    const [technicians, setTechnicians] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Request Audit State
    const [isRequestOpen, setIsRequestOpen] = useState(false)
    const [selectedTech, setSelectedTech] = useState("")
    const [requesting, setRequesting] = useState(false)

    // Filter State
    const [searchQuery, setSearchQuery] = useState("")
    const [dateFilter, setDateFilter] = useState("")

    useEffect(() => {
        const fetchData = async () => {
            // Fetch Inspections
            const { data: inspectionsData } = await supabase
                .from('inspections')
                .select(`
                    *,
                    technician:users!inspections_technician_id_fkey (
                        full_name,
                        email
                    ),
                    inspection_items (
                        *,
                        epp:epp_catalog (*)
                    )
                `)
                .order('created_at', { ascending: false })

            if (inspectionsData) setInspections(inspectionsData)

            // Fetch Technicians
            const { data: techsData } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'technician')

            if (techsData) setTechnicians(techsData)

            setLoading(false)
        }

        fetchData()
    }, [])

    const handleRequestAudit = async () => {
        if (!selectedTech) return
        setRequesting(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('inspections')
            .insert({
                technician_id: selectedTech,
                supervisor_id: user.id,
                type: 'audit',
                status: 'pending'
            })

        if (!error) {
            toast.success("Solicitud enviada correctamente")
            setIsRequestOpen(false)
            setSelectedTech("")
            // Refresh list
            const { data } = await supabase
                .from('inspections')
                .select(`
                    *,
                    technician:users!inspections_technician_id_fkey (
                        full_name,
                        email
                    )
                `)
                .order('created_at', { ascending: false })
            if (data) setInspections(data)
        } else {
            console.error(error)
            toast.error("Error al solicitar auditoría")
        }
        setRequesting(false)
    }

    const filteredInspections = inspections.filter(insp => {
        const matchesSearch = !searchQuery ||
            insp.technician?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            insp.technician?.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDate = dateFilter
            ? insp.created_at.startsWith(dateFilter)
            : true;

        return matchesSearch && matchesDate;
    })

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <Header
                title="Panel de gestión"
                subtitle="Monitorización de reportes y EPPs del equipo."
                icon={
                    <img
                        src="/tecnico.png"
                        alt="Supervisor"
                        className="w-16 h-16 sm:w-24 sm:h-24 object-contain shrink-0 mr-2"
                    />
                }
            >
                <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-md">
                            <PlusCircle className="w-4 h-4" />
                            Solicitar Reporte
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-lg rounded-xl">
                        <DialogHeader>
                            <DialogTitle>Solicitar Auditoría de EPP</DialogTitle>
                            <DialogDescription>
                                Selecciona un técnico para requerirle una revisión de sus equipos.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <label className="text-sm font-medium mb-2 block">Técnico</label>
                            <Select onValueChange={setSelectedTech} value={selectedTech}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar técnico..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {technicians.map((tech) => (
                                        <SelectItem key={tech.id} value={tech.id}>
                                            {tech.full_name || tech.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsRequestOpen(false)}>Cancelar</Button>
                            <Button onClick={handleRequestAudit} disabled={!selectedTech || requesting}>
                                {requesting ? "Enviando..." : "Enviar Solicitud"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </Header>

            <main className="container max-w-6xl mx-auto p-6 space-y-8">

                <Tabs defaultValue="list" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <TabsList>
                            <TabsTrigger value="list" className="gap-2">
                                <ListChecks className="w-4 h-4" />
                                Reportes
                            </TabsTrigger>
                            <TabsTrigger value="metrics" className="gap-2">
                                <BarChart3 className="w-4 h-4" />
                                Métricas y KPIs
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="list" className="space-y-8">
                        <div className="grid gap-6 md:grid-cols-3">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Reportes Totales</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{inspections.length}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes de Revisión</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {/* Count pending audits */}
                                    <div className="text-2xl font-bold text-yellow-600">
                                        {inspections.filter(i => i.status === 'pending').length}
                                    </div>
                                    <p className="text-xs text-muted-foreground">En curso</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ClipboardCheck className="w-5 h-5" />
                                    Historial reportes
                                </CardTitle>
                                <CardDescription>
                                    Listado de todos los reportes recibidos.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar por nombre o email de técnico..."
                                            className="pl-8"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="w-full sm:w-auto">
                                        <Input
                                            type="date"
                                            value={dateFilter}
                                            onChange={(e) => setDateFilter(e.target.value)}
                                        />
                                    </div>
                                </div>
                                {loading ? (
                                    <div className="text-center py-4">Cargando datos...</div>
                                ) : filteredInspections.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No hay reportes registrados o que coincidan con la búsqueda.
                                    </div>
                                ) : (
                                    <div className="rounded-md border overflow-x-auto">
                                        <table className="w-full text-sm text-left whitespace-nowrap">
                                            <thead className="bg-muted/50 text-muted-foreground font-medium">
                                                <tr>
                                                    <th className="p-4">Técnico</th>
                                                    <th className="p-4">Tipo</th>
                                                    <th className="p-4">Fecha</th>
                                                    <th className="p-4">Estado</th>
                                                    <th className="p-4 text-right">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {filteredInspections.map((insp) => (
                                                    <tr key={insp.id} className="hover:bg-muted/20 transition-colors">
                                                        <td className="p-4 font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400">
                                                                    <User className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium">{insp.technician?.full_name || "Desconocido"}</div>
                                                                    <div className="text-xs text-muted-foreground">{insp.technician?.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            {insp.type === 'audit' ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                                                    Solicitada
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">Voluntaria</span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-muted-foreground">
                                                            {new Date(insp.created_at).toLocaleDateString()}
                                                            <br />
                                                            <span className="text-xs">
                                                                {new Date(insp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${insp.status === 'completed'
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                : 'bg-yellow-100 text-yellow-700'
                                                                }`}>
                                                                {insp.status === 'completed' ? 'Completada' : 'Pendiente'}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <Link href={`/supervisor/inspections/${insp.id}`}>
                                                                <Button variant="ghost" size="sm" className="gap-2">
                                                                    <Eye className="w-4 h-4" />
                                                                    Ver Detalle
                                                                </Button>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="metrics">
                        <KPIDashboard data={inspections} />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}
