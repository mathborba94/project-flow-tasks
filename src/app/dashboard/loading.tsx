export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-xs text-zinc-500 font-medium">Carregando...</p>
      </div>
    </div>
  )
}
