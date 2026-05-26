import { format } from 'date-fns'
import { BarChart3, Edit3, Eye, MoreVertical } from 'lucide-react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { boardAPI } from '../lib/api'

export default function BoardsPage() {
  const { data: boards, isLoading, error } = useQuery('boards', () => boardAPI.getBoards())
  const boardList = boards?.data?.data || []

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Loading boards...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-500">Error loading boards: {(error as any)?.message}</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-200 bg-white pb-6">
        <h1 className="font-serif text-3xl font-bold text-gray-950">Deal Boards</h1>
        <p className="mt-2 text-sm text-gray-600">Manage and track your deals across different boards</p>
      </div>

      <div className="grid grid-cols-1 gap-7 xl:grid-cols-3 md:grid-cols-2">
        {boardList.map((board: any) => (
          <div
            key={board.id}
            className="rounded-lg border border-gray-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <BarChart3 className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-gray-950">{board.name}</h2>
                  <div className="mt-2">
                    <Link
                      to={`/boards/${board.id}`}
                      className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                    >
                      {board.userPermission === 'ADMIN' || board.userPermission === 'EDITOR' ? (
                        <>
                          <Edit3 className="h-4 w-4 text-blue-500" />
                          Edit
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          View
                        </>
                      )}
                    </Link>
                  </div>
                </div>
              </div>
              <button className="rounded-md p-1 text-gray-500 hover:bg-gray-100">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>

            <p className="min-h-[2rem] text-sm text-gray-600">
              {board.description || 'Personal deal tracking and management'}
            </p>

            <div className="my-6 border-t border-gray-200" />

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Owner: </span>
                <span className="font-medium text-gray-950">{board.ownerName || 'Admin User'}</span>
              </div>
              <div className="text-xs text-gray-500">
                Last modified:{' '}
                {board.updatedAt ? format(new Date(board.updatedAt), 'yyyy-MM-dd h:mm a') : 'Not available'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {boardList.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
          <BarChart3 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900">No boards yet</h3>
          <p className="mt-2 text-sm text-gray-600">No boards are available for this account.</p>
        </div>
      )}
    </div>
  )
}
