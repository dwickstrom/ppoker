import { Games, leaveAllGames, Game, GameStateLabel, isAbandoned, Vote, addVote, canVote, GameState, _Game } from "../src/game"
import { PlayerPool } from "../src/player"
import { Event, playerVoted, playerJoinedGame, clientDisconnected, addPlayer } from "../src/event"
import { now, toList, removeKey } from "../src/utils"
import { AppState } from "../src/app"
import { currentGameState } from "../src/websocket";
const socket = require('socket.io')


describe('AppStateReducers', () => {
    test('playerJoinedGame', () => {
        let game = Game('a game', {})
        
        let playerJoinedGameEvent = Event('PlayerJoinedGame', {
            gameId: game.id,
            playerId: 'pid',
        })

        let appStateBuffer: AppState[] = [{
            games: {[game.id]: game},
            connections: {},
        }]

        let started: GameStateLabel = 'started'
        let actualStateBuffer = playerJoinedGame(playerJoinedGameEvent, socket)(appStateBuffer)
        
        expect(actualStateBuffer[0].games[game.id].players['pid']).not.toBeUndefined
        expect(actualStateBuffer.length).toBe(1)
        expect(actualStateBuffer[0].games[game.id].state.length).toBe(2)
        expect(actualStateBuffer[0].games[game.id].state[1].label).toBe(started)
    })

    test('1st player vote will update game state to started', () => {   
        let pid1 = 'pid1'
        let players: PlayerPool = {[pid1]: {joinedAt: new Date(), leftAt: null, name: 'foo-name', playerId: pid1}}
        let game = Game('a game', players)
        let vote = Vote(pid1, 20, game.id)
        
        let playerVotedEvent = Event('PlayerVoted', {
            vote,
            connectionId: pid1,
        })

        let appStateBuffer: AppState[] = [{
            games: {[game.id]: game},
            connections: {},
        }]


        let actual = playerVoted(playerVotedEvent, socket)(appStateBuffer)

        expect(actual[0].games[game.id].votes.length).toBe(1)
        expect(actual[0].games[game.id].votes[0].playerId).toBe(pid1)
        expect(actual[0].games[game.id].votes[0].value).toBe(20)
        expect(actual[0].games[game.id].state[1].label).toBe('started')
    })

    test('Last player vote will update game state to complete', () => {   
        let pid1 = 'pid1'
        let pid2 = 'pid2'
        let players: PlayerPool = {
            [pid1]: {joinedAt: new Date(), leftAt: null, name: 'foo-name', playerId: pid1}, 
            [pid2]: {joinedAt: new Date(), leftAt: null, name: 'bar-name', playerId: pid2}, 
        }
        let game = Game('a game', players)
        
        let player1VotedEvent = Event('PlayerVoted', {
            vote: Vote(pid1, 20, game.id),
            connectionId: pid1,
        })

        let player2VotedEvent = Event('PlayerVoted', {
            vote: Vote(pid2, 40, game.id),
            connectionId: pid2,
        })

        let stateBeforeFirstVote: AppState[] = [{
            games: {[game.id]: game},
            connections: {},
        }]


        let stateAfterFirstVote: AppState[] = playerVoted(player1VotedEvent, socket)(stateBeforeFirstVote)
        let started: GameStateLabel = 'started'
        expect(stateAfterFirstVote[0].games[game.id].votes.length).toBe(1)
        expect(stateAfterFirstVote[0].games[game.id].state[1].label).toBe(started)

        let stateAfterLastVote: AppState[] = playerVoted(player2VotedEvent, socket)(stateAfterFirstVote) 

        expect(stateAfterLastVote[0].games[game.id].votes.length).toBe(2)
        expect(stateAfterLastVote[0].games[game.id].votes[1].playerId).toBe(pid2)
        expect(stateAfterLastVote[0].games[game.id].votes[1].value).toBe(40)
        let completed: GameStateLabel = 'completed'

        expect(stateAfterLastVote[0].games[game.id].state[2].label).toBe(completed)
    })

    test('States when some user casts multiple votes', () => {
        let pid1 = 'pid1'
        let pid2 = 'pid2'
        let pid3 = 'pid3'
        let players: PlayerPool = {
            [pid1]: {joinedAt: new Date(), leftAt: null, name: 'foo-name', playerId: pid1}, 
            [pid2]: {joinedAt: new Date(), leftAt: null, name: 'bar-name', playerId: pid2}, 
            [pid3]: {joinedAt: new Date(), leftAt: null, name: 'baz-name', playerId: pid3}, 
        }
        let game:_Game = Game('a game', players)
        
        let player1VotedEvent = Event('PlayerVoted', {
            vote: Vote(pid1, 20, game.id),
            connectionId: pid1,
        })

        let player2VotedEvent = Event('PlayerVoted', {
            vote: Vote(pid2, 40, game.id),
            connectionId: pid2,
        })

        let player2VotedAgainEvent = Event('PlayerVoted', {
            vote: Vote(pid2, 13, game.id),
            connectionId: pid2,
        })

        let player3VotedEvent = Event('PlayerVoted', {
            vote: Vote(pid3, 100, game.id),
            connectionId: pid3,
        })

        let stateBeforeFirstVote: AppState[] = [{
            games: {[game.id]: game},
            connections: {},
        }]

        
        let stateAfterFirstVote: AppState[] = playerVoted(player1VotedEvent, socket)(stateBeforeFirstVote)        

        expect(stateAfterFirstVote[0].games[game.id].votes.length).toBe(1)
        expect(stateAfterFirstVote[0].games[game.id].state[1].label).toBe('started')

        let stateAfterSecondVote: AppState[] = playerVoted(player2VotedEvent, socket)(stateAfterFirstVote) 

        let stateAfterThirdVote: AppState[] = playerVoted(player2VotedAgainEvent, socket)(stateAfterSecondVote) 

        expect(stateAfterThirdVote[0].games[game.id].votes.length).toBe(2)
        expect(stateAfterThirdVote[0].games[game.id].votes[1].playerId).toBe(pid2)
        expect(stateAfterThirdVote[0].games[game.id].votes[1].value).toBe(13)
        expect(stateAfterThirdVote[0].games[game.id].state[1].label).toBe('started')

        let stateAfterFourthVote: AppState[] = playerVoted(player3VotedEvent, socket)(stateAfterThirdVote) 

        expect(stateAfterFourthVote[0].games[game.id].votes.length).toBe(3)
        expect(stateAfterFourthVote[0].games[game.id].votes[2].playerId).toBe(pid3)
        expect(stateAfterFourthVote[0].games[game.id].votes[2].value).toBe(100)
        expect(stateAfterFourthVote[0].games[game.id].state[2].label).toBe('completed')
    })

    test('that player pool decreases when some player disconnects', () => {
        let pid1 = 'pid1'
        let pid2 = 'pid2'
        let pid3 = 'pid3'
        let players: PlayerPool = {
            [pid1]: {joinedAt: new Date(), leftAt: null, name: 'foo-name', playerId: pid1}, 
            [pid2]: {joinedAt: new Date(), leftAt: null, name: 'bar-name', playerId: pid2}, 
            [pid3]: {joinedAt: new Date(), leftAt: null, name: 'baz-name', playerId: pid3}, 
        }
        let game: _Game = Game('a game', players)

        let stateBeforeDisconnect: AppState[] = [{
            games: {[game.id]: game},
            connections: {},
        }]

        let stateAfterPlayer3Disconnects = 
            clientDisconnected(Event('ClientDisconnected', {
                connection: {id: 'pid3'}}), socket)(stateBeforeDisconnect)

        let decreasedPlayersPool = stateAfterPlayer3Disconnects[0].games[game.id].players

        expect(decreasedPlayersPool[pid1].leftAt).toBeNull()
        expect(decreasedPlayersPool[pid2].leftAt).toBeNull()
        expect(decreasedPlayersPool[pid3].leftAt).not.toBeNull()        
    })
})


