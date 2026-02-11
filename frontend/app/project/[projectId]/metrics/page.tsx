"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getRawMetrics } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Metrics() {
  const { projectId } = useParams<{ projectId: string }>()
  const [metrics, setMetrics] = useState<any[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    if (!projectId) return
    getRawMetrics(projectId)
      .then((data) => {
        setMetrics(data)
        setError("")
      })
      .catch((err) => {
        console.error("Failed to load metrics:", err)
        setError(`Failed to load metrics: ${err}`)
      })
  }, [projectId])

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Card className="border border-slate-200/70 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-3xl">Raw Metrics</CardTitle>
          <CardDescription className="text-base">Real-time performance data from your API</CardDescription>
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
            <CardTitle className="text-2xl">Metrics Data</CardTitle>
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              {metrics.length} records
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {metrics.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-lg">No metrics available yet. Your API metrics will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50">
                    <th className="text-left py-4 px-4 font-bold text-slate-900">Timestamp</th>
                    <th className="text-left py-4 px-4 font-bold text-slate-900">Endpoint</th>
                    <th className="text-right py-4 px-4 font-bold text-slate-900">Latency (ms)</th>
                    <th className="text-center py-4 px-4 font-bold text-slate-900">Status</th>
                    <th className="text-right py-4 px-4 font-bold text-slate-900">Code (HTTP)</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 text-slate-700 text-sm font-mono">{new Date(metric.timestamp).toLocaleString()}</td>
                      <td className="py-4 px-4 text-slate-700 font-semibold">{metric.endpoint}</td>
                      <td className="py-4 px-4 text-right">
                        <span className={`inline-block px-3 py-1 rounded-lg font-bold text-sm ${
                          metric.latency_ms > 500 ? 'bg-red-100 text-red-800' : 
                          metric.latency_ms > 200 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {metric.latency_ms.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-lg font-bold text-sm ${
                          metric.status_code >= 400 ? 'bg-red-100 text-red-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {metric.status_code}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-slate-700">{metric.response_size_bytes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}