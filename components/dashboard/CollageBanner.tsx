'use client'

import { useState } from 'react'
import { Plus, X, Image, Settings } from 'lucide-react'
import type { BannerPhoto } from '@/lib/schema'

interface CollageBannerProps {
  photos: BannerPhoto[]
  onPhotosChange: (photos: BannerPhoto[]) => void
  children: React.ReactNode // greeting + quote overlay
}

export default function CollageBanner({ photos, onPhotosChange, children }: CollageBannerProps) {
  const [showManager, setShowManager] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const addPhoto = async () => {
    if (!newUrl.trim()) return
    setAdding(true)
    setError('')
    try {
      const res = await fetch('/api/banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl.trim(), position: photos.length }),
      })
      if (!res.ok) throw new Error('Failed')
      const photo = await res.json()
      onPhotosChange([...photos, photo])
      setNewUrl('')
    } catch {
      setError('Could not add photo. Make sure the URL is a direct image link.')
    } finally {
      setAdding(false)
    }
  }

  const removePhoto = async (id: number) => {
    await fetch(`/api/banner?id=${id}`, { method: 'DELETE' })
    onPhotosChange(photos.filter(p => p.id !== id))
  }

  // Collage layout: up to 5 photos in a mosaic grid
  const displayed = photos.slice(0, 5)
  const hasPhotos = displayed.length > 0

  // Grid layouts per photo count
  const getGridStyle = (count: number) => {
    if (count === 1) return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' }
    if (count === 2) return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr' }
    if (count === 3) return { gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr' }
    if (count === 4) return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' }
    return { gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '1fr 1fr' }
  }

  const getItemStyle = (index: number, count: number): React.CSSProperties => {
    if (count === 3 && index === 0) return { gridRow: 'span 2' }
    if (count === 5 && index === 0) return { gridRow: 'span 2' }
    return {}
  }

  return (
    <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>

      {/* Collage background */}
      {hasPhotos ? (
        <div style={{
          display: 'grid',
          ...getGridStyle(displayed.length),
          gap: '3px',
          height: '200px',
          width: '100%',
        }}>
          {displayed.map((photo, i) => (
            <div key={photo.id} style={{
              ...getItemStyle(i, displayed.length),
              overflow: 'hidden',
              position: 'relative',
            }}>
              <img
                src={photo.url}
                alt=""
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
                onError={e => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Placeholder when no photos */
        <div style={{
          height: '180px',
          background: 'linear-gradient(135deg, var(--accent-terra-light) 0%, var(--accent-sand-light) 50%, var(--accent-sage-light) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: '10px',
        }}>
          <Image size={32} color="var(--text-muted)" style={{ opacity: 0.4 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
            Add photos to create your collage banner
          </p>
        </div>
      )}

      {/* Warm overlay for text readability */}
      {hasPhotos && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(45,28,14,0.45) 0%, rgba(45,28,14,0.65) 100%)',
          backdropFilter: 'blur(0.5px)',
        }} />
      )}

      {/* Greeting + quote content overlay */}
      <div style={{
        position: hasPhotos ? 'absolute' : 'relative',
        inset: hasPhotos ? 0 : undefined,
        padding: hasPhotos ? '24px 28px' : '0',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        zIndex: 2,
      }}>
        {children}
      </div>

      {/* Edit button */}
      <button
        onClick={() => setShowManager(!showManager)}
        style={{
          position: 'absolute', top: '12px', right: '12px',
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.5)',
          borderRadius: '8px', cursor: 'pointer', zIndex: 10,
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '6px 10px', fontSize: '11px', fontWeight: 500,
          color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)',
          transition: 'all 0.15s',
        }}
      >
        <Settings size={12} /> Edit photos
      </button>

      {/* Photo manager panel */}
      {showManager && (
        <div className="animate-scale-in" style={{
          position: 'absolute', top: '44px', right: '12px',
          background: 'white', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '16px', zIndex: 20,
          width: '320px', boxShadow: 'var(--shadow-lg)',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>
            Collage Photos
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', fontStyle: 'italic', lineHeight: 1.5 }}>
            Paste a direct image URL (ends in .jpg, .png, etc). Up to 5 photos. Try right-clicking any photo online and choosing "Copy image address".
          </p>

          {/* Add URL input */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            <input
              type="text" placeholder="https://... (image URL)"
              value={newUrl} onChange={e => setNewUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPhoto()}
              style={{ flex: 1, fontSize: '12px' }}
            />
            <button
              className="btn btn-primary" onClick={addPhoto}
              disabled={adding || photos.length >= 5}
              style={{ padding: '8px 10px' }}
            >
              <Plus size={13} />
            </button>
          </div>

          {error && (
            <p style={{ fontSize: '11px', color: 'var(--accent-rust)', marginBottom: '10px' }}>{error}</p>
          )}

          {/* Current photos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
            {photos.length === 0 && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
                No photos yet
              </p>
            )}
            {photos.map((photo, i) => (
              <div key={photo.id} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'var(--bg-parchment)', borderRadius: '7px', padding: '6px 8px',
                border: '1px solid var(--border)',
              }}>
                <img src={photo.url} alt="" style={{
                  width: '36px', height: '36px', objectFit: 'cover',
                  borderRadius: '4px', flexShrink: 0,
                }} />
                <span style={{
                  flex: 1, fontSize: '11px', color: 'var(--text-muted)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  Photo {i + 1}
                </span>
                <button onClick={() => removePhoto(photo.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', opacity: 0.5, padding: 0, flexShrink: 0,
                }}>
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>

          {photos.length >= 5 && (
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
              Maximum 5 photos reached
            </p>
          )}

          <button className="btn btn-ghost" onClick={() => setShowManager(false)}
            style={{ width: '100%', justifyContent: 'center', marginTop: '10px', fontSize: '12px' }}>
            Done
          </button>
        </div>
      )}
    </div>
  )
}
