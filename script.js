// Project Manager Application with Advanced Features
class ProjectManager {
    constructor() {
        this.projects = [];
        this.currentEditId = null;
        this.apiUrl = 'http://localhost:3000/api/projects';
        this.filteredProjects = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadProjects();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('projectForm').addEventListener('submit', (e) => this.addProject(e));

        // Search and filters
        document.getElementById('searchInput').addEventListener('input', (e) => this.filterProjects());
        document.getElementById('statusFilter').addEventListener('change', (e) => this.filterProjects());
        document.getElementById('priorityFilter').addEventListener('change', (e) => this.filterProjects());
        document.getElementById('sortSelect').addEventListener('change', (e) => this.filterProjects());

        // Edit modal
        const editModal = document.getElementById('editModal');
        const closeBtn = document.querySelector('.close');
        document.getElementById('cancelEdit').addEventListener('click', () => {
            editModal.classList.add('hidden');
        });
        closeBtn.addEventListener('click', () => {
            editModal.classList.add('hidden');
        });
        document.getElementById('editForm').addEventListener('submit', (e) => this.saveProject(e));

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === editModal) {
                editModal.classList.add('hidden');
            }
        });
    }

    addProject(e) {
        e.preventDefault();

        const name = document.getElementById('projectName').value;
        const description = document.getElementById('projectDesc').value;
        const date = document.getElementById('projectDate').value;
        const dueDate = document.getElementById('projectDueDate').value;
        const status = document.getElementById('projectStatus').value;
        const priority = document.getElementById('projectPriority').value;
        const progress = parseInt(document.getElementById('projectProgress').value) || 0;
        const team = document.getElementById('projectTeam').value;

        if (!name.trim()) {
            alert('Please enter a project name');
            return;
        }

        const projectData = {
            name,
            description,
            date,
            dueDate,
            status,
            priority,
            progress,
            team
        };

        fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projectData)
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to create project');
            return response.json();
        })
        .then(project => {
            this.projects.push(project);
            this.filterProjects();
            document.getElementById('projectForm').reset();
            document.getElementById('projectProgress').value = 0;
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to create project. Make sure the backend is running.');
        });
    }

    deleteProject(id) {
        if (confirm('Are you sure you want to delete this project?')) {
            fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) throw new Error('Failed to delete project');
                return response.json();
            })
            .then(() => {
                this.projects = this.projects.filter(p => p.id !== id);
                this.renderProjects();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to delete project');
            });
        }
    }

    editProject(id) {
        const project = this.projects.find(p => p.id === id);
        if (!project) return;

        this.currentEditId = id;
        document.getElementById('editName').value = project.name;
        document.getElementById('editDesc').value = project.description;
        document.getElementById('editDate').value = project.date;
        document.getElementById('editDueDate').value = project.dueDate || '';
        document.getElementById('editStatus').value = project.status;
        document.getElementById('editPriority').value = project.priority || 'Medium';
        document.getElementById('editProgress').value = project.progress || 0;
        document.getElementById('editTeam').value = project.team || '';

        document.getElementById('editModal').classList.remove('hidden');
    }

    saveProject(e) {
        e.preventDefault();

        const projectData = {
            name: document.getElementById('editName').value,
            description: document.getElementById('editDesc').value,
            date: document.getElementById('editDate').value,
            dueDate: document.getElementById('editDueDate').value,
            status: document.getElementById('editStatus').value,
            priority: document.getElementById('editPriority').value,
            progress: parseInt(document.getElementById('editProgress').value) || 0,
            team: document.getElementById('editTeam').value
        };

        fetch(`${this.apiUrl}/${this.currentEditId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projectData)
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to update project');
            return response.json();
        })
        .then(updatedProject => {
            const index = this.projects.findIndex(p => p.id === this.currentEditId);
            if (index !== -1) {
                this.projects[index] = updatedProject;
            }
            this.filterProjects();
            document.getElementById('editModal').classList.add('hidden');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to update project');
        });
    }

    renderProjects() {
        const container = document.getElementById('projectsContainer');
        const projectCount = document.getElementById('projectCount');

        if (this.filteredProjects.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No projects found. Create one to get started!</p></div>';
            projectCount.textContent = `(0)`;
            return;
        }

        projectCount.textContent = `(${this.filteredProjects.length})`;

        container.innerHTML = this.filteredProjects.map(project => `
            <div class="project-card">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <h3>${this.escapeHtml(project.name)}</h3>
                    <span class="priority-badge priority-${(project.priority || 'Medium').toLowerCase()}">
                        ${project.priority || 'Medium'}
                    </span>
                </div>
                <p>${this.escapeHtml(project.description)}</p>
                
                ${project.progress !== undefined ? `
                <div class="project-progress-section">
                    <div class="progress-label">
                        <span>Progress</span>
                        <span>${project.progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${project.progress}%"></div>
                    </div>
                </div>
                ` : ''}

                ${project.team ? `
                <div class="team-members">
                    <div class="team-label">Team</div>
                    <div class="team-tags">
                        ${project.team.split(',').map(member => 
                            `<span class="team-tag">${this.escapeHtml(member.trim())}</span>`
                        ).join('')}
                    </div>
                </div>
                ` : ''}

                <div class="project-meta">
                    <span class="project-date">
                        ${project.date ? new Date(project.date).toLocaleDateString() : 'No start date'}
                        ${project.dueDate ? ` → ${new Date(project.dueDate).toLocaleDateString()}` : ''}
                    </span>
                    <span class="status-badge status-${project.status.toLowerCase().replace(' ', '-')}">${project.status}</span>
                </div>
                <div class="project-actions">
                    <button class="btn btn-edit btn-small" onclick="app.editProject(${project.id})">Edit</button>
                    <button class="btn btn-delete btn-small" onclick="app.deleteProject(${project.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    filterProjects() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const priorityFilter = document.getElementById('priorityFilter').value;
        const sortBy = document.getElementById('sortSelect').value;

        this.filteredProjects = this.projects.filter(project => {
            const matchesSearch = project.name.toLowerCase().includes(searchTerm) ||
                                project.description.toLowerCase().includes(searchTerm);
            const matchesStatus = !statusFilter || project.status === statusFilter;
            const matchesPriority = !priorityFilter || project.priority === priorityFilter;

            return matchesSearch && matchesStatus && matchesPriority;
        });

        // Sort
        this.filteredProjects.sort((a, b) => {
            switch(sortBy) {
                case 'oldest':
                    return a.id - b.id;
                case 'duedate':
                    return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
                case 'progress':
                    return (b.progress || 0) - (a.progress || 0);
                case 'newest':
                default:
                    return b.id - a.id;
            }
        });

        this.renderProjects();
    }

    loadProjects() {
        fetch(this.apiUrl)
            .then(response => {
                if (!response.ok) throw new Error('Failed to load projects');
                return response.json();
            })
            .then(projects => {
                this.projects = projects;
                this.filterProjects();
            })
            .catch(error => {
                console.error('Error loading projects:', error);
                alert('Failed to load projects. Make sure the backend is running on http://localhost:3000');
                this.projects = [];
                this.renderProjects();
            });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ProjectManager();
});
