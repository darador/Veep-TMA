
import { MovistarLogo } from "@/components/ui/movistar-logo"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface HeaderProps {
    title: string
    subtitle?: string
    children?: React.ReactNode
    icon?: React.ReactNode
}

export function Header({ title, subtitle, children, icon }: HeaderProps) {
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    return (
        <header className="bg-movistar sticky top-0 z-10 shadow-md">
            <div className="container max-w-7xl mx-auto p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 self-start md:self-auto">
                    {icon ? icon : <MovistarLogo className="w-10 h-10 text-white fill-white" />}
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
                        {subtitle && <p className="text-xs text-white/80">{subtitle}</p>}
                    </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto">
                    {children}
                    <div className="flex items-center gap-4">
                        <Link href="/profile">
                            <Button variant="outline" size="sm" className="text-white border-white bg-transparent hover:bg-white hover:text-movistar transition-colors">
                                Mi Perfil
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-white border-white bg-transparent hover:bg-white hover:text-movistar transition-colors"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Salir
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    )
}
