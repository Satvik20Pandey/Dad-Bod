const STORAGE_KEY = "transform_hq_v1";

const daysOrder = [
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
];

const defaultState = {
  profile: {
    currentWeight: 82,
    goalWeight: 71,
    age: 22,
    heightCm: 180.3,
    weeklyLoss: 1,
    calorieTarget: 1800,
    maintenanceCalories: 2460,
    deficitCalories: 1800,
    macros: {
      proteinG: 149,
      fatG: 57,
      carbsG: 189,
    },
  },
  settings: {
    apiKey: "",
    aiModel: "openai/gpt-4o-mini",
  },
  mealsByDate: {},
  foodLibrary: {},
  weeklyPlan: null,
  gymLogsByDate: {},
  weightEntries: [],
  photoEntries: [],
};

const defaultWeeklyPlan = {
  Thursday: {
    breakfast: "Tofu sandwich (2 whole wheat bread + 100g tofu + veggies) + unsweetened milk tea",
    lunch: "3-egg omelette + mixed veg + 1 multigrain roti",
    snacks: "Protein shake + banana",
    dinner: "Besan chilla with veggies + 100g tofu + light cheese",
    notes: "Chest day: keep pre-workout coffee 30 min before training.",
  },
  Friday: {
    breakfast: "Overnight oats with milk, chia, and fruit",
    lunch: "Dal (200g cooked) + rice (140g cooked) + salad",
    snacks: "Roasted chana + buttermilk",
    dinner: "Soya chunks tofu tikki wrap in 2 whole wheat breads",
    notes: "Back day: add hydration focus.",
  },
  Saturday: {
    breakfast: "Paneer tofu bhurji + 2 wheat toast",
    lunch: "Rajma (220g cooked) + rice (130g cooked)",
    snacks: "Protein shake + apple",
    dinner: "Chicken breast / tofu stir fry + 2 phulka",
    notes: "Leg day: keep carbs slightly higher pre/post workout.",
  },
  Sunday: {
    breakfast: "Moong chilla + mint curd dip",
    lunch: "Egg curry (3 eggs) + rice (120g cooked) + salad",
    snacks: "Banana + peanut butter thin spread",
    dinner: "Besan chilla + veggies + tofu",
    notes: "Shoulder-safe push day: controlled tempo.",
  },
  Monday: {
    breakfast: "Tofu sandwich repeat + green tea",
    lunch: "Dal (220g cooked) + 2 phulka + cucumber salad",
    snacks: "Protein shake + papaya bowl",
    dinner: "Soya tofu kabab + wheat roti",
    notes: "Pull day: keep posture strict.",
  },
  Tuesday: {
    breakfast: "Poha with peanuts + boiled egg whites / tofu cubes",
    lunch: "Chana masala (220g cooked) + rice (120g cooked)",
    snacks: "Protein shake + guava",
    dinner: "Paneer tofu bhurji + 2 phulka",
    notes: "Leg + core day: long warm-up.",
  },
  Wednesday: {
    breakfast: "Vegetable oats upma + curd",
    lunch: "Khichdi + salad + tofu side",
    snacks: "Fruit + sprouts chaat",
    dinner: "Light soup + grilled tofu + saute veggies",
    notes: "Gym off day: mobility + walking + recovery focus.",
  },
};

