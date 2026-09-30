import { useEffect } from "react"
import type { ReactNode } from "react"
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import type {
  ColumnDef,
  PaginationState,
  RowData,
  SortingState,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { useDashboardSearch } from "@/lib/dashboard-search"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
})

export type ClinicTableFeatures = typeof features

export function ClinicTable<TData extends RowData>({
  data,
  columns,
  searchColumn,
  searchPlaceholder,
  emptyMessage,
  onRowClick,
  toolbar,
}: {
  data: TData[]
  columns: ColumnDef<ClinicTableFeatures, TData>[]
  searchColumn: string
  searchPlaceholder: string
  emptyMessage: string
  onRowClick?: (row: TData) => void
  toolbar?: ReactNode
}) {
  const { search, updateSearch } = useDashboardSearch()
  const sorting: SortingState =
    search.sort &&
    columns.some(
      (column) =>
        column.id === search.sort ||
        ("accessorKey" in column && column.accessorKey === search.sort)
    )
      ? [{ id: search.sort, desc: search.order === "desc" }]
      : []
  const columnFilters = search.q ? [{ id: searchColumn, value: search.q }] : []
  const pagination: PaginationState = {
    pageIndex: (search.page ?? 1) - 1,
    pageSize: 20,
  }
  const table = useTable({
    features,
    data,
    columns,
    enableMultiSort: false,
    autoResetPageIndex: false,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater
      updateSearch({
        sort: next[0]?.id,
        order: next[0] ? (next[0].desc ? "desc" : "asc") : undefined,
        page: undefined,
      })
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater
      updateSearch({
        page: next.pageIndex === 0 ? undefined : next.pageIndex + 1,
      })
    },
    state: { sorting, columnFilters, pagination },
  })
  const pageCount = Math.max(1, table.getPageCount())
  useEffect(() => {
    if ((search.page ?? 1) > pageCount) {
      updateSearch({ page: pageCount === 1 ? undefined : pageCount }, true)
    }
  }, [search.page, pageCount, updateSearch])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="w-full bg-card sm:w-78">
          <InputGroupAddon>
            <img src="/icons/search.svg" alt="" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={search.q ?? ""}
            onChange={(event) =>
              updateSearch(
                { q: event.target.value || undefined, page: undefined },
                true
              )
            }
          />
        </InputGroup>
        {toolbar}
      </div>
      <div className="overflow-hidden rounded-2xl bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow
                key={group.id}
                className="bg-muted/20 hover:bg-muted/20"
              >
                {group.headers.map((header) => (
                  <TableHead key={header.id} className="px-4">
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={
                    onRowClick
                      ? "cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-ring"
                      : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={() => onRowClick?.(row.original)}
                  onKeyDown={(event) => {
                    if (
                      onRowClick &&
                      event.target === event.currentTarget &&
                      (event.key === "Enter" || event.key === " ")
                    ) {
                      event.preventDefault()
                      onRowClick(row.original)
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3">
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-28 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {table.getFilteredRowModel().rows.length} records · Page{" "}
          {pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
