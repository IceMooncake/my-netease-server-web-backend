import { exec } from 'child_process'
import 'dotenv/config'

export default function () {
  const apiBasePath = process.env.OPEN_API_PATH || ''
  const typesBasePath = process.env.FONT_TYPES_PATH || ''
  const cmd = `openapi-typescript ${apiBasePath}openapi.json --output ${typesBasePath}api-types.ts`

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error('执行失败:', err)
      return
    }
    console.log('stdout:', stdout)
    console.error('stderr:', stderr)
  })
}
