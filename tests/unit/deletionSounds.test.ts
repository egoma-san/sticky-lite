import { playPaperSound } from '../../app/features/sticky-notes/utils/deletionSounds'

describe('deletionSounds', () => {
  let mockPlay: jest.Mock
  let mockAudio: any

  beforeEach(() => {
    mockPlay = jest.fn().mockResolvedValue(undefined)
    mockAudio = {
      play: mockPlay,
      volume: 0,
      currentTime: 0
    }
    
    // Mock Audio constructor
    global.Audio = jest.fn(() => mockAudio) as any
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should play crumple sound', async () => {
    await playPaperSound('crumple')
    
    expect(global.Audio).toHaveBeenCalledWith('/sounds/paper-crumple.mp3')
    expect(mockAudio.volume).toBe(0.3)
    expect(mockPlay).toHaveBeenCalled()
  })

  it('should play peel sound', async () => {
    await playPaperSound('peel')
    
    expect(global.Audio).toHaveBeenCalledWith('/sounds/paper-peel.mp3')
    expect(mockAudio.volume).toBe(0.3)
    expect(mockPlay).toHaveBeenCalled()
  })

  it('should handle play error gracefully', async () => {
    mockPlay.mockRejectedValue(new Error('Play failed'))
    
    // Should not throw
    await expect(playPaperSound('crumple')).resolves.toBeUndefined()
  })

  it('should handle missing Audio API', async () => {
    global.Audio = undefined as any
    
    // Should not throw
    await expect(playPaperSound('crumple')).resolves.toBeUndefined()
  })
})