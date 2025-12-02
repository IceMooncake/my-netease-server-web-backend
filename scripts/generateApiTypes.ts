import { exec } from 'child_process'
import 'dotenv/config'

const apiBasePath = process.env.OPEN_API_PATH || ''
const typesBasePath = process.env.FONT_TYPES_PATH || ''
const a = `openapi-typescript ${apiBasePath}openapi.json --output ${typesBasePath}api-types.ts`

exec(a, (err, stdout, stderr) => {
  if (err) {
    console.error('执行失败:', err)
    return
  }
  console.log('stdout:', stdout)
  console.error('stderr:', stderr)
})
