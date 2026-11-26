// ==========================================================================
// MUHAMMAD UMAR — EDITORIAL DARK MINIMALISM SCRIPT
// Features: Dynamic rendering, conversational intent filtering, custom cursor,
// dispatch composer, Karachi live clock, bilingual support (EN/UR).
// ==========================================================================

let currentMode = 'en'; // 'en' or 'ur'
let siteData = {
    en: null,
    ur: null
};

// UI Translations
const UI_TRANSLATIONS = {
    en: {
        navAbout: 'About',
        navProjects: 'Repertoire',
        navSkills: 'Taxonomy',
        navExperience: 'Chronology',
        navLeetCode: 'LeetCode',
        navResume: 'CV',
        navContact: 'Dispatch',
        navBlog: 'Journal',
        heroKickerTag: '[ VOL. 01 / FOLIO 2026 ]',
        heroKickerLocation: 'KARACHI • SINDH, PAKISTAN',
        heroBtnProjects: 'Inspect Selected Works',
        heroBtnInquire: 'Initiate Dispatch',
        titleAbout: 'About & Intellectual Stance',
        titleProjects: 'Selected Repertoire',
        titleSkills: 'Taxonomy & Technical Disciplines',
        titleExperience: 'Chronology & Commercial Practice',
        titleLeetCode: 'Algorithmic Problem Solving',
        titleResume: 'Curriculum Vitae (LaTeX Archive)',
        titleEducation: 'Academic Trajectory & Certifications',
        websiteBtn: 'Live Platform',
        codeBtn: 'Source Code',
        outcomeLabel: 'Engineering Outcome:',
        fallbackWorkTitle: 'Academic Study & Systems Foundations',
        fallbackWorkDate: '2026 — Present',
        fallbackWorkCompany: 'GUTECH — First Semester BSCS',
        fallbackWorkSummary: 'Focusing on rigorous programming fundamentals, learning C++, mastering algorithmic problem solving, and building computational discipline.',
        fallbackWorkImpact: 'Developing strong programming habits, logical thinking, and computer science principles.',
        fallbackCertTitle: 'Undergraduate CS Coursework',
        fallbackCertIssuer: 'GUTECH — First Semester BSCS (C++, Computing Fundamentals)',
        emptyProjects: 'No entries matching the conversational filter. Try resetting the prompt.'
    },
    ur: {
        navAbout: 'تعارف',
        navProjects: 'پروجیکٹس',
        navSkills: 'مہارتیں',
        navExperience: 'تجربہ',
        navLeetCode: 'لیٹ کوڈ',
        navResume: 'سی وی',
        navContact: 'رابطہ',
        navBlog: 'جرنل',
        heroKickerTag: '[ جلد 01 / پورٹ فولیو 2026 ]',
        heroKickerLocation: 'کراچی • سندھ، پاکستان',
        heroBtnProjects: 'منتخب کام دیکھیں',
        heroBtnInquire: 'رابطہ شروع کریں',
        titleAbout: 'میرے بارے میں اور فکری بنیاد',
        titleProjects: 'نمایاں پروجیکٹس اور سسٹمز',
        titleSkills: 'تکنیکی زمرہ جات اور مہارتیں',
        titleExperience: 'عملی تجربہ اور کاروباری ریکارڈ',
        titleLeetCode: 'الگورتھمک صلاحیت اور لیٹ کوڈ',
        titleResume: 'سی وی اور تعلیمی ریکارڈ (LaTeX)',
        titleEducation: 'تعلیمی سفر اور اسناد',
        websiteBtn: 'لائیو ویب سائٹ',
        codeBtn: 'سورس کوڈ',
        outcomeLabel: 'حاصل شدہ نتیجہ:',
        fallbackWorkTitle: 'تعلیمی مطالعہ اور سسٹمز کی بنیادیں',
        fallbackWorkDate: '2026 — جاری',
        fallbackWorkCompany: 'گوٹیک — پہلا سمسٹر BSCS',
        fallbackWorkSummary: 'پروگرامنگ کے بنیادی اصولوں، C++ سیکھنے، الگورتھم اور مسائل کے حل پر گہری توجہ مرکوز ہے۔',
        fallbackWorkImpact: 'پروگرامنگ کی مضبوط عادات اور منطقی سوچ کی نشوونما۔',
        fallbackCertTitle: 'انڈرگریجویٹ کورس ورک',
        fallbackCertIssuer: 'گوٹیک — پہلا سمسٹر بی ایس سی ایس (C++)',
        emptyProjects: 'اس فلٹر کے مطابق کوئی پروجیکٹ نہیں ملا۔ براہ کرم دوبارہ کوشش کریں۔'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Restore preference
    const savedMode = localStorage.getItem('portfolio_theme_lang');
    if (savedMode === 'ur') {
        currentMode = 'ur';
        applyMode(currentMode, false);
    }

    fetchData();
    setupEventListeners();
    setupCustomCursor();
    setupConversationalFilter();
    setupContactComposer();
    startKarachiClock();
    updateYear();
});

