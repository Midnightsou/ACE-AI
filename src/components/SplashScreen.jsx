import { useEffect, useRef, useState } from 'react'

export default function SplashScreen({ onComplete }) {
  const [isExiting, setIsExiting] = useState(false)
  const videoRef = useRef(null)

  const handleVideoEnd = () => {
    setIsExiting(true)
    setTimeout(() => onComplete?.(), 500) // Allow fade-out animation
  }

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.addEventListener('ended', handleVideoEnd)
      return () => video.removeEventListener('ended', handleVideoEnd)
    }
  }, [])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-500
        ${isExiting ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Opening animation video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="relative z-10 transition-all duration-700"
        style={{
          width: '240px',
          height: '240px',
          objectFit: 'contain',
          opacity: isExiting ? 0 : 1,
        }}
      >
        <source src="/opening scene.mp4" type="video/mp4" />
      </video>
    </div>
  )
}