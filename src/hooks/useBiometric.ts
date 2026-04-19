import { useCallback } from 'react'
import supabase from '../api/supabase'

interface BiometricRegistrationResult {
  credentialId: string
  publicKey: string
}

const base64urlEncode = (buffer: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

const base64urlDecode = (str: string): Uint8Array => {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4)
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  return new Uint8Array(binary.split('').map(c => c.charCodeAt(0)))
}

export const useBiometric = () => {
  const isSupported = useCallback((): boolean => {
    return !!(window.PublicKeyCredential && navigator.credentials)
  }, [])

  /** Register a new WebAuthn credential for the current user */
  const register = useCallback(async (userId: string, username: string): Promise<BiometricRegistrationResult> => {
    if (!isSupported()) throw new Error('WebAuthn not supported on this device')

    const challenge = crypto.getRandomValues(new Uint8Array(32))

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Attendance Pro', id: window.location.hostname },
        user: {
          id: new TextEncoder().encode(userId),
          name: username,
          displayName: username,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256
          { alg: -257, type: 'public-key' },  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          requireResidentKey: false,
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'none',
      },
    }) as PublicKeyCredential

    if (!credential) throw new Error('Failed to create credential')

    const response = credential.response as AuthenticatorAttestationResponse
    const credentialId = base64urlEncode(credential.rawId)
    const publicKey = base64urlEncode(response.getPublicKey()!)

    // Store in Supabase
    const { error } = await supabase.from('webauthn_credentials').insert({
      user_id: userId,
      credential_id: credentialId,
      public_key: publicKey,
      sign_count: 0,
      device_name: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop',
    })
    if (error) throw error

    return { credentialId, publicKey }
  }, [isSupported])

  /** Verify biometric identity for an already-registered user */
  const verify = useCallback(async (userId: string): Promise<boolean> => {
    if (!isSupported()) throw new Error('WebAuthn not supported on this device')

    // Fetch stored credentials for this user
    const { data: creds, error } = await supabase
      .from('webauthn_credentials')
      .select('credential_id')
      .eq('user_id', userId)

    if (error || !creds?.length) throw new Error('No biometric credentials found. Please register first.')

    const challenge = crypto.getRandomValues(new Uint8Array(32))

    const allowCredentials = creds.map(c => ({
      id: base64urlDecode(c.credential_id).buffer as ArrayBuffer,
      type: 'public-key' as const,
    }))

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials,
        userVerification: 'required',
        timeout: 60000,
      },
    }) as PublicKeyCredential

    return !!assertion
  }, [isSupported])

  /** Check if the current user has any biometric credentials registered */
  const hasCredential = useCallback(async (userId: string): Promise<boolean> => {
    const { count, error } = await supabase
      .from('webauthn_credentials')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    if (error) return false
    return (count ?? 0) > 0
  }, [])

  return { isSupported, register, verify, hasCredential }
}
