const API_KEY = 'AIzaSyAT5oQSikvEJTkydNQE3mqMuaWVNM1ZwV8';

const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const videoList = document.getElementById('video-list');
const playerContainer = document.getElementById('player-container');
const playerDiv = document.getElementById('player');
const backButton = document.getElementById('back-button');
const searchContainer = document.getElementById('search-container');
const resultsContainer = document.getElementById('results-container');

// 즐겨찾기 관련 DOM 요소 제거
// const searchTab = document.getElementById('search-tab');
// const favoritesTab = document.getElementById('favorites-tab');
// const favoritesContainer = document.getElementById('favorites-container');
// const favoritesList = document.getElementById('favorites-list');

searchButton.addEventListener('click', searchVideos);
searchInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        searchVideos();
    }
});

backButton.addEventListener('click', goBackToList);

// 즐겨찾기 탭 이벤트 리스너 제거
// searchTab.addEventListener('click', () => switchTab('search'));
// favoritesTab.addEventListener('click', () => switchTab('favorites'));

const countrySelect = document.getElementById('country-select');
const resultsCount = document.getElementById('results-count');

// 간단한 번역 사전 (다시 사용)
const translationMap = {
    "서울": "seoul",
    "부산": "busan",
    "도쿄": "tokyo",
    "오사카": "osaka",
    "일본": "japan",
    "뉴욕": "new york",
    "런던": "london",
    "파리": "paris"
};

async function searchVideos() {
    const query = searchInput.value.trim();
    if (!query) {
        videoList.innerHTML = '';
        resultsCount.textContent = '';
        return;
    }

    videoList.innerHTML = '<p>검색 중... (재생 가능한 영상 확인 중)</p>';
    resultsCount.textContent = '';

    let finalQuery = query;
    const translatedQuery = translationMap[query.toLowerCase()];

    // 번역된 키워드가 있으면 OR 조건으로 함께 검색
    if (translatedQuery) {
        finalQuery = `${query}|${translatedQuery}`;
    }

    // 뉴스 제외 키워드 추가
    finalQuery += " -뉴스 -news";

    let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(finalQuery)}&type=video&eventType=live&key=${API_KEY}&maxResults=50`;

    try {
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (!searchData.items || searchData.items.length === 0) {
            videoList.innerHTML = '<p>검색 결과가 없습니다.</p>';
            resultsCount.textContent = '총 0개의 라이브 영상을 찾았습니다.';
            return;
        }

        const videoIds = searchData.items.map(item => item.id.videoId).join(',');
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${videoIds}&key=${API_KEY}`;
        
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();
        
        displayVideos(detailsData.items);

    } catch (error) {
        console.error('Error fetching videos:', error);
        videoList.innerHTML = '<p>영상을 불러오는 중 오류가 발생했습니다.</p>';
    }
}

function displayVideos(videos) {
    videoList.innerHTML = '';
    resultsCount.textContent = '';
    const query = searchInput.value.trim().toLowerCase();
    const translatedQuery = translationMap[query];

    if (!videos || videos.length === 0) {
        resultsCount.textContent = '총 0개의 라이브 영상을 찾았습니다.';
        videoList.innerHTML = '<p>검색 결과가 없습니다.</p>';
        return;
    }

    const requiredKeywords = ['4k', 'live', 'cam', 'streaming'];

    const playableLiveVideos = videos.filter(video => {
        const title = video.snippet.title ? video.snippet.title.toLowerCase() : '';
        const description = video.snippet.description ? video.snippet.description.toLowerCase() : '';

        // 사용자 키워드 또는 번역어가 제목 또는 설명에 포함되는지 확인 (다시 활성화)
        let hasUserKeyword = title.includes(query) || description.includes(query);
        if (translatedQuery) {
            hasUserKeyword = hasUserKeyword || title.includes(translatedQuery) || description.includes(translatedQuery);
        }

        // '4K', 'live', 'cam', 'streaming' 중 하나라도 제목 또는 설명에 포함되는지 확인
        const hasRequiredKeyword = requiredKeywords.some(keyword =>
            title.includes(keyword) || description.includes(keyword)
        );

        return video.snippet.liveBroadcastContent === 'live' &&
               video.status.embeddable &&
               hasUserKeyword && // 사용자 키워드 일치 조건 다시 활성화
               hasRequiredKeyword;
    });

    resultsCount.textContent = `총 ${playableLiveVideos.length}개의 라이브 영상을 찾았습니다.`;

    if (playableLiveVideos.length === 0) {
        videoList.innerHTML = '<p>현재 재생 가능한 실시간 영상이 없습니다.</p>';
        return;
    }

    playableLiveVideos.forEach(video => {
        const videoId = video.id;
        const title = video.snippet.title;
        const thumbnailUrl = video.snippet.thumbnails.medium.url;
        // 즐겨찾기 상태 확인 로직 제거
        // const isFav = isFavorite(videoId);

        const videoItem = document.createElement('div');
        videoItem.classList.add('video-item');
        videoItem.dataset.videoId = videoId;

        videoItem.innerHTML = `
            <img src="${thumbnailUrl}" alt="${title}">
            <div class="title">${title}</div>
            <!-- 즐겨찾기 버튼 제거 -->
            <!-- <button class="favorite-button ${isFav ? 'favorited' : ''}" data-video-id="${videoId}">★</button> -->
        `;

        videoItem.querySelector('img').addEventListener('click', () => playVideo(videoId));
        videoItem.querySelector('.title').addEventListener('click', () => playVideo(videoId));
        // 즐겨찾기 버튼 이벤트 리스너 제거
        // videoItem.querySelector('.favorite-button').addEventListener('click', (event) => {
        //     event.stopPropagation();
        //     toggleFavorite(video);
        // });
        videoList.appendChild(videoItem);
    });
}