// --------------------------------------------------------------------------
// Data Loading
// --------------------------------------------------------------------------
async function fetchData() {
    if (window.PORTFOLIO_DATA_UR) {
        siteData.ur = window.PORTFOLIO_DATA_UR;
    }

    if (window.location.protocol === 'file:' && window.PORTFOLIO_DATA) {
        siteData.en = window.PORTFOLIO_DATA;
        renderCurrentView();
        return;
    }

    try {
        const response = await fetch('resume.json');
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        siteData.en = await response.json();
        renderCurrentView();
    } catch (err) {
        console.warn('Falling back to window.PORTFOLIO_DATA:', err);
        if (window.PORTFOLIO_DATA) {
            siteData.en = window.PORTFOLIO_DATA;
            renderCurrentView();
        }
    }
}

function renderCurrentView() {
    const data = currentMode === 'ur' ? (siteData.ur || window.PORTFOLIO_DATA_UR) : (siteData.en || window.PORTFOLIO_DATA);
    if (data) {
        renderWebsite(data);
    }
    applyStaticTranslations();
}

function applyMode(mode, shouldRerender = true) {
    const isUrdu = mode === 'ur';
    const langBtn = document.getElementById('theme-lang-toggle');

    if (isUrdu) {
        document.body.classList.add('lang-ur');
        document.documentElement.setAttribute('lang', 'ur');
        document.documentElement.setAttribute('dir', 'rtl');
        if (langBtn) {
            const en = langBtn.querySelector('.lang-code-en');
            const ur = langBtn.querySelector('.lang-code-ur');
            if (en) en.classList.remove('active');
            if (ur) ur.classList.add('active');
        }
    } else {
        document.body.classList.remove('lang-ur');
        document.documentElement.setAttribute('lang', 'en');
        document.documentElement.setAttribute('dir', 'ltr');
        if (langBtn) {
            const en = langBtn.querySelector('.lang-code-en');
            const ur = langBtn.querySelector('.lang-code-ur');
            if (en) en.classList.add('active');
            if (ur) ur.classList.remove('active');
        }
    }

    if (shouldRerender) {
        renderCurrentView();
    }
}

function applyStaticTranslations() {
    const t = UI_TRANSLATIONS[currentMode];
    
    // Nav links
    const setElem = (id, text) => {
        const el = document.getElementById(id);
        if (el) {
            const idx = el.querySelector('.nav-idx');
            if (idx) {
                el.innerHTML = `<span class="nav-idx">${idx.textContent}</span> ${text}`;
            } else {
                el.textContent = text;
            }
        }
    };

    setElem('nav-about', t.navAbout);
    setElem('nav-projects', t.navProjects);
    setElem('nav-skills', t.navSkills);
    setElem('nav-experience', t.navExperience);
    setElem('nav-leetcode', t.navLeetCode);
    setElem('nav-resume', t.navResume);
    setElem('nav-contact', t.navContact);
    setElem('nav-blog', t.navBlog);

    // Section Titles
    const setTitle = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setTitle('title-about', t.titleAbout);
    setTitle('title-projects', t.titleProjects);
    setTitle('title-skills', t.titleSkills);
    setTitle('title-experience', t.titleExperience);
    setTitle('title-leetcode', t.titleLeetCode);
    setTitle('title-resume', t.titleResume);
    setTitle('title-education', t.titleEducation);

    // Buttons
    const heroBtnProjects = document.getElementById('hero-btn-projects');
    if (heroBtnProjects) {
        const arrow = heroBtnProjects.querySelector('.btn-arrow');
        heroBtnProjects.innerHTML = `<span>${t.heroBtnProjects}</span> ${arrow ? arrow.outerHTML : '&rarr;'}`;
    }
    const heroBtnInquire = document.getElementById('hero-btn-inquire');
    if (heroBtnInquire) {
        heroBtnInquire.innerHTML = `<span>${t.heroBtnInquire}</span>`;
    }
}

