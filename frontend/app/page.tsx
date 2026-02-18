import Link from "next/link"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col justify-center items-center px-6 py-16">
      
      {/* Hero Section */}
      <div className="text-center max-w-3xl mb-14">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
          API Performance Monitor
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed">
          Monitor, analyze, and optimize your API performance with real-time metrics and intelligent alerting
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mb-14">
        <Link href="/open-project" className="flex-1">
          <Button
            variant="default"
            size="lg"
            className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
          >
            → Open Project
          </Button>
        </Link>

        <Link href="/create" className="flex-1">
          <Button
            variant="outline"
            size="lg"
            className="w-full h-12 text-base font-medium border-slate-300 bg-white/70 hover:bg-white transition-all"
          >
            + Create Project
          </Button>
        </Link>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl w-full">
        <Card className="text-center border-slate-200 bg-white/80 backdrop-blur shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <div className="text-4xl mb-3">📊</div>
            <CardTitle className="text-lg">Real-time Metrics</CardTitle>
            <CardDescription className="text-sm">
              Track API performance
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="text-center border-slate-200 bg-white/80 backdrop-blur shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <div className="text-4xl mb-3">🚨</div>
            <CardTitle className="text-lg">Smart Alerts</CardTitle>
            <CardDescription className="text-sm">
              Get notified fast
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="text-center border-slate-200 bg-white/80 backdrop-blur shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <div className="text-4xl mb-3">📈</div>
            <CardTitle className="text-lg">Analytics</CardTitle>
            <CardDescription className="text-sm">
              Deep insights
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
