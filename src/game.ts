import { choiceInterval, updateInterval } from './params'
import { Player } from './player'
import { Server } from './server'
import { sample } from './math'
import { advance, checkEnd, Summary } from './summary'
import { Bot } from './bot'

export class Game {
  token = String(Math.random())
  bot = new Bot()
  server = new Server()
  players: Player[] = []
  summary = new Summary(this)
  timeScale: number
  paused = true
  botAction = 0
  botWait = 0.5 * choiceInterval

  constructor () {
    this.timeScale = this.server.config.timeScale
    this.startIo()
    setInterval(() => this.tick(), updateInterval / this.timeScale * 1000)
    checkEnd(this.summary)
    // console.log('')
    // const state = randInt(0, stateCount - 1)
    // console.log('state', state)
    // const locs = stateToLocs(state)
    // console.log('locs', locs)
    // const vectors = locs.map(loc => gridVecs[loc])
    // console.log('vectors', vectors)
    // const action = sample(actionSpace)
    // console.log('action', action)
    // const outcome = getOutcome(state, action)
    // console.log('outcome', outcome)
    // const locs2 = stateToLocs(outcome)
    // console.log('locs', locs2)
    // const vectors2 = locs2.map(loc => gridVecs[loc])
    // console.log('vectors', vectors2)
    // console.log('')
  }

  startIo (): void {
    this.server.io.on('connection', socket => {
      const player = new Player(this, socket)
      this.players.push(player)
      console.log('connect:', socket.id, this.players.length)
      socket.on('choice', (choice: number) => {
        const choicePhase = this.summary.phase === 'choice'
        const activeTeam = this.summary.round % 2
        const activePlayer = player.team === activeTeam
        if (choicePhase && activePlayer) {
          this.summary.action = choice
        }
      })
      socket.on('selectTeam', (team: number) => {
        const opening = this.getActiveCount() < 2
        const startPhase = this.summary.phase === 'start'
        if (opening && startPhase) {
          player.team = team
          this.paused = false
        }
        if (this.getActiveCount() > 1) {
          this.summary.full = true
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
      player.socket.emit('tick', this.summary, player.team)
    })
    if (this.paused) return
    this.summary.countdown = Math.max(0, this.summary.countdown - updateInterval)
    if (this.summary.countdown === 0) this.step()
  }

  step (): void {
    if (this.summary.phase === 'start') {
      this.start()
    } else if (this.summary.phase === 'move') {
      this.summary.phase = 'choice'
      this.summary.countdown = choiceInterval
      this.botAct()
    } else if (this.summary.phase === 'choice') {
      advance(this.summary)
      this.players.forEach(player => {
        player.socket.emit('move', this.summary)
      })
    } else if (this.summary.phase === 'end') {
      this.reset()
    }
  }

  botAct (): void {
    const team = this.summary.round % 2
    const bot = team === this.summary.botTeam
    if (bot) {
      this.botAction = this.bot.getAction(this.summary.state)
      this.summary.action = this.botAction
    }
  }

  start (): void {
    const count0 = this.getPlayerCount(0)
    const count1 = this.getPlayerCount(1)
    const maxCount = Math.max(count0, count1)
    if (maxCount > 1) {
      this.reset()
      return
    }
    this.summary.full = true
    const empty0 = count0 === 0
    const empty1 = count1 === 0
    if (empty0) this.summary.botTeam = 0
    if (empty1) this.summary.botTeam = 1
    this.summary.phase = 'choice'
    this.summary.countdown = choiceInterval
    this.botAct()
  }

  reset (): void {
    this.summary = new Summary(this)
    this.paused = true
    this.players.forEach(player => {
      player.team = -1
      player.socket.emit('move', this.summary)
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

  getActiveCount (): number {
    const count0 = this.getPlayerCount(0)
    const count1 = this.getPlayerCount(1)
    return count0 + count1
  }
}
