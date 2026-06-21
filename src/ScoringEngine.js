// src/ScoringEngine.js
export class ScoringEngine {
  constructor(gameConfig, contentPack) {
    this.criteria = gameConfig.scoringCriteria;      // from game-config.json
    this.ingredients = contentPack.ingredients;       // from ingredients.json
    this.utensils = contentPack.utensils;             // from utensils.json
    this.recipes = contentPack.recipeSequences;       // from recipe-sequences.json
    this.judges = contentPack.judges;                 // from judges.json
    this.verdicts = contentPack.verdicts;             // from verdicts.json
    
    this.scores = this.initializeScores();
    this.violatedRules = [];
  }

  initializeScores() {
    let scores = {};
    this.criteria.forEach(c => scores[c.id] = 0);
    return scores;
  }

  applyIngredientScore(ingredientId) {
    const ingredient = this.findIngredient(ingredientId);
    if (!ingredient) return;
    
    for (let [criteria, value] of Object.entries(ingredient.scores)) {
      if (this.scores[criteria] !== undefined) {
        this.scores[criteria] += value;
      }
    }
  }

  applyUtensilScore(utensilId) {
    const utensil = this.findUtensil(utensilId);
    if (!utensil) return;
    
    for (let [criteria, value] of Object.entries(utensil.scores || {})) {
      if (this.scores[criteria] !== undefined) {
        this.scores[criteria] += value;
      }
    }
  }

  applyMiniGameOutcome(outcomeId, miniGameData) {
    const outcome = miniGameData.outcomes.find(o => o.id === outcomeId);
    if (!outcome) return;
    
    for (let [criteria, value] of Object.entries(outcome.scores)) {
      if (this.scores[criteria] !== undefined) {
        this.scores[criteria] += value;
      }
    }
  }

  applyEventChoiceScore(choice) {
    if (!choice || !choice.scores) return;
    for (let [criteria, value] of Object.entries(choice.scores)) {
      if (this.scores[criteria] !== undefined) {
        this.scores[criteria] += value;
      }
    }
  }

  compareSequences(playerSeq, recipeSeq) {
    if (!playerSeq || !recipeSeq || recipeSeq.length === 0) return 0;
    
    let matches = 0;
    let recipeIndex = 0;
    let playerIndex = 0;
    
    // Compare sequences in relative order allowing offset lookaheads
    while (recipeIndex < recipeSeq.length && playerIndex < playerSeq.length) {
      const rStep = recipeSeq[recipeIndex];
      const pStep = playerSeq[playerIndex];
      
      const actionMatches = rStep.action === pStep.action;
      const ingredientMatches = rStep.ingredient === pStep.ingredient;
      
      if (actionMatches && ingredientMatches) {
        matches++;
        recipeIndex++;
        playerIndex++;
      } else {
        // Look ahead in player sequence to see if they just inserted an extra step
        let foundMatch = false;
        for (let lookAhead = playerIndex + 1; lookAhead < Math.min(playerSeq.length, playerIndex + 3); lookAhead++) {
          if (recipeSeq[recipeIndex].action === playerSeq[lookAhead].action && 
              recipeSeq[recipeIndex].ingredient === playerSeq[lookAhead].ingredient) {
            playerIndex = lookAhead;
            foundMatch = true;
            break;
          }
        }
        if (foundMatch) {
          matches++;
          recipeIndex++;
          playerIndex++;
        } else {
          recipeIndex++;
        }
      }
    }
    
    return matches / recipeSeq.length;
  }

  calculateRecipeMatch(playerSequence) {
    let bestMatch = null;
    let highestSimilarity = 0;
    
    for (let recipe of this.recipes.sequences) {
      if (recipe.id === "chaotic_neutral") continue;
      
      let similarity = this.compareSequences(playerSequence, recipe.steps);
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = recipe;
      }
    }
    
