// ==========================================
// STORAGE LAYER - LocalStorage管理
// ==========================================
// LocalStorageとのやり取りを担当するモジュール
// 将来的なバックエンド移行を見据えた抽象化レイヤー

// LocalStorageキー定義
const STORAGE_KEYS = {
  TODOS: 'todoapp_todos',
  SETTINGS: 'todoapp_settings',
  COLLAPSE_STATE: 'todoapp_collapse',
  GROUPS: 'todoapp_groups',
  ACTIVE_GROUP: 'todoapp_active_group'
};

// デフォルト設定
const DEFAULT_SETTINGS = {
  tags: [],
  theme: 'light',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  filters: {
    selectedTags: [],
    selectedPriorities: [],
    showCompleted: true
  }
};

/**
 * LocalStorageからTODOデータを読み込む
 * @returns {Array} TODOアイテムの配列
 */
function loadTodos() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TODOS);

    // データが存在しない場合は空配列を返す
    if (!data) {
      return [];
    }

    // JSONパース
    const todos = JSON.parse(data);

    // 配列でない場合は空配列を返す
    if (!Array.isArray(todos)) {
      console.warn('Invalid todos data format. Returning empty array.');
      return [];
    }

    return todos;
  } catch (error) {
    console.error('Failed to load todos from LocalStorage:', error);
    // パースエラーの場合も空配列を返す
    return [];
  }
}

/**
 * LocalStorageにTODOデータを保存する
 * @param {Array} todos - TODOアイテムの配列
 * @returns {boolean} 保存成功の可否
 */
function saveTodos(todos) {
  try {
    // 配列でない場合はエラー
    if (!Array.isArray(todos)) {
      console.error('saveTodos: todos must be an array');
      return false;
    }

    // JSON文字列に変換して保存
    const data = JSON.stringify(todos);
    localStorage.setItem(STORAGE_KEYS.TODOS, data);

    return true;
  } catch (error) {
    // QuotaExceededErrorなどのエラーをキャッチ
    if (error.name === 'QuotaExceededError') {
      console.error('LocalStorage quota exceeded. Cannot save todos.');
    } else {
      console.error('Failed to save todos to LocalStorage:', error);
    }
    return false;
  }
}

/**
 * LocalStorageから設定データを読み込む
 * @returns {Object} 設定オブジェクト
 */
function loadSettings() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);

    // データが存在しない場合はデフォルト設定を返す
    if (!data) {
      return { ...DEFAULT_SETTINGS };
    }

    // JSONパース
    const settings = JSON.parse(data);

    // デフォルト設定とマージ（新しいフィールドが追加された場合に対応）
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      filters: {
        ...DEFAULT_SETTINGS.filters,
        ...(settings.filters || {})
      }
    };
  } catch (error) {
    console.error('Failed to load settings from LocalStorage:', error);
    // パースエラーの場合はデフォルト設定を返す
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * LocalStorageに設定データを保存する
 * @param {Object} settings - 設定オブジェクト
 * @returns {boolean} 保存成功の可否
 */
function saveSettings(settings) {
  try {
    // オブジェクトでない場合はエラー
    if (typeof settings !== 'object' || settings === null) {
      console.error('saveSettings: settings must be an object');
      return false;
    }

    // JSON文字列に変換して保存
    const data = JSON.stringify(settings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, data);

    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('LocalStorage quota exceeded. Cannot save settings.');
    } else {
      console.error('Failed to save settings to LocalStorage:', error);
    }
    return false;
  }
}

/**
 * LocalStorageから全てのアプリデータを削除する
 * デバッグ用の関数
 * @returns {boolean} 削除成功の可否
 */
function clearAllData() {
  try {
    localStorage.removeItem(STORAGE_KEYS.TODOS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.COLLAPSE_STATE);
    localStorage.removeItem(STORAGE_KEYS.GROUPS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_GROUP);

    console.log('All app data cleared from LocalStorage.');
    return true;
  } catch (error) {
    console.error('Failed to clear data from LocalStorage:', error);
    return false;
  }
}

/**
 * LocalStorageから折りたたみ状態を読み込む
 * @returns {Object} タスクIDと展開状態のマップ
 */
function loadCollapseState() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.COLLAPSE_STATE);

    if (!data) {
      return {};
    }

    const state = JSON.parse(data);

    if (typeof state !== 'object' || state === null) {
      return {};
    }

    return state;
  } catch (error) {
    console.error('Failed to load collapse state from LocalStorage:', error);
    return {};
  }
}

/**
 * LocalStorageに折りたたみ状態を保存する
 * @param {Object} state - タスクIDと展開状態のマップ
 * @returns {boolean} 保存成功の可否
 */
function saveCollapseState(state) {
  try {
    if (typeof state !== 'object' || state === null) {
      console.error('saveCollapseState: state must be an object');
      return false;
    }

    const data = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEYS.COLLAPSE_STATE, data);

    return true;
  } catch (error) {
    console.error('Failed to save collapse state to LocalStorage:', error);
    return false;
  }
}

// ==========================================
// グループ関連のストレージ関数
// ==========================================

/**
 * LocalStorageからグループデータを読み込む
 * @returns {Array} TaskGroupの配列
 */
function loadGroups() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GROUPS);

    if (!data) {
      return [];
    }

    const groups = JSON.parse(data);

    if (!Array.isArray(groups)) {
      console.warn('Invalid groups data format. Returning empty array.');
      return [];
    }

    return groups;
  } catch (error) {
    console.error('Failed to load groups from LocalStorage:', error);
    return [];
  }
}

/**
 * LocalStorageにグループデータを保存する
 * @param {Array} groups - TaskGroupの配列
 * @returns {boolean} 保存成功の可否
 */
function saveGroups(groups) {
  try {
    if (!Array.isArray(groups)) {
      console.error('saveGroups: groups must be an array');
      return false;
    }

    const data = JSON.stringify(groups);
    localStorage.setItem(STORAGE_KEYS.GROUPS, data);

    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('LocalStorage quota exceeded. Cannot save groups.');
    } else {
      console.error('Failed to save groups to LocalStorage:', error);
    }
    return false;
  }
}

/**
 * LocalStorageからアクティブグループIDを読み込む
 * @returns {string|null} アクティブグループのID、または null
 */
function loadActiveGroup() {
  try {
    const groupId = localStorage.getItem(STORAGE_KEYS.ACTIVE_GROUP);
    return groupId || null;
  } catch (error) {
    console.error('Failed to load active group from LocalStorage:', error);
    return null;
  }
}

/**
 * LocalStorageにアクティブグループIDを保存する
 * @param {string|null} groupId - アクティブグループのID
 * @returns {boolean} 保存成功の可否
 */
function saveActiveGroup(groupId) {
  try {
    if (groupId === null) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_GROUP);
    } else {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_GROUP, groupId);
    }
    return true;
  } catch (error) {
    console.error('Failed to save active group to LocalStorage:', error);
    return false;
  }
}
