import { NCWebsocket } from 'node-napcat-ts'

const napcatConfig = {
  baseUrl: String(process.env.NAPCAT_URL),
  accessToken: String(process.env.NAPCAT_TOKEN),
  // 是否需要在触发 socket.error 时抛出错误, 默认关闭
  throwPromise: true,
  // ↓ 自动重连(可选)
  reconnection: {
    enable: true,
    attempts: 10,
    delay: 5000,
  },
} as const

// ↓ 是否开启 DEBUG 模式
const napcat = new NCWebsocket(napcatConfig, false)

const connect = async () => {
  try {
    console.log(`Connecting to Napcat at ${napcatConfig.baseUrl}...`)
    await napcat.connect()
    console.log('✅ Napcat connected')
  } catch (e) {
    console.error('❌ Napcat connection failed', e)
    // Don't throw to allow app to start
  }
}

export default { napcat, connect }
