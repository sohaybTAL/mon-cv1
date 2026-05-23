// ==========================================================================
// Moteur d'interface Web de CV Premium - Entièrement Interactif et Réactif (VF)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // État Global
  let state = {
    theme: 'dark',
    editMode: false,
    cvData: {},
    messages: []
  };

  // Cache des éléments du DOM
  const htmlEl = document.documentElement;
  const bodyEl = document.body;
  const themeToggle = document.getElementById('theme-toggle');
  const editModeToggle = document.getElementById('edit-mode-toggle');
  const pdfDownload = document.getElementById('pdf-download');
  const saveStatus = document.getElementById('save-status');
  const resetBtn = document.getElementById('btn-reset-cv');
  const exportBtn = document.getElementById('btn-export-cv');
  const importTrigger = document.getElementById('btn-import-cv-trigger');
  const importFile = document.getElementById('cv-import-file');
  const contactForm = document.getElementById('contact-form');
  const contactStatus = document.getElementById('contact-status');
  const adminInboxTrigger = document.getElementById('admin-inbox-trigger');
  const inboxModal = document.getElementById('inbox-modal');
  const inboxCloseBtn = document.getElementById('inbox-close-btn');
  const inboxMsgCount = document.getElementById('inbox-msg-count');
  const inboxContainer = document.getElementById('inbox-messages-container');
  const clearInboxBtn = document.getElementById('btn-clear-inbox');
  const currentYearSpan = document.getElementById('current-year');
  const avatarContainer = document.querySelector('.avatar-container');
  const avatarLightbox = document.getElementById('avatar-lightbox');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  
  // Restauration de la session admin si active
  if (sessionStorage.getItem('admin_unlocked') === 'true') {
    bodyEl.classList.add('admin-unlocked');
  }
  
  // Remplissage de l'année en cours dans le footer
  if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
  }

  // Gradients prédéfinis pour le profil
  const avatarGradients = [
    'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
    'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #d946ef 100%)',
    'linear-gradient(135deg, #84cc16 0%, #22c55e 50%, #06b6d4 100%)',
    'linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #e11d48 100%)'
  ];
  let activeGradientIndex = 0;

  // ==========================================================================
  // Thème : Clair / Sombre
  // ==========================================================================

  function initTheme() {
    const savedTheme = localStorage.getItem('cv_theme');
    if (savedTheme) {
      state.theme = savedTheme;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      state.theme = 'light';
    }
    htmlEl.setAttribute('data-theme', state.theme);
  }

  themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    htmlEl.setAttribute('data-theme', state.theme);
    localStorage.setItem('cv_theme', state.theme);
    
    themeToggle.style.transform = 'scale(0.85)';
    setTimeout(() => {
      themeToggle.style.transform = 'none';
    }, 150);
  });

  // ==========================================================================
  // Navigation : Indicateur de section active au scroll
  // ==========================================================================

  const sections = document.querySelectorAll('.content-section');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let currentSectionId = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (pageYOffset >= (sectionTop - 150)) {
        currentSectionId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSectionId}`) {
        link.classList.add('active');
      }
    });
  });

  // ==========================================================================
  // Projets : Filtrage Dynamique
  // ==========================================================================

  const filterChips = document.querySelectorAll('.filter-chip');
  const projectCards = document.querySelectorAll('.project-card');

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filterValue = chip.getAttribute('data-filter');

      projectCards.forEach(card => {
        const cardCategory = card.getAttribute('data-project-cat');
        
        if (filterValue === 'all' || cardCategory === filterValue) {
          card.classList.add('show');
        } else {
          card.classList.remove('show');
        }
      });
    });
  });

  // ==========================================================================
  // Édition en direct & Sauvegarde automatique LocalStorage
  // ==========================================================================

  let saveDebounceTimer;
  function triggerAutoSave() {
    if (saveStatus) {
      saveStatus.classList.add('show');
      saveStatus.classList.add('saving');
      saveStatus.querySelector('.saving-text').textContent = 'Enregistrement...';
    }

    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => {
      saveCVDataToLocalStorage();
      if (saveStatus) {
        saveStatus.classList.remove('saving');
        saveStatus.querySelector('.saving-text').textContent = 'Sauvegardé';
        setTimeout(() => {
          if (!state.editMode) {
            saveStatus.classList.remove('show');
          }
        }, 1500);
      }
    }, 800);
  }

  function saveCVDataToLocalStorage() {
    const editables = document.querySelectorAll('[data-editable]');
    const data = {};
    
    editables.forEach(el => {
      if (el.id) {
        data[el.id] = el.innerHTML.trim();
      }
    });

    data['cv_avatar_gradient_index'] = activeGradientIndex;
    
    data['layout_experience'] = document.getElementById('experience-timeline').innerHTML;
    data['layout_projects'] = document.getElementById('projects-container').innerHTML;
    data['layout_skills'] = document.getElementById('skills-container').innerHTML;
    
    localStorage.setItem('cv_builder_data', JSON.stringify(data));
  }

  function loadCVData() {
    const saved = localStorage.getItem('cv_builder_data');
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      
      if (data['layout_experience']) {
        document.getElementById('experience-timeline').innerHTML = data['layout_experience'];
      }
      if (data['layout_projects']) {
        document.getElementById('projects-container').innerHTML = data['layout_projects'];
      }
      if (data['layout_skills']) {
        document.getElementById('skills-container').innerHTML = data['layout_skills'];
      }

      Object.keys(data).forEach(key => {
        if (key.startsWith('layout_') || key === 'cv_avatar_gradient_index') return;
        const el = document.getElementById(key);
        if (el) {
          el.innerHTML = data[key];
        }
      });

      if (data['cv_avatar_gradient_index'] !== undefined) {
        activeGradientIndex = parseInt(data['cv_avatar_gradient_index']);
        const glow = document.querySelector('.avatar-glow');
        if (glow) {
          glow.style.background = avatarGradients[activeGradientIndex];
        }
      }

      document.querySelectorAll('.skill-item').forEach(item => {
        const fill = item.querySelector('.skill-bar-fill');
        const perc = item.querySelector('.skill-percentage');
        if (fill && perc) {
          fill.style.width = perc.textContent.trim();
        }
      });

      attachInputListenersToEditables();
      syncLinks();

    } catch (e) {
      console.error('Erreur de chargement des données locales :', e);
    }
  }

  function attachInputListenersToEditables() {
    const editables = document.querySelectorAll('[data-editable]');
    editables.forEach(el => {
      el.contentEditable = state.editMode ? 'true' : 'false';
      
      el.removeEventListener('input', triggerAutoSave);
      el.addEventListener('input', triggerAutoSave);

      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !el.classList.contains('about-text') && !el.classList.contains('timeline-description')) {
          e.preventDefault();
          el.blur();
        }
      });

      if (el.classList.contains('skill-percentage')) {
        el.addEventListener('blur', () => {
          const bar = el.closest('.skill-item').querySelector('.skill-bar-fill');
          if (bar) {
            bar.style.width = el.textContent.trim();
            triggerAutoSave();
          }
        });
      }
    });
  }

  function syncLinks() {
    const emailVal = document.getElementById('cv-email')?.textContent.trim();
    const phoneVal = document.getElementById('cv-phone')?.textContent.trim();

    if (emailVal) document.getElementById('link-email').href = `mailto:${emailVal}`;
    if (phoneVal) document.getElementById('link-phone').href = `tel:${phoneVal.replace(/\s+/g, '')}`;
  }

  const ADMIN_PASSWORD = 'sohayb123';
  let avatarClickCount = 0;

  avatarContainer.addEventListener('click', () => {
    if (state.editMode) {
      activeGradientIndex = (activeGradientIndex + 1) % avatarGradients.length;
      const glow = document.querySelector('.avatar-glow');
      if (glow) {
        glow.style.background = avatarGradients[activeGradientIndex];
      }
      triggerAutoSave();
      return;
    }

    // Ouvrir le lightbox pour afficher la photo en grand
    console.log("Avatar cliqué. Mode édition =", state.editMode);
    if (avatarLightbox) {
      console.log("Ajout de la classe 'show' sur #avatar-lightbox");
      avatarLightbox.classList.add('show');
    } else {
      console.warn("Élément #avatar-lightbox introuvable dans le DOM !");
    }

    // Easter egg de déverrouillage de l'édition : cliquez 5 fois sur la photo
    avatarClickCount++;
    if (avatarClickCount === 5) {
      avatarClickCount = 0;
      const input = prompt("Entrez le mot de passe administrateur pour déverrouiller l'édition :");
      if (input === ADMIN_PASSWORD) {
        bodyEl.classList.add('admin-unlocked');
        sessionStorage.setItem('admin_unlocked', 'true');
        if (avatarLightbox) {
          avatarLightbox.classList.remove('show');
        }
        alert("Accès Administrateur déverrouillé ! Le panneau de contrôle est maintenant visible en bas à droite.");
      } else if (input !== null) {
        alert("Mot de passe incorrect.");
      }
    }
  });

  // Gestion des événements de fermeture du lightbox
  if (lightboxCloseBtn) {
    lightboxCloseBtn.addEventListener('click', () => {
      if (avatarLightbox) {
        avatarLightbox.classList.remove('show');
      }
    });
  }

  if (avatarLightbox) {
    avatarLightbox.addEventListener('click', (e) => {
      if (e.target === avatarLightbox) {
        avatarLightbox.classList.remove('show');
      }
    });
  }

  editModeToggle.addEventListener('click', () => {
    state.editMode = !state.editMode;
    
    if (state.editMode) {
      bodyEl.classList.add('editing-active');
      editModeToggle.classList.add('active');
      editModeToggle.querySelector('.control-text').textContent = "Quitter l'édition";
      if (saveStatus) saveStatus.classList.add('show');
    } else {
      bodyEl.classList.remove('editing-active');
      editModeToggle.classList.remove('active');
      editModeToggle.querySelector('.control-text').textContent = 'Éditer';
      if (saveStatus) saveStatus.classList.remove('show');
      syncLinks();
    }
    
    attachInputListenersToEditables();
  });

  // ==========================================================================
  // Outils du constructeur de CV (Ajout / Suppression)
  // ==========================================================================

  function generateUniqueId() {
    return 'cv-custom-' + Math.random().toString(36).substr(2, 9);
  }

  window.deleteCard = function(btn) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie et toutes ses compétences ?')) return;
    btn.closest('.skill-card').remove();
    triggerAutoSave();
  };

  window.deleteTimelineItem = function(btn) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette ligne d\'expérience ?')) return;
    btn.closest('.timeline-item').remove();
    triggerAutoSave();
  };

  window.deleteProject = function(btn) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return;
    btn.closest('.project-card').remove();
    triggerAutoSave();
  };

  // Ajouter une catégorie de compétences
  const addSkillCategoryBtn = document.querySelector('.btn-add-skill-category');
  if (addSkillCategoryBtn) {
    addSkillCategoryBtn.addEventListener('click', () => {
      const container = document.getElementById('skills-container');
      const uniqueCatId = generateUniqueId();
      const uniqueSkillId1 = generateUniqueId();

      const newCategoryHtml = `
        <div class="card glass skill-card" data-category="custom">
          <div class="skill-category-header">
            <h3 class="skill-category-title" data-editable id="${uniqueCatId}">Nouvelle Catégorie</h3>
            <button class="btn-delete-card edit-only" title="Supprimer la Catégorie" onclick="deleteCard(this)">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
          <div class="skills-list">
            <div class="skill-item">
              <div class="skill-info">
                <span class="skill-name" data-editable id="${uniqueSkillId1}">Nom Compétence</span>
                <span class="skill-percentage" data-editable id="${generateUniqueId()}">80%</span>
              </div>
              <div class="skill-bar-container">
                <div class="skill-bar-fill" style="width: 80%;"></div>
              </div>
            </div>
          </div>
          <button class="btn btn-xs btn-outline btn-add-skill edit-only" onclick="addSkillToCategory(this)">
            + Ajouter Compétence
          </button>
        </div>
      `;

      container.insertAdjacentHTML('beforeend', newCategoryHtml);
      attachInputListenersToEditables();
      triggerAutoSave();
    });
  }

  // Ajouter une compétence dans une catégorie
  window.addSkillToCategory = function(btn) {
    const list = btn.closest('.skill-card').querySelector('.skills-list');
    const skillId = generateUniqueId();
    const percId = generateUniqueId();

    const newSkillHtml = `
      <div class="skill-item">
        <div class="skill-info">
          <span class="skill-name" data-editable id="${skillId}">Nouvelle Compétence</span>
          <span class="skill-percentage" data-editable id="${percId}">75%</span>
        </div>
        <div class="skill-bar-container">
          <div class="skill-bar-fill" style="width: 75%;"></div>
        </div>
      </div>
    `;

    list.insertAdjacentHTML('beforeend', newSkillHtml);
    attachInputListenersToEditables();
    triggerAutoSave();
  };

  // Ajouter une expérience au timeline
  const addExperienceBtn = document.querySelector('.btn-add-experience');
  if (addExperienceBtn) {
    addExperienceBtn.addEventListener('click', () => {
      const timeline = document.getElementById('experience-timeline');
      const roleId = generateUniqueId();
      const compId = generateUniqueId();
      const periodId = generateUniqueId();
      const descId = generateUniqueId();
      const bulletId = generateUniqueId();

      const newTimelineItemHtml = `
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="card glass timeline-content">
            <div class="timeline-header">
              <div>
                <h3 class="role-title" data-editable id="${roleId}">Intitulé du Poste</h3>
                <div class="company-name" data-editable id="${compId}">Nom de l'Entreprise</div>
              </div>
              <div class="timeline-time-badge">
                <span class="time-period" data-editable id="${periodId}">2026 - Présent</span>
                <button class="btn-delete-card edit-only" title="Supprimer" onclick="deleteTimelineItem(this)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
            <p class="timeline-description" data-editable id="${descId}">
              Décrivez vos missions principales, vos réalisations ou la boîte à outils technologique utilisée ici.
            </p>
            <ul class="timeline-bullets" id="${generateUniqueId()}">
              <li data-editable id="${bulletId}">Ajoutez un détail clé ici.</li>
            </ul>
            <button class="btn btn-xs btn-outline btn-add-bullet edit-only" onclick="addBulletToTimeline(this)">
              + Ajouter Détail
            </button>
          </div>
        </div>
      `;

      timeline.insertAdjacentHTML('afterbegin', newTimelineItemHtml);
      attachInputListenersToEditables();
      triggerAutoSave();
    });
  }

  // Ajouter une puce descriptive
  window.addBulletToTimeline = function(btn) {
    const list = btn.closest('.timeline-content').querySelector('.timeline-bullets');
    const bulletId = generateUniqueId();
    const newBulletHtml = `<li data-editable id="${bulletId}">Double-cliquez pour personnaliser ce détail.</li>`;
    list.insertAdjacentHTML('beforeend', newBulletHtml);
    attachInputListenersToEditables();
    triggerAutoSave();
  };

  // Ajouter un projet
  const addProjectBtn = document.querySelector('.btn-add-project');
  if (addProjectBtn) {
    addProjectBtn.addEventListener('click', () => {
      const grid = document.getElementById('projects-container');
      const titleId = generateUniqueId();
      const descId = generateUniqueId();
      const tagId1 = generateUniqueId();
      const tagId2 = generateUniqueId();
      const randomGradientIndex = Math.floor(Math.random() * 3) + 1;

      const newProjectHtml = `
        <div class="project-card card glass show" data-project-cat="all">
          <div class="project-media-placeholder project-gradient-${randomGradientIndex}">
            <div class="proj-shapes">
              <div class="shape circle-shape"></div>
              <div class="shape square-shape"></div>
            </div>
            <span class="proj-badge">Nouveau</span>
          </div>
          <div class="project-body">
            <div class="project-header">
              <h3 class="project-card-title" data-editable id="${titleId}">Nom du Projet</h3>
              <button class="btn-delete-card edit-only" title="Supprimer" onclick="deleteProject(this)">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
            <p class="project-description" data-editable id="${descId}">
              Décrivez les objectifs, les technologies utilisées et le but final de votre réalisation ici.
            </p>
            <div class="project-tags">
              <span class="tag" data-editable id="${tagId1}">Arduino</span>
              <span class="tag" data-editable id="${tagId2}">IoT</span>
            </div>
            <div class="project-links">
              <a href="#" class="project-link-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-sm"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
                Plus d'infos
              </a>
            </div>
          </div>
        </div>
      `;

      grid.insertAdjacentHTML('afterbegin', newProjectHtml);
      attachInputListenersToEditables();
      triggerAutoSave();
    });
  }

  // ==========================================================================
  // Importation & Exportation JSON
  // ==========================================================================

  // Reset CV
  resetBtn.addEventListener('click', () => {
    if (confirm('Êtes-vous sûr de vouloir effacer toutes vos modifications et restaurer le modèle initial ? Cela supprimera toutes les entrées personnalisées.')) {
      localStorage.removeItem('cv_builder_data');
      window.location.reload();
    }
  });

  // Export JSON
  exportBtn.addEventListener('click', () => {
    const saved = localStorage.getItem('cv_builder_data');
    if (!saved) {
      alert('Aucune modification enregistrée à exporter ! Personnalisez quelque chose en mode Édition en premier.');
      return;
    }

    const blob = new Blob([saved], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const nameVal = document.getElementById('cv-name')?.textContent.trim() || 'mon';
    link.download = `cv_${nameVal.toLowerCase().replace(/\s+/g, '_')}_config.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  // Déclencher Import
  importTrigger.addEventListener('click', () => {
    importFile.click();
  });

  // Importer JSON
  importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const parsed = JSON.parse(evt.target.result);
        
        if (!parsed.cv_avatar_gradient_index && !parsed.layout_experience) {
          throw new Error('Structure de fichier de configuration CV invalide.');
        }

        localStorage.setItem('cv_builder_data', evt.target.result);
        alert('Configuration de CV importée avec succès ! La page va maintenant s\'actualiser.');
        window.location.reload();

      } catch (err) {
        alert('Erreur lors de la lecture du fichier JSON. Assurez-vous qu\'il s\'agit d\'une configuration exportée depuis cette application.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  });

  // ==========================================================================
  // Impression PDF
  // ==========================================================================

  pdfDownload.addEventListener('click', () => {
    if (state.editMode) {
      const activeEl = document.activeElement;
      if (activeEl) activeEl.blur();
    }
    window.print();
  });

  // ==========================================================================
  // Enregistrement des Messages & Boîte de réception Admin
  // ==========================================================================

  function loadMessages() {
    const stored = localStorage.getItem('cv_messages');
    if (stored) {
      try {
        state.messages = JSON.parse(stored);
      } catch (e) {
        state.messages = [];
      }
    }
  }

  function renderInboxMessages() {
    loadMessages();
    inboxMsgCount.textContent = `${state.messages.length} message(s) reçu(s)`;
    
    if (state.messages.length === 0) {
      inboxContainer.innerHTML = '<div class="no-messages">Aucun message de contact reçu pour le moment.</div>';
      return;
    }

    inboxContainer.innerHTML = state.messages.map((msg, index) => `
      <div class="inbox-item" data-index="${index}">
        <button class="inbox-item-delete" onclick="deleteMessage(${index})" title="Supprimer le message">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <div class="inbox-item-header">
          <div>
            <span class="inbox-sender-name">${escapeHtml(msg.name)}</span> 
            <span class="inbox-sender-email">&lt;${escapeHtml(msg.email)}&gt;</span>
          </div>
          <span class="inbox-date">${new Date(msg.timestamp).toLocaleString()}</span>
        </div>
        <div class="inbox-subject">Sujet : ${escapeHtml(msg.subject)}</div>
        <div class="inbox-msg-body">${escapeHtml(msg.message)}</div>
      </div>
    `).join('');
  }

  window.deleteMessage = function(index) {
    state.messages.splice(index, 1);
    localStorage.setItem('cv_messages', JSON.stringify(state.messages));
    renderInboxMessages();
  };

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
  }

  // Soumission de contact
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('form-name').value;
    const email = document.getElementById('form-email').value;
    const subject = document.getElementById('form-subject').value;
    const message = document.getElementById('form-message').value;

    const newMsg = {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString()
    };

    // 1. Sauvegarder dans la boîte de réception locale
    state.messages.unshift(newMsg);
    localStorage.setItem('cv_messages', JSON.stringify(state.messages));

    // Détection de l'ouverture locale via double-clic (file://)
    if (window.location.protocol === 'file:') {
      contactStatus.className = 'form-status success';
      contactStatus.innerHTML = '⚠️ <strong>Note :</strong> Pour envoyer de vrais e-mails, ouvrez le site via XAMPP : <a href="http://localhost/cv-web/" target="_blank" style="color:var(--primary);text-decoration:underline;">http://localhost/cv-web/</a>.<br>Votre message a été enregistré dans votre boîte locale (bouton engrenage en bas).';
      contactForm.reset();
      return;
    }

    // Afficher l'état d'envoi
    contactStatus.className = 'form-status';
    contactStatus.textContent = 'Envoi en cours...';

    // Bouton de soumission micro-animation
    const btn = document.getElementById('btn-submit-contact');
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      btn.style.transform = 'none';
    }, 200);

    // 2. Envoyer un vrai email via FormSubmit.co en AJAX
    fetch('https://formsubmit.co/ajax/sohaybtal1@gmail.com', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        Nom: name,
        Email: email,
        _subject: `Contact CV: ${subject}`,
        Message: message
      })
    })
    .then(response => response.json())
    .then(data => {
      contactStatus.className = 'form-status success';
      contactStatus.textContent = 'Message envoyé avec succès à votre boîte email !';
      contactForm.reset();
      
      setTimeout(() => {
        contactStatus.textContent = '';
        contactStatus.className = 'form-status';
      }, 7000);
    })
    .catch(error => {
      // En cas d'erreur de réseau, informer que le message est enregistré en local
      contactStatus.className = 'form-status success';
      contactStatus.textContent = 'Message sauvegardé dans votre boîte de réception locale !';
      contactForm.reset();
      console.error('Erreur d\'envoi email:', error);
      
      setTimeout(() => {
        contactStatus.textContent = '';
        contactStatus.className = 'form-status';
      }, 7000);
    });
  });

  // Modal Admin Inbox
  adminInboxTrigger.addEventListener('click', () => {
    renderInboxMessages();
    inboxModal.classList.add('show');
  });

  inboxCloseBtn.addEventListener('click', () => {
    inboxModal.classList.remove('show');
  });

  inboxModal.addEventListener('click', (e) => {
    if (e.target === inboxModal) {
      inboxModal.classList.remove('show');
    }
  });

  clearInboxBtn.addEventListener('click', () => {
    if (state.messages.length === 0) return;
    if (confirm('Êtes-vous sûr de vouloir effacer l\'intégralité des messages de votre boîte de réception ?')) {
      state.messages = [];
      localStorage.setItem('cv_messages', JSON.stringify([]));
      renderInboxMessages();
    }
  });

  // ==========================================================================
  // Lancement des Initialisations
  // ==========================================================================
  
  initTheme();
  loadCVData();
  attachInputListenersToEditables();
  loadMessages();
});
