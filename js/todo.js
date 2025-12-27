// ==========================================
// TODO BUSINESS LOGIC LAYER
// ==========================================
// TODOのビジネスロジックを管理するクラス
// データの作成、更新、削除、フィルタリング、ソートなど

/**
 * TodoManagerクラス
 * TODOアイテムの管理を担当
 */
class TodoManager {
  /**
   * コンストラクタ
   */
  constructor() {
    // プライベート変数: TODOアイテムの配列
    this.todos = [];
    // グループの配列
    this.groups = [];
    // アクティブなグループID
    this.activeGroupId = null;
  }

  /**
   * 初期化
   * storageからデータを読み込む
   */
  init() {
    this.todos = loadTodos();
    this.groups = loadGroups();
    this.activeGroupId = loadActiveGroup();

    // グループが存在しない場合、デフォルトグループを作成
    if (this.groups.length === 0) {
      this.createGroup('メイン');
    }

    // アクティブグループが無効な場合、最初のグループを選択
    if (!this.activeGroupId || !this.getGroup(this.activeGroupId)) {
      this.activeGroupId = this.groups[0]?.id || null;
      saveActiveGroup(this.activeGroupId);
    }
  }

  /**
   * 現在のTODOデータをstorageに保存
   * @returns {boolean} 保存成功の可否
   */
  save() {
    return saveTodos(this.todos);
  }

  // ==========================================
  // CRUD操作 (Create, Read, Update, Delete)
  // ==========================================

  /**
   * 新しいTODOを作成
   * @param {Object} data - TODOデータ
   * @returns {Object|null} 作成されたTODOアイテム、失敗時はnull
   */
  createTodo(data) {
    // バリデーション（後で実装する validateTodo を使用予定）
    if (!data.title || typeof data.title !== 'string') {
      console.error('createTodo: title is required');
      return null;
    }

    // ユニークID生成
    const id = this.generateId();

    // 現在のタイムスタンプ
    const now = new Date().toISOString();

    // 新しいTODOアイテムを作成（デフォルト値を設定）
    const newTodo = {
      // 基本フィールド
      id: id,
      title: data.title.trim(),
      description: data.description ? data.description.trim() : '',
      completed: false,

      // グループ（指定がなければアクティブグループを使用）
      groupId: data.groupId || this.activeGroupId,

      // 分類フィールド
      tags: Array.isArray(data.tags) ? data.tags : [],
      priority: data.priority || 'medium',

      // 日時フィールド
      dueDate: data.dueDate || null,
      createdAt: now,
      updatedAt: now,

      // サブタスク関連（フェーズ6で使用）
      parentId: data.parentId || null,
      subtaskIds: [],

      // 繰り返しタスク関連（フェーズ7で使用）
      recurrence: data.recurrence || null
    };

    // 配列に追加
    this.todos.push(newTodo);

    // 保存
    this.save();

    return newTodo;
  }

  /**
   * IDでTODOを取得
   * @param {string} id - TODOID
   * @returns {Object|null} TODOアイテム、見つからない場合はnull
   */
  getTodo(id) {
    return this.todos.find(todo => todo.id === id) || null;
  }

  /**
   * 全てのTODOを取得
   * @returns {Array} 全TODOアイテムの配列
   */
  getAllTodos() {
    return [...this.todos];
  }

  /**
   * TODOを更新
   * @param {string} id - TODOID
   * @param {Object} updates - 更新するフィールド
   * @returns {Object|null} 更新されたTODOアイテム、失敗時はnull
   */
  updateTodo(id, updates) {
    const index = this.todos.findIndex(todo => todo.id === id);

    if (index === -1) {
      console.error(`updateTodo: todo with id ${id} not found`);
      return null;
    }

    // 更新禁止フィールドを除外
    const { id: _, createdAt: __, ...allowedUpdates } = updates;

    // 更新
    this.todos[index] = {
      ...this.todos[index],
      ...allowedUpdates,
      updatedAt: new Date().toISOString()
    };

    // 保存
    this.save();

    return this.todos[index];
  }

