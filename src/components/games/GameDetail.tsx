'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Game, Play, ListeningSession } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, Typography, Box, IconButton, LinearProgress } from '@mui/material'
import { PlayArrow, Pause, VolumeUp, VolumeOff } from '@mui/icons-material'
import { Audio } from 'expo-av'
import { Analytics, AnalyticsEventType } from '@/lib/analytics'

interface GameDetailProps {
  gameId: string
}

export default function GameDetail({ gameId }: GameDetailProps) {
  const { user } = useAuth()
  const [game, setGame] = useState<Game | null>(null)
  const [plays, setPlays] = useState<Play[]>([])
  const [currentPlay, setCurrentPlay] = useState<Play | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<ListeningSession | null>(null)
  const audioRef = useRef<Audio.Sound | null>(null)
  const playQueueRef = useRef<Play[]>([])
  const sessionStartTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    fetchGameAndPlays()
    setupRealtimeSubscription()
    return () => {
      cleanupAudio()
      if (session) {
        const duration = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
        Analytics.trackGameListenEnd(gameId, user!.id, duration)
      }
    }
  }, [gameId])

  async function fetchGameAndPlays() {
    try {
      // Fetch game details
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single()

      if (gameError) throw gameError
      setGame(gameData)

      // Fetch plays
      const { data: playsData, error: playsError } = await supabase
        .from('plays')
        .select('*')
        .eq('game_id', gameId)
        .order('sequence_number', { ascending: true })

      if (playsError) throw playsError
      setPlays(playsData || [])

      // Create or resume listening session
      if (user) {
        const { data: sessionData, error: sessionError } = await supabase
          .from('listening_sessions')
          .upsert({
            user_id: user.id,
            game_id: gameId,
            started_at: new Date().toISOString()
          })
          .select()
          .single()

        if (sessionError) throw sessionError
        setSession(sessionData)
        sessionStartTimeRef.current = Date.now()
        Analytics.trackGameListenStart(gameId, user.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game')
      Analytics.trackApiError('fetchGameAndPlays', err instanceof Error ? err.message : 'Unknown error')
    }
  }

  function setupRealtimeSubscription() {
    const subscription = supabase
      .channel(`game-${gameId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'plays',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        const newPlay = payload.new as Play
        setPlays((prev) => [...prev, newPlay])
        if (!isPlaying) {
          playQueueRef.current.push(newPlay)
          playNextInQueue()
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  async function playNextInQueue() {
    if (playQueueRef.current.length === 0 || !audioRef.current) {
      setIsPlaying(false)
      setCurrentPlay(null)
      return
    }

    const nextPlay = playQueueRef.current[0]
    if (!nextPlay.audio_url) {
      playQueueRef.current.shift()
      playNextInQueue()
      return
    }

    try {
      if (audioRef.current) {
        await audioRef.current.unloadAsync()
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: nextPlay.audio_url },
        { shouldPlay: true, volume: isMuted ? 0 : 1 }
      )

      audioRef.current = sound
      setCurrentPlay(nextPlay)
      setIsPlaying(true)

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          if (user) {
            Analytics.trackPlayHeard(nextPlay.id, gameId, user.id)
          }
          playQueueRef.current.shift()
          await playNextInQueue()
        }
      })

      // Update listening session
      if (session) {
        await supabase
          .from('listening_sessions')
          .update({
            last_play_sequence: nextPlay.sequence_number
          })
          .eq('id', session.id)
      }
    } catch (err) {
      console.error('Error playing audio:', err)
      Analytics.trackApiError('playNextInQueue', err instanceof Error ? err.message : 'Unknown error')
      playQueueRef.current.shift()
      playNextInQueue()
    }
  }

  async function togglePlayback() {
    if (!audioRef.current) return

    if (isPlaying) {
      await audioRef.current.pauseAsync()
    } else {
      await audioRef.current.playAsync()
    }
    setIsPlaying(!isPlaying)
  }

  async function toggleMute() {
    if (!audioRef.current) return

    await audioRef.current.setVolumeAsync(isMuted ? 1 : 0)
    setIsMuted(!isMuted)
  }

  async function cleanupAudio() {
    if (audioRef.current) {
      await audioRef.current.unloadAsync()
    }
    if (session) {
      await supabase
        .from('listening_sessions')
        .update({
          ended_at: new Date().toISOString()
        })
        .eq('id', session.id)
    }
  }

  if (error) return <Typography color="error">{error}</Typography>
  if (!game) return <Typography>Loading game...</Typography>

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {game.away_team} @ {game.home_team}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {game.status.toUpperCase()}
            {game.inning > 0 && ` - ${game.inning_half?.toUpperCase()} ${game.inning}`}
          </Typography>
          {currentPlay && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">{currentPlay.description}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <IconButton onClick={togglePlayback}>
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
                <IconButton onClick={toggleMute}>
                  {isMuted ? <VolumeOff /> : <VolumeUp />}
                </IconButton>
                <LinearProgress
                  sx={{ flexGrow: 1, ml: 2 }}
                  variant="determinate"
                  value={(plays.indexOf(currentPlay) / plays.length) * 100}
                />
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Recent Plays
        </Typography>
        {plays.slice(-5).map((play) => (
          <Card key={play.id} sx={{ mb: 1 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {play.inning_half.toUpperCase()} {play.inning}
              </Typography>
              <Typography>{play.description}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  )
} 