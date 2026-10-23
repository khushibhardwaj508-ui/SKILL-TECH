"use strict";

/* =========================================
   SKILLTECH: LOCAL PROTOTYPE
   Progress is saved in this browser only.
========================================= */

const STORAGE_KEY = "skilltech-progress-v1";

const defaultState = {
  selectedSkill: "tech",
  completedTasks: [],
  solvedChallenges: [],
  scores: {},
  quizResult: null
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") return { ...defaultState };

    return {
      ...defaultState,
      ...saved,
      completedTasks: Array.isArray(saved.completedTasks) ? saved.completedTasks : [],
      solvedChallenges: Array.isArray(saved.solvedChallenges) ? saved.solvedChallenges : [],
      scores: saved.scores && typeof saved.scores === "object" ? saved.scores : {}
    };
  } catch {
    return { ...defaultState };
  }
}

let state = loadState();
let activePage = "dashboard";
let activeMode = "coding";
let resourceFilter = "all";
let toastTimer;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    showToast("Could not save progress. Check your browser storage settings.");
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function setText(selector, value) {
  const element = $(selector);
  if (element) element.textContent = value;
}

/* =========================================
   NAVIGATION
========================================= */

const pageTitles = {
  dashboard: "Dashboard",
  finder: "Skill Finder",
  roadmap: "Learning Roadmap",
  resources: "Free Resources",
  progress: "Progress Tracker",
  coding: "Coding Arena"
};

function navigate(page) {
  if (!pageTitles[page]) return;

  activePage = page;

  $$(".page").forEach(section => {
    section.classList.toggle("active", section.id === page);
  });

  $$(".nav-link").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  setText("#pageTitle", pageTitles[page]);
  $("#sidebar").classList.remove("open");

  if (page === "dashboard") renderDashboard();
  if (page === "roadmap") renderRoadmap();
  if (page === "progress") renderProgress();
  if (page === "coding") renderArena();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", event => {
  const nav = event.target.closest("[data-page]");
  const go = event.target.closest("[data-go]");

  if (nav) {
    event.preventDefault();
    navigate(nav.dataset.page);
  }

  if (go) navigate(go.dataset.go);
});

$("#menuToggle").addEventListener("click", () => {
  $("#sidebar").classList.toggle("open");
});

/* =========================================
   LEARNING ROADMAPS
========================================= */

const tracks = {
  tech: {
    name: "Web Development",
    icon: "fa-code",
    description: "Learn to create websites from scratch.",
    stages: [
      {
        title: "HTML Foundations",
        description: "Learn the structure of a webpage.",
        tasks: [
          "Understand HTML tags and elements.",
          "Create headings, paragraphs, and links.",
          "Build a webpage with images and lists."
        ]
      },
      {
        title: "CSS and Design",
        description: "Make your pages attractive and responsive.",
        tasks: [
          "Learn colors, fonts, margins, and padding.",
          "Practice Flexbox and CSS Grid.",
          "Build a responsive card layout."
        ]
      },
      {
        title: "JavaScript Basics",
        description: "Add interactions to your website.",
        tasks: [
          "Learn variables, conditions, and functions.",
          "Understand arrays, objects, and loops.",
          "Use events to respond to button clicks."
        ]
      },
      {
        title: "Build a Project",
        description: "Combine your skills in a real project.",
        tasks: [
          "Build a working quiz application.",
          "Create a personal portfolio website.",
          "Test your project and write a README."
        ]
      }
    ]
  },

  creative: {
    name: "Graphic Design",
    icon: "fa-palette",
    description: "Learn to communicate ideas through visuals.",
    stages: [
      {
        title: "Design Foundations",
        description: "Understand what makes a design clear.",
        tasks: [
          "Learn color theory and contrast.",
          "Explore typography and font pairing.",
          "Study spacing, alignment, and visual hierarchy."
        ]
      },
      {
        title: "Learn Design Tools",
        description: "Practice with accessible design software.",
        tasks: [
          "Explore Canva or Figma.",
          "Create a social media post.",
          "Design a simple presentation."
        ]
      },
      {
        title: "Build a Portfolio",
        description: "Show your creativity with examples.",
        tasks: [
          "Create a poster for an imaginary event.",
          "Design a simple brand identity.",
          "Collect your best work into a portfolio."
        ]
      }
    ]
  },

  business: {
    name: "Excel & Data Skills",
    icon: "fa-chart-column",
    description: "Learn spreadsheets and basic data analysis.",
    stages: [
      {
        title: "Spreadsheet Basics",
        description: "Get comfortable with data tables.",
        tasks: [
          "Learn rows, columns, cells, and formatting.",
          "Practice SUM, AVERAGE, MIN, and MAX.",
          "Sort and filter a small dataset."
        ]
      },
      {
        title: "Analyze Data",
        description: "Turn raw data into useful information.",
        tasks: [
          "Practice IF and COUNTIF formulas.",
          "Create charts from a dataset.",
          "Build a simple summary table."
        ]
      },
      {
        title: "Mini Data Project",
        description: "Use your new skills in a project.",
        tasks: [
          "Organize sample student marks.",
          "Calculate averages and identify trends.",
          "Create a dashboard with charts."
        ]
      }
    ]
  },

  communication: {
    name: "Communication Skills",
    icon: "fa-comments",
    description: "Improve speaking, writing, and confidence.",
    stages: [
      {
        title: "Communication Basics",
        description: "Learn to express ideas clearly.",
        tasks: [
          "Practice introducing yourself in one minute.",
          "Learn active listening techniques.",
          "Write a clear and polite email."
        ]
      },
      {
        title: "Speaking Practice",
        description: "Become more comfortable sharing ideas.",
        tasks: [
          "Prepare a two-minute speech.",
          "Practice explaining a topic simply.",
          "Record a practice presentation and review it."
        ]
      },
      {
        title: "Professional Communication",
        description: "Prepare for college and career situations.",
        tasks: [
          "Practice answering interview questions.",
          "Write a professional introduction.",
          "Give a short presentation on a familiar topic."
        ]
      }
    ]
  }
};

