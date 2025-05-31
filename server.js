const express = require('express');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Multer for file uploads
const multer = require('multer');
const uploadDir = path.join(__dirname, 'public', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['.pdf', '.doc', '.docx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
        }
    }
});

// Request logging middleware
app.use((req, res, next) => {
    console.log('----------------------------------------');
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    console.log('----------------------------------------');
    next();
});

// Content storage file
const CONTENT_FILE = 'content.json';

// Add this mapping at the top after defining CONTENT_FILE
const TYPE_MAP = {
  project: 'projects',
  skill: 'skills',
  social: 'social',
  quote: 'quotes',
  contact: 'contact',
  about: 'about'
};

// Initialize content file if it doesn't exist
async function initializeContentFile() {
    try {
        await fsPromises.access(CONTENT_FILE);
        console.log('Content file exists');
    } catch {
        console.log('Creating new content file');
        const initialContent = {
            projects: [],
            skills: [],
            social: [],
            quotes: [],
            contact: {},
            about: ''
        };
        await fsPromises.writeFile(CONTENT_FILE, JSON.stringify(initialContent, null, 2));
        console.log('Content file created successfully');
    }
}

// Read content from file
async function readContent() {
    try {
        console.log('Reading content file...');
        const data = await fsPromises.readFile(CONTENT_FILE, 'utf8');
        const content = JSON.parse(data);
        console.log('Content read successfully:', Object.keys(content));
        return content;
    } catch (error) {
        console.error('Error reading content file:', error);
        throw new Error('Failed to read content file');
    }
}

// Write content to file
async function writeContent(content) {
    try {
        console.log('Writing content to file...');
        await fsPromises.writeFile(CONTENT_FILE, JSON.stringify(content, null, 2));
        console.log('Content written successfully');
    } catch (error) {
        console.error('Error writing content file:', error);
        throw new Error('Failed to write content file');
    }
}

// API Routes
app.get('/api/content', async (req, res) => {
    try {
        const content = await readContent();
        const allContent = [
            ...content.projects.map(p => ({ ...p, type: 'project' })),
            ...content.skills.map(s => ({ ...s, type: 'skill' })),
            ...content.social.map(s => ({ ...s, type: 'social' })),
            ...content.quotes.map(q => ({ ...q, type: 'quote' }))
        ];
        res.json(allContent);
    } catch (error) {
        console.error('Error in GET /api/content:', error);
        res.status(500).json({ error: 'Failed to read content' });
    }
});

app.get('/api/content/:type', async (req, res) => {
    try {
        const content = await readContent();
        const { type } = req.params;
        
        if (!content[type]) {
            return res.status(404).json({ error: `Content type '${type}' not found` });
        }
        
        if (type === 'contact' || type === 'about') {
            res.json(content[type]);
        } else {
            res.json(content[type] || []);
        }
    } catch (error) {
        console.error(`Error in GET /api/content/${req.params.type}:`, error);
        res.status(500).json({ error: 'Failed to read content' });
    }
});

app.post('/api/content', async (req, res) => {
    try {
        console.log('Received POST request to /api/content');
        let { type, data } = req.body;
        
        console.log('Request data:', { type, data });
        
        // Map singular to plural
        type = TYPE_MAP[type] || type;
        
        if (!type || !data) {
            console.log('Missing required fields');
            return res.status(400).json({ error: 'Missing required fields: type and data' });
        }

        const content = await readContent();
        
        if (!content[type]) {
            console.log('Invalid content type:', type);
            return res.status(400).json({ error: `Invalid content type: ${type}` });
        }
        
        console.log('Current content:', content[type]);
        
        if (type === 'contact' || type === 'about') {
            content[type] = data;
        } else {
            const id = Date.now().toString();
            content[type].push({ id, ...data });
        }
        
        console.log('Updated content:', content[type]);
        
        await writeContent(content);
        console.log('Content saved successfully');
        res.json({ success: true });
    } catch (error) {
        console.error('Error in POST /api/content:', error);
        res.status(500).json({ error: 'Failed to save content' });
    }
});

app.put('/api/content/:id', async (req, res) => {
    try {
        let { id } = req.params;
        let { type, data } = req.body;
        type = TYPE_MAP[type] || type;
        if (!type || !data) {
            return res.status(400).json({ error: 'Missing required fields: type and data' });
        }
        const content = await readContent();
        if (!content[type]) {
            return res.status(400).json({ error: `Invalid content type: ${type}` });
        }
        if (type === 'contact' || type === 'about') {
            content[type] = data;
        } else {
            const index = content[type].findIndex(item => item.id === id);
            if (index === -1) {
                return res.status(404).json({ error: `Content with id ${id} not found` });
            }
            content[type][index] = { id, ...data };
        }
        await writeContent(content);
        res.json({ success: true });
    } catch (error) {
        console.error(`Error in PUT /api/content/${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to update content' });
    }
});

app.delete('/api/content/:id', async (req, res) => {
    try {
        let { id } = req.params;
        let { type } = req.query;
        type = TYPE_MAP[type] || type;
        if (!type) {
            return res.status(400).json({ error: 'Missing required query parameter: type' });
        }
        const content = await readContent();
        if (!content[type]) {
            return res.status(400).json({ error: `Invalid content type: ${type}` });
        }
        if (type === 'contact' || type === 'about') {
            content[type] = type === 'contact' ? {} : '';
        } else {
            const initialLength = content[type].length;
            content[type] = content[type].filter(item => item.id !== id);
            if (content[type].length === initialLength) {
                return res.status(404).json({ error: `Content with id ${id} not found` });
            }
        }
        await writeContent(content);
        res.json({ success: true });
    } catch (error) {
        console.error(`Error in DELETE /api/content/${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to delete content' });
    }
});

// Serve uploads statically
app.use('/uploads', express.static(uploadDir));

// CV upload endpoint
app.post('/api/upload-cv', upload.single('cv'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        res.json({
            success: true,
            url: `/uploads/${req.file.filename}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve the main application
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve sitemap.xml
app.get('/sitemap.xml', (req, res) => {
    res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Initialize and start server
async function ensureUploadsDir() {
    try {
        await fsPromises.access(uploadDir);
    } catch {
        await fsPromises.mkdir(uploadDir);
    }
}

ensureUploadsDir().then(() => initializeContentFile()).then(() => {
    app.listen(port, '0.0.0.0', () => {
        console.log(`Server running at http://localhost:${port}`);
        console.log(`You can access it from other devices using: http://192.168.1.3:${port}`);
        console.log('Content file and uploads directory initialized successfully');
    });
}).catch(error => {
    console.error('Failed to initialize server:', error);
    process.exit(1);
}); 