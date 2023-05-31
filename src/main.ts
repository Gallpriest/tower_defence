import './style.css';
import './styles/main.css';

import { Game } from './game';

const canvas = document.getElementById('root');

function bootstrap() {
    if (canvas) {
        const game = new Game(canvas);
        game.start();
    }
}

bootstrap();
