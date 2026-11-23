// State & Translations
let currentMode = 'en'; // 'en' or 'ur'
let siteData = {
    en: null,
    ur: null
};

const UI_TRANSLATIONS = {
    en: {
        navAbout: 'About',
        navSkills: 'Skills',
        navExperience: 'Experience',
        navProjects: 'Projects',
        navEducation: 'Education',
        navLeetCode: 'LeetCode',
        navResume: 'Resume',
        titleLeetCode: 'LeetCode Problem Solving',
        titleResume: 'Curriculum Vitae',
        heroBtnSkills: 'View Skills',
        heroBtnProjects: 'See Projects',
        titleAbout: 'About Me',
        titleSkills: 'Technical Expertise',
        titleExperience: 'Work Experience',
        titleProjects: 'Featured Projects',
        titleEducation: 'Education & Certifications',
        footerTagline: 'Aspiring Computer Scientist.',
        switchText: 'اردو / Gray',
        switchTitle: 'Switch to Urdu & Gray/Black Theme',
        switchAria: 'Switch to Urdu and Gray Theme',
        websiteBtn: 'Website',
        codeBtn: 'Code',
        outcomeLabel: 'Outcome:',
        currentFocusLabel: 'Current Focus:',
        fallbackWorkTitle: 'Academic Study & Computer Science Foundations',
        fallbackWorkDate: '2026 — Present',
        fallbackWorkCompany: 'GUTECH — First Semester BSCS',
        fallbackWorkSummary: 'Focusing on rigorous programming fundamentals, learning C++, mastering algorithmic problem solving, and preparing for future technology internships and software engineering opportunities.',
        fallbackWorkImpact: 'Developing strong programming habits, logical thinking, and computer science principles.',
        fallbackCertTitle: 'Undergraduate CS Coursework',
        fallbackCertIssuer: 'GUTECH — First Semester BSCS (C++, Computing Fundamentals)',
        emptyProjects: 'Projects currently in development. Check back soon!'
    },
    ur: {
        navAbout: 'تعارف',
        navSkills: 'مہارتیں',
        navExperience: 'تجربہ',
        navProjects: 'پروجیکٹس',
        navEducation: 'تعلیم',
        navLeetCode: 'لیٹ کوڈ',
        navResume: 'سی وی',
        titleLeetCode: 'لیٹ کوڈ الگورتھمز اور مسائل کا حل',
        titleResume: 'سی وی اور تعلیمی ریکارڈ',
        heroBtnSkills: 'مہارتیں دیکھیں',
        heroBtnProjects: 'پروجیکٹس دیکھیں',
        titleAbout: 'میرے بارے میں',
        titleSkills: 'تکنیکی مہارتیں',
        titleExperience: 'تعلیمی و عملی سفر',
        titleProjects: 'نمایاں پروجیکٹس',
        titleEducation: 'تعلیم اور اسناد',
        footerTagline: 'پرعزم کمپیوٹر سائنٹسٹ۔',
        switchText: 'English / Navy',
        switchTitle: 'Switch to English & Navy Theme',
        switchAria: 'انگریزی اور نیوی تھیم پر واپس جائیں',
        websiteBtn: 'ویب سائٹ',
        codeBtn: 'کوڈ',
        outcomeLabel: 'حاصل شدہ نتیجہ:',
        currentFocusLabel: 'موجودہ فوکس:',
        fallbackWorkTitle: 'تعلیمی مطالعہ اور کمپیوٹر سائنس کی بنیادیں',
        fallbackWorkDate: '2026 — جاری',
        fallbackWorkCompany: 'گوٹیک (GUTECH) — پہلا سمسٹر BSCS',
        fallbackWorkSummary: 'پروگرامنگ کے بنیادی اصولوں، C++ سیکھنے، الگورتھم اور مسائل کے حل پر گہری توجہ مرکوز ہے تاکہ مستقبل کی انٹرن شپس اور سافٹ ویئر انجینئرنگ کے مواقع کے لیے تیاری کی جا سکے۔',
        fallbackWorkImpact: 'پروگرامنگ کی مضبوط عادات، منطقی سوچ اور کمپیوٹر سائنس کے بنیادی اصولوں کو پختہ کرنا۔',
        fallbackCertTitle: 'انڈرگریجویٹ سی ایس کورس ورک',
        fallbackCertIssuer: 'گوٹیک — پہلا سمسٹر بی ایس سی ایس (C++ اور بنیادی کمپیوٹر سائنس)',
        emptyProjects: 'پروجیکٹس اس وقت تیاری کے مراحل میں ہیں۔ جلد ملاحظہ فرمائیں!'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Restore preference from localStorage if saved
    const savedMode = localStorage.getItem('portfolio_theme_lang');
    if (savedMode === 'ur') {
        currentMode = 'ur';
        applyMode(currentMode, false);
    }

    fetchData();
    setupEventListeners();
    updateYear();
});

