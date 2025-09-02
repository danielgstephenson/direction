import { choiceInterval, maxRound, moveInterval, updateInterval, endInterval } from './params'
import { Player } from './player'
import { Server } from './server'
import { Tick } from './tick'
import { advance, Layout } from './layout'
import { sample } from './math'
import { getOutcome, maxState, shift } from './state'

export class Game {
  server = new Server()
  players: Player[] = []
  layout = new Layout()
  timeScale: number
  countdown = choiceInterval
  paused = true
  phase = 'choice'
  choice = 0
  botCountdown = 0

  constructor () {
    this.restart()
    this.timeScale = this.server.config.timeScale
    this.startIo()
    setInterval(() => this.tick(), updateInterval / this.timeScale * 1000)
    console.log('shift[0][0]', shift[0][0])
    console.log('game')
    // const values = new Uint8Array(maxState)
    // console.log('begin test', maxState)
    // console.log('maxState', maxState)
    // values.forEach((i, state) => {
    //   const outcome = getOutcome(state, 0)
    //   values[state] = outcome % 5
    //   if (state % 10000 === 0) console.log((state / maxState).toFixed(4))
    // })
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
      this.choice = this.layout.units[this.layout.rank].dir
      this.phase = 'move'
      this.countdown = moveInterval
    } else if (this.phase === 'end') {
      this.restart()
    }
  }

  restart (): void {
    this.layout = new Layout()
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