// --------------------------------------------------------------------------
// Core Website Renderers
// --------------------------------------------------------------------------
function renderWebsite(data) {
    if (!data) return;
    if (data.basics) renderHero(data.basics);
    if (data.about) renderAbout(data.about);
    if (data.skills) renderSkills(data.skills);
    renderWork(data.work);
    renderProjects(data.projects);
    renderLeetCode(data.leetcode);
    renderResume(data.resume, data.basics);
    if (data.education) renderEducation(data.education);
    renderCertificates(data.certificates);
    if (data.basics) renderFooter(data.basics);
}

function renderHero(basics) {
    const heroName = document.getElementById('hero-name');
    const heroLabel = document.getElementById('hero-label');
    const heroHeadline = document.getElementById('hero-headline');
    const navBrandName = document.getElementById('nav-brand-name');
    const logo = document.getElementById('logo');

    if (heroName) heroName.textContent = basics.name;
    if (navBrandName) navBrandName.textContent = basics.name;
    if (heroLabel) heroLabel.textContent = basics.label;
    if (heroHeadline) heroHeadline.textContent = basics.headline;
    if (logo) logo.textContent = basics.shortName || 'MU';

    const socialLinks = document.getElementById('social-links');
    if (socialLinks && basics.profiles) {
        socialLinks.innerHTML = basics.profiles.map(p => `
            <a href="${p.url}" target="_blank" rel="noopener noreferrer" title="${p.network}">
                <i class="${p.icon}"></i>
                <span>${p.network}</span>
            </a>
        `).join('');
    }
}

function renderAbout(about) {
    const introDiv = document.getElementById('about-intro');
    if (introDiv && about.intro) {
        introDiv.innerHTML = about.intro.map(p => `<p>${p}</p>`).join('');
    }

    const metricsDiv = document.getElementById('about-metrics');
    if (metricsDiv && about.metrics) {
        metricsDiv.innerHTML = about.metrics.map((m, i) => `
            <div class="stat-card">
                <span class="stat-value">${m.value}</span>
                <span class="stat-label">[0${i + 1}] ${m.label}</span>
            </div>
        `).join('');
    }

    const pillarsDiv = document.getElementById('leadership-pillars');
    if (pillarsDiv && about.leadershipPillars) {
        pillarsDiv.innerHTML = about.leadershipPillars.map(pillar => `
            <div class="pillar-card">
                <h3>${pillar.title}</h3>
                <p>${pillar.description}</p>
            </div>
        `).join('');
    }
}

// Global store for project filtering
let allProjectsData = [];

function renderProjects(projects) {
    allProjectsData = projects || [];
    filterAndDisplayProjects('all', '');
}

