"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (authError) throw authError

      // Fetch user role
      // We need to get the user first to get the ID, but signIn returns session.
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      if (userProfile?.role === 'admin') router.push('/admin')
      else if (userProfile?.role === 'supervisor') router.push('/supervisor')
      else if (userProfile?.role === 'technician') router.push('/technician')
      else router.push('/') // Fallback

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-movistar">
      {/* Left Column: Branding & Future 3D Asset */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 text-white relative overflow-hidden">

        {/* Decorative subtle background elements removed to perfectly match image bg */}

        <div className="flex flex-col items-center text-center z-10 w-full max-w-lg mt-10 lg:mt-0">
          <h2 className="text-3xl lg:text-4xl font-semibold opacity-95 mb-8 drop-shadow-md">
            Verificación de EPP
          </h2>

          {/* Character Image */}
          <div className="w-full max-w-md flex flex-col items-center justify-center transition-all">
            <img
              src="/comprometidos.png"
              alt="Comprometidos con la Seguridad"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full lg:w-[500px] xl:w-[600px] bg-white flex flex-col justify-center p-8 md:p-12 lg:p-16 shadow-2xl relative z-20">

        <div className="w-full max-w-md mx-auto space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Bienvenido/a</h2>
            <p className="text-slate-500">Ingresa tus credenciales para continuar</p>
          </div>

          <Card className="border-none shadow-none bg-transparent">
            <CardContent className="p-0">
              {error && (
                <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium flex items-center justify-center">
                  {error}
                </div>
              )}
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Correo electrónico
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-slate-50 border-slate-200 text-base focus-visible:ring-movistar text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label
                      htmlFor="password"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Contraseña
                    </label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 bg-slate-50 border-slate-200 text-base focus-visible:ring-movistar text-slate-900"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 bg-movistar hover:bg-movistar/90 text-white font-bold text-lg rounded-xl shadow-md transition-all hover:shadow-lg mt-4"
                  disabled={loading}
                >
                  {loading ? "Iniciando sesión..." : "Ingresar"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 text-center mt-8 p-0">
              <p className="text-sm tracking-wide text-slate-500 font-medium underline decoration-slate-300 underline-offset-4 cursor-pointer hover:text-movistar transition-colors">
                ¿Olvidaste tu contraseña? Contacta al administrador
              </p>

              {/* Security Warning Badge */}
              <div className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200 mt-4">
                <span>⚠ Uso exclusivo para personal autorizado de Movistar</span>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div >
  )
}
