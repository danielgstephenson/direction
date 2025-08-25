import { choose } from './math'
import { choiceInterval, maxRound, moveInterval, updateInterval, endInterval } from './params'
import { Player } from './player'
import { Server } from './server'
import { Runner } from './runner'
import { Tick } from './tick'
import { Bot } from './bot'
import { advance, reset, State } from './state'

export class Game {
  server = new Server()
  players: Player[] = []
  state = new State()
  runner = new Runner()
  bot = new Bot(this)
  timeScale: number
  countdown = choiceInterval
  paused = true
  phase = 'choice'
  choice = 0

  constructor () {
    this.restart()
    this.timeScale = this.server.config.timeScale
    this.startIo()
    setInterval(() => this.tick(), updateInterval / this.timeScale * 1000)
  }

  startIo (): void {
    this.server.io.on('connection', socket => {
      const player = new Player(this, socket)
      this.players.push(player)
      console.log('connect:', socket.id, this.players.length)
      socket.emit('connected', this.state.token)
      socket.emit('setup', this.state)
      socket.on('choice', (choice: number) => {
        this.paused = false
        const choicePhase = this.phase === 'choice'
        const activeTeam = player.team === this.state.team
        if (choicePhase && activeTeam) {
          this.choice = choice
        }
      })
      socket.on('disconnect', () => {
        this.players = this.players.filter(p => p.id !== socket.id)
        console.log('disconnect:', socket.id, this.players.length)
      })
    })
  }

  tick (): void {
    this.players.forEach(player => {
      player.socket.emit('tick', new Tick(this, player.team))
    })
    if (this.paused) return
    this.countdown = Math.max(0, this.countdown - updateInterval)
    if (this.countdown === 0) {
      this.step()
    }
  }

  step (): void {
    const state = this.state
    if (this.phase === 'move') {
      this.phase = 'choice'
      this.countdown = choiceInterval
      this.checkEnd()
      this.updatePlayers()
    } else if (this.phase === 'choice') {
      const unit = state.units[state.rank]
      unit.dir = this.choice
      advance(state)
      this.choice = state.units[state.rank].dir
      this.phase = 'move'
      this.countdown = moveInterval
    } else if (this.phase === 'end') {
      this.restart()
    }
  }

  restart (): void {
    reset(this.state)
    this.phase = 'choice'
    this.countdown = choiceInterval
    this.paused = true
    this.choice = this.state.units[0].dir
    this.checkEnd()
    this.updatePlayers()
  }

  checkEnd (): void {
    const win = this.state.score !== 0
    const timeOut = this.state.round > maxRound
    console.log('this.state.score', this.state.score)
    if (win || timeOut) {
      this.phase = 'end'
      this.countdown = endInterval
    }
  }

  updatePlayers (): void {
    this.players.forEach(player => {
      player.socket.emit('state', this.state)
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
