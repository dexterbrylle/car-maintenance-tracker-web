import { ServiceScheduler } from "@/components/ServiceScheduler"

export function ServiceSchedulerPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Service Scheduler</h1>
          <p className="text-muted-foreground">
            Plan and track your vehicle maintenance schedule based on manufacturer recommendations
          </p>
        </div>
        <ServiceScheduler />
      </div>
    </div>
  )
}