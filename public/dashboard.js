// Dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
    // Check maintenance mode
    const maintenanceSettings = JSON.parse(localStorage.getItem('maintenanceSettings') || '{"status":"disabled","message":"Website is currently under maintenance. Please check back later."}');
    const urlParams = new URLSearchParams(window.location.search);
    const adminBypass = urlParams.get('admin') === 'true';
    
    if (maintenanceSettings.status === 'enabled' && !adminBypass) {
        window.location.href = 'maintenance.html';
        return;
    }

    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        showDashboard();
    } else {
        showLoginForm();
    }

    // Initialize sections
    initializeSections();

    // Modal events for project add/edit
    document.getElementById('addProjectBtn').onclick = () => openProjectModal();
    document.getElementById('closeProjectModal').onclick = closeProjectModal;
    document.getElementById('addLinkBtn').onclick = () => addLinkField();
    document.getElementById('projectForm').onsubmit = saveProjectFromModal;

    // Modal events for skill add/edit
    document.getElementById('addSkillBtn').onclick = () => openSkillModal();
    document.getElementById('closeSkillModal').onclick = closeSkillModal;
    document.getElementById('skillForm').onsubmit = saveSkillFromModal;

    // Ensure modal fields are enabled and focusable
    const modalInputs = [
        document.getElementById('projectName'),
        document.getElementById('projectDescription'),
        document.getElementById('projectTechnologies'),
        document.getElementById('skillCategory'),
        document.getElementById('skillName'),
        document.getElementById('skillLevel')
    ];
    modalInputs.forEach(input => {
        if (input) {
            input.removeAttribute('readonly');
            input.removeAttribute('disabled');
            input.tabIndex = 0;
        }
    });
});

function showLoginForm() {
    document.querySelector('.login-container').style.display = 'flex';
    document.querySelector('.dashboard-container').style.display = 'none';
}

function showDashboard() {
    document.querySelector('.login-container').style.display = 'none';
    document.querySelector('.dashboard-container').style.display = 'grid';
}

function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === 'admin' && password === 'admin123') {
        localStorage.setItem('isLoggedIn', 'true');
        showDashboard();
    } else {
        alert('Invalid credentials');
    }
}

function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    showLoginForm();
}

function initializeSections() {
    // Navigation
    document.querySelectorAll('.nav-links li').forEach(link => {
        link.addEventListener('click', () => {
            const section = link.getAttribute('data-section');
            showSection(section);
            
            // Update active state
            document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Initialize each section
    initializeProjects();
    initializeSkills();
    initializeAbout();
    initializeCV();
    initializeContact();
    initializeMaintenance();
}

function showSection(sectionId) {
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionId}Section`).classList.add('active');
}

// Projects Management
function initializeProjects() {
    const projectsList = document.getElementById('projectsList');
    const addProjectBtn = document.getElementById('addProjectBtn');

    // Load existing projects
    loadProjects();

    // Add project button
    addProjectBtn.addEventListener('click', () => {
        openProjectModal();
    });
}

// Modal logic for projects
let editingProjectIndex = null;

function openProjectModal(project = null, index = null) {
    document.getElementById('projectModal').style.display = 'block';
    document.getElementById('modalTitle').textContent = project ? 'Edit Project' : 'Add Project';
    document.getElementById('projectName').value = project ? project.name : '';
    document.getElementById('projectDescription').value = project ? project.description : '';
    document.getElementById('projectTechnologies').value = project ? project.technologies : '';
    const linksDiv = document.getElementById('projectLinks');
    linksDiv.innerHTML = '';
    if (project && project.links && Array.isArray(project.links)) {
        project.links.forEach(link => addLinkField(link.label, link.url));
    } else {
        addLinkField();
    }
    editingProjectIndex = index;
    setTimeout(() => {
        document.getElementById('projectName').focus();
    }, 100);
}

function closeProjectModal() {
    document.getElementById('projectModal').style.display = 'none';
    editingProjectIndex = null;
}

function addLinkField(label = '', url = '') {
    const linksDiv = document.getElementById('projectLinks');
    const linkRow = document.createElement('div');
    linkRow.className = 'link-row';
    linkRow.innerHTML = `
        <input type="text" class="link-label" placeholder="Label (e.g. GitHub)" value="${label}">
        <input type="url" class="link-url" placeholder="URL" value="${url}">
        <button type="button" class="remove-link-btn">&times;</button>
    `;
    linkRow.querySelector('.remove-link-btn').onclick = () => linkRow.remove();
    linksDiv.appendChild(linkRow);
}

function saveProjectFromModal(e) {
    e.preventDefault();
    const name = document.getElementById('projectName').value.trim();
    const description = document.getElementById('projectDescription').value.trim();
    const technologies = document.getElementById('projectTechnologies').value.trim();
    const links = Array.from(document.querySelectorAll('#projectLinks .link-row')).map(row => {
        return {
            label: row.querySelector('.link-label').value.trim(),
            url: row.querySelector('.link-url').value.trim()
        };
    }).filter(link => link.label && link.url);
    if (!name || !description) return alert('Please fill in all required fields.');
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectData = { name, description, technologies, links };
    if (editingProjectIndex !== null) {
        projects[editingProjectIndex] = projectData;
    } else {
        projects.push(projectData);
    }
    localStorage.setItem('projects', JSON.stringify(projects));
    closeProjectModal();
    loadProjects();
}

function loadProjects() {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectsList = document.getElementById('projectsList');
    projectsList.innerHTML = projects.map((project, index) => `
        <div class="item-card">
            <div class="item-info">
                <h3>${project.name}</h3>
                <p>${project.description}</p>
                <small>${project.technologies || ''}</small>
                ${project.links && project.links.length ?
                    '<div class="project-links">' +
                    project.links.map(link => `<a href="${link.url}" target="_blank" class="project-link">${link.label}</a>`).join(' ') +
                    '</div>' : ''}
            </div>
            <div class="item-actions">
                <button class="edit-btn" onclick="openProjectModal(${JSON.stringify(project).replace(/"/g, '&quot;')},${index})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deleteProject(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function addProject(project) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    projects.push(project);
    localStorage.setItem('projects', JSON.stringify(projects));
    loadProjects();
}

function editProject(index) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = projects[index];

    const newName = prompt('Project Name:', project.name);
    const newDescription = prompt('Project Description:', project.description);
    const newTechnologies = prompt('Technologies:', project.technologies);
    const newLink = prompt('GitHub Link:', project.link);

    if (newName && newDescription) {
        projects[index] = {
            name: newName,
            description: newDescription,
            technologies: newTechnologies,
            link: newLink
        };
        localStorage.setItem('projects', JSON.stringify(projects));
        loadProjects();
    }
}

