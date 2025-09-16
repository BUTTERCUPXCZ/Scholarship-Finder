import { useMemo, useCallback, useRef, useEffect, useState } from 'react'

// ✅ Simple debounce implementation to avoid external dependency
const debounce = <T extends (...args: any[]) => any>(
    func: T,
    delay: number
): T => {
    let timeoutId: NodeJS.Timeout
    return ((...args: Parameters<T>) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func(...args), delay)
    }) as T
}

// ✅ Algorithmic optimization utilities for better performance

// ✅ Debounced search hook - reduces API calls by delaying execution
export const useDebounce = <T>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}

// ✅ Advanced debounced callback hook - O(1) complexity for function creation
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
    callback: T,
    delay: number,
    deps: React.DependencyList = []
): T => {
    const callbackRef = useRef(callback)
    callbackRef.current = callback

    return useMemo(
        () =>
            debounce((...args: Parameters<T>) => {
                callbackRef.current(...args)
            }, delay) as T,
        [delay, ...deps] // eslint-disable-line react-hooks/exhaustive-deps
    )
}

// ✅ Memoized filter function with O(n) complexity instead of O(n²)
export const useOptimizedFilter = <T>(
    items: T[],
    filterFn: (item: T) => boolean,
    deps: React.DependencyList = []
) => {
    return useMemo(() => {
        if (!items || items.length === 0) return []

        // ✅ Use efficient single-pass filtering
        return items.filter(filterFn)
    }, [items, ...deps]) // eslint-disable-line react-hooks/exhaustive-deps
}

// ✅ Memoized search function with optimized string matching
export const useOptimizedSearch = <T>(
    items: T[],
    searchTerm: string,
    searchFields: (keyof T)[],
    options: {
        caseSensitive?: boolean
        exactMatch?: boolean
        minSearchLength?: number
    } = {}
) => {
    const { caseSensitive = false, exactMatch = false, minSearchLength = 0 } = options

    return useMemo(() => {
        if (!items || items.length === 0) return []
        if (!searchTerm || searchTerm.length < minSearchLength) return items

        const normalizedSearchTerm = caseSensitive ? searchTerm : searchTerm.toLowerCase()

        return items.filter(item => {
            return searchFields.some(field => {
                const fieldValue = item[field]
                if (typeof fieldValue !== 'string') return false

                const normalizedFieldValue = caseSensitive ? fieldValue : fieldValue.toLowerCase()

                if (exactMatch) {
                    return normalizedFieldValue === normalizedSearchTerm
                }

                // ✅ Use includes for partial matching - O(n) complexity
                return normalizedFieldValue.includes(normalizedSearchTerm)
            })
        })
    }, [items, searchTerm, searchFields, caseSensitive, exactMatch, minSearchLength])
}

// ✅ Optimized sorting hook with stable sort algorithm
export const useOptimizedSort = <T>(
    items: T[],
    sortBy: string | null,
    sortOrder: 'asc' | 'desc' = 'asc',
    customSortFn?: (a: T, b: T, sortBy: string) => number
) => {
    return useMemo(() => {
        if (!items || items.length === 0 || !sortBy) return items

        // ✅ Create a copy to avoid mutating original array
        const sortedItems = [...items]

        sortedItems.sort((a, b) => {
            if (customSortFn) {
                const result = customSortFn(a, b, sortBy)
                return sortOrder === 'desc' ? -result : result
            }

            // ✅ Generic sorting logic
            const aValue = (a as any)[sortBy]
            const bValue = (b as any)[sortBy]

            // Handle different data types efficiently
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                const result = aValue.localeCompare(bValue)
                return sortOrder === 'desc' ? -result : result
            }

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                const result = aValue - bValue
                return sortOrder === 'desc' ? -result : result
            }

            if (aValue instanceof Date && bValue instanceof Date) {
                const result = aValue.getTime() - bValue.getTime()
                return sortOrder === 'desc' ? -result : result
            }

            // ✅ Fallback to string comparison
            const result = String(aValue).localeCompare(String(bValue))
            return sortOrder === 'desc' ? -result : result
        })

        return sortedItems
    }, [items, sortBy, sortOrder, customSortFn])
}