describe('Game utils', () => {
    test('disconnecting player leaves all her games', () => {
        let game = Game('foo', {'connection-id': {joinedAt: now(), leftAt: null, name: 'foo-name', playerId: 'pid'}, })
        let games = { [game.id]: game }
        
        let actual: Games = leaveAllGames('connection-id')(games)
        
        expect(actual[game.id].players['connection-id']).toHaveProperty('leftAt')
        expect(actual[game.id].players['connection-id'].leftAt).not.toBe(null)
    })

    test('state is ”abandoned" after last player disconnected from game', () => {
        let game = Game('foo', {'connection-id': {joinedAt: now(), leftAt: null, name: 'foo-name', playerId: 'pid'}})
        let games = { [game.id]: game }

        let actual: Games = leaveAllGames('connection-id')(games)

        let expected: GameStateLabel = 'abandoned'        
        expect(actual[game.id].state[1].label).toBe(expected)
    })

    test('is not abandoned', () => {
        let players: PlayerPool = {
            'playerId': {joinedAt: new Date(), leftAt: null, name: 'foo-name', playerId: 'pid'}
        }
        let actual = isAbandoned(players)
        expect(actual).not.toBeTruthy()
    })

    test('is abandoned', () => {
        let players: PlayerPool = {
            'playerId': {joinedAt: new Date(), leftAt: new Date(), name: 'foo-name', playerId: 'pid'}
        }
        let actual = isAbandoned(players)
        expect(actual).toBeTruthy()
    })

    test('vote is appended to game', () => {        
        let game = Game('foo', {'pid': {joinedAt: new Date(), leftAt: new Date(), name: 'foo-name', playerId: 'pid'}})
        let vote = Vote('pid', 20, game.id)

        let actual = addVote(vote)(game)

        expect(actual.votes.length).toBe(1)
        expect(actual.votes[0].value).toBe(20)
    })

    test('user can vote when ids match', () => {
        let game = Game('foo', {'pid': {joinedAt: new Date(), leftAt: new Date(), name: 'foo-name', playerId: 'pid'}})

        let actual = canVote('pid')(game)

        expect(actual).toBeTruthy()
    })

    test('user cannot vote when ids match', () => {
        let game = Game('foo', {'pid': {joinedAt: new Date(), leftAt: new Date(), name: 'foo-name', playerId: 'pid'}})

        let actual = canVote('other_pid')(game)

        expect(actual).not.toBeTruthy()
    })

    test('user cannot vote when game is over', () => {
        let game = Game('foo', {'pid': {joinedAt: new Date(), leftAt: new Date(), name: 'foo-name', playerId: 'pid'}})

        let nextGame = {
            ...game,
            state: game.state.concat(GameState('expired'))
        }

        let actual = canVote('pid')(nextGame)

        expect(actual).not.toBeTruthy()
    })    

    test('addPlayer', () => {
        let game = Game('a game', {})

        let actual = addPlayer('player-id', 'jane-doe')(game)

        expect(toList(actual.players).length).toBe(1)
    })
})

describe('Other utils', () => {
    test('get current game state from buffer', () => {
        let game:_Game = Game('a game', {})                
        let stateBuffer: AppState[] = [{
            games: {[game.id]: game},
            connections: {},
        }]
        
        let actual = currentGameState(stateBuffer)
        
        expect(actual[0].label).toBe('initialized')
    })
})

describe('removeKey', () => {

    test('removeKey with existing key', () => {
        let some = {
            'abc-123': 'foo'
        }

        let actual = removeKey('abc-123')(some)

        expect(actual).toEqual({})
    })

    test('removeKey with non-existing key', () => {
        let some = {
            'abc-123': 'foo'
        }

        let actual = removeKey('__none__')(some)

        expect(actual).toEqual(some)
    })
})