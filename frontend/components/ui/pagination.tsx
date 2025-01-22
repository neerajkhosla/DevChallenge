import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between px-2 py-3">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium",
            currentPage === 1 
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-50"
          )}
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            "relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium",
            currentPage === totalPages
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-50"
          )}
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={cn(
                "relative inline-flex items-center rounded-l-md px-2 py-2",
                currentPage === 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-5 w-5" />
            </button>
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={cn(
                    "relative inline-flex items-center px-4 py-2 text-sm font-semibold",
                    currentPage === page
                      ? "z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  )}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={cn(
                "relative inline-flex items-center rounded-r-md px-2 py-2",
                currentPage === totalPages
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
} 