function getTrackTasks(trackKey) {
  const track = tracks[trackKey];
  const tasks = [];

  track.stages.forEach((stage, stageIndex) => {
    stage.tasks.forEach((task, taskIndex) => {
      tasks.push({
        id: `${trackKey}-${stageIndex}-${taskIndex}`,
        text: task
      });
    });
  });

  return tasks;
}

function trackProgress(trackKey) {
  const tasks = getTrackTasks(trackKey);
  const completed = tasks.filter(task =>
    state.completedTasks.includes(task.id)
  ).length;

  return {
    total: tasks.length,
    completed,
    percent: tasks.length ? Math.round(completed / tasks.length * 100) : 0
  };
}

function allTasksCount() {
  return Object.keys(tracks).reduce(
    (total, key) => total + getTrackTasks(key).length, 0
  );
}

function completedTasksCount() {
  return Object.values(tracks).reduce((total, track) => {
    return total + track.stages.reduce((stageTotal, stage, stageIndex) => {
      return stageTotal + stage.tasks.filter((_, taskIndex) =>
        state.completedTasks.includes(
          `${Object.keys(tracks).find(key => tracks[key] === track)}-${stageIndex}-${taskIndex}`
        )
      ).length;
    }, 0);
  }, 0);
}

/* =========================================
   SKILL FINDER QUIZ
========================================= */

const skillRecommendations = {
  tech: {
    title: "Web Development",
    text: "You enjoy technology and problem-solving. Start with HTML, CSS, and JavaScript, then build your own websites.",
    track: "tech"
  },
  creative: {
    title: "Graphic Design",
    text: "Your creative interests make visual design a useful starting point. Explore color, typography, layout, and design tools.",
    track: "creative"
  },
  business: {
    title: "Excel & Data Skills",
    text: "You may enjoy working with numbers, organizing information, and finding patterns. Start with spreadsheets and simple analysis.",
    track: "business"
  },
  communication: {
    title: "Communication Skills",
    text: "Clear communication helps in college, teamwork, and future careers. Begin with speaking practice, writing, and presentations.",
    track: "communication"
  }
};

function updateQuizProgress() {
  const names = ["interest", "goal", "level"];
  const answered = names.filter(name =>
    $(`input[name="${name}"]:checked`)
  ).length;

  $("#quizProgress").style.width = `${answered / names.length * 100}%`;
}

$("#skillQuiz").addEventListener("change", updateQuizProgress);

$("#skillQuiz").addEventListener("submit", event => {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const interest = formData.get("interest");
  const goal = formData.get("goal");
  const level = formData.get("level");

  if (!interest || !goal || !level) {
    showToast("Please answer all three questions.");
    return;
  }

  const recommendation = skillRecommendations[interest];
  state.selectedSkill = recommendation.track;
  state.quizResult = { interest, goal, level, track: recommendation.track };
  saveState();

  const goalText = {
    career: "career preparation",
    project: "building practical projects",
    confidence: "building confidence",
    explore: "exploring new interests"
  }[goal];

  const levelText = {
    beginner: "Start with the basics and learn at a comfortable pace.",
    some: "Review the foundations, then try small practical projects.",
    experienced: "Challenge yourself with more complex projects and independent practice."
  }[level];

  const result = $("#quizResult");
  result.classList.remove("hidden");

  result.innerHTML = `
    <span class="pill"><i class="fa-solid fa-wand-magic-sparkles"></i> YOUR STARTING POINT</span>
    <h3>${escapeHTML(recommendation.title)}</h3>
    <p>${escapeHTML(recommendation.text)}</p>
    <p><strong>Your goal:</strong> ${escapeHTML(goalText)}.</p>
    <p>${escapeHTML(levelText)}</p>
    <button type="button" class="btn btn-primary" id="quizStartLearning">
      Start Learning <i class="fa-solid fa-arrow-right"></i>
    </button>
  `;

  $("#quizStartLearning").addEventListener("click", () => {
    $("#roadmapSelect").value = recommendation.track;
    navigate("roadmap");
  });

  renderDashboard();
  showToast("Your skill recommendation is ready!");
});

/* =========================================
   ROADMAP RENDERING
========================================= */

function renderRoadmapSelect() {
  const select = $("#roadmapSelect");
  const previous = state.selectedSkill;

  select.innerHTML = Object.entries(tracks).map(([key, track]) => `
    <option value="${key}">${escapeHTML(track.name)}</option>
  `).join("");

  select.value = tracks[previous] ? previous : "tech";
}

