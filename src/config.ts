import fs from 'fs-extra'
import path from 'path'

export class Config {
  port = 3000
  secure = false
  timeScale = 1
  depth = 6

  constructor () {
    const dirname = path.dirname(__filename)
    const configPath = path.join(dirname, '../config.json')
    const fileExists: boolean = fs.existsSync(configPath)
    if (fileExists) {
      const json = fs.readJSONSync(configPath)
      if (typeof json.port === 'number') this.port = json.port
      if (typeof json.secure === 'boolean') this.secure = json.secure
      if (typeof json.timeScale === 'number') this.timeScale = json.timeScale
      if (typeof json.depth === 'number') this.depth = json.depth
    }
    console.log('port:', this.port)
    console.log('secure:', this.secure)
    console.log('timeScale:', this.timeScale)
    console.log('depth:', this.depth)
  }
}
