import { choiceInterval, maxRound, moveInterval, updateInterval, endInterval } from './params'
import { Player } from './player'
import { Server } from './server'
import { Tick } from './tick'
import { advance, State } from './state'
import { Bot } from './bot/bot'
import { sample } from './math'

export class Game {
  server = new Server()
  players: Player[] = []
  state = new State()
  nextState = new State()
  bot: Bot
  nextBot: Bot
  timeScale: number
  countdown = choiceInterval
  paused = true
  phase = 'choice'
  choice = 0
  botCountdown = 0

  constructor () {
    this.bot = new Bot(this.state)
    this.nextBot = new Bot(this.nextState)
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
    const playerCount = this.getPlayerCount(this.state.team)
    if (playerCount === 0) {
      if (this.botCountdown > 0.5) {
        this.choice = sample(this.bot.root.bestDirs)
        this.botCountdown = 0
      } else {
        this.botCountdown += updateInterval
      }
    }
    if (this.countdown === 0) {
      this.step()
    }
  }

  step (): void {
    if (this.phase === 'move') {
      this.phase = 'choice'
      this.countdown = choiceInterval
      this.checkEnd()
      this.updatePlayers()
    } else if (this.phase === 'choice') {
      this.state = advance(this.state, this.choice)
      this.bot.focus(this.state)
      this.choice = this.state.units[this.state.rank].dir
      this.phase = 'move'
      this.countdown = moveInterval
    } else if (this.phase === 'end') {
      this.restart()
    }
  }

  restart (): void {
    this.state = this.nextState
    this.bot = this.nextBot
    this.nextState = new State()
    this.nextBot = new Bot(this.nextState)
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
    if (win || timeOut) {
      console.log('final round', this.state.round)
      console.log('score', this.state.score)
      this.phase = 'end'
      this.bot.finished = true
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
    return sample([0, 1])
  }

  getPlayerCount (team: number): number {
    const teamPlayers = this.players.filter(p => p.team === team)
    return teamPlayers.length
  }
}
