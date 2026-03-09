import { Skeleton } from '../ui/skeleton'

export default function GameBoardSkeleton() {
  return (
    <div>
      <div className="flex w-full flex-col gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="flex gap-3" key={index}>
            <Skeleton className="h-[201px] w-[201px] flex-1" />
            <Skeleton className="h-[201px] w-[201px]" />
            <Skeleton className="h-[201px] w-[201px]" />
          </div>
        ))}
      </div>
    </div>
  )
}