const gymSplit = {
  Thursday: {
    title: "Chest + Triceps (Shoulder Safe)",
    note: "Warm up 10 min, keep shoulder blades retracted, avoid painful range.",
    exercises: [
      { name: "Incline dumbbell press", sets: "4 x 8-10", cues: "Neutral grip, controlled descent" },
      { name: "Machine chest press", sets: "3 x 10-12", cues: "Do not lock elbows" },
      { name: "Cable fly (mid height)", sets: "3 x 12-15", cues: "Light weight, slow stretch" },
      { name: "Close-grip push-ups", sets: "3 x 10-15", cues: "Core tight" },
      { name: "Rope triceps pushdown", sets: "3 x 12-15", cues: "Elbows pinned" },
      { name: "Overhead triceps extension", sets: "2 x 12", cues: "Light, pain-free shoulder only" },
    ],
  },
  Friday: {
    title: "Back + Rear Delt + Biceps",
    note: "Focus on posture and scapular control to reduce shoulder strain.",
    exercises: [
      { name: "Lat pulldown (wide/neutral)", sets: "4 x 8-12", cues: "Pull elbows to hips" },
      { name: "Seated cable row", sets: "3 x 10-12", cues: "Chest up, full squeeze" },
      { name: "One-arm dumbbell row", sets: "3 x 10 each", cues: "No torso twist" },
      { name: "Face pulls", sets: "3 x 15", cues: "Lead with elbows" },
      { name: "Dumbbell curls", sets: "3 x 10-12", cues: "No swing" },
      { name: "Hammer curls", sets: "2 x 12", cues: "Neutral wrists" },
    ],
  },
  Saturday: {
    title: "Legs + Calves + Core",
    note: "Big lower body day with stable tempo and full range.",
    exercises: [
      { name: "Barbell / goblet squat", sets: "4 x 8-10", cues: "Knees track over toes" },
      { name: "Romanian deadlift", sets: "3 x 8-10", cues: "Hip hinge, flat back" },
      { name: "Leg press", sets: "3 x 12", cues: "Control both directions" },
      { name: "Walking lunges", sets: "2 x 20 steps", cues: "Long stride" },
      { name: "Standing calf raise", sets: "4 x 15", cues: "Pause at top" },
      { name: "Plank", sets: "3 x 45 sec", cues: "Neutral spine" },
    ],
  },
  Sunday: {
    title: "Shoulder Growth + Light Chest",
    note: "High-quality shoulder stimulus, no painful overhead forcing.",
    exercises: [
      { name: "Seated dumbbell shoulder press", sets: "3 x 8-10", cues: "Pain-free range only" },
      { name: "Lateral raises", sets: "4 x 12-15", cues: "Slight lean, soft elbows" },
      { name: "Rear delt fly", sets: "3 x 12-15", cues: "No neck shrugging" },
      { name: "Cable Y raise", sets: "2 x 15", cues: "Very light and strict" },
      { name: "Incline push-up", sets: "2 x 12", cues: "Smooth reps" },
      { name: "Band external rotation", sets: "2 x 15", cues: "Shoulder prehab" },
    ],
  },
  Monday: {
    title: "Back Width + Arms",
    note: "Second pull day for growth, moderate volume.",
    exercises: [
      { name: "Pull-ups / assisted pull-ups", sets: "3 x 6-10", cues: "Full stretch" },
      { name: "Chest-supported row", sets: "3 x 10", cues: "No lower back cheat" },
      { name: "Straight-arm pulldown", sets: "3 x 12", cues: "Lat isolation" },
      { name: "Preacher curl", sets: "3 x 12", cues: "Controlled eccentric" },
      { name: "Cable curl", sets: "2 x 12-15", cues: "Constant tension" },
      { name: "Farmer carry", sets: "2 x 40 m", cues: "Braced core" },
    ],
  },
  Tuesday: {
    title: "Legs (Posterior Focus) + Core",
    note: "Protect knees and build posterior chain strength.",
    exercises: [
      { name: "Deadlift variation (moderate)", sets: "3 x 5-6", cues: "Technique first" },
      { name: "Bulgarian split squat", sets: "3 x 10 each", cues: "Stay balanced" },
      { name: "Hamstring curl machine", sets: "3 x 12", cues: "Pause contraction" },
      { name: "Hip thrust", sets: "3 x 10", cues: "Squeeze glutes" },
      { name: "Seated calf raise", sets: "3 x 15", cues: "Slow tempo" },
      { name: "Hanging knee raises", sets: "3 x 12", cues: "No swing" },
    ],
  },
  Wednesday: {
    title: "Recovery + Mobility",
    note: "Gym off day: 25-40 min walk, shoulder mobility, light stretching.",
    exercises: [
      { name: "Brisk walk", sets: "30 min", cues: "Nasal breathing" },
      { name: "Thoracic opener drill", sets: "2 x 10", cues: "Smooth reps" },
      { name: "Band pull-aparts", sets: "2 x 20", cues: "Light tension" },
      { name: "Hip mobility flow", sets: "10 min", cues: "No pain" },
      { name: "Deep breathing cooldown", sets: "5 min", cues: "Relax shoulders" },
    ],
  },
};

const builtInFoodDb = {
  tofu: { kcal: 144, protein: 17.3, carbs: 2.8, fat: 8.7, fiber: 1.2, vitA: 25, vitC: 0.2, iron: 2.7, calcium: 350 },
  bread: { kcal: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, vitA: 0, vitC: 0, iron: 3.6, calcium: 107 },
  wholewheat: { kcal: 252, protein: 11, carbs: 44, fat: 4.2, fiber: 6.2, vitA: 0, vitC: 0, iron: 3.1, calcium: 90 },
  cheese: { kcal: 402, protein: 25, carbs: 1.3, fat: 33, fiber: 0, vitA: 265, vitC: 0, iron: 0.7, calcium: 721 },
  egg: { kcal: 143, protein: 13, carbs: 0.7, fat: 9.5, fiber: 0, vitA: 140, vitC: 0, iron: 1.8, calcium: 56 },
  dal: { kcal: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 8, vitA: 8, vitC: 1.5, iron: 3.3, calcium: 19 },
  rice: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, vitA: 0, vitC: 0, iron: 0.2, calcium: 10 },
  banana: { kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, vitA: 3, vitC: 8.7, iron: 0.3, calcium: 5 },
  besan: { kcal: 387, protein: 22, carbs: 58, fat: 7, fiber: 10.8, vitA: 2, vitC: 0, iron: 4.9, calcium: 45 },
  soya: { kcal: 345, protein: 52, carbs: 33, fat: 0.5, fiber: 13, vitA: 8, vitC: 0, iron: 15.7, calcium: 240 },
  milk: { kcal: 61, protein: 3.2, carbs: 5, fat: 3.3, fiber: 0, vitA: 46, vitC: 0, iron: 0.03, calcium: 113 },
  oats: { kcal: 389, protein: 17, carbs: 66, fat: 7, fiber: 10.6, vitA: 0, vitC: 0, iron: 4.7, calcium: 54 },
  chana: { kcal: 364, protein: 19, carbs: 61, fat: 6, fiber: 17, vitA: 3, vitC: 4, iron: 6.2, calcium: 105 },
  paneer: { kcal: 265, protein: 18, carbs: 1.2, fat: 20, fiber: 0, vitA: 210, vitC: 0, iron: 0.2, calcium: 208 },
};

const todayDate = () => new Date().toISOString().slice(0, 10);

function getState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return structuredClone(defaultState);
  }
  try {
    const parsed = JSON.parse(raw);
    const merged = {
      ...structuredClone(defaultState),
      ...parsed,
      profile: { ...structuredClone(defaultState.profile), ...(parsed.profile || {}) },
      settings: { ...structuredClone(defaultState.settings), ...(parsed.settings || {}) },
      mealsByDate: parsed.mealsByDate || {},
      foodLibrary: parsed.foodLibrary || {},
      weeklyPlan: parsed.weeklyPlan || structuredClone(defaultWeeklyPlan),
      gymLogsByDate: parsed.gymLogsByDate || {},
      weightEntries: parsed.weightEntries || [],
      photoEntries: parsed.photoEntries || [],
    };
    if (!merged.weeklyPlan) merged.weeklyPlan = structuredClone(defaultWeeklyPlan);
    return merged;
  } catch {
    return structuredClone(defaultState);
  }
}