function renderRoadmap() {
  renderRoadmapSelect();

  const key = $("#roadmapSelect").value || state.selectedSkill;
  const track = tracks[key];
  const progress = trackProgress(key);

  state.selectedSkill = key;

  setText("#roadmapPercent", `${progress.percent}%`);
  $("#roadmapBar").style.width = `${progress.percent}%`;

  $("#roadmapContent").innerHTML = track.stages.map((stage, stageIndex) => {
    const completed = stage.tasks.filter((_, taskIndex) =>
      state.completedTasks.includes(`${key}-${stageIndex}-${taskIndex}`)
    ).length;

    return `
      <article class="roadmap-stage">
        <div class="stage-heading">
          <div class="stage-number">${String(stageIndex + 1).padStart(2, "0")}</div>
          <div>
            <h3>${escapeHTML(stage.title)}</h3>
            <p>${escapeHTML(stage.description)} · ${completed}/${stage.tasks.length} tasks complete</p>
          </div>
        </div>
        <div class="stage-tasks">
          ${stage.tasks.map((task, taskIndex) => {
            const id = `${key}-${stageIndex}-${taskIndex}`;
            const checked = state.completedTasks.includes(id);

            return `
              <label class="task-row ${checked ? "done" : ""}">
                <input type="checkbox" data-task="${id}" ${checked ? "checked" : ""}>
                <span>${escapeHTML(task)}</span>
              </label>
            `;
          }).join("")}
        </div>
      </article>
    `;
  }).join("");
}

$("#roadmapSelect").addEventListener("change", () => {
  state.selectedSkill = $("#roadmapSelect").value;
  saveState();
  renderRoadmap();
  renderDashboard();
});

/* =========================================
   FREE RESOURCES
========================================= */

const resources = [
  {
    name: "freeCodeCamp",
    category: "tech",
    icon: "fa-laptop-code",
    description: "Free coding lessons and practical web development projects.",
    url: "https://www.freecodecamp.org/"
  },
  {
    name: "MDN Web Docs",
    category: "tech",
    icon: "fa-book-open",
    description: "Detailed guides for HTML, CSS, JavaScript, and the web.",
    url: "https://developer.mozilla.org/en-US/docs/Learn_web_development"
  },
  {
    name: "JavaScript.info",
    category: "tech",
    icon: "fa-brands fa-js",
    description: "A structured tutorial covering JavaScript from basics onward.",
    url: "https://javascript.info/"
  },
  {
    name: "Canva Design School",
    category: "creative",
    icon: "fa-palette",
    description: "Learn visual design and create attractive graphics.",
    url: "https://www.canva.com/designschool/"
  },
  {
    name: "Figma Learn",
    category: "creative",
    icon: "fa-pen-ruler",
    description: "Explore interface design and digital prototyping.",
    url: "https://help.figma.com/"
  },
  {
    name: "Adobe Color",
    category: "creative",
    icon: "fa-swatchbook",
    description: "Explore color palettes and learn color combinations.",
    url: "https://color.adobe.com/"
  },
  {
    name: "GCFGlobal",
    category: "business",
    icon: "fa-table",
    description: "Beginner-friendly computer, spreadsheet, and office lessons.",
    url: "https://edu.gcfglobal.org/en/"
  },
  {
    name: "Microsoft Excel Help",
    category: "business",
    icon: "fa-file-excel",
    description: "Learn spreadsheet functions and Excel features.",
    url: "https://support.microsoft.com/excel"
  },
  {
    name: "Kaggle Learn",
    category: "business",
    icon: "fa-chart-line",
    description: "Short tutorials for data, Python, and machine learning.",
    url: "https://www.kaggle.com/learn"
  },
  {
    name: "British Council LearnEnglish",
    category: "communication",
    icon: "fa-comments",
    description: "Practice English grammar, listening, vocabulary, and speaking.",
    url: "https://learnenglish.britishcouncil.org/"
  },
  {
    name: "Toastmasters",
    category: "communication",
    icon: "fa-microphone",
    description: "Explore public-speaking and communication practice resources.",
    url: "https://www.toastmasters.org/"
  },
  {
    name: "Purdue OWL",
    category: "communication",
    icon: "fa-pen",
    description: "Improve academic writing, grammar, and professional writing.",
    url: "https://owl.purdue.edu/"
  }
];

const categoryLabels = {
  tech: "Technology",
  creative: "Design",
  business: "Data & Business",
  communication: "Communication"
};

function renderResources() {
  const visible = resources.filter(resource =>
    resourceFilter === "all" || resource.category === resourceFilter
  );

  $("#resourceGrid").innerHTML = visible.map(resource => `
    <article class="resource-card">
      <div class="resource-icon"><i class="fa-solid ${resource.icon}"></i></div>
      <h3>${escapeHTML(resource.name)}</h3>
      <p>${escapeHTML(resource.description)}</p>
      <p class="resource-category">${escapeHTML(categoryLabels[resource.category])}</p>
      <a href="${resource.url}" target="_blank" rel="noopener noreferrer">
        Visit resource <i class="fa-solid fa-arrow-up-right-from-square"></i>
      </a>
    </article>
  `).join("");
}

$("#resourceFilters").addEventListener("click", event => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;

  resourceFilter = button.dataset.filter;

  $$("#resourceFilters .filter-btn").forEach(item => {
    item.classList.toggle("active", item === button);
  });

  renderResources();
});

/* =========================================
   POINTS, CHALLENGES AND BADGES
========================================= */

function totalPoints() {
  return Object.values(state.scores).reduce((sum, score) => sum + score, 0);
}

function totalSolved() {
  return state.solvedChallenges.length;
}

