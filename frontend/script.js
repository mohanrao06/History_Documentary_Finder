document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('interest');
    const sendBtn = document.getElementById('send-btn');
    
    sendBtn.addEventListener('click', handleSearch);
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
});

function suggestSearch(topic) {
    document.getElementById('interest').value = topic;
    handleSearch();
}

async function handleSearch() {
    const interest = document.getElementById('interest').value.trim();
    const activeMode = document.querySelector('.mode-btn.active').dataset.mode;
    
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
                interest,
                mode: activeMode
            })
        });
        
        const data = await response.json();
        
        document.getElementById(loadingId)?.remove();
        
        if (data.error) {
            showError(data.error, activeMode);
        } else if (data.type === 'youtube') {
            if (data.results?.length > 0) {
                addDocumentaryResults(data.results);
            } else {
                addMessage("No documentaries found. Try another topic?", 'bot');
            }
        } else if (data.type === 'ai') {
            addMessage(data.results, 'bot');
        }
    } catch (error) {
        document.getElementById(loadingId)?.remove();
        showError("Network error. Please check your connection.", 'error');
        console.error('Error:', error);
    }
}

function showError(message, type) {
    const errorMsg = type === 'ai' ? 
        `AI Error: ${message}` : 
        `Error: ${message}`;
    addMessage(errorMsg, 'bot');
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

function addDocumentaryResults(videos) {
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
    
    videos.forEach(video => {
        resultsHTML += `
            <div class="documentary-result">
                <iframe src="https://www.youtube.com/embed/${video.id.videoId}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
                <div class="documentary-info">
                    <h3>${video.snippet.title}</h3>
                    <p>${(video.snippet.description || '').substring(0, 150)}...</p>
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