let state = getState();
if (!state.weeklyPlan) state.weeklyPlan = structuredClone(defaultWeeklyPlan);
if (!state.profile.calorieTarget) state.profile.calorieTarget = 1800;

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatNum(v, digits = 0) {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function weekdayFromDate(date) {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleDateString(undefined, { weekday: "long" });
}

function currentDayName() {
  return weekdayFromDate(new Date());
}

function select(id) {
  return document.getElementById(id);
}

function setText(id, txt) {
  const el = select(id);
  if (el) el.textContent = txt;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function inferCaloriesFromMacros({ protein = 0, carbs = 0, fat = 0 }) {
  return protein * 4 + carbs * 4 + fat * 9;
}

function updateDateTime() {
  const now = new Date();
  setText(
    "dateTimeText",
    `${now.toLocaleDateString(undefined, {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
    })} • ${now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
  );
}

function renderQuickStats() {
  const chips = [
    `Current ${formatNum(state.profile.currentWeight, 1)} kg`,
    `Goal ${formatNum(state.profile.goalWeight, 1)} kg`,
    `Target ${formatNum(state.profile.calorieTarget)} kcal`,
    `Protein ${formatNum(state.profile.macros.proteinG)} g`,
  ];
  const container = select("quickStats");
  container.innerHTML = chips.map((c) => `<span class="stat-chip">${c}</span>`).join("");
}

function renderTabs() {
  const buttons = Array.from(document.querySelectorAll(".tab-button"));
  const panels = Array.from(document.querySelectorAll(".tab-panel"));
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const id = `tab-${btn.dataset.tab}`;
      const panel = select(id);
      if (panel) panel.classList.add("active");
    });
  });
}

function calculateTargetsFromProfile() {
  const currentWeight = Number(state.profile.currentWeight);
  const goalWeight = Number(state.profile.goalWeight);
  const maintenance = currentWeight * 30;
  const weeklyLoss = Number(state.profile.weeklyLoss || 1);
  const dailyDeficitFromLoss = (weeklyLoss * 7700) / 7;
  let deficitCalories = Math.round(maintenance - dailyDeficitFromLoss);
  deficitCalories = clamp(deficitCalories, 1400, Math.round(maintenance - 200));

  if (state.profile.calorieTarget) {
    deficitCalories = Number(state.profile.calorieTarget);
  }

  const proteinG = Math.round(goalWeight * 2.1);
  const fatG = Math.round(goalWeight * 0.8);
  const proteinFatCals = proteinG * 4 + fatG * 9;
  const carbsCals = Math.max(0, deficitCalories - proteinFatCals);
  const carbsG = Math.round(carbsCals / 4);

  state.profile.maintenanceCalories = Math.round(maintenance);
  state.profile.deficitCalories = Math.round(deficitCalories);
  state.profile.calorieTarget = Math.round(deficitCalories);
  state.profile.macros = {
    proteinG,
    fatG,
    carbsG,
  };

  if (currentWeight < goalWeight) {
    state.profile.goalWeight = currentWeight - 0.5;
  }
}

function renderProfileForm() {
  select("currentWeight").value = state.profile.currentWeight;
  select("goalWeight").value = state.profile.goalWeight;
  select("age").value = state.profile.age;
  select("heightCm").value = state.profile.heightCm;
  select("weeklyLoss").value = state.profile.weeklyLoss;
  select("calorieTarget").value = state.profile.calorieTarget;
}

function renderTargetSummary() {
  const p = state.profile;
  const weeksToGoal = Math.max(1, Math.ceil((p.currentWeight - p.goalWeight) / Math.max(0.2, p.weeklyLoss || 1)));
  const target = select("targetSummary");
  target.innerHTML = `
    <div class="summary-box"><div>Maintenance</div><b>${formatNum(p.maintenanceCalories)} kcal/day</b></div>
    <div class="summary-box"><div>Cut Target</div><b>${formatNum(p.deficitCalories)} kcal/day</b></div>
    <div class="summary-box"><div>Protein</div><b>${formatNum(p.macros.proteinG)} g/day</b></div>
    <div class="summary-box"><div>Fat</div><b>${formatNum(p.macros.fatG)} g/day</b></div>
    <div class="summary-box"><div>Carbs</div><b>${formatNum(p.macros.carbsG)} g/day</b></div>
    <div class="summary-box"><div>Estimated Timeline</div><b>${weeksToGoal} weeks</b></div>
  `;
}

function getTodayMeals() {
  const date = todayDate();
  if (!state.mealsByDate[date]) state.mealsByDate[date] = [];
  return state.mealsByDate[date];
}

function dailyTotals(date = todayDate()) {
  const list = state.mealsByDate[date] || [];
  return list.reduce(
    (acc, meal) => {
      acc.kcal += Number(meal.kcal || 0);
      acc.protein += Number(meal.protein || 0);
      acc.carbs += Number(meal.carbs || 0);
      acc.fat += Number(meal.fat || 0);
      acc.fiber += Number(meal.fiber || 0);
      acc.vitA += Number(meal.vitA || 0);
      acc.vitC += Number(meal.vitC || 0);
      acc.iron += Number(meal.iron || 0);
      acc.calcium += Number(meal.calcium || 0);
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, vitA: 0, vitC: 0, iron: 0, calcium: 0 }
  );
}

function macroProgressRow(label, value, target, unit) {
  const pct = target > 0 ? (value / target) * 100 : 0;
  const width = clamp(pct, 0, 140);
  const cls = width > 120 ? "progress-fill alert" : width > 100 ? "progress-fill warn" : "progress-fill";
  return `
    <div class="summary-box macro-line">
      <div>${label}: <b>${formatNum(value, 1)}${unit}</b> / ${formatNum(target, 1)}${unit}</div>
      <div class="progress-track"><div class="${cls}" style="width:${width}%;"></div></div>
    </div>
  `;
}

function renderDayNutrition() {
  const total = dailyTotals();
  const target = state.profile;
  const container = select("dayNutrition");
  container.innerHTML = `
    <div class="summary-box"><div>Calories</div><b>${formatNum(total.kcal)} / ${formatNum(target.calorieTarget)} kcal</b></div>
    ${macroProgressRow("Protein", total.protein, target.macros.proteinG, "g")}
    ${macroProgressRow("Carbs", total.carbs, target.macros.carbsG, "g")}
    ${macroProgressRow("Fat", total.fat, target.macros.fatG, "g")}
    <div class="summary-box"><div>Fiber</div><b>${formatNum(total.fiber, 1)} g</b></div>
    <div class="summary-box"><div>Vitamin A</div><b>${formatNum(total.vitA, 0)} mcg</b></div>
    <div class="summary-box"><div>Vitamin C</div><b>${formatNum(total.vitC, 1)} mg</b></div>
    <div class="summary-box"><div>Iron</div><b>${formatNum(total.iron, 1)} mg</b></div>
    <div class="summary-box"><div>Calcium</div><b>${formatNum(total.calcium, 0)} mg</b></div>
  `;
}

function slotTitle(slot) {
  return slot.charAt(0).toUpperCase() + slot.slice(1);
}

function renderMealSections() {
  const meals = getTodayMeals();
  const slots = ["breakfast", "lunch", "snacks", "dinner"];
  const wrapper = select("mealSections");

  wrapper.innerHTML = slots
    .map((slot) => {
      const items = meals.filter((m) => m.slot === slot);
      const blocks = items
        .map(
          (item) => `
          <div class="meal-card">
            <h3>${item.name}</h3>
            <p class="meal-meta">${formatNum(item.kcal)} kcal | P ${formatNum(item.protein, 1)}g | C ${formatNum(item.carbs, 1)}g | F ${formatNum(item.fat, 1)}g</p>
            <p class="meal-meta">Fiber ${formatNum(item.fiber, 1)}g | A ${formatNum(item.vitA, 0)}mcg | C ${formatNum(item.vitC, 1)}mg | Iron ${formatNum(item.iron, 1)}mg | Ca ${formatNum(item.calcium, 0)}mg</p>
            ${item.note ? `<p class="meal-meta">${item.note}</p>` : ""}
            <div class="item-actions">
              <button class="btn-secondary" data-delete-meal="${item.id}">Delete</button>
            </div>
          </div>
        `
        )
        .join("");

      return `
        <div class="day-plan">
          <h3>${slotTitle(slot)}</h3>
          ${blocks || `<p class="muted">No meals logged yet.</p>`}
        </div>
      `;
    })
    .join("");

  wrapper.querySelectorAll("[data-delete-meal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-delete-meal");
      state.mealsByDate[todayDate()] = getTodayMeals().filter((m) => m.id !== id);
      saveState();
      renderAll();
    });
  });
}

function normalizeText(t) {
  return (t || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function estimateFromFoodDb(name, qty = 100) {
  const text = normalizeText(name);
  const allDb = { ...builtInFoodDb, ...state.foodLibrary };
  let found = null;

  Object.keys(allDb).forEach((key) => {
    if (text.includes(key) && !found) found = key;
  });

  if (!found) {
    const grams = Number(qty) || 100;
    return {
      kcal: Math.round((200 * grams) / 100),
      protein: (10 * grams) / 100,
      carbs: (18 * grams) / 100,
      fat: (6 * grams) / 100,
      fiber: (3 * grams) / 100,
      vitA: 20,
      vitC: 2,
      iron: 1,
      calcium: 40,
      source: "generic",
    };
  }

  const per100 = allDb[found];
  const grams = Number(qty) || 100;
  const factor = grams / 100;
  return {
    kcal: per100.kcal * factor,
    protein: per100.protein * factor,
    carbs: per100.carbs * factor,
    fat: per100.fat * factor,
    fiber: per100.fiber * factor,
    vitA: per100.vitA * factor,
    vitC: per100.vitC * factor,
    iron: per100.iron * factor,
    calcium: per100.calcium * factor,
    source: found,
  };
}

function parseNutritionFromText(text) {
  const t = normalizeText(text);
  const out = {};
  const kcal = t.match(/(\d+(?:\.\d+)?)\s*(kcal|calories|cal)/);
  const protein = t.match(/(\d+(?:\.\d+)?)\s*(g)?\s*protein/);
  const carbs = t.match(/(\d+(?:\.\d+)?)\s*(g)?\s*carb/);
  const fat = t.match(/(\d+(?:\.\d+)?)\s*(g)?\s*fat/);
  const fiber = t.match(/(\d+(?:\.\d+)?)\s*(g)?\s*fiber/);
  const iron = t.match(/(\d+(?:\.\d+)?)\s*(mg)?\s*iron/);
  const calcium = t.match(/(\d+(?:\.\d+)?)\s*(mg)?\s*calcium/);
  const vitC = t.match(/(\d+(?:\.\d+)?)\s*(mg)?\s*(vit c|vitamin c)/);
  const vitA = t.match(/(\d+(?:\.\d+)?)\s*(mcg|iu)?\s*(vit a|vitamin a)/);

  if (kcal) out.kcal = Number(kcal[1]);
  if (protein) out.protein = Number(protein[1]);
  if (carbs) out.carbs = Number(carbs[1]);
  if (fat) out.fat = Number(fat[1]);
  if (fiber) out.fiber = Number(fiber[1]);
  if (iron) out.iron = Number(iron[1]);
  if (calcium) out.calcium = Number(calcium[1]);
  if (vitC) out.vitC = Number(vitC[1]);
  if (vitA) out.vitA = Number(vitA[1]);

  if (out.kcal == null && (out.protein != null || out.carbs != null || out.fat != null)) {
    out.kcal = inferCaloriesFromMacros(out);
  }

  return out;
}

async function estimateWithAI(prompt, expectedKeys) {
  if (!state.settings.apiKey) return null;

  const body = {
    model: state.settings.aiModel || "openai/gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a nutrition and fitness assistant. Respond only as compact JSON with exact keys provided and numeric values where expected.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
  };

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.settings.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`AI API error ${res.status}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const out = {};
    expectedKeys.forEach((k) => {
      if (parsed[k] != null) out[k] = Number(parsed[k]) || parsed[k];
    });
    return out;
  } catch {
    return null;
  }
}

function startVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setText("mealStatus", "Speech recognition not supported in this browser. Use Chrome on Android.");
    return;
  }

  const recog = new SpeechRecognition();
  recog.lang = "en-IN";
  recog.interimResults = false;
  recog.maxAlternatives = 1;

  setText("mealStatus", "Listening... speak your meal now.");

  recog.onresult = (e) => {
    const text = e.results[0][0].transcript;
    select("mealName").value = text;
    setText("mealStatus", `Captured: ${text}`);
  };

  recog.onerror = () => {
    setText("mealStatus", "Could not capture voice. Try again.");
  };

  recog.onend = () => {
    if (!select("mealName").value.trim()) {
      setText("mealStatus", "Voice capture ended. No text detected.");
    }
  };

  recog.start();
}

