class Terminal {
    constructor() {
        this.terminal = document.getElementById('terminal');
        this.input = document.getElementById('command-input');
        this.avatar = document.querySelector('.avatar');
        this.commandHistory = [];
        this.historyIndex = -1;
        this.currentTheme = 'default';
        this.soundEnabled = true;
        this.themes = ['default', 'white', 'amber', 'cyan'];
        this.inGame = false; // Track if in mini-game
        this.hackerGame = null; // Game state
        this.fastMode = false; // Fast mode for skipping typing animation
        this.idleTimeout = null;
        this.idleMessages = [
            "Still there, Commander? 🛰️",
            "Tip: Type 'projects' to explore the mission log.",
            "Need help? Try 'help' or 'clear' to start fresh.",
            "The console awaits your next command...",
            "Mission paused. Awaiting further instructions."
        ];
        this.setupAudio();
        this.setupEventListeners();
        this.handlePreloader();
        this.initializeTerminal();
        this.staticProjects = [
            {
                name: "Lexi – Smart Emotional Robot (Under Development)",
                description: "An interactive emotional robot that expresses different moods using an OLED display, buzzer tones, and RGB lighting. Built with ESP32 and designed for responsive interactions using ultrasonic sensors and touch.",
                technologies: "ESP32, Arduino IDE, C++, OLED, Buzzer, RGB LED, Ultrasonic Sensor, Touch Sensor",
                link: ""
            },
            {
                name: "Morse Code Decoder",
                description: "An Arduino-based project that lets users input Morse code using two buttons and displays the decoded characters on an OLED screen.",
                technologies: "Arduino IDE, C++, U8g2lib, Buttons, OLED",
                link: "https://github.com/u0sf/Morse-Code-Decoder"
            },
            {
                name: "Bus Safety Project",
                description: "A system that detects seat occupancy in school buses to ensure no student is left behind. Uses sensors on seats and an ultrasonic scanner for final checks.",
                technologies: "Arduino IDE, C++, OneSheeld, Sensors, Ultrasonic Scanner",
                link: "https://github.com/u0sf/Bus-Safety-Project"
            },
            {
                name: "Multi-Game Hub",
                description: "A handheld ESP32-based gaming device with OLED display and multiple simple games like Rock-Paper-Scissors and Guess the Number.",
                technologies: "ESP32, Arduino IDE, C++, OLED",
                link: "https://github.com/u0sf/Multi-Game-Hub"
            },
            {
                name: "ViVision",
                description: "Wi-Fi color detection system using TCS34725 sensor and ESP8266 that serves real-time RGB values on a web interface.",
                technologies: "ESP8266, Arduino IDE, C++, TCS34725, Web Interface",
                link: "https://github.com/u0sf/ViVision"
            },
            {
                name: "DarkStrike (Under Testing)",
                description: "An ESP32-based tool for Wi-Fi security testing, featuring deauthentication and Evil Twin attacks through OLED menu navigation.",
                technologies: "ESP32, Arduino IDE, C++, OLED, Wi-Fi Security",
                link: "https://github.com/u0sf/DarkStrike"
            }
        ];

        this.staticSkills = [
            { category: "Tools & Platforms", name: "3D Design", level: 3 },
            { category: "Frontend", name: "Website Design", level: 3 },
            { category: "Embedded/Hardware", name: "Arduino", level: 4 },
            { category: "Embedded/Hardware", name: "ESP32", level: 4 },
            { category: "Embedded/Hardware", name: "ESP8266", level: 3 },
            { category: "Embedded/Hardware", name: "Sensors", level: 3 },
            { category: "Embedded/Hardware", name: "OLED Displays", level: 3 },
            { category: "Embedded/Hardware", name: "Ultrasonic Sensors", level: 3 },
            { category: "Embedded/Hardware", name: "Touch Sensors", level: 2 },
            { category: "Embedded/Hardware", name: "TCS34725", level: 2 },
            { category: "Embedded/Hardware", name: "OneSheeld", level: 2 },
            { category: "AI/Other", name: "Prompt Engineering", level: 3 },
            { category: "AI/Other", name: "Artificial Intelligence", level: 3 },
            { category: "Programming Languages", name: "C++", level: 4 },
            { category: "Programming Languages", name: "Python", level: 4 },
            { category: "Tools & Platforms", name: "Arduino IDE", level: 4 },
            { category: "Other", name: "Web Interface", level: 3 }
        ];

        this.availableCommands = [
            'about', 'skills', 'projects', 'cv', 'contact', 'social',
            'run', 'quote', 'theme', 'sound', 'clear', 'exit', 'help', 'fast'
        ];
        this.lastSession = localStorage.getItem('lastSession');
        this.resetIdleTimer();
    }

