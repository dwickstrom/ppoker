# ♠ ppoker
A planning poker server and client.


## play
Download [osx-binary](https://github.com/dwickstrom/ppoker/raw/master/dist/)

### Start game 
`./ppoker serve -a http://localhost:8999 -t "Update Kafka"`

### Join game
`./ppoker client --a <server_address> -g <game_id> -n <player_name>`

This command is output by the server, and the user only has to update the name

## ideas
- add server option to start [ngrok](https://github.com/bubenshchykov/ngrok#readme) tunnel
- add option that adds `... | slackcat --channel abc123`


## todo
- more tests
- error handling
	- propagate some errors to client
		- user not allowed to vote
		- user votes on game in invalid state
- breakout code to `GameStateReducer`s
- fsm for game state changes
- retries for state emission
- display game state in client
- strict null checks