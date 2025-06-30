"use client"

import { cn } from "@/lib/utils"

const steps = [
  { id: "draft", label: "Draft" },
  { id: "submitted", label: "Submitted" },
  { id: "approved", label: "Approved" },
  { id: "hr-checked", label: "HR Checked" },
  { id: "paid", label: "Paid" },
]

interface ProgressTrackerProps {
  currentStatus: string
}

export function ProgressTracker({ currentStatus }: ProgressTrackerProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStatus)

  return (
    <div className="flex items-center space-x-4">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex

        return (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                isCompleted
                  ? "bg-green-500 text-white"
                  : isCurrent
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-600",
              )}
            >
              {index + 1}
            </div>
            <p
              className={cn(
                "ml-2 text-sm",
                isCurrent ? "font-bold text-gray-900" : "text-gray-500",
              )}
            >
              {step.label}
            </p>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "ml-4 h-0.5 w-8",
                  isCompleted ? "bg-green-500" : "bg-gray-200",
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
