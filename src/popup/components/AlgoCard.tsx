interface Props {
  name: string;
  hits: number;
  ms: number;
}

export function AlgoCard({ name, hits, ms }: Props) {
  return (
    <div class="algo-card">
      <div class="algo-name">{name}</div>
      <div class="algo-hits">{hits}</div>
      <div class="algo-ms">{ms.toFixed(1)}ms</div>
    </div>
  );
}
