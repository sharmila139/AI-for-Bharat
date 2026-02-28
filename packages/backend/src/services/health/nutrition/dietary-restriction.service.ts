/**
 * Dietary Restriction Support Service
 * Handles dietary restrictions, allergies, and ingredient substitutions
 * Tasks 17.7, 17.10: Occupation-based adjustment, dietary restriction support
 */

import {
  DietaryRestriction,
  DietaryRestrictionProfile,
  IngredientSubstitution,
  FoodItem,
  OccupationType,
  OCCUPATION_CALORIE_RANGES
} from '../../../types/nutrition';

export class DietaryRestrictionService {
  /**
   * Validate food item against dietary restrictions (Task 17.10)
   */
  validateFoodItem(
    food: FoodItem,
    restrictions: DietaryRestrictionProfile
  ): { allowed: boolean; reasons: string[] } {
    const reasons: string[] = [];
    let allowed = true;

    // Check dietary restrictions
    for (const restriction of restrictions.restrictions) {
      if (!this.checkDietaryRestriction(food, restriction)) {
        allowed = false;
        reasons.push(`Not suitable for ${restriction} diet`);
      }
    }

    // Check allergies
    for (const allergy of restrictions.allergies) {
      if (this.containsAllergen(food, allergy)) {
        allowed = false;
        reasons.push(`Contains allergen: ${allergy}`);
      }
    }

    // Check religious restrictions
    if (restrictions.religiousRestrictions) {
      for (const restriction of restrictions.religiousRestrictions) {
        if (!this.checkReligiousRestriction(food, restriction)) {
          allowed = false;
          reasons.push(`Not suitable for ${restriction} dietary laws`);
        }
      }
    }

    // Check medical restrictions
    if (restrictions.medicalRestrictions) {
      for (const restriction of restrictions.medicalRestrictions) {
        if (!this.checkMedicalRestriction(food, restriction)) {
          allowed = false;
          reasons.push(`Not suitable for ${restriction} condition`);
        }
      }
    }

    return { allowed, reasons };
  }

  /**
   * Check dietary restriction (vegetarian, vegan, etc.)
   */
  private checkDietaryRestriction(food: FoodItem, restriction: DietaryRestriction): boolean {
    const foodNameLower = food.name.toLowerCase();
    const localNameLower = (food.nameLocal || '').toLowerCase();

    const animalProducts = ['meat', 'chicken', 'fish', 'egg', 'mutton', 'pork', 'beef'];
    const dairyProducts = ['milk', 'cheese', 'yogurt', 'paneer', 'ghee', 'butter', 'curd'];
    const glutenProducts = ['wheat', 'roti', 'bread', 'pasta', 'noodles'];

    switch (restriction) {
      case 'vegetarian':
        return !animalProducts.some(item => 
          foodNameLower.includes(item) || localNameLower.includes(item)
        );

      case 'vegan':
        const nonVegan = [...animalProducts, ...dairyProducts];
        return !nonVegan.some(item => 
          foodNameLower.includes(item) || localNameLower.includes(item)
        );

      case 'gluten_free':
        return !glutenProducts.some(item => 
          foodNameLower.includes(item) || localNameLower.includes(item)
        );

      case 'lactose_intolerant':
        return !dairyProducts.some(item => 
          foodNameLower.includes(item) || localNameLower.includes(item)
        );

      case 'diabetic':
        // Avoid high sugar foods
        const highSugar = ['sugar', 'sweet', 'candy', 'dessert', 'mithai'];
        return !highSugar.some(item => 
          foodNameLower.includes(item) || localNameLower.includes(item)
        );

      default:
        return true;
    }
  }

  /**
   * Check if food contains allergen
   */
  private containsAllergen(food: FoodItem, allergen: string): boolean {
    const foodNameLower = food.name.toLowerCase();
    const localNameLower = (food.nameLocal || '').toLowerCase();
    const allergenLower = allergen.toLowerCase();

    return foodNameLower.includes(allergenLower) || localNameLower.includes(allergenLower);
  }

  /**
   * Check religious dietary restrictions
   */
  private checkReligiousRestriction(food: FoodItem, restriction: string): boolean {
    const foodNameLower = food.name.toLowerCase();
    const restrictionLower = restriction.toLowerCase();

    if (restrictionLower.includes('halal')) {
      // No pork for halal
      return !foodNameLower.includes('pork');
    }

    if (restrictionLower.includes('kosher')) {
      // No pork or shellfish for kosher
      return !foodNameLower.includes('pork') && !foodNameLower.includes('shellfish');
    }

    if (restrictionLower.includes('hindu')) {
      // No beef for Hindu
      return !foodNameLower.includes('beef');
    }

    if (restrictionLower.includes('jain')) {
      // No root vegetables, onion, garlic for Jain
      const jainRestricted = ['onion', 'garlic', 'potato', 'carrot', 'radish'];
      return !jainRestricted.some(item => foodNameLower.includes(item));
    }

    return true;
  }

