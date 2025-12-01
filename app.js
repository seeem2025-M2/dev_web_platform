/* MasterSeeem PRO - Plateforme collaborative Master SEEEM TIM */
(() => {
  const root = document.getElementById('view-root');
  const modalRoot = document.getElementById('modal-root');
  const yr = document.getElementById('yr'); 
  const mainNavbar = document.getElementById('main-navbar');
  const mainFooter = document.getElementById('main-footer');
  
  yr.textContent = new Date().getFullYear();

  /* ====== Configuration ====== */
  const CONFIG = {
    CONTACT_EMAIL: 'seeem2025@gmail.com',
    STUDENTS: ['Yassine', 'Tarek', 'Ghassen', 'Malek', 'Mayssa', 'Amina', 'Sara', 'Khaled', 'Mohamed', 'Fatma', 'Imen', 'Rania'],
    RESOURCE_TYPES: {
      'cours': { label: 'Cours', icon: '📚', color: 'badge-cours' },
      'td': { label: 'TD', icon: '📝', color: 'badge-td' },
      'tp': { label: 'TP', icon: '🔬', color: 'badge-tp' },
      'examen': { label: 'Examen', icon: '📋', color: 'badge-exam' },
      'resume': { label: 'Résumé', icon: '📖', color: 'badge-resume' }
    },
    PRICING: {
      MONTHLY: 16.5,
      ANNUAL: 159
    }
  };

  /* ====== Curriculum Data ====== */
let curriculum = {};

async function loadCurriculum() {
  const res = await fetch('http://localhost:3000/curriculum');
  curriculum = await res.json();
  renderCurriculum(curriculum); // your existing function that renders the curriculum
}

loadCurriculum();

/* ====== Resources from Database ====== */
let resources = []; // global array

async function loadResources(ue_code = null) {
  try {
    // Build the correct URL based on whether a UE code is provided
    const url = ue_code 
      ? `http://localhost:3000/api/resources/${ue_code}`
      : 'http://localhost:3000/api/resources'; // optional: you could create a backend endpoint to fetch all

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch resources');
    
    const data = await response.json();
    resources = data; // set global array

    if (currentRoute) views[currentRoute]?.(); // render current view if already set
    return resources;
  } catch (e) {
    console.error('Error loading resources from DB:', e);
    resources = []; // fallback to empty array
    return resources;
  }
}


/* ====== User Management (unchanged) ====== */
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('ms_user_v5'));
  } catch(e) {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem('ms_user_v5', JSON.stringify(user));
  updateUserUI();
}

function clearUser() {
  localStorage.removeItem('ms_user_v5');
  updateUserUI();
}

function updateUserUI() {
  const user = getCurrentUser();
  const userSection = document.getElementById('user-section');
  
  if (user) {
    document.getElementById('user-name').textContent = `${user.firstName} ${user.lastName} ${user.isAlumni ? '(Alumni)' : ''}`;
    mainNavbar.style.display = 'block';
    mainFooter.style.display = 'block';
  } else {
    mainNavbar.style.display = 'none';
    mainFooter.style.display = 'none';
  }
}

/* ====== Routing (unchanged) ====== */
let currentRoute = 'auth';
let routeParams = {};

const views = {
  auth: renderAuth,
  home: renderHome,
  resources: renderResources,
  m1: renderM1,
  m2: renderM2,
  m1semester: renderM1Semester,
  m2semester: renderM2Semester,
  pfe: renderPFE,
  companies: renderCompanies,
  forum: renderForum
};

function setRoute(route, params = {}) {
  currentRoute = route;
  routeParams = params;
  
  const protectedRoutes = ['home', 'resources', 'm1', 'm2', 'm1semester', 'm2semester', 'pfe', 'companies', 'forum'];
  
  if (protectedRoutes.includes(route) && !getCurrentUser()) {
    showNotification('Veuillez vous connecter pour accéder à cette page', 'warning');
    return renderAuth();
  }

  const fn = views[route] || views.auth;
  window.history.pushState({route, params}, '', `#${route}`);
  fn();
  highlightNav(route);
}

function highlightNav(route) {
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.getAttribute('data-route') === route);
  });
}