function getBadges() {
  const solved = totalSolved();
  const tasks = state.completedTasks.length;

  return [
    {
      title: "First Step",
      description: "Complete your first roadmap task.",
      icon: "fa-shoe-prints",
      unlocked: tasks >= 1
    },
    {
      title: "Task Taker",
      description: "Complete 5 learning tasks.",
      icon: "fa-list-check",
      unlocked: tasks >= 5
    },
    {
      title: "Code Starter",
      description: "Solve your first coding challenge.",
      icon: "fa-code",
      unlocked: solved >= 1
    },
    {
      title: "Problem Solver",
      description: "Solve 5 unique challenges.",
      icon: "fa-brain",
      unlocked: solved >= 5
    },
    {
      title: "Point Collector",
      description: "Earn 100 points.",
      icon: "fa-star",
      unlocked: totalPoints() >= 100
    },
    {
      title: "Learning Legend",
      description: "Complete 20 roadmap tasks.",
      icon: "fa-trophy",
      unlocked: tasks >= 20
    }
  ];
}

function renderBadges() {
  $("#badgeGrid").innerHTML = getBadges().map(badge => `
    <div class="badge-item ${badge.unlocked ? "unlocked" : ""}">
      <i class="fa-solid ${badge.icon}"></i>
      <h4>${escapeHTML(badge.title)}</h4>
      <p>${escapeHTML(badge.description)}</p>
      <p>${badge.unlocked ? "Unlocked" : "Locked"}</p>
    </div>
  `).join("");
}

function renderProgress() {
  const tasks = state.completedTasks.length;
  const solved = totalSolved();
  const points = totalPoints();
  const badges = getBadges().filter(badge => badge.unlocked).length;

  setText("#progressTasks", tasks);
  setText("#progressCoding", solved);
  setText("#progressPoints", points);
  setText("#progressBadges", badges);

  $("#allRoadmapProgress").innerHTML = Object.entries(tracks).map(([key, track]) => {
    const progress = trackProgress(key);

    return `
      <div class="breakdown-item">
        <div class="breakdown-top">
          <span>${escapeHTML(track.name)}</span>
          <span>${progress.percent}%</span>
        </div>
        <div class="progress-track"><span style="width:${progress.percent}%"></span></div>
        <p class="muted">${progress.completed} of ${progress.total} tasks completed</p>
      </div>
    `;
  }).join("");

  renderBadges();
}

function renderDashboard() {
  setText("#dashTasks", state.completedTasks.length);
  setText("#dashCoding", totalSolved());
  setText("#dashPoints", totalPoints());
  setText("#dashBadges", getBadges().filter(badge => badge.unlocked).length);

  const key = tracks[state.selectedSkill] ? state.selectedSkill : "tech";
  const track = tracks[key];
  const progress = trackProgress(key);

  $("#dashboardRoadmap").innerHTML = `
    <div class="stage-heading">
      <div class="stage-number"><i class="fa-solid ${track.icon}"></i></div>
      <div>
        <h3>${escapeHTML(track.name)}</h3>
        <p>${escapeHTML(track.description)}</p>
      </div>
    </div>
    <div class="progress-label">
      <span>${progress.completed} of ${progress.total} tasks completed</span>
      <strong>${progress.percent}%</strong>
    </div>
    <div class="progress-track"><span style="width:${progress.percent}%"></span></div>
    <button class="btn btn-primary" style="margin-top:18px" data-go="roadmap">
      Continue Learning <i class="fa-solid fa-arrow-right"></i>
    </button>
  `;
}

/* =========================================
   CODING ARENA CHALLENGES
========================================= */

