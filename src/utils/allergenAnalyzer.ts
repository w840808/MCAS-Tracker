export function analyzeAllergens(food: string): string[] {
  const f = food.toLowerCase();
  const allergens: Set<string> = new Set();

  // Dairy & High Histamine
  if (f.includes('cheese') || f.includes('milk') || f.includes('yogurt') || f.includes('dairy') || f.includes('butter')) {
    allergens.add('Dairy');
    if (f.includes('cheese') || f.includes('yogurt') || f.includes('kefir')) allergens.add('High Histamine');
  }
  
  // Gluten
  if (f.includes('bread') || f.includes('wheat') || f.includes('pasta') || f.includes('gluten') || f.includes('flour') || f.includes('noodle')) {
    allergens.add('Gluten');
  }
  
  // Nightshades
  if (f.includes('tomato') || f.includes('potato') || f.includes('eggplant') || f.includes('pepper') || f.includes('chili') || f.includes('paprika')) {
    allergens.add('Nightshade');
  }
  
  // Alcohol / Sulfites
  if (f.includes('wine') || f.includes('beer') || f.includes('alcohol') || f.includes('liquor')) {
    allergens.add('Alcohol');
    allergens.add('High Histamine');
    allergens.add('Histamine Liberator');
    allergens.add('Sulfites');
  }
  
  // Histamine Liberators & Specific triggers
  if (f.includes('avocado') || f.includes('spinach') || f.includes('strawberry') || f.includes('citrus') || f.includes('lemon') || f.includes('orange') || f.includes('pineapple') || f.includes('banana') || f.includes('papaya')) {
    allergens.add('Histamine Liberator');
  }
  
  // Soy & Fermented
  if (f.includes('soy') || f.includes('tofu') || f.includes('edamame') || f.includes('miso')) {
    allergens.add('Soy');
    if (f.includes('miso') || f.includes('soy sauce') || f.includes('natto')) allergens.add('High Histamine (Fermented)');
  }
  
  // Caffeine & Chocolate
  if (f.includes('chocolate') || f.includes('cocoa') || f.includes('cacao')) {
    allergens.add('Histamine Liberator');
    allergens.add('Caffeine');
  }
  if (f.includes('coffee') || f.includes('tea') || f.includes('caffeine') || f.includes('matcha')) {
    allergens.add('Caffeine');
  }
  
  // Nuts
  if (f.includes('peanut') || f.includes('nut') || f.includes('almond') || f.includes('cashew') || f.includes('walnut')) {
    allergens.add('Nuts');
  }
  
  // Seafood
  if (f.includes('fish') || f.includes('tuna') || f.includes('salmon') || f.includes('shrimp') || f.includes('seafood') || f.includes('crab') || f.includes('shellfish')) {
    allergens.add('Seafood');
    if (f.includes('canned') || f.includes('smoked')) allergens.add('High Histamine');
  }
  
  // Sugar
  if (f.includes('sugar') || f.includes('syrup') || f.includes('candy') || f.includes('sweet') || f.includes('dessert') || f.includes('cake') || f.includes('cookie')) {
    allergens.add('Sugar');
  }

  // Fermented / Vinegar
  if (f.includes('vinegar') || f.includes('pickle') || f.includes('fermented') || f.includes('kombucha') || f.includes('sauerkraut') || f.includes('kimchi')) {
    allergens.add('High Histamine (Fermented)');
  }

  // Artificial Additives
  if (f.includes('artificial') || f.includes('preservative') || f.includes('dye') || f.includes('color')) {
    allergens.add('Artificial Additives');
  }

  return Array.from(allergens);
}