// ✅ Virtualization helper for large lists - reduces DOM complexity from O(n) to O(k)
export const useVirtualization = (
    itemCount: number,
    itemHeight: number,
    containerHeight: number,
    scrollTop: number = 0
) => {
    return useMemo(() => {
        const visibleItemCount = Math.ceil(containerHeight / itemHeight)
        const startIndex = Math.floor(scrollTop / itemHeight)
        const endIndex = Math.min(startIndex + visibleItemCount + 1, itemCount)

        // ✅ Add buffer for smooth scrolling
        const bufferSize = Math.min(5, Math.floor(visibleItemCount / 4))
        const bufferedStartIndex = Math.max(0, startIndex - bufferSize)
        const bufferedEndIndex = Math.min(itemCount, endIndex + bufferSize)

        return {
            startIndex: bufferedStartIndex,
            endIndex: bufferedEndIndex,
            visibleItems: bufferedEndIndex - bufferedStartIndex,
            offsetY: bufferedStartIndex * itemHeight,
            totalHeight: itemCount * itemHeight,
        }
    }, [itemCount, itemHeight, containerHeight, scrollTop])
}

// ✅ Memoized pagination hook with O(1) slice operation
export const useOptimizedPagination = <T>(
    items: T[],
    page: number,
    itemsPerPage: number
) => {
    return useMemo(() => {
        if (!items || items.length === 0) {
            return {
                currentPageItems: [],
                totalPages: 0,
                totalItems: 0,
                hasNextPage: false,
                hasPrevPage: false,
            }
        }

        const totalItems = items.length
        const totalPages = Math.ceil(totalItems / itemsPerPage)
        const startIndex = (page - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage

        // ✅ Efficient slice operation - O(k) where k is itemsPerPage
        const currentPageItems = items.slice(startIndex, endIndex)

        return {
            currentPageItems,
            totalPages,
            totalItems,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            startIndex: startIndex + 1,
            endIndex: Math.min(endIndex, totalItems),
        }
    }, [items, page, itemsPerPage])
}

// ✅ Optimized bulk selection hook using Set for O(1) operations
export const useBulkSelection = <T extends { id: string }>(items: T[]) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    const selectedItems = useMemo(() => {
        return items.filter(item => selectedIds.has(item.id))
    }, [items, selectedIds])

    const toggleSelection = useCallback((id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id) // O(1)
            } else {
                newSet.add(id) // O(1)
            }
            return newSet
        })
    }, [])

    const selectAll = useCallback(() => {
        setSelectedIds(new Set(items.map(item => item.id)))
    }, [items])

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set())
    }, [])

    const selectMultiple = useCallback((ids: string[]) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev)
            ids.forEach(id => newSet.add(id))
            return newSet
        })
    }, [])

    const isSelected = useCallback((id: string) => {
        return selectedIds.has(id) // O(1)
    }, [selectedIds])

    return {
        selectedIds: Array.from(selectedIds),
        selectedItems,
        selectedCount: selectedIds.size,
        toggleSelection,
        selectAll,
        clearSelection,
        selectMultiple,
        isSelected,
        hasSelection: selectedIds.size > 0,
    }
}

// ✅ Optimized cache hook for expensive computations
export const useComputationCache = <T, K>(
    computeFn: (key: K) => T,
    maxCacheSize: number = 100
) => {
    const cacheRef = useRef<Map<string, { value: T; timestamp: number }>>(new Map())

    return useCallback((key: K): T => {
        const stringKey = JSON.stringify(key)
        const cached = cacheRef.current.get(stringKey)

        if (cached) {
            return cached.value
        }

        // ✅ Compute new value
        const computed = computeFn(key)

        // ✅ Cache management - LRU eviction
        if (cacheRef.current.size >= maxCacheSize) {
            // Remove oldest entry
            const oldestKey = Array.from(cacheRef.current.entries())
                .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0]
            cacheRef.current.delete(oldestKey)
        }

        cacheRef.current.set(stringKey, {
            value: computed,
            timestamp: Date.now()
        })

        return computed
    }, [computeFn, maxCacheSize])
}