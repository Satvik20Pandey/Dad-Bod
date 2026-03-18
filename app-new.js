const LEGACY_STATE_KEY = "transform_hq_v2";
const AUTH_KEY = "dadbod_auth_v1";
const ADMIN_EMAIL = "satvikofficial20@gmail.com";
const ADMIN_PASSWORD = "Satvik123";
const ADMIN_API_KEY = "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";
const TENOR_PUBLIC_KEY = "LIVDSRZULELA";

const APP_NAME = "Dad Bod";
const APP_TAGLINE = "Built Dream Physique";

const daysOrder = ["Thursday", "Friday", "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"];

const adminDailyDiet = {
  breakfast: "Oats 40g + Milk 500ml + Dry Fruits Mix 10g",
  lunch: "3 egg omelette + mixed vegetables + 1 roti",
  snacks: "Protein shake + banana",
  dinner: "Besan chilla + vegetables + tofu 100g",
  notes: "Simple repeatable plan with foods you can arrange daily.",
};

function buildAdminWeeklyPlan() {
  const plan = {};
  daysOrder.forEach((day) => {
    plan[day] = {
      ...adminDailyDiet,
      notes:
        day === "Wednesday"
          ? "Recovery day. Keep same simple diet and do light mobility."
          : "Same simple meal structure for consistency.",
    };
  });
  return plan;
}

function buildBlankWeeklyPlan() {
  const plan = {};
  daysOrder.forEach((day) => {
    plan[day] = {
      breakfast: "",
      lunch: "",
      snacks: "",
      dinner: "",
      notes: "",
    };
  });
  return plan;
}

const absCircuit = [
  {
    name: "Crunches",
    sets: "3 x 15",
    cues: "Lie on back, knees bent. Lift shoulders up and down with control.",
  },
  {
    name: "Bicycle Crunches",
    sets: "3 x 20",
    cues: "Bring opposite elbow and knee together with slow control.",
  },
  {
    name: "Forearm Plank",
    sets: "3 x 40 sec",
    cues: "Keep body in straight line. Tight core and glutes.",
  },
  {
    name: "Mountain Climbers",
    sets: "3 x 30 sec",
    cues: "Hands under shoulders. Alternate knees toward chest.",
  },
  {
    name: "Dead Bug",
    sets: "3 x 12 each side",
    cues: "Lower opposite arm and leg while lower back stays on floor.",
  },
  {
    name: "Lying Leg Raises",
    sets: "3 x 12",
    cues: "Raise straight legs, lower slowly without arching lower back.",
  },
  {
    name: "Superman Hold",
    sets: "3 x 30 sec",
    cues: "Lift chest and legs, hold with glutes and back engaged.",
  },
  {
    name: "Hollow Body Hold",
    sets: "3 x 25 sec",
    cues: "Lower back pressed to floor, arms and legs extended.",
  },
];

const roomGymSplit = {
  Thursday: {
    title: "Push Foundation (No Equipment)",
    note: "Room-only push strength. Use wall/table if needed.",
    exercises: [
      { name: "Incline Push-Up", sets: "4 x 10-15", cues: "Hands on table or bed edge, body straight." },
      { name: "Knee Push-Up", sets: "3 x 10-12", cues: "Slow descent, chest close to floor." },
      { name: "Pike Push-Up", sets: "3 x 8-10", cues: "Hips high, head moves between hands." },
      { name: "Diamond Push-Up", sets: "3 x 6-10", cues: "Hands close, elbows track back." },
      { name: "Plank Shoulder Tap", sets: "3 x 20 taps", cues: "Hips stable, no rocking." },
      { name: "Forearm Plank", sets: "3 x 40 sec", cues: "Neutral spine, tight core." },
    ],
  },
  Friday: {
    title: "Pull + Posture (No Equipment)",
    note: "Back activation without machines or bands.",
    exercises: [
      { name: "Superman Pull-Down", sets: "3 x 12", cues: "Lift chest and pull elbows down like lat pull." },
      { name: "Reverse Snow Angel", sets: "3 x 12", cues: "Lie face down, sweep arms wide with control." },
      { name: "Prone Cobra Hold", sets: "3 x 30 sec", cues: "Squeeze shoulder blades, chin tucked." },
      { name: "Bird Dog", sets: "3 x 10 each side", cues: "Reach opposite hand and leg, keep hips square." },
      { name: "Back Widow", sets: "3 x 12", cues: "Press elbows to floor and lift chest." },
      { name: "Self-Resistance Biceps Curl", sets: "3 x 12 each", cues: "Use opposite hand for resistance." },
    ],
  },
  Saturday: {
    title: "Legs + Glutes",
    note: "No-equipment leg day done inside your room.",
    exercises: [
      { name: "Bodyweight Squat", sets: "4 x 15", cues: "Sit back, knees track over toes." },
      { name: "Reverse Lunge", sets: "3 x 10 each", cues: "Step back softly, chest tall." },
      { name: "Glute Bridge", sets: "4 x 15", cues: "Drive hips up, squeeze glutes at top." },
      { name: "Wall Sit", sets: "3 x 40 sec", cues: "Back flat against wall, knees near 90 degrees." },
      { name: "Single-Leg Calf Raise", sets: "3 x 15 each", cues: "Use wall for balance if needed." },
      { name: "Side Plank", sets: "3 x 25 sec each", cues: "Straight body line from shoulder to heel." },
    ],
  },
  Sunday: {
    title: "Conditioning + Core",
    note: "Fat-loss focused, low-space routine.",
    exercises: [
      { name: "Jumping Jacks", sets: "3 x 45 sec", cues: "Light feet, steady breathing." },
      { name: "High Knees March", sets: "3 x 40 sec", cues: "Drive knees up, keep posture upright." },
      { name: "Squat to Calf Raise", sets: "3 x 15", cues: "Stand tall and rise on toes each rep." },
      { name: "Mountain Climbers", sets: "3 x 30 sec", cues: "Fast but controlled knee drive." },
      { name: "Walkout to Plank", sets: "3 x 10", cues: "Hinge at hips and walk hands out slowly." },
      { name: "Dead Bug", sets: "3 x 12 each", cues: "Keep lower back flat." },
    ],
  },
  Monday: {
    title: "Upper Body + Abs",
    note: "Bodyweight hypertrophy without gym tools.",
    exercises: [
      { name: "Standard Push-Up", sets: "4 x 8-12", cues: "Full range and stable core." },
      { name: "Wide Push-Up", sets: "3 x 8-12", cues: "Hands slightly wider than shoulders." },
      { name: "Triceps Floor Extension", sets: "3 x 10-12", cues: "Hands near shoulders, press up slowly." },
      { name: "Hollow Body Hold", sets: "3 x 25 sec", cues: "Lower back pressed down." },
      { name: "Lying Leg Raises", sets: "3 x 12", cues: "No momentum. Slow lowering." },
      { name: "Bicycle Crunches", sets: "3 x 20", cues: "Controlled twisting, no neck pull." },
    ],
  },
  Tuesday: {
    title: "Posterior Chain + Core",
    note: "Protect knees and build hips, glutes, and back.",
    exercises: [
      { name: "Hip Hinge Good Morning", sets: "4 x 15", cues: "Hands behind head, hinge from hips." },
      { name: "Single-Leg Glute Bridge", sets: "3 x 10 each", cues: "Keep pelvis level throughout." },
      { name: "Hamstring Walkout", sets: "3 x 8", cues: "Start in bridge and step heels out slowly." },
      { name: "Side Lunge", sets: "3 x 10 each", cues: "Sit into hip, opposite leg straight." },
      { name: "Superman Hold", sets: "3 x 30 sec", cues: "Lift chest and legs slightly off floor." },
      { name: "Bird Dog Knee Tap", sets: "3 x 12 each", cues: "Bring elbow and knee together under body." },
    ],
  },
  Wednesday: {
    title: "Recovery Mobility",
    note: "Easy session to recover and stay active at home.",
    exercises: [
      { name: "March In Place", sets: "8 min", cues: "Steady pace and nasal breathing." },
      { name: "Cat Cow", sets: "2 x 10", cues: "Slow spinal flexion and extension." },
      { name: "Open Book Thoracic Rotation", sets: "2 x 8 each", cues: "Follow hand with eyes." },
      { name: "Hip Flexor Stretch", sets: "2 x 30 sec each", cues: "Tuck pelvis and feel front hip stretch." },
      { name: "Childs Pose Breathing", sets: "2 x 60 sec", cues: "Long inhale and exhale, relax shoulders." },
      { name: "Ankle Mobility Rocks", sets: "2 x 12 each", cues: "Knee over toes with heel down." },
    ],
  },
};

