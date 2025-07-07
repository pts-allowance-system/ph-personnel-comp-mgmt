"use client"

import { cn } from "@/lib/utils"



interface ProgressTrackerProps {
  items: { id: string; name: string }[]
  currentStepIndex: number
}

export function ProgressTracker({ items, currentStepIndex }: ProgressTrackerProps) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {items.map((step, stepIdx) => {
          const isCompleted = stepIdx < currentStepIndex
          const isCurrent = stepIdx === currentStepIndex

          return (
            <li key={step.name} className={cn("relative", stepIdx !== items.length - 1 ? "pr-8 sm:pr-20" : "")}>
              {isCompleted ? (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-green-600" />
                  </div>
                  <a
                    href="#"
                    className="relative flex h-8 w-8 items-center justify-center rounded-full bg-green-600 hover:bg-green-900"
                  >
                    <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
                    </svg>
                  </a>
                </>
              ) : isCurrent ? (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-gray-200" />
                  </div>
                  <a
                    href="#"
                    className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-green-600 bg-white"
                    aria-current="step"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-green-600" aria-hidden="true" />
                  </a>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-gray-200" />
                  </div>
                  <a
                    href="#"
                    className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white hover:border-gray-400"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-transparent" aria-hidden="true" />
                  </a>
                </>
              )}
               <span className="absolute top-10 -ml-4 text-center text-sm font-medium text-gray-900">{step.name}</span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