    // Apply the best matching recipe's scoring weights (if above threshold)
    if (bestMatch && highestSimilarity > 0.3) {
      for (let [criteria, value] of Object.entries(bestMatch.scoringWeights)) {
        if (this.scores[criteria] !== undefined) {
          this.scores[criteria] += value;
        }
      }
      return bestMatch.name;
    } else {
      // Apply chaotic neutral fallback
      const fallback = this.recipes.sequences.find(s => s.id === "chaotic_neutral");
      if (fallback) {
        for (let [criteria, value] of Object.entries(fallback.scoringWeights)) {
          if (this.scores[criteria] !== undefined) {
            this.scores[criteria] += value;
          }
        }
      }
      return "Chaotic Neutral Method";
    }
  }

  applyCriticalRules(playerSequence, selectedIngredients) {
    if (!this.recipes || !this.recipes.criticalRules) return;
    
    for (let rule of this.recipes.criticalRules) {
      let violated = false;
      
      if (rule.condition === "vegetables_before_simmer") {
        const vegIndices = playerSequence.reduce((acc, s, i) => { if (s.action === "add_vegetables") acc.push(i); return acc; }, []);
        const simmerIndex = playerSequence.findIndex(s => s.action === "simmer");
        const lastVegIndex = vegIndices.length > 0 ? vegIndices[vegIndices.length - 1] : -1;
        if (lastVegIndex !== -1 && simmerIndex !== -1 && lastVegIndex < simmerIndex) {
          violated = true;
        }
      } else if (rule.condition === "onions_not_selected") {
        const hasOnions = selectedIngredients.includes("onions");
        if (!hasOnions) {
          violated = true;
        }
      }
      
      if (violated) {
        for (let [criteria, value] of Object.entries(rule.penalty)) {
          if (this.scores[criteria] !== undefined) {
            this.scores[criteria] += value;
          }
        }
        this.violatedRules.push(rule.message);
      }
    }
  }

  applyJudgeMultipliers() {
    // Clamp criteria scores first so judges rate standard values
    const clampedScores = {};
    for (let c of this.criteria) {
      clampedScores[c.id] = Math.max(0, Math.min(100, this.scores[c.id] || 0));
    }

    return this.judges.judges.map(judge => {
      let totalWeight = 0;
      let weightedSum = 0;
      
      for (let [criteria, weight] of Object.entries(judge.weightMultipliers)) {
        weightedSum += (clampedScores[criteria] || 0) * weight;
        totalWeight += weight;
      }
      
      // Calculate normalized score for this judge
      const judgeScore = totalWeight > 0 ? (weightedSum / totalWeight) : 0;
      const roundedScore = Math.max(0, Math.min(100, Math.round(judgeScore)));
      
      // Find appropriate verdict
      const verdict = judge.verdicts.find(v => 
        roundedScore >= v.minScore && roundedScore <= v.maxScore
      );
      
      return {
        judge: judge.name,
        icon: judge.icon,
        score: roundedScore,
        verdict: verdict ? verdict.message : "..."
      };
    });
  }

  findIngredient(id) {
    for (let category of Object.values(this.ingredients.categories)) {
      const found = category.items.find(item => item.id === id);
      if (found) return found;
    }
    return null;
  }

  findUtensil(id) {
    if (!this.utensils || !this.utensils.categories) return null;
    for (let category of Object.values(this.utensils.categories)) {
      const found = category.items.find(item => item.id === id);
      if (found) return found;
    }
    return null;
  }

  calculateFinalScore() {
    // Clamp criteria scores before final weighting
    for (let c of this.criteria) {
      this.scores[c.id] = Math.max(0, Math.min(100, this.scores[c.id] || 0));
    }
    
    let weightedTotal = 0;
    for (let criteria of this.criteria) {
      weightedTotal += (this.scores[criteria.id] || 0) * criteria.weight;
    }
    
    weightedTotal = Math.max(0, Math.min(100, Math.round(weightedTotal)));
    
    // Find final verdict
    const verdict = this.verdicts.finalVerdicts.find(v =>
      weightedTotal >= v.minTotalScore && weightedTotal <= v.maxTotalScore
    );
    
    return {
      breakdown: { ...this.scores },
      weightedTotal: weightedTotal,
      verdict: verdict ? verdict.message : "The game engine is confused. So are we.",
      meme: verdict ? verdict.meme : null,
      violatedRules: this.violatedRules
    };
  }
}
