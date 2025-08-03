const API_KEY = 'AIzaSyAT5oQSikvEJTkydNQE3mqMuaWVNM1ZwV8';

let searchInput;
let searchButton;
let videoList;
let playerContainer;
let playerDiv;
let backButton;
let searchContainer;
let resultsContainer;
let countrySelect;
let resultsCount;

// 간단한 번역 사전
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

document.addEventListener('DOMContentLoaded', () => {
    searchInput = document.getElementById('search-input');
    searchButton = document.getElementById('search-button');
    videoList = document.getElementById('video-list');
    playerContainer = document.getElementById('player-container');
    playerDiv = document.getElementById('player');
    backButton = document.getElementById('back-button');
    searchContainer = document.getElementById('search-container');
    resultsContainer = document.getElementById('results-container');
    countrySelect = document.getElementById('country-select');
    resultsCount = document.getElementById('results-count');

    searchButton.addEventListener('click', searchVideos);
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            searchVideos();
        }
    });

    backButton.addEventListener('click', goBackToList);

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

            // 사용자 키워드 또는 번역어가 제목 또는 설명에 포함되는지 확인
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
                   hasUserKeyword &&
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

            const videoItem = document.createElement('div');
            videoItem.classList.add('video-item');
            videoItem.dataset.videoId = videoId;

            videoItem.innerHTML = `
                <img src="${thumbnailUrl}" alt="${title}">
                <div class="title">${title}</div>
            `;

            videoItem.querySelector('img').addEventListener('click', () => playVideo(videoId));
            videoItem.querySelector('.title').addEventListener('click', () => playVideo(videoId));
            videoList.appendChild(videoItem);
        });
    }

    function playVideo(videoId) {
        searchContainer.classList.add('hidden');
        resultsContainer.classList.add('hidden');
        playerContainer.classList.remove('hidden');

        playerDiv.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&fs=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
        
        const iframe = playerDiv.querySelector('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
    }

    function goBackToList() {
        playerContainer.classList.add('hidden');
        searchContainer.classList.remove('hidden');
        resultsContainer.classList.remove('hidden');

        playerDiv.innerHTML = '';
    }
});
