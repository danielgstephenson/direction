import { choose, range, shuffle, Vec2 } from './math'
import { directInterval, mapSize, moveInterval, teamSize, updateInterval } from './params'
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
  state = 'move'
  moveRank = 0
  directRank = 0

  constructor () {
    this.timeScale = this.server.config.timeScale
    this.countdown = moveInterval
    range(mapSize).forEach(x => {
      range(mapSize).forEach(y => {
        this.locations.push({ x, y })
      })
    })
    this.setup()
    this.startIo()
    setInterval(() => this.update(), updateInterval / this.timeScale * 1000)
  }

  update (): void {
    this.countdown = Math.max(0, this.countdown - updateInterval)
    this.players.forEach(player => player.socket.emit('tick', this.countdown, this.state))
    if (this.countdown === 0) this.step()
  }

  step (): void {
    if (this.state === 'move') {
      this.teams[0][this.moveRank].move()
      this.teams[1][this.moveRank].move()
      this.updatePlayers()
      this.moveRank = (this.moveRank + 1) % teamSize
      this.state = this.moveRank === 0 ? 'direct' : 'move'
      this.countdown = this.moveRank === 0 ? directInterval : moveInterval
    } else if (this.state === 'direct') {
      const unit0 = this.teams[0][this.directRank]
      const unit1 = this.teams[1][this.directRank]
      unit0.dir = unit0.newDir
      unit1.dir = unit1.newDir
      this.directRank = (this.directRank + 1) % teamSize
      this.moveRank = 0
      this.state = 'move'
      this.countdown = moveInterval
    }
  }

  updatePlayers (): void {
    const summary0 = new GameSummary(0, this)
    const summary1 = new GameSummary(1, this)
    this.players.forEach(player => {
      const summary = player.team === 0 ? summary0 : summary1
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
    range(teamSize).forEach(i => {
      const t0 = (i + offset) % 2
      const t1 = 1 - t0
      const x0 = locations[i].x
      const x1 = mapSize - 1 - x0
      const y = locations[i].y
      const dir0 = choose([0, 1, 2, 3])
      const dir1 = [1, 3].includes(dir0) ? dir0 : (dir0 + 2) % 4
      const unit0 = new Unit(this, t0, i, 0, x0, y, dir0)
      const unit1 = new Unit(this, t1, i, 1, x1, y, dir1)
      this.teams[t0].push(unit0)
      this.teams[t1].push(unit1)
    })
    const gx0 = locations[teamSize].x
    const gx1 = mapSize - 1 - gx0
    const gy = locations[teamSize].y
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
