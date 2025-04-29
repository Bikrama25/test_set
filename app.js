const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ncertPhysics', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Define schemas
const ChapterSchema = new mongoose.Schema({
    chapterNumber: Number,
    title: String,
    description: String,
    content: String,
    pdfUrl: String,
    releaseDate: Date,
    isActive: Boolean
});

const TestSchema = new mongoose.Schema({
    title: String,
    description: String,
    questions: [{
        questionText: String,
        options: [String],
        correctAnswer: Number,
        explanation: String
    }],
    chaptersCovered: [Number],
    timeLimit: Number,
    isActive: Boolean
});

const UserProgressSchema = new mongoose.Schema({
    userId: String,
    chaptersCompleted: [Number],
    testScores: [{
        testId: mongoose.Schema.Types.ObjectId,
        score: Number,
        dateTaken: Date
    }]
});

const Chapter = mongoose.model('Chapter', ChapterSchema);
const Test = mongoose.model('Test', TestSchema);
const UserProgress = mongoose.model('UserProgress', UserProgressSchema);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
app.get('/api/current-chapter', async (req, res) => {
    try {
        const chapter = await Chapter.findOne({ isActive: true })
            .sort({ releaseDate: -1 });
        res.json(chapter || {});
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/upcoming-test', async (req, res) => {
    try {
        const test = await Test.findOne({ isActive: true })
            .sort({ date: -1 });
        res.json(test || {});
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/previous-chapters', async (req, res) => {
    try {
        const chapters = await Chapter.find({ 
            isActive: true,
            releaseDate: { $lt: new Date() }
        }).sort({ releaseDate: -1 });
        res.json(chapters);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/mark-completed', async (req, res) => {
    try {
        // In a real app, you would have user authentication
        const userId = 'demo-user'; // Replace with actual user ID
        const { chapterNumber } = req.body;
        
        let progress = await UserProgress.findOne({ userId });
        
        if (!progress) {
            progress = new UserProgress({ userId, chaptersCompleted: [] });
        }
        
        if (!progress.chaptersCompleted.includes(chapterNumber)) {
            progress.chaptersCompleted.push(chapterNumber);
            await progress.save();
        }
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/user-progress', async (req, res) => {
    try {
        const userId = 'demo-user'; // Replace with actual user ID
        const progress = await UserProgress.findOne({ userId });
        
        const totalChapters = await Chapter.countDocuments({ isActive: true });
        const completed = progress ? progress.chaptersCompleted.length : 0;
        const progressPercent = totalChapters > 0 ? Math.round((completed / totalChapters) * 100) : 0;
        
        res.json({
            completed,
            total: totalChapters,
            progress: progressPercent
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin routes
app.post('/api/chapters', async (req, res) => {
    const chapter = new Chapter({
        chapterNumber: req.body.chapterNumber,
        title: req.body.title,
        description: req.body.description,
        content: req.body.content,
        pdfUrl: req.body.pdfUrl,
        releaseDate: req.body.releaseDate || Date.now(),
        isActive: true
    });

    try {
        const newChapter = await chapter.save();
        res.status(201).json(newChapter);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.post('/api/tests', async (req, res) => {
    const test = new Test({
        title: req.body.title,
        description: req.body.description,
        questions: req.body.questions,
        chaptersCovered: req.body.chaptersCovered,
        timeLimit: req.body.timeLimit,
        isActive: true
    });

    try {
        const newTest = await test.save();
        res.status(201).json(newTest);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Create public directory and index.html if it doesn't exist
const fs = require('fs');
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

const indexPath = path.join(publicDir, 'index.html');
if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NCERT Physics Class XII Weekly</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            color: #333;
        }
        header {
            background-color: #2c3e50;
            color: white;
            padding: 1rem;
            text-align: center;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .chapter-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            background-color: #f9f9f9;
        }
        .test-card {
            border: 2px solid #3498db;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            background-color: #eaf2f8;
        }
        .btn {
            display: inline-block;
            background: #3498db;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            margin-right: 10px;
            margin-bottom: 10px;
        }
        .btn:hover {
            background: #2980b9;
        }
        .progress-container {
            margin: 20px 0;
        }
        .progress-bar {
            height: 20px;
            background-color: #ecf0f1;
            border-radius: 10px;
            margin-bottom: 10px;
        }
        .progress {
            height: 100%;
            border-radius: 10px;
            background-color: #2ecc71;
            width: 0%;
            transition: width 0.5s;
        }
        footer {
            text-align: center;
            padding: 20px;
            background-color: #2c3e50;
            color: white;
        }
        #chapter-content img {
            max-width: 100%;
            height: auto;
        }
        .hidden {
            display: none;
        }
        #test-container {
            margin-top: 20px;
        }
        .question {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .options {
            margin-top: 10px;
        }
        .option {
            margin: 5px 0;
        }
        #timer {
            font-size: 1.2em;
            font-weight: bold;
            color: #e74c3c;
        }
    </style>
</head>
<body>
    <header>
        <h1>NCERT Physics Class XII Weekly</h1>
        <p>Master Physics one chapter at a time</p>
    </header>

    <div class="container">
        <section id="user-progress">
            <h2>Your Progress</h2>
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress" id="progress-bar"></div>
                </div>
                <p>Completed: <span id="progress-text">0%</span> (<span id="completed-chapters">0</span>/<span id="total-chapters">0</span> chapters)</p>
            </div>
        </section>

        <section id="current-chapter">
            <h2>This Week's Chapter</h2>
            <div class="chapter-card">
                <h3 id="chapter-title">Loading...</h3>
                <p id="chapter-description"></p>
                <div class="chapter-content" id="chapter-content"></div>
                <a href="#" class="btn" id="read-btn">Read Chapter</a>
                <a href="#" class="btn" id="download-btn">Download PDF</a>
                <button class="btn" id="mark-completed-btn">Mark as Completed</button>
            </div>
        </section>

        <section id="upcoming-test">
            <h2>Upcoming MCQ Test</h2>
            <div class="test-card">
                <h3 id="test-title">Loading...</h3>
                <p id="test-description"></p>
                <p>Test date: <span id="test-date">Next Monday</span></p>
                <p>50 questions covering the last two chapters</p>
                <p>Time limit: <span id="test-time-limit">60</span> minutes</p>
                <a href="#" class="btn" id="practice-btn">Practice Questions</a>
                <a href="#" class="btn" id="take-test-btn">Take Test Now</a>
            </div>
        </section>

        <div id="test-container" class="hidden">
            <h2>MCQ Test</h2>
            <div id="timer">Time remaining: 60:00</div>
            <div id="test-questions"></div>
            <button id="submit-test" class="btn">Submit Test</button>
        </div>

        <section id="previous-chapters">
            <h2>Previous Chapters</h2>
            <div id="chapter-list">
                <p>Loading previous chapters...</p>
            </div>
        </section>
    </div>

    <footer>
        <p>&copy; 2023 NCERT Physics Weekly. All rights reserved.</p>
    </footer>

    <script>
        // DOM elements
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const completedChapters = document.getElementById('completed-chapters');
        const totalChapters = document.getElementById('total-chapters');
        const chapterTitle = document.getElementById('chapter-title');
        const chapterDescription = document.getElementById('chapter-description');
        const chapterContent = document.getElementById('chapter-content');
        const readBtn = document.getElementById('read-btn');
        const downloadBtn = document.getElementById('download-btn');
        const markCompletedBtn = document.getElementById('mark-completed-btn');
        const testTitle = document.getElementById('test-title');
        const testDescription = document.getElementById('test-description');
        const testTimeLimit = document.getElementById('test-time-limit');
        const takeTestBtn = document.getElementById('take-test-btn');
        const testContainer = document.getElementById('test-container');
        const timerElement = document.getElementById('timer');
        const testQuestions = document.getElementById('test-questions');
        const submitTestBtn = document.getElementById('submit-test');
        const chapterList = document.getElementById('chapter-list');

        // Global variables
        let currentChapter = null;
        let currentTest = null;
        let previousChapters = [];
        let userAnswers = [];
        let testTimer = null;
        let timeRemaining = 0;

        // Initialize the app
        document.addEventListener('DOMContentLoaded', function() {
            loadCurrentChapter();
            loadUpcomingTest();
            loadPreviousChapters();
            loadUserProgress();
            
            // Set up event listeners
            readBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showChapterContent();
            });
            
            takeTestBtn.addEventListener('click', function(e) {
                e.preventDefault();
                startTest();
            });
            
            markCompletedBtn.addEventListener('click', function() {
                markChapterCompleted();
            });
            
            submitTestBtn.addEventListener('click', function() {
                submitTest();
            });
        });

        async function loadCurrentChapter() {
            try {
                const response = await fetch('/api/current-chapter');
                currentChapter = await response.json();
                
                if (currentChapter && currentChapter.title) {
                    chapterTitle.textContent = currentChapter.title;
                    chapterDescription.textContent = currentChapter.description;
                    downloadBtn.href = currentChapter.pdfUrl || '#';
                } else {
                    chapterTitle.textContent = "No chapter available this week";
                    readBtn.style.display = 'none';
                    downloadBtn.style.display = 'none';
                    markCompletedBtn.style.display = 'none';
                }
            } catch (error) {
                console.error('Error loading current chapter:', error);
            }
        }

        async function loadUpcomingTest() {
            try {
                const response = await fetch('/api/upcoming-test');
                currentTest = await response.json();
                
                if (currentTest && currentTest.title) {
                    testTitle.textContent = currentTest.title;
                    testDescription.textContent = currentTest.description;
                    testTimeLimit.textContent = currentTest.timeLimit || '60';
                } else {
                    testTitle.textContent = "No upcoming test";
                    takeTestBtn.style.display = 'none';
                }
            } catch (error) {
                console.error('Error loading upcoming test:', error);
            }
        }

        async function loadPreviousChapters() {
            try {
                const response = await fetch('/api/previous-chapters');
                previousChapters = await response.json();
                
                if (previousChapters.length > 0) {
                    chapterList.innerHTML = previousChapters.map(chapter => `
                        <div class="chapter-card">
                            <h3>${chapter.title}</h3>
                            <p>${chapter.description}</p>
                            <a href="${chapter.pdfUrl}" class="btn">Download PDF</a>
                        </div>
                    `).join('');
                } else {
                    chapterList.innerHTML = '<p>No previous chapters yet. Check back next week!</p>';
                }
            } catch (error) {
                console.error('Error loading previous chapters:', error);
            }
        }

        async function loadUserProgress() {
            try {
                const response = await fetch('/api/user-progress');
                const progress = await response.json();
                
                progressBar.style.width = `${progress.progress}%`;
                progressText.textContent = `${progress.progress}%`;
                completedChapters.textContent = progress.completed;
                totalChapters.textContent = progress.total;
            } catch (error) {
                console.error('Error loading user progress:', error);
            }
        }

        function showChapterContent() {
            if (currentChapter && currentChapter.content) {
                chapterContent.innerHTML = currentChapter.content;
                readBtn.style.display = 'none';
            }
        }

        async function markChapterCompleted() {
            if (!currentChapter) return;
            
            try {
                const response = await fetch('/api/mark-completed', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        chapterNumber: currentChapter.chapterNumber
                    })
                });
                
                if (response.ok) {
                    alert('Chapter marked as completed!');
                    loadUserProgress();
                }
            } catch (error) {
                console.error('Error marking chapter as completed:', error);
            }
        }

        function startTest() {
            if (!currentTest) return;
            
            // Hide other sections
            document.querySelectorAll('section').forEach(section => {
                section.classList.add('hidden');
            });
            
            // Show test container
            testContainer.classList.remove('hidden');
            
            // Initialize test
            timeRemaining = (currentTest.timeLimit || 60) * 60; // Convert to seconds
            updateTimer();
            testTimer = setInterval(updateTimer, 1000);
            
            // Display questions
            userAnswers = [];
            testQuestions.innerHTML = '';
            
            // For demo, we'll use sample questions
            const sampleQuestions = [
                {
                    questionText: "What is the SI unit of electric charge?",
                    options: ["Ampere", "Coulomb", "Volt", "Ohm"],
                    correctAnswer: 1
                },
                {
                    questionText: "Which law describes the force between two point charges?",
                    options: ["Ohm's Law", "Faraday's Law", "Coulomb's Law", "Ampere's Law"],
                    correctAnswer: 2
                }
                // In a real app, you would use currentTest.questions
            ];
            
            sampleQuestions.forEach((question, index) => {
                const questionElement = document.createElement('div');
                questionElement.className = 'question';
                questionElement.innerHTML = `
                    <h4>Question ${index + 1}</h4>
                    <p>${question.questionText}</p>
                    <div class="options">
                        ${question.options.map((option, i) => `
                            <div class="option">
                                <input type="radio" name="q${index}" id="q${index}o${i}" value="${i}">
                                <label for="q${index}o${i}">${option}</label>
                            </div>
                        `).join('')}
                    </div>
                `;
                testQuestions.appendChild(questionElement);
            });
        }

        function updateTimer() {
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            timerElement.textContent = `Time remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeRemaining <= 0) {
                clearInterval(testTimer);
                submitTest();
            } else {
                timeRemaining--;
            }
        }

        function submitTest() {
            clearInterval(testTimer);
            
            // Collect answers
            const questions = document.querySelectorAll('.question');
            questions.forEach((question, index) => {
                const selectedOption = question.querySelector('input[type="radio"]:checked');
                userAnswers.push({
                    questionIndex: index,
                    answer: selectedOption ? parseInt(selectedOption.value) : null
                });
            });
            
            // Calculate score (in a real app, this would be sent to the server)
            const score = userAnswers.filter(answer => {
                const correctAnswer = 1; // In a real app, use currentTest.questions[answer.questionIndex].correctAnswer
                return answer.answer === correctAnswer;
            }).length;
            
            const totalQuestions = questions.length;
            const percentage = Math.round((score / totalQuestions) * 100);
            
            alert(`Test submitted! You scored ${score}/${totalQuestions} (${percentage}%)`);
            
            // Return to main view
            testContainer.classList.add('hidden');
            document.querySelectorAll('section').forEach(section => {
                section.classList.remove('hidden');
            });
        }
    </script>
</body>
</html>
    `);
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Make sure MongoDB is running on mongodb://localhost:27017/ncertPhysics`);
});
