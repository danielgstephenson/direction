import { choose, range } from './math'
import { choiceInterval, maxRound, moveInterval, updateInterval, endInterval } from './params'
import { Player } from './player'
import { Server } from './server'
import { OldState } from './oldState'
import { Runner } from './runner'
import { Tick } from './tick'
import { Bot } from './bot'

export class Game {
  token = String(Math.random())
  server = new Server()
  players: Player[] = []
  state = new OldState(this.token)
  runner = new Runner()
  bot = new Bot(this)
  timeScale: number
  countdown = choiceInterval
  paused = true
  scores = [0, 0]
  choices = [0, 0]

  constructor () {
    this.timeScale = this.server.config.timeScale
    this.runner.setup(this.state)
    this.startIo()
    setInterval(() => this.tick(), updateInterval / this.timeScale * 1000)
  }

  startIo (): void {
    this.server.io.on('connection', socket => {
      const player = new Player(this, socket)
      this.players.push(player)
      console.log('connect:', socket.id, this.players.length)
      socket.emit('connected', this.token)
      socket.emit('setup', this.state)
      socket.on('choice', (choice: number) => {
        if (this.state.phase === 'choice') {
          this.choices[player.team] = choice
          this.paused = false
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
    if (this.state.phase === 'move') {
      this.runner.onStep(this.state, this.choices)
      this.state.regions.forEach(region => {
        const unit = region.units[region.moveRank]
        this.choices[unit.team] = unit.dir
      })
      this.state.phase = 'choice'
      this.countdown = choiceInterval
      this.checkEnd()
      this.updatePlayers()
    } else if (this.state.phase === 'choice') {
      range(2).forEach(team => {
        if (this.getPlayerCount(team) === 0) {
          this.choices[team] = this.bot.getChoice(team, this.state)
        }
      })
      this.state.phase = 'move'
      this.countdown = moveInterval
    } else if (this.state.phase === 'end') {
      this.restart()
    }
  }

  restart (): void {
    this.runner.reset(this.state)
    this.state.phase = 'choice'
    this.countdown = choiceInterval
    this.paused = true
    range(2).forEach(i => {
      this.choices[i] = this.state.regions[i].units[0].dir
    })
    this.updatePlayers()
  }

  checkEnd (): void {
    this.scores = [0, 0]
    this.state.regions.forEach(region => {
      this.scores[0] += region.scores[0]
      this.scores[1] += region.scores[1]
    })
    const win = this.scores[0] !== this.scores[1]
    const timeOut = this.state.round > maxRound
    if (win || timeOut) {
      this.state.phase = 'end'
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
