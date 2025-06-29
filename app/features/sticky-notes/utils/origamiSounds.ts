// Create audio context lazily
let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

// Paper folding sound effect
function createPaperFoldSound(ctx: AudioContext): AudioNode {
  const duration = 0.15
  const now = ctx.currentTime
  
  // Create white noise for paper texture
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.1
  }
  
  const noiseSource = ctx.createBufferSource()
  noiseSource.buffer = buffer
  
  // Filter to make it sound like paper
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 3000
  filter.Q.value = 2
  
  // Envelope
  const envelope = ctx.createGain()
  envelope.gain.setValueAtTime(0, now)
  envelope.gain.linearRampToValueAtTime(0.3, now + 0.01)
  envelope.gain.exponentialRampToValueAtTime(0.01, now + duration)
  
  noiseSource.connect(filter)
  filter.connect(envelope)
  
  noiseSource.start(now)
  noiseSource.stop(now + duration)
  
  return envelope
}

// Wing flapping sound effect
function createWingFlapSound(ctx: AudioContext): AudioNode {
  const duration = 0.3
  const now = ctx.currentTime
  
  // Create oscillator for whoosh sound
  const oscillator = ctx.createOscillator()
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(100, now)
  oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.1)
  oscillator.frequency.exponentialRampToValueAtTime(50, now + duration)
  
  // Create noise for air sound
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.05
  }
  
  const noiseSource = ctx.createBufferSource()
  noiseSource.buffer = buffer
  
  // Filter for air sound
  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 1000
  
  // Combine oscillator and noise
  const mixer = ctx.createGain()
  mixer.gain.value = 0.5
  
  // Envelope for the whole sound
  const envelope = ctx.createGain()
  envelope.gain.setValueAtTime(0, now)
  envelope.gain.linearRampToValueAtTime(0.4, now + 0.05)
  envelope.gain.exponentialRampToValueAtTime(0.01, now + duration)
  
  oscillator.connect(mixer)
  noiseSource.connect(filter)
  filter.connect(mixer)
  mixer.connect(envelope)
  
  oscillator.start(now)
  oscillator.stop(now + duration)
  noiseSource.start(now)
  noiseSource.stop(now + duration)
  
  return envelope
}

// Magical chime sound for completion
function createMagicalChimeSound(ctx: AudioContext): AudioNode {
  const now = ctx.currentTime
  const duration = 0.8
  
  const frequencies = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6 (C major chord)
  const merger = ctx.createChannelMerger(frequencies.length)
  
  frequencies.forEach((freq, i) => {
    const oscillator = ctx.createOscillator()
    oscillator.type = 'sine'
    oscillator.frequency.value = freq * (1 + i * 0.01) // Slight detuning for richness
    
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration - i * 0.1)
    
    oscillator.connect(gain)
    gain.connect(merger, 0, 0)
    
    oscillator.start(now + i * 0.05)
    oscillator.stop(now + duration)
  })
  
  // Add some reverb-like effect
  const convolver = ctx.createConvolver()
  const reverbTime = 0.5
  const reverbDecay = 3
  const bufferSize = ctx.sampleRate * reverbTime
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate)
  
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, reverbDecay)
    }
  }
  
  convolver.buffer = buffer
  
  const wetGain = ctx.createGain()
  wetGain.gain.value = 0.3
  
  const dryGain = ctx.createGain()
  dryGain.gain.value = 0.7
  
  const finalMixer = ctx.createGain()
  
  merger.connect(dryGain)
  merger.connect(convolver)
  convolver.connect(wetGain)
  
  dryGain.connect(finalMixer)
  wetGain.connect(finalMixer)
  
  return finalMixer
}

export function playOrigamiSound(type: 'crane' | 'plane' = 'crane') {
  try {
    const ctx = getAudioContext()
    
    // Resume context if it's suspended (required for some browsers)
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
    
    // Create the complete sound sequence
    const finalGain = ctx.createGain()
    finalGain.gain.value = 0.6
    finalGain.connect(ctx.destination)
    
    // Paper folding sound
    const foldSound = createPaperFoldSound(ctx)
    foldSound.connect(finalGain)
    
    // Wing flapping sound (delayed)
    setTimeout(() => {
      const flapSound = createWingFlapSound(ctx)
      flapSound.connect(finalGain)
    }, 200)
    
    // Magical chime (delayed)
    setTimeout(() => {
      const chimeSound = createMagicalChimeSound(ctx)
      const chimeGain = ctx.createGain()
      chimeGain.gain.value = 0.3
      chimeSound.connect(chimeGain)
      chimeGain.connect(finalGain)
    }, 400)
    
  } catch (error) {
    console.warn('Failed to play origami sound:', error)
  }
}