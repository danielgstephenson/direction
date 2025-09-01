import { choiceInterval, maxRound, moveInterval, updateInterval, endInterval } from './params'
import { Player } from './player'
import { Server } from './server'
import { Tick } from './tick'
import { advance, Layout } from './layout'
import { Bot } from './bot/bot'
import { sample } from './math'

export class Game {
  server = new Server()
  players: Player[] = []
  layout = new Layout()
  nextLayout = new Layout()
  bot: Bot
  nextBot: Bot
  timeScale: number
  countdown = choiceInterval
  paused = true
  phase = 'choice'
  choice = 0
  botCountdown = 0

  constructor () {
    this.bot = new Bot(this.layout)
    this.nextBot = new Bot(this.nextLayout)
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
      socket.emit('connected', this.layout.token)
      socket.emit('setup', this.layout)
      socket.on('choice', (choice: number) => {
        this.paused = false
        const choicePhase = this.phase === 'choice'
        const activeTeam = player.team === this.layout.team
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
    const playerCount = this.getPlayerCount(this.layout.team)
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
      this.layout = advance(this.layout, this.choice)
      this.bot.focus(this.layout)
      this.choice = this.layout.units[this.layout.rank].dir
      this.phase = 'move'
      this.countdown = moveInterval
    } else if (this.phase === 'end') {
      this.restart()
    }
  }

  restart (): void {
    this.layout = this.nextLayout
    this.bot = this.nextBot
    this.nextLayout = new Layout()
    this.nextBot = new Bot(this.nextLayout)
    this.phase = 'choice'
    this.countdown = choiceInterval
    this.paused = true
    this.choice = this.layout.units[0].dir
    this.checkEnd()
    this.updatePlayers()
  }

  checkEnd (): void {
    const win = this.layout.score !== 0
    const timeOut = this.layout.round > maxRound
    if (win || timeOut) {
      console.log('final round', this.layout.round)
      console.log('score', this.layout.score)
      this.phase = 'end'
      this.bot.finished = true
      this.countdown = endInterval
    }
  }

  updatePlayers (): void {
    this.players.forEach(player => {
      player.socket.emit('layout', this.layout)
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