const builtInFoodDb = {
  tofu: { kcal: 144, protein: 17.3, carbs: 2.8, fat: 8.7, fiber: 1.2, calcium: 350, iron: 3.4, vitaminC: 0 },
  bread: { kcal: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, calcium: 107, iron: 3.6, vitaminC: 0 },
  egg: { kcal: 143, protein: 13, carbs: 0.7, fat: 9.5, fiber: 0, calcium: 56, iron: 1.8, vitaminC: 0 },
  dal: { kcal: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 8, calcium: 19, iron: 3.3, vitaminC: 1.5 },
  rice: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, calcium: 10, iron: 1.2, vitaminC: 0 },
  banana: { kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, calcium: 5, iron: 0.3, vitaminC: 8.7 },
  milk: { kcal: 61, protein: 3.2, carbs: 5, fat: 3.3, fiber: 0, calcium: 113, iron: 0.03, vitaminC: 0 },
  oats: { kcal: 389, protein: 17, carbs: 66, fat: 7, fiber: 10.6, calcium: 54, iron: 4.7, vitaminC: 0 },
  dryfruits: { kcal: 520, protein: 10, carbs: 45, fat: 34, fiber: 7, calcium: 85, iron: 2.6, vitaminC: 1.2 },
  roti: { kcal: 297, protein: 11, carbs: 58, fat: 3.6, fiber: 9.6, calcium: 29, iron: 3.9, vitaminC: 0 },
  besan: { kcal: 387, protein: 22, carbs: 58, fat: 7, fiber: 10.8, calcium: 45, iron: 4.9, vitaminC: 0 },
};

const adminDefaultState = {
  profile: {
    currentWeight: 82,
    goalWeight: 71,
    age: 22,
    heightCm: 180.3,
    adminPlanVersion: 2,
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
    apiKey: ADMIN_API_KEY,
    aiModel: "openai/gpt-4o-vision",
  },
  mealsByDate: {},
  foodLibrary: {},
  weeklyPlan: buildAdminWeeklyPlan(),
  gymLogsByDate: {},
  weightEntries: [],
  photoEntries: [],
};

const genericDefaultState = {
  profile: {
    currentWeight: 75,
    goalWeight: 68,
    age: 24,
    heightCm: 170,
    weeklyLoss: 0.5,
    calorieTarget: 1900,
    maintenanceCalories: 2250,
    deficitCalories: 1900,
    macros: {
      proteinG: 136,
      fatG: 54,
      carbsG: 197,
    },
  },
  settings: {
    apiKey: "",
    aiModel: "openai/gpt-4o-mini",
  },
  mealsByDate: {},
  foodLibrary: {},
  weeklyPlan: buildBlankWeeklyPlan(),
  gymLogsByDate: {},
  weightEntries: [],
  photoEntries: [],
};

let authStore = loadAuthStore();
let currentUser = null;
let state = null;
let appEventsBound = false;
let authEventsBound = false;
const gifCache = {};

function clone(data) {
  if (typeof structuredClone === "function") return structuredClone(data);
  return JSON.parse(JSON.stringify(data));
}

function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function select(id) {
  return document.getElementById(id);
}

function setText(id, txt) {
  const el = select(id);
  if (el) el.textContent = txt;
}

function formatNum(v, digits = 1) {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function currentDayName() {
  return new Date().toLocaleDateString(undefined, { weekday: "long" });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseOptionalNumber(inputId) {
  const v = select(inputId)?.value;
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function loadAuthStore() {
  const raw = localStorage.getItem(AUTH_KEY);
  let parsed = { users: [], userStates: {}, activeUserId: null };
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { users: [], userStates: {}, activeUserId: null };
    }
  }

  if (!Array.isArray(parsed.users)) parsed.users = [];
  if (!parsed.userStates || typeof parsed.userStates !== "object") parsed.userStates = {};

  return ensureAdminUser(parsed);
}

function saveAuthStore() {
  localStorage.setItem(AUTH_KEY, JSON.stringify(authStore));
}

function ensureAdminUser(store) {
  let admin = store.users.find((u) => (u.email || "").toLowerCase() === ADMIN_EMAIL);

  if (!admin) {
    admin = {
      id: uid("user"),
      name: "Satvik",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      provider: "email",
      isAdmin: true,
      createdAt: new Date().toISOString(),
    };
    store.users.push(admin);
  }

  admin.email = ADMIN_EMAIL;
  admin.password = ADMIN_PASSWORD;
  admin.isAdmin = true;
  admin.provider = "email";
  admin.name = admin.name || "Satvik";

  if (!store.userStates[admin.id]) {
    let adminState = clone(adminDefaultState);
    const legacyRaw = localStorage.getItem(LEGACY_STATE_KEY);
    if (legacyRaw) {
      try {
        adminState = mergeState(adminState, JSON.parse(legacyRaw));
      } catch {}
    }
    store.userStates[admin.id] = adminState;
  }

  if (store.activeUserId && !store.users.some((u) => u.id === store.activeUserId)) {
    store.activeUserId = null;
  }

  return store;
}

function mergeState(baseState, savedState) {
  const merged = {
    ...clone(baseState),
    ...(savedState || {}),
    profile: {
      ...clone(baseState.profile),
      ...(savedState?.profile || {}),
      macros: {
        ...clone(baseState.profile.macros),
        ...(savedState?.profile?.macros || {}),
      },
    },
    settings: {
      ...clone(baseState.settings),
      ...(savedState?.settings || {}),
    },
    mealsByDate: {
      ...(savedState?.mealsByDate || {}),
    },
    foodLibrary: {
      ...(savedState?.foodLibrary || {}),
    },
    gymLogsByDate: {
      ...(savedState?.gymLogsByDate || {}),
    },
    weightEntries: Array.isArray(savedState?.weightEntries) ? savedState.weightEntries : [],
    photoEntries: Array.isArray(savedState?.photoEntries) ? savedState.photoEntries : [],
    weeklyPlan: savedState?.weeklyPlan ? savedState.weeklyPlan : clone(baseState.weeklyPlan),
  };

  return merged;
}

function findUserByEmail(email) {
  const lookup = (email || "").trim().toLowerCase();
  return authStore.users.find((u) => (u.email || "").toLowerCase() === lookup) || null;
}

function createUser({ name, email, password, provider }) {
  const user = {
    id: uid("user"),
    name: name?.trim() || "Member",
    email: email.trim().toLowerCase(),
    password: password || "",
    provider: provider || "email",
    isAdmin: email.trim().toLowerCase() === ADMIN_EMAIL,
    createdAt: new Date().toISOString(),
  };

  authStore.users.push(user);

  const baseState = user.isAdmin ? clone(adminDefaultState) : clone(genericDefaultState);
  authStore.userStates[user.id] = baseState;
  saveAuthStore();

  return user;
}

function getDefaultWeeklyPlan() {
  return currentUser?.isAdmin ? clone(buildAdminWeeklyPlan()) : clone(buildBlankWeeklyPlan());
}

function loadStateForUser(user) {
  const base = user.isAdmin ? clone(adminDefaultState) : clone(genericDefaultState);
  const saved = authStore.userStates[user.id];
  const merged = mergeState(base, saved || {});

  if (!merged.weeklyPlan) merged.weeklyPlan = getDefaultWeeklyPlan();

  return merged;
}

function saveState() {
  if (!currentUser || !state) return;
  authStore.userStates[currentUser.id] = state;
  saveAuthStore();

  if (currentUser.isAdmin) {
    localStorage.setItem(LEGACY_STATE_KEY, JSON.stringify(state));
  }
}

function switchAuthTab(tabName) {
  document.querySelectorAll(".auth-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-auth-tab") === tabName);
  });
  select("signInForm")?.classList.toggle("active", tabName === "signin");
  select("signUpForm")?.classList.toggle("active", tabName === "signup");
}