/* ====== Initialize resources from DB ====== */
loadResources(); // fetch data on page load


  /* ====== Initialization ====== */
  function init() {
    document.querySelectorAll('[data-route]').forEach(a => {
      a.addEventListener('click', () => setRoute(a.getAttribute('data-route')));
    });
    
    document.getElementById('nav-home').addEventListener('click', () => setRoute('home'));
    document.getElementById('btn-logout-nav').addEventListener('click', logout);

    const darkToggle = document.getElementById('dark-toggle');
    const savedDark = localStorage.getItem('ms_dark') === '1';
    setDarkMode(savedDark);
    darkToggle.addEventListener('click', () => setDarkMode(!document.documentElement.classList.contains('dark')));

    window.addEventListener('popstate', (e) => {
      const route = (location.hash && location.hash.slice(1)) || 'auth';
      setRoute(route);
    });

    const user = getCurrentUser();
    const route = (location.hash && location.hash.slice(1)) || (user ? 'home' : 'auth');
    setRoute(route);
    updateUserUI();
  }

  function setDarkMode(enable) {
    if (enable) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ms_dark', '1');
      document.getElementById('dark-toggle').textContent = '☀️';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ms_dark', '0');
      document.getElementById('dark-toggle').textContent = '🌙';
    }
  }

  function logout() {
    clearUser();
    showNotification('Déconnexion réussie', 'success');
    setRoute('auth');
  }

  /* ====== Render Functions ====== */
  function renderAuth() {
    root.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="font-size: 3rem; margin-bottom: 16px;">🎓</div>
            <h1 style="margin: 0 0 8px 0; color: var(--text);">MasterSeeem</h1>
            <p style="color: var(--muted); margin: 0;">Plateforme collaborative Master SEEEM TIM</p>
          </div>

          <div class="auth-tabs">
            <div class="auth-tab active" id="tab-login">Connexion</div>
            <div class="auth-tab" id="tab-signup">Inscription</div>
          </div>

          <form id="login-form" style="display: block;">
            <div style="margin-bottom: 16px;">
              <input name="email" type="email" placeholder="Adresse email" class="input" required style="width: 100%;" />
            </div>
            <div style="margin-bottom: 16px;">
              <input name="password" type="password" placeholder="Mot de passe" class="input" required style="width: 100%;" />
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text);">
                <input type="checkbox" name="remember" />
                Se souvenir de moi
              </label>
              <a href="#" id="forgot-password" style="font-size: 14px; color: var(--primary);">Mot de passe oublié ?</a>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-sign-in-alt"></i> Se connecter
            </button>
          </form>

          <form id="signup-form" style="display: none;">
            <div style="margin-bottom: 16px;">
              <input name="firstName" placeholder="Prénom" class="input" required style="width: 100%;" />
            </div>
            <div style="margin-bottom: 16px;">
              <input name="lastName" placeholder="Nom" class="input" required style="width: 100%;" />
            </div>
            
            <div style="margin-bottom: 16px;">
              <input name="email" type="email" placeholder="Adresse email universitaire" class="input" required style="width: 100%;" id="signup-email" />
            </div>
            
            <div style="margin-bottom: 16px;">
              <select name="year" class="select" required style="width: 100%;" id="year-select">
                <option value="">Niveau d'étude</option>
                <option value="M1">Master 1</option>
                <option value="M2">Master 2</option>
                <option value="Alumni">Ancien étudiant</option>
              </select>
            </div>
            
            <div style="margin-bottom: 16px;">
              <input name="studentId" placeholder="Numéro étudiant" class="input" style="width: 100%;" id="student-id" />
            </div>
            
            <div style="margin-bottom: 16px;">
              <input name="password" type="password" placeholder="Mot de passe" class="input" required style="width: 100%;" />
            </div>
            <div style="margin-bottom: 16px;">
              <input name="confirmPassword" type="password" placeholder="Confirmer le mot de passe" class="input" required style="width: 100%;" />
            </div>
            
            <div style="margin-bottom: 20px;">
              <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text);">
                <input type="checkbox" name="terms" required />
                J'accepte les conditions d'utilisation
              </label>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-user-plus"></i> Créer mon compte
            </button>
          </form>
        </div>
      </div>
    `;

    // Gestion du changement de niveau d'étude pour mettre à jour le placeholder de l'email
    document.getElementById('year-select').addEventListener('change', function() {
      const emailInput = document.getElementById('signup-email');
      const studentIdInput = document.getElementById('student-id');
      
      if (this.value === 'Alumni') {
        emailInput.placeholder = 'Adresse email personnelle';
        studentIdInput.placeholder = 'Numéro étudiant (optionnel)';
      } else {
        emailInput.placeholder = 'Adresse email universitaire';
        studentIdInput.placeholder = 'Numéro étudiant';
      }
    });

    document.getElementById('tab-login').addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
      document.getElementById('tab-login').classList.add('active');
      document.getElementById('login-form').style.display = 'block';
      document.getElementById('signup-form').style.display = 'none';
    });

    document.getElementById('tab-signup').addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
      document.getElementById('tab-signup').classList.add('active');
      document.getElementById('login-form').style.display = 'none';
      document.getElementById('signup-form').style.display = 'block';
    });

    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);
    document.getElementById('forgot-password').addEventListener('click', (e) => {
      e.preventDefault();
      openForgotPasswordModal();
    });
  }""

  function renderHome() {
    const user = getCurrentUser();
    
    root.innerHTML = `
      <section class="hero">
        <div class="hero-left">
          <h1>Bienvenue sur MasterSeeem, ${user.firstName} !</h1>
          <p>Plateforme collaborative dédiée aux étudiants du Master SEEEM - Parcours TIM. Partagez, collaborez et excellez ensemble.</p>
          <div class="hero-ctas">
            <button class="btn btn-primary" id="go-resources">
              <i class="fas fa-folder-open"></i> Explorer les ressources
            </button>
            <button class="btn btn-success" id="go-forum">
              <i class="fas fa-comments"></i> Accéder au forum
            </button>
            ${user.isAlumni ? `
              <button class="btn btn-warning" id="go-upload" style="background: var(--warning); color: white;">
                <i class="fas fa-upload"></i> Uploader des ressources
              </button>
            ` : ''}
          </div>
          
          <div class="hero-grid">
            <div class="small-card">
              <div style="font-size: 2rem; margin-bottom: 8px;">📚</div>
              <div style="font-weight: 600;">Ressources M1/M2</div>
              <div style="font-size: 14px; color: var(--muted); margin-top: 4px;">Cours, TD, TP, Examens</div>
            </div>
            <div class="small-card">
              <div style="font-size: 2rem; margin-bottom: 8px;">🎓</div>
              <div style="font-weight: 600;">Mémoires PFE</div>
              <div style="font-size: 14px; color: var(--muted); margin-top: 4px;">Rapports et templates</div>
            </div>
            <div class="small-card">
              <div style="font-size: 2rem; margin-bottom: 8px;">💼</div>
              <div style="font-weight: 600;">Entreprises</div>
              <div style="font-size: 14px; color: var(--muted); margin-top: 4px;">Contacts et opportunités</div>
            </div>
            <div class="small-card">
              <div style="font-size: 2rem; margin-bottom: 8px;">💬</div>
              <div style="font-weight: 600;">Forum & Chat</div>
              <div style="font-size: 14px; color: var(--muted); margin-top: 4px;">Échangez avec la communauté</div>
            </div>
          </div>
        </div>
        <div>
          <img class="hero-ill" alt="Étudiants en électronique" src="assets/hero.jpg" />
        </div>
      </section>

      <section class="section">
        <h2>Ressources Récentes</h2>
        <div class="grid-res" id="recent-grid">
          <div class="loading"><div class="spinner"></div></div>
        </div>
      </section>
    `;

    setTimeout(() => {
      const recentResources = resources.slice(0, 4);
      document.getElementById('recent-grid').innerHTML = recentResources.map(r => resourceCardHtml(r)).join('');
      attachResourceButtons();
    }, 500);

    document.getElementById('go-resources').addEventListener('click', () => setRoute('resources'));
    document.getElementById('go-forum').addEventListener('click', () => setRoute('forum'));
    
    if (user.isAlumni) {
      document.getElementById('go-upload').addEventListener('click', () => {
        openUploadModal();
      });
    }
  }

  function renderResources() {
    root.innerHTML = `
      <section>
        <h2>Ressources Pédagogiques</h2>
        <p style="color: var(--muted); margin-bottom: 24px;">Accédez à l'ensemble des ressources classées par niveau et type</p>

        <div class="category-nav">
          <button class="category-btn active" data-category="m1">
            <i class="fas fa-graduation-cap"></i> Master 1
          </button>
          <button class="category-btn" data-category="m2">
            <i class="fas fa-graduation-cap"></i> Master 2
          </button>
          <button class="category-btn" data-category="pfe">
            <i class="fas fa-book"></i> Mémoires PFE
          </button>
          <button class="category-btn" data-category="companies">
            <i class="fas fa-building"></i> Liste Sociétés
          </button>
        </div>

        <div id="resources-content">
          <div class="resource-types-grid">
            <div class="resource-type-card" data-level="M1">
              <div class="resource-type-icon">🎓</div>
              <h3>Master 1</h3>
              <p style="color: var(--muted); margin: 8px 0;">Ressources pour la première année de master</p>
              <div style="font-size: 12px; color: var(--primary);">S1 & S2</div>
            </div>
            
            <div class="resource-type-card" data-level="M2">
              <div class="resource-type-icon">🎓</div>
              <h3>Master 2</h3>
              <p style="color: var(--muted); margin: 8px 0;">Ressources pour la deuxième année de master</p>
              <div style="font-size: 12px; color: var(--primary);">S3</div>
            </div>
            
            <div class="resource-type-card" data-level="PFE">
              <div class="resource-type-icon">📖</div>
              <h3>Mémoires PFE</h3>
              <p style="color: var(--muted); margin: 8px 0;">Rapports et templates de PFE</p>
              <div style="font-size: 12px; color: var(--primary);">S4</div>
            </div>
            
            <div class="resource-type-card" data-level="COMPANIES">
              <div class="resource-type-icon">💼</div>
              <h3>Entreprises</h3>
              <p style="color: var(--muted); margin: 8px 0;">Contacts et opportunités professionnelles</p>
              <div style="font-size: 12px; color: var(--primary);">Stages & Emplois</div>
            </div>
          </div>
        </div>
      </section>
    `;

    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const category = btn.dataset.category;
        if (category === 'm1') setRoute('m1');
        else if (category === 'm2') setRoute('m2');
        else if (category === 'pfe') setRoute('pfe');
        else if (category === 'companies') setRoute('companies');
      });
    });

    document.querySelectorAll('.resource-type-card').forEach(card => {
      card.addEventListener('click', () => {
        const level = card.dataset.level;
        if (level === 'M1') setRoute('m1');
        else if (level === 'M2') setRoute('m2');
        else if (level === 'PFE') setRoute('pfe');
        else if (level === 'COMPANIES') setRoute('companies');
      });
    });
  }

  function renderM1() {
    root.innerHTML = `
      <section>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="margin: 0;">Master 1 - Ressources</h2>
          <button class="btn btn-ghost" id="back-to-resources">
            <i class="fas fa-arrow-left"></i> Retour
          </button>
        </div>

        <div class="resource-types-grid">
          <div class="resource-type-card" data-semester="S1">
            <div class="resource-type-icon">📚</div>
            <h3>Semestre 1</h3>
            <p style="color: var(--muted); margin: 8px 0;">Ressources du premier semestre</p>
            <div style="font-size: 12px; color: var(--primary);">6 Unités d'Enseignement</div>
          </div>
          
          <div class="resource-type-card" data-semester="S2">
            <div class="resource-type-icon">📚</div>
            <h3>Semestre 2</h3>
            <p style="color: var(--muted); margin: 8px 0;">Ressources du deuxième semestre</p>
            <div style="font-size: 12px; color: var(--primary);">6 Unités d'Enseignement</div>
          </div>
        </div>

        <div style="margin-top: 32px;">
          <h3>Unités d'Enseignement - Master 1</h3>
          <div class="study-list">
            <div class="study-card">
              <h4><i class="fas fa-calendar-alt"></i> Semestre 1</h4>
              ${curriculum.M1.S1.map(ue => `
                <div class="ue-item">
                  <div class="ue-header">
                    <div class="ue-code">${ue.code}</div>
                    <div class="ue-credits">${ue.credits} ECTS</div>
                  </div>
                  <div class="ue-title">${ue.title}</div>
                </div>
              `).join('')}
            </div>
            
            <div class="study-card">
              <h4><i class="fas fa-calendar-alt"></i> Semestre 2</h4>
              ${curriculum.M1.S2.map(ue => `
                <div class="ue-item">
                  <div class="ue-header">
                    <div class="ue-code">${ue.code}</div>
                    <div class="ue-credits">${ue.credits} ECTS</div>
                  </div>
                  <div class="ue-title">${ue.title}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </section>
    `;

    document.getElementById('back-to-resources').addEventListener('click', () => setRoute('resources'));

    document.querySelectorAll('.resource-type-card[data-semester]').forEach(card => {
      card.addEventListener('click', () => {
        const semester = card.dataset.semester;
        setRoute('m1semester', { semester: semester });
      });
    });
  }

  function renderM2() {
    root.innerHTML = `
      <section>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="margin: 0;">Master 2 - Ressources</h2>
          <button class="btn btn-ghost" id="back-to-resources">
            <i class="fas fa-arrow-left"></i> Retour
          </button>
        </div>

        <div class="resource-types-grid">
          <div class="resource-type-card" data-semester="S3">
            <div class="resource-type-icon">📚</div>
            <h3>Semestre 3</h3>
            <p style="color: var(--muted); margin: 8px 0;">Ressources du troisième semestre</p>
            <div style="font-size: 12px; color: var(--primary);">6 Unités d'Enseignement</div>
          </div>
        </div>

        <div style="margin-top: 32px;">
          <h3>Unités d'Enseignement - Master 2</h3>
          <div class="study-list">
            <div class="study-card">
              <h4><i class="fas fa-calendar-alt"></i> Semestre 3</h4>
              ${curriculum.M2.S3.map(ue => `
                <div class="ue-item">
                  <div class="ue-header">
                    <div class="ue-code">${ue.code}</div>
                    <div class="ue-credits">${ue.credits} ECTS</div>
                  </div>
                  <div class="ue-title">${ue.title}</div>
                </div>
              `).join('')}
            </div>
            
            <div class="study-card">
              <h4><i class="fas fa-calendar-alt"></i> Semestre 4 - PFE</h4>
              ${curriculum.M2.S4.map(ue => `
                <div class="ue-item" style="cursor: pointer;" onclick="setRoute('pfe')">
                  <div class="ue-header">
                    <div class="ue-code">${ue.code}</div>
                    <div class="ue-credits">${ue.credits} ECTS</div>
                  </div>
                  <div class="ue-title">${ue.title}</div>
                  <div style="font-size: 13px; color: var(--muted); margin-top: 8px;">
                    Cliquez pour accéder aux mémoires PFE
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </section>
    `;

    document.getElementById('back-to-resources').addEventListener('click', () => setRoute('resources'));

    document.querySelectorAll('.resource-type-card[data-semester]').forEach(card => {
      card.addEventListener('click', () => {
        const semester = card.dataset.semester;
        setRoute('m2semester', { semester: semester });
      });
    });
  }

  function renderM1Semester() {
    const semester = routeParams.semester;
    const semesterData = curriculum.M1[semester];
    
    root.innerHTML = `
      <section>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="margin: 0;">Master 1 - ${semester}</h2>
          <button class="btn btn-ghost" id="back-to-m1">
            <i class="fas fa-arrow-left"></i> Retour
          </button>
        </div>

        <div class="resource-types-grid">
          ${Object.entries(CONFIG.RESOURCE_TYPES).map(([key, type]) => `
            <div class="resource-type-card" data-type="${key}">
              <div class="resource-type-icon">${type.icon}</div>
              <h3>${type.label}</h3>
              <p style="color: var(--muted); margin: 8px 0;">${type.label} pour ${semester}</p>
            </div>
          `).join('')}
        </div>

        <div style="margin-top: 32px;">
          <h3>Ressources disponibles - ${semester}</h3>
          <div class="grid-res" id="semester-resources">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
      </section>
    `;

    document.getElementById('back-to-m1').addEventListener('click', () => setRoute('m1'));

    setTimeout(() => {
      const semesterUEs = semesterData.map(ue => ue.code);
      const semesterResources = resources.filter(r => semesterUEs.includes(r.ue) && r.semester === semester);
      document.getElementById('semester-resources').innerHTML = 
        semesterResources.map(r => resourceCardHtml(r)).join('') || 
        '<div class="card" style="text-align: center; padding: 40px;"><div style="font-size: 48px; margin-bottom: 16px;">📚</div><div>Aucune ressource disponible pour le moment</div></div>';
      attachResourceButtons();
    }, 500);

    document.querySelectorAll('.resource-type-card[data-type]').forEach(card => {
      card.addEventListener('click', () => {
        const type = card.dataset.type;
        const semesterUEs = semesterData.map(ue => ue.code);
        const filteredResources = resources.filter(r => 
          semesterUEs.includes(r.ue) && r.type === type && r.semester === semester
        );
        
        document.getElementById('semester-resources').innerHTML = 
          filteredResources.map(r => resourceCardHtml(r)).join('') || 
          '<div class="card" style="text-align: center; padding: 40px;"><div style="font-size: 48px; margin-bottom: 16px;">📚</div><div>Aucune ressource de ce type disponible</div></div>';
        attachResourceButtons();
      });
    });
  }

  function renderM2Semester() {
    const semester = routeParams.semester;
    const semesterData = curriculum.M2[semester];
    
    root.innerHTML = `
      <section>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="margin: 0;">Master 2 - ${semester}</h2>
          <button class="btn btn-ghost" id="back-to-m2">
            <i class="fas fa-arrow-left"></i> Retour
          </button>
        </div>

        <div class="resource-types-grid">
          ${Object.entries(CONFIG.RESOURCE_TYPES).map(([key, type]) => `
            <div class="resource-type-card" data-type="${key}">
              <div class="resource-type-icon">${type.icon}</div>
              <h3>${type.label}</h3>
              <p style="color: var(--muted); margin: 8px 0;">${type.label} pour ${semester}</p>
            </div>
          `).join('')}
        </div>

        <div style="margin-top: 32px;">
          <h3>Ressources disponibles - ${semester}</h3>
          <div class="grid-res" id="semester-resources">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
      </section>
    `;

    document.getElementById('back-to-m2').addEventListener('click', () => setRoute('m2'));

    setTimeout(() => {
      const semesterUEs = semesterData.map(ue => ue.code);
      const semesterResources = resources.filter(r => semesterUEs.includes(r.ue) && r.semester === semester);
      document.getElementById('semester-resources').innerHTML = 
        semesterResources.map(r => resourceCardHtml(r)).join('') || 
        '<div class="card" style="text-align: center; padding: 40px;"><div style="font-size: 48px; margin-bottom: 16px;">📚</div><div>Aucune ressource disponible pour le moment</div></div>';
      attachResourceButtons();
    }, 500);

    document.querySelectorAll('.resource-type-card[data-type]').forEach(card => {
      card.addEventListener('click', () => {
        const type = card.dataset.type;
        const semesterUEs = semesterData.map(ue => ue.code);
        const filteredResources = resources.filter(r => 
          semesterUEs.includes(r.ue) && r.type === type && r.semester === semester
        );
        
        document.getElementById('semester-resources').innerHTML = 
          filteredResources.map(r => resourceCardHtml(r)).join('') || 
          '<div class="card" style="text-align: center; padding: 40px;"><div style="font-size: 48px; margin-bottom: 16px;">📚</div><div>Aucune ressource de ce type disponible</div></div>';
        attachResourceButtons();
      });
    });
  }

  function renderPFE() {
    root.innerHTML = `
      <section>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="margin: 0;">Mémoires PFE - Projet de Fin d'Études</h2>
          <button class="btn btn-ghost" id="back-to-resources">
            <i class="fas fa-arrow-left"></i> Retour
          </button>
        </div>

        <div class="resource-types-grid">
          <div class="resource-type-card" data-pfe-type="book">
            <div class="resource-type-icon">📖</div>
            <h3>PFE Book</h3>
            <p style="color: var(--muted); margin: 8px 0;">Rapports PFE complets (PDF)</p>
          </div>
          
          <div class="resource-type-card" data-pfe-type="template">
            <div class="resource-type-icon">📋</div>
            <h3>Templates</h3>
            <p style="color: var(--muted); margin: 8px 0;">Présentations PowerPoint & Canva</p>
          </div>
        </div>

        <div style="margin-top: 32px;">
          <h3>Rapports PFE disponibles</h3>
          <div class="grid-res" id="pfe-resources">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
      </section>
    `;

    document.getElementById('back-to-resources').addEventListener('click', () => setRoute('resources'));

    // Charger tous les PFE par défaut
    setTimeout(() => {
      const pfeResources = resources.filter(r => r.ue === 'UEF410' && !r.title.includes('Template'));
      document.getElementById('pfe-resources').innerHTML = 
        pfeResources.map(r => pfeResourceCardHtml(r)).join('') || 
        '<div class="card" style="text-align: center; padding: 40px;"><div style="font-size: 48px; margin-bottom: 16px;">📚</div><div>Aucun mémoire PFE disponible pour le moment</div></div>';
      attachResourceButtons();
    }, 500);

    document.querySelectorAll('.resource-type-card[data-pfe-type]').forEach(card => {
      card.addEventListener('click', () => {
        const pfeType = card.dataset.pfeType;
        
        if (pfeType === 'book') {
          // Afficher les rapports PFE
          const pfeResources = resources.filter(r => r.ue === 'UEF410' && !r.title.includes('Template'));
          document.getElementById('pfe-resources').innerHTML = 
            pfeResources.map(r => pfeResourceCardHtml(r)).join('') || 
            '<div class="card" style="text-align: center; padding: 40px;"><div style="font-size: 48px; margin-bottom: 16px;">📚</div><div>Aucun mémoire PFE disponible</div></div>';
        } else if (pfeType === 'template') {
          // Afficher les templates
          const templateResources = resources.filter(r => r.ue === 'UEF410' && r.title.includes('Template'));
          document.getElementById('pfe-resources').innerHTML = 
            templateResources.map(r => pfeResourceCardHtml(r)).join('') || 
            '<div class="card" style="text-align: center; padding: 40px;"><div style="font-size: 48px; margin-bottom: 16px;">📋</div><div>Aucun template disponible pour le moment</div></div>';
        }
        attachResourceButtons();
      });
    });
  }

  function renderCompanies() {
    root.innerHTML = `
      <section>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="margin: 0;">Liste des Sociétés & Opportunités</h2>
          <button class="btn btn-ghost" id="back-to-resources">
            <i class="fas fa-arrow-left"></i> Retour
          </button>
        </div>

        <div class="resource-types-grid">
          <div class="resource-type-card" data-company-type="contact">
            <div class="resource-type-icon">📞</div>
            <h3>Contacts</h3>
            <p style="color: var(--muted); margin: 8px 0;">Coordonnées des entreprises</p>
          </div>
          
          <div class="resource-type-card" data-company-type="skills">
            <div class="resource-type-icon">🎯</div>
            <h3>Compétences</h3>
            <p style="color: var(--muted); margin: 8px 0;">Soft & Hard Skills requis</p>
          </div>
          
          <div class="resource-type-card" data-company-type="certificates">
            <div class="resource-type-icon">📜</div>
            <h3>Certificats</h3>
            <p style="color: var(--muted); margin: 8px 0;">Attestations et certifications</p>
          </div>
          
          <div class="resource-type-card" data-company-type="projects">
            <div class="resource-type-icon">🔗</div>
            <h3>Projets Académiques</h3>
            <p style="color: var(--muted); margin: 8px 0;">Liens vers vos réalisations</p>
          </div>
          
          <div class="resource-type-card" data-company-type="cv">
            <div class="resource-type-icon">📄</div>
            <h3>Template CV</h3>
            <p style="color: var(--muted); margin: 8px 0;">CV des anciens étudiants</p>
          </div>
        </div>

        <div style="margin-top: 32px;">
          <div id="companies-content">
            <div class="card" style="text-align: center; padding: 40px;">
              <div style="font-size: 48px; margin-bottom: 16px;">💼</div>
              <div>Sélectionnez une catégorie pour afficher le contenu</div>
            </div>
          </div>
        </div>
      </section>
    `;

    document.getElementById('back-to-resources').addEventListener('click', () => setRoute('resources'));

    document.querySelectorAll('.resource-type-card[data-company-type]').forEach(card => {
      card.addEventListener('click', () => {
        const companyType = card.dataset.companyType;
        let content = '';
        
        switch(companyType) {
          case 'contact':
            content = `
              <h3>Contacts Entreprises</h3>
              <div class="grid-res">
                <div class="card">
                  <h4>Société Tunisienne d'Électronique</h4>
                  <p style="color: var(--muted); margin: 8px 0;">Spécialisée dans les systèmes embarqués médicaux</p>
                  <div class="meta">
                    <i class="fas fa-map-marker-alt"></i> Tunis, Tunisie
                    <i class="fas fa-phone" style="margin-left: 12px;"></i> +216 70 000 000
                    <i class="fas fa-envelope" style="margin-left: 12px;"></i> contact@ste.com.tn
                  </div>
                </div>
                <div class="card">
                  <h4>MedTech Solutions</h4>
                  <p style="color: var(--muted); margin: 8px 0;">Innovation en technologies médicales</p>
                  <div class="meta">
                    <i class="fas fa-map-marker-alt"></i> Sousse, Tunisie
                    <i class="fas fa-phone" style="margin-left: 12px;"></i> +216 73 000 000
                    <i class="fas fa-envelope" style="margin-left: 12px;"></i> info@medtech.tn
                  </div>
                </div>
                <div class="card">
                  <h4>ElectroMed</h4>
                  <p style="color: var(--muted); margin: 8px 0;">Équipements médicaux électroniques</p>
                  <div class="meta">
                    <i class="fas fa-map-marker-alt"></i> Sfax, Tunisie
                    <i class="fas fa-phone" style="margin-left: 12px;"></i> +216 74 000 000
                    <i class="fas fa-envelope" style="margin-left: 12px;"></i> careers@electromed.tn
                  </div>
                </div>
              </div>
            `;
            break;
          case 'skills':
            content = `
              <h3>Compétences Acquises par les Anciens</h3>
              <div class="study-list">
                <div class="study-card">
                  <h4>Hard Skills Techniques</h4>
                  <ul style="list-style: none; padding: 0;">
                    <li style="margin: 8px 0;">✅ Programmation C/C++/Python - 
                      <a href="#" style="color: var(--primary);">Cours en ligne recommandé</a>
                    </li>
                    <li style="margin: 8px 0;">✅ Systèmes embarqués & FPGA - 
                      <a href="#" style="color: var(--primary);">Formation STMicroelectronics</a>
                    </li>
                    <li style="margin: 8px 0;">✅ Traitement du signal & image - 
                      <a href="#" style="color: var(--primary);">Certification MATLAB</a>
                    </li>
                    <li style="margin: 8px 0;">✅ Réseaux & IoT - 
                      <a href="#" style="color: var(--primary);">Cours Cisco Networking</a>
                    </li>
                    <li style="margin: 8px 0;">✅ Cloud Computing - 
                      <a href="#" style="color: var(--primary);">Formation AWS</a>
                    </li>
                    <li style="margin: 8px 0;">✅ Conception électronique - 
                      <a href="#" style="color: var(--primary);">Altium Designer Training</a>
                    </li>
                  </ul>
                </div>
                <div class="study-card">
                  <h4>Soft Skills & Compétences Métier</h4>
                  <ul style="list-style: none; padding: 0;">
                    <li style="margin: 8px 0;">✅ Gestion de projet médical - 
                      <em>Expérience en stage chez BioMedical Corp</em>
                    </li>
                    <li style="margin: 8px 0;">✅ Communication technique - 
                      <em>Formation en entreprise</em>
                    </li>
                    <li style="margin: 8px 0;">✅ Résolution de problèmes complexes - 
                      <em>Projets réels avec MedTech Industries</em>
                    </li>
                    <li style="margin: 8px 0;">✅ Travail en équipe pluridisciplinaire - 
                      <em>Collaboration ingénieurs/médecins</em>
                    </li>
                    <li style="margin: 8px 0;">✅ Innovation et R&D - 
                      <em>Participation aux projets de recherche</em>
                    </li>
                    <li style="margin: 8px 0;">✅ Conformité réglementaire médicale - 
                      <em>Formation FDA/CE</em>
                    </li>
                  </ul>
                </div>
              </div>
            `;
            break;
          case 'certificates':
            content = `
              <h3>Certifications & Attestations</h3>
              <div class="grid-res">
                <div class="card">
                  <h4>Certification FPGA Avancé</h4>
                  <p style="color: var(--muted);">Xilinx/Intel FPGA Design - Niveau expert</p>
                  <div class="meta">
                    <a href="#" style="color: var(--primary);">🔗 Lien vers le cours</a> | 
                    <em>Recommandé par STMicroelectronics</em>
                  </div>
                  <button class="btn btn-primary" style="margin-top: 12px;">
                    <i class="fas fa-download"></i> Voir l'attestation
                  </button>
                </div>
                <div class="card">
                  <h4>Cloud Medical Practitioner</h4>
                  <p style="color: var(--muted);">AWS/Azure Cloud pour applications médicales</p>
                  <div class="meta">
                    <a href="#" style="color: var(--primary);">🔗 Programme de certification</a> | 
                    <em>Partenaire: Microsoft Healthcare</em>
                  </div>
                  <button class="btn btn-primary" style="margin-top: 12px;">
                    <i class="fas fa-download"></i> Voir l'attestation
                  </button>
                </div>
                <div class="card">
                  <h4>IoT Medical Specialist</h4>
                  <p style="color: var(--muted);">Internet of Things pour dispositifs médicaux</p>
                  <div class="meta">
                    <a href="#" style="color: var(--primary);">🔗 Formation en ligne</a> | 
                    <em>En collaboration avec Siemens Healthineers</em>
                  </div>
                  <button class="btn btn-primary" style="margin-top: 12px;">
                    <i class="fas fa-download"></i> Voir l'attestation
                  </button>
                </div>
                <div class="card">
                  <h4>Certification MATLAB Medical</h4>
                  <p style="color: var(--muted);">Traitement de signaux biomédicaux</p>
                  <div class="meta">
                    <a href="#" style="color: var(--primary);">🔗 Cours certifié</a> | 
                    <em>Utilisé chez BioSignal Analytics</em>
                  </div>
                  <button class="btn btn-primary" style="margin-top: 12px;">
                    <i class="fas fa-download"></i> Voir l'attestation
                  </button>
                </div>
                <div class="card">
                  <h4>Medical Device Regulation</h4>
                  <p style="color: var(--muted);">Normes FDA/CE pour dispositifs médicaux</p>
                  <div class="meta">
                    <a href="#" style="color: var(--primary);">🔗 Formation réglementaire</a> | 
                    <em>Obligatoire pour MedTech Solutions</em>
                  </div>
                  <button class="btn btn-primary" style="margin-top: 12px;">
                    <i class="fas fa-download"></i> Voir l'attestation
                  </button>
                </div>
                <div class="card">
                  <h4>Python for Medical Imaging</h4>
                  <p style="color: var(--muted);">Analyse d'images médicales avec Python</p>
                  <div class="meta">
                    <a href="#" style="color: var(--primary);">🔗 Spécialisation en ligne</a> | 
                    <em>Recommandé par Radiology AI Inc.</em>
                  </div>
                  <button class="btn btn-primary" style="margin-top: 12px;">
                    <i class="fas fa-download"></i> Voir l'attestation
                  </button>
                </div>
              </div>
            `;
            break;
          case 'projects':
            content = `
              <h3>Projets Réalisés par les Anciens Étudiants</h3>
              <div class="grid-res">
                <div class="card">
                  <h4>Système de Monitoring Cardiaque</h4>
                  <p style="color: var(--muted);">Dispositif portable avec transmission Bluetooth</p>
                  <div class="meta">
                    <strong>Technologies:</strong> Arduino, Python, MATLAB<br>
                    <strong>Entreprise partenaire:</strong> CardioTech<br>
                    <a href="#" style="color: var(--primary);">🔗 Voir le projet GitHub</a>
                  </div>
                </div>
                <div class="card">
                  <h4>Application de Diagnostic EEG</h4>
                  <p style="color: var(--muted);">IA pour détection d'anomalies cérébrales</p>
                  <div class="meta">
                    <strong>Technologies:</strong> Python, TensorFlow, React<br>
                    <strong>Stage chez:</strong> NeuroMed Analytics<br>
                    <a href="#" style="color: var(--primary);">🔗 Voir la démonstration</a>
                  </div>
                </div>
                <div class="card">
                  <h4>Robot Chirurgical Assisté</h4>
                  <p style="color: var(--muted);">Système de précision pour micro-chirurgie</p>
                  <div class="meta">
                    <strong>Technologies:</strong> C++, ROS, Computer Vision<br>
                    <strong>Collaboration:</strong> CHU Tunis<br>
                    <a href="#" style="color: var(--primary);">🔗 Voir la publication</a>
                  </div>
                </div>
                <div class="card">
                  <h4>Plateforme Télémédecine</h4>
                  <p style="color: var(--muted);">Solution cloud pour consultations à distance</p>
                  <div class="meta">
                    <strong>Technologies:</strong> AWS, React Native, Node.js<br>
                    <strong>Startup:</strong> MediConnect Tunisia<br>
                    <a href="#" style="color: var(--primary);">🔗 Voir le site web</a>
                  </div>
                </div>
                <div class="card">
                  <h4>Système de Surveillance Fœtale</h4>
                  <p style="color: var(--muted);">Capteurs sans fil pour monitoring prénatal</p>
                  <div class="meta">
                    <strong>Technologies:</strong> IoT, Signal Processing, Mobile App<br>
                    <strong>Hôpital partenaire:</strong> Maternité Center<br>
                    <a href="#" style="color: var(--primary);">🔗 Voir le prototype</a>
                  </div>
                </div>
                <div class="card">
                  <h4>Outil d'Analyse d'Images Médicales</h4>
                  <p style="color: var(--muted);">Deep Learning pour détection de tumeurs</p>
                  <div class="meta">
                    <strong>Technologies:</strong> Python, PyTorch, DICOM<br>
                    <strong>Recherche avec:</strong> Institut Pasteur<br>
                    <a href="#" style="color: var(--primary);">🔗 Accéder à l'outil</a>
                  </div>
                </div>
              </div>
            `;
            break;
          case 'cv':
            content = `
              <h3>CV des Anciens Étudiants - Modèles à Télécharger</h3>
              <div class="grid-res">
                <div class="card">
                  <h4>CV - Yassine Ben Ahmed</h4>
                  <p style="color: var(--muted);">Ingénieur en systèmes embarqués médicaux</p>
                  <div class="meta">
                    <strong>Poste actuel:</strong> Embedded Engineer @ MedTech Solutions<br>
                    <strong>Spécialité:</strong> FPGA, IoT Medical<br>
                    <strong>Année promotion:</strong> 2023
                  </div>
                  <button class="btn btn-primary" style="margin-top: 12px;">
                    <i class="fas fa-download"></i> Télécharger le CV
                  </button>
                </div>
                <div class="card">
                  <h4>CV - Sara Ben Mahmoud</h4>
                  <p style="color: var(--muted);">Data Scientist en imagerie médicale</p>
                  <div class="meta">
                    <strong>Poste actuel:</strong> AI Researcher @ Radiology AI Inc.<br>
                    <strong>Spécialité:</strong> Machine Learning, Computer Vision<br>
                    <strong>Année promotion:</strong> 2022
                  </div>
                  <button class="btn btn-primary" style="margin-top: 12px;">
                    <i class="fas fa-download"></i> Télécharger le CV
                  </button>
                </div>
                <div class="card">
                  <h4>CV - Mohamed Trabelsi</h4>
                  <p style="color: var(--muted);">Ingénieur R&D dispositifs médicaux</p>
                  <div class="meta">
                    <strong>Poste actuel:</strong> R&D Engineer @ STMicroelectronics<br>
                    <strong>Spécialité:</strong> Analog Design, Medical Sensors<br>
                    <strong>Année promotion:</strong> 2023
                  </div>
                  <button class="btn btn-primary" style="margin-top: 12px;">
                    <i class="fas fa-download"></i> Télécharger le CV
                  </button>
                </div>
                <div class="card">
                  <h4>CV - Fatma Karray</h4>
                  <p style="color: var(--muted);">Chef de projet innovation médicale</p>
                  <div class="meta">
                    <strong>Poste actuel:</strong> Project Manager @ BioMedical Corp<br>
                    <strong>Spécialité:</strong> Gestion de projet, Réglementation<br>
                    <strong>Année promotion:</strong> 2021
                  </div>
                  <button class="btn btn-primary" style="margin-top: 12px;">
                    <i class="fas fa-download"></i> Télécharger le CV
                  </button>
                </div>
                <div class="card">
                  <h4>CV - Tarek Ben Slimane</h4>
                  <p style="color: var(--muted);">Développeur logiciel médical</p>
                  <div class="meta">
                    <strong>Poste actuel:</strong> Software Engineer @ Siemens Healthineers<br>
                    <strong>Spécialité:</strong> C++, Medical Software, DICOM<br>
                    <strong>Année promotion:</strong> 2022
                  </div>
                  <button class="btn btn-primary" style="margin-top: 12px;">
                    <i class="fas fa-download"></i> Télécharger le CV
                  </button>
                </div>
                <div class="card">
                  <h4>CV - Rania Ben Ammar</h4>
                  <p style="color: var(--muted);">Ingénieure en assurance qualité médicale</p>
                  <div class="meta">
                    <strong>Poste actuel:</strong> QA Engineer @ ElectroMed<br>
                    <strong>Spécialité:</strong> Tests validation, Documentation technique<br>
                    <strong>Année promotion:</strong> 2023
                  </div>
                  <button class="btn btn-primary" style="margin-top: 12px;">
                    <i class="fas fa-download"></i> Télécharger le CV
                  </button>
                </div>
              </div>
            `;
            break;
        }
        
        document.getElementById('companies-content').innerHTML = content;
      });
    });
  }

  function renderForum() {
    root.innerHTML = `
      <section>
        <h2>Forum & Chat Communautaire</h2>
        <p style="color: var(--muted); margin-bottom: 24px;">Échangez avec la communauté MasterSeeem</p>

        <div class="faq-grid">
          <div>
            <div class="qa">
              <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div class="avatar">Y</div>
                <div style="flex: 1;">
                  <div style="font-weight: 700; margin-bottom: 4px;">Comment publier une ressource ?</div>
                  <div class="meta">Cliquez sur "Publier", remplissez le formulaire avec les détails de votre ressource.</div>
                </div>
              </div>
            </div>

            <div class="qa">
              <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div class="avatar">T</div>
                <div style="flex: 1;">
                  <div style="font-weight: 700; margin-bottom: 4px;">Dates importantes pour le PFE</div>
                  <div class="meta">Les dépôts des sujets PFE sont prévus pour mi-mars. Restez à l'écoute!</div>
                </div>
              </div>
            </div>

            <div class="qa">
              <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div class="avatar">G</div>
                <div style="flex: 1;">
                  <div style="font-weight: 700; margin-bottom: 4px;">Révision pour les examens</div>
                  <div class="meta">Des sessions de révision groupée seront organisées la semaine prochaine.</div>
                </div>
              </div>
            </div>

            <div style="margin-top: 32px;">
              <h3>Chat en Direct</h3>
              <div class="chat-container">
                <div class="chat-messages" id="chat-messages">
                  <div style="text-align: center; color: var(--muted); padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">💬</div>
                    <div>Chat communautaire - Connectez-vous pour discuter</div>
                  </div>
                </div>
                <div class="chat-input">
                  <input type="text" placeholder="Tapez votre message..." style="flex: 1;" />
                  <button class="btn btn-primary">
                    <i class="fas fa-paper-plane"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <h4><i class="fas fa-question-circle"></i> Poser une question</h4>
            <form class="ask-form" id="ask-form" style="margin-top: 16px;">
              <input name="subject" placeholder="Sujet de votre question" class="input" required />
              <textarea name="body" placeholder="Décrivez votre question en détail..." required style="margin-top: 12px;"></textarea>
              <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
                <button type="submit" class="btn btn-primary">
                  <i class="fas fa-paper-plane"></i> Envoyer la question
                </button>
              </div>
            </form>
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(0,0,0,0.1);">
              <div style="font-size: 14px; color: var(--muted);">
                <i class="fas fa-envelope"></i> Contact : 
                <a href="mailto:${CONFIG.CONTACT_EMAIL}" style="color: var(--primary);">${CONFIG.CONTACT_EMAIL}</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;

    document.getElementById('ask-form').addEventListener('submit', (e) => {
      e.preventDefault();
      showNotification('Question envoyée ! Nous vous répondrons dans les plus brefs délais.', 'success');
      e.target.reset();
    });
  }

  /* ====== Helper Functions ====== */
  function resourceCardHtml(resource) {
    const typeInfo = CONFIG.RESOURCE_TYPES[resource.type];
    const ue = findUEByCode(resource.ue);
    const user = getCurrentUser();
    const isAlumni = user && user.isAlumni;
    
    return `
      <article class="card" data-id="${resource.id}">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 1.1rem; line-height: 1.4; margin-bottom: 6px;">${escapeHtml(resource.title)}</div>
            <div class="meta">
              <i class="fas fa-user"></i> ${escapeHtml(resource.author)}
              <i class="fas fa-calendar" style="margin-left: 12px;"></i> ${formatDate(resource.date)}
            </div>
          </div>
          <div style="text-align: right;">
            <div class="resource-badge ${typeInfo.color}" style="margin-top: 8px;">
              ${typeInfo.icon} ${typeInfo.label}
            </div>
          </div>
        </div>

        <div style="margin-bottom: 12px; font-size: 14px; color: var(--muted);">
          ${escapeHtml(resource.description)}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
          <div>
            <div style="font-weight: 500; font-size: 14px;">${resource.ue} - ${ue?.title || 'UE'}</div>
            <div class="meta">
              <i class="fas fa-download"></i> ${resource.downloads} 
              <i class="fas fa-star" style="margin-left: 8px; color: var(--warning);"></i> ${resource.rating}
              <i class="fas fa-file" style="margin-left: 8px;"></i> ${resource.fileSize}
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            ${isAlumni ? `
              <button class="btn btn-success btn-upload" style="padding: 8px 12px;">
                <i class="fas fa-upload"></i> Uploader
              </button>
            ` : ''}
            <button class="btn btn-primary btn-download" style="padding: 8px 12px;">
              <i class="fas fa-download"></i> Télécharger
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function pfeResourceCardHtml(resource) {
    const fileType = resource.fileType || 'PDF';
    const isTemplate = resource.title.includes('Template');
    const user = getCurrentUser();
    const isAlumni = user && user.isAlumni;
    
    return `
      <article class="card" data-id="${resource.id}">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 1.1rem; line-height: 1.4; margin-bottom: 6px;">${escapeHtml(resource.title)}</div>
            <div class="meta">
              <i class="fas fa-user"></i> ${escapeHtml(resource.author)}
              <i class="fas fa-calendar" style="margin-left: 12px;"></i> ${formatDate(resource.date)}
            </div>
          </div>
          <div style="text-align: right;">
            <div class="resource-badge ${isTemplate ? 'badge-tp' : 'badge-cours'}" style="margin-top: 8px;">
              ${isTemplate ? '📋 Template' : '📖 Rapport'}
            </div>
          </div>
        </div>

        <div style="margin-bottom: 12px; font-size: 14px; color: var(--muted);">
          ${escapeHtml(resource.description)}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
          <div>
            <div style="font-weight: 500; font-size: 14px;">${resource.ue} - ${isTemplate ? 'Template présentation' : 'Rapport PFE'}</div>
            <div class="meta">
              <i class="fas fa-download"></i> ${resource.downloads} 
              <i class="fas fa-star" style="margin-left: 8px; color: var(--warning);"></i> ${resource.rating}
              <i class="fas fa-file" style="margin-left: 8px;"></i> ${fileType} - ${resource.fileSize}
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            ${isAlumni ? `
              <button class="btn btn-success btn-upload" style="padding: 8px 12px;">
                <i class="fas fa-upload"></i> Uploader
              </button>
            ` : ''}
            <button class="btn btn-primary btn-download" style="padding: 8px 12px;">
              <i class="fas fa-download"></i> Télécharger
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function attachResourceButtons() {
    document.querySelectorAll('.btn-download').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.card');
        const id = Number(card.dataset.id);
        const resource = resources.find(r => r.id === id);
        
        if (!resource) return;

        resource.downloads = (resource.downloads || 0) + 1;
        saveResources(resources);
        
        showNotification(`Téléchargement de "${resource.title}" commencé`, 'success');
        
        const downloadCount = card.querySelector('.fa-download').parentNode;
        downloadCount.innerHTML = `<i class="fas fa-download"></i> ${resource.downloads}`;
      });
    });

    // Gestion des boutons d'upload pour les anciens étudiants
    document.querySelectorAll('.btn-upload').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.card');
        const id = Number(card.dataset.id);
        const resource = resources.find(r => r.id === id);
        
        if (!resource) return;

        openUploadModal(resource);
      });
    });
  }