const challenges = {
  coding: [
    {
      id: "hello",
      difficulty: "beginner",
      language: "javascript",
      title: "Print Hello World",
      description: "Write a JavaScript statement that prints Hello World to the console.",
      starter: "// Write your code here\n",
      hint: "JavaScript has a built-in function for printing messages to the console.",
      checks: [
        { label: "Uses console.log", pattern: /console\s*\.\s*log\s*\(/ },
        { label: "Contains Hello World", pattern: /Hello World/ }
      ],
      explanation: "console.log('Hello World') sends the message to the console."
    },
    {
      id: "sum",
      difficulty: "beginner",
      language: "javascript",
      title: "Add Two Numbers",
      description: "Create a function named addNumbers that returns the sum of a and b.",
      starter: "function addNumbers(a, b) {\n  // Return the sum\n}\n",
      hint: "Use the return keyword and the + operator.",
      checks: [
        { label: "Defines addNumbers", pattern: /function\s+addNumbers\s*\(/ },
        { label: "Returns an expression", pattern: /return\s+[^;}\n]+/ },
        { label: "Uses the addition operator", pattern: /return\s+.*\+/ }
      ],
      explanation: "A valid solution returns a + b from the addNumbers function."
    },
    {
      id: "even",
      difficulty: "beginner",
      language: "javascript",
      title: "Check an Even Number",
      description: "Write a function named isEven that returns true when n is even.",
      starter: "function isEven(n) {\n  // Complete this function\n}\n",
      hint: "The remainder operator (%) can tell you whether a number is divisible by two.",
      checks: [
        { label: "Defines isEven", pattern: /function\s+isEven\s*\(/ },
        { label: "Uses the remainder operator", pattern: /%/ },
        { label: "Checks divisibility by 2", pattern: /%\s*2/ },
        { label: "Returns a result", pattern: /return\s+/ }
      ],
      explanation: "An even integer has a remainder of zero when divided by two."
    },
    {
      id: "factorial",
      difficulty: "intermediate",
      language: "javascript",
      title: "Calculate a Factorial",
      description: "Write a factorial function using a loop or recursion. Assume n is a non-negative integer.",
      starter: "function factorial(n) {\n  // Complete the function\n}\n",
      hint: "Remember that 0! is 1. A loop can multiply all integers from 1 through n.",
      checks: [
        { label: "Defines factorial", pattern: /function\s+factorial\s*\(/ },
        { label: "Handles the base case", pattern: /return\s+1/ },
        { label: "Uses iteration or recursion", pattern: /\b(for|while)\b|factorial\s*\(/ },
        { label: "Multiplies values", pattern: /\*=|\*[^=]/ }
      ],
      explanation: "A factorial multiplies the positive integers up to n, with 0! equal to 1."
    },
    {
      id: "palindrome",
      difficulty: "intermediate",
      language: "javascript",
      title: "Palindrome Checker",
      description: "Create a function isPalindrome that checks whether a string reads the same backwards. Assume the input is lowercase text.",
      starter: "function isPalindrome(text) {\n  // Complete this function\n}\n",
      hint: "Compare the string with a reversed version of itself.",
      checks: [
        { label: "Defines isPalindrome", pattern: /function\s+isPalindrome\s*\(/ },
        { label: "Creates or uses a reversed string", pattern: /\.reverse\s*\(|split\s*\(\s*['"]{2}\s*\)/ },
        { label: "Returns a comparison or Boolean", pattern: /return\s+/ }
      ],
      explanation: "A palindrome matches its reversed string."
    },
    {
      id: "dedupe",
      difficulty: "advanced",
      language: "javascript",
      title: "Remove Duplicate Values",
      description: "Create a function uniqueValues that returns an array containing each original value once.",
      starter: "function uniqueValues(items) {\n  // Return an array with no duplicates\n}\n",
      hint: "Consider using JavaScript's Set to keep unique values.",
      checks: [
        { label: "Defines uniqueValues", pattern: /function\s+uniqueValues\s*\(/ },
        { label: "Uses Set or another deduplication method", pattern: /\bSet\b|filter\s*\(/ },
        { label: "Returns a result", pattern: /return\s+/ }
      ],
      explanation: "A Set stores unique values; Array.from or the spread operator can convert it back to an array."
    }
  ],

  bug: [
    {
      id: "bug-equals",
      difficulty: "beginner",
      language: "javascript",
      title: "Fix the Comparison Bug",
      description: "The function should return true when a equals b, but the comparison is incorrect. Fix the code.",
      starter: "function isSame(a, b) {\n  return a = b;\n}\n",
      hint: "Assignment and comparison are different operations in JavaScript.",
      checks: [
        { label: "Defines isSame", pattern: /function\s+isSame\s*\(/ },
        { label: "Uses equality comparison", pattern: /return\s+.*(?:===|==)/ },
        { label: "Does not assign in the return expression", pattern: /return\s+[^;\n]*=(?!=)/, reject: true }
      ],
      explanation: "Use a comparison operator such as === rather than assignment =."
    },
    {
      id: "bug-loop",
      difficulty: "intermediate",
      language: "javascript",
      title: "Fix the Loop",
      description: "The loop should print numbers 0 through 4 and then stop. Correct the loop condition.",
      starter: "for (let i = 0; i <= 5; i++) {\n  console.log(i);\n}\n",
      hint: "The last number should be 4, so check the loop's upper boundary.",
      checks: [
        { label: "Uses a for loop", pattern: /for\s*\(/ },
        { label: "Starts at zero", pattern: /let\s+i\s*=\s*0/ },
        { label: "Stops before 5", pattern: /i\s*<\s*5/ },
        { label: "Increments i", pattern: /i\+\+|\+\+i|i\s*\+=\s*1/ }
      ],
      explanation: "Using i < 5 stops the loop before i reaches 5."
    },
    {
      id: "bug-html",
      difficulty: "beginner",
      language: "html",
      title: "Fix the HTML Tag",
      description: "Correct the paragraph markup so the paragraph opens and closes properly.",
      starter: "<p>Hello students<p>\n",
      hint: "An HTML closing tag uses a forward slash before the tag name.",
      checks: [
        { label: "Has an opening paragraph tag", pattern: /<p>/i },
        { label: "Has a closing paragraph tag", pattern: /<\/p>/i }
      ],
      explanation: "The paragraph should be written as <p>Hello students</p>."
    }
  ],

  detective: [
    {
      id: "detective-one",
      difficulty: "beginner",
      title: "Predict the Output",
      description: "What does this JavaScript code print?",
      snippet: "let x = 5;\nconsole.log(x + 3);",
      hint: "The + operator adds the two numeric values.",
      options: ["2", "8", "15", "53"],
      correct: "8",
      explanation: "5 + 3 equals 8."
    },
    {
      id: "detective-two",
      difficulty: "beginner",
      title: "Follow the Variable",
      description: "What is printed by this code?",
      snippet: "let score = 10;\nscore = score + 2;\nconsole.log(score);",
      hint: "The second line updates the existing variable.",
      options: ["10", "12", "2", "102"],
      correct: "12",
      explanation: "The original value 10 increases by 2, giving 12."
    },
    {
      id: "detective-three",
      difficulty: "intermediate",
      title: "Understand a Loop",
      description: "How many times does the message print?",
      snippet: "for (let i = 0; i < 3; i++) {\n  console.log('Hi');\n}",
      hint: "The loop starts at zero and stops before i reaches 3.",
      options: ["2 times", "3 times", "4 times", "0 times"],
      correct: "3 times",
      explanation: "The loop runs for i = 0, 1, and 2."
    },
    {
      id: "detective-four",
      difficulty: "advanced",
      title: "Array Indexing",
      description: "What is printed by this JavaScript code?",
      snippet: "const colors = ['red', 'blue', 'green'];\nconsole.log(colors[1]);",
      hint: "JavaScript arrays use zero-based indexing.",
      options: ["red", "blue", "green", "undefined"],
      correct: "blue",
      explanation: "Index 0 is red and index 1 is blue."
    }
  ],

  logic: [
    {
      id: "logic-one",
      difficulty: "beginner",
      title: "Number Pattern",
      description: "Which number comes next in this sequence: 2, 4, 6, 8, ...?",
      hint: "Look at the difference between consecutive numbers.",
      options: ["9", "10", "11", "12"],
      correct: "10",
      explanation: "Each number increases by 2."
    },
    {
      id: "logic-two",
      difficulty: "beginner",
      title: "Count the Steps",
      description: "A program adds 3 five times, starting from zero. What is the final total?",
      hint: "Repeated addition can be calculated as multiplication.",
      options: ["8", "12", "15", "18"],
      correct: "15",
      explanation: "Five additions of 3 give 3 × 5 = 15."
    },
    {
      id: "logic-three",
      difficulty: "intermediate",
      title: "Find the Odd One Out",
      description: "Which value is not a multiple of 3?",
      hint: "A multiple of 3 can be divided by 3 with no remainder.",
      options: ["12", "18", "21", "22"],
      correct: "22",
      explanation: "22 divided by 3 leaves a remainder."
    },
    {
      id: "logic-four",
      difficulty: "advanced",
      title: "Binary Thinking",
      description: "What is the decimal value of the binary number 1010?",
      hint: "Binary place values from right to left are 1, 2, 4, 8, and so on.",
      options: ["8", "9", "10", "12"],
      correct: "10",
      explanation: "1010 in binary equals 8 + 2, which is 10."
    }
  ],

  project: [
    {
      id: "project-portfolio",
      difficulty: "beginner",
      title: "Build a Personal Portfolio",
      description: "Plan a simple portfolio website with an introduction, skills, projects, and contact details.",
      hint: "Start with semantic HTML, then style each section with CSS.",
      steps: [
        "Create a header and introduction.",
        "Add a section listing your skills.",
        "Show at least one project card.",
        "Add a contact section.",
        "Check that the page works on mobile."
      ],
      explanation: "A portfolio is a useful way to present your learning and projects."
    },
    {
      id: "project-quiz",
      difficulty: "intermediate",
      title: "Build a Quiz App",
      description: "Plan a quiz with multiple-choice questions, answer feedback, and a final score.",
      hint: "Store questions and answers in an array of objects.",
      steps: [
        "Create a question display.",
        "Add four answer buttons.",
        "Check whether the selected answer is correct.",
        "Keep track of the score.",
        "Display a final result."
      ],
      explanation: "This project combines HTML structure, CSS styling, and JavaScript logic."
    },
    {
      id: "project-todo",
      difficulty: "advanced",
      title: "Build a To-Do List",
      description: "Plan an app where users add tasks, mark them complete, and remove them.",
      hint: "Use DOM methods to create task elements and event listeners for actions.",
      steps: [
        "Create an input field and Add Task button.",
        "Display each task in a list.",
        "Allow tasks to be marked complete.",
        "Add a remove button for each task.",
        "Save the task list using localStorage."
      ],
      explanation: "A to-do list is a practical project for learning DOM manipulation and browser storage."
    }
  ]
};

let currentChallenge = null;
let currentChallengeId = null;

function challengeList() {
  if (activeMode === "coding") return challenges.coding;
  if (activeMode === "bug") return challenges.bug;
  if (activeMode === "detective") return challenges.detective;
  if (activeMode === "logic") return challenges.logic;
  return challenges.project;
}

function filteredChallenges() {
  return challengeList().filter(challenge =>
    challenge.difficulty === $("#difficultySelect").value
  );
}

function renderChallengeOptions(preferredId) {
  const select = $("#challengeSelect");
  const filtered = filteredChallenges();

  if (!filtered.length) {
    select.innerHTML = `<option value="">No challenges at this level</option>`;
    currentChallenge = null;
    renderCurrentChallenge();
    return;
  }

  select.innerHTML = filtered.map(challenge => `
    <option value="${challenge.id}">${escapeHTML(challenge.title)}</option>
  `).join("");

  const chosen = filtered.find(challenge => challenge.id === preferredId);
  select.value = chosen ? chosen.id : filtered[0].id;
  currentChallenge = filtered.find(challenge => challenge.id === select.value);
  currentChallengeId = currentChallenge?.id || null;

  renderCurrentChallenge();
}

function setMode(mode) {
  activeMode = mode;

  $$("#arenaTabs .arena-tab").forEach(button => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });

  $("#challengeType").textContent = {
    coding: "CODING TEST",
    bug: "BUG HUNTER",
    detective: "CODE DETECTIVE",
    logic: "LOGIC BATTLE",
    project: "PROJECT LAB"
  }[mode];

  $("#showHint").classList.remove("hidden");
  $("#hintText").classList.add("hidden");

  renderChallengeOptions();
}

$("#arenaTabs").addEventListener("click", event => {
  const button = event.target.closest("[data-mode]");
  if (button) setMode(button.dataset.mode);
});

$("#difficultySelect").addEventListener("change", () => {
  renderChallengeOptions();
});

$("#challengeSelect").addEventListener("change", () => {
  const selected = challengeList().find(challenge =>
    challenge.id === $("#challengeSelect").value
  );
  currentChallenge = selected || null;
  currentChallengeId = selected?.id || null;
  renderCurrentChallenge();
});

$("#newChallenge").addEventListener("click", () => {
  const available = filteredChallenges();

  if (!available.length) {
    showToast("No challenges are available at this difficulty yet.");
    return;
  }

  const other = available.filter(challenge => challenge.id !== currentChallengeId);
  const choices = other.length ? other : available;
  const selected = choices[Math.floor(Math.random() * choices.length)];

  $("#challengeSelect").value = selected.id;
  currentChallenge = selected;
  currentChallengeId = selected.id;
  renderCurrentChallenge();
});

function renderCurrentChallenge() {
  const challenge = currentChallenge;

  $("#hintText").classList.add("hidden");
  setText("#outputStatus", "Waiting for submission");
  setText("#outputText", "Choose a challenge and submit your answer to see feedback.");

  if (!challenge) {
    setText("#challengeTitle", "No challenge available");
    setText("#challengeDescription", "Try another difficulty level.");
    $("#challengeDetails").innerHTML = "";
    $("#challengeAnswer").innerHTML = "";
    $("#codeEditor").value = "";
    return;
  }

  setText("#challengeTitle", challenge.title);
  setText("#challengeDescription", challenge.description);
  setText("#challengeDifficulty", challenge.difficulty.toUpperCase());

  $("#challengeDetails").innerHTML = `
    <div class="challenge-details">
      ${challenge.snippet ? `
        <div class="detail-box">
          <strong>Code to inspect</strong>
          <pre>${escapeHTML(challenge.snippet)}</pre>
        </div>
      ` : ""}
      ${challenge.steps ? `
        <div class="detail-box">
          <strong>Project checklist</strong>
          <pre>${escapeHTML(challenge.steps.map((step, i) => `${i + 1}. ${step}`).join("\n"))}</pre>
        </div>
      ` : ""}
      <div class="detail-box">
        <strong>How to approach it</strong>
        <pre>Read the requirements carefully, try your own solution, then check your answer.</pre>
      </div>
    </div>
  `;

  $("#hintText").textContent = challenge.hint;
  $("#codeEditor").value = challenge.starter || getStarterCode(challenge);
  $("#languageSelect").value = challenge.language || "javascript";

  if (activeMode === "detective" || activeMode === "logic") {
    $("#challengeAnswer").innerHTML = `
      <label>Select your answer</label>
      <div class="answer-options">
        ${challenge.options.map((option, index) => `
          <label class="answer-option">
            <input type="radio" name="arenaAnswer" value="${escapeHTML(option)}">
            <span>${String.fromCharCode(65 + index)}. ${escapeHTML(option)}</span>
          </label>
        `).join("")}
      </div>
    `;
  } else if (activeMode === "project") {
    $("#challengeAnswer").innerHTML = `
      <label>Project checklist</label>
      <p class="muted">Use this checklist to plan your project. Mark it complete once you have built and tested your work.</p>
      <div class="answer-options">
        ${challenge.steps.map((step, index) => `
          <label class="answer-option">
            <input type="checkbox" class="project-step" value="${index}">
            <span>${escapeHTML(step)}</span>
          </label>
        `).join("")}
      </div>
    `;
  } else {
    $("#challengeAnswer").innerHTML = `
      <label for="submissionNote">Optional explanation of your solution</label>
      <textarea id="submissionNote" rows="2" placeholder="Explain your approach..."></textarea>
    `;
  }
}

function getStarterCode(challenge) {
  if (activeMode === "detective" || activeMode === "logic") {
    return "// First, predict the answer.\n// This challenge checks your reasoning, not code execution.\n";
  }

  if (activeMode === "project") {
    return `<!-- ${challenge.title} -->\n<!-- Start your project here. -->\n`;
  }

  return "// Try solving the challenge here.\n";
}

$("#showHint").addEventListener("click", () => {
  $("#hintText").classList.toggle("hidden");
});

$("#resetEditor").addEventListener("click", () => {
  if (!currentChallenge) return;

  $("#codeEditor").value = currentChallenge.starter || getStarterCode(currentChallenge);
  setText("#outputStatus", "Editor reset");
  setText("#outputText", "Your editor has been reset. Your saved scores have not changed.");
});

/* =========================================
   CHECK ANSWERS SAFELY
   These are predefined checks, not execution.
========================================= */

function validateCode(challenge, code) {
  const results = challenge.checks.map(check => {
    const matches = check.pattern.test(code);
    const passed = check.reject ? !matches : matches;

    return {
      label: check.label,
      passed
    };
  });

  return {
    passed: results.every(result => result.passed),
    results
  };
}

function checkChallenge() {
  const challenge = currentChallenge;

  if (!challenge) {
    showToast("Choose a challenge first.");
    return;
  }

  let correct = false;
  let feedback = "";
  let details = "";

  if (activeMode === "detective" || activeMode === "logic") {
    const answer = $('input[name="arenaAnswer"]:checked');

    if (!answer) {
      showToast("Please select an answer first.");
      return;
    }

    correct = answer.value === challenge.correct;
    feedback = correct
      ? `Correct! ${challenge.explanation}`
      : `Not quite. ${challenge.explanation}`;

    details = `Your answer: ${answer.value}\nExpected answer: ${challenge.correct}`;
  } else if (activeMode === "project") {
    const checkboxes = $$(".project-step");
    const completed = checkboxes.filter(input => input.checked).length;

    if (completed < challenge.steps.length) {
      showToast(`Complete all ${challenge.steps.length} checklist items before marking this project complete.`);
      return;
    }

    correct = true;
    feedback = "Project checklist completed! Remember to build and test the actual project.";
    details = `${completed} of ${challenge.steps.length} project steps checked.`;
  } else {
    const code = $("#codeEditor").value;

    if (!code.trim()) {
      showToast("Write your solution before checking it.");
      return;
    }

    const validation = validateCode(challenge, code);
    correct = validation.passed;

    feedback = correct
      ? `All predefined checks passed. ${challenge.explanation}`
      : "Some predefined checks did not pass. Review the checklist below and improve your solution.";

    details = validation.results.map(result =>
      `${result.passed ? "[PASS]" : "[NEEDS WORK]"} ${result.label}`
    ).join("\n");

    details += "\n\nNote: These checks inspect code patterns. They do not execute your code or prove that it works for every input.";
  }

  if (correct) {
    const scoreKey = challenge.id;

    if (!state.solvedChallenges.includes(scoreKey)) {
      state.solvedChallenges.push(scoreKey);
      state.scores[scoreKey] = 20;
      saveState();
      showToast("Challenge solved! +20 points earned.");
    } else {
      showToast("Correct! You have already earned points for this challenge.");
    }

    setText("#outputStatus", "PASSED");
  } else {
    setText("#outputStatus", "TRY AGAIN");
    showToast("Keep going! Review the feedback and try again.");
  }

  setText("#outputText", `${feedback}\n\n${details}`);
  renderArena();
  renderDashboard();
  renderProgress();
}

$("#runChallenge").addEventListener("click", checkChallenge);

function renderArena() {
  setText("#arenaSolved", totalSolved());
  setText("#arenaScore", totalPoints());
  setText("#arenaStreak", totalSolved());
}

/* =========================================
   DAILY CHALLENGE
========================================= */

$("#dailyChallenge").addEventListener("click", () => {
  const day = Math.floor(Date.now() / 86400000);
  const dailyModes = [
    { mode: "coding", id: "hello" },
    { mode: "detective", id: "detective-one" },
    { mode: "logic", id: "logic-one" },
    { mode: "bug", id: "bug-equals" }
  ];

  const chosen = dailyModes[day % dailyModes.length];

  setMode(chosen.mode);

  const matching = challengeList().find(challenge => challenge.id === chosen.id);

  if (matching) {
    $("#difficultySelect").value = matching.difficulty;
    renderChallengeOptions(matching.id);
  }

  showToast("Today's featured practice challenge is ready!");
});

/* =========================================
   RESET AND REFRESH
========================================= */

$("#resetProgress").addEventListener("click", () => {
  const confirmed = window.confirm(
    "Reset all SkillTech progress saved in this browser? This action cannot be undone."
  );

  if (!confirmed) return;

  state = {
    ...defaultState,
    completedTasks: [],
    solvedChallenges: [],
    scores: {},
    quizResult: null
  };

  saveState();

  $("#skillQuiz").reset();
  $("#quizResult").classList.add("hidden");
  updateQuizProgress();

  renderDashboard();
  renderRoadmap();
  renderProgress();
  renderArena();

  showToast("Your local learning progress has been reset.");
});

/* =========================================
   GLOBAL EVENT HANDLERS
========================================= */

document.addEventListener("change", event => {
  const taskInput = event.target.closest("[data-task]");

  if (taskInput) {
    const taskId = taskInput.dataset.task;

    if (taskInput.checked) {
      if (!state.completedTasks.includes(taskId)) {
        state.completedTasks.push(taskId);
      }
    } else {
      state.completedTasks = state.completedTasks.filter(id => id !== taskId);
    }

    saveState();
    renderRoadmap();
    renderDashboard();
    renderProgress();
    showToast(taskInput.checked ? "Task completed!" : "Task marked incomplete.");
  }
});

$("#languageSelect").addEventListener("change", () => {
  const language = $("#languageSelect").value;
  const templates = {
    javascript: "// JavaScript practice\n",
    python: "# Python practice\n",
    html: "<!-- HTML practice -->\n",
    css: "/* CSS practice */\n"
  };

  $("#codeEditor").value = templates[language];
  showToast(`Editor language set to ${language}. No code was executed.`);
});

/* =========================================
   INITIALIZE THE WEBSITE
========================================= */

function init() {
  renderResources();
  renderRoadmapSelect();

  $("#roadmapSelect").value = tracks[state.selectedSkill]
    ? state.selectedSkill
    : "tech";

  renderRoadmap();
  renderDashboard();
  renderProgress();

  setMode("coding");
  renderArena();
  updateQuizProgress();
}

init();