  /**
   * Check medical dietary restrictions
   */
  private checkMedicalRestriction(food: FoodItem, restriction: string): boolean {
    const foodNameLower = food.name.toLowerCase();
    const restrictionLower = restriction.toLowerCase();

    if (restrictionLower.includes('low sodium') || restrictionLower.includes('hypertension')) {
      // Avoid high sodium foods
      const highSodium = ['pickle', 'papad', 'chips', 'processed'];
      return !highSodium.some(item => foodNameLower.includes(item));
    }

    if (restrictionLower.includes('low fat') || restrictionLower.includes('heart')) {
      // Avoid high fat foods
      const highFat = ['fried', 'ghee', 'butter', 'cream'];
      return !highFat.some(item => foodNameLower.includes(item));
    }

    if (restrictionLower.includes('kidney') || restrictionLower.includes('renal')) {
      // Avoid high potassium and phosphorus
      const kidneyRestricted = ['banana', 'tomato', 'potato', 'dairy'];
      return !kidneyRestricted.some(item => foodNameLower.includes(item));
    }

    return true;
  }

  /**
   * Get ingredient substitutions (Task 17.10)
   */
  getIngredientSubstitutions(
    ingredient: string,
    restrictions: DietaryRestrictionProfile
  ): IngredientSubstitution[] {
    const substitutions: IngredientSubstitution[] = [];
    const ingredientLower = ingredient.toLowerCase();

    // Vegetarian/Vegan substitutions
    if (restrictions.restrictions.includes('vegetarian') || restrictions.restrictions.includes('vegan')) {
      if (ingredientLower.includes('egg')) {
        substitutions.push({
          original: ingredient,
          substitute: 'Flax egg (1 tbsp ground flaxseed + 3 tbsp water)',
          reason: 'Vegan egg substitute',
          nutritionalImpact: 'Similar binding properties, adds omega-3 fatty acids'
        });
      }

      if (ingredientLower.includes('milk') && restrictions.restrictions.includes('vegan')) {
        substitutions.push({
          original: ingredient,
          substitute: 'Soy milk or almond milk',
          reason: 'Vegan milk alternative',
          nutritionalImpact: 'Similar protein content (soy), lower calories (almond)'
        });
      }

      if (ingredientLower.includes('paneer') && restrictions.restrictions.includes('vegan')) {
        substitutions.push({
          original: ingredient,
          substitute: 'Tofu',
          reason: 'Vegan protein alternative',
          nutritionalImpact: 'Similar protein content, lower fat'
        });
      }
    }

    // Gluten-free substitutions
    if (restrictions.restrictions.includes('gluten_free')) {
      if (ingredientLower.includes('wheat') || ingredientLower.includes('roti')) {
        substitutions.push({
          original: ingredient,
          substitute: 'Rice flour roti or jowar roti',
          reason: 'Gluten-free grain alternative',
          nutritionalImpact: 'Similar carbohydrate content, different fiber profile'
        });
      }
    }

    // Lactose-free substitutions
    if (restrictions.restrictions.includes('lactose_intolerant')) {
      if (ingredientLower.includes('milk')) {
        substitutions.push({
          original: ingredient,
          substitute: 'Lactose-free milk or plant-based milk',
          reason: 'Lactose-free alternative',
          nutritionalImpact: 'Similar nutritional profile without lactose'
        });
      }

      if (ingredientLower.includes('yogurt') || ingredientLower.includes('curd')) {
        substitutions.push({
          original: ingredient,
          substitute: 'Coconut yogurt or soy yogurt',
          reason: 'Lactose-free probiotic alternative',
          nutritionalImpact: 'Similar probiotic benefits, different fat profile'
        });
      }
    }

    // Diabetic substitutions
    if (restrictions.restrictions.includes('diabetic')) {
      if (ingredientLower.includes('sugar')) {
        substitutions.push({
          original: ingredient,
          substitute: 'Stevia or monk fruit sweetener',
          reason: 'Low glycemic index sweetener',
          nutritionalImpact: 'Zero calories, does not raise blood sugar'
        });
      }

      if (ingredientLower.includes('white rice')) {
        substitutions.push({
          original: ingredient,
          substitute: 'Brown rice or quinoa',
          reason: 'Lower glycemic index grain',
          nutritionalImpact: 'More fiber, slower glucose release'
        });
      }
    }

    return substitutions;
  }

