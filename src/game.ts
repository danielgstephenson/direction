import { choose, range } from './math'
import { choiceInterval, moveInterval, updateInterval } from './params'
import { Player } from './player'
import { Server } from './server'
import { State } from './state'
import { Runner } from './runner'
import { Tick } from './tick'

export class Game {
  server = new Server()
  players: Player[] = []
  state = new State()
  runner = new Runner()
  token = String(Math.random())
  timeScale: number
  countdown = choiceInterval
  phase = 'choice'

  choices = [0, 0]

  constructor () {
    this.timeScale = this.server.config.timeScale
    this.runner.setup(this.state)
    this.startIo()
    setInterval(() => this.tick(), updateInterval / this.timeScale * 1000)
  }

  tick (): void {
    if (this.players.length === 0) return
    this.countdown = Math.max(0, this.countdown - updateInterval)
    this.players.forEach(player => {
      player.socket.emit('tick', new Tick(this, player.team))
    })
    if (this.countdown === 0) {
      this.step()
    }
  }

  step (): void {
    if (this.phase === 'move') {
      this.runner.advance(this.state)
      this.choices[0] = this.state.teams[0][this.state.moveRank].dir
      this.choices[1] = this.state.teams[1][this.state.moveRank].dir
      this.phase = 'choice'
      this.countdown = choiceInterval
      this.checkWin()
      this.updatePlayers()
    } else if (this.phase === 'choice') {
      range(2).forEach(team => {
        if (this.getPlayerCount(team) === 0) {
          this.choices[team] = choose([0, 1, 2, 3])
        }
      })
      const unit0 = this.state.teams[0][this.state.moveRank]
      const unit1 = this.state.teams[1][this.state.moveRank]
      unit0.dir = this.choices[0]
      unit1.dir = this.choices[1]
      this.phase = 'move'
      this.countdown = moveInterval
    }
  }

  checkWin (): void {
    if (this.state.scores[0] !== this.state.scores[1]) {
      console.log('win')
      this.phase = 'win'
    }
  }

  updatePlayers (): void {
    this.players.forEach(player => {
      player.socket.emit('state', this.state)
    })
  }

  startIo (): void {
    this.server.io.on('connection', socket => {
      const player = new Player(this, socket)
      this.players.push(player)
      console.log('connect:', socket.id, this.players.length)
      socket.emit('connected', this.token)
      socket.emit('setup', this.state)
      socket.on('choice', (choice: number) => {
        if (this.phase === 'choice') {
          this.choices[player.team] = choice
        }
      })
      socket.on('disconnect', () => {
        this.players = this.players.filter(p => p.id !== socket.id)
        console.log('disconnect:', socket.id, this.players.length)
      })
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
