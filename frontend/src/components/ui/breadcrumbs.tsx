import * as React from "react"
import { cn } from "../../lib/utils"

export interface BreadcrumbItem {
    label: string
    href?: string
    active?: boolean
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
    items: BreadcrumbItem[]
}

export function Breadcrumbs({ items, className, ...props }: BreadcrumbsProps) {
    return (
        <nav className={cn("flex items-center text-sm text-muted-foreground", className)} aria-label="Breadcrumb" {...props}>
            <ol className="inline-flex items-center space-x-1 md:space-x-2">
                {items.map((item, idx) => (
                    <li key={idx} className="inline-flex items-center">
                        {item.href && !item.active ? (
                            <a href={item.href} className="hover:underline text-blue-600">
                                {item.label}
                            </a>
                        ) : (
                            <span className="font-medium text-gray-700">{item.label}</span>
                        )}
                        {idx < items.length - 1 && (
                            <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    )
}
