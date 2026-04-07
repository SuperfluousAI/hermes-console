import type { HermesQueryResult, HermesQueryStatus, SnapshotEnvelope, SnapshotMeta } from '@hermes-console/runtime';

export const createSnapshotMeta = ({
  capturedAt,
  dataStatus
}: {
  capturedAt: string | null;
  dataStatus: HermesQueryStatus;
}): SnapshotMeta => ({
  capturedAt,
  dataStatus
});

export const createLiveSnapshotEnvelope = <T>({ result }: { result: HermesQueryResult<T> }): SnapshotEnvelope<T> => ({
  data: result.data,
  issues: result.issues,
  meta: createSnapshotMeta({
    capturedAt: result.capturedAt,
    dataStatus: result.status
  })
});
