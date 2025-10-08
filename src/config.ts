import fs from 'fs-extra'
import path from 'path'

export class Config {
  port = 3000
  secure = false
  botActive = false
  timeScale = 1

  constructor () {
    const dirname = path.dirname(__filename)
    const configPath = path.join(dirname, '../config.json')
    const fileExists: boolean = fs.existsSync(configPath)
    if (fileExists) {
      const json = fs.readJSONSync(configPath)
      if (typeof json.port === 'number') this.port = json.port
      if (typeof json.secure === 'boolean') this.secure = json.secure
      if (typeof json.timeScale === 'number') this.timeScale = json.timeScale
      if (typeof json.botActive === 'boolean') this.botActive = json.botActive
    }
    console.log('port:', this.port)
    console.log('secure:', this.secure)
    console.log('timeScale:', this.timeScale)
    console.log('botActive:', this.botActive)
  }
}
