document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('interest');
    const sendBtn = document.getElementById('send-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const voiceBtn = document.getElementById('voice-btn');
    
    // Theme toggle functionality remains exactly the same
    themeToggle.addEventListener('click', toggleTheme);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', initialTheme);
    updateThemeIcon(initialTheme);
    
    // Existing event listeners remain the same
    sendBtn.addEventListener('click', handleSearch);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // New Voice Recognition functionality
    voiceBtn.addEventListener('click', toggleVoiceRecognition);
});

function toggleVoiceRecognition() {
    const voiceBtn = document.getElementById('voice-btn');
    const input = document.getElementById('interest');
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showError("Voice search is not supported in your browser");
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    if (voiceBtn.classList.contains('listening')) {
        recognition.stop();
        voiceBtn.classList.remove('listening');
        return;
    }

    recognition.start();
    voiceBtn.classList.add('listening');
    addMessage("Listening... Speak now", 'bot');

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        input.value = transcript;
        voiceBtn.classList.remove('listening');
        handleSearch();
    };

    recognition.onerror = (event) => {
        voiceBtn.classList.remove('listening');
        showError("Voice recognition error: " + event.error);
    };

    recognition.onend = () => {
        voiceBtn.classList.remove('listening');
    };
}
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#theme-toggle i');
    if (theme === 'light') {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

function suggestSearch(topic) {
    document.getElementById('interest').value = topic;
    handleSearch();
}

async function handleSearch() {
    const interest = document.getElementById('interest').value.trim();
    
    if (!interest) return;
    
    addMessage(interest, 'user');
    document.getElementById('interest').value = '';
    
    const loadingId = addLoadingMessage();
    
    try {
        const response = await fetch('http://localhost:5000/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                interest
            })
        });
        
        const data = await response.json();
        
        document.getElementById(loadingId)?.remove();
        
        if (data.error) {
            showError(data.error);
        } else if (data.results?.length > 0) {
            addDocumentaryResults(data.results);
        } else {
            addMessage("No documentaries found. Try another topic?", 'bot');
        }
    } catch (error) {
        document.getElementById(loadingId)?.remove();
        showError("Network error. Please check your connection.");
        console.error('Error:', error);
    }
}

function showError(message) {
    addMessage(`Error: ${message}`, 'bot');
}

function addMessage(text, sender) {
    const chatContainer = document.getElementById('chat-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = `${sender}-message`;
    
    messageDiv.innerHTML = `
        <div class="avatar">
            <i class="fas fa-${sender === 'bot' ? 'robot' : 'user'}"></i>
        </div>
        <div class="message-content">
            <p>${text}</p>
        </div>
    `;
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addLoadingMessage() {
    const chatContainer = document.getElementById('chat-container');
    const loadingId = 'loading-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'bot-message';
    messageDiv.id = loadingId;
    
    messageDiv.innerHTML = `
        <div class="avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <p><span class="loading-dots">Searching</span></p>
        </div>
    `;
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    return loadingId;
}

function addDocumentaryResults(enhancedVideos) {
    const chatContainer = document.getElementById('chat-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'bot-message';
    
    let resultsHTML = `
        <div class="avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <p>Here are some documentaries you might like:</p>
    `;
    
    enhancedVideos.forEach(enhanced => {
        const video = enhanced.video;
        resultsHTML += `
            <div class="documentary-result">
                <iframe src="https://www.youtube.com/embed/${video.id.videoId}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
                <div class="documentary-info">
                    <h3>${video.snippet.title}</h3>
                    <p class="summary">${enhanced.summary}</p>
                    <p class="rating">Rating: ${enhanced.rating}</p>
                    <small>Channel: ${video.snippet.channelTitle}</small>
                </div>
            </div>
        `;
    });
    
    resultsHTML += `</div>`;
    messageDiv.innerHTML = resultsHTML;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}