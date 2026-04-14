/* src/utils/audio.js — \u5171\u7528\u97f3\u6548\u7cfb\u7d71 */

const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

export function createLoudSound(src, gain) {
  const audio = new Audio(src)
  const source = audioCtx.createMediaElementSource(audio)
  const gainNode = audioCtx.createGain()
  gainNode.gain.value = gain
  source.connect(gainNode).connect(audioCtx.destination)
  return audio
}

function resumeAudio() {
  if (audioCtx.state === 'suspended') audioCtx.resume()
}

function playSound(sound) {
  resumeAudio()
  sound.currentTime = 0
  sound.play().catch(() => {})
}

const switchSound = createLoudSound('/audio/Random 1.wav', 3.0)
const clickSound = createLoudSound('/audio/Random2.wav', 3.0)
const pickupSound = createLoudSound('/audio/Pickup1.wav', 3.0)

export const playSwitch = () => playSound(switchSound)
export const playClick = () => playSound(clickSound)
export const playPickup = () => playSound(pickupSound)
