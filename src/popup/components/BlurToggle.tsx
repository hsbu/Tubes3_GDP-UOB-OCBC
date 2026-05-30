export interface ToggleProps {
  enabled: boolean;
  onToggle: () => void;
  onLabel: string;
  offLabel: string;
}

export function BlurToggle({ enabled, onToggle, onLabel, offLabel }: ToggleProps) {
  return (
    <button
      class={`action-btn${enabled ? ' active' : ''}`}
      onClick={onToggle}
    >
      {enabled ? onLabel : offLabel}
    </button>
  );
}