    initializeTerminal() {
        document.body.className = `theme-${this.currentTheme}`;
        this.input.focus();
        this.terminal.addEventListener('click', () => {
            this.input.focus();
        });
        // Unified welcome message
        this.printOutput('>> Welcome to Youssef\'s Terminal Portfolio');
        const hour = new Date().getHours();
        let greeting = '';
        if (hour < 12) {
            greeting = '>> Good morning, Commander Youssef ☕';
        } else if (hour < 18) {
            greeting = '>> Mission active. Welcome back, Commander 👨‍🚀';
        } else {
            greeting = '>> Evening mission initiated. Stay sharp, Captain 🌙';
        }
        this.printOutput(greeting);
        this.printOutput("Type 'help' to see available commands.");
        if (this.lastSession) {
            this.printOutput(`Welcome back! Last time you checked out '${this.lastSession}'.`);
        }
    }

    setupAudio() {
        this.typeSound = document.getElementById('typeSound');
        this.commandSound = document.getElementById('commandSound');
        this.errorSound = document.getElementById('errorSound');
        this.hoverSound = document.getElementById('hoverSound');

        // Add hover sound to all links
        document.addEventListener('mouseover', (e) => {
            const target = e.target;
            if ((target.tagName === 'A' || target.classList.contains('terminal-link')) && this.soundEnabled) {
                this.hoverSound.currentTime = 0;
                this.hoverSound.volume = 0.3; // Reduce volume to 30%
                this.hoverSound.play().catch(() => {});
            }
        });
    }

