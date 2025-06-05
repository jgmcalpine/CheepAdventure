'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Game } from '@/lib/supabase'
import { Card, CardContent, Typography, Grid, Chip, Button } from '@mui/material'
import { useRouter } from 'next/navigation'

export default function GameList() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchGames()
    const subscription = supabase
      .channel('games')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'games'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setGames((prev) => [...prev, payload.new as Game])
        } else if (payload.eventType === 'UPDATE') {
          setGames((prev) =>
            prev.map((game) =>
              game.id === payload.new.id ? { ...game, ...payload.new } : game
            )
          )
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function fetchGames() {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('game_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: true })

      if (error) throw error

      setGames(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games')
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string): 'default' | 'primary' | 'success' | 'error' {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'default'
      case 'live':
        return 'primary'
      case 'final':
        return 'success'
      default:
        return 'error'
    }
  }

  if (loading) return <Typography>Loading games...</Typography>
  if (error) return <Typography color="error">{error}</Typography>
  if (games.length === 0) return <Typography>No games scheduled for today.</Typography>

  return (
    <Grid container spacing={2}>
      {games.map((game) => (
        <Grid item xs={12} sm={6} md={4} key={game.id}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {game.away_team} @ {game.home_team}
              </Typography>
              <Chip
                label={game.status}
                color={getStatusColor(game.status)}
                sx={{ mb: 2 }}
              />
              {game.inning > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {game.inning_half?.toUpperCase()} {game.inning}
                </Typography>
              )}
              <Button
                variant="contained"
                fullWidth
                onClick={() => router.push(`/games/${game.id}`)}
                disabled={game.status.toLowerCase() !== 'live'}
                sx={{ mt: 2 }}
              >
                {game.status.toLowerCase() === 'live' ? 'Listen Live' : 'View Game'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
} 