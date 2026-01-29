/**
 * My Web Apps - Main Application Logic
 */

// --- 状態管理 ---
let apps = [];
let editingId = null;
let deletingId = null;

// --- 要素の取得 ---
const appGrid = document.getElementById('appGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const addBtn = document.getElementById('addBtn');
const modalOverlay = document.getElementById('modalOverlay');
const appForm = document.getElementById('appForm');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const modalTitle = document.getElementById('modalTitle');
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const closeDeleteModalBtn = document.getElementById('closeDeleteModal');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

// カレンダー要素
const calendarMonth = document.getElementById('calendarMonth');
const calendarDays = document.getElementById('calendarDays');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const resetFilterBtn = document.getElementById('resetFilter');
const totalCountEl = document.getElementById('totalCount');
const appImageInput = document.getElementById('appImage');
const imagePreview = document.getElementById('imagePreview');

let currentCalendarDate = new Date();
let selectedDateFilter = null;
let currentImageData = null;

// --- 初期化 ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadApps();
    initCalendar();
    renderApps();

    // 今日の日付をデフォルト設定
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appDate').value = today;
});

// --- 関数定義 ---

/**
 * データの読み込み
 */
function loadApps() {
    const savedApps = localStorage.getItem('web-app-manager-data');
    if (savedApps) {
        apps = JSON.parse(savedApps);
    } else {
        // 初期サンプルデータの投入
        apps = [
            {
                "id": "uuid1",
                "name": "薬確認アプリ",
                "url": "https://example.com/pillcheck",
                "description": "高齢者向け、薬飲んだか確認アプリ",
                "createdAt": "2026-01-29",
                "tags": ["健康", "簡単", "1ボタン"],
                "memo": "UIはシンプル、ボタン1つのみ。大きなフォントで見やすく設計しました。"
            },
            {
                "id": "uuid2",
                "name": "まとめアプリ",
                "url": "https://example.com/myapps",
                "description": "作ったWebアプリをまとめるアプリ",
                "createdAt": "2026-01-29",
                "tags": ["管理", "カード", "個人用"],
                "memo": "ローカル保存、検索・タグ対応。localStorageを使用してブラウザのみで完結させました。"
            }
        ];
        saveApps();
    }
}

/**
 * データの保存
 */
function saveApps() {
    localStorage.setItem('web-app-manager-data', JSON.stringify(apps));
    renderApps();
}

/**
 * アプリ一覧の描画
 */
function renderApps() {
    const searchTerm = searchInput.value.toLowerCase();

    // 統計の更新
    totalCountEl.textContent = apps.length;

    // フィルタリング
    const filteredApps = apps.filter(app => {
        // 名前・タグ検索
        const nameMatch = app.name.toLowerCase().includes(searchTerm);
        const tagMatch = app.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        const textMatch = nameMatch || tagMatch;

        // 日付フィルタ
        const dateMatch = !selectedDateFilter || app.createdAt === selectedDateFilter;

        return textMatch && dateMatch;
    });

    // グリッドをクリア
    appGrid.innerHTML = '';

    if (filteredApps.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');

        filteredApps.forEach(app => {
            const card = createAppCard(app);
            appGrid.appendChild(card);
        });
    }

    // カレンダーのドットを更新するために再描画（副作用を防ぐため、初回のみまたは必要な時だけ呼ぶ形でも良いが、ここではシンプルに連動させる）
    if (typeof renderCalendar === 'function') {
        renderCalendar();
    }
}

/**
 * カード要素の生成
 */
function createAppCard(app) {
    const div = document.createElement('div');
    div.className = 'app-card';
    div.innerHTML = `
        <div class="card-image-area">
            ${app.image ? `<img src="${app.image}" class="card-image" alt="${app.name}">` : `<div class="card-image">🖼️</div>`}
        </div>
        <div class="card-body">
            <div class="card-header">
                <a href="${app.url}" target="_blank" class="card-title">${app.name}</a>
                <div class="card-actions">
                    <button class="icon-btn edit-btn" title="編集">✏️</button>
                    <button class="icon-btn delete-btn" title="削除">🗑️</button>
                </div>
            </div>
            <a href="${app.url}" target="_blank" class="card-url">${app.url.length > 40 ? app.url.substring(0, 40) + '...' : app.url}</a>
            <div class="card-desc">${app.description || '説明はありません。'}</div>
            <div class="card-tags">
                ${app.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            ${app.memo ? `
                <button class="memo-toggle">▼ メモを表示</button>
                <div class="memo-content">${app.memo.replace(/\n/g, '<br>')}</div>
            ` : ''}
            <div class="card-footer">
                <span>📅 ${app.createdAt}</span>
            </div>
        </div>
    `;

    // イベントリスナーの登録
    div.querySelector('.edit-btn').addEventListener('click', () => openEditModal(app));
    div.querySelector('.delete-btn').addEventListener('click', () => {
        deletingId = app.id;
        deleteModal.classList.remove('hidden');
    });

    const memoToggle = div.querySelector('.memo-toggle');
    if (memoToggle) {
        memoToggle.addEventListener('click', () => {
            const content = div.querySelector('.memo-content');
            content.classList.toggle('active');
            memoToggle.textContent = content.classList.contains('active') ? '▲ メモを閉じる' : '▼ メモを表示';
        });
    }

    return div;
}

