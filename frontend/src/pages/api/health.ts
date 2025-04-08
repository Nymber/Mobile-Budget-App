import type { NextApiRequest, NextApiResponse } from 'next'

type HealthResponse = {
  status: string
  timestamp: string
  uptime: number
  version: string
}

// Track server start time
const startTime = Date.now()

/**
 * Health check endpoint for Docker and monitoring tools
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000), // uptime in seconds
    version: process.env.NEXT_PUBLIC_VERSION || '1.0.0'
  })
}