async function parseLabelFromPhoto(file) {
  if (!window.Tesseract) {
    throw new Error("OCR library not loaded.");
  }

  setText("mealStatus", "Reading nutrition label from image...");
  const result = await window.Tesseract.recognize(file, "eng");
  const txt = result?.data?.text || "";
  const parsed = parseNutritionFromText(txt);

  if (Object.keys(parsed).length) {
    if (parsed.kcal != null) select("mealCalories").value = Math.round(parsed.kcal);
    if (parsed.protein != null) select("mealProtein").value = parsed.protein;
    if (parsed.carbs != null) select("mealCarbs").value = parsed.carbs;
    if (parsed.fat != null) select("mealFat").value = parsed.fat;
    if (parsed.fiber != null) select("mealFiber").value = parsed.fiber;
    if (parsed.vitA != null) select("mealVitA").value = parsed.vitA;
    if (parsed.vitC != null) select("mealVitC").value = parsed.vitC;
    if (parsed.iron != null) select("mealIron").value = parsed.iron;
    if (parsed.calcium != null) select("mealCalcium").value = parsed.calcium;
    setText("mealStatus", "Label detected and fields auto-filled. Please verify values.");
  } else {
    setText("mealStatus", "Could not detect structured nutrition text. You can fill manually.");
  }
}

