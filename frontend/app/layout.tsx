import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
