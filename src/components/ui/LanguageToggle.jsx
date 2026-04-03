import { useUserStore } from '../../store/userStore'
import { updateProfile } from '../../services/memory'

const languages = [
  { code: 'english', label: 'English', flag: '🇬🇧' },
  { code: 'pidgin', label: 'Pidgin', flag: '🇳🇬' },
  { code: 'yoruba', label: 'Yoruba', flag: '🟢' },
  { code: 'hausa', label: 'Hausa', flag: '🔵' },
]

export default function LanguageToggle({ onClose }) {
  const user = useUserStore((s) => s.user)
  const setUser = useUserStore((s) => s.setUser)

  const currentLanguage = user?.profile?.language || 'english'

  async function handleSelect(code) {
    if (code === currentLanguage) {
      onClose()
      return
    }

    try {
      await updateProfile(user.uid, { language: code })
      setUser({
        ...user,
        profile: { ...user.profile, language: code },
      })
    } catch (err) {
      console.error('Failed to update language:', err)
    }

    onClose()
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      <p className="text-xs text-zinc-500 px-2 pb-1 uppercase tracking-wider">
        Language
      </p>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleSelect(lang.code)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left
            ${currentLanguage === lang.code
              ? 'bg-violet-600 text-white'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
        >
          <span>{lang.flag}</span>
          <span>{lang.label}</span>
          {currentLanguage === lang.code && (
            <span className="ml-auto text-xs opacity-70">Active</span>
          )}
        </button>
      ))}
    </div>
  )
}