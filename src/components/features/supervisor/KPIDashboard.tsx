"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from "recharts"

type DashboardProps = {
    data: any[] // Inspections with items
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#ff4d4f']

export default function KPIDashboard({ data }: DashboardProps) {
    if (!data || data.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No hay suficientes datos para generar métricas.</div>
    }

    // 1. Calculate Global Compliance (Status of Items)
    let totalItems = 0
    let okItems = 0
    let issuesItems = 0
    let missingItems = 0

    // 2. Category Issues
    const categoryStats: Record<string, { ok: number, issues: number }> = {}

    data.forEach(insp => {
        if (!insp.inspection_items) return

        insp.inspection_items.forEach((item: any) => {
            totalItems++
            const cat = item.epp?.category || 'Otros'

            if (!categoryStats[cat]) categoryStats[cat] = { ok: 0, issues: 0 }

            if (item.status === 'ok') {
                okItems++
                categoryStats[cat].ok++
            } else {
                if (item.status === 'missing') missingItems++
                else issuesItems++
                categoryStats[cat].issues++
            }
        })
    })

    const compliancenData = [
        { name: 'OK', value: okItems },
        { name: 'Desgaste', value: issuesItems },
        { name: 'Faltante', value: missingItems },
    ]

    const categoryData = Object.entries(categoryStats).map(([name, stats]) => ({
        name,
        ok: stats.ok,
        issues: stats.issues
    }))

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                {/* Global Compliance Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Cumplimiento Global de EPPs</CardTitle>
                        <CardDescription>Estado de todos los equipos inspeccionados</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={compliancenData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }: any) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                                >
                                    <Cell key="cell-0" fill="#22c55e" /> {/* Verde OK */}
                                    <Cell key="cell-1" fill="#eab308" /> {/* Amarillo Warning */}
                                    <Cell key="cell-2" fill="#ef4444" /> {/* Rojo Missing */}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Issues by Category Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Estado por Categoría</CardTitle>
                        <CardDescription>Comparativa OK vs Incidencias</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={categoryData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={100} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="ok" name="En Buen Estado" stackId="a" fill="#22c55e" />
                                <Bar dataKey="issues" name="Con Incidencias" stackId="a" fill="#ef4444" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="py-2">
                        <CardTitle className="text-sm">Total EPPs Revisados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalItems}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-2">
                        <CardTitle className="text-sm">Tasa de Conformidad</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {totalItems > 0 ? ((okItems / totalItems) * 100).toFixed(1) : 0}%
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-2">
                        <CardTitle className="text-sm">Elementos Faltantes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{missingItems}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-2">
                        <CardTitle className="text-sm">Requieren Recambio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{issuesItems}</div>
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}
