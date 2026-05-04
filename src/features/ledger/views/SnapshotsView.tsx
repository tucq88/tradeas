import { SnapshotForm } from '../snapshots/SnapshotForm';
import { SnapshotList } from '../snapshots/SnapshotList';

export function SnapshotsView() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <section className="flex flex-col gap-3">
        <h3 className="text-fg-2 text-xs uppercase tracking-wide">add snapshot</h3>
        <SnapshotForm />
      </section>
      <section className="flex flex-col gap-3">
        <h3 className="text-fg-2 text-xs uppercase tracking-wide">snapshot history</h3>
        <SnapshotList />
      </section>
    </div>
  );
}
