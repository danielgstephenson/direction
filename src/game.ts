import { choiceInterval, tickInterval } from './params'
import { Player } from './player'
import { Server } from './server'
import { clamp, sample } from './math'
import { advance, getScores, Summary, undo } from './summary'
import { Bot } from './bot'
import { readFileSync } from 'fs'

export class Game {
  token = String(Math.random())
  fontBuffer = readFileSync('./src/public/Lekton-Bold.ttf').buffer
  bot = new Bot()
  server = new Server()
  players: Player[] = []
  level = 5
  summary: Summary
  paused = true
  versus: boolean
  timeScale: number

  constructor () {
    this.timeScale = this.server.config.timeScale
    this.versus = this.server.config.versus
    this.summary = new Summary(this, this.level)
    this.startIo()
    setInterval(() => this.tick(), tickInterval / this.timeScale * 1000)
  }

  startIo (): void {
    this.server.io.on('connection', socket => {
      const player = new Player(this, socket)
      this.players.push(player)
      socket.emit('connected', this.fontBuffer)
      console.log('connect:', socket.id, this.players.length)
      socket.on('choice', (choice: number) => {
        const choicePhase = this.summary.phase === 'choice'
        const activeTeam = this.summary.round % 2
        const activePlayer = player.team === activeTeam
        if (choicePhase && activePlayer) {
          const action = (4 + choice - this.summary.qTurns) % 4
          this.summary.action = action
          this.summary.countdown = 0
        }
      })
      socket.on('selectTeam', (team: number) => {
        const opening = this.getActiveCount() < 2
        const teamPhase = this.summary.phase === 'team'
        if (opening && teamPhase) {
          player.team = team
          if (this.getActiveCount() > 1) {
            this.summary.full = true
            this.paused = false
          }
          if (!this.versus) {
            this.start()
          }
        }
      })
      socket.on('undo', (choice: number) => {
        const playerCount = this.getPlayerCount()
        const singlePlayer = playerCount === 1
        const activeTeam = this.summary.round % 2
        const activePlayer = player.team === activeTeam
        if (singlePlayer && activePlayer) {
          undo(this.summary)
          if (this.summary.phase === 'team') {
            this.players.forEach(player => {
              player.team = -1
            })
          }
          this.players.forEach(player => {
            player.socket.emit('move', this.summary)
          })
        }
      })
      socket.on('disconnect', () => {
        this.players = this.players.filter(p => p.id !== socket.id)
        console.log('disconnect:', socket.id, this.players.length)
        if (this.players.length === 0) {
          this.reset()
        }
      })
    })
  }

  start (): void {
    const count0 = this.getTeamCount(0)
    const count1 = this.getTeamCount(1)
    const maxCount = Math.max(count0, count1)
    if (maxCount > 1) {
      this.level = clamp(1, 30, this.level + 1)
      this.reset()
      return
    }
    if (this.versus) {
      this.level = clamp(1, 30, this.level - 1)
    }
    this.summary.full = true
    this.paused = false
    const empty0 = count0 === 0
    const empty1 = count1 === 0
    if (empty0) this.summary.botTeam = 0
    if (empty1) this.summary.botTeam = 1
    this.summary.phase = 'choice'
    this.summary.countdown = choiceInterval
    this.botThink()
  }

  tick (): void {
    this.summary.tick += 1
    this.players.forEach(player => {
      player.socket.emit('tick', this.summary, player.team)
    })
    if (this.paused) return
    const choicePhase = this.summary.phase === 'choice'
    if (this.versus || !choicePhase) {
      this.summary.countdown = Math.max(0, this.summary.countdown - tickInterval)
    }
    if (this.summary.countdown === 0) this.step()
  }

  step (): void {
    if (this.summary.phase === 'team') {
      this.start()
    } else if (this.summary.phase === 'move') {
      this.summary.phase = 'choice'
      this.summary.countdown = choiceInterval
      this.botThink()
    } else if (this.summary.phase === 'choice') {
      advance(this.summary)
      this.players.forEach(player => {
        player.socket.emit('move', this.summary)
      })
    } else if (this.summary.phase === 'end') {
      this.reset()
    }
  }

  botThink (): void {
    const team = this.summary.round % 2
    const botAct = team === this.summary.botTeam
    if (botAct) {
      this.summary.action = this.bot.getAction(this.summary.state)
      this.summary.countdown = 0
    }
  }

  reset (): void {
    this.updateLevel()
    this.summary = new Summary(this, this.level)
    this.paused = true
    this.players.forEach(player => {
      player.team = -1
      player.socket.emit('move', this.summary)
    })
  }

  updateLevel (): void {
    if ([0, 1].includes(this.summary.botTeam)) {
      const botTeam = this.summary.botTeam
      const playerTeam = 1 - botTeam
      const scores = getScores(this.summary)
      const botScore = scores[botTeam]
      const playerScore = scores[playerTeam]
      if (playerScore > botScore) {
        this.level = clamp(1, 30, this.level + 1)
      }
      if (playerScore < botScore) {
        this.level = clamp(1, 30, this.level - 1)
      }
    }
  }

  getSmallTeam (): number {
    const teamCount0 = this.getTeamCount(0)
    const teamCount1 = this.getTeamCount(1)
    if (teamCount1 > teamCount0) return 0
    if (teamCount0 > teamCount1) return 1
    return sample([0, 1])
  }

  getTeamCount (team: number): number {
    const teamPlayers = this.players.filter(p => p.team === team)
    return teamPlayers.length
  }

  getPlayerCount (): number {
    const count0 = this.getTeamCount(0)
    const count1 = this.getTeamCount(1)
    return count0 + count1
  }

  getActiveCount (): number {
    const playerCount = this.getPlayerCount()
    const botCount = this.versus ? 0 : 1
    return playerCount + botCount
  }
}
