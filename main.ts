#!/usr/bin/env node

import * as app from 'commander'
import { serve } from './src/server'
import { joinGame } from './src/client/client';

app
  .version('0.0.1')

app
  .command('server')
  .description('Start a poll')
  .option('-t --title <title>', 'Give it a title')
  .option('-a --address <address>', 'Server address')  
  .option('-d --debug', 'Print app state to screen')  
  .action((cmd) => {    
    serve(cmd.address, cmd.title, cmd.debug)     
  })

app
  .command('client')
  .description('Play Planning Poker')
  .option('-g --game <id>', 'Game <uuid>')
  .option('-a --address <address>', 'Server address')
  .option('-n --name <name>', 'Player name')
  .action((cmd) => {
    joinGame(cmd.game, cmd.address, cmd.name)
  })


if(!process.argv.slice(3).length) {
  app.outputHelp()
  process.exit()
}

app.parse(process.argv)
