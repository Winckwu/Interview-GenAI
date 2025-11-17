import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

dotenv.config()

const app: Express = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN }))
app.use(express.json())

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  })
})

// API info endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'MCA System Backend',
    version: '1.0.0',
    description: 'Meta-Cognitive Assessment Platform API',
    endpoints: {
      health: '/health',
      users: '/api/users',
      frustrations: '/api/frustrations',
      strategies: '/api/strategies',
      assessments: '/api/assessments',
      sessions: '/api/sessions',
    },
  })
})

// TODO: Add route files
// import userRoutes from './routes/users'
// import frustrationRoutes from './routes/frustrations'
// import strategyRoutes from './routes/strategies'
// import assessmentRoutes from './routes/assessments'
//
// app.use('/api/users', userRoutes)
// app.use('/api/frustrations', frustrationRoutes)
// app.use('/api/strategies', strategyRoutes)
// app.use('/api/assessments', assessmentRoutes)

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  })
})

// Error handling middleware
app.use((err: any, req: Request, res: Response) => {
  console.error('Error:', err)
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`)
})