    setupEventListeners() {
        this.input.addEventListener('keydown', (e) => {
            this.resetIdleTimer();
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleCommand();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory('up');
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory('down');
            } else if (this.soundEnabled) {
                this.playSound(this.typeSound);
            }
        });
        this.input.addEventListener('input', () => {
            this.resetIdleTimer();
            this.animateAvatar();
        });
        this.terminal.addEventListener('click', () => {
            this.input.focus();
        });
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
            }
        });
    }

    animateAvatar() {
        this.avatar.classList.add('active');
        setTimeout(() => {
            this.avatar.classList.remove('active');
        }, 500);
    }

    handlePreloader() {
        const preloader = document.getElementById('preloader');
        setTimeout(() => {
            preloader.classList.add('fade-out');
            setTimeout(() => {
                preloader.style.display = 'none';
                // Focus input after preloader is gone
                this.input.focus();
            }, 500);
        }, 2000);
    }

    playSound(sound) {
        if (this.soundEnabled && sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    }

    handleCommand() {
        this.resetIdleTimer();
        const command = this.input.value.trim().toLowerCase();
        if (command) {
            this.commandHistory.push(command);
            this.historyIndex = this.commandHistory.length;
            this.printOutput(`> ${command}`);
            localStorage.setItem('lastSession', command);
            if (this.input.type === 'password') {
                return;
            }
            if (command === 'fast') {
                this.fastMode = !this.fastMode;
                this.printOutput(`Fast mode ${this.fastMode ? 'enabled' : 'disabled'}.`);
                this.input.value = '';
                this.input.removeAttribute('title');
                this.input.focus();
                return;
            }
            this.executeCommand(command);
            this.playSound(this.commandSound);
            this.animateAvatar();
        }
        this.input.value = '';
        this.input.removeAttribute('title');
        this.input.blur();
        setTimeout(() => this.input.focus(), 0);
    }

    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return;

        if (direction === 'up') {
            if (this.historyIndex > 0) {
                this.historyIndex--;
            }
        } else {
            if (this.historyIndex < this.commandHistory.length - 1) {
                this.historyIndex++;
            } else {
                this.historyIndex = this.commandHistory.length;
                this.input.value = '';
                return;
            }
        }

        this.input.value = this.commandHistory[this.historyIndex];
        this.input.selectionStart = this.input.selectionEnd = this.input.value.length;
    }

    printOutput(text) {
        const output = document.createElement('div');
        output.className = 'command-output';
        output.innerHTML = text.replace(/\n/g, '<br>');
        this.terminal.insertBefore(output, this.input.parentElement);
        this.terminal.scrollTop = this.terminal.scrollHeight;
    }

    convertUrlsToLinks(text) {
        // Regular expression to match URLs
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        
        // Replace URLs with anchor tags
        return text.replace(urlRegex, (url) => {
            // Clean up the URL (remove trailing punctuation)
            const cleanUrl = url.replace(/[.,;:!?]$/, '');
            return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="terminal-link">${cleanUrl}</a>`;
        });
    }

    executeCommand(command) {
        if (this.inGame) {
            this.handleHackerGameInput(command);
            return;
        }

        const commands = {
            about: () => this.showAbout(),
            skills: () => this.showSkills(),
            projects: () => this.showProjects(),
            cv: () => this.downloadCV(),
            contact: () => this.showContact(),
            social: () => this.showSocial(),
            run: () => this.startHackerGame(),
            quote: () => this.showQuote(),
            theme: () => this.cycleTheme(),
            sound: () => this.toggleSound(),
            clear: () => this.clearTerminal(),
            exit: () => this.exitWithPreloader(),
            help: () => this.showHelp()
        };

        if (commands[command]) {
            commands[command]();
        } else {
            const fun404Messages = [
                "Command not found. Are you trying to hack me? 😅",
                "404: That command has gone rogue.",
                "Error: Command not found. Did you mean 'help'?",
                "Command not recognized. Maybe try 'help' to see what's available?",
                "Oops! That command doesn't exist in this universe.",
                "This command is lost in cyberspace! 🚀",
                "You just discovered a secret... but it's just an error! 🕵️‍♂️",
                "If you find this command, let me know! 🦄",
                "Not all who wander are valid commands.",
                "404 brain not found. Try again! 🤖",
                "That command is on vacation. Try another! 🌴",
                "Nice try! But that's not a real command. 😜",
                "I asked the code, and it said 'nope.'",
                "This command is as real as unicorns! 🦄",
                "You broke the matrix... or maybe just typed it wrong! 🕶️"
            ];
            const randomMessage = fun404Messages[Math.floor(Math.random() * fun404Messages.length)];
            this.printOutput(randomMessage);
            this.playSound(this.errorSound);
        }
    }

    async exitWithPreloader() {
        // Animate breaking letters and remove each command-output line by line (bottom to top), leave welcome-message
        const terminal = document.getElementById('terminal');
        if (terminal) {
            // Get all .command-output lines in order
            const outputs = Array.from(terminal.querySelectorAll('.command-output'));
            outputs.reverse(); // Start from the last
            for (let lineIdx = 0; lineIdx < outputs.length; lineIdx++) {
                const block = outputs[lineIdx];
                // Split each line into spans per letter
                const lines = block.innerText.split('\n');
                block.innerHTML = lines.map(line => {
                    return line.split('').map((char, i) => `<span class=\"break-letter\" data-idx=\"${i}\">${char === ' ' ? '&nbsp;' : char}</span>`).join('');
                }).join('<br>');
                // Animate from right to left for this block
                const allSpans = Array.from(block.querySelectorAll('.break-letter'));
                const maxIdx = Math.max(...allSpans.map(span => +span.dataset.idx));
                for (let idx = maxIdx; idx >= 0; idx--) {
                    setTimeout(() => {
                        allSpans.filter(span => +span.dataset.idx === idx).forEach(span => {
                            span.classList.add('break-animate');
                        });
                    }, (maxIdx - idx) * 40);
                }
                // انتظر حتى ينتهي الأنميشن لهذا السطر قبل الانتقال للسطر الذي فوقه
                await new Promise(res => setTimeout(res, (maxIdx + 1) * 40 + 400));
                block.remove();
            }
        }
    }

    showHelp() {
        const helpText = `Available commands:
- about      → Brief information about Youssef
- skills     → Show skills divided into Frontend, Backend, Embedded/Hardware, Tools & Platforms
- projects   → Show projects list with descriptions and links
- cv         → Download Youssef's CV/Resume
- contact    → Show contact email or contact form link
- social     → Show social media links (LinkedIn, GitHub, Twitter, etc.)
- run        → Play the Terminal Hacker mini-game
- quote      → Show a random inspiring quote
- theme      → Cycle through available themes
- sound      → Toggle sound effects
- clear      → Clear the terminal screen
- exit       → Exit or reload the site`;
        this.printOutput(helpText);
    }

    showAbout() {
        const aboutText = `About Youssef:
A passionate full-stack developer with expertise in web development and embedded systems.
Specializing in creating efficient, scalable solutions and innovative applications.
Always eager to learn and adapt to new technologies.`;
        this.printOutput(aboutText);
    }

    async showProjects() {
        let projectsText = '>> Projects:';
        for (const project of this.staticProjects) {
            projectsText += `\n  -- ${project.name}\n     ${project.description}`;
            if (project.technologies) {
                projectsText += `\n     Technologies: ${project.technologies}`;
            }
            if (project.link) {
                projectsText += `\n     Link: <a href=\"${project.link}\" target=\"_blank\" class=\"terminal-link\">${project.link}</a>`;
            }
        }
        this.printOutput(projectsText);
    }

    async showSkills() {
        const skills = this.staticSkills;
        if (!skills.length) {
            this.printOutput('No skills found.');
            return;
        }
        // Group skills by category
        const categories = {};
        skills.forEach(skill => {
            if (!categories[skill.category]) categories[skill.category] = [];
            categories[skill.category].push(`${skill.name} (Level ${skill.level})`);
        });
        let skillsText = '>> Skills:';
        for (const [cat, list] of Object.entries(categories)) {
            skillsText += `\n  -- ${cat}:`;
            list.forEach(skill => {
                skillsText += `\n     • ${skill}`;
            });
        }
        this.printOutput(skillsText);
    }

    showContact() {
        const contactText =
`Contact Information:
Email: <a href="mailto:yusfrdwn@outlook.com" class="terminal-link">yusfrdwn@outlook.com</a>
Phone: <a href="tel:+201557922729" class="terminal-link">+20 155 792 2729</a>
Location: Egypt`;
        this.printOutput(contactText);
    }

    showSocial() {
        const socialText = `Social Media Links:
• GitHub: <a href=\"https://github.com/u0sf\" target=\"_blank\" class=\"terminal-link\">GitHub</a>
• Instagram: <a href=\"https://instagram.com/_youssefradwan\" target=\"_blank\" class=\"terminal-link\">Instagram</a>
• WhatsApp: <a href=\"https://wa.me/201557922729\" target=\"_blank\" class=\"terminal-link\">WhatsApp</a>
• Telegram: <a href=\"https://t.me/+201557922729\" target=\"_blank\" class=\"terminal-link\">Telegram</a>
• Snapchat: <a href=\"https://www.snapchat.com/add/uosf.r\" target=\"_blank\" class=\"terminal-link\">Snapchat</a>`;
        this.printOutput(socialText);
    }

    cycleTheme() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        this.currentTheme = this.themes[nextIndex];
        document.body.className = `theme-${this.currentTheme}`;
        this.printOutput(`Theme switched to ${this.currentTheme}`);
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.printOutput(`Sound effects ${this.soundEnabled ? 'enabled' : 'disabled'}`);
    }

    showQuote() {
        const quotes = [
            "The best way to predict the future is to implement it. - Alan Kay",
            "Talk is cheap. Show me the code. - Linus Torvalds",
            "Any fool can write code that a computer can understand. Good programmers write code that humans can understand. - Martin Fowler",
            "First, solve the problem. Then, write the code. - John Johnson"
        ];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        this.printOutput(randomQuote);
    }

    clearTerminal() {
        const outputs = this.terminal.getElementsByClassName('command-output');
        while (outputs.length > 0) {
            outputs[0].remove();
        }
        // Keep focus on input after clearing
        this.input.focus();
    }

    // --- Terminal Hacker Mini-Game ---
    startHackerGame() {
        if (this.inGame) return;
        this.inGame = true;
        // Generate a random 4-letter/number code
        const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let password = '';
        for (let i = 0; i < 4; i++) password += charset[Math.floor(Math.random() * charset.length)];
        // Create a scrambled hint
        const scramble = (str) => str.split('').sort(() => Math.random() - 0.5).join('');
        let scrambled = scramble(password);
        // Ensure the scrambled hint is not the same as the password
        while (scrambled === password) scrambled = scramble(password);
        this.hackerGame = {
            password,
            attempts: 0,
            maxAttempts: 5,
            history: [],
            scrambled
        };
        this.printOutput(
`[HACKER SIMULATION MODE]

Target system locked. Crack the 4-character access code.

Hint: Rearrange these characters to find the password:
[ ${scrambled} ]

Type your guess (4 letters/numbers) and press Enter.
Attempts remaining: 5
`
        );
        this.input.value = '';
        this.input.placeholder = 'Enter code...';
        this.input.focus();
    }

    handleHackerGameInput(guess) {
        guess = guess.trim().toUpperCase();
        if (!/^[A-Z0-9]{4}$/.test(guess)) {
            this.printOutput('> ' + guess);
            this.printOutput('Invalid code format. Use 4 letters/numbers.');
            this.playSound(this.errorSound);
            return;
        }
        this.printOutput('> ' + guess);
        const game = this.hackerGame;
        game.attempts++;
        // Check for win
        if (guess === game.password) {
            this.printOutput('[ACCESS GRANTED]\nWelcome, agent.\n');
            this.playSound(this.commandSound);
            this.endHackerGame();
            return;
        }
        // Give hints (like Mastermind)
        let correctPlace = 0, correctChar = 0;
        const pwArr = game.password.split('');
        const guessArr = guess.split('');
        const usedPw = [false, false, false, false];
        const usedGuess = [false, false, false, false];
        // First pass: correct place
        for (let i = 0; i < 4; i++) {
            if (guessArr[i] === pwArr[i]) {
                correctPlace++;
                usedPw[i] = usedGuess[i] = true;
            }
        }
        // Second pass: correct char, wrong place
        for (let i = 0; i < 4; i++) {
            if (usedGuess[i]) continue;
            for (let j = 0; j < 4; j++) {
                if (!usedPw[j] && guessArr[i] === pwArr[j]) {
                    correctChar++;
                    usedPw[j] = true;
                    break;
                }
            }
        }
        this.printOutput(
            `Hint: ${'●'.repeat(correctPlace)}${'○'.repeat(correctChar)}${'-'.repeat(4-correctPlace-correctChar)}\n` +
            `Feedback: ${correctPlace} correct & in place, ${correctChar} correct but misplaced.\n` +
            `Attempt ${game.attempts} of ${game.maxAttempts}`
        );
        this.playSound(this.typeSound);
        if (game.attempts >= game.maxAttempts) {
            this.printOutput('[ACCESS DENIED]\nSystem locked. The code was: ' + game.password);
            this.playSound(this.errorSound);
            this.endHackerGame();
        }
    }

    endHackerGame() {
        this.inGame = false;
        this.hackerGame = null;
        this.input.placeholder = '';
        this.printOutput('Exiting hacker simulation. Returning to terminal...');
        setTimeout(() => {
            this.input.value = '';
            this.input.focus();
        }, 600);
    }

    downloadCV() {
        const cvUrl = 'https://your-cv-url.com/cv.pdf'; // Replace with your actual CV URL
        this.printOutput('<div class="cv-container">');
        this.printOutput('<h2 class="section-title">📄 CV Options</h2>');
        this.printOutput(`
            <div class="cv-options">
                <a href="${cvUrl}" target="_blank" class="cv-button download">
                    <span class="icon">⬇️</span> Download CV
                </a>
                <button onclick="window.open('${cvUrl}', '_blank')" class="cv-button preview">
                    <span class="icon">👁️</span> Preview CV
                </button>
            </div>
        `);
        this.printOutput('</div>');
    }

    resetIdleTimer() {
        if (this.idleTimeout) clearTimeout(this.idleTimeout);
        this.idleTimeout = setTimeout(() => {
            const msg = this.idleMessages[Math.floor(Math.random() * this.idleMessages.length)];
            this.printOutput(msg);
        }, 30000);
    }
}

// Initialize terminal when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const terminal = new Terminal();
}); 