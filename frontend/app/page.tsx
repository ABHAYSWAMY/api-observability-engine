import Link from "next/link"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col justify-center items-center px-4 py-12">
      <div className="text-center max-w-2xl mb-16">
        <h1 className="text-6xl font-bold text-slate-900 mb-4">API Performance Monitor</h1>
        <p className="text-xl text-slate-600">Monitor, analyze, and optimize your API performance with real-time metrics and intelligent alerting</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mb-16">
        <Link href="/open-project" className="flex-1">
          <Button variant="default" size="lg" className="w-full text-base h-12 bg-blue-600 hover:bg-blue-700">
            → Open Project
          </Button>
        </Link>
        <Link href="/create" className="flex-1">
          <Button variant="outline" size="lg" className="w-full text-base h-12">
            + Create Project
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl w-full">
        <Card className="text-center">
          <CardHeader>
            <div className="text-4xl mb-4">📊</div>
            <CardTitle>Real-time Metrics</CardTitle>
            <CardDescription>Track API performance</CardDescription>
          </CardHeader>
        </Card>
        <Card className="text-center">
          <CardHeader>
            <div className="text-4xl mb-4">🚨</div>
            <CardTitle>Smart Alerts</CardTitle>
            <CardDescription>Get notified fast</CardDescription>
          </CardHeader>
        </Card>
        <Card className="text-center">
          <CardHeader>
            <div className="text-4xl mb-4">📈</div>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Deep insights</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
