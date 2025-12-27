// ==========================================
// APP - アプリケーション統合層
// ==========================================
// 各モジュールを統合し、アプリケーション全体を管理

/**
 * Appクラス
 * アプリケーション全体の初期化と管理を担当
 */
class App {
  /**
   * コンストラクタ
   */
  constructor() {
    // TodoManagerのインスタンス
    this.todoManager = null;

    // UIManagerのインスタンス
    this.uiManager = null;

    // アプリケーション設定
    this.settings = null;
  }

  /**
   * アプリケーション初期化
   */
  init() {
    console.log('🚀 TODOアプリを初期化中...');

    // データマイグレーションを実行
    this.migrateDataIfNeeded();

    // 設定を読み込む
    this.settings = loadSettings();

    // TodoManagerを初期化
    this.todoManager = new TodoManager();
    this.todoManager.init();

    // UIManagerを初期化
    this.uiManager = new UIManager(this.todoManager);
    this.uiManager.init();

    // テーマを初期化
    this.initTheme();

    // 繰り返しタスクのスケジュールチェック
    this.checkScheduledRecurrences();

    console.log('✅ TODOアプリの初期化完了');
  }

  /**
   * テーマの初期化
   */
  initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector('.theme-icon');

    // 保存されたテーマ設定を適用
    const savedTheme = this.settings.theme;

    // システムのprefers-color-schemeを検出
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // テーマを決定（保存された設定 > システム設定）
    let currentTheme = savedTheme;
    if (!currentTheme) {
      currentTheme = prefersDark ? 'dark' : 'light';
    }

    // テーマを適用
    this.applyTheme(currentTheme);

    // テーマ切り替えボタンのイベント
    themeToggle.addEventListener('click', () => {
      const newTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      this.applyTheme(newTheme);

      // 設定を保存
      this.settings.theme = newTheme;
      saveSettings(this.settings);
    });
  }

  /**
   * テーマを適用
   * @param {string} theme - テーマ ('light' または 'dark')
   */
  applyTheme(theme) {
    const themeIcon = document.querySelector('.theme-icon');

    // data-theme属性を設定（:rootに適用するためdocumentElementを使用）
    document.documentElement.dataset.theme = theme;

    // アイコンを更新
    if (theme === 'dark') {
      themeIcon.textContent = '☀️';
    } else {
      themeIcon.textContent = '🌙';
    }
  }

  /**
   * 繰り返しタスクのスケジュールチェック
   * 「期限になったら生成」設定のタスクを確認し、必要に応じて生成
   */
  checkScheduledRecurrences() {
    const generatedTasks = this.todoManager.checkScheduledRecurrences();

    if (generatedTasks.length > 0) {
      console.log(`🔄 ${generatedTasks.length}件の繰り返しタスクを生成しました`);
      // UIを再描画
      this.uiManager.render();
    }
  }

  /**
   * データマイグレーション
   * カテゴリをタグに統合するマイグレーション処理
   */
  migrateDataIfNeeded() {
    let migrated = false;

    // 設定のマイグレーション
    const settingsRaw = localStorage.getItem('todoapp_settings');
    if (settingsRaw) {
      try {
        const settings = JSON.parse(settingsRaw);

        // categoriesをtagsに統合
        if (settings.categories && Array.isArray(settings.categories)) {
          if (!settings.tags) {
            settings.tags = [];
          }
          // カテゴリをタグに追加（重複を避ける）
          settings.categories.forEach(cat => {
            if (!settings.tags.includes(cat)) {
              settings.tags.push(cat);
            }
          });
          delete settings.categories;
          migrated = true;
        }

        // filters.selectedCategoryをselectedTagsに統合
        if (settings.filters && settings.filters.selectedCategory) {
          if (!settings.filters.selectedTags) {
            settings.filters.selectedTags = [];
          }
          if (settings.filters.selectedCategory && !settings.filters.selectedTags.includes(settings.filters.selectedCategory)) {
            settings.filters.selectedTags.push(settings.filters.selectedCategory);
          }
          delete settings.filters.selectedCategory;
          migrated = true;
        }

        if (migrated) {
          localStorage.setItem('todoapp_settings', JSON.stringify(settings));
          console.log('📦 設定のマイグレーションが完了しました');
        }
      } catch (e) {
        console.error('設定のマイグレーションに失敗しました:', e);
      }
    }

    // タスクのマイグレーション
    const todosRaw = localStorage.getItem('todoapp_todos');
    if (todosRaw) {
      try {
        const todos = JSON.parse(todosRaw);
        let todosMigrated = false;

        todos.forEach(todo => {
          // categoryフィールドをtagsに統合
          if (todo.category && typeof todo.category === 'string' && todo.category.trim() !== '') {
            if (!todo.tags) {
              todo.tags = [];
            }
            if (!todo.tags.includes(todo.category)) {
              todo.tags.push(todo.category);
            }
            delete todo.category;
            todosMigrated = true;
          } else if (todo.hasOwnProperty('category')) {
            // 空のcategoryフィールドを削除
            delete todo.category;
            todosMigrated = true;
          }
        });

        if (todosMigrated) {
          localStorage.setItem('todoapp_todos', JSON.stringify(todos));
          console.log('📦 タスクのマイグレーションが完了しました');
        }
      } catch (e) {
        console.error('タスクのマイグレーションに失敗しました:', e);
      }
    }
  }

  /**
   * アプリケーション準備完了時の処理
   */
  onAppReady() {
    console.log('📱 アプリケーションの準備が完了しました');

    // 将来的な拡張用（通知、定期チェックなど）
  }
}

// ==========================================
// アプリケーション起動
// ==========================================

// DOMContentLoadedイベントでアプリケーションを初期化
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
  app.onAppReady();
});