/**
 * UUIDの生成 (簡易版)
 */
function generateUUID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// --- イベントハンドラ ---

// 追加ボタンクリック
addBtn.addEventListener('click', () => {
    editingId = null;
    currentImageData = null;
    appForm.reset();
    imagePreview.innerHTML = '<span>画像を選択してください</span>';
    modalTitle.textContent = '新しいアプリを追加';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appDate').value = today;
    modalOverlay.classList.remove('hidden');
});

// 編集モーダルを開く
function openEditModal(app) {
    editingId = app.id;
    currentImageData = app.image;
    modalTitle.textContent = 'アプリを編集';
    document.getElementById('editId').value = app.id;
    document.getElementById('appName').value = app.name;
    document.getElementById('appUrl').value = app.url;
    document.getElementById('appDesc').value = app.description;
    document.getElementById('appDate').value = app.createdAt;
    document.getElementById('appTags').value = app.tags.join(', ');
    document.getElementById('appMemo').value = app.memo;

    if (app.image) {
        imagePreview.innerHTML = `<img src="${app.image}">`;
    } else {
        imagePreview.innerHTML = '<span>画像を選択してください</span>';
    }

    modalOverlay.classList.remove('hidden');
}

// モーダルを閉じる
function closeModals() {
    modalOverlay.classList.add('hidden');
    deleteModal.classList.add('hidden');
}

closeModal.addEventListener('click', closeModals);
cancelBtn.addEventListener('click', closeModals);
closeDeleteModalBtn.addEventListener('click', closeModals);

// フォーム送信
appForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('appName').value;
    const url = document.getElementById('appUrl').value;
    const description = document.getElementById('appDesc').value;
    const createdAt = document.getElementById('appDate').value;
    const tagInput = document.getElementById('appTags').value;
    const memo = document.getElementById('appMemo').value;

    const tags = tagInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    if (editingId) {
        // 更新
        const index = apps.findIndex(a => a.id === editingId);
        if (index !== -1) {
            apps[index] = { ...apps[index], name, url, description, createdAt, tags, memo, image: currentImageData };
        }
    } else {
        // 新規作成
        const newApp = {
            id: generateUUID(),
            name,
            url,
            description,
            createdAt,
            tags,
            memo,
            image: currentImageData
        };
        apps.unshift(newApp); // 新しいものを先頭に
    }

    saveApps();
    closeModals();
});

// 削除実行
confirmDeleteBtn.addEventListener('click', () => {
    if (deletingId) {
        apps = apps.filter(a => a.id !== deletingId);
        saveApps();
        closeModals();
        deletingId = null;
    }
});

// 検索入力
searchInput.addEventListener('input', renderApps);

// 画像アップロード処理
appImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            currentImageData = event.target.result;
            imagePreview.innerHTML = `<img src="${currentImageData}">`;
        };
        reader.readAsDataURL(file);
    }
});

// --- テーマ管理 ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark-mode');
        themeIcon.textContent = '☀️';
    }
}

themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    themeIcon.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// --- カレンダー管理 ---

function initCalendar() {
    prevMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar();
    });

    resetFilterBtn.addEventListener('click', () => {
        selectedDateFilter = null;
        renderCalendar();
        renderApps();
    });
}

function renderCalendar() {
    calendarDays.innerHTML = '';

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    calendarMonth.textContent = `${year}年 ${month + 1}月`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 空白の日
    for (let i = 0; i < firstDay; i++) {
        const div = document.createElement('div');
        div.className = 'cal-day empty';
        calendarDays.appendChild(div);
    }

    // 日付
    const today = new Date().toISOString().split('T')[0];

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const div = document.createElement('div');
        div.className = 'cal-day';
        div.textContent = day;

        if (dateStr === today) div.classList.add('today');
        if (dateStr === selectedDateFilter) div.classList.add('selected');

        // アプリがあるかチェック
        const hasApp = apps.some(app => app.createdAt === dateStr);
        if (hasApp) div.classList.add('has-app');

        div.addEventListener('click', () => {
            if (selectedDateFilter === dateStr) {
                selectedDateFilter = null;
            } else {
                selectedDateFilter = dateStr;
            }
            renderCalendar();
            renderApps();
        });

        calendarDays.appendChild(div);
    }
}

// 背景クリックでモーダルを閉じる
window.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModals();
    if (e.target === deleteModal) closeModals();
});
