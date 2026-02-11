"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getAggregatedMetrics } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Aggregated() {
  const { projectId } = useParams<{ projectId: string }>()
  const [bucket, setBucket] = useState("1m")
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    if (!projectId) return
    getAggregatedMetrics(projectId, bucket)
      .then((data) => {
        setData(data)
        setError("")
      })
      .catch((err) => {
        console.error("Failed to load aggregated metrics:", err)
        setError(`Failed to load aggregated metrics: ${err}`)
      })
  }, [bucket, projectId])

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Card className="border border-slate-200/70 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-3xl">Aggregated Metrics</CardTitle>
          <CardDescription className="text-base">Time-bucketed performance statistics</CardDescription>
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
          <CardTitle>Analysis Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">Time Bucket</label>
            <div className="flex gap-2 flex-wrap">
              {["1m", "5m", "1h"].map((b) => (
                <Button
                  key={b}
                  onClick={() => setBucket(b)}
                  variant={bucket === b ? "default" : "outline"}
                  size="sm"
                  className={bucket === b ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  {b === "1m" ? "1 minute" : b === "5m" ? "5 minutes" : "1 hour"}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200/70 bg-white/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Data</CardTitle>
            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
              {data.length} buckets
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-lg">No data available for this time bucket.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50">
                    <th className="text-left py-4 px-4 font-bold text-slate-900">Time Bucket</th>
                    <th className="text-right py-4 px-4 font-bold text-slate-900">P95 Latency (ms)</th>
                    <th className="text-right py-4 px-4 font-bold text-slate-900">Error Rate (%)</th>
                    <th className="text-right py-4 px-4 font-bold text-slate-900">Request Count</th>
                    <th className="text-right py-4 px-4 font-bold text-slate-900">Error Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((bucket: any, idx: number) => {
                    const errorRate = bucket.request_count > 0 
                      ? (bucket.error_count / bucket.request_count) * 100 
                      : 0;
                    
                    return (
                      <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 text-slate-700 font-mono text-sm">{new Date(bucket.bucket_start).toLocaleString()}</td>
                        <td className="py-4 px-4 text-right">
                          <span className={`inline-block px-3 py-1 rounded-lg font-bold text-sm ${
                            bucket.p95_latency_ms > 500 ? 'bg-red-100 text-red-800' : 
                            bucket.p95_latency_ms > 200 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {bucket.p95_latency_ms ? Number(bucket.p95_latency_ms).toFixed(2) : 'N/A'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className={`inline-block px-3 py-1 rounded-lg font-bold text-sm ${
                            errorRate > 5 ? 'bg-red-100 text-red-800' :
                            errorRate > 1 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {errorRate.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right text-slate-900 font-semibold">{bucket.request_count}</td>
                        <td className="py-4 px-4 text-right text-slate-700">{bucket.error_count}</td>
                      </tr>
                    );
                  })}
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