function deleteProject(index) {
    if (confirm('Are you sure you want to delete this project?')) {
        const projects = JSON.parse(localStorage.getItem('projects') || '[]');
        projects.splice(index, 1);
        localStorage.setItem('projects', JSON.stringify(projects));
        loadProjects();
    }
}

// Skills Management
function initializeSkills() {
    const skillsList = document.getElementById('skillsList');
    const addSkillBtn = document.getElementById('addSkillBtn');

    // Load existing skills
    loadSkills();

    // Add skill button
    addSkillBtn.addEventListener('click', () => {
        openSkillModal();
    });
}

// Modal logic for skills
let editingSkillIndex = null;

function openSkillModal(skill = null, index = null) {
    document.getElementById('skillModal').style.display = 'block';
    document.getElementById('skillModalTitle').textContent = skill ? 'Edit Skill' : 'Add Skill';
    document.getElementById('skillCategory').value = skill ? skill.category : '';
    document.getElementById('skillName').value = skill ? skill.name : '';
    document.getElementById('skillLevel').value = skill ? skill.level : '3';
    editingSkillIndex = index;
    setTimeout(() => {
        document.getElementById('skillCategory').focus();
    }, 100);
}

function closeSkillModal() {
    document.getElementById('skillModal').style.display = 'none';
    editingSkillIndex = null;
}

function saveSkillFromModal(e) {
    e.preventDefault();
    const category = document.getElementById('skillCategory').value.trim();
    const name = document.getElementById('skillName').value.trim();
    const level = parseInt(document.getElementById('skillLevel').value);

    if (!category || !name || level < 1 || level > 5) {
        return alert('Please fill in all required fields correctly.');
    }

    const skills = JSON.parse(localStorage.getItem('skills') || '[]');
    const skillData = { category, name, level };

    if (editingSkillIndex !== null) {
        skills[editingSkillIndex] = skillData;
    } else {
        skills.push(skillData);
    }

    localStorage.setItem('skills', JSON.stringify(skills));
    closeSkillModal();
    loadSkills();
}