async function estimateMealFromInput() {
  const name = select("mealName").value.trim();
  if (!name) {
    setText("mealStatus", "Add meal name first.");
    return;
  }

  const qty = Number(select("mealQty").value || 100);
  const local = estimateFromFoodDb(name, qty);

  let ai = null;
  try {
    ai = await estimateWithAI(
      `Estimate nutrition for this meal in India context: "${name}" quantity ${qty}g. Return JSON keys kcal, protein, carbs, fat, fiber, vitA, vitC, iron, calcium only.`,
      ["kcal", "protein", "carbs", "fat", "fiber", "vitA", "vitC", "iron", "calcium"]
    );
  } catch {
    ai = null;
  }

  const est = ai || local;

  select("mealCalories").value = Math.round(est.kcal || 0);
  select("mealProtein").value = Number(est.protein || 0).toFixed(1);
  select("mealCarbs").value = Number(est.carbs || 0).toFixed(1);
  select("mealFat").value = Number(est.fat || 0).toFixed(1);
  select("mealFiber").value = Number(est.fiber || 0).toFixed(1);
  select("mealVitA").value = Math.round(est.vitA || 0);
  select("mealVitC").value = Number(est.vitC || 0).toFixed(1);
  select("mealIron").value = Number(est.iron || 0).toFixed(1);
  select("mealCalcium").value = Math.round(est.calcium || 0);

  setText("mealStatus", ai ? "AI estimate added. Please verify." : "Estimated from built-in food library.");
}

function pickNum(id) {
  const v = select(id).value;
  return v === "" ? null : Number(v);
}

function handleMealSubmit(e) {
  e.preventDefault();

  const slot = select("mealSlot").value;
  const name = select("mealName").value.trim();
  if (!name) return;

  const manualKcal = pickNum("mealCalories");
  const manualProtein = pickNum("mealProtein");
  const manualCarbs = pickNum("mealCarbs");
  const manualFat = pickNum("mealFat");
  const manualFiber = pickNum("mealFiber") || 0;
  const manualVitA = pickNum("mealVitA") || 0;
  const manualVitC = pickNum("mealVitC") || 0;
  const manualIron = pickNum("mealIron") || 0;
  const manualCalcium = pickNum("mealCalcium") || 0;

  const qty = Number(select("mealQty").value || 100);
  const estimated = estimateFromFoodDb(name, qty);

  const protein = manualProtein ?? estimated.protein;
  const carbs = manualCarbs ?? estimated.carbs;
  const fat = manualFat ?? estimated.fat;
  const kcal = manualKcal ?? (inferCaloriesFromMacros({ protein, carbs, fat }) || estimated.kcal);

  const meal = {
    id: makeId(),
    date: todayDate(),
    slot,
    name,
    qty,
    kcal: Number(kcal),
    protein: Number(protein),
    carbs: Number(carbs),
    fat: Number(fat),
    fiber: Number(manualFiber),
    vitA: Number(manualVitA),
    vitC: Number(manualVitC),
    iron: Number(manualIron),
    calcium: Number(manualCalcium),
    note: select("mealNotes").value.trim(),
  };

  getTodayMeals().push(meal);

  const key = normalizeText(name).split(" ").find((w) => w.length > 2);
  if (key) {
    state.foodLibrary[key] = {
      kcal: (meal.kcal / meal.qty) * 100,
      protein: (meal.protein / meal.qty) * 100,
      carbs: (meal.carbs / meal.qty) * 100,
      fat: (meal.fat / meal.qty) * 100,
      fiber: (meal.fiber / meal.qty) * 100,
      vitA: (meal.vitA / meal.qty) * 100,
      vitC: (meal.vitC / meal.qty) * 100,
      iron: (meal.iron / meal.qty) * 100,
      calcium: (meal.calcium / meal.qty) * 100,
    };
  }

  saveState();

  select("mealForm").reset();
  setText("mealStatus", "Meal saved successfully.");
  renderAll();
}

