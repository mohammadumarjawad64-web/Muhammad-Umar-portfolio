document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    setupEventListeners();
    updateYear();
});

async function fetchData() {
    // If loaded via file:// protocol and fallback data is available, use it immediately
    if (window.location.protocol === 'file:' && window.PORTFOLIO_DATA) {
        console.info('Viewing via file:// protocol: loaded data directly from data.js');
        renderWebsite(window.PORTFOLIO_DATA);
        return;
    }

    try {
        const response = await fetch('resume.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        renderWebsite(data);
    } catch (error) {
        console.warn('Could not fetch resume.json, trying fallback data:', error);
        if (window.PORTFOLIO_DATA) {
            renderWebsite(window.PORTFOLIO_DATA);
        } else {
            document.getElementById('hero-name').textContent = 'Error Loading Data';
            document.getElementById('hero-headline').textContent = 'Failed to load resume.json. Check the console (F12) for more details.';
        }
    }
}

function renderWebsite(data) {
    renderHero(data.basics);
    renderAbout(data.about);
    renderSkills(data.skills);
    renderWork(data.work);
    renderProjects(data.projects);
    renderEducation(data.education);
    renderCertificates(data.certificates);
    renderFooter(data.basics);
}

function renderHero(basics) {
    document.getElementById('hero-name').textContent = basics.name;
    document.getElementById('hero-label').textContent = basics.label;
    document.getElementById('hero-headline').textContent = basics.headline;
    document.getElementById('logo').textContent = basics.shortName;

    // Connect profile image from data
    if (basics.image) {
        const heroImg = document.getElementById('hero-image');
        if (heroImg) {
            heroImg.src = basics.image;
            heroImg.alt = basics.name;
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
    const workExperience = document.getElementById('work-experience');
    if (!work || work.length === 0) {
        workExperience.innerHTML = `
            <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="work-card">
                    <div class="work-header">
                        <h3>Academic Study & Computer Science Foundations</h3>
                        <span class="work-date">2026 — Present</span>
                    </div>
                    <a href="https://gutech.edu.pk" target="_blank" class="company-link">GUTECH — First Semester BSCS</a>
                    <p>Focusing on rigorous programming fundamentals, learning C++, mastering algorithmic problem solving, and preparing for future technology internships and software engineering opportunities.</p>
                    <div class="work-impact">
                        <strong>Current Focus:</strong> Developing strong programming habits, logical thinking, and computer science principles.
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
                    <span class="work-date">${formatDate(job.startDate)} — ${job.endDate ? formatDate(job.endDate) : 'Present'}</span>
                </div>
                <a href="${job.website}" target="_blank" class="company-link">${job.company}</a>
                <p>${job.summary}</p>
                <div class="work-impact">
                    <strong>Key Impact:</strong> ${job.impact}
                </div>
            </div>
        </div>
    `).join('');
}

function renderProjects(projects) {
    const projectsGrid = document.getElementById('projects-grid');
    if (!projects || projects.length === 0) {
        projectsGrid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 2rem;">Projects currently in development. Check back soon!</p>';
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
                ${project.outcome ? `<p class="project-outcome"><strong>Outcome:</strong> ${project.outcome}</p>` : ''}
            </div>
            <div class="project-links">
                ${project.liveUrl && project.liveUrl !== '#' ? `<a href="${project.liveUrl}" target="_blank"><i class="fas fa-external-link-alt"></i> Website</a>` : ''}
                ${project.codeUrl ? `<a href="${project.codeUrl}" target="_blank"><i class="fab fa-github"></i> Code</a>` : ''}
            </div>
        </div>
    `).join('');
}

function renderEducation(education) {
    const educationList = document.getElementById('education-list');
    educationList.innerHTML = education.map(edu => `
        <div class="edu-item">
            <h3>${edu.studyType} in ${edu.area}</h3>
            <p><strong>${edu.institution}</strong></p>
            <p class="text-muted">${formatDate(edu.startDate)} — ${formatDate(edu.endDate)}</p>
        </div>
    `).join('');
}

function renderCertificates(certificates) {
    const certList = document.getElementById('cert-list');
    if (!certificates || certificates.length === 0) {
        certList.innerHTML = `
            <div class="cert-card" style="cursor: default;">
                <div class="cert-icon"><i class="fas fa-graduation-cap"></i></div>
                <div class="cert-info">
                    <strong>Undergraduate CS Coursework</strong>
                    <p class="text-muted" style="font-size: 0.8rem">GUTECH — First Semester BSCS (C++, Computing Fundamentals)</p>
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

function renderFooter(basics) {
    document.getElementById('footer-name').textContent = basics.name;
    const footerSocial = document.getElementById('footer-social');
    footerSocial.innerHTML = basics.profiles.map(profile => `
        <a href="${profile.url}" target="_blank"><i class="${profile.icon}"></i></a>
    `).join('');
}

function setupEventListeners() {
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
}

function updateYear() {
    document.getElementById('current-year').textContent = new Date().getFullYear();
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
