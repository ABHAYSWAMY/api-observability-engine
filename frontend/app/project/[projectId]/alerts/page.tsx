"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getAlerts } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Alerts() {
  const { projectId } = useParams<{ projectId: string }>()
  const [alerts, setAlerts] = useState<any[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    if (!projectId) return
    getAlerts(projectId)
      .then((data) => {
        setAlerts(data)
        setError("")
      })
      .catch((err) => {
        console.error("Failed to load alerts:", err)
        setError(`Failed to load alerts: ${err}`)
      })
  }, [projectId])

  const severityConfig: any = {
    critical: { color: "red", icon: "🔴", bg: "bg-red-50 border-red-200" },
    warning: { color: "yellow", icon: "🟡", bg: "bg-yellow-50 border-yellow-200" },
    info: { color: "blue", icon: "🔵", bg: "bg-blue-50 border-blue-200" },
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Card className="border border-slate-200/70 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-3xl">Alert Events</CardTitle>
          <CardDescription className="text-base">History of triggered alerts and notifications</CardDescription>
        </CardHeader>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-red-700 font-semibold">⚠️ {error}</p>
          </CardContent>
        </Card>
      )}

      <Card className="border border-slate-200/70 bg-white/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Alert History</CardTitle>
            <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
              {alerts.length} alerts
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-lg">No alerts yet. Your system is running smoothly! 🎉</p>
            </div>
          ) : (
            <div className="space-y-5">
              {alerts.map((alert: any, idx: number) => {
                const config = severityConfig[alert.severity || 'info'] || severityConfig.info
                
                return (
                  <Card key={idx} className={`border-l-4 ${
                    alert.severity === 'critical' ? 'border-l-red-500' :
                    alert.severity === 'warning' ? 'border-l-yellow-500' :
                    'border-l-blue-500'
                  } ${config.bg} shadow-sm hover:shadow-md transition-shadow`}>
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-2xl">{config.icon}</span>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{alert.policy_name || 'Alert'}</CardTitle>
                            <CardDescription className="mt-1 text-sm">{alert.message || 'Alert triggered'}</CardDescription>
                          </div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                          alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {(alert.severity || 'info').toUpperCase()}
                        </span>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="border-t border-current border-opacity-20 pt-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        {alert.metric && (
                          <div>
                            <p className="opacity-75 text-xs font-semibold">Metric</p>
                            <p className="font-mono font-bold mt-1 text-slate-900">{alert.metric}</p>
                          </div>
                        )}
                        {alert.value !== undefined && (
                          <div>
                            <p className="opacity-75 text-xs font-semibold">Value</p>
                            <p className="font-bold mt-1 text-slate-900">{typeof alert.value === 'number' ? alert.value.toFixed(2) : alert.value}</p>
                          </div>
                        )}
                        {alert.threshold !== undefined && (
                          <div>
                            <p className="opacity-75 text-xs font-semibold">Threshold</p>
                            <p className="font-bold mt-1 text-slate-900">{typeof alert.threshold === 'number' ? alert.threshold.toFixed(2) : alert.threshold}</p>
                          </div>
                        )}
                        {alert.triggered_at && (
                          <div>
                            <p className="opacity-75 text-xs font-semibold">Triggered</p>
                            <p className="font-mono text-xs mt-1 text-slate-700">{new Date(alert.triggered_at).toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}