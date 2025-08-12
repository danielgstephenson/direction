import { choose, range, shuffle, Vec2 } from './math'
import { Player } from './player'
import { Server } from './server'
import { GameSummary } from './summaries/gameSummary'
import { Unit } from './unit'

export class Game {
  server = new Server()
  players: Player[] = []
  units: Unit[] = []
  locations: Vec2[] = []
  token = String(Math.random())
  timeScale: number
  countdown: number
  maxCountdown: number
  stepInterval = 0.5
  gridSize = 8

  constructor () {
    this.setupIo()
    this.timeScale = this.server.config.timeScale
    this.maxCountdown = 5
    this.countdown = this.maxCountdown
    range(this.gridSize).forEach(x => {
      range(this.gridSize).forEach(y => {
        this.locations.push({ x, y })
      })
    })
    this.buildUnits()
    setInterval(() => this.step(), 1000 * this.stepInterval / this.timeScale)
  }

  step (): void {
    const summary1 = new GameSummary(1, this)
    const summary2 = new GameSummary(2, this)
    this.players.forEach(player => {
      const summary = player.team === 1 ? summary1 : summary2
      player.socket.emit('step', summary)
    })
  }

  setupIo (): void {
    this.server.io.on('connection', socket => {
      const player = new Player(this, socket)
      this.players.push(player)
      console.log('connect:', socket.id)
      socket.emit('connected', this.token)
      socket.emit('setup', new GameSummary(player.team, this))
      socket.on('choice', (choice: number) => {
        console.log(socket.id, 'choice:', choice)
      })
      socket.on('disconnect', () => {
        console.log('disconnect:', socket.id)
        this.players = this.players.filter(p => p.id !== socket.id)
      })
    })
  }

  buildUnits (): void {
    this.units = []
    const offset = choose([0, 1])
    const locations = shuffle(this.locations)
    range(6).forEach(i => {
      const m0 = (i + offset) % 2
      const m1 = 1 - m0
      const x0 = locations[i].x
      const x1 = this.gridSize - 1 - locations[i].x
      const y = locations[i].y
      const unit0 = new Unit(0, i, m0, x0, y, 0)
      const unit1 = new Unit(1, i, m1, x1, y, 0)
      this.units.push(unit0)
      this.units.push(unit1)
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
