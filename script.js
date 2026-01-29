document.addEventListener('DOMContentLoaded', () => {
    const drinkButton = document.getElementById('drink-button');
    const buttonText = document.getElementById('button-text');
    const todayDateDisplay = document.getElementById('today-date');
    const historyList = document.getElementById('history-list');
    const toggleHistoryBtn = document.getElementById('toggle-history');

    // カレンダー関連の要素
    const calendarModal = document.getElementById('calendar-modal');
    const calendarToggle = document.getElementById('calendar-toggle');
    const closeCalendar = document.getElementById('close-calendar');
    const calendarGrid = document.getElementById('calendar-grid');
    const calendarMonthYear = document.getElementById('calendar-month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const adminModeToggle = document.getElementById('admin-mode-toggle');

    let currentViewDate = new Date(); // カレンダー表示用の基準日
    let isAdminMode = false;

    // 今日の日付を取得 (YYYY-MM-DD形式)
    const getTodayString = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const todayStr = getTodayString();

    // 日本語形式の表示用日付
    const getFormattedDate = () => {
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        return now.toLocaleDateString('ja-JP', options);
    };

    todayDateDisplay.textContent = getFormattedDate();

    // ローカルストレージからデータを読み込む
    let medicineData = JSON.parse(localStorage.getItem('medicine_records')) || {};

    // 1年以上前のデータを削除するクリーンアップ
    const cleanupOldData = (data) => {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const newData = {};
        for (const date in data) {
            if (new Date(date) >= oneYearAgo) {
                newData[date] = data[date];
            }
        }
        return newData;
    };

    medicineData = cleanupOldData(medicineData);
    localStorage.setItem('medicine_records', JSON.stringify(medicineData));

    // ボタンの状態を更新
    const updateButtonState = () => {
        if (medicineData[todayStr]) {
            drinkButton.classList.add('taken');
            buttonText.textContent = '飲みました！';
            drinkButton.disabled = true;
        } else {
            drinkButton.classList.remove('taken');
            buttonText.textContent = '飲んでない';
            drinkButton.disabled = false;
        }
    };

    // 履歴リストを表示
    const renderHistory = () => {
        historyList.innerHTML = '';
        const sortedDates = Object.keys(medicineData).sort((a, b) => new Date(b) - new Date(a));

        if (sortedDates.length === 0) {
            historyList.innerHTML = '<p style="text-align:center; color:#8E8E93;">記録がありません</p>';
            return;
        }

        sortedDates.forEach(date => {
            const item = document.createElement('div');
            item.className = 'history-item';

            const dateObj = new Date(date);
            const dateFormatted = dateObj.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' });

            item.innerHTML = `
                <span>${date} (${dateFormatted})</span>
                <span class="status-taken">飲んだ</span>
            `;
            historyList.appendChild(item);
        });
    };

    // ボタンクリックイベント
    drinkButton.addEventListener('click', () => {
        if (!medicineData[todayStr]) {
            medicineData[todayStr] = true;
            localStorage.setItem('medicine_records', JSON.stringify(medicineData));
            updateButtonState();
            renderHistory();

            // 簡単なアニメーション効果
            drinkButton.style.transform = 'scale(0.95)';
            setTimeout(() => {
                drinkButton.style.transform = '';
            }, 100);
        }
    });

    // カレンダーを表示
    const renderCalendar = () => {
        calendarGrid.innerHTML = '';
        const year = currentViewDate.getFullYear();
        const month = currentViewDate.getMonth();

        // 表示月ラベル
        calendarMonthYear.textContent = `${year}年 ${month + 1}月`;

        // 月の最初の日と最後の日
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const lastDateOfMonth = new Date(year, month + 1, 0).getDate();

        // 空白セル (月の開始曜日まで)
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            calendarGrid.appendChild(emptyCell);
        }

        // 日付セル
        for (let day = 1; day <= lastDateOfMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.textContent = day;

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            // 今日のハイライト
            if (dateStr === todayStr) {
                dayCell.classList.add('today');
            }

            // 飲んだ記録があるか
            if (medicineData[dateStr]) {
                const dot = document.createElement('span');
                dot.className = 'dot taken-dot';
                dayCell.appendChild(dot);
            }

            // 管理モード時の設定
            if (isAdminMode) {
                dayCell.classList.add('editable');
                dayCell.title = 'クリックで記録を切り替え';
                dayCell.addEventListener('click', () => {
                    toggleRecord(dateStr);
                });
            }

            calendarGrid.appendChild(dayCell);
        }

        // 常に6行(42セル)にするための残りの空白埋め
        const totalCells = firstDayOfMonth + lastDateOfMonth;
        const remainingCells = 42 - totalCells;
        for (let i = 0; i < remainingCells; i++) {
            const emptyCell = document.createElement('div');
            calendarGrid.appendChild(emptyCell);
        }
    };

    // 記録を切り替える (管理モード用)
    const toggleRecord = (dateStr) => {
        if (medicineData[dateStr]) {
            delete medicineData[dateStr];
        } else {
            medicineData[dateStr] = true;
        }
        localStorage.setItem('medicine_records', JSON.stringify(medicineData));
        renderCalendar();
        updateButtonState(); // 今日の記録が変わった場合に備えてメイン画面も更新
    };

    // 管理モードの切り替え
    adminModeToggle.addEventListener('click', () => {
        isAdminMode = !isAdminMode;
        if (isAdminMode) {
            adminModeToggle.classList.add('active');
            adminModeToggle.textContent = '管理モード: オン';
        } else {
            adminModeToggle.classList.remove('active');
            adminModeToggle.textContent = '管理モード: オフ';
        }
        renderCalendar();
    });

    // カレンダーの開閉
    calendarToggle.addEventListener('click', () => {
        calendarModal.classList.remove('hidden');
        currentViewDate = new Date(); // 開いたときは今月を表示
        isAdminMode = false; // 開くたびに管理モードはオフで開始
        adminModeToggle.classList.remove('active');
        adminModeToggle.textContent = '管理モード: オフ';
        renderCalendar();
    });

    closeCalendar.addEventListener('click', () => {
        calendarModal.classList.add('hidden');
    });

    // モーダル外クリックで閉じる
    window.addEventListener('click', (e) => {
        if (e.target === calendarModal) {
            calendarModal.classList.add('hidden');
        }
    });

    // 月移動
    prevMonthBtn.addEventListener('click', () => {
        currentViewDate.setMonth(currentViewDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentViewDate.setMonth(currentViewDate.getMonth() + 1);
        renderCalendar();
    });

    // 履歴表示切り替え
    toggleHistoryBtn.addEventListener('click', () => {
        const isHidden = historyList.classList.toggle('hidden');
        toggleHistoryBtn.textContent = isHidden ? '過去の記録を表示' : '記録を閉じる';
        if (!isHidden) {
            renderHistory();
        }
    });

    // 初期化
    updateButtonState();
});