function showAuthShell(tabName = "signin") {
  select("authShell")?.classList.remove("hidden");
  select("appShell")?.classList.add("hidden");
  switchAuthTab(tabName);
}

function showAppShell() {
  select("authShell")?.classList.add("hidden");
  select("appShell")?.classList.remove("hidden");
}

function updateBranding() {
  setText("brandTitle", APP_NAME);
  setText("brandTagline", APP_TAGLINE);
  setText("dateTimeText", new Date().toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "short" }));
  const badgeText = currentUser
    ? `${currentUser.name}${currentUser.isAdmin ? " (Admin)" : ""}`
    : "Guest";
  setText("userBadge", badgeText);
}

function activateUser(user) {
  currentUser = user;
  authStore.activeUserId = user.id;
  saveAuthStore();

  state = loadStateForUser(user);

  if (user.isAdmin) {
    const version = Number(state.profile.adminPlanVersion || 0);
    if (version < 2) {
      state.weeklyPlan = buildAdminWeeklyPlan();
      state.profile.adminPlanVersion = 2;
    }
    if (!state.settings.apiKey) {
      state.settings.apiKey = ADMIN_API_KEY;
    }
  }

  calculateTargetsFromProfile();
  saveState();

  showAppShell();
  updateBranding();
  showTab("home");
  renderAll();
}

function logoutCurrentUser() {
  closeExerciseModal();
  currentUser = null;
  state = null;
  authStore.activeUserId = null;
  saveAuthStore();
  showAuthShell("signin");
}

function handleSignInSubmit(e) {
  e.preventDefault();

  const email = select("signInEmail")?.value.trim().toLowerCase();
  const password = select("signInPassword")?.value;
  const user = findUserByEmail(email);

  if (!user) {
    alert("Account not found. Please sign up first.");
    return;
  }

  if ((user.password || "") !== (password || "")) {
    alert("Incorrect password.");
    return;
  }

  activateUser(user);
}

function handleSignUpSubmit(e) {
  e.preventDefault();

  const name = select("signUpName")?.value.trim();
  const email = select("signUpEmail")?.value.trim().toLowerCase();
  const password = select("signUpPassword")?.value || "";

  if (!name || !email) {
    alert("Please enter name and email.");
    return;
  }

  if (email === ADMIN_EMAIL) {
    alert("This admin account already exists. Please sign in.");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  if (findUserByEmail(email)) {
    alert("This email is already registered. Please sign in.");
    return;
  }

  const user = createUser({ name, email, password, provider: "email" });
  activateUser(user);
}

function handleGoogleQuickSignIn() {
  const enteredEmail = prompt("Enter your Google Gmail address to continue:");
  if (!enteredEmail) return;

  const email = enteredEmail.trim().toLowerCase();
  if (!email.endsWith("@gmail.com")) {
    alert("Please enter a valid Gmail address.");
    return;
  }

  let user = findUserByEmail(email);
  if (!user) {
    const fallbackName = email.split("@")[0];
    user = createUser({ name: fallbackName, email, password: "", provider: "google" });
  }

  activateUser(user);
}

function calculateTargetsFromProfile() {
  if (!state) return;

  const currentWeight = Number(state.profile.currentWeight || 70);
  const goalWeight = Number(state.profile.goalWeight || currentWeight);
  const weeklyLoss = Number(state.profile.weeklyLoss || 0.5);

  const maintenance = Math.max(1400, Math.round(currentWeight * 30));
  const dailyDeficit = Math.max(200, Math.min(1200, Math.round((weeklyLoss * 7700) / 7)));
  const deficitCalories = Math.max(1200, maintenance - dailyDeficit);

  state.profile.maintenanceCalories = maintenance;
  state.profile.deficitCalories = deficitCalories;

  const existingTarget = Number(state.profile.calorieTarget || 0);
  state.profile.calorieTarget = existingTarget > 0 ? existingTarget : deficitCalories;

  const proteinG = Math.max(90, Math.round(goalWeight * 2.1));
  const fatG = Math.max(35, Math.round(goalWeight * 0.8));
  const carbsG = Math.max(80, Math.round((state.profile.calorieTarget - proteinG * 4 - fatG * 9) / 4));

  state.profile.macros = { proteinG, fatG, carbsG };
}

function updateDateTime() {
  setText(
    "dateTimeText",
    new Date().toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "short" })
  );
}

function getDayMeals(date = todayDate()) {
  if (!state.mealsByDate[date]) state.mealsByDate[date] = [];
  return state.mealsByDate[date];
}

