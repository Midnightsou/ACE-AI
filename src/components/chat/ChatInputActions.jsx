import DictationButton from './DictationButton'

export default function ChatInputActions({ value, onChange, disabled, onVoiceClick }) {
  return (
    <>
      <DictationButton value={value} onChange={onChange} disabled={disabled} />
      {onVoiceClick && (
        <button
          type="button"
          onClick={onVoiceClick}
          disabled={disabled}
          title="Start voice call"
          aria-label="Start voice call"
          className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-400 hover:text-violet-600 transition-colors flex-shrink-0 mb-1 disabled:opacity-40"
        >
          <span className="text-lg leading-none" aria-hidden="true">💭</span>
        </button>
      )}
    </>
  )
}