  /**
   * TODOを削除
   * @param {string} id - TODOID
   * @returns {boolean} 削除成功の可否
   */
  deleteTodo(id) {
    const todo = this.getTodo(id);

    if (!todo) {
      console.error(`deleteTodo: todo with id ${id} not found`);
      return false;
    }

    // 再帰的に全ての子孫を削除
    const deleteRecursive = (todoId) => {
      const t = this.getTodo(todoId);
      if (t && t.subtaskIds && t.subtaskIds.length > 0) {
        // 子タスクを先に削除
        [...t.subtaskIds].forEach(childId => deleteRecursive(childId));
      }
      // 自身を削除
      const index = this.todos.findIndex(item => item.id === todoId);
      if (index !== -1) {
        this.todos.splice(index, 1);
      }
    };

    // 親タスクのsubtaskIdsから自身を削除
    if (todo.parentId) {
      const parent = this.getTodo(todo.parentId);
      if (parent && parent.subtaskIds) {
        parent.subtaskIds = parent.subtaskIds.filter(childId => childId !== id);
      }
    }

    // 削除実行
    deleteRecursive(id);

    // 保存
    this.save();

    return true;
  }

  /**
   * TODOの完了状態を切り替え
   * @param {string} id - TODOID
   * @returns {Object|null} 更新されたTODOアイテム、失敗時はnull
   */
  toggleComplete(id) {
    const todo = this.getTodo(id);

    if (!todo) {
      console.error(`toggleComplete: todo with id ${id} not found`);
      return null;
    }

    // 完了状態を反転
    return this.updateTodo(id, { completed: !todo.completed });
  }

  // ==========================================
  // フィルタリング・ソート
  // ==========================================

  /**
   * TODOをフィルタリング
   * @param {Object} filters - フィルター条件
   * @returns {Array} フィルター後のTODO配列
   */
  filterTodos(filters = {}) {
    let filtered = [...this.todos];

    // タグフィルター（複数選択可能）
    if (filters.selectedTags && filters.selectedTags.length > 0) {
      filtered = filtered.filter(todo => {
        // 選択されたタグのいずれかを含むTODOを抽出
        return filters.selectedTags.some(tag => todo.tags.includes(tag));
      });
    }

    // 優先度フィルター（複数選択可能）
    if (filters.selectedPriorities && filters.selectedPriorities.length > 0) {
      filtered = filtered.filter(todo => {
        return filters.selectedPriorities.includes(todo.priority);
      });
    }

    // 完了状態フィルター
    if (filters.showCompleted === false) {
      filtered = filtered.filter(todo => !todo.completed);
    }

    return filtered;
  }

  /**
   * TODOをソート
   * @param {Array} todos - ソート対象のTODO配列
   * @param {string} sortBy - ソート基準 ('createdAt', 'dueDate', 'priority', 'title')
   * @param {string} sortOrder - ソート順 ('asc', 'desc')
   * @returns {Array} ソート後のTODO配列
   */
  sortTodos(todos, sortBy = 'createdAt', sortOrder = 'desc') {
    const sorted = [...todos];

    // 優先度の値マップ（高→中→低の順）
    const priorityMap = { high: 3, medium: 2, low: 1 };

    sorted.sort((a, b) => {
      let compareResult = 0;

      switch (sortBy) {
        case 'createdAt':
          compareResult = new Date(a.createdAt) - new Date(b.createdAt);
          break;

        case 'dueDate':
          // 期限なし（null）は最後に配置
          if (a.dueDate === null && b.dueDate === null) {
            compareResult = 0;
          } else if (a.dueDate === null) {
            compareResult = 1;
          } else if (b.dueDate === null) {
            compareResult = -1;
          } else {
            compareResult = new Date(a.dueDate) - new Date(b.dueDate);
          }
          break;

        case 'priority':
          compareResult = priorityMap[a.priority] - priorityMap[b.priority];
          break;

        case 'title':
          compareResult = a.title.localeCompare(b.title);
          break;

        default:
          compareResult = 0;
      }

      // ソート順を反転（descの場合）
      return sortOrder === 'desc' ? -compareResult : compareResult;
    });

    return sorted;
  }