function dailyTotals(date = todayDate()) {
  const list = getDayMeals(date);
  return list.reduce(
    (acc, m) => ({
      kcal: acc.kcal + Number(m.kcal || 0),
      protein: acc.protein + Number(m.protein || 0),
      carbs: acc.carbs + Number(m.carbs || 0),
      fat: acc.fat + Number(m.fat || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function ensureGymLogForDate(date = todayDate()) {
  if (!state.gymLogsByDate[date]) {
    state.gymLogsByDate[date] = {
      morningActivityType: "walk",
      morningMinutes: 0,
      morningDone: false,
      absDone: false,
      morningNotes: "",
      exerciseDone: {},
    };
  }
  return state.gymLogsByDate[date];
}

function findTodayWorkout() {
  const day = currentDayName();
  return roomGymSplit[day] || roomGymSplit.Thursday;
}

function renderHeaderStats() {
  const totals = dailyTotals();
  const target = state.profile;
  const latestWeight = state.weightEntries.length
    ? state.weightEntries[state.weightEntries.length - 1].weight
    : target.currentWeight;

  const html = `
    <div class="stat-item">
      <div class="stat-item-label">Eaten</div>
      <b>${formatNum(totals.kcal, 0)} / ${formatNum(target.calorieTarget, 0)} kcal</b>
    </div>
    <div class="stat-item">
      <div class="stat-item-label">Weight</div>
      <b>${formatNum(latestWeight, 1)} kg</b>
    </div>
    <div class="stat-item">
      <div class="stat-item-label">Protein</div>
      <b>${formatNum(totals.protein, 0)} / ${formatNum(target.macros.proteinG, 0)} g</b>
    </div>
    <div class="stat-item">
      <div class="stat-item-label">Goal</div>
      <b>${formatNum(target.goalWeight, 1)} kg</b>
    </div>
  `;

  const container = select("headerStats");
  if (container) container.innerHTML = html;
}

function renderDashboard() {
  const totals = dailyTotals();
  const target = state.profile;
  const latestWeight = state.weightEntries.length
    ? state.weightEntries[state.weightEntries.length - 1].weight
    : target.currentWeight;

  const todayWorkout = findTodayWorkout();
  const log = ensureGymLogForDate();
  const today = currentDayName();

  const macroHtml = `
    <div class="macro-box">
      <div class="macro-box-label">Calories</div>
      <div class="macro-box-value">${formatNum(totals.kcal, 0)}</div>
      <div class="muted">/ ${formatNum(target.calorieTarget, 0)}</div>
    </div>
    <div class="macro-box">
      <div class="macro-box-label">Protein</div>
      <div class="macro-box-value">${formatNum(totals.protein, 0)}g</div>
      <div class="muted">/ ${formatNum(target.macros.proteinG, 0)}g</div>
    </div>
    <div class="macro-box">
      <div class="macro-box-label">Carbs</div>
      <div class="macro-box-value">${formatNum(totals.carbs, 0)}g</div>
      <div class="muted">/ ${formatNum(target.macros.carbsG, 0)}g</div>
    </div>
    <div class="macro-box">
      <div class="macro-box-label">Fat</div>
      <div class="macro-box-value">${formatNum(totals.fat, 0)}g</div>
      <div class="muted">/ ${formatNum(target.macros.fatG, 0)}g</div>
    </div>
  `;

  const macro = select("todayMacroSummary");
  if (macro) macro.innerHTML = macroHtml;

  const weightHtml = `
    <div class="weights-display">
      <div class="weight-item">
        <div class="weight-label">Current</div>
        <div class="weight-value">${formatNum(latestWeight, 1)} kg</div>
      </div>
      <div class="weight-item">
        <div class="weight-label">Goal</div>
        <div class="weight-value">${formatNum(target.goalWeight, 1)} kg</div>
      </div>
    </div>
  `;

  const wd = select("weightDisplay");
  if (wd) wd.innerHTML = weightHtml;

  const completed = todayWorkout.exercises.filter((_, idx) => Boolean(log.exerciseDone?.[`${today}-${idx}`])).length;
  setText("todayWorkoutTitle", todayWorkout.title);
  setText("todayExerciseCount", `${completed}/${todayWorkout.exercises.length} exercises`);
}

function renderTodayWorkout() {
  const day = currentDayName();
  const workout = roomGymSplit[day] || roomGymSplit.Thursday;
  const log = ensureGymLogForDate();

  setText("todayWorkoutDayName", day);
  setText("todayWorkoutNote", workout.note);

  const list = select("todayExerciseList");
  if (!list) return;

  list.innerHTML = workout.exercises
    .map((ex, idx) => {
      const key = `${day}-${idx}`;
      const done = Boolean(log.exerciseDone[key]);
      return `
        <div class="exercise-item ${done ? "done" : ""}" onclick="toggleExercise('${day}', ${idx})">
          <input type="checkbox" ${done ? "checked" : ""} onclick="event.stopPropagation()" onchange="toggleExercise('${day}', ${idx})" />
          <div>
            <h3>${escapeHtml(ex.name)}</h3>
            <p class="exercise-meta">${escapeHtml(ex.sets)} | ${escapeHtml(ex.cues)}</p>
            <button type="button" class="btn-small guide-btn" onclick="event.stopPropagation(); openExerciseGuide('${encodeURIComponent(ex.name)}')">View GIF Guide</button>
          </div>
        </div>
      `;
    })
    .join("");

  const completed = workout.exercises.filter((_, idx) => Boolean(log.exerciseDone?.[`${day}-${idx}`])).length;
  setText("workoutCompletionText", `${completed}/${workout.exercises.length} completed`);
}

function toggleExercise(day, idx) {
  const log = ensureGymLogForDate();
  const key = `${day}-${idx}`;
  log.exerciseDone[key] = !log.exerciseDone[key];
  saveState();
  renderTodayWorkout();
  renderHeaderStats();
  renderDashboard();
}

function renderAbsCircuit() {
  const log = ensureGymLogForDate();
  const list = select("absExerciseList");
  if (!list) return;

  list.innerHTML = absCircuit
    .map((ex, idx) => {
      const key = `abs-${idx}`;
      const done = Boolean(log.exerciseDone[key]);
      return `
        <div class="exercise-item ${done ? "done" : ""}" onclick="toggleAbsExercise(${idx})">
          <input type="checkbox" ${done ? "checked" : ""} onclick="event.stopPropagation()" onchange="toggleAbsExercise(${idx})" />
          <div>
            <h3>${escapeHtml(ex.name)}</h3>
            <p class="exercise-meta">${escapeHtml(ex.sets)} | ${escapeHtml(ex.cues)}</p>
            <button type="button" class="btn-small guide-btn" onclick="event.stopPropagation(); openAbsGuide('${encodeURIComponent(ex.name)}')">View GIF Guide</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function toggleAbsExercise(idx) {
  const log = ensureGymLogForDate();
  const key = `abs-${idx}`;
  log.exerciseDone[key] = !log.exerciseDone[key];
  saveState();
  renderAbsCircuit();
}

function showTab(tabName) {
  const map = {
    home: "tabHome",
    diet: "tabDiet",
    "weekly-plan": "tabWeeklyPlan",
    gym: "tabGym",
    progress: "tabProgress",
    settings: "tabSettings",
  };

  const contentId = map[tabName];
  const navBtnSelector = `[data-tab="${tabName}"]`;

  document.querySelectorAll(".tab-content").forEach((el) => el.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach((el) => el.classList.remove("active"));

  const content = select(contentId);
  const btn = document.querySelector(navBtnSelector);

  if (content) content.classList.add("active");
  if (btn) btn.classList.add("active");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollToTab(tabName) {
  showTab(tabName);
}

function renderDietForm() {
  if (select("mealSlot") && !select("mealSlot").value) {
    select("mealSlot").value = "breakfast";
  }
}

function clearMealInputFields() {
  select("mealForm")?.reset();
  if (select("mealSlot")) select("mealSlot").value = "breakfast";
}

function renderMealsList() {
  const meals = getDayMeals();
  const slots = ["breakfast", "lunch", "snacks", "dinner"];
  const slotLabels = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    snacks: "Snacks",
    dinner: "Dinner",
  };

  const wrapper = select("mealSections");
  if (!wrapper) return;

  wrapper.innerHTML = slots
    .map((slot) => {
      const items = meals.filter((m) => m.slot === slot);
      const content =
        items.length > 0
          ? items
              .map((m) => {
                const micros = [];
                if (m.fiber != null) micros.push(`Fiber ${formatNum(m.fiber, 1)}g`);
                if (m.calcium != null) micros.push(`Calcium ${formatNum(m.calcium, 0)}mg`);
                if (m.iron != null) micros.push(`Iron ${formatNum(m.iron, 1)}mg`);
                if (m.vitaminC != null) micros.push(`Vit C ${formatNum(m.vitaminC, 1)}mg`);

                return `
                  <div class="meal-card">
                    <h3>${escapeHtml(m.name)}</h3>
                    <p class="meal-meta">${formatNum(m.kcal, 0)} kcal | P ${formatNum(m.protein, 0)}g | C ${formatNum(m.carbs, 0)}g | F ${formatNum(m.fat, 0)}g</p>
                    ${micros.length ? `<p class="meal-meta">${micros.join(" | ")}</p>` : ""}
                    <button class="btn-small" onclick="deleteMeal('${m.id}')">Delete</button>
                  </div>
                `;
              })
              .join("")
          : `<p class="muted">No meals added yet</p>`;

      return `
        <div class="day-plan">
          <h3>${slotLabels[slot]}</h3>
          ${content}
        </div>
      `;
    })
    .join("");
}

function deleteMeal(id) {
  state.mealsByDate[todayDate()] = getDayMeals().filter((m) => m.id !== id);
  saveState();
  renderAll();
}

function estimateFromFoodDb(name, qty = 100) {
  const text = name.toLowerCase();
  const db = { ...builtInFoodDb, ...state.foodLibrary };
  let found = null;

  Object.keys(db).forEach((key) => {
    if (text.includes(key) && !found) found = key;
  });

  if (!found) {
    const grams = Number(qty) || 100;
    return {
      kcal: (200 * grams) / 100,
      protein: (10 * grams) / 100,
      carbs: (18 * grams) / 100,
      fat: (6 * grams) / 100,
      fiber: (2 * grams) / 100,
      calcium: (40 * grams) / 100,
      iron: (1 * grams) / 100,
      vitaminC: (3 * grams) / 100,
    };
  }

  const per100 = db[found];
  const factor = Number(qty) / 100;
  return {
    kcal: (per100.kcal || 0) * factor,
    protein: (per100.protein || 0) * factor,
    carbs: (per100.carbs || 0) * factor,
    fat: (per100.fat || 0) * factor,
    fiber: (per100.fiber || 0) * factor,
    calcium: (per100.calcium || 0) * factor,
    iron: (per100.iron || 0) * factor,
    vitaminC: (per100.vitaminC || 0) * factor,
  };
}

function fillMealFormFromEstimate(estimation) {
  if (select("mealCalories")) select("mealCalories").value = Math.round(estimation.kcal || 0);
  if (select("mealProtein")) select("mealProtein").value = Number(estimation.protein || 0).toFixed(1);
  if (select("mealCarbs")) select("mealCarbs").value = Number(estimation.carbs || 0).toFixed(1);
  if (select("mealFat")) select("mealFat").value = Number(estimation.fat || 0).toFixed(1);
  if (select("mealFiber")) select("mealFiber").value = Number(estimation.fiber || 0).toFixed(1);
  if (select("mealCalcium")) select("mealCalcium").value = Number(estimation.calcium || 0).toFixed(0);
  if (select("mealIron")) select("mealIron").value = Number(estimation.iron || 0).toFixed(1);
  if (select("mealVitaminC")) select("mealVitaminC").value = Number(estimation.vitaminC || 0).toFixed(1);
}

function estimateMealFromBtn() {
  const name = select("mealName")?.value.trim();
  if (!name) {
    alert("Enter meal name first.");
    return;
  }

  const qty = Number(select("mealQty")?.value || 100);
  const estimation = estimateFromFoodDb(name, qty);
  fillMealFormFromEstimate(estimation);
  setText("mealStatus", "Estimated using built-in food database.");
}

function extractJsonObject(text) {
  const cleaned = String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in response");
  return JSON.parse(match[0]);
}

function ensureApiKey(featureName) {
  const key = (state.settings.apiKey || "").trim();
  if (key) return true;

  const openGuide = confirm(
    `${featureName} needs a free OpenRouter API key.\n\nPress OK to open key page, then paste your key.\nPress Cancel to paste key directly.`
  );

  if (openGuide) {
    window.open("https://openrouter.ai/keys", "_blank");
  }

  const entered = prompt("Paste your OpenRouter key here (starts with sk-or-v1-):");
  if (!entered) return false;

  const normalized = entered.trim();
  if (!normalized.startsWith("sk-or-v1-")) {
    alert("That does not look like a valid OpenRouter key.");
    return false;
  }

  state.settings.apiKey = normalized;
  saveState();
  renderApiSettings();
  return true;
}

async function callOpenRouter(messages, modelOverride) {
  const apiKey = (state.settings.apiKey || "").trim();
  if (!apiKey) throw new Error("No API key available");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": window.location.origin || "http://localhost",
      "X-Title": APP_NAME,
    },
    body: JSON.stringify({
      model: modelOverride || state.settings.aiModel || "openai/gpt-4o-mini",
      messages,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${text.slice(0, 180)}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (typeof part?.text === "string") return part.text;
        return "";
      })
      .join("\n")
      .trim();
  }

  return "";
}

async function aiEstimateMeal() {
  const name = select("mealName")?.value.trim();
  if (!name) {
    alert("Enter meal name first.");
    return;
  }

  if (!ensureApiKey("AI meal estimate")) return;

  const qty = Number(select("mealQty")?.value || 100);
  setText("mealStatus", "AI is estimating nutrition and micronutrients...");

  try {
    const prompt = `Estimate nutrition for food item. Return strict JSON with keys: kcal, protein, carbs, fat, fiber, calciumMg, ironMg, vitaminCMg. Food: "${name}". Quantity grams: ${qty}.`; 
    const raw = await callOpenRouter(
      [
        {
          role: "system",
          content:
            "You are a nutrition estimation engine. Return only valid JSON object with numeric values and no extra text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      state.settings.aiModel || "openai/gpt-4o-mini"
    );

    const parsed = extractJsonObject(raw);

    fillMealFormFromEstimate({
      kcal: Number(parsed.kcal || 0),
      protein: Number(parsed.protein || 0),
      carbs: Number(parsed.carbs || 0),
      fat: Number(parsed.fat || 0),
      fiber: Number(parsed.fiber || 0),
      calcium: Number(parsed.calciumMg || 0),
      iron: Number(parsed.ironMg || 0),
      vitaminC: Number(parsed.vitaminCMg || 0),
    });

    setText("mealStatus", "AI estimate ready. Review values and save meal.");
  } catch {
    const fallback = estimateFromFoodDb(name, qty);
    fillMealFormFromEstimate(fallback);
    setText("mealStatus", "AI estimate failed. Used built-in estimate instead.");
  }
}

function parseNutritionLabel(text) {
  const normalized = String(text || "")
    .replace(/,/g, ".")
    .replace(/\s+/g, " ");

  const extract = (regex) => {
    const m = normalized.match(regex);
    return m ? Number(m[1]) : null;
  };

  return {
    kcal: extract(/(?:calories|energy)\s*[:]?\s*(\d+(?:\.\d+)?)/i),
    protein: extract(/protein\s*[:]?\s*(\d+(?:\.\d+)?)/i),
    carbs: extract(/(?:carbohydrate|carbs?)\s*[:]?\s*(\d+(?:\.\d+)?)/i),
    fat: extract(/fat\s*[:]?\s*(\d+(?:\.\d+)?)/i),
    fiber: extract(/fiber\s*[:]?\s*(\d+(?:\.\d+)?)/i),
    calcium: extract(/calcium\s*[:]?\s*(\d+(?:\.\d+)?)/i),
    iron: extract(/iron\s*[:]?\s*(\d+(?:\.\d+)?)/i),
    vitaminC: extract(/vitamin\s*c\s*[:]?\s*(\d+(?:\.\d+)?)/i),
  };
}

async function handleLabelPhotoScan(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!window.Tesseract) {
    setText("mealStatus", "OCR engine unavailable on this device.");
    return;
  }

  setText("mealStatus", "Scanning nutrition label...");

  try {
    const result = await window.Tesseract.recognize(file, "eng", { logger: () => {} });
    const parsed = parseNutritionLabel(result?.data?.text || "");

    if (parsed.kcal == null && parsed.protein == null && parsed.carbs == null && parsed.fat == null) {
      setText("mealStatus", "Could not read nutrition values clearly. Try a sharper photo.");
      return;
    }

    fillMealFormFromEstimate({
      kcal: parsed.kcal ?? 0,
      protein: parsed.protein ?? 0,
      carbs: parsed.carbs ?? 0,
      fat: parsed.fat ?? 0,
      fiber: parsed.fiber ?? 0,
      calcium: parsed.calcium ?? 0,
      iron: parsed.iron ?? 0,
      vitaminC: parsed.vitaminC ?? 0,
    });

    setText("mealStatus", "Label scanned. Verify and save meal.");
  } catch {
    setText("mealStatus", "OCR failed. Please fill values manually.");
  }
}

function handleMealFormSubmit(e) {
  e.preventDefault();

  const name = select("mealName")?.value.trim();
  if (!name) {
    alert("Please enter meal name.");
    return;
  }

  const qty = Number(select("mealQty")?.value || 100);

  const manualKcal = parseOptionalNumber("mealCalories");
  const manualProtein = parseOptionalNumber("mealProtein");
  const manualCarbs = parseOptionalNumber("mealCarbs");
  const manualFat = parseOptionalNumber("mealFat");

  const manualFiber = parseOptionalNumber("mealFiber");
  const manualCalcium = parseOptionalNumber("mealCalcium");
  const manualIron = parseOptionalNumber("mealIron");
  const manualVitaminC = parseOptionalNumber("mealVitaminC");

  const estimated = estimateFromFoodDb(name, qty);

  const protein = manualProtein ?? estimated.protein;
  const carbs = manualCarbs ?? estimated.carbs;
  const fat = manualFat ?? estimated.fat;
  const kcal = manualKcal ?? protein * 4 + carbs * 4 + fat * 9;

  const meal = {
    id: uid("meal"),
    slot: select("mealSlot")?.value || "breakfast",
    name,
    qty,
    kcal: Number(kcal),
    protein: Number(protein),
    carbs: Number(carbs),
    fat: Number(fat),
    fiber: manualFiber ?? estimated.fiber,
    calcium: manualCalcium ?? estimated.calcium,
    iron: manualIron ?? estimated.iron,
    vitaminC: manualVitaminC ?? estimated.vitaminC,
  };

  getDayMeals().push(meal);
  saveState();
  clearMealInputFields();
  setText("mealStatus", "Meal saved successfully.");
  renderAll();
}

function startVoiceInput(targetInputId = "mealName") {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Voice input not supported on this browser. Use Chrome.");
    return;
  }

  const recog = new SpeechRecognition();
  recog.lang = "en-IN";
  recog.interimResults = false;
  recog.maxAlternatives = 1;

  recog.onresult = (event) => {
    const text = event.results[0][0].transcript;
    const input = select(targetInputId);
    if (input) input.value = text;
  };

  recog.onerror = () => {
    alert("Could not capture voice. Please try again.");
  };

  recog.start();
}

function renderWeeklyPlan() {
  const container = select("weeklyPlanContainer");
  if (!container) return;

  if (!state.weeklyPlan) state.weeklyPlan = getDefaultWeeklyPlan();

  const introText = currentUser?.isAdmin
    ? "Your easy repeatable weekly plan is preloaded. Edit anything anytime."
    : "Create your own weekly plan. Type directly or use voice fill.";
  setText("weeklyPlanIntro", introText);

  select("planBuilderHint")?.classList.toggle("hidden", Boolean(currentUser?.isAdmin));

  container.innerHTML = daysOrder
    .map((day) => {
      const p = state.weeklyPlan[day] || { breakfast: "", lunch: "", snacks: "", dinner: "", notes: "" };
      return `
        <div class="day-plan">
          <h3>${day}</h3>
          <label>Breakfast<input data-plan="${day}:breakfast" value="${escapeHtml(p.breakfast)}" /></label>
          <label>Lunch<input data-plan="${day}:lunch" value="${escapeHtml(p.lunch)}" /></label>
          <label>Snacks<input data-plan="${day}:snacks" value="${escapeHtml(p.snacks)}" /></label>
          <label>Dinner<input data-plan="${day}:dinner" value="${escapeHtml(p.dinner)}" /></label>
          <label>Notes<textarea rows="2" data-plan="${day}:notes">${escapeHtml(p.notes || "")}</textarea></label>
        </div>
      `;
    })
    .join("");
}

function saveWeeklyPlan() {
  document.querySelectorAll("[data-plan]").forEach((el) => {
    const key = el.getAttribute("data-plan");
    const [day, field] = key.split(":");
    if (!state.weeklyPlan[day]) state.weeklyPlan[day] = {};
    state.weeklyPlan[day][field] = el.value;
  });
  saveState();
  alert("Weekly plan saved.");
}

function resetWeeklyPlan() {
  state.weeklyPlan = getDefaultWeeklyPlan();
  saveState();
  renderWeeklyPlan();
  alert("Weekly plan reset.");
}

function startWeeklyPlanWizard() {
  const breakfast = prompt("Enter breakfast you can arrange daily:");
  if (!breakfast) return;
  const lunch = prompt("Enter lunch you can arrange daily:");
  if (!lunch) return;
  const snacks = prompt("Enter snacks you can arrange daily:");
  if (!snacks) return;
  const dinner = prompt("Enter dinner you can arrange daily:");
  if (!dinner) return;

  const notes = prompt("Any note for this plan? (optional)") || "Custom plan from wizard.";

  const generated = {};
  daysOrder.forEach((day) => {
    generated[day] = { breakfast, lunch, snacks, dinner, notes };
  });

  state.weeklyPlan = generated;
  saveState();
  renderWeeklyPlan();
  alert("Custom weekly plan created.");
}

function startWeeklyVoiceFill() {
  const dayInput = prompt(`Enter day name (${daysOrder.join(", ")}):`);
  if (!dayInput) return;
  const mealInput = prompt("Enter meal slot (breakfast, lunch, snacks, dinner, notes):");
  if (!mealInput) return;

  const day = daysOrder.find((d) => d.toLowerCase() === dayInput.trim().toLowerCase());
  const slot = mealInput.trim().toLowerCase();
  const validSlots = ["breakfast", "lunch", "snacks", "dinner", "notes"];

  if (!day || !validSlots.includes(slot)) {
    alert("Invalid day or slot.");
    return;
  }

  const target = document.querySelector(`[data-plan="${day}:${slot}"]`);
  if (!target) {
    alert("Could not find that field.");
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  const recog = new SpeechRecognition();
  recog.lang = "en-IN";
  recog.interimResults = false;
  recog.maxAlternatives = 1;

  recog.onresult = (event) => {
    target.value = event.results[0][0].transcript;
  };

  recog.onerror = () => {
    alert("Voice capture failed.");
  };

  recog.start();
}

function handleMorningSubmit(e) {
  e.preventDefault();
  const log = ensureGymLogForDate();

  log.morningActivityType = select("morningActivityType")?.value || "walk";
  log.morningMinutes = Number(select("morningMinutes")?.value || 0);
  log.morningDone = Boolean(select("morningDone")?.checked);
  log.absDone = Boolean(select("absDone")?.checked);
  log.morningNotes = select("morningNotes")?.value || "";

  saveState();
  alert("Morning check-in saved.");
}

function renderMorningForm() {
  const log = ensureGymLogForDate();

  if (select("morningActivityType")) select("morningActivityType").value = log.morningActivityType || "walk";
  if (select("morningMinutes")) select("morningMinutes").value = log.morningMinutes || "";
  if (select("morningDone")) select("morningDone").checked = Boolean(log.morningDone);
  if (select("absDone")) select("absDone").checked = Boolean(log.absDone);
  if (select("morningNotes")) select("morningNotes").value = log.morningNotes || "";
}

function handleWeightSubmit(e) {
  e.preventDefault();

  const date = select("weightDate")?.value;
  const weight = Number(select("weightValue")?.value || 0);

  if (!date || !weight) {
    alert("Please enter date and weight.");
    return;
  }

  const existing = state.weightEntries.find((w) => w.date === date);
  if (existing) {
    existing.weight = weight;
  } else {
    state.weightEntries.push({ id: uid("weight"), date, weight });
  }

  state.weightEntries = state.weightEntries.sort((a, b) => a.date.localeCompare(b.date));
  saveState();
  renderAll();
  alert("Weight recorded.");
}

function renderWeightSummary() {
  const box = select("weightSummary");
  if (!box) return;

  const entries = state.weightEntries;
  if (!entries.length) {
    box.innerHTML = `<p class="muted">No weight entries yet.</p>`;
    return;
  }

  const first = entries[0];
  const last = entries[entries.length - 1];
  const change = Number(first.weight) - Number(last.weight);

  box.innerHTML = `
    <div class="summary-box"><div>Start</div><div>${formatNum(first.weight, 1)} kg</div></div>
    <div class="summary-box"><div>Current</div><div>${formatNum(last.weight, 1)} kg</div></div>
    <div class="summary-box"><div>Change</div><div style="color:${change > 0 ? "var(--success)" : "var(--danger)"};">${change > 0 ? "-" : "+"}${formatNum(Math.abs(change), 1)} kg</div></div>
  `;
}

function drawWeightChart() {
  const canvas = select("weightChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const entries = [...state.weightEntries].sort((a, b) => a.date.localeCompare(b.date));
  if (entries.length < 2) {
    ctx.fillStyle = "#6b7280";
    ctx.font = "14px Sora";
    ctx.fillText("Add at least 2 entries to view chart", 20, canvas.height / 2);
    return;
  }

  const weights = entries.map((e) => Number(e.weight));
  const minW = Math.min(...weights) - 0.4;
  const maxW = Math.max(...weights) + 0.4;
  const range = Math.max(0.2, maxW - minW);
  const xStep = (canvas.width - 40) / (entries.length - 1);

  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = 10 + (i * (canvas.height - 20)) / 4;
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(canvas.width - 10, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#ff5a2a";
  ctx.lineWidth = 3;
  ctx.beginPath();

  entries.forEach((entry, i) => {
    const x = 30 + i * xStep;
    const y = 10 + ((maxW - Number(entry.weight)) / range) * (canvas.height - 20);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = "#0f3460";
  entries.forEach((entry, i) => {
    const x = 30 + i * xStep;
    const y = 10 + ((maxW - Number(entry.weight)) / range) * (canvas.height - 20);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function analyzePhotoWithAI() {
  const file = select("photoInput")?.files?.[0];
  if (!file) {
    setText("photoAiFeedback", "Select a photo first, then tap AI Analyze Photo.");
    return;
  }

  if (!ensureApiKey("AI photo analysis")) return;

  setText("photoAiFeedback", "AI is analyzing your progress photo...");

  try {
    const dataUrl = await fileToDataUrl(file);

    const result = await callOpenRouter(
      [
        {
          role: "system",
          content:
            "You are a fitness coach. Give concise practical feedback in 5 lines: posture, visible progress, focus areas, next-week action, motivation.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this fitness progress photo and give practical next steps." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      state.settings.aiModel || "openai/gpt-4o-vision"
    );

    setText("photoAiFeedback", result || "AI did not return text. Please try again.");
  } catch {
    setText("photoAiFeedback", "AI analysis failed. Please check API key/model or internet.");
  }
}

function handlePhotoSubmit(e) {
  e.preventDefault();

  const file = select("photoInput")?.files?.[0];
  if (!file) {
    alert("Please select a photo first.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    state.photoEntries.unshift({
      id: uid("photo"),
      date: new Date().toISOString(),
      type: select("photoType")?.value || "body",
      note: select("photoNote")?.value || "",
      image: reader.result,
    });

    const now = Date.now();
    state.photoEntries = state.photoEntries.filter(
      (p) => now - new Date(p.date).getTime() <= 30 * 24 * 60 * 60 * 1000
    );

    saveState();
    select("photoForm")?.reset();
    renderPhotoSection();
    alert("Photo saved.");
  };

  reader.readAsDataURL(file);
}

function renderPhotoSection() {
  const gallery = select("photoGallery");
  if (!gallery) return;

  if (!state.photoEntries.length) {
    gallery.innerHTML = `<p class="muted">No photos yet. Upload to track progress.</p>`;
    return;
  }

  gallery.innerHTML = state.photoEntries
    .map((p) => {
      const date = new Date(p.date).toLocaleDateString();
      const typeLabel = p.type === "body" ? "Body" : "Scale";
      return `
        <div class="photo-card">
          <h3>${typeLabel} | ${date}</h3>
          <img src="${p.image}" alt="${escapeHtml(typeLabel)}" />
          <p class="muted" style="padding: 10px 10px 12px;">${escapeHtml(p.note || "No note")}</p>
        </div>
      `;
    })
    .join("");
}

function handleProfileSubmit(e) {
  e.preventDefault();

  state.profile.currentWeight = Number(select("currentWeight")?.value || state.profile.currentWeight);
  state.profile.goalWeight = Number(select("goalWeight")?.value || state.profile.goalWeight);
  state.profile.age = Number(select("age")?.value || state.profile.age);
  state.profile.heightCm = Number(select("heightCm")?.value || state.profile.heightCm);
  state.profile.weeklyLoss = Number(select("weeklyLoss")?.value || state.profile.weeklyLoss);
  state.profile.calorieTarget = Number(select("calorieTarget")?.value || state.profile.calorieTarget);

  calculateTargetsFromProfile();
  saveState();
  renderAll();
  alert("Goals updated.");
}

function renderProfileForm() {
  if (select("currentWeight")) select("currentWeight").value = state.profile.currentWeight;
  if (select("goalWeight")) select("goalWeight").value = state.profile.goalWeight;
  if (select("age")) select("age").value = state.profile.age;
  if (select("heightCm")) select("heightCm").value = state.profile.heightCm;
  if (select("weeklyLoss")) select("weeklyLoss").value = state.profile.weeklyLoss;
  if (select("calorieTarget")) select("calorieTarget").value = state.profile.calorieTarget;

  const p = state.profile;
  const box = select("targetSummary");
  if (!box) return;

  box.innerHTML = `
    <div class="summary-box"><div>Maintenance</div><div>${formatNum(p.maintenanceCalories, 0)} kcal</div></div>
    <div class="summary-box"><div>Cut Target</div><div>${formatNum(p.deficitCalories, 0)} kcal</div></div>
    <div class="summary-box"><div>Protein</div><div>${formatNum(p.macros.proteinG, 0)} g</div></div>
    <div class="summary-box"><div>Carbs</div><div>${formatNum(p.macros.carbsG, 0)} g</div></div>
    <div class="summary-box"><div>Fat</div><div>${formatNum(p.macros.fatG, 0)} g</div></div>
  `;
}

function autoCalculateTargets() {
  state.profile.calorieTarget = 0;
  calculateTargetsFromProfile();
  saveState();
  renderAll();
}

function renderApiSettings() {
  if (select("apiKeyInput")) select("apiKeyInput").value = state.settings.apiKey || "";
  if (select("aiModelInput")) select("aiModelInput").value = state.settings.aiModel || "openai/gpt-4o-mini";

  const status = state.settings.apiKey
    ? "API key is saved for this account."
    : "No API key saved. Core app works without AI.";
  setText("apiStatus", status);
}

function handleApiFormSubmit(e) {
  e.preventDefault();

  state.settings.apiKey = (select("apiKeyInput")?.value || "").trim();
  state.settings.aiModel = (select("aiModelInput")?.value || "openai/gpt-4o-mini").trim();
  if (!state.settings.aiModel) state.settings.aiModel = "openai/gpt-4o-mini";

  saveState();
  renderApiSettings();
  alert("AI settings saved.");
}

function exportData() {
  const payload = {
    app: APP_NAME,
    userEmail: currentUser?.email,
    exportedAt: new Date().toISOString(),
    state,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dad-bod-${todayDate()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const importedState = parsed?.state ? parsed.state : parsed;
      const base = currentUser?.isAdmin ? clone(adminDefaultState) : clone(genericDefaultState);
      state = mergeState(base, importedState);
      saveState();
      renderAll();
      alert("Data imported.");
    } catch {
      alert("Invalid JSON file format.");
    }
  };
  reader.readAsText(file);
}

function clearToday() {
  if (!confirm("Clear today's meals?")) return;
  state.mealsByDate[todayDate()] = [];
  saveState();
  renderAll();
}

function openExerciseGuide(encodedName) {
  const exerciseName = decodeURIComponent(encodedName || "");
  const workout = findTodayWorkout();
  const exercise = workout.exercises.find((e) => e.name === exerciseName);
  if (!exercise) return;
  openExerciseModal(exercise);
}

function openAbsGuide(encodedName) {
  const exerciseName = decodeURIComponent(encodedName || "");
  const exercise = absCircuit.find((e) => e.name === exerciseName);
  if (!exercise) return;
  openExerciseModal(exercise);
}

function openExerciseModal(exercise) {
  setText("modalTitle", exercise.name);
  setText("modalCues", `${exercise.sets} | ${exercise.cues}`);
  setText("modalLoading", "Loading GIF guide...");

  const gifEl = select("modalGif");
  if (gifEl) {
    gifEl.style.display = "none";
    gifEl.src = "";
    gifEl.alt = `${exercise.name} guide`;
  }

  const query = `${exercise.name} exercise form`;
  const videoBtn = select("modalVideoBtn");
  if (videoBtn) videoBtn.dataset.query = query;

  const modal = select("exerciseModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  }
  document.body.classList.add("modal-open");

  loadExerciseGif(query);
}

function closeExerciseModal() {
  const modal = select("exerciseModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }
  document.body.classList.remove("modal-open");
}

async function getExerciseGifUrl(query) {
  if (gifCache[query]) return gifCache[query];

  const endpoint = `https://g.tenor.com/v1/search?q=${encodeURIComponent(
    query
  )}&key=${TENOR_PUBLIC_KEY}&limit=8&media_filter=minimal&contentfilter=high`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`GIF lookup failed: ${response.status}`);
  }

  const data = await response.json();
  const results = Array.isArray(data?.results) ? data.results : [];

  const gifUrl = results
    .map((r) => r?.media?.[0]?.gif?.url)
    .find((url) => typeof url === "string" && url.startsWith("http"));

  if (!gifUrl) throw new Error("No GIF found");

  gifCache[query] = gifUrl;
  return gifUrl;
}

function showGifFallback(query) {
  const gifEl = select("modalGif");
  if (gifEl) {
    gifEl.onload = null;
    gifEl.onerror = null;
    gifEl.src = "assets/exercise-fallback.svg";
    gifEl.style.display = "block";
  }

  const videoBtn = select("modalVideoBtn");
  if (videoBtn) videoBtn.dataset.query = query;

  setText("modalLoading", "GIF unavailable on this network. Tap Open Video Guide.");
}

async function loadExerciseGif(query) {
  const gifEl = select("modalGif");
  if (!gifEl) return;

  try {
    const gifUrl = await getExerciseGifUrl(query);

    gifEl.onload = () => {
      gifEl.style.display = "block";
      setText("modalLoading", "GIF loaded. Watch form carefully.");
    };

    gifEl.onerror = () => {
      showGifFallback(query);
    };

    gifEl.src = gifUrl;
  } catch {
    showGifFallback(query);
  }
}

function openModalVideoGuide() {
  const query = select("modalVideoBtn")?.dataset?.query || "bodyweight workout exercise form";
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  window.open(url, "_blank");
}

function renderAll() {
  if (!state) return;

  updateDateTime();
  updateBranding();
  renderHeaderStats();
  renderDashboard();
  renderDietForm();
  renderMealsList();
  renderWeeklyPlan();
  renderTodayWorkout();
  renderAbsCircuit();
  renderMorningForm();

  if (select("weightDate")) select("weightDate").value = todayDate();
  renderWeightSummary();
  drawWeightChart();
  renderPhotoSection();
  renderProfileForm();
  renderApiSettings();
}

function bindAppEvents() {
  if (appEventsBound) return;
  appEventsBound = true;

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      showTab(btn.getAttribute("data-tab"));
    });
  });

  select("profileForm")?.addEventListener("submit", handleProfileSubmit);
  select("autoTargetBtn")?.addEventListener("click", autoCalculateTargets);
  select("mealForm")?.addEventListener("submit", handleMealFormSubmit);
  select("voiceBtn")?.addEventListener("click", () => startVoiceInput("mealName"));
  select("estimateMealBtn")?.addEventListener("click", estimateMealFromBtn);
  select("aiEstimateMealBtn")?.addEventListener("click", aiEstimateMeal);
  select("labelPhotoInput")?.addEventListener("change", handleLabelPhotoScan);

  select("savePlanBtn")?.addEventListener("click", saveWeeklyPlan);
  select("resetPlanBtn")?.addEventListener("click", resetWeeklyPlan);
  select("planWizardBtn")?.addEventListener("click", startWeeklyPlanWizard);
  select("planVoiceBtn")?.addEventListener("click", startWeeklyVoiceFill);

  select("morningForm")?.addEventListener("submit", handleMorningSubmit);
  select("weightForm")?.addEventListener("submit", handleWeightSubmit);
  select("photoForm")?.addEventListener("submit", handlePhotoSubmit);
  select("aiPhotoAnalyzeBtn")?.addEventListener("click", analyzePhotoWithAI);

  select("apiForm")?.addEventListener("submit", handleApiFormSubmit);

  select("importInput")?.addEventListener("change", importData);
    select("getApiKeyBtn")?.addEventListener("click", () => {
      window.open("https://openrouter.ai/keys", "_blank");
    });

  select("exportBtn")?.addEventListener("click", exportData);
  select("clearDayBtn")?.addEventListener("click", clearToday);

  select("logoutBtn")?.addEventListener("click", logoutCurrentUser);

  select("modalCloseBtn")?.addEventListener("click", closeExerciseModal);
  select("modalCloseBtnBottom")?.addEventListener("click", closeExerciseModal);
  select("modalBackdrop")?.addEventListener("click", closeExerciseModal);
  select("modalVideoBtn")?.addEventListener("click", openModalVideoGuide);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeExerciseModal();
  });
}

function bindAuthEvents() {
  if (authEventsBound) return;
  authEventsBound = true;

  document.querySelectorAll(".auth-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchAuthTab(btn.getAttribute("data-auth-tab"));
    });
  });

  select("signInForm")?.addEventListener("submit", handleSignInSubmit);
  select("signUpForm")?.addEventListener("submit", handleSignUpSubmit);
  select("googleSignInBtn")?.addEventListener("click", handleGoogleQuickSignIn);
  select("googleSignUpBtn")?.addEventListener("click", handleGoogleQuickSignIn);
}

function exposeWindowActions() {
  window.scrollToTab = scrollToTab;
  window.toggleExercise = toggleExercise;
  window.toggleAbsExercise = toggleAbsExercise;
  window.deleteMeal = deleteMeal;
  window.openExerciseGuide = openExerciseGuide;
  window.openAbsGuide = openAbsGuide;
}

function init() {
  bindAuthEvents();
  bindAppEvents();
  exposeWindowActions();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }

  const activeUser = authStore.users.find((u) => u.id === authStore.activeUserId);
  if (activeUser) {
    activateUser(activeUser);
  } else {
    showAuthShell("signin");
  }

  setInterval(updateDateTime, 30000);
}

init();
