// src/main.js
import Phaser from 'phaser';
import './index.css';
import { BootScene } from './scenes/BootScene';
import { LoadingScene } from './scenes/LoadingScene';
import { TitleScene } from './scenes/TitleScene';
import { IngredientSelectionScene } from './scenes/IngredientSelectionScene';
import { UtensilSelectionScene } from './scenes/UtensilSelectionScene';
import { KitchenMapScene } from './scenes/KitchenMapScene';
import { WashingAreaScene } from './scenes/WashingAreaScene';
import { PrepStationScene } from './scenes/PrepStationScene';
import { CookingStoveScene } from './scenes/CookingStoveScene';
import { ServingScene } from './scenes/ServingScene';
import { TasteScoreScene } from './scenes/TasteScoreScene';
import { ResultsScene } from './scenes/ResultsScene';

const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 854,
  parent: 'game-container',
  backgroundColor: '#0d0b14',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [
    BootScene,
    LoadingScene,
    TitleScene,
    IngredientSelectionScene,
    UtensilSelectionScene,
    KitchenMapScene,
    WashingAreaScene,
    PrepStationScene,
    CookingStoveScene,
    ServingScene,
    TasteScoreScene,
    ResultsScene
  ]
};

let game;

// Initialize the game only after fonts are fully loaded
document.fonts.ready.then(() => {
  game = new Phaser.Game(config);

  // Global game state container accessible to all scenes
  game.gameState = {
    emojiMode: false, // Low bandwidth mode
    selectedIngredients: [],
    selectedUtensils: [],
    washingOutcome: null,
    chopThenWash: null,
    grindingPerformance: null,
    slicingPerformance: null,
    cookingSequence: [],
    eventChoices: [],
    selectedAccompaniment: null,
    finalScores: null,
    activePackId: 'efo-egusi',
    gameConfig: null,
    contentPack: {}
  };
});

export default game;
