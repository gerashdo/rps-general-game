const crypto = require('crypto');

const AsciiTable = require('ascii-table')

class KeyGenerator {
    static generateKey() {
        return crypto.randomBytes(32).toString('hex'); // 256-bit key
    }
}

class HMACGenerator {
    static generateHMAC(key, message) {
        return crypto.createHmac('sha256', key).update(message).digest('hex');
    }
}

class GameRules {
    constructor(moves) {
        this.moves = moves;
        this.rulesTable = this.createTable();
    }

    determineWinner(userMoveIndex, computerMoveIndex) {
        if (userMoveIndex === computerMoveIndex) return 'Draw';

        const n = this.moves.length;
        const half = Math.floor(n / 2);
        const difference = (computerMoveIndex - userMoveIndex + n) % n;

        return difference <= half ? 'You lose!' : 'You win!';
    }

    createTable() {
      const n = this.moves.length;
      const table = new AsciiTable('Rules');
      table.setHeading('v PC/User >', ...this.moves)

      for (let i = 0; i < n; i++) {
          let row = [];
          for (let j = 0; j < n; j++) {
              if (i === j) {
                  row.push('Draw');
              } else {
                  const result = this.determineWinner(j, i);
                  row.push( result === 'You win!' ? 'Win' : 'Lose');
              }
          }
          table.addRow(this.moves[i], ...row);
      }

      return table;
    }

    displayHelpTable() {
      console.log(this.rulesTable.toString());
    }
}

class Game {
    constructor(moves) {
        this.moves = moves;
        this.rules = new GameRules(moves);
        this.key = KeyGenerator.generateKey();
        this.computerMoveIndex = Math.floor(Math.random() * moves.length);
        this.computerMove = moves[this.computerMoveIndex];
        this.hmac = HMACGenerator.generateHMAC(this.key, this.computerMove);
    }

    start() {
        console.log(`HMAC: ${this.hmac}`);
        this.displayMenu();

        process.stdin.on('data', (data) => {
            const input = data.toString().trim();

            if (input === '0') {
                console.log('Exiting...');
                process.exit(0);
            } else if (input === '?') {
                this.rules.displayHelpTable();
                this.displayMenu();
            } else if (!isNaN(input) && +input >= 1 && +input <= this.moves.length) {
                const userMoveIndex = +input - 1;
                const userMove = this.moves[userMoveIndex];

                console.log(`Your move: ${userMove}`);
                console.log(`Computer move: ${this.computerMove}`);

                const result = this.rules.determineWinner(userMoveIndex, this.computerMoveIndex);
                console.log(result);

                console.log(`HMAC key: ${this.key}`);
                process.exit(0);
            } else {
                console.log('Invalid input, please try again.');
                this.displayMenu();
            }
        });
    }

    displayMenu() {
        console.log('Available moves:');
        this.moves.forEach((move, index) => console.log(`${index + 1} - ${move}`));
        console.log('0 - exit');
        console.log('? - help');
        console.log('Enter your move: ');
    }
}

const args = process.argv.slice(2);
if (args.length < 3 || args.length % 2 === 0 || new Set(args).size !== args.length) {
    console.error('Error: Please provide an odd number (greater or equal than 3) of unique moves.');
    console.error('Example: node game.js rock paper scissors');
    process.exit(1);
}

const game = new Game(args);
game.start();
