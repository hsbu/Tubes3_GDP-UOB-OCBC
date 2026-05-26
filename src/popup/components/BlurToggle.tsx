interface Props {
  enabled: boolean;
  onToggle: () => void;
}

export function BlurToggle({ enabled, onToggle }: Props) {
  return (
    <button
      class={`action-btn${enabled ? ' active' : ''}`}
      onClick={onToggle}
    >
      {enabled ? 'Blur ON' : 'Blur OFF'}
    </button>
  );
}
