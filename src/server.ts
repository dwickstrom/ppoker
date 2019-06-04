import { Game } from "./game"
import { AppState, App, initApp } from "./app"
import { initState$ } from "./websocket"
const chalk = require('chalk')
const clipboardy = require('clipboardy')
import * as http from 'http'
import { UUID, die } from "./utils";

const connectionCmd = (addr: string, gameId: UUID, devMode: boolean) => {
    let executable = devMode ? 'node ./build/main.js' : './ppoker'
    return `${executable} client \\
    --address ${addr} \\
    --game ${gameId} \\
    --name "My name"`
}

export const serve = (addr: string, description: string, debugMode: boolean) => {
    const server = http.createServer()
    const gg = Game(description, {})

    const initialAppState: AppState = {
        games: {[gg.id]: gg},
        connections: {},
    }
    
    const app: App = initApp(initialAppState)
    
    console.clear()
    console.log(chalk.yellow('♠ ♥ PPoker Server ♦ ♣'))
    console.log(chalk.green(`Serving on ${addr}`))

    initState$(app, server)
        .subscribe((s: AppState[]): void => {            
            if (debugMode)
                console.log(JSON.stringify(s, null, 2))
            
        }, err => {
            console.error('ERROR', err)
        }, () => setTimeout(die('\n 🎮  ' + chalk.magenta('Game over') + '\n'), 1000))
    
    const joinCmd = connectionCmd(addr, gg.id, debugMode)
    clipboardy.writeSync(joinCmd)
    
    console.log(
        '\n 🎲 ', chalk.magenta(description)
    )
    
    console.log(
        chalk.yellow.bgBlue('\nCopied to clipboard:\n')
    )
    
    console.log(
        chalk.yellowBright(joinCmd))
    
    server.listen(8999)   
}