  // ==========================================
  // バリデーション
  // ==========================================

  /**
   * TODOデータのバリデーション
   * @param {Object} data - バリデーション対象のデータ
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validateTodo(data) {
    const errors = [];

    // タイトル必須チェック
    if (!data.title || typeof data.title !== 'string') {
      errors.push('タイトルは必須です');
    } else {
      const title = data.title.trim();

      // 1文字以上100文字以下
      if (title.length === 0) {
        errors.push('タイトルは1文字以上必要です');
      } else if (title.length > 100) {
        errors.push('タイトルは100文字以内にしてください');
      }
    }

    // 説明の文字数制限チェック
    if (data.description && typeof data.description === 'string') {
      if (data.description.length > 500) {
        errors.push('説明は500文字以内にしてください');
      }
    }

    // 優先度値チェック
    if (data.priority) {
      const validPriorities = ['high', 'medium', 'low'];
      if (!validPriorities.includes(data.priority)) {
        errors.push('優先度は high, medium, low のいずれかを指定してください');
      }
    }

    // 期限日付チェック
    if (data.dueDate !== null && data.dueDate !== undefined) {
      const date = new Date(data.dueDate);
      if (isNaN(date.getTime())) {
        errors.push('期限日付の形式が不正です');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // ==========================================
  // ユーティリティ
  // ==========================================

  /**
   * 期限日のステータスを判定
   * @param {string|null} dueDate - 期限日（ISO 8601形式）
   * @returns {string} ステータス ('overdue', 'today', 'tomorrow', 'upcoming', 'none')
   */
  getDueDateStatus(dueDate) {
    if (!dueDate) {
      return 'none';
    }

    const now = new Date();
    const due = new Date(dueDate);

    // 日付のみで比較（時刻を無視）
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueOnlyDate = new Date(due.getFullYear(), due.getMonth(), due.getDate());

    // 期限切れ
    if (dueOnlyDate < nowDate) {
      return 'overdue';
    }

    // 今日が期限
    if (dueOnlyDate.getTime() === nowDate.getTime()) {
      return 'today';
    }

    // 明日が期限
    const tomorrow = new Date(nowDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dueOnlyDate.getTime() === tomorrow.getTime()) {
      return 'tomorrow';
    }

    // それ以降
    return 'upcoming';
  }

