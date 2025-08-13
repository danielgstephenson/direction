import { choose, range, shuffle, Vec2 } from './math'
import { Player } from './player'
import { Server } from './server'
import { GameSummary } from './summaries/gameSummary'
import { Unit } from './unit'

export class Game {
  server = new Server()
  players: Player[] = []
  units: Unit[] = []
  teams: Unit[][] = [[], []]
  locations: Vec2[] = []
  token = String(Math.random())
  timeScale: number
  countdown: number
  moveInterval: number
  updateInterval = 0.2
  gridSize = 6
  teamSize = 6
  phase = 0

  constructor () {
    this.setupIo()
    this.timeScale = this.server.config.timeScale
    this.moveInterval = 1
    this.countdown = this.moveInterval
    range(this.gridSize).forEach(x => {
      range(this.gridSize).forEach(y => {
        this.locations.push({ x, y })
      })
    })
    this.buildUnits()
    setInterval(() => this.update(), this.updateInterval / this.timeScale * 1000)
  }

  update (): void {
    this.countdown = Math.max(0, this.countdown - this.updateInterval)
    this.players.forEach(player => player.socket.emit('tick', this.countdown))
    if (this.countdown === 0) {
      this.teams[0][this.phase].move()
      this.teams[1][this.phase].move()
      this.updatePlayers()
      this.phase = (this.phase + 1) % this.teamSize
      this.countdown = this.moveInterval
    }
  }

  updatePlayers (): void {
    const summary1 = new GameSummary(1, this)
    const summary2 = new GameSummary(2, this)
    this.players.forEach(player => {
      const summary = player.team === 1 ? summary1 : summary2
      player.socket.emit('update', summary)
    })
  }

  setupIo (): void {
    this.server.io.on('connection', socket => {
      const player = new Player(this, socket)
      this.players.push(player)
      console.log('connect:', socket.id, this.players.length)
      socket.emit('connected', this.token)
      socket.emit('setup', new GameSummary(player.team, this))
      socket.on('choice', (choice: number) => {
        console.log(socket.id, 'choice:', choice)
      })
      socket.on('disconnect', () => {
        this.players = this.players.filter(p => p.id !== socket.id)
        console.log('disconnect:', socket.id, this.players.length)
      })
    })
  }

  buildUnits (): void {
    this.units = []
    const offset = choose([0, 1])
    const locations = shuffle(this.locations)
    range(this.teamSize).forEach(i => {
      const t0 = (i + offset) % 2
      const t1 = 1 - t0
      const x0 = locations[i].x
      const x1 = this.gridSize - 1 - locations[i].x
      const y = locations[i].y
      const dir0 = choose([0, 1, 2, 3])
      const dir1 = [1, 3].includes(dir0) ? dir0 : (dir0 + 2) % 4
      const unit0 = new Unit(this, t0, i, 0, x0, y, dir0)
      const unit1 = new Unit(this, t1, i, 1, x1, y, dir1)
      this.teams[t0].push(unit0)
      this.teams[t1].push(unit1)
    })
  }

  getSmallTeam (): number {
    const playerCount0 = this.getPlayerCount(0)
    const playerCount1 = this.getPlayerCount(1)
    if (playerCount1 > playerCount0) return 0
    if (playerCount0 > playerCount1) return 1
    return choose([0, 1])
  }

  getPlayerCount (team: number): number {
    const teamPlayers = this.players.filter(p => p.team === team)
    return teamPlayers.length
  }
}
