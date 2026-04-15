'use client'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type User } from '@supabase/supabase-js'

interface ProfileEditFormProps {
  user: User | null
  onSuccess?: () => void
  compact?: boolean
}

export default function ProfileEditForm({ user, onSuccess, compact = false }: ProfileEditFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)

  const [first_name, setFirstName] = useState<string | null>(null)
  const [middle_name, setMiddleName] = useState<string | null>(null)
  const [last_name, setLastName] = useState<string | null>(null)
  const [university, setUniversity] = useState<string | null>(null)
  const [college, setCollege] = useState<string | null>(null)
  const [department, setDepartment] = useState<string | null>(null)
  const [contact_number, setContactNumber] = useState<string | null>(null)
  const [position, setPosition] = useState<string | null>(null)
  const [scopus_author_id, setScopusAuthorId] = useState<string | null>(null)

  const [email, setEmail] = useState<string | null>(null)
  const [signaturePath, setSignaturePath] = useState<string | null>(null)
  const [newSignatureFile, setNewSignatureFile] = useState<File | null>(null)

  const [affiliationPath, setAffiliationPath] = useState<string | null>(null)
  const [newAffiliationFile, setNewAffiliationFile] = useState<File | null>(null)

  const [isEditing, setIsEditing] = useState(false)

  const getProfile = useCallback(async () => {
    try {
      setLoading(true)

      if (!user?.id) {
        console.log('No user ID available')
        return
      }

      const { data, error, status } = await supabase
        .from('users')
        .select(`first_name, middle_name, last_name, email, university, college, department, contact_number, position, signature_path, affiliation_path, scopus_author_id`)
        .eq('id', user?.id)
        .single()

      if (error && status !== 406) {
        console.error('Profile fetch error:', error)
        throw error
      }

      if (data) {
        setFirstName(data.first_name)
        setMiddleName(data.middle_name)
        setLastName(data.last_name)
        setEmail(data.email)
        setUniversity(data.university)
        setCollege(data.college)
        setDepartment(data.department)
        setContactNumber(data.contact_number)
        setPosition(data.position)
        setScopusAuthorId(data.scopus_author_id)
        
        // Load signature with signed URL if it exists
        if (data.signature_path && user?.id) {
          const filePath = `${user.id}/${user.id}.png`
          const { data: signedUrlData, error: signedError } = await supabase.storage
            .from('signatures')
            .createSignedUrl(filePath, 3600)
          
          if (!signedError && signedUrlData) {
            setSignaturePath(signedUrlData.signedUrl)
          }
        }

        if (data.affiliation_path && user?.id) {
          const filePath = `${user.id}/${user.id}.png`
          const { data: signedUrlData, error: signedError } = await supabase.storage
            .from('proof-of-affiliation')
            .createSignedUrl(filePath, 3600)
          
          if (!signedError && signedUrlData) {
            setAffiliationPath(signedUrlData.signedUrl)
          }
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error)
      console.error('Error loading user data:', errorMsg)
      alert(`Error loading user data! ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    getProfile()
  }, [user, getProfile])

  async function updateProfile() {
    try {
      setLoading(true)
      
      let signatureUrl = null
      let affiliationUrl = null
      
      // Upload new signature if one was selected
      if (newSignatureFile && user?.id) {
        const fileExt = 'png'
        const fileName = `${user.id}.${fileExt}`
        const filePath = `${user.id}/${fileName}`
        
        // Upload signature (upsert to replace existing)
        const { error: uploadError } = await supabase.storage
          .from('signatures')
          .upload(filePath, newSignatureFile, {
            contentType: 'image/png',
            upsert: true,
          })
        
        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error('Failed to upload signature')
        }
        
        // Get the storage path (not full URL)
        signatureUrl = filePath
      }
      
      // Upload new proof of affiliation if one was selected
      if (newAffiliationFile && user?.id) {
        const fileExt = 'png'
        const fileName = `${user.id}.${fileExt}`
        const filePath = `${user.id}/${fileName}`
        
        // Upload affiliation (upsert to replace existing)
        const { error: uploadError } = await supabase.storage
          .from('proof-of-affiliation')
          .upload(filePath, newAffiliationFile, {
            contentType: 'image/png',
            upsert: true,
          })
        
        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error('Failed to upload proof of affiliation')
        }
        
        // Get the storage path (not full URL)
        affiliationUrl = filePath
      }

      const updateData: any = {
        id: user?.id as string,
        first_name: first_name,
        middle_name: middle_name,
        last_name: last_name,
        email: user?.email,
        university: university,
        college: college,
        department: department,
        contact_number: contact_number,
        position: position,
        scopus_author_id: scopus_author_id,
      }
      
      // Only update signature_path if a new signature was uploaded
      if (signatureUrl) {
        updateData.signature_path = signatureUrl
      }

      if (affiliationUrl) {
        updateData.affiliation_path = affiliationUrl
      }

      const { error } = await supabase.from('users').upsert(updateData)
      if (error) {
        console.error('Supabase error:', error)
        throw new Error(error.message || 'Unknown Supabase error')
      }
      alert('Profile updated!')
      setIsEditing(false)
      setNewSignatureFile(null)
      setNewAffiliationFile(null)
      await getProfile() // Reload to get new signed URL
      onSuccess?.()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error)
      console.error('Profile update error:', errorMsg)
      alert(`Error updating the data! ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    // Compact version for dashboard profile
    return (
      <div>
        {!isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 uppercase">Email</label>
              <p className="text-white font-semibold">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 uppercase">Full Name</label>
              <p className="text-white font-semibold">
                {`${first_name || ''} ${last_name || ''}`.trim() || 'Not set'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500 uppercase">Scopus Author ID</label>
              <p className="text-white font-semibold">{scopus_author_id}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 uppercase">University</label>
              <p className="text-white font-semibold">{university}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 uppercase">College</label>
              <p className="text-white font-semibold">{college}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 uppercase">Department</label>
              <p className="text-white font-semibold">{department}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 uppercase">Contact Number</label>
              <p className="text-white font-semibold">{contact_number}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 uppercase">Position</label>
              <p className="text-white font-semibold">{position}</p>
            </div>
            {signaturePath && (
              <div>
                <label className="text-sm text-gray-500 uppercase">Signature</label>
                <img src={signaturePath} alt="Signature" className="mt-2 max-w-xs border border-gray-600 rounded-lg bg-white p-2" />
              </div>
            )}

            {affiliationPath && (
              <div>
                <label className="text-sm text-gray-500 uppercase">Proof of Affiliation</label>
                <img src={affiliationPath} alt="Affiliation" className="mt-2 max-w-xs border border-gray-600 rounded-lg bg-white p-2" />
              </div>
            )}

            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <div className="space-y-4 bg-[#0f1117] p-4 rounded-lg border border-gray-600">
            <div>
              <label htmlFor="email-compact" className="block text-sm text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email-compact"
                type="text"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="fullName-compact" className="block text-sm text-gray-300 mb-2">
                First Name
              </label>
              <input
                id="fullName-compact"
                type="text"
                value={first_name || ''}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2 bg-[#1b1e2b] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="fullName-compact" className="block text-sm text-gray-300 mb-2">
                Middle Name
              </label>
              <input
                id="fullName-compact"
                type="text"
                value={middle_name || ''}
                onChange={(e) => setMiddleName(e.target.value)}
                className="w-full px-4 py-2 bg-[#1b1e2b] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="fullName-compact" className="block text-sm text-gray-300 mb-2">
                Last Name
              </label>
              <input
                id="fullName-compact"
                type="text"
                value={last_name || ''}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2 bg-[#1b1e2b] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="fullName-compact" className="block text-sm text-gray-300 mb-2">
                University
              </label>
              <input
                id="fullName-compact"
                type="text"
                value={university || ''}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full px-4 py-2 bg-[#1b1e2b] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="fullName-compact" className="block text-sm text-gray-300 mb-2">
                College
              </label>
              <input
                id="fullName-compact"
                type="text"
                value={college || ''}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full px-4 py-2 bg-[#1b1e2b] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="fullName-compact" className="block text-sm text-gray-300 mb-2">
                Department
              </label>
              <input
                id="fullName-compact"
                type="text"
                value={department || ''}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2 bg-[#1b1e2b] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="fullName-compact" className="block text-sm text-gray-300 mb-2">
                Contact Number
              </label>
              <input
                id="fullName-compact"
                type="text"
                value={contact_number || ''}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full px-4 py-2 bg-[#1b1e2b] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="fullName-compact" className="block text-sm text-gray-300 mb-2">
                Position
              </label>
              <input
                id="fullName-compact"
                type="text"
                value={position || ''}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-4 py-2 bg-[#1b1e2b] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="scopus-id-compact" className="block text-sm text-gray-300 mb-2">
                Scopus Author ID
              </label>
              <input
                id="scopus-id-compact"
                type="text"
                value={scopus_author_id || ''}
                onChange={(e) => setScopusAuthorId(e.target.value)}
                placeholder="Enter your Scopus author ID"
                className="w-full px-4 py-2 bg-[#1b1e2b] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="signature-compact" className="block text-sm text-gray-300 mb-2">
                Signature (PNG)
              </label>
              {signaturePath && (
                <div className="mb-2">
                  <p className="text-xs text-gray-400 mb-2">Current signature:</p>
                  <img src={signaturePath} alt="Current Signature" className="max-w-xs border border-gray-600 rounded-lg bg-white p-2 mb-2" />
                </div>
              )}
              <input
                id="signature-compact"
                type="file"
                accept=".png,image/png"
                onChange={(e) => setNewSignatureFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 bg-[#0f1117] border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition"
              />
              <p className="text-xs text-gray-400 mt-1">Upload a new PNG to replace current signature</p>
            </div>
          
            <div>
              <label htmlFor="affiliation-compact" className="block text-sm text-gray-300 mb-2">
                Proof of Affiliation (PNG)
              </label>
              {affiliationPath && (
                <div className="mb-2">
                  <p className="text-xs text-gray-400 mb-2">Current Proof of Affiliation:</p>
                  <img src={affiliationPath} alt="Current Proof of Affiliation" className="max-w-xs border border-gray-600 rounded-lg bg-white p-2 mb-2" />
                </div>
              )}
              <input
                id="affiliation-compact"
                type="file"
                accept=".png,image/png"
                onChange={(e) => setNewAffiliationFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 bg-[#0f1117] border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition"
              />
              <p className="text-xs text-gray-400 mt-1">Upload a new PNG to replace current signature</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={updateProfile}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg transition"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                disabled={loading}
                className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white px-4 py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Full version for account page
  return (
    <div className="form-widget space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
          Email
        </label>
        <input
          id="email"
          type="text"
          value={user?.email || ''}
          disabled
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
        />
      </div>
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
          First Name
        </label>
        <input
          id="fullName"
          type="text"
          value={first_name || ''}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full px-4 py-2 bg-[#1b1e2b] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
        />
      </div>
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
          Middle Name
        </label>
        <input
          id="fullName"
          type="text"
          value={middle_name || ''}
          onChange={(e) => setMiddleName(e.target.value)}
          className="w-full px-4 py-2 bg-[#1b1e2b] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
        />
      </div>
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
          Last Name
        </label>
        <input
          id="fullName"
          type="text"
          value={last_name || ''}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full px-4 py-2 bg-[#1b1e2b] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
        />
      </div>

      <div>
        <label htmlFor="scopus-id" className="block text-sm font-medium text-gray-300 mb-2">
          Scopus Author ID
        </label>
        <input
          id="scopus-id"
          type="text"
          value={scopus_author_id || ''}
          onChange={(e) => setScopusAuthorId(e.target.value)}
          placeholder="Enter your Scopus author ID"
          className="w-full px-4 py-2 bg-[#1b1e2b] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
        />
      </div>

      <div>
        <label htmlFor="signature" className="block text-sm font-medium text-gray-300 mb-2">
          Signature (PNG)
        </label>
        {signaturePath && (
          <div className="mb-2">
            <p className="text-xs text-gray-400 mb-2">Current signature:</p>
            <img src={signaturePath} alt="Current Signature" className="max-w-xs border border-gray-600 rounded-lg bg-white p-2 mb-2" />
          </div>
        )}
        <input
          id="signature"
          type="file"
          accept=".png,image/png"
          onChange={(e) => setNewSignatureFile(e.target.files?.[0] || null)}
          className="w-full px-4 py-2 bg-[#0f1117] border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition"
        />
        {newSignatureFile && (
          <p className="text-xs text-green-400 mt-1">New signature selected: {newSignatureFile.name}</p>
        )}
        {!signaturePath && !newSignatureFile && (
          <p className="text-xs text-gray-400 mt-1">No signature uploaded yet</p>
        )}
      </div>

      <div>
        <label htmlFor="affiliation" className="block text-sm font-medium text-gray-300 mb-2">
          Proof of Affiliation (PNG)
        </label>
        {affiliationPath && (
          <div className="mb-2">
            <p className="text-xs text-gray-400 mb-2">Current Proof of Affiliation:</p>
            <img src={affiliationPath} alt="Current Proof of Affiliation" className="max-w-xs border border-gray-600 rounded-lg bg-white p-2 mb-2" />
          </div>
        )}
        <input
          id="affiliation"
          type="file"
          accept=".png,image/png"
          onChange={(e) => setNewAffiliationFile(e.target.files?.[0] || null)}
          className="w-full px-4 py-2 bg-[#0f1117] border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition"
        />
        {newAffiliationFile && (
          <p className="text-xs text-green-400 mt-1">New proof of affiliation selected: {newAffiliationFile.name}</p>
        )}
        {!affiliationPath && !newAffiliationFile && (
          <p className="text-xs text-gray-400 mt-1">No proof of affiliation uploaded yet</p>
        )}
      </div>

      <button
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-2 rounded-lg transition w-full"
        onClick={updateProfile}
        disabled={loading}
      >
        {loading ? 'Saving ...' : 'Update Profile'}
      </button>
    </div>
  )
}
