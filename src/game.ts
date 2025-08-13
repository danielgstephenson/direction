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
  goals: Vec2[] = []
  token = String(Math.random())
  timeScale: number
  countdown: number
  moveInterval = 0.5
  updateInterval = 0.2
  mapSize = 5
  teamSize = 4
  phase = 0

  constructor () {
    this.timeScale = this.server.config.timeScale
    this.countdown = this.moveInterval
    range(this.mapSize).forEach(x => {
      range(this.mapSize).forEach(y => {
        this.locations.push({ x, y })
      })
    })
    this.setup()
    this.startIo()
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

  startIo (): void {
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

  setup (): void {
    this.units = []
    const offset = choose([0, 1])
    const locations = shuffle(this.locations)
    range(this.teamSize).forEach(i => {
      const t0 = (i + offset) % 2
      const t1 = 1 - t0
      const x0 = locations[i].x
      const x1 = this.mapSize - 1 - x0
      const y = locations[i].y
      const dir0 = choose([0, 1, 2, 3])
      const dir1 = [1, 3].includes(dir0) ? dir0 : (dir0 + 2) % 4
      const unit0 = new Unit(this, t0, i, 0, x0, y, dir0)
      const unit1 = new Unit(this, t1, i, 1, x1, y, dir1)
      this.teams[t0].push(unit0)
      this.teams[t1].push(unit1)
    })
    const gx0 = locations[this.teamSize].x
    const gx1 = this.mapSize - 1 - gx0
    const gy = locations[this.teamSize].y
    this.goals[0] = { x: gx0, y: gy }
    this.goals[1] = { x: gx1, y: gy }
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
