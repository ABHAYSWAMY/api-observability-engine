"use client"

import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { projectId } = useParams<{ projectId: string }>()
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href)

  const navItems = [
    { label: "Policies", href: `/project/${projectId}/policies`, icon: "📋" },
    { label: "Alerts", href: `/project/${projectId}/alerts`, icon: "🚨" },
    { label: "Metrics", href: `/project/${projectId}/metrics`, icon: "📊" },
    { label: "Aggregated", href: `/project/${projectId}/aggregated`, icon: "📈" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <nav className="sticky top-0 z-50 bg-white shadow-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-6 mb-6">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all">
                API Monitor
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Project: <span className="font-mono font-semibold text-slate-700">{projectId}</span></p>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                ← Home
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={active ? "default" : "outline"}
                    size="sm"
                    className={`gap-2 whitespace-nowrap text-sm sm:text-base ${
                      active 
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg" 
                        : ""
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}