type StatsCardsProps = {
  stats: { total: number; published: number; unpublished: number };
};

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="mb-3 text-[13px] text-muted-foreground">전체 포스트</p>
        <p className="font-mono text-[40px] font-bold leading-none tracking-tight text-foreground">
          {stats.total}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="mb-3 text-[13px] text-muted-foreground">공개</p>
        <p className="font-mono text-[40px] font-bold leading-none tracking-tight text-primary">
          {stats.published}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="mb-3 text-[13px] text-muted-foreground">비공개</p>
        <p className="font-mono text-[40px] font-bold leading-none tracking-tight text-muted-foreground">
          {stats.unpublished}
        </p>
      </div>
    </div>
  );
}
