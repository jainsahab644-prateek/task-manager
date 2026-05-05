require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Task = require('./models/Task');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    console.log('\n--- IMPORTANT ---');
    console.log('Please ensure you have replaced <YOUR_CLUSTER_URL> in the .env file with your actual MongoDB cluster address.');
    console.log('-----------------\n');
  });

// API Routes

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, work } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, name, profession: work });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '7d' });
    res.status(201).json({ token, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '7d' });
    res.json({ token, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all tasks
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({ date: 1, time: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new task
app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const newTask = new Task({ ...req.body, userId: req.user.id });
    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a task (e.g. mark as completed, edit details)
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const updatedTask = await Task.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, req.body, { returnDocument: 'after' });
    res.json(updatedTask);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a task
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get User Profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update User Profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { name, bio, profession } = req.body;
    const updatedUser = await User.findByIdAndUpdate(req.user.id, { name, bio, profession }, { new: true }).select('-password');
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ error: "Gemini API key is not configured in .env file." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Define the tool
    const rescheduleTaskTool = {
      name: "rescheduleTask",
      description: "Reschedule an existing task to a new date and time. Use this ONLY when the user asks to move, delay, or reschedule a specific task AND you know exactly what date and time they want.",
      parameters: {
        type: "OBJECT",
        properties: {
          taskId: { type: "STRING", description: "The exact _id of the task to update from the user's task list." },
          newDate: { type: "STRING", description: "The new date for the task in YYYY-MM-DD format." },
          newTime: { type: "STRING", description: "The new time for the task in HH:MM (24-hour) format." }
        },
        required: ["taskId", "newDate", "newTime"]
      }
    };

    const rawTasks = await Task.find({ userId: req.user.id });
    // Minify tasks to save massive amounts of input tokens and avoid rate limits
    const tasks = rawTasks.map(t => ({
      id: t._id, title: t.title, priority: t.priority,
      date: t.date, time: t.time, category: t.category, completed: t.isCompleted
    }));

    // Calculate local date string for the prompt
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    const todayDate = d.toISOString().split('T')[0];

    const systemPrompt = `You are a helpful AI productivity assistant in a Task Manager app.
Today's date is: ${todayDate}.
Here is the user's current list of tasks in JSON format:
${JSON.stringify(tasks)}

IMPORTANT RULES:
1. If the user asks to reschedule a task, DO NOT immediately call the 'rescheduleTask' function unless they have explicitly provided BOTH a target date and time.
2. If they ask to reschedule but haven't specified the date AND time, politely ask them: "Sure, what date and time would you like to reschedule this task to?"
3. Once they provide the date and time, call the 'rescheduleTask' function with the correct taskId, newDate (YYYY-MM-DD), and newTime (HH:MM).
4. If you call a function, you do not need to say anything else.
5. If they ask a general productivity question, answer concisely.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemPrompt,
      tools: [{ functionDeclarations: [rescheduleTaskTool] }]
    });

    const chat = model.startChat({
      history: req.body.history || []
    });
    const result = await chat.sendMessage(message);
    const response = result.response;

    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call.name === "rescheduleTask") {
        const { taskId, newDate, newTime } = call.args;
        // Perform the database update
        await Task.findOneAndUpdate({ _id: taskId, userId: req.user.id }, { date: newDate, time: newTime });

        return res.json({
          reply: `I have successfully rescheduled the task to ${newDate} at ${newTime}. Let me know if you need anything else!`,
          refreshTasks: true
        });
      }
    }

    const responseText = response.text();
    res.json({ reply: responseText, refreshTasks: false });
  } catch (err) {
    console.error("AI Error:", err);
    if (err.message.includes("503") || err.message.includes("high demand")) {
        return res.status(503).json({ 
            error: "The AI is currently experiencing very high demand. Please wait a few seconds and try again. Your tasks are safe!" 
        });
    }
    const errMsg = err.message || "Unknown error";
    if (errMsg.includes('API_KEY') || errMsg.includes('API key')) {
      return res.status(500).json({ error: "Invalid Gemini API key. Please check your .env file." });
    }
    if (errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({ error: "Gemini API quota exceeded. Please try again later." });
    }
    res.status(500).json({ error: "Failed to get response from AI. " + errMsg });
  }
});

// ==============================
// ADMIN PANEL ROUTES (Secret - not linked publicly)
// ==============================

// Admin middleware - checks for ADMIN_SECRET header
const authenticateAdmin = (req, res, next) => {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden: Invalid admin secret.' });
  }
  next();
};

// GET /api/admin/stats - Overview stats
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const [totalUsers, totalTasks, completedTasks] = await Promise.all([
      User.estimatedDocumentCount(),
      Task.estimatedDocumentCount(),
      Task.countDocuments({ isCompleted: true }).maxTimeMS(8000),
    ]);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = await Task.countDocuments({ date: todayStr }).maxTimeMS(8000);
    res.json({ totalUsers, totalTasks, completedTasks, todayTasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users - All users with their task stats
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();

    const usersWithStats = await Promise.all(users.map(async (user) => {
      const [totalTasks, completedTasks] = await Promise.all([
        Task.countDocuments({ userId: user._id }).maxTimeMS(8000),
        Task.countDocuments({ userId: user._id, isCompleted: true }).maxTimeMS(8000),
      ]);
      const lastTask = await Task.findOne({ userId: user._id }).sort({ updatedAt: -1 }).select('updatedAt').lean();
      return {
        _id: user._id,
        name: user.name || 'N/A',
        email: user.email,
        profession: user.profession || '',
        bio: user.bio || '',
        joinedAt: user.createdAt,
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        lastActivity: lastTask ? lastTask.updatedAt : user.createdAt,
      };
    }));

    res.json(usersWithStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users/:id/tasks - Tasks of a specific user
app.get('/api/admin/users/:id/tasks', authenticateAdmin, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.params.id }).sort({ date: 1, time: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
