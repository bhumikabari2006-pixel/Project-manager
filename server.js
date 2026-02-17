const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Helper function to read projects from file
function readProjects() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Error reading projects:', error);
        return [];
    }
}

// Helper function to write projects to file
function writeProjects(projects) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2));
    } catch (error) {
        console.error('Error writing projects:', error);
    }
}

// Routes

// GET all projects
app.get('/api/projects', (req, res) => {
    const projects = readProjects();
    res.json(projects);
});

// GET single project
app.get('/api/projects/:id', (req, res) => {
    const projects = readProjects();
    const project = projects.find(p => p.id === parseInt(req.params.id));
    
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
});

// POST create new project
app.post('/api/projects', (req, res) => {
    const { name, description, date, status } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Project name is required' });
    }

    const projects = readProjects();
    const newProject = {
        id: Date.now(),
        name: name.trim(),
        description: description || '',
        date: date || '',
        status: status || 'Planning',
        createdAt: new Date().toLocaleDateString()
    };

    projects.push(newProject);
    writeProjects(projects);

    res.status(201).json(newProject);
});

// PUT update project
app.put('/api/projects/:id', (req, res) => {
    const { name, description, date, status } = req.body;
    const projects = readProjects();
    const projectIndex = projects.findIndex(p => p.id === parseInt(req.params.id));

    if (projectIndex === -1) {
        return res.status(404).json({ error: 'Project not found' });
    }

    if (name && !name.trim()) {
        return res.status(400).json({ error: 'Project name cannot be empty' });
    }

    projects[projectIndex] = {
        ...projects[projectIndex],
        name: name !== undefined ? name.trim() : projects[projectIndex].name,
        description: description !== undefined ? description : projects[projectIndex].description,
        date: date !== undefined ? date : projects[projectIndex].date,
        status: status !== undefined ? status : projects[projectIndex].status
    };

    writeProjects(projects);
    res.json(projects[projectIndex]);
});

// DELETE project
app.delete('/api/projects/:id', (req, res) => {
    const projects = readProjects();
    const projectIndex = projects.findIndex(p => p.id === parseInt(req.params.id));

    if (projectIndex === -1) {
        return res.status(404).json({ error: 'Project not found' });
    }

    const deletedProject = projects.splice(projectIndex, 1);
    writeProjects(projects);

    res.json({ message: 'Project deleted', project: deletedProject[0] });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Project Manager Backend running on http://localhost:${PORT}`);
    console.log(`📝 API available at http://localhost:${PORT}/api/projects`);
});
