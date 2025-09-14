import { Badge } from "@/components/ui/badge"

interface StatusBadgeProps {
  status: "due_now" | "due_soon" | "ok"
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "due_now":
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          Due Now
        </Badge>
      )
    case "due_soon":
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          Due Soon
        </Badge>
      )
    default:
      return (
        <Badge variant="default" className="flex items-center gap-1">
          OK
        </Badge>
      )
  }
}