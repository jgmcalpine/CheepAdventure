'use client'

import { useAuth } from '@/contexts/AuthContext'
import GameDetail from '@/components/games/GameDetail'
import { Box, Typography } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface GamePageProps {
  params: {
    id: string
  }
}

export default function GamePage({ params }: GamePageProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    )
  }

  if (!user) {
    return null
  }

  return <GameDetail gameId={params.id} />
} 