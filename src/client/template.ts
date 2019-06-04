import { median, avg, snd } from "../utils"
import { GameStateLabel } from "../game";
import { asciiTable } from "./ascii";
import { PlayerId } from "../player";
import { ResultPair } from "./client";
import { prop } from "ramda";
const chalk = require('chalk')


export const gamePage = (data: any) =>
`
${keyboardMapping()}
${playersTable(data)}
${resultsTable(data)}`

const keyboardMapping = () => `
+---+---+---+---+---+---+---+----+----+----+-----+
│ 0 │ ½ │ 1 │ 2 │ 3 │ 5 │ 8 │ 13 │ 20 │ 40 │ 100 │
+---+---+---+---+---+---+---+----+----+----+-----+
│ Q │ W │ E │ R │ T │ A │ S │ D  │ F  │ G  │ Z   │
+---+---+---+---+---+---+---+----+----+----+-----+\n`

const resultsBox = (result: number[]) => 
`
 📊  ${chalk.magenta('Results')}

+------------------------+
│ Average: ${avg(result).toFixed(2).toString().padEnd(14)}│
+------------------------+
│ Median:  ${median(result).toFixed(2).toString().padEnd(14)}│
+------------------------+
`

const resultsTable = 
  ({votes, gameState}: {votes: ResultPair[], gameState: GameStateLabel}) => {

    return gameState === 'completed'
      ? resultsBox(votes.flatMap(snd).map(prop('value')))
      : ''
  }
    

const playersTable = ({votes, description, gameState, me}: {votes: any, description: string, gameState: GameStateLabel[], me: PlayerId}) => {
return ` 🎲  ${chalk.magenta(description)}
${asciiTable(votes, gameState, me)}`
}
