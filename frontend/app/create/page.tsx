"use client"

import { useState } from "react"
import { createProject } from "@/lib/api"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CreatePage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [projectId, setProjectId] = useState("")
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleCreate() {
    try {
      setError("")
      const res = await createProject({ name, email })
      setResult(res)
    } catch {
      setError("Failed to create project")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-3">Create New Project</h1>
          <p className="text-lg text-slate-600">Set up monitoring for your API in seconds</p>
        </div>

        {/* Create Project Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">New Project Details</CardTitle>
            <CardDescription>Provide your project information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-semibold">Project Name</Label>
                <Input
                  id="name"
                  placeholder="My API Project"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-semibold">Alert Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="alerts@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 text-base"
                />
              </div>
            </div>

            <Button 
              size="lg"
              onClick={handleCreate}
              className="w-full text-base h-10 bg-blue-600 hover:bg-blue-700"
            >
              ✓ Create Project
            </Button>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                <p className="text-red-700 font-semibold">⚠️ {error}</p>
              </div>
            )}

            {result && (
              <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6 space-y-4">
                <p className="text-green-800 font-bold text-lg">✓ Project Created Successfully!</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded-lg p-4">
                  {result.id && (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-600">Project ID</p>
                      <p className="font-mono text-sm text-green-700 font-bold break-all select-all bg-green-50 p-2 rounded">{result.id}</p>
                    </div>
                  )}
                  {result.api_key && (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-600">API Key</p>
                      <p className="font-mono text-xs text-green-700 break-all select-all bg-green-50 p-2 rounded">{result.api_key}</p>
                    </div>
                  )}
                  {result.name && (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-600">Project Name</p>
                      <p className="text-green-700">{result.name}</p>
                    </div>
                  )}
                  {result.email && (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-600">Alert Email</p>
                      <p className="text-green-700">{result.email}</p>
                    </div>
                  )}
                </div>
                <Button
                  size="lg"
                  onClick={() => router.push(`/project/${result.project_id}`)}
                  className="w-full text-base h-10 bg-green-600 hover:bg-green-700"
                >
                  → Open Project Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Open Existing Project */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Access Existing Project</CardTitle>
            <CardDescription>Enter your project ID to manage your monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectId" className="text-base font-semibold">Project ID</Label>
              <Input
                id="projectId"
                placeholder="Enter your project ID"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && router.push(`/project/${projectId}`)}
                className="h-10 text-base"
              />
            </div>
            <Button
              size="lg"
              onClick={() => router.push(`/project/${projectId}`)}
              className="w-full text-base h-10"
              variant="outline"
            >
              Open Project →
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}