function renderWeeklyPlan() {
  const container = select("weeklyPlanContainer");
  container.innerHTML = daysOrder
    .map((d) => {
      const p = state.weeklyPlan[d] || defaultWeeklyPlan[d];
      return `
        <div class="day-plan">
          <h3>${d}</h3>
          <label>Breakfast <input data-plan="${d}:breakfast" value="${escapeHtml(p.breakfast)}" /></label>
          <label>Lunch <input data-plan="${d}:lunch" value="${escapeHtml(p.lunch)}" /></label>
          <label>Snacks <input data-plan="${d}:snacks" value="${escapeHtml(p.snacks)}" /></label>
          <label>Dinner <input data-plan="${d}:dinner" value="${escapeHtml(p.dinner)}" /></label>
          <label>Notes <textarea rows="2" data-plan="${d}:notes">${escapeHtml(p.notes || "")}</textarea></label>
        </div>
      `;
    })
    .join("");
}

function saveWeeklyPlanFromUi() {
  const inputs = Array.from(document.querySelectorAll("[data-plan]"));
  inputs.forEach((el) => {
    const key = el.getAttribute("data-plan");
    const [day, field] = key.split(":");
    if (!state.weeklyPlan[day]) state.weeklyPlan[day] = {};
    state.weeklyPlan[day][field] = el.value.trim();
  });
  saveState();
}

function ensureGymLogForDate(date = todayDate()) {
  if (!state.gymLogsByDate[date]) {
    state.gymLogsByDate[date] = {
      morningActivityType: "walk",
      morningMinutes: 0,
      morningKm: 0,
      morningDone: false,
      absDone: false,
      morningNotes: "",
      exerciseDone: {},
    };
  }
  return state.gymLogsByDate[date];
}

function getWorkoutForDay(dayName = currentDayName()) {
  return gymSplit[dayName] || gymSplit.Thursday;
}

function renderTodayWorkout() {
  const day = currentDayName();
  const workout = getWorkoutForDay(day);
  const log = ensureGymLogForDate();

  setText("todayWorkoutTitle", `${day}: ${workout.title}`);
  setText("todayWorkoutNote", workout.note);

  const list = select("todayExerciseList");
  list.innerHTML = workout.exercises
    .map((ex, idx) => {
      const key = `${day}-${idx}-${ex.name}`;
      const done = Boolean(log.exerciseDone[key]);
      return `
        <div class="exercise-item ${done ? "done" : ""}">
          <input type="checkbox" data-exercise-key="${escapeHtml(key)}" ${done ? "checked" : ""} />
          <div>
            <h3>${ex.name}</h3>
            <p class="exercise-meta">${ex.sets} • ${ex.cues}</p>
          </div>
        </div>
      `;
    })
    .join("");

  list.querySelectorAll("[data-exercise-key]").forEach((cb) => {
    cb.addEventListener("change", () => {
      const key = cb.getAttribute("data-exercise-key");
      log.exerciseDone[key] = cb.checked;
      saveState();
      renderTodayWorkout();
      renderQuickStats();
    });
  });

  const completed = Object.values(log.exerciseDone).filter(Boolean).length;
  const total = workout.exercises.length;
  setText("workoutCompletionText", `Completed ${completed}/${total} exercises today.`);
}

function renderMorningForm() {
  const log = ensureGymLogForDate();
  select("morningActivityType").value = log.morningActivityType || "walk";
  select("morningMinutes").value = log.morningMinutes || "";
  select("morningKm").value = log.morningKm || "";
  select("morningDone").checked = Boolean(log.morningDone);
  select("absDone").checked = Boolean(log.absDone);
  select("morningNotes").value = log.morningNotes || "";
}

function handleMorningForm(e) {
  e.preventDefault();
  const log = ensureGymLogForDate();
  log.morningActivityType = select("morningActivityType").value;
  log.morningMinutes = Number(select("morningMinutes").value || 0);
  log.morningKm = Number(select("morningKm").value || 0);
  log.morningDone = select("morningDone").checked;
  log.absDone = select("absDone").checked;
  log.morningNotes = select("morningNotes").value.trim();
  saveState();
}

function renderWeeklySplit() {
  const wrapper = select("weeklySplit");
  wrapper.innerHTML = daysOrder
    .map((day) => {
      const w = gymSplit[day];
      return `
        <div class="split-card">
          <h3>${day} • ${w.title}</h3>
          <p class="split-meta">${w.note}</p>
          <p class="split-meta">Main: ${w.exercises.map((e) => e.name).slice(0, 3).join(" • ")}</p>
        </div>
      `;
    })
    .join("");
}

function sortedWeightEntries() {
  return [...state.weightEntries].sort((a, b) => a.date.localeCompare(b.date));
}