function filterAndDisplayProjects(filterCategory, queryText) {
    const t = UI_TRANSLATIONS[currentMode];
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    if (!allProjectsData || allProjectsData.length === 0) {
        grid.innerHTML = `<p class="section-editorial-desc" style="grid-column: 1/-1; text-align: center; padding: 3rem;">${t.emptyProjects}</p>`;
        return;
    }

    const q = (queryText || '').toLowerCase().trim();

    const filtered = allProjectsData.filter(proj => {
        // Query text match
        const matchText = !q || 
            proj.title.toLowerCase().includes(q) ||
            proj.description.toLowerCase().includes(q) ||
            (proj.stack && proj.stack.some(s => s.toLowerCase().includes(q))) ||
            (proj.outcome && proj.outcome.toLowerCase().includes(q));

        if (!matchText) return false;

        // Category filter match
        if (!filterCategory || filterCategory === 'all') return true;

        const stackStr = ((proj.stack || []).join(' ') + ' ' + proj.title + ' ' + proj.description).toLowerCase();
        
        if (filterCategory === 'systems') {
            return stackStr.includes('c++') || stackStr.includes('oop') || stackStr.includes('algorithm') || stackStr.includes('record');
        }
        if (filterCategory === 'wellbeing') {
            return stackStr.includes('unscroll') || stackStr.includes('well-being') || stackStr.includes('telemetry') || stackStr.includes('chart');
        }
        if (filterCategory === 'commerce') {
            return stackStr.includes('bizzone') || stackStr.includes('commerce') || stackStr.includes('store') || stackStr.includes('cart');
        }
        if (filterCategory === 'academic') {
            return stackStr.includes('gutech') || stackStr.includes('portal') || stackStr.includes('academic') || stackStr.includes('student');
        }
        return true;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<p class="section-editorial-desc" style="grid-column: 1/-1; text-align: center; padding: 3rem;">${t.emptyProjects}</p>`;
        return;
    }

    grid.innerHTML = filtered.map((proj, idx) => `
        <article class="project-card">
            <div class="project-img-wrapper">
                ${proj.image ? `
                    <img src="${proj.image}" alt="${proj.title}" class="project-img" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\'font-family: var(--font-heading); font-size: 2.5rem; color: var(--apple-white);\'>${proj.title.slice(0, 2).toUpperCase()}</div>';">
                ` : `
                    <div style="font-family: var(--font-heading); font-size: 2.5rem; color: var(--apple-white);">${proj.title.slice(0, 2).toUpperCase()}</div>
                `}
            </div>
            <div class="project-info">
                <div>
                    <div class="project-archival-index">[ ENTRY NO. 0${idx + 1} / 04 ]</div>
                    <h3>${proj.title}</h3>
                    <p>${proj.description}</p>
                    <div class="project-stack">
                        ${(proj.stack || []).map(s => `<span class="stack-tag">${s}</span>`).join('')}
                    </div>
                    ${proj.outcome ? `
                        <p class="project-outcome">
                            <strong>${t.outcomeLabel}</strong> ${proj.outcome}
                        </p>
                    ` : ''}
                </div>
                <div class="project-links">
                    ${proj.liveUrl && proj.liveUrl !== '#' ? `
                        <a href="${proj.liveUrl}" target="_blank" rel="noopener noreferrer">
                            <i class="fas fa-external-link-alt"></i> ${t.websiteBtn}
                        </a>
                    ` : ''}
                    ${proj.codeUrl ? `
                        <a href="${proj.codeUrl}" target="_blank" rel="noopener noreferrer">
                            <i class="fab fa-github"></i> ${t.codeBtn}
                        </a>
                    ` : ''}
                </div>
            </div>
        </article>
    `).join('');
}

function renderSkills(skills) {
    const skillsGrid = document.getElementById('skills-grid');
    if (!skillsGrid || !skills) return;

    skillsGrid.innerHTML = skills.map(s => `
        <div class="skill-category">
            <h3>${s.category}</h3>
            <div class="skill-tags">
                ${s.items.map(item => `<span class="skill-tag">${item}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

function renderWork(work) {
    const t = UI_TRANSLATIONS[currentMode];
    const container = document.getElementById('work-experience');
    if (!container) return;

    if (!work || work.length === 0) {
        container.innerHTML = `
            <div class="timeline-item">
                <div class="timeline-date-col">${t.fallbackWorkDate}</div>
                <div class="work-card">
                    <h3>${t.fallbackWorkTitle}</h3>
                    <span class="company-link">${t.fallbackWorkCompany}</span>
                    <p>${t.fallbackWorkSummary}</p>
                    <div class="work-impact">
                        <strong>${currentMode === 'ur' ? 'اہم فوکس:' : 'Core Focus:'}</strong> ${t.fallbackWorkImpact}
                    </div>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = work.map(w => `
        <div class="timeline-item">
            <div class="timeline-date-col">
                ${formatDate(w.startDate)} — ${w.endDate ? formatDate(w.endDate) : (currentMode === 'ur' ? 'جاری' : 'Present')}
            </div>
            <div class="work-card">
                <h3>${w.position}</h3>
                <span class="company-link">${w.company}</span>
                <p>${w.summary}</p>
                <div class="work-impact">
                    <strong>${currentMode === 'ur' ? 'اہم عملی اثر:' : 'Operational Impact:'}</strong> ${w.impact}
                </div>
            </div>
        </div>
    `).join('');
}

function renderLeetCode(leetcode) {
    const lcCard = document.getElementById('leetcode-card');
    if (!lcCard) return;

    const lc = leetcode || {
        username: 'mohammadumarjawad64',
        url: 'https://leetcode.com/u/mohammadumarjawad64/',
        solved: 58,
        easy: 38,
        medium: 18,
        hard: 2,
        acceptance: '68.4%',
        ranking: 'Top 25%',
        skills: ['C++', 'Arrays & Strings', 'Two Pointers', 'Hash Table', 'Sorting', 'Logic & Math']
    };

    lcCard.innerHTML = `
        <div class="lc-left-col">
            <div>
                <div class="lc-brand">
                    <div class="lc-icon"><i class="fas fa-terminal"></i></div>
                    <div class="lc-profile-info">
                        <h3>${lc.username}</h3>
                        <p>${currentMode === 'ur' ? 'الگورتھم تجزیہ کار' : 'Algorithmic Track'}</p>
                    </div>
                </div>
                <div class="lc-total-box">
                    <div class="lc-total-number">${lc.solved}+</div>
                    <div class="lc-total-label">${currentMode === 'ur' ? 'حل شدہ مسائل' : 'Problems Solved'}</div>
                </div>
            </div>
            <a href="${lc.url}" target="_blank" rel="noopener noreferrer" class="editorial-btn primary" style="width: 100%; justify-content: center;">
                <span>${currentMode === 'ur' ? 'لیٹ کوڈ پروفائل دیکھیں' : 'Inspect LeetCode Profile'}</span>
                <span class="btn-arrow">&rarr;</span>
            </a>
        </div>
        <div class="lc-right-col">
            <div class="lc-breakdown">
                <div class="lc-diff-row">
                    <div class="lc-diff-header">
                        <span class="diff-easy"><i class="fas fa-circle" style="font-size: 0.55rem;"></i> ${currentMode === 'ur' ? 'آسان (Easy)' : 'Easy Level'}</span>
                        <span class="diff-easy">${lc.easy} Solved</span>
                    </div>
                    <div class="lc-progress-bar"><div class="lc-progress-fill fill-easy" style="width: 70%;"></div></div>
                </div>
                <div class="lc-diff-row">
                    <div class="lc-diff-header">
                        <span class="diff-med"><i class="fas fa-circle" style="font-size: 0.55rem;"></i> ${currentMode === 'ur' ? 'درمیانہ (Medium)' : 'Medium Level'}</span>
                        <span class="diff-med">${lc.medium} Solved</span>
                    </div>
                    <div class="lc-progress-bar"><div class="lc-progress-fill fill-med" style="width: 45%;"></div></div>
                </div>
                <div class="lc-diff-row">
                    <div class="lc-diff-header">
                        <span class="diff-hard"><i class="fas fa-circle" style="font-size: 0.55rem;"></i> ${currentMode === 'ur' ? 'مشکل (Hard)' : 'Hard Level'}</span>
                        <span class="diff-hard">${lc.hard} Solved</span>
                    </div>
                    <div class="lc-progress-bar"><div class="lc-progress-fill fill-hard" style="width: 15%;"></div></div>
                </div>
            </div>
            <div class="lc-meta-row">
                <div>
                    <span style="font-size: 0.65rem; color: var(--text-muted); display: block; letter-spacing: 0.16em;">${currentMode === 'ur' ? 'درستگی کی شرح' : 'ACCEPTANCE RATIO'}</span>
                    <strong style="color: var(--apple-white); font-size: 1.15rem;">${lc.acceptance}</strong>
                </div>
                <div>
                    <span style="font-size: 0.65rem; color: var(--text-muted); display: block; letter-spacing: 0.16em;">${currentMode === 'ur' ? 'عالمی درجہ بندی' : 'GLOBAL PERCENTILE'}</span>
                    <strong style="color: var(--verdant); font-size: 1.15rem;">${lc.ranking}</strong>
                </div>
            </div>
            <div class="lc-tags-title">${currentMode === 'ur' ? 'بنیادی تکنیکی موضوعات' : 'CORE TAXONOMY & PATTERNS'}</div>
            <div class="lc-tags-cloud">
                ${(lc.skills || []).map(s => `<span class="lc-tag">${s}</span>`).join('')}
            </div>
        </div>
    `;
}

function renderResume(resume, basics) {
    const card = document.getElementById('resume-card');
    if (!card) return;
    const b = basics || {};

    card.innerHTML = `
        <div class="resume-header-badge">
            <i class="fas fa-file-code"></i> ${currentMode === 'ur' ? 'لیٹیک (LaTeX) پروفیشنل سی وی' : 'LaTeX Manuscript • Standard Tech CV'}
        </div>
        <div class="resume-intro-grid">
            <div class="resume-intro-text">
                <h3>${currentMode === 'ur' ? 'پیشہ ورانہ تعلیمی و فنی ریکارڈ' : 'Engineered Curriculum Vitae'}</h3>
                <p>
                    ${currentMode === 'ur'
                        ? 'کمپیوٹر سائنس کی تعلیم، انٹرمیڈیٹ فاؤنڈیشن، فیملی بزنس میں آپریشنل تجربہ اور تیار کردہ جدید سافٹ ویئر سسٹمز پر مشتمل جامع دستاویز۔'
                        : 'A clean, ATS-optimized engineering resume detailing academic study at GUTECH, hands-on commercial operations, core C++ mechanics, and deployed software systems.'}
                </p>
                <div class="resume-highlights">
                    <div class="resume-highlight-item"><i class="fas fa-check"></i> <span><strong>${currentMode === 'ur' ? 'تعلیم:' : 'Academic Seat:'}</strong> GUTECH BSCS • Sindh Board (HSC &amp; SSC)</span></div>
                    <div class="resume-highlight-item"><i class="fas fa-check"></i> <span><strong>${currentMode === 'ur' ? 'پروجیکٹس:' : 'Systems:'}</strong> Unscroll (Vercel Live), Bizzone E-Commerce, GUtech Portal, C++ OOP</span></div>
                    <div class="resume-highlight-item"><i class="fas fa-check"></i> <span><strong>${currentMode === 'ur' ? 'تجربہ:' : 'Commercial Record:'}</strong> Family Commercial Business (2 Years, Operations &amp; Inventory)</span></div>
                    <div class="resume-highlight-item"><i class="fas fa-check"></i> <span><strong>${currentMode === 'ur' ? 'رابطہ:' : 'Coordinates:'}</strong> Karachi (KAECHS Block 5) • (0307) 2066060</span></div>
                </div>
            </div>
            <div class="resume-paper-preview">
                <div class="preview-name">${b.name || 'Muhammad Umar'}</div>
                <div class="preview-line"><strong>Coordinates:</strong> Karachi, Pakistan</div>
                <div class="preview-line"><strong>Candidacy:</strong> GUTECH (BSCS) • Sindh Board (HSC)</div>
                <div class="preview-line"><strong>Disciplines:</strong> C++, JavaScript, HTML5/CSS3, SQL, Git</div>
                <div class="preview-line"><strong>Deployments:</strong> Unscroll (Vercel) • Bizzone • Console OOP</div>
                <div style="margin-top: 1rem; padding-top: 0.5rem; border-top: 1px dashed var(--hairline); font-size: 0.72rem; color: var(--text-muted); text-align: center;">
                    <i class="fas fa-file-pdf"></i> Standard 1-Page Jake's Resume / Overleaf Standard
                </div>
            </div>
        </div>
        <div class="resume-cta-group">
            <a href="resume.html" target="_blank" class="editorial-btn primary">
                <i class="fas fa-eye"></i> <span>${currentMode === 'ur' ? 'سی وی دیکھیں (ویب)' : 'Inspect Resume (HTML)'}</span>
            </a>
            <a href="resume.html" target="_blank" onclick="window.open('resume.html');" class="editorial-btn secondary">
                <i class="fas fa-print"></i> <span>${currentMode === 'ur' ? 'پرنٹ / پی ڈی ایف' : 'Print / Export PDF'}</span>
            </a>
            <a href="resume.tex" download="Muhammad_Umar_Resume.tex" class="editorial-btn secondary">
                <i class="fas fa-file-code"></i> <span>${currentMode === 'ur' ? 'لیٹیک سورس (.tex)' : 'LaTeX Source (.tex)'}</span>
            </a>
        </div>
    `;
}

function renderEducation(education) {
    const list = document.getElementById('education-list');
    if (!list || !education) return;

    list.innerHTML = education.map(edu => {
        const titleText = currentMode === 'ur'
            ? (edu.area && !edu.studyType.includes(edu.area) ? `${edu.studyType} (${edu.area})` : edu.studyType)
            : (edu.area && !edu.studyType.includes(edu.area) ? `${edu.studyType} in ${edu.area}` : edu.studyType);

        let dateRange = '';
        if (edu.startDate && edu.endDate) {
            dateRange = `${formatDate(edu.startDate)} — ${formatDate(edu.endDate)}`;
        } else if (edu.startDate) {
            dateRange = `${formatDate(edu.startDate)} — ${currentMode === 'ur' ? 'جاری' : 'Present'}`;
        } else if (edu.status) {
            dateRange = currentMode === 'ur' ? '2026 — جاری (پہلا سمسٹر)' : '2026 — Present (First Semester)';
        }

        return `
            <div class="edu-item">
                <h3>${titleText}</h3>
                <p><strong>${edu.institution}${edu.campus ? ` (${edu.campus})` : ''}</strong></p>
                ${dateRange ? `<p style="font-family: var(--font-meta); font-size: 0.75rem; color: var(--mocha); margin-top: 0.25rem;">${dateRange}</p>` : ''}
            </div>
        `;
    }).join('');
}

function renderCertificates(certificates) {
    const list = document.getElementById('cert-list');
    if (!list) return;

    const t = UI_TRANSLATIONS[currentMode];
    if (!certificates || certificates.length === 0) {
        list.innerHTML = `
            <div class="cert-card" style="cursor: default;">
                <div class="cert-icon"><i class="fas fa-scroll"></i></div>
                <div>
                    <strong style="color: var(--apple-white); font-family: var(--font-heading);">${t.fallbackCertTitle}</strong>
                    <p style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-meta);">${t.fallbackCertIssuer}</p>
                </div>
            </div>
        `;
        return;
    }

    list.innerHTML = certificates.map(c => `
        <a href="${c.url || '#'}" target="_blank" class="cert-card">
            <div class="cert-icon"><i class="fas fa-certificate"></i></div>
            <div>
                <strong style="color: var(--apple-white); font-family: var(--font-heading);">${c.name}</strong>
                <p style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-meta);">${c.issuer}</p>
            </div>
        </a>
    `).join('');
}

function renderFooter(basics) {
    const footerName = document.getElementById('footer-name');
    const footerSocial = document.getElementById('footer-social');
    if (footerName) footerName.textContent = basics.name;
    if (footerSocial && basics.profiles) {
        footerSocial.innerHTML = basics.profiles.map(p => `
            <a href="${p.url}" target="_blank" rel="noopener noreferrer" title="${p.network}">
                <i class="${p.icon}"></i>
            </a>
        `).join('');
    }
}

// --------------------------------------------------------------------------
// Interactive Custom Cursor
// --------------------------------------------------------------------------
function setupCustomCursor() {
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;

    window.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    });

    function renderRing() {
        ringX += (mouseX - ringX) * 0.15;
        ringY += (mouseY - ringY) * 0.15;
        ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
        requestAnimationFrame(renderRing);
    }
    requestAnimationFrame(renderRing);

    // Expand on hover
    document.addEventListener('mouseover', e => {
        const target = e.target.closest('a, button, input, textarea, .project-card, .intent-chip, .stat-card, .cert-card');
        if (target) {
            document.body.classList.add('cursor-hover');
        } else {
            document.body.classList.remove('cursor-hover');
        }
    });
}

// --------------------------------------------------------------------------
// Conversational Intent Filter
// --------------------------------------------------------------------------
function setupConversationalFilter() {
    const input = document.getElementById('conversational-filter-input');
    const resetBtn = document.getElementById('filter-reset-btn');
    const chipContainer = document.getElementById('intent-chips');

    let currentCategory = 'all';

    if (input) {
        input.addEventListener('input', () => {
            filterAndDisplayProjects(currentCategory, input.value);
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (input) input.value = '';
            currentCategory = 'all';
            if (chipContainer) {
                chipContainer.querySelectorAll('.intent-chip').forEach(c => {
                    c.classList.toggle('active', c.dataset.filter === 'all');
                });
            }
            filterAndDisplayProjects('all', '');
        });
    }

    if (chipContainer) {
        chipContainer.addEventListener('click', e => {
            const chip = e.target.closest('.intent-chip');
            if (!chip) return;

            chipContainer.querySelectorAll('.intent-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            currentCategory = chip.dataset.filter || 'all';
            filterAndDisplayProjects(currentCategory, input ? input.value : '');
        });
    }
}

// --------------------------------------------------------------------------
// Conversational Dispatch Composer
// --------------------------------------------------------------------------
function setupContactComposer() {
    const intentBtns = document.querySelectorAll('.intent-btn');
    const subjectInput = document.getElementById('inquiry-subject');
    const messageInput = document.getElementById('inquiry-message');
    const form = document.getElementById('conversational-contact-form');
    const copyBtn = document.getElementById('copy-dispatch-btn');
    const feedback = document.getElementById('dispatch-feedback');

    const templates = {
        internship: {
            subject: 'Inquiry: Summer 2026 Software Engineering Internship Opportunity',
            message: 'Hello Muhammad,\n\nI reviewed your portfolio and academic focus at GUTECH. We have an opening for a software engineering internship and would like to invite you for a preliminary discussion.\n\nBest regards,'
        },
        project: {
            subject: 'Collaboration: Software Project Architecture & Engineering',
            message: 'Hello Muhammad,\n\nI am impressed by your disciplined approach to systems and programming. I would like to discuss building a project with you regarding...\n\nBest regards,'
        },
        dialogue: {
            subject: 'Intellectual Exchange: Computer Science Foundations & Systems',
            message: 'Hello Muhammad,\n\nI noticed your focus on first-semester computer science rigor, C++, and algorithms. I would like to connect and share thoughts on...\n\nBest regards,'
        }
    };

    intentBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            intentBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const intent = btn.dataset.intent;
            if (templates[intent]) {
                if (subjectInput) subjectInput.value = templates[intent].subject;
                if (messageInput) messageInput.value = templates[intent].message;
            }
        });
    });

    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const name = document.getElementById('inquiry-name')?.value || '';
            const subject = subjectInput ? subjectInput.value : 'Portfolio Inquiry';
            const message = messageInput ? messageInput.value : '';

            const bodyContent = `${message}\n\nTransmitted by: ${name}`;
            const mailtoUrl = `mailto:Mohammadumarjawad64@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyContent)}`;

            window.location.href = mailtoUrl;

            if (feedback) {
                feedback.textContent = 'Transmission opened in your email client. Awaiting dispatch.';
                setTimeout(() => { feedback.textContent = ''; }, 6000);
            }
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const subject = subjectInput ? subjectInput.value : '';
            const message = messageInput ? messageInput.value : '';
            const textToCopy = `Subject: ${subject}\n\n${message}`;

            navigator.clipboard.writeText(textToCopy).then(() => {
                if (feedback) {
                    feedback.textContent = '✓ Transmission copied to clipboard.';
                    setTimeout(() => { feedback.textContent = ''; }, 4000);
                }
            }).catch(() => {
                if (feedback) feedback.textContent = 'Unable to copy transmission.';
            });
        });
    }
}

