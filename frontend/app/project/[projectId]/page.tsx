// app/project/[projectId]/page.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PageProps {
  params: Promise<{
    projectId: string
  }>
}

export default async function ProjectHome({ params }: PageProps) {
  const { projectId } = await params
  
  const features = [
    {
      icon: "📋",
      title: "Policies",
      description: "Create and manage alert rules. Define thresholds for metrics like latency and error rate to get notified when performance issues occur.",
    },
    {
      icon: "🚨",
      title: "Alerts",
      description: "View all triggered alerts and their history. Track when policies are breached and see alert details.",
    },
    {
      icon: "📊",
      title: "Metrics",
      description: "Check raw, real-time performance data from your API. This includes detailed records of every metric point collected.",
    },
    {
      icon: "📈",
      title: "Aggregated",
      description: "View time-bucketed statistics (1 min, 5 min, 1 hour). Great for spotting trends and patterns over time.",
    },
  ]

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-4xl">Project Dashboard</CardTitle>
          <CardDescription className="text-base mt-2">
            Project ID: <span className="font-mono font-bold text-slate-700">{projectId}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg text-slate-700"><strong>👋 Welcome to your API Performance Monitor!</strong></p>
          <p className="text-slate-600 leading-relaxed">
            Use the navigation buttons above to manage your API performance monitoring. Each section helps you track and optimize different aspects of your system.
          </p>
          <ul className="space-y-4">
            {features.map((feature) => (
              <li key={feature.title} className="flex gap-4">
                <span className="text-3xl flex-shrink-0">{feature.icon}</span>
                <div>
                  <strong className="text-slate-900 text-lg">{feature.title}</strong>
                  <p className="text-slate-600 mt-1">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature) => (
          <Card key={feature.title} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="text-4xl mb-3">{feature.icon}</div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">{feature.description.split('. ')[0]}.</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}