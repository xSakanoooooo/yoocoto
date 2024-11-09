function showLoadingScreen(duration = 4200) {
    const loadingScreen = document.getElementById('loading-screen');
    const spinner = document.querySelector('.spinner');
    spinner.style.animationDuration = `${duration / 4200}s`;

    setTimeout(() => {
        loadingScreen.style.opacity = 0;  
        setTimeout(() => {
            loadingScreen.style.display = 'none';  
            document.documentElement.style.display = 'block'; 
        }, 1000); 
    }, duration); 
}

window.onload = () => {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.display = 'flex';  

    const logo = document.querySelector('.logo-container');
    const spinner = document.querySelector('.spinner-container');

    logo.style.visibility = 'visible';

    setTimeout(() => {
        spinner.style.visibility = 'visible';
    }, 500); 

    showLoadingScreen(3000); 
};

const clientId = 'ffo830okw5x9tcbt51c2wpjhr80jnn';
const oauthToken = 'sh4ly28ldx12keykw0iedo0y5ellu9';
const gameId = '32982';

let isLoading = false;
let hasMoreStreams = true;
let currentStreams = new Set(); 

function truncateTitle(title) {
    if (title.length > 100) {
        return title.substring(0, 100) + '...';
    }
    return title;
}

async function getStreams(cursor = '') {
    if (isLoading || !hasMoreStreams) return;

    isLoading = true;

    const url = cursor
        ? `https://api.twitch.tv/helix/streams?game_id=${gameId}&first=100&after=${cursor}&language=pl`
        : `https://api.twitch.tv/helix/streams?game_id=${gameId}&first=100&language=pl`;

    try {
        const response = await fetch(url, {
            headers: {
                'Client-ID': clientId,
                'Authorization': `Bearer ${oauthToken}`
            }
        });

        if (!response.ok) {
            console.error('Błąd zapytania API:', response.status, response.statusText);
            document.getElementById('streamList').innerHTML = '<p>Wystąpił błąd podczas pobierania streamów.</p>';
            return;
        }

        const data = await response.json();

        if (data.data && data.data.length > 0) {
            const filteredStreams = data.data.filter(stream => {
                const title = stream.title.toLowerCase();
                return /infamespl|infames polska|infames pl|infames/.test(title);
            });

            const sidebar = document.getElementById('sidebar');
            for (const stream of filteredStreams) {
                if (!currentStreams.has(stream.user_name)) {
                    const profileImageUrl = await getProfileImageUrl(stream.user_name);
                    const streamSidebarItem = document.createElement('div');
                    streamSidebarItem.className = 'stream-sidebar-item';
                    streamSidebarItem.onclick = () => openStream(stream.user_name);

                    const viewerBadge = stream.viewer_count > 1000 ? `<span class="viewer-badge"></span>` : '';
                    const viewerCount = `<span class="viewer-count">${stream.viewer_count}</span>`;

                    streamSidebarItem.innerHTML = `
                        <img src="${profileImageUrl}" alt="${stream.user_name}">
                        <div class="info">
                            <strong>${stream.user_name}</strong>
                            <p><span class="viewer-badge"></span>${stream.viewer_count} widzów</p>
                        </div>
                    `;
                    sidebar.appendChild(streamSidebarItem);
                    currentStreams.add(stream.user_name); 
                }
            }

           
            const sidebarItems = sidebar.querySelectorAll('.stream-sidebar-item');
            for (const sidebarItem of sidebarItems) {
                const username = sidebarItem.querySelector('strong').textContent;
                const isActiveStream = filteredStreams.some(stream => stream.user_name === username);
                if (!isActiveStream) {
                    sidebarItem.remove();
                    currentStreams.delete(username); 
                }
            }

            if (data.pagination && data.pagination.cursor) {
                getStreams(data.pagination.cursor);
            } else {
                hasMoreStreams = false;
            }
        } else {
            if (!cursor) {
                document.getElementById('streamList').innerHTML = '<p>Brak streamów w tej chwili.</p>';
            }
        }
    } catch (error) {
        console.error('Wystąpił błąd:', error);
        document.getElementById('streamList').innerHTML = '<p>Wystąpił błąd podczas pobierania streamów.</p>';
    } finally {
        isLoading = false;
    }
}

async function getProfileImageUrl(username) {
    const url = `https://api.twitch.tv/helix/users?login=${username}`;
    const response = await fetch(url, {
        headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${oauthToken}`
        }
    });
    const data = await response.json();
    return data.data[0] ? data.data[0].profile_image_url : '';
}

function openStream(username) {
    const iframe = document.querySelector('#streamViewer iframe');
    const chatIframe = document.querySelector('#chatViewer iframe');

    iframe.src = `https://player.twitch.tv/?channel=${username}&parent=infamespl.live&allowfullscreen=true&autoplay=true`;
    chatIframe.src = `https://www.twitch.tv/embed/${username}/chat?parent=infamespl.live&darkpopout`;
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const button = document.querySelector('.toggle-sidebar');
    sidebar.classList.toggle('collapsed');
    const isCollapsed = sidebar.classList.contains('collapsed');

    const mainContent = document.querySelector('.main-content');
    const streamViewer = document.getElementById('streamViewer');
    const chatViewer = document.getElementById('chatViewer');

    if (isCollapsed) {
        mainContent.style.width = 'calc(100% - 80px)';
        streamViewer.style.width = '78%';
        chatViewer.style.width = '20%';
        button.textContent = '➡';
    } else {
        mainContent.style.width = 'calc(100% - 200px)';
        streamViewer.style.width = '78%';
        chatViewer.style.width = '20%';
        button.textContent = '⬅';
    }
}

getStreams();

setInterval(() => {
    getStreams();
}, 30000); 
