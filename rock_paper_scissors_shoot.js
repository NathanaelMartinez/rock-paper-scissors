import AsciiTable from 'ascii-table';
import crypto from 'crypto';
import promptSync from 'prompt-sync';

// using prompt-sync to handle sigint 
const prompt = promptSync({ sigint: true });

class GameError {
    static displayError(message) {
        console.error(`Error: ${message}`);
        console.error('Example usage: node rock_paper_scissors_shoot.js Rock Paper Scissors Spock Shoot');
        process.exit(1);
    }
}

class GameConfig {
    constructor(args) {
        this.moves = this.parseArguments(args);
        this.validateMoves();
    }

    parseArguments(args) {
        return args.slice(2); // skip node and script path
    }

    validateMoves() {
        if (this.moves.length < 3 || this.moves.length % 2 === 0) {
            GameError.displayError('You must provide an odd number of moves, and it should be ≥ 3');
        }

        // eliminate repeating moves
        const movesSet = new Set(this.moves);
        if (movesSet.size !== this.moves.length) {
            GameError.displayError('All moves must be unique');
        }
    }
}

class CryptoManager {
    constructor() {
        this.key = crypto.randomBytes(32);  // generate a 256 bit cryptographically strong random key
    }
    calculateHMAC(move) {
        return crypto.createHmac('sha256', this.key).update(move).digest('hex');
    }
    getKey() {
        return this.key.toString('hex'); // make readable
    }
}
class UIManager {
    static displayMenu(choices) {
        this.message('Available moves:');
        choices.forEach((choice, index) => {
            this.message(`${index + 1} - ${choice}`);
        });
        // add 'exit' and 'help'
        this.message('0 - exit');
        this.message('? - help');
    }

    static selectMove(choices) {
        this.displayMenu(choices);

        let userInput = prompt('Enter your move: ');
        if (userInput === '0') {
            return 'exit';
        } else if (userInput === '?') {
            return 'help';
        } else if (userInput >= '1' && userInput <= `${choices.length}`) {
            return choices[parseInt(userInput) - 1]; // Return selected move
        } else {
            this.message('\nInvalid input, please try again.\n');
            return this.selectMove(choices); // recursive - needs return
        }
    }

    static message(message) {
        console.log(message);
    }

    static displayTitle(title) {
        console.clear();  // clear console each time game restarts
        console.log(title);
    }

    static declareWinner(outcome, computerMove, userMove) {
        if (outcome === 1) {
            this.message(`${computerMove} beats ${userMove}`);
            this.message('Computer wins!');
        } else if (outcome === -1) {
            this.message(`${userMove} beats ${computerMove}`);
            this.message('You win!');            
        } else if (outcome === 0) {
            this.message('Draw');
        }
    }

    static playAgainPrompt() {
        let response;
        // loop until valid input
        while (true) {
            response = prompt('Play again? (y/n): ').toLowerCase();  // case-insensitive
            if (response === 'y' || response === 'n') {
                return response === 'y';  // return true if 'y'. otherwise false
            }
            this.message('Invalid input, please enter "y" or "n".');
        }
    }

    static displayOutcomesTable(outcomes, moves) {
        const outcomeDescriptions = {
            0: 'Draw',
            1: 'Player wins',
            '-1': 'Computer wins'
        };
        const table = new AsciiTable('Rules Table')
        table.setHeading('Player \\ Computer', ...moves);
        for (let i = 0; i < outcomes.length; i++) {
            // map numbers to descriptions
            const outcomesRow = outcomes[i].map(outcome => outcomeDescriptions[outcome]);
            table.addRow(moves[i], ...outcomesRow);
        }
        this.message(table.toString());
    }
}

class GameLogic {
    static determineOutcome(computerMove, userMove, moves) {
        /*
        formula: Math.sign((a - b + p + n) % n - p);
        a: Index of the first move (computerMove).
        b: Index of the second move (userMove).
        n: Total number of possible moves.
        p: Half of n (floored) = number of moves each move beats (move beats half the moves in circular array).
        */
        const a = moves.indexOf(computerMove);
        const b = moves.indexOf(userMove);
        const n = moves.length;
        const p = Math.floor(n/2);
        const outcome = Math.sign((a - b + p + n) % n - p);

        return outcome;
    }

    // get possible outcomes for rules table
    static getAllOutcomes(moves) {
        const outcomes = [];
        const numberOfMoves = moves.length
        // iterate through all move combinations
        for (let i = 0; i < numberOfMoves; i++) {
            const row = [];
            for (let j = 0; j < numberOfMoves; j++) {
                const result = this.determineOutcome(moves[i], moves[j], moves);
                row.push(result);
            }
            outcomes.push(row);
        }
        return outcomes;
    }
}

class GameManager {
    constructor(moves) {
        this.moves = moves;
        this.cryptoManager = new CryptoManager();
    }

    async startGame() {
        // only display title when starting game for first time
        UIManager.displayTitle('~~~ Rock Paper Scissors Shoot ~~~');
        await this.gameLoop();
    }

    async gameLoop() {
        // simulate computer move randomly
        const computerMove = this.moves[Math.floor(Math.random() * this.moves.length)];
        const hmac = this.cryptoManager.calculateHMAC(computerMove);
        UIManager.message(`HMAC: ${hmac}`); // display HMAC for validation

        const userMove = await UIManager.selectMove(this.moves);

        if (userMove === 'exit') {
            UIManager.message('Exiting the game...');
            process.exit(0);
        } else if (userMove === 'help') {
            const outcomes = GameLogic.getAllOutcomes(this.moves);
            // render outcomes as table
            UIManager.displayOutcomesTable(outcomes, this.moves);
            return this.gameLoop(); // restart
        }

        UIManager.message(`Your move: ${userMove}`);
        UIManager.message(`Computer move: ${computerMove}`);
        
        const outcome = GameLogic.determineOutcome(computerMove, userMove, this.moves);
        UIManager.declareWinner(outcome, computerMove, userMove);
        UIManager.message(`HMAC Key: ${this.cryptoManager.getKey()}`);

        // game over - play again?
        if (UIManager.playAgainPrompt()) {
            return this.gameLoop(); // restart
        } else {
            UIManager.message('Thanks for playing! Exiting now.');
            process.exit(0);  // quit game
        }
    }
}

const config = new GameConfig(process.argv);
const game = new GameManager(config.moves);
game.startGame();