async function handleSignup(e) {
  e.preventDefault();
  const formData = new FormData(e.target);

  const firstName = formData.get('firstName').trim();
  const lastName = formData.get('lastName').trim();
  const email = formData.get('email').trim();
  const year = formData.get('year');
  const studentId = formData.get('studentId').trim() || null;
  const password = formData.get('password');
  const confirmPassword = formData.get('confirmPassword');

  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    showNotification('Remplissez tous les champs', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showNotification('Les mots de passe ne correspondent pas', 'error');
    return;
  }

  const isAlumni = year === 'Alumni';
  const userType = isAlumni ? 'alumni' : 'current';

  const payload = { firstName, lastName, email, year, studentId, password, isAlumni, userType };

  try {
    const res = await fetch('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      showNotification(data.error || 'Erreur lors de l\'inscription', 'error');
      return;
    }

    // Signup successful → user auto-logged in via cookie
    if (data.user) {
      setCurrentUser(data.user);
      showNotification(`Bienvenue ${data.user.firstName} ! Votre compte a été créé.`, 'success');
      setRoute('home');
    }

  } catch (err) {
    console.error(err);
    showNotification('Impossible de contacter le serveur.', 'error');
  }
}


async function handleLogin(e) {
  e.preventDefault();
  const formData = new FormData(e.target);

  const email = formData.get('email').trim();
  const password = formData.get('password');

  if (!email || !password) {
    showNotification('Remplissez tous les champs', 'error');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showNotification(data.error || 'Échec de la connexion', 'error');
      return;
    }

    // Backend returns user info
    if (data.user) {
      setCurrentUser(data.user);
      showNotification(`Bienvenue ${data.user.firstName} !`, 'success');
      setRoute('home');
    }

  } catch (err) {
    console.error(err);
    showNotification('Impossible de contacter le serveur.', 'error');
  }
}

  function openForgotPasswordModal() {
  let step = 1;
  let email = '';
  let code = '';

  function render() {
    let html = '';

    if (step === 1) {
      html = `
        <div class="modal-backdrop">
          <div class="modal">
            <h3>Mot de passe oublié</h3>
            <input id="fp-email" type="email" placeholder="Votre email" class="input" />
            <div style="margin-top: 12px; display: flex; justify-content: flex-end; gap: 8px;">
              <button id="fp-cancel" class="btn btn-ghost">Annuler</button>
              <button id="fp-send" class="btn btn-primary">Envoyer le code</button>
            </div>
          </div>
        </div>
      `;
    } else if (step === 2) {
      html = `
        <div class="modal-backdrop">
          <div class="modal">
            <h3>Entrez le code reçu</h3>
            <input id="fp-code" type="text" placeholder="Code à 6 chiffres" class="input" />
            <div style="margin-top: 12px; display: flex; justify-content: flex-end; gap: 8px;">
              <button id="fp-back" class="btn btn-ghost">Retour</button>
              <button id="fp-verify" class="btn btn-primary">Vérifier</button>
            </div>
          </div>
        </div>
      `;
    } else if (step === 3) {
      html = `
        <div class="modal-backdrop">
          <div class="modal">
            <h3>Réinitialiser le mot de passe</h3>
            <input id="fp-newpass" type="password" placeholder="Nouveau mot de passe" class="input" />
            <div style="margin-top: 12px; display: flex; justify-content: flex-end; gap: 8px;">
              <button id="fp-back2" class="btn btn-ghost">Retour</button>
              <button id="fp-reset" class="btn btn-primary">Réinitialiser</button>
            </div>
          </div>
        </div>
      `;
    }

    modalRoot.innerHTML = html;

    if (step === 1) {
      document.getElementById('fp-send').addEventListener('click', async () => {
        email = document.getElementById('fp-email').value;
        if (!email) return alert('Email requis');
        const res = await fetch('/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok) step = 2;
        else alert(data.error || 'Erreur');
        render();
      });
      document.getElementById('fp-cancel').addEventListener('click', () => modalRoot.innerHTML = '');
    } else if (step === 2) {
      document.getElementById('fp-verify').addEventListener('click', async () => {
        code = document.getElementById('fp-code').value;
        if (!code) return alert('Code requis');
        const res = await fetch('/auth/verify-reset-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code })
        });
        const data = await res.json();
        if (res.ok) step = 3;
        else alert(data.error || 'Erreur');
        render();
      });
      document.getElementById('fp-back').addEventListener('click', () => { step = 1; render(); });
    } else if (step === 3) {
      document.getElementById('fp-reset').addEventListener('click', async () => {
        const newPassword = document.getElementById('fp-newpass').value;
        if (!newPassword) return alert('Nouveau mot de passe requis');
        const res = await fetch('/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code, newPassword })
        });
        const data = await res.json();
        if (res.ok) { alert('Mot de passe réinitialisé'); modalRoot.innerHTML = ''; }
        else alert(data.error || 'Erreur');
      });
      document.getElementById('fp-back2').addEventListener('click', () => { step = 2; render(); });
    }
  }

  render();
}


