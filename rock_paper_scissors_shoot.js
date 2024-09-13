// ascii-table
import crypto from 'crypto';
import { rawlist  } from '@inquirer/prompts';

class GameError {
    static displayError(message) {
        console.error(`Error: ${message}`);
        console.error("Example usage: node rock_paper_scissors_shoot.js Rock Paper Scissors Spock Shoot");
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
            GameError.displayError("You must provide an odd number of moves, and it should be ≥ 3");
        }

        // eliminate repeating moves
        const movesSet = new Set(this.moves);
        if (movesSet.size !== this.moves.length) {
            GameError.displayError("All moves must be unique");
        }
    }
}

class CryptoManager {
    constructor() {
        this.key = crypto.randomBytes(32);  // generate a 256 bit cryptographically strong random key
    }
    calculateHMAC(move) {
        return crypto.createHmac('sha256', this.key).update(move).digest("hex");
    }
    getKey() {
        return this.key.toString("hex"); // make readable
    }
}
class UIManager {
    static async getUserMove(choices) {
        return rawlist({
            message: "Choose your move:",
            choices
        });
    }

    static message(message) {
        console.log(message);
    }
}

class GameLogic {
    static determineWinner(userMove, computerMove, moves) {
        // TODO: add logic Math.sign((a - b + p + n) % n - p);
        return "Who wins? Who can say?"; // placeholder
    }
}

class GameManager {
    constructor(moves) {
        this.moves = moves;
        this.cryptoManager = new CryptoManager();
        this.selections = [...moves.map(move => ({ name: move, value: move })),
            { name: "Exit", value: "exit", key: "0" }, { name: "Help", value: "help", key: "?" }];
    }

    async play() {
        UIManager.message("~~~ Rock Paper Scissors Shoot ~~~");
        // simulate computer move randomly
        const computerMove = this.moves[Math.floor(Math.random() * this.moves.length)];
        // TODO: ensure that HMAC is changing every time
        const hmac = this.cryptoManager.calculateHMAC(computerMove);
        UIManager.message(`HMAC: ${hmac}`); // display HMAC for validation

        const userMove = await UIManager.getUserMove(this.selections);
        if (userMove === "exit") {
            UIManager.message("Exiting the game...");
            process.exit(0);
        } else if (userMove === "help") {
            UIManager.message("In this game, a move wins against the next half of the moves in the sequence and loses to the previous half.");
            return this.play(); // restart
        }

        UIManager.message(`Your move: ${userMove}`);
        UIManager.message(`Computer move: ${computerMove}`);
        
        const result = GameLogic.determineWinner(userMove, computerMove, this.moves);
        UIManager.message(result);
        UIManager.message(`HMAC Key: ${this.cryptoManager.getKey()}`);
    }
}

const config = new GameConfig(process.argv);
const game = new GameManager(config.moves);
game.play();