function renderWeightSummary() {
  const entries = sortedWeightEntries();
  const box = select("weightSummary");
  if (!entries.length) {
    box.innerHTML = `<p class="muted">No weight entries yet.</p>`;
    return;
  }
  const first = entries[0];
  const last = entries[entries.length - 1];
  const loss = Number(first.weight) - Number(last.weight);
  const toGoal = Number(last.weight) - Number(state.profile.goalWeight);

  box.innerHTML = `
    <div class="summary-box"><div>Start</div><b>${formatNum(first.weight, 1)} kg</b></div>
    <div class="summary-box"><div>Current</div><b>${formatNum(last.weight, 1)} kg</b></div>
    <div class="summary-box"><div>Change</div><b>${loss >= 0 ? "-" : "+"}${formatNum(Math.abs(loss), 1)} kg</b></div>
    <div class="summary-box"><div>To Goal</div><b>${toGoal > 0 ? formatNum(toGoal, 1) + " kg left" : "Goal reached"}</b></div>
  `;
}

function drawWeightChart() {
  const canvas = select("weightChart");
  const ctx = canvas.getContext("2d");
  const entries = sortedWeightEntries();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fffdf7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#eadac4";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = 30 + (i * (canvas.height - 60)) / 4;
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(canvas.width - 20, y);
    ctx.stroke();
  }

  if (entries.length < 2) {
    ctx.fillStyle = "#7d6650";
    ctx.font = "16px Sora";
    ctx.fillText("Add at least 2 weight entries to view trend.", 50, canvas.height / 2);
    return;
  }

  const weights = entries.map((e) => Number(e.weight));
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;
  const xStep = (canvas.width - 70) / (entries.length - 1);

  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = 3;
  ctx.beginPath();

  entries.forEach((e, i) => {
    const x = 40 + i * xStep;
    const y = mapRange(Number(e.weight), minW, maxW, canvas.height - 30, 30);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  entries.forEach((e, i) => {
    const x = 40 + i * xStep;
    const y = mapRange(Number(e.weight), minW, maxW, canvas.height - 30, 30);
    ctx.fillStyle = "#0ea5a3";
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#5d5147";
  ctx.font = "12px Sora";
  ctx.fillText(`Latest: ${formatNum(entries[entries.length - 1].weight, 1)} kg`, canvas.width - 190, 20);
}

function mapRange(v, inMin, inMax, outMin, outMax) {
  if (inMax === inMin) return (outMin + outMax) / 2;
  return outMin + ((v - inMin) * (outMax - outMin)) / (inMax - inMin);
}

function handleWeightSubmit(e) {
  e.preventDefault();
  const date = select("weightDate").value;
  const weight = Number(select("weightValue").value);
  if (!date || !weight) return;

  const existing = state.weightEntries.find((w) => w.date === date);
  if (existing) {
    existing.weight = weight;
  } else {
    state.weightEntries.push({ id: makeId(), date, weight });
  }

  state.weightEntries = sortedWeightEntries();
  saveState();
  renderWeightSummary();
  drawWeightChart();
}

function cleanupOldPhotos() {
  const now = Date.now();
  const maxAge = 30 * 24 * 60 * 60 * 1000;
  state.photoEntries = state.photoEntries.filter((p) => now - new Date(p.date).getTime() <= maxAge);
}

function simplePhotoAnalysis(entry) {
  const weights = sortedWeightEntries();
  const latestWeight = weights.length ? Number(weights[weights.length - 1].weight) : null;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const oldWeight = [...weights].reverse().find((w) => new Date(w.date) <= sevenDaysAgo);

  const lines = [];
  if (latestWeight != null) {
    lines.push(`Current logged weight: ${formatNum(latestWeight, 1)} kg.`);
  }
  if (latestWeight != null && oldWeight) {
    const diff = Number(oldWeight.weight) - latestWeight;
    if (diff > 1.2) lines.push("Weight is dropping very fast. Add ~20g carbs around workout.");
    else if (diff < 0.4) lines.push("Fat loss is slow. Reduce ~20-25g carbs/day and tighten tracking.");
    else lines.push("Great pace. Keep protein high and continue progressive overload.");
  }

  if (entry.type === "scale") {
    lines.push("Scale photo uploaded. Ensure same timing each day for consistency.");
  } else {
    lines.push("Body photo uploaded. Track posture and lighting to compare shape weekly.");
  }

  lines.push("Shoulder care: include face pulls + band external rotation before upper sessions.");
  return lines;
}

async function analyzePhotoWithAI(entry) {
  if (!state.settings.apiKey) return null;
  try {
    const body = {
      model: state.settings.aiModel || "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a body transformation coach. Analyze the provided image and return compact JSON with keys summary, action1, action2, action3 only.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Context: currentWeight ${state.profile.currentWeight}, goalWeight ${state.profile.goalWeight}, calorieTarget ${state.profile.calorieTarget}, photoType ${entry.type}, note ${entry.note || "none"}. Give practical gym/diet feedback.`,
            },
            {
              type: "image_url",
              image_url: {
                url: entry.image,
              },
            },
          ],
        },
      ],
      temperature: 0.2,
    };

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.settings.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";
    const jsonMatch = String(content).match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      summary: parsed.summary || "",
      action1: parsed.action1 || "",
      action2: parsed.action2 || "",
      action3: parsed.action3 || "",
    };
  } catch {
    return null;
  }
}

