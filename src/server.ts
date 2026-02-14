import 'dotenv/config'
import app from './app.js'

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📄 OpenAPI documentation available at http://localhost:${PORT}/openapi.json`)
  console.log(`🔌 WebSocket server ready`)
})
