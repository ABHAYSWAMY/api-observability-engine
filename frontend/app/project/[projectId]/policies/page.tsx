"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getPolicies, createPolicy } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function Policies() {
  const { projectId } = useParams<{ projectId: string }>()
  const [policies, setPolicies] = useState<any[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [name, setName] = useState("")
  const [metric, setMetric] = useState("latency_p95")
  const [comparison, setComparison] = useState(">")
  const [threshold, setThreshold] = useState("300")
  const [severity, setSeverity] = useState("critical")
  const [cooldownMinutes, setCooldownMinutes] = useState("15")

  async function load() {
    if (!projectId) return
    try {
      const data = await getPolicies(projectId)
      setPolicies(data)
      setError("")
    } catch (err) {
      console.error("Failed to load policies:", err)
      const errorMsg = err instanceof TypeError && err.message === "Failed to fetch"
        ? "⚠️ Request blocked! This is likely caused by an ad blocker or privacy extension blocking requests to URLs containing 'policies'. Please disable your ad blocker for localhost or whitelist this site."
        : `Failed to load policies: ${err}`
      setError(errorMsg)
    }
  }

  useEffect(() => {
    load()
  }, [projectId])

  async function handleCreatePolicy(e: React.FormEvent) {
    e.preventDefault()
    if (!projectId || !name) {
      setError("Please fill in all required fields")
      return
    }
    
    setLoading(true)
    try {
      await createPolicy(projectId, {
        name,
        metric,
        comparison,
        threshold: parseFloat(threshold),
        severity,
        cooldown_minutes: parseInt(cooldownMinutes),
      })
      
      // Reset form
      setName("")
      setMetric("latency_p95")
      setComparison(">")
      setThreshold("300")
      setSeverity("critical")
      setCooldownMinutes("15")
      setError("")
      
      // Reload policies
      load()
    } catch (err) {
      console.error("Failed to create policy:", err)
      setError(`Failed to create policy: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Card className="border border-slate-200/70 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-3xl">Alert Policies</CardTitle>
          <CardDescription className="text-base">Configure rules to monitor your API performance</CardDescription>
        </CardHeader>
      </Card>
      
      {error && (
        <Card className="border-red-200 bg-red-50 shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <p className="text-red-700 font-bold text-lg">⚠️ Error</p>
            <p className="text-red-600">{error}</p>
            {error.includes("ad blocker") && (
              <div className="bg-white rounded-lg p-4 border-2 border-red-300 space-y-2 shadow-sm">
                <p className="font-bold text-red-700">To fix this:</p>
                <ol className="list-decimal ml-5 space-y-2 text-red-600 text-sm">
                  <li>Disable your ad blocker for this site</li>
                  <li>Or whitelist http://localhost:3000 and http://165.22.62.3:8000</li>
                  <li>Then refresh this page</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Policy Form */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Create New Policy</CardTitle>
          <CardDescription>Define alert conditions for your API metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreatePolicy} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-semibold">Policy Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., High Latency Alert"
                  className="h-10 text-base"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metric" className="text-base font-semibold">Metric</Label>
                <select
                  id="metric"
                  value={metric}
                  onChange={(e) => setMetric(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="latency_p95">📍 Latency (P95)</option>
                  <option value="error_rate">❌ Error Rate</option>
                  <option value="throughput">⚡ Throughput</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comparison" className="text-base font-semibold">Condition</Label>
                <select
                  id="comparison"
                  value={comparison}
                  onChange={(e) => setComparison(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value=">">&gt; Greater than</option>
                  <option value="<">&lt; Less than</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="threshold" className="text-base font-semibold">Threshold Value</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder="100"
                  className="h-10 text-base"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity" className="text-base font-semibold">Severity Level</Label>
                <select
                  id="severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="critical">🔴 Critical</option>
                  <option value="warn">🟡 Warning</option>
                  <option value="info">🔵 Info</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cooldown" className="text-base font-semibold">Cooldown Period (minutes)</Label>
                <Input
                  id="cooldown"
                  type="number"
                  value={cooldownMinutes}
                  onChange={(e) => setCooldownMinutes(e.target.value)}
                  placeholder="15"
                  className="h-10 text-base"
                />
              </div>
            </div>

            <Button 
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full text-base h-10 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Creating Policy..." : "✓ Create Policy"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Policies List */}
      <Card className="border border-slate-200/70 bg-white/80 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Active Policies</CardTitle>
              <CardDescription className="mt-2">Manage your monitoring rules</CardDescription>
            </div>
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-bold whitespace-nowrap">
              {policies.length} {policies.length === 1 ? 'policy' : 'policies'}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {policies.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-slate-600 text-lg">📝 No policies yet</p>
              <p className="text-slate-500 mt-2">Create your first alert policy above to start monitoring</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {policies.map((p: any) => {
                const severityConfig: any = {
                  critical: { icon: "🔴", bg: "bg-red-50 border-red-200 border-l-4 border-l-red-500" },
                  warn: { icon: "🟡", bg: "bg-yellow-50 border-yellow-200 border-l-4 border-l-yellow-500" },
                  info: { icon: "🔵", bg: "bg-blue-50 border-blue-200 border-l-4 border-l-blue-500" },
                }
                const config = severityConfig[p.severity] || severityConfig.info

                return (
                  <Card
                    key={p.id}
                    className={`${config.bg} shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{p.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {p.metric && `${p.metric.replace(/_/g, ' ').toUpperCase()} Monitoring`}
                          </CardDescription>
                        </div>
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                          p.is_active
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : "bg-slate-200 text-slate-700 border border-slate-300"
                        }`}>
                          {p.is_active ? "✓ Active" : "○ Inactive"}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="border-t border-current border-opacity-20 pt-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-700">Condition:</span>
                          <span className="font-mono font-bold text-slate-900">{p.comparison} {p.threshold}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-700">Severity:</span>
                          <span className="font-bold">{config.icon} {p.severity.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-700">Cooldown:</span>
                          <span className="font-bold text-slate-900">{p.cooldown_minutes}m</span>
                        </div>
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