function loadSkills() {
    const skills = JSON.parse(localStorage.getItem('skills') || '[]');
    const skillsList = document.getElementById('skillsList');
    
    skillsList.innerHTML = skills.map((skill, index) => `
        <div class="item-card">
            <div class="item-info">
                <h3>${skill.name}</h3>
                <p>Category: ${skill.category}</p>
                <div class="skill-level">
                    ${Array(skill.level).fill('<span class="filled">&bull;</span>').join('')}
                    ${Array(5 - skill.level).fill('<span class="empty">&bull;</span>').join('')}
                </div>
            </div>
            <div class="item-actions">
                <button class="edit-btn" onclick="openSkillModal(${JSON.stringify(skill).replace(/"/g, '&quot;')},${index})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deleteSkill(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function deleteSkill(index) {
    if (confirm('Are you sure you want to delete this skill?')) {
        const skills = JSON.parse(localStorage.getItem('skills') || '[]');
        skills.splice(index, 1);
        localStorage.setItem('skills', JSON.stringify(skills));
        loadSkills();
    }
}

// About Management
function initializeAbout() {
    const aboutForm = document.getElementById('aboutForm');
    loadAboutInfo();

    aboutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const aboutText = document.getElementById('aboutText').value;
        saveAboutInfo(aboutText);
    });
}

function loadAboutInfo() {
    const aboutText = localStorage.getItem('aboutText') || '';
    document.getElementById('aboutText').value = aboutText;
}

function saveAboutInfo(text) {
    localStorage.setItem('aboutText', text);
    alert('About information saved successfully!');
}

// CV Management
function initializeCV() {
    const cvUploadForm = document.getElementById('cvUploadForm');
    loadCurrentCV();

    cvUploadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const cvFile = document.getElementById('cvFile').files[0];
        const cvTitle = document.getElementById('cvTitle').value;

        if (cvFile && cvTitle) {
            // In a real application, you would upload the file to a server
            // For now, we'll just store the file name and title
            const cvInfo = {
                title: cvTitle,
                fileName: cvFile.name,
                uploadDate: new Date().toISOString()
            };
            saveCVInfo(cvInfo);
        }
    });
}

function loadCurrentCV() {
    const cvInfo = JSON.parse(localStorage.getItem('cvInfo') || 'null');
    const cvInfoDiv = document.getElementById('currentCvInfo');

    if (cvInfo) {
        cvInfoDiv.innerHTML = `
            <p><strong>Title:</strong> ${cvInfo.title}</p>
            <p><strong>File:</strong> ${cvInfo.fileName}</p>
            <p><strong>Upload Date:</strong> ${new Date(cvInfo.uploadDate).toLocaleDateString()}</p>
            <div class="cv-actions">
                <a href="#" class="cv-link" onclick="downloadCV()">Download CV</a>
                <button class="delete-btn" onclick="deleteCV()">
                    <i class="fas fa-trash"></i> Delete CV
                </button>
            </div>
        `;
    } else {
        cvInfoDiv.innerHTML = '<p>No CV uploaded yet.</p>';
    }
}

function saveCVInfo(cvInfo) {
    localStorage.setItem('cvInfo', JSON.stringify(cvInfo));
    loadCurrentCV();
    alert('CV uploaded successfully!');
}

function downloadCV() {
    // In a real application, this would trigger the actual file download
    alert('CV download would start here in a real application.');
}

function deleteCV() {
    if (confirm('Are you sure you want to delete the current CV?')) {
        localStorage.removeItem('cvInfo');
        loadCurrentCV();
        alert('CV deleted successfully!');
    }
}

// Contact Management
function initializeContact() {
    const contactForm = document.getElementById('contactForm');
    loadContactInfo();

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const botToken = document.getElementById('telegramBotToken').value;
        const chatId = document.getElementById('telegramChatId').value;
        saveContactInfo({ botToken, chatId });
    });
}

function loadContactInfo() {
    const contactInfo = JSON.parse(localStorage.getItem('contactInfo') || '{}');
    document.getElementById('telegramBotToken').value = contactInfo.botToken || '';
    document.getElementById('telegramChatId').value = contactInfo.chatId || '';
}

function saveContactInfo(info) {
    localStorage.setItem('contactInfo', JSON.stringify(info));
    alert('Contact information saved successfully!');
}

// Maintenance Mode Management
function initializeMaintenance() {
    const maintenanceForm = document.getElementById('maintenanceForm');
    loadMaintenanceSettings();

    maintenanceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const status = document.getElementById('maintenanceStatus').value;
        const message = document.getElementById('maintenanceMessage').value;
        saveMaintenanceSettings({ status, message });
    });
}

function loadMaintenanceSettings() {
    const settings = JSON.parse(localStorage.getItem('maintenanceSettings') || '{"status":"disabled","message":"Website is currently under maintenance. Please check back later."}');
    document.getElementById('maintenanceStatus').value = settings.status;
    document.getElementById('maintenanceMessage').value = settings.message;
}

function saveMaintenanceSettings(settings) {
    localStorage.setItem('maintenanceSettings', JSON.stringify(settings));
    alert('Maintenance settings saved successfully!');
} 