  /**
   * ユニークIDを生成
   * @returns {string} ユニークID
   */
  generateId() {
    // タイムスタンプ + ランダム文字列
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 11);
    return `${timestamp}-${randomStr}`;
  }

  // ==========================================
  // グループ管理
  // ==========================================

  /**
   * 新しいグループを作成
   * @param {string} name - グループ名
   * @returns {Object|null} 作成されたグループ、失敗時はnull
   */
  createGroup(name) {
    if (!name || typeof name !== 'string') {
      console.error('createGroup: name is required');
      return null;
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0 || trimmedName.length > 30) {
      console.error('createGroup: name must be 1-30 characters');
      return null;
    }

    const newGroup = {
      id: this.generateId(),
      name: trimmedName,
      order: this.groups.length,
      createdAt: new Date().toISOString()
    };

    this.groups.push(newGroup);
    saveGroups(this.groups);

    return newGroup;
  }

  /**
   * IDでグループを取得
   * @param {string} id - グループID
   * @returns {Object|null} グループ、見つからない場合はnull
   */
  getGroup(id) {
    return this.groups.find(group => group.id === id) || null;
  }

  /**
   * 全グループを取得
   * @returns {Array} 全グループの配列（order順にソート）
   */
  getAllGroups() {
    return [...this.groups].sort((a, b) => a.order - b.order);
  }

  /**
   * グループを更新
   * @param {string} id - グループID
   * @param {Object} updates - 更新するフィールド
   * @returns {Object|null} 更新されたグループ、失敗時はnull
   */
  updateGroup(id, updates) {
    const index = this.groups.findIndex(group => group.id === id);

    if (index === -1) {
      console.error(`updateGroup: group with id ${id} not found`);
      return null;
    }

    // 更新禁止フィールドを除外
    const { id: _, createdAt: __, ...allowedUpdates } = updates;

    // 名前のバリデーション
    if (allowedUpdates.name !== undefined) {
      const trimmedName = allowedUpdates.name.trim();
      if (trimmedName.length === 0 || trimmedName.length > 30) {
        console.error('updateGroup: name must be 1-30 characters');
        return null;
      }
      allowedUpdates.name = trimmedName;
    }

    this.groups[index] = {
      ...this.groups[index],
      ...allowedUpdates
    };

    saveGroups(this.groups);
    return this.groups[index];
  }

  /**
   * グループを削除
   * @param {string} id - グループID
   * @returns {boolean} 削除成功の可否
   */
  deleteGroup(id) {
    // 最後のグループは削除できない
    if (this.groups.length <= 1) {
      console.error('deleteGroup: cannot delete the last group');
      return false;
    }

    const index = this.groups.findIndex(group => group.id === id);

    if (index === -1) {
      console.error(`deleteGroup: group with id ${id} not found`);
      return false;
    }

    // グループに属するタスクも削除
    this.todos = this.todos.filter(todo => todo.groupId !== id);
    this.save();

    // グループを削除
    this.groups.splice(index, 1);
    saveGroups(this.groups);

    // 削除したグループがアクティブだった場合、別のグループをアクティブに
    if (this.activeGroupId === id) {
      this.activeGroupId = this.groups[0]?.id || null;
      saveActiveGroup(this.activeGroupId);
    }

    return true;
  }

  /**
   * アクティブグループを設定
   * @param {string} id - グループID（'all'で全タスク表示）
   * @returns {boolean} 設定成功の可否
   */
  setActiveGroup(id) {
    // 'all'は特別な値として許可
    if (id === 'all') {
      this.activeGroupId = 'all';
      saveActiveGroup('all');
      return true;
    }

    const group = this.getGroup(id);
    if (!group) {
      console.error(`setActiveGroup: group with id ${id} not found`);
      return false;
    }

    this.activeGroupId = id;
    saveActiveGroup(id);
    return true;
  }

  /**
   * アクティブグループを取得
   * @returns {Object|null} アクティブグループ
   */
  getActiveGroup() {
    return this.getGroup(this.activeGroupId);
  }

  /**
   * グループに属するTODOを取得
   * @param {string} groupId - グループID（'all'で全タスク取得）
   * @returns {Array} グループに属するTODOの配列
   */
  getTodosByGroup(groupId) {
    if (groupId === 'all') {
      return [...this.todos];
    }
    return this.todos.filter(todo => todo.groupId === groupId);
  }

  // ==========================================
  // サブタスク管理
  // ==========================================

  /**
   * サブタスクを取得
   * @param {string} parentId - 親タスクのID
   * @returns {Array} サブタスクの配列
   */
  getSubtasks(parentId) {
    const parent = this.getTodo(parentId);
    if (!parent || !parent.subtaskIds) return [];
    return parent.subtaskIds
      .map(id => this.getTodo(id))
      .filter(todo => todo !== null);
  }

  /**
   * 循環参照をチェック
   * @param {string} parentId - 親タスクID
   * @param {string} childId - 子タスクID
   * @returns {boolean} 循環参照があればtrue
   */
  hasCircularReference(parentId, childId) {
    let current = this.getTodo(parentId);
    while (current && current.parentId) {
      if (current.parentId === childId) return true;
      current = this.getTodo(current.parentId);
    }
    return false;
  }

  /**
   * サブタスクを追加
   * @param {string} parentId - 親タスクのID
   * @param {Object} subtaskData - サブタスクのデータ
   * @returns {Object|null} 作成されたサブタスク
   */
  addSubtask(parentId, subtaskData) {
    const parent = this.getTodo(parentId);
    if (!parent) {
      console.error(`addSubtask: parent with id ${parentId} not found`);
      return null;
    }

    // サブタスクデータに親IDとグループIDを設定
    subtaskData.parentId = parentId;
    subtaskData.groupId = parent.groupId;

    const subtask = this.createTodo(subtaskData);
    if (!subtask) return null;

    // 親のsubtaskIdsに追加
    if (!parent.subtaskIds) {
      parent.subtaskIds = [];
    }
    parent.subtaskIds.push(subtask.id);
    this.save();

    return subtask;
  }

  /**
   * サブタスクの進捗を取得（再帰的）
   * @param {string} parentId - 親タスクのID
   * @returns {Object} { total: number, completed: number }
   */
  getSubtaskProgress(parentId) {
    const countRecursive = (todoId) => {
      const todo = this.getTodo(todoId);
      if (!todo || !todo.subtaskIds) return { total: 0, completed: 0 };

      let total = 0;
      let completed = 0;

      todo.subtaskIds.forEach(childId => {
        const child = this.getTodo(childId);
        if (child) {
          total++;
          if (child.completed) completed++;
          // 孫以下も再帰的にカウント
          const childProgress = countRecursive(childId);
          total += childProgress.total;
          completed += childProgress.completed;
        }
      });

      return { total, completed };
    };

    return countRecursive(parentId);
  }

  /**
   * 未完了のサブタスク数を取得
   * @param {string} parentId - 親タスクのID
   * @returns {number} 未完了のサブタスク数
   */
  getIncompleteSubtasksCount(parentId) {
    const progress = this.getSubtaskProgress(parentId);
    return progress.total - progress.completed;
  }

  /**
   * 全てのサブタスクを完了にする（再帰的）
   * @param {string} parentId - 親タスクのID
   */
  completeAllSubtasks(parentId) {
    const completeRecursive = (todoId) => {
      const todo = this.getTodo(todoId);
      if (!todo) return;

      if (todo.subtaskIds && todo.subtaskIds.length > 0) {
        todo.subtaskIds.forEach(childId => {
          const child = this.getTodo(childId);
          if (child && !child.completed) {
            child.completed = true;
            child.updatedAt = new Date().toISOString();
          }
          completeRecursive(childId);
        });
      }
    };

    completeRecursive(parentId);
    this.save();
  }

  // ==========================================
  // 繰り返しタスク管理
  // ==========================================

  /**
   * 次の期限日を計算
   *
   * 繰り返しタイプ別の計算ロジック:
   * - daily: 翌日（+1日）
   * - weekly: 1週間後（+7日）
   * - monthly: 翌月の同日（月末処理はDateが自動調整）
   * - custom: interval日後（例: 3日ごと）
   * - weekdays: 指定曜日のうち次に来る日（getNextWeekday参照）
   *
   * @param {Date} currentDate - 現在の期限日
   * @param {Object} recurrence - 繰り返し設定
   * @returns {Date} 次の期限日
   */
  calculateNextDueDate(currentDate, recurrence) {
    const date = new Date(currentDate);

    switch (recurrence.type) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;

      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;

      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;

      case 'custom':
        // intervalは日数として扱う
        date.setDate(date.getDate() + (recurrence.interval || 1));
        break;

      case 'weekdays':
        // 指定した曜日のうち次の曜日を取得
        return this.getNextWeekday(date, recurrence.weekdays);

      default:
        date.setDate(date.getDate() + 1);
    }

    return date;
  }

  /**
   * 指定した曜日のうち次の日付を取得
   *
   * 曜日計算ロジック:
   * 1. 曜日配列をソート（例: [1,3,5] = 月・水・金）
   * 2. 現在の曜日より後の曜日を探す
   *    例: 今日が火曜(2)で [1,3,5] なら水曜(3)まで1日
   * 3. なければ来週の最初の該当曜日を計算
   *    例: 今日が土曜(6)で [1,3,5] なら来週月曜まで2日
   *
   * @param {Date} currentDate - 現在の日付
   * @param {number[]} weekdays - 曜日配列（0-6: 日-土）
   * @returns {Date} 次の該当曜日の日付
   */
  getNextWeekday(currentDate, weekdays) {
    if (!weekdays || weekdays.length === 0) {
      // weekdaysが空の場合は翌日を返す
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 1);
      return next;
    }

    const sortedWeekdays = [...weekdays].sort((a, b) => a - b);
    const currentDay = currentDate.getDay();
    const result = new Date(currentDate);

    // 今日より後の曜日を探す
    for (const day of sortedWeekdays) {
      if (day > currentDay) {
        result.setDate(result.getDate() + (day - currentDay));
        return result;
      }
    }

    // 見つからなければ来週の最初の該当曜日
    const daysUntilNext = 7 - currentDay + sortedWeekdays[0];
    result.setDate(result.getDate() + daysUntilNext);
    return result;
  }

  /**
   * 終了条件をチェック
   * @param {Object} recurrence - 繰り返し設定
   * @returns {boolean} 終了条件に達していればtrue
   */
  isRecurrenceEnded(recurrence) {
    if (!recurrence || !recurrence.enabled) return true;

    const endCondition = recurrence.endCondition;
    if (!endCondition) return false;

    switch (endCondition.type) {
      case 'never':
        return false;

      case 'count':
        // 完了回数が指定回数に達したら終了
        return recurrence.completedCount >= (endCondition.count || 1);

      case 'date':
        // 指定日を過ぎたら終了
        if (!endCondition.endDate) return false;
        return new Date() > new Date(endCondition.endDate);

      default:
        return false;
    }
  }

  /**
   * タスク完了時の繰り返し処理
   * @param {string} id - 完了したタスクのID
   * @returns {Object|null} 生成された次回タスク、生成しなければnull
   */
  handleTaskCompletion(id) {
    const todo = this.getTodo(id);
    if (!todo || !todo.recurrence || !todo.recurrence.enabled) {
      return null;
    }

    // 完了回数をインクリメント
    todo.recurrence.completedCount = (todo.recurrence.completedCount || 0) + 1;
    this.save();

    // 終了条件をチェック
    if (this.isRecurrenceEnded(todo.recurrence)) {
      return null;
    }

    const behavior = todo.recurrence.completionBehavior || 'createNext';

    switch (behavior) {
      case 'createNext':
        // 即座に次回分を生成
        return this.generateNextRecurrence(todo);

      case 'reset':
        // 完了状態をリセット（タスク自体は残す）
        todo.completed = false;
        todo.updatedAt = new Date().toISOString();
        // 期限を次回に更新
        if (todo.dueDate) {
          const nextDue = this.calculateNextDueDate(new Date(todo.dueDate), todo.recurrence);
          todo.dueDate = nextDue.toISOString();
        }
        this.save();
        return null;

      case 'createOnDue':
        // 次回期限になったら生成（ここでは何もしない）
        return null;

      default:
        return null;
    }
  }

  /**
   * 次回の繰り返しタスクを生成
   * @param {Object} todo - 元のTODOアイテム
   * @returns {Object|null} 生成されたタスク、失敗時はnull
   */
  generateNextRecurrence(todo) {
    if (!todo || !todo.recurrence || !todo.recurrence.enabled) {
      return null;
    }

    // 次の期限日を計算
    const currentDueDate = todo.dueDate ? new Date(todo.dueDate) : new Date();
    const nextDueDate = this.calculateNextDueDate(currentDueDate, todo.recurrence);

    // 終了条件のチェック（日付ベース）
    if (todo.recurrence.endCondition && todo.recurrence.endCondition.type === 'date') {
      const endDate = new Date(todo.recurrence.endCondition.endDate);
      if (nextDueDate > endDate) {
        return null;
      }
    }

    // 新しいタスクデータを作成（サブタスクは引き継がない）
    const newTodoData = {
      title: todo.title,
      description: todo.description,
      tags: [...todo.tags],
      priority: todo.priority,
      dueDate: nextDueDate.toISOString(),
      groupId: todo.groupId,
      recurrence: {
        ...todo.recurrence,
        originalTaskId: todo.recurrence.originalTaskId || todo.id,
        completedCount: todo.recurrence.completedCount || 0
      }
    };

    return this.createTodo(newTodoData);
  }

  /**
   * 期限が来た繰り返しタスク（createOnDue）をチェックして生成
   * @returns {Object[]} 生成されたタスクの配列
   */
  checkScheduledRecurrences() {
    const now = new Date();
    const generatedTasks = [];

    // completionBehaviorが'createOnDue'で完了済みのタスクを検索
    const completedRecurringTasks = this.todos.filter(todo =>
      todo.completed &&
      todo.recurrence &&
      todo.recurrence.enabled &&
      todo.recurrence.completionBehavior === 'createOnDue' &&
      !this.isRecurrenceEnded(todo.recurrence)
    );

    for (const todo of completedRecurringTasks) {
      // 次の期限日を計算
      const currentDueDate = todo.dueDate ? new Date(todo.dueDate) : new Date(todo.updatedAt);
      const nextDueDate = this.calculateNextDueDate(currentDueDate, todo.recurrence);

      // 次の期限日が現在以前なら生成
      if (nextDueDate <= now) {
        const newTask = this.generateNextRecurrence(todo);
        if (newTask) {
          generatedTasks.push(newTask);
        }
      }
    }

    return generatedTasks;
  }

  /**
   * 繰り返し設定のテキスト表示を取得
   * @param {Object} recurrence - 繰り返し設定
   * @returns {string} 繰り返し設定の説明テキスト
   */
  getRecurrenceText(recurrence) {
    if (!recurrence || !recurrence.enabled) {
      return '';
    }

    const weekdayNames = ['日', '月', '火', '水', '木', '金', '土'];

    switch (recurrence.type) {
      case 'daily':
        return '毎日';
      case 'weekly':
        return '毎週';
      case 'monthly':
        return '毎月';
      case 'custom':
        return `${recurrence.interval || 1}日ごと`;
      case 'weekdays':
        if (recurrence.weekdays && recurrence.weekdays.length > 0) {
          const days = recurrence.weekdays.map(d => weekdayNames[d]).join('・');
          return `毎週 ${days}`;
        }
        return '曜日指定';
      default:
        return '繰り返し';
    }
  }

  // ==========================================
  // 統計情報
  // ==========================================

  /**
   * 詳細な統計情報を取得
   * @param {string} groupId - グループID（'all'で全グループ）
   * @returns {Object} 統計情報オブジェクト
   */
  getStatistics(groupId = null) {
    // 対象のタスクを取得
    const targetGroupId = groupId || this.activeGroupId;
    const todos = this.getTodosByGroup(targetGroupId);

    // 基本統計
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const incomplete = total - completed;

    // ルートタスクのみ（サブタスクを除く）
    const rootTodos = todos.filter(t => !t.parentId);
    const rootTotal = rootTodos.length;
    const rootCompleted = rootTodos.filter(t => t.completed).length;
    const rootIncomplete = rootTotal - rootCompleted;

    // 期限関連（未完了タスクのみ）
    const incompleteTodos = todos.filter(t => !t.completed);
    let overdue = 0;
    let today = 0;
    let tomorrow = 0;

    incompleteTodos.forEach(todo => {
      const status = this.getDueDateStatus(todo.dueDate);
      if (status === 'overdue') overdue++;
      else if (status === 'today') today++;
      else if (status === 'tomorrow') tomorrow++;
    });

    // タスクタイプ
    const recurring = todos.filter(t => t.recurrence && t.recurrence.enabled).length;
    const withSubtasks = todos.filter(t => t.subtaskIds && t.subtaskIds.length > 0).length;

    // 優先度別（未完了タスクのみ）
    const priorityHigh = incompleteTodos.filter(t => t.priority === 'high').length;
    const priorityMedium = incompleteTodos.filter(t => t.priority === 'medium').length;
    const priorityLow = incompleteTodos.filter(t => t.priority === 'low').length;

    return {
      // 基本統計（サブタスク含む）
      total,
      completed,
      incomplete,

      // ルートタスクのみ
      rootTotal,
      rootCompleted,
      rootIncomplete,

      // 期限関連
      overdue,
      today,
      tomorrow,

      // タスクタイプ
      recurring,
      withSubtasks,

      // 優先度別
      priorityHigh,
      priorityMedium,
      priorityLow
    };
  }
}
