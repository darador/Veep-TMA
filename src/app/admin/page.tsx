"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EppCatalog } from "@/components/features/admin/EppCatalog"
import { UserList } from "@/components/features/admin/UserList"
import { Header } from "@/components/layout/Header"

export default function AdminPage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <Header
                title="Panel de Administración"
                subtitle="Gestión de Usuarios y Catálogos"
            />
            <main className="container max-w-7xl mx-auto p-6 space-y-8">
                <Tabs defaultValue="users" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                        <TabsTrigger value="users">Usuarios</TabsTrigger>
                        <TabsTrigger value="catalog">Catálogo EPP</TabsTrigger>
                    </TabsList>
                    <TabsContent value="users" className="mt-0">
                        <UserList />
                    </TabsContent>
                    <TabsContent value="catalog" className="mt-0">
                        <EppCatalog />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}
