"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function OpenProject() {
  const [id, setId] = useState("")
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col justify-center items-center px-4 py-12">
      <div className="text-center mb-12 max-w-md">
        <h1 className="text-5xl font-bold text-slate-900 mb-3">Open Project</h1>
        <p className="text-slate-600">Enter your project ID to access your monitoring dashboard</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Access Your Project</CardTitle>
          <CardDescription>Paste your project ID below</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="projectId" className="text-base font-semibold">Project ID</Label>
            <Input
              id="projectId"
              placeholder="Enter project ID"
              value={id}
              onChange={(e) => setId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && router.push(`/project/${id}`)}
              className="h-10 text-base"
            />
          </div>

          <Button 
            size="lg"
            className="w-full text-base h-10 bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push(`/project/${id}`)}
          >
            Open Project →
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}