function playVideo(videoId) {
    searchContainer.classList.add('hidden');
    resultsContainer.classList.add('hidden');
    // favoritesContainer.classList.add('hidden'); // 즐겨찾기 컨테이너 숨김 로직 제거
    playerContainer.classList.remove('hidden');

    playerDiv.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&fs=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    
    const iframe = playerDiv.querySelector('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
}

function goBackToList() {
    playerContainer.classList.add('hidden');
    // 탭 전환 로직 제거
    // if (searchTab.classList.contains('active')) {
        searchContainer.classList.remove('hidden');
        resultsContainer.classList.remove('hidden');
    // } else if (favoritesTab.classList.contains('active')) {
    //     favoritesContainer.classList.remove('hidden');
    // }

    playerDiv.innerHTML = '';
}

// 즐겨찾기 관련 함수 제거
// function getFavorites() {
//     const favorites = localStorage.getItem('youtubeFavorites');
//     return favorites ? JSON.parse(favorites) : [];
// }

// function saveFavorites(favorites) {
//     localStorage.setItem('youtubeFavorites', JSON.stringify(favorites));
// }

// function isFavorite(videoId) {
//     const favorites = getFavorites();
//     return favorites.some(video => video.id === videoId);
// }

// function toggleFavorite(video) {
//     let favorites = getFavorites();
//     const videoId = video.id;

//     if (isFavorite(videoId)) {
//         favorites = favorites.filter(favVideo => favVideo.id !== videoId);
//         alert('즐겨찾기에서 제거되었습니다.');
//     } else {
//         favorites.push(video);
//         alert('즐겨찾기에 추가되었습니다.');
//     }
//     saveFavorites(favorites);
//     if (searchTab.classList.contains('active')) {
//         videoList.innerHTML = '';
//         resultsCount.textContent = '';
//     } else if (favoritesTab.classList.contains('active')) {
//         displayFavorites();
//     }
// }

// function displayFavorites() {
//     favoritesList.innerHTML = '';
//     const favorites = getFavorites();

//     if (favorites.length === 0) {
//         favoritesList.innerHTML = '<p>즐겨찾기된 영상이 없습니다.</p>';
//         return;
//     }

//     favorites.forEach(video => {
//         const videoId = video.id;
//         const title = video.snippet.title;
//         const thumbnailUrl = video.snippet.thumbnails.medium.url;

//         const videoItem = document.createElement('div');
//         videoItem.classList.add('video-item');
//         videoItem.dataset.videoId = videoId;

//         videoItem.innerHTML = `
//             <img src="${thumbnailUrl}" alt="${title}">
//             <div class="title">${title}</div>
//             <button class="favorite-button favorited" data-video-id="${videoId}">★</button>
//         `;

//         videoItem.querySelector('img').addEventListener('click', () => playVideo(videoId));
//         videoItem.querySelector('.title').addEventListener('click', () => playVideo(videoId));
//         videoItem.querySelector('.favorite-button').addEventListener('click', (event) => {
//             event.stopPropagation();
//             toggleFavorite(video);
//         });
//         favoritesList.appendChild(videoItem);
//     });
// }

// 탭 전환 함수 제거
// function switchTab(tabName) {
//     if (tabName === 'search') {
//         searchTab.classList.add('active');
//         favoritesTab.classList.remove('active');
//         searchContainer.classList.remove('hidden');
//         resultsContainer.classList.remove('hidden');
//         favoritesContainer.classList.add('hidden');
//         playerContainer.classList.add('hidden');
//         playerDiv.innerHTML = '';
//     } else if (tabName === 'favorites') {
//         searchTab.classList.remove('active');
//         favoritesTab.classList.add('active');
//         searchContainer.classList.add('hidden');
//         resultsContainer.classList.add('hidden');
//         favoritesContainer.classList.remove('hidden');
//         playerContainer.classList.add('hidden');
//         playerDiv.innerHTML = '';
//         displayFavorites();
//     }
// }

// Initial load: ensure search tab is active and favorites are hidden (제거)
// document.addEventListener('DOMContentLoaded', () => {
//     switchTab('search');
// });