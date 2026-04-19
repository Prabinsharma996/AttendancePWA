import { useState, useEffect, useRef } from 'react'
import { User, Fingerprint, BellRing, ExternalLink, ShieldCheck, Download, Camera, CheckCircle2, X, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useBiometric } from '../../hooks/useBiometric'
import { Button } from '../../components/Button'

export default function StaffProfile() {
  const { user, signOut } = useAuthStore()
  const { isSupported, register } = useBiometric()
  const [registering, setRegistering] = useState(false)
  const [bioSuccess, setBioSuccess] = useState<boolean | null>(null)
  
  // Face Registration State
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [faceImage, setFaceImage] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Fake state for notifications toggle
  const [pushEnabled, setPushEnabled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true)
    }
    return () => stopCamera()
  }, [])

  const handleRegisterBiometrics = async () => {
    if (!user) return
    setRegistering(true)
    try {
      await register(user.id, user.full_name)
      setBioSuccess(true)
      setTimeout(() => setBioSuccess(null), 3000)
    } catch (err: any) {
      console.error(err)
      setBioSuccess(false)
    } finally {
      setRegistering(false)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsCameraOpen(true)
    } catch (err) {
      alert("Could not access camera. Please check permissions.")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraOpen(false)
  }

  const captureFace = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
        setFaceImage(canvas.toDataURL('image/jpeg'))
        stopCamera()
        // Here you would upload the image to Supabase storage to use for AI Face verification
      }
    }
  }

  const handleInstallClick = () => {
    alert("In a real environment, this triggers the PWA install prompt event.")
  }

  return (
    <div className="flex flex-col min-h-full pb-20 bg-slate-950">
      
      {/* Header Profile Info */}
      <div className="bg-slate-900 border-b border-slate-800 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 rounded-br-full blur-2xl"></div>
        
        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-3xl font-bold text-white border-2 border-slate-700 shadow-xl mb-4 relative z-10 overflow-hidden">
          {faceImage ? (
            <img src={faceImage} alt="Face" className="w-full h-full object-cover" />
          ) : (
            user?.full_name?.charAt(0).toUpperCase()
          )}
        </div>
        
        <h1 className="text-xl font-bold text-white tracking-tight relative z-10">{user?.full_name}</h1>
        <p className="text-slate-400 text-sm font-medium relative z-10">{user?.email}</p>
        
        <div className="mt-4 px-4 py-1.5 bg-slate-800 rounded-full border border-slate-700/50 flex items-center gap-2 relative z-10">
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{user?.department || 'Employee'}</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        
        {/* Face Registration Panel */}
        <div className="glass rounded-2xl p-5 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Face Recognition</h2>
          </div>
          
          {isCameraOpen ? (
            <div className="relative rounded-xl overflow-hidden mb-4 bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-48 object-cover scale-x-[-1]" />
              <div className="absolute inset-x-0 bottom-4 flex justify-center gap-4">
                <button onClick={stopCamera} className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg">
                  <X className="w-6 h-6" />
                </button>
                <button onClick={captureFace} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900 border-4 border-slate-300/50 shadow-lg" title="Capture Photo">
                  <Camera className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                Add your face photo to enable AI-based attendance verification at the office.
              </p>
              <button
                onClick={startCamera}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                {faceImage ? 'Update Face Photo' : 'Register Face Photo'}
              </button>
              {faceImage && <p className="text-emerald-400 text-xs text-center mt-3 font-medium flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" /> Face photo registered</p>}
            </>
          )}
        </div>

        {/* Biometrics Panel */}
        <div className="glass rounded-2xl p-5 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Fingerprint className="w-4 h-4" />
            </div>
            <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Device Biometric</h2>
          </div>
          
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">
            Link your phone's native Fingerprint or FaceID to securely confirm check-ins.
          </p>

          <button
            onClick={handleRegisterBiometrics}
            disabled={registering}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
          >
            {registering ? 'Waiting for device...' : 'Enroll Device Biometric'}
          </button>
          
          {bioSuccess === true && <p className="text-emerald-400 text-xs text-center mt-3 font-medium">Successfully registered credentials!</p>}
          {bioSuccess === false && <p className="text-red-400 text-xs text-center mt-3 font-medium">Failed to register or cancelled.</p>}
        </div>

        {/* Preferences Panel */}
        <div className="glass rounded-2xl p-5 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <BellRing className="w-4 h-4" />
            </div>
            <h2 className="text-white font-semibold text-sm uppercase tracking-wider">App Preferences</h2>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800 mb-3">
             <div>
               <p className="text-sm font-medium text-white">Push Notifications</p>
               <p className="text-[10px] text-slate-500 mt-0.5">Alerts for leaves & attendance</p>
             </div>
             <button 
               onClick={() => setPushEnabled(!pushEnabled)}
               className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${pushEnabled ? 'bg-sky-500' : 'bg-slate-700'}`}
               title="Toggle Notifications"
             >
               <div className={`w-5 h-5 rounded-full bg-white absolute top-[2px] transition-transform ${pushEnabled ? 'translate-x-[26px]' : 'translate-x-[2px]'}`}></div>
             </button>
          </div>

          {!isStandalone && (
            <button 
              onClick={handleInstallClick}
              className="w-full p-3 bg-slate-900/50 hover:bg-slate-800/80 rounded-xl border border-slate-800 flex items-center justify-between transition-colors"
            >
               <div className="text-left">
                 <p className="text-sm font-medium text-white">Install App</p>
                 <p className="text-[10px] text-slate-500 mt-0.5">Add AttendX to home screen</p>
               </div>
               <Download className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>

        <div className="px-4 pb-6">
           <button 
             onClick={() => signOut()}
             className="w-full flex items-center justify-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 font-bold hover:bg-red-500/20 transition-all active:scale-[0.98]"
           >
             <LogOut className="w-5 h-5" />
             Sign Out of Account
           </button>
        </div>

        <div className="text-center py-6">
          <p className="text-xs text-slate-600 font-medium tracking-widest uppercase">AttendX v2.4</p>
        </div>
      </div>
    </div>
  )
}