async function fetchData() {
    // Set Urdu fallback data
    if (window.PORTFOLIO_DATA_UR) {
        siteData.ur = window.PORTFOLIO_DATA_UR;
    }

    // Check if running via file:// protocol
    if (window.location.protocol === 'file:' && window.PORTFOLIO_DATA) {
        console.info('Viewing via file:// protocol: loaded data directly from data.js');
        siteData.en = window.PORTFOLIO_DATA;
        renderCurrentView();
        return;
    }

    try {
        const response = await fetch('resume.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        siteData.en = await response.json();
        renderCurrentView();
    } catch (error) {
        console.warn('Could not fetch resume.json, trying fallback data:', error);
        if (window.PORTFOLIO_DATA) {
            siteData.en = window.PORTFOLIO_DATA;
            renderCurrentView();
        } else {
            document.getElementById('hero-name').textContent = 'Error Loading Data';
            document.getElementById('hero-headline').textContent = 'Failed to load resume.json. Check the console (F12) for more details.';
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
    
    // Toggle theme and language classes
    if (isUrdu) {
        document.body.classList.add('theme-gray-black');
        document.body.classList.add('lang-ur');
        document.documentElement.setAttribute('lang', 'ur');
        document.documentElement.setAttribute('dir', 'rtl');
    } else {
        document.body.classList.remove('theme-gray-black');
        document.body.classList.remove('lang-ur');
        document.documentElement.setAttribute('lang', 'en');
        document.documentElement.setAttribute('dir', 'ltr');
    }

    // Update toggle button text and attributes
    const t = UI_TRANSLATIONS[mode];
    const switchText = document.getElementById('switch-text');
    const toggleBtn = document.getElementById('theme-lang-toggle');
    if (switchText) switchText.textContent = t.switchText;
    if (toggleBtn) {
        toggleBtn.setAttribute('title', t.switchTitle);
        toggleBtn.setAttribute('aria-label', t.switchAria);
    }

    if (shouldRerender) {
        renderCurrentView();
    }
}

function applyStaticTranslations() {
    const t = UI_TRANSLATIONS[currentMode];
    
    // Nav links
    const navAbout = document.getElementById('nav-about');
    const navSkills = document.getElementById('nav-skills');
    const navExperience = document.getElementById('nav-experience');
    const navProjects = document.getElementById('nav-projects');
    const navEducation = document.getElementById('nav-education');
    if (navAbout) navAbout.textContent = t.navAbout;
    if (navSkills) navSkills.textContent = t.navSkills;
    if (navExperience) navExperience.textContent = t.navExperience;
    if (navProjects) navProjects.textContent = t.navProjects;
    if (navEducation) navEducation.textContent = t.navEducation;
    const navLeetCode = document.getElementById('nav-leetcode');
    const navResume = document.getElementById('nav-resume');
    if (navLeetCode) navLeetCode.innerHTML = '<i class="fas fa-code"></i> ' + (t.navLeetCode || 'LeetCode');
    if (navResume) navResume.innerHTML = '<i class="fas fa-file-alt"></i> ' + (t.navResume || 'Resume');

    // CTA buttons
    const heroBtnSkills = document.getElementById('hero-btn-skills');
    const heroBtnProjects = document.getElementById('hero-btn-projects');
    if (heroBtnSkills) heroBtnSkills.textContent = t.heroBtnSkills;
    if (heroBtnProjects) heroBtnProjects.textContent = t.heroBtnProjects;

    // Section titles
    const titleAbout = document.getElementById('title-about');
    const titleSkills = document.getElementById('title-skills');
    const titleExperience = document.getElementById('title-experience');
    const titleProjects = document.getElementById('title-projects');
    const titleEducation = document.getElementById('title-education');
    if (titleAbout) titleAbout.textContent = t.titleAbout;
    if (titleSkills) titleSkills.textContent = t.titleSkills;
    if (titleExperience) titleExperience.textContent = t.titleExperience;
    if (titleProjects) titleProjects.textContent = t.titleProjects;
    if (titleEducation) titleEducation.textContent = t.titleEducation;
    const titleLeetCode = document.getElementById('title-leetcode');
    const titleResume = document.getElementById('title-resume');
    if (titleLeetCode) titleLeetCode.textContent = t.titleLeetCode || 'LeetCode Problem Solving';
    if (titleResume) titleResume.textContent = t.titleResume || 'Curriculum Vitae';

    // Footer tagline
    const footerTagline = document.getElementById('footer-tagline');
    if (footerTagline) footerTagline.textContent = t.footerTagline;

    // Switch button label
    const switchText = document.getElementById('switch-text');
    if (switchText) switchText.textContent = t.switchText;
}

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
    document.getElementById('hero-name').textContent = basics.name;
    document.getElementById('hero-label').textContent = basics.label;
    document.getElementById('hero-headline').textContent = basics.headline;
    document.getElementById('logo').textContent = basics.shortName;

    // Connect profile image from data
    const heroImg = document.getElementById('hero-image');
    const fallbackSvg = document.getElementById('avatar-svg-fallback');
    if (heroImg) {
        heroImg.alt = '';
        if (basics.image) {
            heroImg.src = basics.image;
            heroImg.onload = () => {
                heroImg.style.display = 'block';
                if (fallbackSvg) fallbackSvg.style.display = 'none';
            };
            heroImg.onerror = () => {
                heroImg.style.display = 'none';
                if (fallbackSvg) fallbackSvg.style.display = 'block';
            };
        } else if (fallbackSvg) {
            heroImg.style.display = 'none';
            fallbackSvg.style.display = 'block';
        }
    }

    const socialLinks = document.getElementById('social-links');
    socialLinks.innerHTML = basics.profiles.map(profile => `
        <a href="${profile.url}" target="_blank" title="${profile.network}">
            <i class="${profile.icon}"></i>
        </a>
    `).join('');
}

function renderAbout(about) {
    const introDiv = document.getElementById('about-intro');
    introDiv.innerHTML = about.intro.map(p => `<p>${p}</p>`).join('');

    const metricsDiv = document.getElementById('about-metrics');
    metricsDiv.innerHTML = about.metrics.map(metric => `
        <div class="stat-card">
            <span class="stat-value">${metric.value}</span>
            <span class="stat-label">${metric.label}</span>
        </div>
    `).join('');

    const pillarsDiv = document.getElementById('leadership-pillars');
    pillarsDiv.innerHTML = about.leadershipPillars.map(pillar => `
        <div class="pillar-card">
            <h3>${pillar.title}</h3>
            <p>${pillar.description}</p>
        </div>
    `).join('');
}

function renderSkills(skills) {
    const skillsGrid = document.getElementById('skills-grid');
    skillsGrid.innerHTML = skills.map(skill => `
        <div class="skill-category">
            <h3>${skill.category}</h3>
            <div class="skill-tags">
                ${skill.items.map(item => `<span class="skill-tag">${item}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

function renderWork(work) {
    const t = UI_TRANSLATIONS[currentMode];
    const workExperience = document.getElementById('work-experience');
    if (!work || work.length === 0) {
        workExperience.innerHTML = `
            <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="work-card">
                    <div class="work-header">
                        <h3>${t.fallbackWorkTitle}</h3>
                        <span class="work-date">${t.fallbackWorkDate}</span>
                    </div>
                    <a href="https://gutech.edu.pk" target="_blank" class="company-link">${t.fallbackWorkCompany}</a>
                    <p>${t.fallbackWorkSummary}</p>
                    <div class="work-impact">
                        <strong>${t.currentFocusLabel}</strong> ${t.fallbackWorkImpact}
                    </div>
                </div>
            </div>
        `;
        return;
    }
    workExperience.innerHTML = work.map(job => `
        <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="work-card">
                <div class="work-header">
                    <h3>${job.position}</h3>
                    <span class="work-date">${formatDate(job.startDate)} — ${job.endDate ? formatDate(job.endDate) : (currentMode === 'ur' ? 'جاری' : 'Present')}</span>
                </div>
                <a href="${job.website}" target="_blank" class="company-link">${job.company}</a>
                <p>${job.summary}</p>
                <div class="work-impact">
                    <strong>${currentMode === 'ur' ? 'اہم اثر:' : 'Key Impact:'}</strong> ${job.impact}
                </div>
            </div>
        </div>
    `).join('');
}

function renderProjects(projects) {
    const t = UI_TRANSLATIONS[currentMode];
    const projectsGrid = document.getElementById('projects-grid');
    if (!projects || projects.length === 0) {
        projectsGrid.innerHTML = `<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 2rem;">${t.emptyProjects}</p>`;
        return;
    }
    projectsGrid.innerHTML = projects.map(project => `
        <div class="project-card">
            ${project.image ? `
                <div class="project-img-wrapper">
                    <img src="${project.image}" alt="${project.title}" class="project-img" loading="lazy">
                </div>
            ` : ''}
            <div class="project-info">
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <div class="project-stack">
                    ${(project.stack || []).map(s => `<span class="stack-tag">${s}</span>`).join('')}
                </div>
                ${project.outcome ? `<p class="project-outcome"><strong>${t.outcomeLabel}</strong> ${project.outcome}</p>` : ''}
            </div>
            <div class="project-links">
                ${project.liveUrl && project.liveUrl !== '#' ? `<a href="${project.liveUrl}" target="_blank"><i class="fas fa-external-link-alt"></i> ${t.websiteBtn}</a>` : ''}
                ${project.codeUrl ? `<a href="${project.codeUrl}" target="_blank"><i class="fab fa-github"></i> ${t.codeBtn}</a>` : ''}
            </div>
        </div>
    `).join('');
}

function renderEducation(education) {
    const educationList = document.getElementById('education-list');
    educationList.innerHTML = education.map(edu => {
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
                ${dateRange ? `<p class="text-muted">${dateRange}</p>` : ''}
            </div>
        `;
    }).join('');
}

function renderCertificates(certificates) {
    const t = UI_TRANSLATIONS[currentMode];
    const certList = document.getElementById('cert-list');
    if (!certificates || certificates.length === 0) {
        certList.innerHTML = `
            <div class="cert-card" style="cursor: default;">
                <div class="cert-icon"><i class="fas fa-graduation-cap"></i></div>
                <div class="cert-info">
                    <strong>${t.fallbackCertTitle}</strong>
                    <p class="text-muted" style="font-size: 0.8rem">${t.fallbackCertIssuer}</p>
                </div>
            </div>
        `;
        return;
    }
    certList.innerHTML = certificates.map(cert => `
        <a href="${cert.url}" target="_blank" class="cert-card">
            <div class="cert-icon"><i class="fas fa-certificate"></i></div>
            <div class="cert-info">
                <strong>${cert.name}</strong>
                <p class="text-muted" style="font-size: 0.8rem">${cert.issuer}</p>
            </div>
        </a>
    `).join('');
}


function renderLeetCode(leetcode) {
    const lcCard = document.getElementById('leetcode-card');
    if (!lcCard) return;
    const t = UI_TRANSLATIONS[currentMode];
    const lc = leetcode || {
        username: 'mohammadumarjawad64',
        url: 'https://leetcode.com/u/mohammadumarjawad64/',
        solved: 58,
        easy: 38,
        medium: 18,
        hard: 2,
        acceptance: '68.4%',
        ranking: 'Top 25%',
        skills: ['C++', 'Arrays & Strings', 'Two Pointers', 'Hash Table', 'Math & Logic', 'Sorting']
    };

    lcCard.innerHTML = `
        <div class="lc-left-col">
            <div class="lc-brand">
                <div class="lc-icon"><i class="fas fa-code"></i></div>
                <div class="lc-profile-info">
                    <h3>${lc.username}</h3>
                    <p>${currentMode === 'ur' ? 'لیٹ کوڈ پریکٹس پروفائل' : 'LeetCode Algorithm Practice'}</p>
                </div>
            </div>
            <div class="lc-total-box">
                <div class="lc-total-number">${lc.solved}+</div>
                <div class="lc-total-label">${currentMode === 'ur' ? 'حل شدہ سوالات' : 'Problems Solved'}</div>
            </div>
            <a href="${lc.url}" target="_blank" class="btn btn-primary" style="width: 100%; text-align: center; justify-content: center; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-external-link-alt"></i> ${currentMode === 'ur' ? 'لیٹ کوڈ پروفائل دیکھیں' : 'View LeetCode Profile'}
            </a>
        </div>
        <div class="lc-right-col">
            <div class="lc-breakdown">
                <div class="lc-diff-row">
                    <div class="lc-diff-header">
                        <span class="diff-easy"><i class="fas fa-circle" style="font-size: 0.65rem;"></i> ${currentMode === 'ur' ? 'آسان (Easy)' : 'Easy'}</span>
                        <span class="diff-easy">${lc.easy} Solved</span>
                    </div>
                    <div class="lc-progress-bar"><div class="lc-progress-fill fill-easy" style="width: 70%;"></div></div>
                </div>
                <div class="lc-diff-row">
                    <div class="lc-diff-header">
                        <span class="diff-med"><i class="fas fa-circle" style="font-size: 0.65rem;"></i> ${currentMode === 'ur' ? 'درمیانہ (Medium)' : 'Medium'}</span>
                        <span class="diff-med">${lc.medium} Solved</span>
                    </div>
                    <div class="lc-progress-bar"><div class="lc-progress-fill fill-med" style="width: 45%;"></div></div>
                </div>
                <div class="lc-diff-row">
                    <div class="lc-diff-header">
                        <span class="diff-hard"><i class="fas fa-circle" style="font-size: 0.65rem;"></i> ${currentMode === 'ur' ? 'مشکل (Hard)' : 'Hard'}</span>
                        <span class="diff-hard">${lc.hard} Solved</span>
                    </div>
                    <div class="lc-progress-bar"><div class="lc-progress-fill fill-hard" style="width: 15%;"></div></div>
                </div>
            </div>
            <div class="lc-meta-row" style="display: flex; justify-content: space-between; margin-top: 1.5rem; padding: 0.85rem 1rem; background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid var(--border-subtle);">
                <div><span style="font-size: 0.8rem; color: var(--text-muted);">${currentMode === 'ur' ? 'درستگی کی شرح' : 'Acceptance'}</span> <strong style="display: block; color: var(--white);">${lc.acceptance}</strong></div>
                <div><span style="font-size: 0.8rem; color: var(--text-muted);">${currentMode === 'ur' ? 'عالمی درجہ بندی' : 'Global Ranking'}</span> <strong style="display: block; color: var(--secondary);">${lc.ranking}</strong></div>
            </div>
            <div class="lc-tags-title">${currentMode === 'ur' ? 'بنیادی تکنیکی مہارتیں' : 'Core Topics & Algorithms'}:</div>
            <div class="lc-tags-cloud">
                ${(lc.skills || []).map(s => `<span class="lc-tag">${s}</span>`).join('')}
            </div>
        </div>
    `;
}

function renderResume(resume, basics) {
    const resumeCard = document.getElementById('resume-card');
    if (!resumeCard) return;
    const b = basics || {};
    const r = resume || {
        webUrl: 'resume.html',
        texUrl: 'resume.tex',
        format: "LaTeX (Jake's Resume / Overleaf Format)"
    };

    resumeCard.innerHTML = `
        <div class="resume-header-badge">
            <i class="fas fa-code-branch"></i> ${currentMode === 'ur' ? 'لیٹیک (LaTeX) پروفیشنل سی وی' : 'Engineered with LaTeX • Standard Tech CV'}
        </div>
        <div class="resume-intro-grid">
            <div class="resume-intro-text">
                <h3>${currentMode === 'ur' ? 'پیشہ ورانہ تعلیمی و فنی ریکارڈ' : 'Professional Engineering Resume'}</h3>
                <p>
                    ${currentMode === 'ur' 
                        ? 'کمپیوٹر سائنس کی تعلیم، انٹرمیڈیٹ فاؤنڈیشن، فیملی بزنس میں کسٹمر و آپریشنل تجربہ اور تیار کردہ جدید سافٹ ویئر پروجیکٹس پر مشتمل جامع سی وی۔'
                        : 'A clean, ATS-optimized software engineering resume detailing academic foundations at GUTECH, hands-on commercial experience in family business operations, core C++ skills, and deployed web apps.'}
                </p>
                <div class="resume-highlights">
                    <div class="resume-highlight-item"><i class="fas fa-check-circle"></i> <span><strong>${currentMode === 'ur' ? 'تعلیم:' : 'Education:'}</strong> GUTECH BSCS • Sindh Board (HSC &amp; SSC)</span></div>
                    <div class="resume-highlight-item"><i class="fas fa-check-circle"></i> <span><strong>${currentMode === 'ur' ? 'پروجیکٹس:' : 'Featured Projects:'}</strong> Unscroll (Vercel Live), Bizzone E-Commerce, GUtech Portal, C++ OOP</span></div>
                    <div class="resume-highlight-item"><i class="fas fa-check-circle"></i> <span><strong>${currentMode === 'ur' ? 'عملی تجربہ:' : 'Experience:'}</strong> Family Commercial Business (2 Years, Operations &amp; Customer Relations)</span></div>
                    <div class="resume-highlight-item"><i class="fas fa-check-circle"></i> <span><strong>${currentMode === 'ur' ? 'رابطہ:' : 'Location &amp; Contact:'}</strong> Karachi (KAECHS Block 5) • (0307) 2066060</span></div>
                </div>
            </div>
            <div class="resume-paper-preview">
                <div class="preview-name">${b.name || 'Muhammad Umar'}</div>
                <div class="preview-line"><strong>Location:</strong> Karachi (KAECHS Block 5), Pakistan</div>
                <div class="preview-line"><strong>Education:</strong> GUTECH (BSCS) • Sindh Board (HSC)</div>
                <div class="preview-line"><strong>Skills:</strong> C++, JavaScript, HTML5/CSS3, SQL, Git</div>
                <div class="preview-line"><strong>Key Work:</strong> Unscroll (Vercel) • Bizzone • Family Business</div>
                <div style="margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px dashed #cbd5e1; font-size: 0.72rem; color: #64748b; text-align: center;">
                    <i class="fas fa-file-pdf"></i> Clean 1-Page LaTeX Standard Format
                </div>
            </div>
        </div>
        <div class="resume-cta-group">
            <a href="resume.html" target="_blank" class="btn btn-primary">
                <i class="fas fa-eye"></i> ${currentMode === 'ur' ? 'سی وی دیکھیں (ویب)' : 'View Full Resume (Web)'}
            </a>
            <a href="resume.html" target="_blank" onclick="window.open('resume.html');" class="btn btn-secondary">
                <i class="fas fa-print"></i> ${currentMode === 'ur' ? 'پرنٹ / پی ڈی ایف' : 'Print / Save PDF'}
            </a>
            <a href="resume.tex" download="Muhammad_Umar_Resume.tex" class="btn btn-outline">
                <i class="fas fa-file-code"></i> ${currentMode === 'ur' ? 'لیٹیک سورس (.tex)' : 'Download LaTeX (.tex)'}
            </a>
        </div>
    `;
}

function renderFooter(basics) {
    document.getElementById('footer-name').textContent = basics.name;
    const footerSocial = document.getElementById('footer-social');
    footerSocial.innerHTML = basics.profiles.map(profile => `
        <a href="${profile.url}" target="_blank"><i class="${profile.icon}"></i></a>
    `).join('');
}

function setupEventListeners() {
    // Menu mobile button
    const menuBtn = document.querySelector('.menu-btn');
    const navLinks = document.querySelector('.nav-links');
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

    // Theme & Language Switch Button
    const toggleBtn = document.getElementById('theme-lang-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            currentMode = currentMode === 'en' ? 'ur' : 'en';
            localStorage.setItem('portfolio_theme_lang', currentMode);
            applyMode(currentMode, true);
        });
    }
}

function updateYear() {
    const yearEl = document.getElementById('current-year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    // If dateStr is already localized string (like '2026' or 'جاری')
    if (isNaN(Date.parse(dateStr))) return dateStr;
    const date = new Date(dateStr);
    const locale = currentMode === 'ur' ? 'ur-PK' : 'en-US';
    return date.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
}