  /**
   * Filter food items by dietary restrictions
   */
  filterFoodsByRestrictions(
    foods: FoodItem[],
    restrictions: DietaryRestrictionProfile
  ): FoodItem[] {
    return foods.filter(food => {
      const validation = this.validateFoodItem(food, restrictions);
      return validation.allowed;
    });
  }

  /**
   * Get occupation-based calorie adjustment (Task 17.7)
   */
  getOccupationCalorieRange(occupation: OccupationType): {
    minCalories: number;
    maxCalories: number;
    description: string;
    recommendedCalories: number;
  } {
    const rangeKey = this.mapOccupationToRangeKey(occupation);
    const range = OCCUPATION_CALORIE_RANGES[rangeKey];

    if (!range) {
      return {
        minCalories: 2000,
        maxCalories: 2500,
        description: 'Moderate activity level',
        recommendedCalories: 2250
      };
    }

    return {
      minCalories: range.minCalories,
      maxCalories: range.maxCalories,
      description: range.description,
      recommendedCalories: Math.round((range.minCalories + range.maxCalories) / 2)
    };
  }

  /**
   * Map occupation type to calorie range key
   */
  private mapOccupationToRangeKey(occupation: OccupationType): string {
    const mapping: Record<OccupationType, string> = {
      desk_job: 'sedentary',
      light_physical: 'light',
      moderate_physical: 'moderate',
      heavy_physical: 'heavy',
      farming: 'heavy'
    };

    return mapping[occupation] || 'moderate';
  }

  /**
   * Adjust meal plan for dietary restrictions
   */
  adjustMealPlanForRestrictions(
    meals: FoodItem[],
    restrictions: DietaryRestrictionProfile
  ): {
    adjustedMeals: FoodItem[];
    substitutions: IngredientSubstitution[];
  } {
    const adjustedMeals: FoodItem[] = [];
    const substitutions: IngredientSubstitution[] = [];

    for (const meal of meals) {
      const validation = this.validateFoodItem(meal, restrictions);

      if (validation.allowed) {
        adjustedMeals.push(meal);
      } else {
        // Find substitution
        const mealSubstitutions = this.getIngredientSubstitutions(meal.name, restrictions);
        
        if (mealSubstitutions.length > 0) {
          const sub = mealSubstitutions[0];
          substitutions.push(sub);
          
          // Create adjusted meal with substitute
          const adjustedMeal: FoodItem = {
            ...meal,
            name: sub.substitute,
            nameLocal: sub.substitute
          };
          adjustedMeals.push(adjustedMeal);
        }
      }
    }

    return { adjustedMeals, substitutions };
  }

  /**
   * Get dietary restriction summary
   */
  getDietaryRestrictionSummary(restrictions: DietaryRestrictionProfile): {
    totalRestrictions: number;
    categories: string[];
    avoidFoods: string[];
    substitutionCount: number;
  } {
    const categories: string[] = [];

    if (restrictions.restrictions.length > 0) {
      categories.push('Dietary preferences');
    }
    if (restrictions.allergies.length > 0) {
      categories.push('Allergies');
    }
    if (restrictions.religiousRestrictions && restrictions.religiousRestrictions.length > 0) {
      categories.push('Religious restrictions');
    }
    if (restrictions.medicalRestrictions && restrictions.medicalRestrictions.length > 0) {
      categories.push('Medical restrictions');
    }

    const avoidFoods = this.getAvoidFoodsList(restrictions);

    return {
      totalRestrictions: 
        restrictions.restrictions.length +
        restrictions.allergies.length +
        (restrictions.religiousRestrictions?.length || 0) +
        (restrictions.medicalRestrictions?.length || 0),
      categories,
      avoidFoods,
      substitutionCount: avoidFoods.length
    };
  }

  /**
   * Get list of foods to avoid based on restrictions
   */
  private getAvoidFoodsList(restrictions: DietaryRestrictionProfile): string[] {
    const avoidFoods: string[] = [];

    for (const restriction of restrictions.restrictions) {
      switch (restriction) {
        case 'vegetarian':
          avoidFoods.push('Meat', 'Fish', 'Chicken', 'Eggs');
          break;
        case 'vegan':
          avoidFoods.push('Meat', 'Fish', 'Chicken', 'Eggs', 'Dairy products');
          break;
        case 'gluten_free':
          avoidFoods.push('Wheat', 'Barley', 'Rye', 'Regular bread');
          break;
        case 'lactose_intolerant':
          avoidFoods.push('Milk', 'Cheese', 'Yogurt', 'Ice cream');
          break;
        case 'diabetic':
          avoidFoods.push('Sugar', 'Sweets', 'White rice', 'Refined carbs');
          break;
      }
    }

    // Add allergies
    avoidFoods.push(...restrictions.allergies);

    return [...new Set(avoidFoods)]; // Remove duplicates
  }
}