function openForgotPasswordModal() {
  const modalRoot = document.getElementById('modal-root');
  
  // Step 1: Ask for email
  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal" id="forgot-modal">
        <h3>Mot de passe oublié</h3>
        <form id="forgot-form">
          <input type="email" placeholder="Votre email" required />
          <div class="actions">
            <button type="button" class="btn btn-ghost" id="cancel-forgot">Annuler</button>
            <button type="submit" class="btn btn-primary">Envoyer le code</button>
          </div>
        </form>
        <div id="forgot-message" style="margin-top:12px; text-align:center; color:green;"></div>
      </div>
    </div>
  `;

  const form = document.getElementById('forgot-form');
  const cancelBtn = document.getElementById('cancel-forgot');
  const messageDiv = document.getElementById('forgot-message');

  cancelBtn.addEventListener('click', () => modalRoot.innerHTML = '');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.querySelector('input').value;

    try {
      const res = await fetch('http://localhost:3000/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (res.ok) {
        // Move to step 2
        showResetCodeStep(email);
      } else {
        messageDiv.style.color = 'red';
        messageDiv.textContent = data.error || 'Erreur';
      }
    } catch (err) {
      messageDiv.style.color = 'red';
      messageDiv.textContent = 'Erreur de connexion au serveur.';
    }
  });

  function showResetCodeStep(email) {
    const modal = document.getElementById('forgot-modal');
    modal.innerHTML = `
      <h3>Réinitialiser le mot de passe</h3>
      <form id="reset-form">
        <input type="text" placeholder="Code reçu par email" required />
        <input type="password" placeholder="Nouveau mot de passe" required />
        <div class="actions">
          <button type="button" class="btn btn-ghost" id="cancel-reset">Annuler</button>
          <button type="submit" class="btn btn-primary">Réinitialiser</button>
        </div>
      </form>
      <div id="reset-message" style="margin-top:12px; text-align:center; color:green;"></div>
    `;

    const resetForm = document.getElementById('reset-form');
    const cancelResetBtn = document.getElementById('cancel-reset');
    const resetMessageDiv = document.getElementById('reset-message');

    cancelResetBtn.addEventListener('click', () => modalRoot.innerHTML = '');

    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = resetForm.querySelector('input[type=text]').value;
      const newPassword = resetForm.querySelector('input[type=password]').value;

      try {
        // 1. Verify code
        const verifyRes = await fetch('http://localhost:3000/auth/verify-reset-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code })
        });
        const verifyData = await verifyRes.json();

        if (!verifyRes.ok) {
          resetMessageDiv.style.color = 'red';
          resetMessageDiv.textContent = verifyData.error || 'Code invalide';
          return;
        }

        // 2. Reset password
        const userId = verifyData.userId;
        const resetRes = await fetch('http://localhost:3000/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, newPassword })
        });
        const resetData = await resetRes.json();

        if (resetRes.ok) {
          resetMessageDiv.style.color = 'green';
          resetMessageDiv.textContent = 'Mot de passe réinitialisé !';
          setTimeout(() => modalRoot.innerHTML = '', 2000); // close modal
        } else {
          resetMessageDiv.style.color = 'red';
          resetMessageDiv.textContent = resetData.error || 'Erreur';
        }

      } catch (err) {
        resetMessageDiv.style.color = 'red';
        resetMessageDiv.textContent = 'Erreur de connexion au serveur.';
      }
    });
  }
}



  function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; background: white; padding: 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-left: 4px solid var(--${type}); z-index: 1000; max-width: 320px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation' : 'info'}-circle" 
             style="color: var(--${type});"></i>
          <div>${message}</div>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 4000);
  }

  function findUEByCode(code) {
    for (const year of Object.values(curriculum)) {
      for (const semester of Object.values(year)) {
        const ue = semester.find(u => u.code === code);
        if (ue) return ue;
      }
    }
    return null;
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* ====== Initialize App ====== */
  init();
})();