async function handlePhotoSubmit(e) {
  e.preventDefault();
  const fileInput = select("photoInput");
  const file = fileInput.files?.[0];
  if (!file) return;

  const date = new Date().toISOString();
  const dataUrl = await fileToDataUrl(file);
  const entry = {
    id: makeId(),
    date,
    type: select("photoType").value,
    note: select("photoNote").value.trim(),
    image: dataUrl,
    feedback: null,
  };

  const localFeedback = simplePhotoAnalysis(entry);
  entry.feedback = { local: localFeedback };

  setText("photoStatus", "Photo uploaded. Running analysis...");

  const aiFeedback = await analyzePhotoWithAI(entry);
  if (aiFeedback) entry.feedback.ai = aiFeedback;

  state.photoEntries.unshift(entry);
  cleanupOldPhotos();
  saveState();

  select("photoForm").reset();
  setText("photoStatus", "Photo saved and analyzed.");
  renderPhotoSection();
}

function renderPhotoSection() {
  const gallery = select("photoGallery");
  const feedbackBox = select("coachFeedback");

  if (!state.photoEntries.length) {
    feedbackBox.innerHTML = `<p class="muted">Upload your first photo for feedback.</p>`;
    gallery.innerHTML = "";
    return;
  }

  const latest = state.photoEntries[0];
  const localFeedback = latest.feedback?.local || [];
  const ai = latest.feedback?.ai;

  feedbackBox.innerHTML = `
    <div class="feedback-card">
      <h3>Coach Feedback</h3>
      ${localFeedback.map((l) => `<p>${escapeHtml(l)}</p>`).join("")}
      ${
        ai
          ? `<p><b>${escapeHtml(String(ai.summary || "AI insights"))}</b></p>
             <p>${escapeHtml(String(ai.action1 || ""))}</p>
             <p>${escapeHtml(String(ai.action2 || ""))}</p>
             <p>${escapeHtml(String(ai.action3 || ""))}</p>`
          : ""
      }
    </div>
  `;

  gallery.innerHTML = state.photoEntries
    .map(
      (p) => `
      <div class="photo-card">
        <h3>${p.type === "body" ? "Body" : "Scale"} • ${new Date(p.date).toLocaleDateString()}</h3>
        <p class="meal-meta">${escapeHtml(p.note || "No note")}</p>
        <img src="${p.image}" alt="${p.type} progress photo" />
      </div>
    `
    )
    .join("");
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function bindEvents() {
  select("profileForm").addEventListener("submit", (e) => {
    e.preventDefault();
    state.profile.currentWeight = Number(select("currentWeight").value);
    state.profile.goalWeight = Number(select("goalWeight").value);
    state.profile.age = Number(select("age").value);
    state.profile.heightCm = Number(select("heightCm").value);
    state.profile.weeklyLoss = Number(select("weeklyLoss").value);
    state.profile.calorieTarget = Number(select("calorieTarget").value);
    calculateTargetsFromProfile();
    saveState();
    renderAll();
  });

  select("autoTargetBtn").addEventListener("click", () => {
    state.profile.calorieTarget = null;
    calculateTargetsFromProfile();
    saveState();
    renderAll();
  });

  select("voiceBtn").addEventListener("click", startVoiceRecognition);
  select("estimateMealBtn").addEventListener("click", estimateMealFromInput);
  select("mealForm").addEventListener("submit", handleMealSubmit);

  select("labelPhotoInput").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await parseLabelFromPhoto(file);
    } catch {
      setText("mealStatus", "Could not scan label. Try clear photo or fill manually.");
    }
  });

  select("savePlanBtn").addEventListener("click", () => {
    saveWeeklyPlanFromUi();
    setText("mealStatus", "Weekly plan saved.");
  });

  select("resetPlanBtn").addEventListener("click", () => {
    state.weeklyPlan = structuredClone(defaultWeeklyPlan);
    saveState();
    renderWeeklyPlan();
  });

  select("morningForm").addEventListener("submit", handleMorningForm);
  select("weightForm").addEventListener("submit", handleWeightSubmit);
  select("photoForm").addEventListener("submit", handlePhotoSubmit);

  select("settingsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    state.settings.apiKey = select("apiKey").value.trim();
    state.settings.aiModel = select("aiModel").value.trim() || "openai/gpt-4o-mini";
    saveState();
    alert("Assistant settings saved.");
  });

  select("exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transform-hq-backup-${todayDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  select("importInput").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const imported = JSON.parse(text);
      state = {
        ...structuredClone(defaultState),
        ...imported,
        profile: { ...structuredClone(defaultState.profile), ...(imported.profile || {}) },
        settings: { ...structuredClone(defaultState.settings), ...(imported.settings || {}) },
      };
      if (!state.weeklyPlan) state.weeklyPlan = structuredClone(defaultWeeklyPlan);
      saveState();
      renderAll();
      alert("Data imported.");
    } catch {
      alert("Invalid backup file.");
    }
  });

  select("clearDayBtn").addEventListener("click", () => {
    state.mealsByDate[todayDate()] = [];
    saveState();
    renderAll();
  });
}

function renderAll() {
  updateDateTime();
  renderQuickStats();
  renderProfileForm();
  renderTargetSummary();
  renderDayNutrition();
  renderMealSections();
  renderWeeklyPlan();
  renderTodayWorkout();
  renderMorningForm();
  renderWeeklySplit();

  select("weightDate").value = todayDate();
  const sorted = sortedWeightEntries();
  if (sorted.length) select("weightValue").value = sorted[sorted.length - 1].weight;

  renderWeightSummary();
  drawWeightChart();

  select("apiKey").value = state.settings.apiKey;
  select("aiModel").value = state.settings.aiModel;

  cleanupOldPhotos();
  renderPhotoSection();
}

function init() {
  if (!state.weeklyPlan) state.weeklyPlan = structuredClone(defaultWeeklyPlan);
  calculateTargetsFromProfile();
  saveState();

  renderTabs();
  bindEvents();
  renderAll();
  updateDateTime();
  setInterval(updateDateTime, 1000 * 30);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }
}

init();
