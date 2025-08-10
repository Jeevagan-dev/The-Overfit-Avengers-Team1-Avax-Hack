import express from 'express';
import multer from 'multer';
import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const MODEL_DIR = path.join(__dirname, 'models');
const PYTHON_PATH = path.join(__dirname, 'venv', 'bin', 'python3');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(MODEL_DIR, { recursive: true });

app.use(cors());
app.use(express.json());

const upload = multer({ dest: UPLOAD_DIR });

function broadcastLog(message) {
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(message);
  });
}

function installDependenciesFromPythonScript(scriptPath) {
  if (!fs.existsSync(scriptPath)) return;
  const content = fs.readFileSync(scriptPath, 'utf-8');
  const imports = content.match(/^\s*(?:import|from)\s+([a-zA-Z0-9_]+)/gm) || [];
  const builtIns = ['os', 'sys', 'math', 'time', 'pickle', 'pathlib', 'json', 're', 'random'];
  const packages = [...new Set(imports.map(line => {
    let pkg = line.split(/\s+/)[1].toLowerCase();
    return pkg === 'sklearn' ? 'scikit-learn' : pkg;
  }).filter(pkg => !builtIns.includes(pkg)))];

  if (packages.length > 0) {
    broadcastLog(`[INFO] Installing Python dependencies: ${packages.join(', ')}`);
    try {
      execSync(`${PYTHON_PATH} -m pip install ${packages.join(' ')}`, { stdio: 'inherit' });
    } catch {
      broadcastLog(`[ERROR] Failed to install Python packages`);
    }
  } else {
    broadcastLog(`[INFO] No extra Python packages found.`);
  }
}

app.post('/upload', upload.fields([{ name: 'dataset' }, { name: 'code' }]), (req, res) => {
  if (!req.files.dataset || !req.files.code) return res.status(400).send('Dataset and code required.');

  const datasetPath = path.join(UPLOAD_DIR, 'data.csv');
  const codePath = path.join(UPLOAD_DIR, 'train.py');

  fs.renameSync(req.files.dataset[0].path, datasetPath);
  fs.renameSync(req.files.code[0].path, codePath);

  res.json({ message: 'Files uploaded successfully' });
});

app.post('/train', (req, res) => {
  const datasetPath = path.join(UPLOAD_DIR, 'data.csv');
  const codePath = path.join(UPLOAD_DIR, 'train.py');

  if (!fs.existsSync(datasetPath) || !fs.existsSync(codePath)) {
    return res.status(400).json({ error: 'Upload dataset and code first' });
  }

  res.json({ message: 'Training started' });
  installDependenciesFromPythonScript(codePath);

  const process = spawn(PYTHON_PATH, [codePath, datasetPath]);
  process.stdout.on('data', (data) => broadcastLog(data.toString()));
  process.stderr.on('data', (data) => broadcastLog(`ERROR: ${data.toString()}`));
  process.on('close', (code) => broadcastLog(`Training process exited with code ${code}`));
});

app.get('/download', (req, res) => {
  const modelPath = path.join(MODEL_DIR, 'model.pkl');
  if (!fs.existsSync(modelPath)) return res.status(404).send('Model not found');
  res.download(modelPath);
});

const PORT = 8000;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