// --------------------------------------------------------------------------
// Event Listeners & Global Helpers
// --------------------------------------------------------------------------
function setupEventListeners() {
    // Menu mobile toggle
    const menuBtn = document.querySelector('.menu-btn');
    const navLinks = document.querySelector('.nav-links');
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
        navLinks.querySelectorAll('a').forEach(l => {
            l.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

    // Language switch button
    const toggleBtn = document.getElementById('theme-lang-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            currentMode = currentMode === 'en' ? 'ur' : 'en';
            localStorage.setItem('portfolio_theme_lang', currentMode);
            applyMode(currentMode, true);
        });
    }
}

function startKarachiClock() {
    const clockEl = document.getElementById('karachi-clock');
    if (!clockEl) return;

    function tick() {
        const now = new Date();
        const options = {
            timeZone: 'Asia/Karachi',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        const timeStr = new Intl.DateTimeFormat('en-GB', options).format(now);
        clockEl.textContent = `${timeStr} PKT (UTC+5)`;
    }
    tick();
    setInterval(tick, 1000);
}

function updateYear() {
    const el = document.getElementById('current-year');
    if (el) el.textContent = new Date().getFullYear();
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    if (isNaN(Date.parse(dateStr))) return dateStr;
    const date = new Date(dateStr);
    const locale = currentMode === 'ur' ? 'ur-PK' : 'en-US';
    return date.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
}
