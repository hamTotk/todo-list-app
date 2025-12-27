// ==========================================
// UI MANAGER - UI層の管理
// ==========================================
// DOM操作とユーザーインタラクションを担当するクラス

/**
 * UIManagerクラス
 * DOM要素の参照、イベントリスナー、レンダリングを管理
 */
class UIManager {
  /**
   * コンストラクタ
   * @param {TodoManager} todoManager - TodoManagerのインスタンス
   */
  constructor(todoManager) {
    this.todoManager = todoManager;

    // 編集中のTODO ID
    this.editingTodoId = null;

    // 確認ダイアログのコールバック
    this.confirmCallback = null;

    // 現在のフィルター設定
    this.currentFilters = {
      selectedTags: [],
      selectedPriorities: [],
      showCompleted: true
    };

    // 現在のソート設定
    this.currentSort = {
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    // DOM要素の参照（init()で初期化）
    this.elements = {};

    // グループ編集中のID
    this.editingGroupId = null;

    // サブタスクの展開/折りたたみ状態
    this.collapseState = loadCollapseState();

    // サブタスク追加時の親ID
    this.addingSubtaskParentId = null;

    // 完了処理待ちのTODO ID（警告ダイアログ表示時）
    this.pendingCompleteTodoId = null;
  }

  /**
   * 初期化処理
   * DOM要素の参照を取得し、イベントリスナーを設定
   */
  init() {
    // DOM要素の参照を取得
    this.elements = {
      // メインコンテンツ
      todoList: document.getElementById('todo-list'),
      emptyState: document.getElementById('empty-state'),
      filterEmptyState: document.getElementById('filter-empty-state'),
      btnAddTodo: document.getElementById('btn-add-todo'),
      currentGroupTitle: document.getElementById('current-group-title'),

      // 統計（基本）
      statTotal: document.getElementById('stat-total'),
      statIncomplete: document.getElementById('stat-incomplete'),
      statComplete: document.getElementById('stat-complete'),

      // 統計（詳細）
      statOverdue: document.getElementById('stat-overdue'),
      statToday: document.getElementById('stat-today'),
      statTomorrow: document.getElementById('stat-tomorrow'),
      statRecurring: document.getElementById('stat-recurring'),
      statWithSubtasks: document.getElementById('stat-with-subtasks'),
      statPriorityHigh: document.getElementById('stat-priority-high'),
      statPriorityMedium: document.getElementById('stat-priority-medium'),
      statPriorityLow: document.getElementById('stat-priority-low'),

      // フィルター
      tagFilterContainer: document.getElementById('tag-filter-container'),
      btnManageTags: document.getElementById('btn-manage-tags'),
      filterPriority: document.getElementById('filter-priority'),
      filterShowCompleted: document.getElementById('filter-show-completed'),

      // ソート
      sortBy: document.getElementById('sort-by'),
      sortOrder: document.getElementById('sort-order'),

      // モーダル
      todoModal: document.getElementById('todo-modal'),
      modalTitle: document.getElementById('modal-title'),
      modalClose: document.getElementById('modal-close'),
      todoForm: document.getElementById('todo-form'),
      btnCancel: document.getElementById('btn-cancel'),

      // フォームフィールド
      todoId: document.getElementById('todo-id'),
      todoTitle: document.getElementById('todo-title'),
      todoDescription: document.getElementById('todo-description'),
      todoPriority: document.getElementById('todo-priority'),
      todoDueDate: document.getElementById('todo-due-date'),
      todoTagsContainer: document.getElementById('todo-tags-container'),
      newTagInput: document.getElementById('new-tag-input'),
      btnAddTagInline: document.getElementById('btn-add-tag-inline'),

      // 確認ダイアログ
      confirmDialog: document.getElementById('confirm-dialog'),
      confirmMessage: document.getElementById('confirm-message'),
      confirmOk: document.getElementById('confirm-ok'),
      confirmCancel: document.getElementById('confirm-cancel'),

      // グループ関連
      groupTabs: document.getElementById('task-group-tabs'),
      btnAddGroup: document.getElementById('btn-add-group'),
      btnShowAll: document.getElementById('btn-show-all'),
      groupModal: document.getElementById('group-modal'),
      groupModalTitle: document.getElementById('group-modal-title'),
      groupModalClose: document.getElementById('group-modal-close'),
      groupForm: document.getElementById('group-form'),
      groupName: document.getElementById('group-name'),
      groupId: document.getElementById('group-id'),
      groupCancel: document.getElementById('group-cancel'),

      // サブタスク警告ダイアログ
      subtaskWarningDialog: document.getElementById('subtask-warning-dialog'),
      subtaskWarningMessage: document.getElementById('subtask-warning-message'),
      completeAllSubtasks: document.getElementById('complete-all-subtasks'),
      subtaskWarningCancel: document.getElementById('subtask-warning-cancel'),

      // エラー表示
      formError: document.getElementById('form-error'),
      formErrorMessage: document.getElementById('form-error-message'),
      titleError: document.getElementById('title-error'),

      // タグ管理モーダル
      tagModal: document.getElementById('tag-modal'),
      tagModalClose: document.getElementById('tag-modal-close'),
      tagModalDone: document.getElementById('tag-modal-done'),
      newTagManageInput: document.getElementById('new-tag-manage-input'),
      btnAddTagManage: document.getElementById('btn-add-tag-manage'),
      tagManageList: document.getElementById('tag-manage-list'),

      // タグ編集モーダル
      tagEditModal: document.getElementById('tag-edit-modal'),
      tagEditModalClose: document.getElementById('tag-edit-modal-close'),
      tagEditInput: document.getElementById('tag-edit-input'),
      tagEditOriginal: document.getElementById('tag-edit-original'),
      tagEditCancel: document.getElementById('tag-edit-cancel'),
      tagEditSave: document.getElementById('tag-edit-save'),

      // 繰り返し設定
      recurrenceEnabled: document.getElementById('recurrence-enabled'),
      recurrenceOptions: document.getElementById('recurrence-options'),
      recurrenceType: document.getElementById('recurrence-type'),
      customIntervalGroup: document.getElementById('custom-interval-group'),
      recurrenceInterval: document.getElementById('recurrence-interval'),
      weekdaysGroup: document.getElementById('weekdays-group'),
      endConditionType: document.getElementById('end-condition-type'),
      endCountGroup: document.getElementById('end-count-group'),
      endConditionCount: document.getElementById('end-condition-count'),
      endDateGroup: document.getElementById('end-date-group'),
      endConditionDate: document.getElementById('end-condition-date'),
      completionBehavior: document.getElementById('completion-behavior'),
      behaviorHint: document.getElementById('behavior-hint')
    };

    // イベントリスナーを設定
    this.bindEvents();

    // グループタブをレンダリング
    this.renderGroupTabs();

    // タグフィルターをレンダリング
    this.renderTagFilter();

    // 初回レンダリング
    this.render();
  }

  /**
   * イベントリスナーを設定
   */
  bindEvents() {
    // 新しいタスク追加ボタン
    this.elements.btnAddTodo.addEventListener('click', () => {
      this.openTodoModal();
    });

    // モーダルを閉じる
    this.elements.modalClose.addEventListener('click', () => {
      this.closeTodoModal();
    });

    this.elements.btnCancel.addEventListener('click', () => {
      this.closeTodoModal();
    });

    // モーダル外をクリックで閉じる（mousedownとmouseupの両方が背景で発生した場合のみ）
    let todoModalMouseDownOnBackdrop = false;
    this.elements.todoModal.addEventListener('mousedown', (e) => {
      todoModalMouseDownOnBackdrop = (e.target === this.elements.todoModal);
    });
    this.elements.todoModal.addEventListener('mouseup', (e) => {
      if (todoModalMouseDownOnBackdrop && e.target === this.elements.todoModal) {
        this.closeTodoModal();
      }
      todoModalMouseDownOnBackdrop = false;
    });

    // フォーム送信
    this.elements.todoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });

    // タグ管理ボタン
    this.elements.btnManageTags.addEventListener('click', () => {
      this.openTagModal();
    });

    // タグ管理モーダルを閉じる
    this.elements.tagModalClose.addEventListener('click', () => {
      this.closeTagModal();
    });

    this.elements.tagModalDone.addEventListener('click', () => {
      this.closeTagModal();
    });

    // タグ管理モーダル外をクリックで閉じる
    let tagModalMouseDownOnBackdrop = false;
    this.elements.tagModal.addEventListener('mousedown', (e) => {
      tagModalMouseDownOnBackdrop = (e.target === this.elements.tagModal);
    });
    this.elements.tagModal.addEventListener('mouseup', (e) => {
      if (tagModalMouseDownOnBackdrop && e.target === this.elements.tagModal) {
        this.closeTagModal();
      }
      tagModalMouseDownOnBackdrop = false;
    });

    // タグ管理モーダルで新規タグ追加
    this.elements.btnAddTagManage.addEventListener('click', () => {
      this.addNewTagFromManageModal();
    });

    this.elements.newTagManageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.addNewTagFromManageModal();
      }
    });

    // タグ編集モーダルを閉じる
    this.elements.tagEditModalClose.addEventListener('click', () => {
      this.closeTagEditModal();
    });

    this.elements.tagEditCancel.addEventListener('click', () => {
      this.closeTagEditModal();
    });

    // タグ編集モーダル外をクリックで閉じる
    let tagEditModalMouseDownOnBackdrop = false;
    this.elements.tagEditModal.addEventListener('mousedown', (e) => {
      tagEditModalMouseDownOnBackdrop = (e.target === this.elements.tagEditModal);
    });
    this.elements.tagEditModal.addEventListener('mouseup', (e) => {
      if (tagEditModalMouseDownOnBackdrop && e.target === this.elements.tagEditModal) {
        this.closeTagEditModal();
      }
      tagEditModalMouseDownOnBackdrop = false;
    });

    // タグ編集保存
    this.elements.tagEditSave.addEventListener('click', () => {
      this.saveTagEdit();
    });

    this.elements.tagEditInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.saveTagEdit();
      }
    });

    // TODOモーダル内で新規タグ追加
    this.elements.btnAddTagInline.addEventListener('click', () => {
      this.addNewTagInline();
    });

    this.elements.newTagInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.addNewTagInline();
      }
    });

    // フィルター変更
    this.elements.filterPriority.addEventListener('change', () => {
      this.applyFilters();
    });

    this.elements.filterShowCompleted.addEventListener('change', () => {
      this.applyFilters();
    });

    // ソート変更
    this.elements.sortBy.addEventListener('change', () => {
      this.applySort();
    });

    this.elements.sortOrder.addEventListener('change', () => {
      this.applySort();
    });

    // 確認ダイアログ
    this.elements.confirmOk.addEventListener('click', () => {
      if (this.confirmCallback) {
        this.confirmCallback();
        this.confirmCallback = null;
      }
      this.closeConfirmDialog();
    });

    this.elements.confirmCancel.addEventListener('click', () => {
      this.confirmCallback = null;
      this.closeConfirmDialog();
    });

    // 確認ダイアログ外をクリックで閉じる（mousedownとmouseupの両方が背景で発生した場合のみ）
    let confirmDialogMouseDownOnBackdrop = false;
    this.elements.confirmDialog.addEventListener('mousedown', (e) => {
      confirmDialogMouseDownOnBackdrop = (e.target === this.elements.confirmDialog);
    });
    this.elements.confirmDialog.addEventListener('mouseup', (e) => {
      if (confirmDialogMouseDownOnBackdrop && e.target === this.elements.confirmDialog) {
        this.confirmCallback = null;
        this.closeConfirmDialog();
      }
      confirmDialogMouseDownOnBackdrop = false;
    });

    // サブタスク警告ダイアログ - すべて完了にする
    this.elements.completeAllSubtasks.addEventListener('click', () => {
      if (this.pendingCompleteTodoId) {
        const todoId = this.pendingCompleteTodoId;
        const element = this.elements.todoList.querySelector(`[data-id="${todoId}"]`);

        // 親と全サブタスクを完了にする
        this.todoManager.completeAllSubtasks(todoId);
        this.todoManager.toggleComplete(todoId);

        // 完了エフェクトを表示
        if (element) {
          this.showConfetti(element);
        }

        this.pendingCompleteTodoId = null;
        // 全体再描画（アニメーションスキップ）
        this.render(true);
      }
      this.closeSubtaskWarningDialog();
    });

    // サブタスク警告ダイアログ - キャンセル
    this.elements.subtaskWarningCancel.addEventListener('click', () => {
      this.pendingCompleteTodoId = null;
      this.closeSubtaskWarningDialog();
    });

    // サブタスク警告ダイアログ外をクリックで閉じる（mousedownとmouseupの両方が背景で発生した場合のみ）
    let subtaskWarningMouseDownOnBackdrop = false;
    this.elements.subtaskWarningDialog.addEventListener('mousedown', (e) => {
      subtaskWarningMouseDownOnBackdrop = (e.target === this.elements.subtaskWarningDialog);
    });
    this.elements.subtaskWarningDialog.addEventListener('mouseup', (e) => {
      if (subtaskWarningMouseDownOnBackdrop && e.target === this.elements.subtaskWarningDialog) {
        this.pendingCompleteTodoId = null;
        this.closeSubtaskWarningDialog();
      }
      subtaskWarningMouseDownOnBackdrop = false;
    });

    // すべて表示ボタン
    this.elements.btnShowAll.addEventListener('click', () => {
      this.handleShowAll();
    });

    // グループ追加ボタン
    this.elements.btnAddGroup.addEventListener('click', () => {
      this.openGroupModal();
    });

    // グループモーダルを閉じる
    this.elements.groupModalClose.addEventListener('click', () => {
      this.closeGroupModal();
    });

    this.elements.groupCancel.addEventListener('click', () => {
      this.closeGroupModal();
    });

    // グループモーダル外をクリックで閉じる（mousedownとmouseupの両方が背景で発生した場合のみ）
    let groupModalMouseDownOnBackdrop = false;
    this.elements.groupModal.addEventListener('mousedown', (e) => {
      groupModalMouseDownOnBackdrop = (e.target === this.elements.groupModal);
    });
    this.elements.groupModal.addEventListener('mouseup', (e) => {
      if (groupModalMouseDownOnBackdrop && e.target === this.elements.groupModal) {
        this.closeGroupModal();
      }
      groupModalMouseDownOnBackdrop = false;
    });

    // グループフォーム送信
    this.elements.groupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleGroupFormSubmit();
    });

    // 繰り返し設定の表示切り替え
    this.elements.recurrenceEnabled.addEventListener('change', () => {
      this.toggleRecurrenceOptions();
    });

    // 繰り返しタイプ変更時
    this.elements.recurrenceType.addEventListener('change', () => {
      this.updateRecurrenceTypeOptions();
    });

    // 終了条件タイプ変更時
    this.elements.endConditionType.addEventListener('change', () => {
      this.updateEndConditionOptions();
    });

    // 完了時の挙動変更時（ヒント更新）
    this.elements.completionBehavior.addEventListener('change', () => {
      this.updateBehaviorHint();
    });

    // キーボードショートカット
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcut(e);
    });
  }

  /**
   * キーボードショートカットを処理
   * @param {KeyboardEvent} e - キーボードイベント
   */
  handleKeyboardShortcut(e) {
    // Escキー: モーダルを閉じる
    if (e.key === 'Escape') {
      // タグ編集モーダルが開いている場合
      if (this.elements.tagEditModal.getAttribute('aria-hidden') === 'false') {
        this.closeTagEditModal();
        return;
      }
      // タグ管理モーダルが開いている場合
      if (this.elements.tagModal.getAttribute('aria-hidden') === 'false') {
        this.closeTagModal();
        return;
      }
      // サブタスク警告ダイアログが開いている場合
      if (this.elements.subtaskWarningDialog.getAttribute('aria-hidden') === 'false') {
        this.pendingCompleteTodoId = null;
        this.closeSubtaskWarningDialog();
        return;
      }
      // 確認ダイアログが開いている場合
      if (this.elements.confirmDialog.getAttribute('aria-hidden') === 'false') {
        this.confirmCallback = null;
        this.closeConfirmDialog();
        return;
      }
      // グループモーダルが開いている場合
      if (this.elements.groupModal.getAttribute('aria-hidden') === 'false') {
        this.closeGroupModal();
        return;
      }
      // TODOモーダルが開いている場合
      if (this.elements.todoModal.getAttribute('aria-hidden') === 'false') {
        this.closeTodoModal();
        return;
      }
    }

    // Ctrl+Enter または Cmd+Enter: フォーム送信（テキストエリア内でも送信可能に）
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      // TODOモーダルが開いている場合
      if (this.elements.todoModal.getAttribute('aria-hidden') === 'false') {
        e.preventDefault();
        this.handleFormSubmit();
        return;
      }
      // グループモーダルが開いている場合
      if (this.elements.groupModal.getAttribute('aria-hidden') === 'false') {
        e.preventDefault();
        this.handleGroupFormSubmit();
        return;
      }
    }
  }

  /**
   * 画面を再レンダリング
   * @param {boolean} skipAnimations - アニメーションをスキップするか（デフォルト: false）
   */
  render(skipAnimations = false) {
    this.renderTodoList(skipAnimations);
    this.updateStats();
  }

  /**
   * TODOリストをレンダリング
   *
   * 処理フロー:
   * 1. アクティブグループのタスクを取得
   * 2. フィルター適用（タグ、優先度、完了状態）
   * 3. ソート適用（作成日、期限、優先度など）
   * 4. 既存DOM要素のIDを記録（アニメーション制御用）
   * 5. リストをクリアして再描画
   * 6. ルートタスクのみ描画（サブタスクは親タスク内で再帰的に描画）
   *
   * @param {boolean} skipAllAnimations - すべてのアニメーションをスキップするか
   */
  renderTodoList(skipAllAnimations = false) {
    // アクティブグループのタスクのみ取得
    const activeGroupId = this.todoManager.activeGroupId;
    const groupTodos = this.todoManager.getTodosByGroup(activeGroupId);

    // フィルター適用
    const filteredTodos = groupTodos.filter(todo => {
      // タグフィルター（OR条件：選択したタグのいずれかを含む）
      if (this.currentFilters.selectedTags.length > 0) {
        const hasTags = todo.tags && todo.tags.length > 0;
        if (!hasTags || !this.currentFilters.selectedTags.some(tag => todo.tags.includes(tag))) {
          return false;
        }
      }
      // 優先度フィルター
      if (this.currentFilters.selectedPriorities.length > 0 && !this.currentFilters.selectedPriorities.includes(todo.priority)) {
        return false;
      }
      // 完了状態フィルター
      if (!this.currentFilters.showCompleted && todo.completed) {
        return false;
      }
      return true;
    });

    // ソート適用
    const sortedTodos = this.todoManager.sortTodos(
      filteredTodos,
      this.currentSort.sortBy,
      this.currentSort.sortOrder
    );

    // 既存アイテムのIDを記録（アニメーションスキップ用）
    const existingIds = new Set();
    this.elements.todoList.querySelectorAll('.todo-item').forEach(el => {
      existingIds.add(el.dataset.id);
    });

    // リストをクリア
    this.elements.todoList.innerHTML = '';

    // 空の場合は空状態を表示
    if (sortedTodos.length === 0) {
      // フィルターが適用されているかチェック
      const hasActiveFilter = this.hasActiveFilter();
      const hasAnyTodos = groupTodos.length > 0;

      if (hasActiveFilter && hasAnyTodos) {
        // フィルターが適用されていて、元のタスクがある場合
        this.elements.emptyState.style.display = 'none';
        this.elements.filterEmptyState.style.display = 'block';
      } else {
        // タスク自体がない場合
        this.elements.emptyState.style.display = 'block';
        this.elements.filterEmptyState.style.display = 'none';
      }
      return;
    }

    this.elements.emptyState.style.display = 'none';
    this.elements.filterEmptyState.style.display = 'none';

    // 各TODOをレンダリング（ルートタスクのみ）
    sortedTodos.forEach(todo => {
      // 親がいないタスクのみ表示（サブタスクは親タスク内で表示）
      if (!todo.parentId) {
        // 既存アイテムまたは全スキップフラグがある場合はアニメーションをスキップ
        const shouldSkipAnimation = skipAllAnimations || existingIds.has(todo.id);
        const todoElement = this.renderTodoItem(todo, 0, shouldSkipAnimation);
        this.elements.todoList.appendChild(todoElement);
      }
    });
  }

  /**
   * 個別のTODOアイテムをレンダリング
   * @param {Object} todo - TODOアイテム
   * @param {number} level - 階層レベル（0がルート）
   * @param {boolean} skipAnimation - アニメーションをスキップするか
   * @returns {HTMLElement} TODOアイテムのDOM要素
   */
  renderTodoItem(todo, level = 0, skipAnimation = false) {
    const div = document.createElement('div');
    div.className = 'todo-item';
    div.dataset.id = todo.id;
    div.dataset.level = level;

    // 再描画時はアニメーションをスキップ
    if (skipAnimation) {
      div.classList.add('no-animation');
    }

    if (todo.completed) {
      div.classList.add('completed');
    }

    // 期限ステータスによるクラス追加
    const dueDateStatus = this.todoManager.getDueDateStatus(todo.dueDate);
    if (dueDateStatus !== 'none') {
      div.classList.add(`due-${dueDateStatus}`);
    }

    // 優先度バッジの色
    const priorityClass = `priority-${todo.priority}`;

    // 期限表示
    let dueDateHtml = '';
    if (todo.dueDate) {
      const dueDate = new Date(todo.dueDate);
      const formattedDate = this.formatDate(dueDate);
      const statusText = this.getDueDateStatusText(dueDateStatus);
      dueDateHtml = `<span class="todo-due-date ${dueDateStatus}">${formattedDate} ${statusText}</span>`;
    }

    // タグ表示
    let tagsHtml = '';
    if (todo.tags && todo.tags.length > 0) {
      tagsHtml = todo.tags.map(tag => `<span class="todo-tag">${this.escapeHtml(tag)}</span>`).join('');
    }

    // サブタスク関連
    const hasSubtasks = todo.subtaskIds && todo.subtaskIds.length > 0;
    const isCollapsed = this.collapseState[todo.id] === true;
    const progress = hasSubtasks ? this.todoManager.getSubtaskProgress(todo.id) : null;

    // 展開/折りたたみボタン
    let expandBtnHtml = '';
    if (hasSubtasks) {
      expandBtnHtml = `<button class="btn-expand" data-id="${todo.id}" title="${isCollapsed ? '展開' : '折りたたみ'}">${isCollapsed ? '▶' : '▼'}</button>`;
    } else {
      expandBtnHtml = '<span class="expand-placeholder"></span>';
    }

    // 進捗表示
    let progressHtml = '';
    if (progress && progress.total > 0) {
      progressHtml = `<span class="subtask-progress">${progress.completed}/${progress.total}</span>`;
    }

    // 繰り返しアイコン
    let recurrenceHtml = '';
    if (todo.recurrence && todo.recurrence.enabled) {
      const recurrenceText = this.todoManager.getRecurrenceText(todo.recurrence);
      recurrenceHtml = `<span class="todo-recurrence" title="${recurrenceText}">🔄 ${recurrenceText}</span>`;
    }

    // HTML構築
    div.innerHTML = `
      <div class="todo-main">
        ${expandBtnHtml}
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-id="${todo.id}">
        <div class="todo-content">
          <div class="todo-header">
            <h3 class="todo-title">${this.escapeHtml(todo.title)}</h3>
            <span class="todo-priority ${priorityClass}">${this.getPriorityText(todo.priority)}</span>
            ${progressHtml}
          </div>
          ${todo.description ? `<p class="todo-description">${this.escapeHtml(todo.description)}</p>` : ''}
          <div class="todo-meta">
            ${dueDateHtml}
            ${recurrenceHtml}
            ${tagsHtml}
          </div>
        </div>
        <div class="todo-actions">
          <button class="btn-icon btn-add-subtask" data-id="${todo.id}" title="サブタスク追加">➕</button>
          <button class="btn-icon btn-edit" data-id="${todo.id}" title="編集">✏️</button>
          <button class="btn-icon btn-delete" data-id="${todo.id}" title="削除">🗑️</button>
        </div>
      </div>
    `;

    // イベントリスナーを追加
    const checkbox = div.querySelector('.todo-checkbox');
    checkbox.addEventListener('change', () => {
      this.handleToggleComplete(todo.id);
    });

    const btnEdit = div.querySelector('.btn-edit');
    btnEdit.addEventListener('click', () => {
      this.openTodoModal(todo.id);
    });

    const btnDelete = div.querySelector('.btn-delete');
    btnDelete.addEventListener('click', () => {
      this.handleDelete(todo.id);
    });

    // サブタスク追加ボタン
    const btnAddSubtask = div.querySelector('.btn-add-subtask');
    btnAddSubtask.addEventListener('click', () => {
      this.handleAddSubtask(todo.id);
    });

    // 展開/折りたたみボタン
    if (hasSubtasks) {
      const btnExpand = div.querySelector('.btn-expand');
      btnExpand.addEventListener('click', () => {
        this.toggleCollapse(todo.id);
      });
    }

    // サブタスクをレンダリング（展開時のみ）
    if (hasSubtasks && !isCollapsed) {
      const subtasksContainer = document.createElement('div');
      subtasksContainer.className = 'subtasks-container';
      const subtasks = this.todoManager.getSubtasks(todo.id);
      subtasks.forEach(subtask => {
        // 親のskipAnimationを引き継ぐ
        const subtaskEl = this.renderTodoItem(subtask, level + 1, skipAnimation);
        subtasksContainer.appendChild(subtaskEl);
      });
      div.appendChild(subtasksContainer);
    }

    return div;
  }

  /**
   * 統計情報を更新
   */
  updateStats() {
    // 統計情報を取得
    const stats = this.todoManager.getStatistics();

    // 基本統計を更新
    this.elements.statTotal.textContent = stats.total;
    this.elements.statComplete.textContent = stats.completed;
    this.elements.statIncomplete.textContent = stats.incomplete;

    // 詳細統計を更新
    if (this.elements.statOverdue) {
      this.elements.statOverdue.textContent = stats.overdue;
      // 期限切れがある場合はハイライト
      this.elements.statOverdue.parentElement.classList.toggle('highlight', stats.overdue > 0);
    }
    if (this.elements.statToday) {
      this.elements.statToday.textContent = stats.today;
      this.elements.statToday.parentElement.classList.toggle('highlight', stats.today > 0);
    }
    if (this.elements.statTomorrow) {
      this.elements.statTomorrow.textContent = stats.tomorrow;
    }
    if (this.elements.statRecurring) {
      this.elements.statRecurring.textContent = stats.recurring;
    }
    if (this.elements.statWithSubtasks) {
      this.elements.statWithSubtasks.textContent = stats.withSubtasks;
    }
    if (this.elements.statPriorityHigh) {
      this.elements.statPriorityHigh.textContent = stats.priorityHigh;
    }
    if (this.elements.statPriorityMedium) {
      this.elements.statPriorityMedium.textContent = stats.priorityMedium;
    }
    if (this.elements.statPriorityLow) {
      this.elements.statPriorityLow.textContent = stats.priorityLow;
    }

    // グループタイトルを更新
    const activeGroupId = this.todoManager.activeGroupId;
    if (this.elements.currentGroupTitle) {
      if (activeGroupId === 'all') {
        this.elements.currentGroupTitle.textContent = 'すべてのタスク';
      } else {
        const activeGroup = this.todoManager.getActiveGroup();
        if (activeGroup) {
          this.elements.currentGroupTitle.textContent = activeGroup.name;
        }
      }
    }
  }

  /**
   * TODOモーダルを開く
   * @param {string|null} todoId - 編集する場合はTODO ID、新規作成の場合はnull
   */
  openTodoModal(todoId = null) {
    this.editingTodoId = todoId;

    // エラー表示をクリア
    this.clearFormErrors();

    if (todoId) {
      // 編集モード
      const todo = this.todoManager.getTodo(todoId);
      if (!todo) {
        console.error('Todo not found:', todoId);
        return;
      }

      this.elements.modalTitle.textContent = 'タスクを編集';
      this.elements.todoId.value = todo.id;
      this.elements.todoTitle.value = todo.title;
      this.elements.todoDescription.value = todo.description || '';
      this.elements.todoPriority.value = todo.priority;

      // タグチェックボックスを描画
      this.renderTodoTagsCheckboxes(todo.tags);

      // 期限の設定（datetime-local形式に変換）
      if (todo.dueDate) {
        const date = new Date(todo.dueDate);
        const formattedDate = this.formatDateForInput(date);
        this.elements.todoDueDate.value = formattedDate;
      } else {
        this.elements.todoDueDate.value = '';
      }

      // 繰り返し設定をフォームにセット
      this.setRecurrenceToForm(todo.recurrence);
    } else if (this.addingSubtaskParentId) {
      // サブタスク追加モード
      const parentTodo = this.todoManager.getTodo(this.addingSubtaskParentId);
      const parentTitle = parentTodo ? parentTodo.title : '';
      this.elements.modalTitle.textContent = `サブタスクを追加: ${parentTitle}`;
      this.elements.todoForm.reset();
      this.elements.todoId.value = '';
      this.renderTodoTagsCheckboxes([]);
      this.resetRecurrenceForm();
      this.elements.recurrenceEnabled.checked = false;
      this.elements.recurrenceOptions.classList.add('hidden');
    } else {
      // 新規作成モード
      this.elements.modalTitle.textContent = '新しいタスク';
      this.elements.todoForm.reset();
      this.elements.todoId.value = '';
      this.renderTodoTagsCheckboxes([]);
      this.resetRecurrenceForm();
      this.elements.recurrenceEnabled.checked = false;
      this.elements.recurrenceOptions.classList.add('hidden');
    }

    // モーダル表示
    this.elements.todoModal.classList.add('active');
    this.elements.todoModal.setAttribute('aria-hidden', 'false');

    // タイトルにフォーカス
    this.elements.todoTitle.focus();
  }

  /**
   * TODOモーダルを閉じる
   */
  closeTodoModal() {
    this.elements.todoModal.classList.remove('active');
    this.elements.todoModal.setAttribute('aria-hidden', 'true');
    this.elements.todoForm.reset();
    this.editingTodoId = null;
    this.addingSubtaskParentId = null;
  }

  /**
   * フォーム送信処理
   */
  handleFormSubmit() {
    const formData = {
      title: this.elements.todoTitle.value.trim(),
      description: this.elements.todoDescription.value.trim(),
      priority: this.elements.todoPriority.value,
      dueDate: this.elements.todoDueDate.value ? new Date(this.elements.todoDueDate.value).toISOString() : null,
      tags: this.getSelectedTagsFromModal(),
      recurrence: this.getRecurrenceFromForm()
    };

    // バリデーション
    const validation = this.todoManager.validateTodo(formData);
    if (!validation.valid) {
      this.showError(validation.errors.join('\n'));
      return;
    }

    if (this.editingTodoId) {
      // 更新
      const updated = this.todoManager.updateTodo(this.editingTodoId, formData);
      if (updated) {
        this.closeTodoModal();
        this.render();
      } else {
        this.showError('タスクの更新に失敗しました');
      }
    } else if (this.addingSubtaskParentId) {
      // サブタスク追加
      const created = this.todoManager.addSubtask(this.addingSubtaskParentId, formData);
      if (created) {
        this.closeTodoModal();
        this.render();
      } else {
        this.showError('サブタスクの作成に失敗しました');
      }
    } else {
      // 新規作成
      const created = this.todoManager.createTodo(formData);
      if (created) {
        this.closeTodoModal();
        this.render();
      } else {
        this.showError('タスクの作成に失敗しました');
      }
    }
  }

  /**
   * 完了状態の切り替え処理
   * @param {string} id - TODO ID
   */
  handleToggleComplete(id) {
    const todo = this.todoManager.getTodo(id);
    if (!todo) return;

    // 未完了→完了に変更する場合、未完了サブタスクをチェック
    if (!todo.completed) {
      const incompleteCount = this.todoManager.getIncompleteSubtasksCount(id);
      if (incompleteCount > 0) {
        // 未完了サブタスクがある場合は警告ダイアログを表示
        this.showSubtaskWarningDialog(id, incompleteCount);
        return;
      }
    }

    const wasCompleted = todo.completed;

    // 通常の完了切り替え処理
    const result = this.todoManager.toggleComplete(id);
    if (result) {
      // DOM要素を直接更新（全体再描画しない）
      this.updateTodoItemVisualState(id, !wasCompleted);
      this.updateStats();

      // 繰り返しタスクの完了処理（未完了→完了の場合のみ）
      if (!wasCompleted && todo.recurrence && todo.recurrence.enabled) {
        const newTask = this.todoManager.handleTaskCompletion(id);
        if (newTask) {
          // 新しいタスクが生成された場合は再描画
          this.render();
        } else if (todo.recurrence.completionBehavior === 'reset') {
          // リセットの場合は再描画（期限が更新されるため）
          this.render();
        }
      }
    }
  }

  /**
   * TODOアイテムの視覚状態を更新（再描画なし）
   * @param {string} id - TODO ID
   * @param {boolean} isCompleted - 完了状態
   */
  updateTodoItemVisualState(id, isCompleted) {
    const element = this.elements.todoList.querySelector(`[data-id="${id}"]`);
    if (!element) return;

    const checkbox = element.querySelector('.todo-checkbox');
    const titleElement = element.querySelector('.todo-title');

    if (isCompleted) {
      // 完了エフェクトを追加
      element.classList.add('completing');

      // 紙吹雪エフェクト
      this.showConfetti(element);

      // エフェクト終了後にcompletedクラスを追加
      setTimeout(() => {
        element.classList.add('completed');
        element.classList.remove('completing');
      }, 600);

      if (checkbox) checkbox.checked = true;
    } else {
      // 完了解除
      element.classList.remove('completed', 'completing');
      if (checkbox) checkbox.checked = false;
    }

    // 進捗表示を更新（親タスクの場合）
    this.updateSubtaskProgress(id);

    // 親タスクがある場合、親の進捗も更新
    const todo = this.todoManager.getTodo(id);
    if (todo && todo.parentId) {
      this.updateSubtaskProgress(todo.parentId);
    }
  }

  /**
   * サブタスク進捗表示を更新
   * @param {string} id - TODO ID
   */
  updateSubtaskProgress(id) {
    const element = this.elements.todoList.querySelector(`[data-id="${id}"]`);
    if (!element) return;

    const progressElement = element.querySelector('.subtask-progress');
    if (!progressElement) return;

    const progress = this.todoManager.getSubtaskProgress(id);
    if (progress.total > 0) {
      progressElement.textContent = `${progress.completed}/${progress.total}`;
      if (progress.completed === progress.total) {
        progressElement.classList.add('all-complete');
      } else {
        progressElement.classList.remove('all-complete');
      }
    }
  }

  /**
   * 紙吹雪エフェクトを表示
   * @param {HTMLElement} element - 対象要素
   */
  showConfetti(element) {
    const rect = element.getBoundingClientRect();
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    const colors = ['#48bb78', '#38b2ac', '#4fd1c5', '#81e6d9', '#ffd700', '#ff6b6b'];
    const shapes = ['●', '■', '▲', '★', '♦'];

    for (let i = 0; i < 15; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = `${rect.left + rect.width / 2 + (Math.random() - 0.5) * 100}px`;
      confetti.style.top = `${rect.top + rect.height / 2}px`;
      confetti.style.color = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.fontSize = `${Math.random() * 10 + 8}px`;
      confetti.textContent = shapes[Math.floor(Math.random() * shapes.length)];
      confetti.style.animationDelay = `${Math.random() * 0.2}s`;
      confetti.style.animationDuration = `${0.8 + Math.random() * 0.4}s`;
      container.appendChild(confetti);
    }

    // 1.5秒後にコンテナを削除
    setTimeout(() => {
      container.remove();
    }, 1500);
  }

  /**
   * 削除処理
   * @param {string} id - TODO ID
   */
  handleDelete(id) {
    const todo = this.todoManager.getTodo(id);
    if (!todo) return;

    // サブタスクがある場合は件数を表示
    const subtaskCount = todo.subtaskIds ? todo.subtaskIds.length : 0;
    const message = subtaskCount > 0
      ? `「${todo.title}」と${subtaskCount}件のサブタスクを削除しますか？`
      : `「${todo.title}」を削除しますか？`;

    this.showConfirmDialog(
      message,
      () => {
        // 削除対象の要素を取得（サブタスク含む）
        const elementsToRemove = this.getElementsToRemove(id);

        // フェードアウトアニメーションを適用
        elementsToRemove.forEach(el => {
          el.classList.add('fade-out');
        });

        // アニメーション完了後に削除
        setTimeout(() => {
          const success = this.todoManager.deleteTodo(id);
          if (success) {
            this.render(true); // アニメーションスキップで再描画
          } else {
            this.showError('削除に失敗しました');
          }
        }, 300); // アニメーション時間と同じ
      }
    );
  }

  /**
   * 削除対象のDOM要素を取得（サブタスク含む）
   *
   * 再帰的にサブタスクのDOM要素を収集する:
   * 1. 指定されたIDのメイン要素を取得
   * 2. そのタスクのsubtaskIdsを確認
   * 3. 各サブタスクのDOM要素を収集
   * 4. サブタスクに更にサブタスクがあれば再帰的に収集
   *
   * これにより階層の深さに関係なく全ての子孫要素を取得可能
   *
   * @param {string} id - TODO ID
   * @returns {Element[]} 削除対象の要素配列
   */
  getElementsToRemove(id) {
    const elements = [];
    const mainElement = this.elements.todoList.querySelector(`[data-id="${id}"]`);
    if (mainElement) {
      elements.push(mainElement);
    }

    // サブタスクの要素も取得
    const todo = this.todoManager.getTodo(id);
    if (todo && todo.subtaskIds) {
      const collectSubtaskElements = (subtaskIds) => {
        subtaskIds.forEach(subtaskId => {
          const el = this.elements.todoList.querySelector(`[data-id="${subtaskId}"]`);
          if (el) {
            elements.push(el);
          }
          const subtask = this.todoManager.getTodo(subtaskId);
          if (subtask && subtask.subtaskIds) {
            collectSubtaskElements(subtask.subtaskIds);
          }
        });
      };
      collectSubtaskElements(todo.subtaskIds);
    }

    return elements;
  }

  /**
   * 展開/折りたたみの切り替え
   * @param {string} todoId - TODO ID
   */
  toggleCollapse(todoId) {
    this.collapseState[todoId] = !this.collapseState[todoId];
    saveCollapseState(this.collapseState);
    this.render();
  }

  /**
   * サブタスク追加処理
   * @param {string} parentId - 親タスクのID
   */
  handleAddSubtask(parentId) {
    this.addingSubtaskParentId = parentId;
    this.openTodoModal();
  }

  /**
   * フィルターを適用
   */
  applyFilters() {
    // タグフィルターは別途handleTagFilterChangeで更新されるので、ここでは他のフィルターを更新
    this.currentFilters.selectedPriorities = this.elements.filterPriority.value ? [this.elements.filterPriority.value] : [];
    this.currentFilters.showCompleted = this.elements.filterShowCompleted.checked;

    this.render();
  }

  /**
   * ソートを適用
   */
  applySort() {
    this.currentSort = {
      sortBy: this.elements.sortBy.value,
      sortOrder: this.elements.sortOrder.value
    };

    this.render();
  }

  /**
   * 確認ダイアログを表示
   * @param {string} message - メッセージ
   * @param {Function} callback - OKボタン押下時のコールバック
   */
  showConfirmDialog(message, callback) {
    this.elements.confirmMessage.textContent = message;
    this.confirmCallback = callback;
    this.elements.confirmDialog.classList.add('active');
    this.elements.confirmDialog.setAttribute('aria-hidden', 'false');
  }

  /**
   * 確認ダイアログを閉じる
   */
  closeConfirmDialog() {
    this.elements.confirmDialog.classList.remove('active');
    this.elements.confirmDialog.setAttribute('aria-hidden', 'true');
  }

  /**
   * サブタスク警告ダイアログを表示
   * @param {string} todoId - 完了しようとしているTODO ID
   * @param {number} incompleteCount - 未完了サブタスクの数
   */
  showSubtaskWarningDialog(todoId, incompleteCount) {
    this.pendingCompleteTodoId = todoId;
    this.elements.subtaskWarningMessage.textContent =
      `このタスクには${incompleteCount}件の未完了サブタスクがあります。すべて完了にしますか？`;
    this.elements.subtaskWarningDialog.classList.add('active');
    this.elements.subtaskWarningDialog.setAttribute('aria-hidden', 'false');
  }

  /**
   * サブタスク警告ダイアログを閉じる
   */
  closeSubtaskWarningDialog() {
    this.elements.subtaskWarningDialog.classList.remove('active');
    this.elements.subtaskWarningDialog.setAttribute('aria-hidden', 'true');
  }

  /**
   * エラーメッセージを表示
   * @param {string} message - エラーメッセージ
   */
  showError(message) {
    // TODOモーダルが開いている場合はフォーム内にエラー表示
    if (this.elements.todoModal.getAttribute('aria-hidden') === 'false') {
      this.showFormError(message);
    } else {
      // それ以外はトースト表示
      this.showToast(message, 'error');
    }
  }

  /**
   * フォーム内にエラーメッセージを表示
   * @param {string} message - エラーメッセージ
   */
  showFormError(message) {
    this.elements.formErrorMessage.textContent = message;
    this.elements.formError.classList.remove('hidden');

    // タイトル入力欄にエラースタイルを追加（タイトル関連のエラーの場合）
    if (message.includes('タイトル')) {
      this.elements.todoTitle.classList.add('error');
      this.elements.titleError.textContent = message;
      this.elements.titleError.classList.remove('hidden');
    }

    // フォームの先頭にスクロール
    this.elements.formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * フォームエラーをクリア
   */
  clearFormErrors() {
    this.elements.formError.classList.add('hidden');
    this.elements.formErrorMessage.textContent = '';
    this.elements.todoTitle.classList.remove('error');
    this.elements.titleError.classList.add('hidden');
    this.elements.titleError.textContent = '';
  }

  /**
   * トースト通知を表示
   * @param {string} message - メッセージ
   * @param {string} type - タイプ ('error' | 'success' | 'info')
   */
  showToast(message, type = 'info') {
    // 既存のトーストがあれば削除
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    // トースト要素を作成
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}</span>
      <span class="toast-message">${message}</span>
    `;

    document.body.appendChild(toast);

    // アニメーション後に削除
    setTimeout(() => {
      toast.classList.add('toast-hide');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ==========================================
  // ユーティリティメソッド
  // ==========================================

  /**
   * アクティブなフィルターがあるかチェック
   * @returns {boolean} フィルターが適用されている場合true
   */
  hasActiveFilter() {
    return !!(
      this.currentFilters.selectedTags.length > 0 ||
      this.currentFilters.selectedPriorities.length > 0 ||
      !this.currentFilters.showCompleted
    );
  }

  /**
   * 日付をフォーマット（表示用）
   * @param {Date} date - 日付オブジェクト
   * @returns {string} フォーマットされた日付文字列
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}`;
  }

  /**
   * 日付をフォーマット（input[type="datetime-local"]用）
   * @param {Date} date - 日付オブジェクト
   * @returns {string} フォーマットされた日付文字列
   */
  formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  /**
   * 期限ステータスのテキストを取得
   * @param {string} status - ステータス
   * @returns {string} ステータステキスト
   */
  getDueDateStatusText(status) {
    const statusMap = {
      overdue: '（期限切れ）',
      today: '（今日）',
      tomorrow: '（明日）',
      upcoming: '',
      none: ''
    };
    return statusMap[status] || '';
  }

  /**
   * 優先度のテキストを取得
   * @param {string} priority - 優先度
   * @returns {string} 優先度テキスト
   */
  getPriorityText(priority) {
    const priorityMap = {
      high: '高',
      medium: '中',
      low: '低'
    };
    return priorityMap[priority] || '中';
  }

  /**
   * HTMLエスケープ（XSS対策）
   * @param {string} text - エスケープするテキスト
   * @returns {string} エスケープされたテキスト
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ==========================================
  // グループ管理メソッド
  // ==========================================

  /**
   * グループタブをレンダリング
   */
  renderGroupTabs() {
    const groups = this.todoManager.getAllGroups();
    const activeGroupId = this.todoManager.activeGroupId;

    // タブコンテナをクリア
    this.elements.groupTabs.innerHTML = '';

    // 各グループのタブを作成
    groups.forEach(group => {
      const tab = document.createElement('button');
      tab.className = 'task-group-tab';
      tab.dataset.groupId = group.id;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', group.id === activeGroupId ? 'true' : 'false');

      if (group.id === activeGroupId) {
        tab.classList.add('active');
      }

      // タブの内容
      tab.innerHTML = `
        <span class="group-name">${this.escapeHtml(group.name)}</span>
        <span class="group-actions">
          <span class="group-edit" data-group-id="${group.id}" title="グループ名を変更">✎</span>
          <span class="group-delete" data-group-id="${group.id}" title="グループを削除">×</span>
        </span>
      `;

      // タブクリックでグループ切り替え
      tab.addEventListener('click', (e) => {
        // 編集ボタンをクリックした場合
        if (e.target.classList.contains('group-edit')) {
          e.stopPropagation();
          this.openGroupModal(group.id);
          return;
        }
        // 削除ボタンをクリックした場合
        if (e.target.classList.contains('group-delete')) {
          e.stopPropagation();
          this.handleGroupDelete(group.id);
          return;
        }
        this.handleGroupSelect(group.id);
      });

      // ダブルクリックで名前変更（既存機能を維持）
      tab.addEventListener('dblclick', (e) => {
        if (!e.target.classList.contains('group-delete') && !e.target.classList.contains('group-edit')) {
          this.openGroupModal(group.id);
        }
      });

      this.elements.groupTabs.appendChild(tab);
    });

    // すべて表示ボタンの状態を更新
    this.updateShowAllButtonState();
  }

  /**
   * すべて表示ボタンのクリック処理
   */
  handleShowAll() {
    this.todoManager.setActiveGroup('all');
    this.updateShowAllButtonState();
    this.renderGroupTabs();
    this.render();
  }

  /**
   * すべて表示ボタンのアクティブ状態を更新
   */
  updateShowAllButtonState() {
    const isAllActive = this.todoManager.activeGroupId === 'all';
    this.elements.btnShowAll.classList.toggle('active', isAllActive);
  }

  /**
   * グループ選択処理
   * @param {string} groupId - グループID
   */
  handleGroupSelect(groupId) {
    if (this.todoManager.setActiveGroup(groupId)) {
      this.updateShowAllButtonState();
      this.renderGroupTabs();
      this.render();
    }
  }

  /**
   * グループ削除処理
   * @param {string} groupId - グループID
   */
  handleGroupDelete(groupId) {
    const group = this.todoManager.getGroup(groupId);
    if (!group) return;

    // 最後のグループは削除できない
    if (this.todoManager.groups.length <= 1) {
      this.showError('最後のグループは削除できません');
      return;
    }

    const todoCount = this.todoManager.getTodosByGroup(groupId).length;
    const message = todoCount > 0
      ? `グループ「${group.name}」を削除しますか？\n${todoCount}件のタスクも削除されます。`
      : `グループ「${group.name}」を削除しますか？`;

    this.showConfirmDialog(message, () => {
      if (this.todoManager.deleteGroup(groupId)) {
        this.renderGroupTabs();
        this.render();
      } else {
        this.showError('グループの削除に失敗しました');
      }
    });
  }

  /**
   * グループモーダルを開く
   * @param {string|null} groupId - 編集する場合はグループID、新規作成の場合はnull
   */
  openGroupModal(groupId = null) {
    this.editingGroupId = groupId;

    if (groupId) {
      // 編集モード
      const group = this.todoManager.getGroup(groupId);
      if (!group) {
        console.error('Group not found:', groupId);
        return;
      }

      this.elements.groupModalTitle.textContent = 'グループを編集';
      this.elements.groupId.value = group.id;
      this.elements.groupName.value = group.name;
    } else {
      // 新規作成モード
      this.elements.groupModalTitle.textContent = '新しいグループ';
      this.elements.groupForm.reset();
      this.elements.groupId.value = '';
    }

    // モーダル表示
    this.elements.groupModal.classList.add('active');
    this.elements.groupModal.setAttribute('aria-hidden', 'false');

    // 名前にフォーカス
    this.elements.groupName.focus();
  }

  /**
   * グループモーダルを閉じる
   */
  closeGroupModal() {
    this.elements.groupModal.classList.remove('active');
    this.elements.groupModal.setAttribute('aria-hidden', 'true');
    this.elements.groupForm.reset();
    this.editingGroupId = null;
  }

  /**
   * グループフォーム送信処理
   */
  handleGroupFormSubmit() {
    const name = this.elements.groupName.value.trim();

    if (!name) {
      this.showError('グループ名を入力してください');
      return;
    }

    if (name.length > 30) {
      this.showError('グループ名は30文字以内にしてください');
      return;
    }

    if (this.editingGroupId) {
      // 更新
      const updated = this.todoManager.updateGroup(this.editingGroupId, { name });
      if (updated) {
        this.closeGroupModal();
        this.renderGroupTabs();
        this.render();
      } else {
        this.showError('グループの更新に失敗しました');
      }
    } else {
      // 新規作成
      const created = this.todoManager.createGroup(name);
      if (created) {
        // 新しいグループをアクティブに
        this.todoManager.setActiveGroup(created.id);
        this.closeGroupModal();
        this.renderGroupTabs();
        this.render();
      } else {
        this.showError('グループの作成に失敗しました');
      }
    }
  }

  // ==========================================
  // 繰り返し設定メソッド
  // ==========================================

  /**
   * 繰り返しオプションの表示/非表示を切り替え
   */
  toggleRecurrenceOptions() {
    const enabled = this.elements.recurrenceEnabled.checked;
    if (enabled) {
      this.elements.recurrenceOptions.classList.remove('hidden');
    } else {
      this.elements.recurrenceOptions.classList.add('hidden');
    }
  }

  /**
   * 繰り返しタイプに応じたオプション表示を更新
   */
  updateRecurrenceTypeOptions() {
    const type = this.elements.recurrenceType.value;

    // カスタム間隔の表示切り替え
    if (type === 'custom') {
      this.elements.customIntervalGroup.classList.remove('hidden');
    } else {
      this.elements.customIntervalGroup.classList.add('hidden');
    }

    // 曜日選択の表示切り替え
    if (type === 'weekdays') {
      this.elements.weekdaysGroup.classList.remove('hidden');
    } else {
      this.elements.weekdaysGroup.classList.add('hidden');
    }
  }

  /**
   * 終了条件タイプに応じたオプション表示を更新
   */
  updateEndConditionOptions() {
    const type = this.elements.endConditionType.value;

    // 回数指定の表示切り替え
    if (type === 'count') {
      this.elements.endCountGroup.classList.remove('hidden');
    } else {
      this.elements.endCountGroup.classList.add('hidden');
    }

    // 日付指定の表示切り替え
    if (type === 'date') {
      this.elements.endDateGroup.classList.remove('hidden');
    } else {
      this.elements.endDateGroup.classList.add('hidden');
    }
  }

  /**
   * 完了時の挙動のヒントを更新
   */
  updateBehaviorHint() {
    const behavior = this.elements.completionBehavior.value;
    const hints = {
      createNext: '完了するとすぐに次のタスクが作成されます',
      createOnDue: '次の期限になったら自動でタスクが作成されます',
      reset: '完了しても同じタスクが期限を更新して残ります'
    };
    this.elements.behaviorHint.textContent = hints[behavior] || '';
  }

  /**
   * フォームから繰り返し設定を取得
   * @returns {Object|null} 繰り返し設定、無効ならnull
   */
  getRecurrenceFromForm() {
    if (!this.elements.recurrenceEnabled.checked) {
      return null;
    }

    const type = this.elements.recurrenceType.value;

    // 曜日を取得
    const weekdayCheckboxes = document.querySelectorAll('input[name="weekday"]:checked');
    const weekdays = Array.from(weekdayCheckboxes).map(cb => parseInt(cb.value, 10));

    // 終了条件を構築
    const endConditionType = this.elements.endConditionType.value;
    const endCondition = {
      type: endConditionType,
      count: endConditionType === 'count' ? parseInt(this.elements.endConditionCount.value, 10) : null,
      endDate: endConditionType === 'date' ? this.elements.endConditionDate.value : null
    };

    return {
      enabled: true,
      type: type,
      interval: type === 'custom' ? parseInt(this.elements.recurrenceInterval.value, 10) : 1,
      weekdays: type === 'weekdays' ? weekdays : [],
      endCondition: endCondition,
      completionBehavior: this.elements.completionBehavior.value,
      originalTaskId: null,
      completedCount: 0
    };
  }

  /**
   * 繰り返し設定をフォームにセット
   * @param {Object|null} recurrence - 繰り返し設定
   */
  setRecurrenceToForm(recurrence) {
    if (!recurrence || !recurrence.enabled) {
      this.elements.recurrenceEnabled.checked = false;
      this.elements.recurrenceOptions.classList.add('hidden');
      this.resetRecurrenceForm();
      return;
    }

    this.elements.recurrenceEnabled.checked = true;
    this.elements.recurrenceOptions.classList.remove('hidden');

    // タイプを設定
    this.elements.recurrenceType.value = recurrence.type || 'daily';
    this.updateRecurrenceTypeOptions();

    // 間隔を設定
    this.elements.recurrenceInterval.value = recurrence.interval || 1;

    // 曜日を設定
    const weekdayCheckboxes = document.querySelectorAll('input[name="weekday"]');
    weekdayCheckboxes.forEach(cb => {
      cb.checked = recurrence.weekdays && recurrence.weekdays.includes(parseInt(cb.value, 10));
    });

    // 終了条件を設定
    if (recurrence.endCondition) {
      this.elements.endConditionType.value = recurrence.endCondition.type || 'never';
      this.updateEndConditionOptions();

      if (recurrence.endCondition.count) {
        this.elements.endConditionCount.value = recurrence.endCondition.count;
      }
      if (recurrence.endCondition.endDate) {
        this.elements.endConditionDate.value = recurrence.endCondition.endDate.split('T')[0];
      }
    }

    // 完了時の挙動を設定
    this.elements.completionBehavior.value = recurrence.completionBehavior || 'createNext';
    this.updateBehaviorHint();
  }

  /**
   * 繰り返し設定フォームをリセット
   */
  resetRecurrenceForm() {
    this.elements.recurrenceType.value = 'daily';
    this.elements.recurrenceInterval.value = 1;
    this.elements.endConditionType.value = 'never';
    this.elements.endConditionCount.value = 5;
    this.elements.endConditionDate.value = '';
    this.elements.completionBehavior.value = 'createNext';

    // 曜日チェックを解除
    const weekdayCheckboxes = document.querySelectorAll('input[name="weekday"]');
    weekdayCheckboxes.forEach(cb => cb.checked = false);

    // オプション表示をリセット
    this.elements.customIntervalGroup.classList.add('hidden');
    this.elements.weekdaysGroup.classList.add('hidden');
    this.elements.endCountGroup.classList.add('hidden');
    this.elements.endDateGroup.classList.add('hidden');

    this.updateBehaviorHint();
  }

  // ==========================================
  // タグ管理メソッド
  // ==========================================

  /**
   * 設定からタグ一覧を取得
   * @returns {string[]} タグの配列
   */
  getTags() {
    const settings = loadSettings();
    return settings.tags || [];
  }

  /**
   * タグを設定に保存
   * @param {string[]} tags - タグの配列
   */
  saveTagsToSettings(tags) {
    const settings = loadSettings();
    settings.tags = tags;
    saveSettings(settings);
  }

  /**
   * タグの使用数を取得
   * @param {string} tag - タグ名
   * @returns {number} 使用数
   */
  getTagUsageCount(tag) {
    const todos = this.todoManager.getAllTodos();
    return todos.filter(todo => todo.tags && todo.tags.includes(tag)).length;
  }

  /**
   * サイドバーのタグフィルターを描画
   */
  renderTagFilter() {
    const tags = this.getTags();
    const container = this.elements.tagFilterContainer;

    if (tags.length === 0) {
      container.innerHTML = '<p class="no-tags-message">タグがありません</p>';
      return;
    }

    let html = '';
    tags.forEach(tag => {
      const count = this.getTagUsageCount(tag);
      const isChecked = this.currentFilters.selectedTags.includes(tag);
      html += `
        <label class="tag-filter-item">
          <input type="checkbox" class="tag-filter-checkbox" value="${this.escapeHtml(tag)}" ${isChecked ? 'checked' : ''}>
          <span class="tag-filter-name">${this.escapeHtml(tag)}</span>
          <span class="tag-filter-count">(${count})</span>
        </label>
      `;
    });

    container.innerHTML = html;

    // チェックボックスにイベントリスナーを追加
    container.querySelectorAll('.tag-filter-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.handleTagFilterChange();
      });
    });
  }

  /**
   * タグフィルターの変更を処理
   */
  handleTagFilterChange() {
    const checkboxes = this.elements.tagFilterContainer.querySelectorAll('.tag-filter-checkbox:checked');
    this.currentFilters.selectedTags = Array.from(checkboxes).map(cb => cb.value);
    this.render();
  }

  /**
   * タグ管理モーダルを開く
   */
  openTagModal() {
    this.renderTagManageList();
    this.elements.newTagManageInput.value = '';
    this.elements.tagModal.classList.add('active');
    this.elements.tagModal.setAttribute('aria-hidden', 'false');
    this.elements.newTagManageInput.focus();
  }

  /**
   * タグ管理モーダルを閉じる
   */
  closeTagModal() {
    this.elements.tagModal.classList.remove('active');
    this.elements.tagModal.setAttribute('aria-hidden', 'true');
    // フィルターを再描画（タグが変更されている可能性があるため）
    this.renderTagFilter();
  }

  /**
   * タグ管理一覧を描画
   */
  renderTagManageList() {
    const tags = this.getTags();
    const container = this.elements.tagManageList;

    if (tags.length === 0) {
      container.innerHTML = '<p class="no-tags-message">タグがありません</p>';
      return;
    }

    let html = '';
    tags.forEach(tag => {
      const count = this.getTagUsageCount(tag);
      html += `
        <div class="tag-manage-item" data-tag="${this.escapeHtml(tag)}">
          <span class="tag-manage-name">${this.escapeHtml(tag)}</span>
          <span class="tag-manage-count">${count}件で使用</span>
          <div class="tag-manage-actions">
            <button class="btn-icon btn-tag-edit" data-tag="${this.escapeHtml(tag)}" title="編集">✎</button>
            <button class="btn-icon btn-tag-delete" data-tag="${this.escapeHtml(tag)}" title="削除">×</button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // 編集・削除ボタンにイベントリスナーを追加
    container.querySelectorAll('.btn-tag-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openTagEditModal(btn.dataset.tag);
      });
    });

    container.querySelectorAll('.btn-tag-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        this.handleDeleteTag(btn.dataset.tag);
      });
    });
  }

  /**
   * タグ管理モーダルから新規タグを追加
   */
  addNewTagFromManageModal() {
    const tagName = this.elements.newTagManageInput.value.trim();
    if (!tagName) {
      return;
    }

    if (tagName.length > 20) {
      this.showToast('タグ名は20文字以内にしてください', 'error');
      return;
    }

    const tags = this.getTags();
    if (tags.includes(tagName)) {
      this.showToast('同じ名前のタグが既に存在します', 'error');
      return;
    }

    tags.push(tagName);
    this.saveTagsToSettings(tags);

    this.elements.newTagManageInput.value = '';
    this.renderTagManageList();
    this.showToast(`タグ「${tagName}」を追加しました`, 'success');
  }

  /**
   * TODOモーダル内で新規タグを追加
   */
  addNewTagInline() {
    const tagName = this.elements.newTagInput.value.trim();
    if (!tagName) {
      return;
    }

    if (tagName.length > 20) {
      this.showToast('タグ名は20文字以内にしてください', 'error');
      return;
    }

    const tags = this.getTags();
    const isNewTag = !tags.includes(tagName);
    if (isNewTag) {
      tags.push(tagName);
      this.saveTagsToSettings(tags);
      // サイドバーのタグフィルターを更新
      this.renderTagFilter();
    }

    this.elements.newTagInput.value = '';

    // 現在選択されているタグを取得し、新しいタグを追加
    const selectedTags = this.getSelectedTagsFromModal();
    if (!selectedTags.includes(tagName)) {
      selectedTags.push(tagName);
    }

    // タグチェックボックスを再描画
    this.renderTodoTagsCheckboxes(selectedTags);
  }

  /**
   * タグ編集モーダルを開く
   * @param {string} tagName - 編集するタグ名
   */
  openTagEditModal(tagName) {
    this.elements.tagEditOriginal.value = tagName;
    this.elements.tagEditInput.value = tagName;
    this.elements.tagEditModal.classList.add('active');
    this.elements.tagEditModal.setAttribute('aria-hidden', 'false');
    this.elements.tagEditInput.focus();
    this.elements.tagEditInput.select();
  }

  /**
   * タグ編集モーダルを閉じる
   */
  closeTagEditModal() {
    this.elements.tagEditModal.classList.remove('active');
    this.elements.tagEditModal.setAttribute('aria-hidden', 'true');
  }

  /**
   * タグ編集を保存
   */
  saveTagEdit() {
    const originalTag = this.elements.tagEditOriginal.value;
    const newTag = this.elements.tagEditInput.value.trim();

    if (!newTag) {
      this.showToast('タグ名を入力してください', 'error');
      return;
    }

    if (newTag.length > 20) {
      this.showToast('タグ名は20文字以内にしてください', 'error');
      return;
    }

    if (newTag === originalTag) {
      this.closeTagEditModal();
      return;
    }

    const tags = this.getTags();
    if (tags.includes(newTag)) {
      this.showToast('同じ名前のタグが既に存在します', 'error');
      return;
    }

    // 設定のタグを更新
    const index = tags.indexOf(originalTag);
    if (index !== -1) {
      tags[index] = newTag;
      this.saveTagsToSettings(tags);
    }

    // 全タスクのタグを更新
    const todos = this.todoManager.getAllTodos();
    todos.forEach(todo => {
      if (todo.tags && todo.tags.includes(originalTag)) {
        const tagIndex = todo.tags.indexOf(originalTag);
        if (tagIndex !== -1) {
          todo.tags[tagIndex] = newTag;
        }
      }
    });
    this.todoManager.save();

    // フィルターのselectedTagsも更新
    const filterIndex = this.currentFilters.selectedTags.indexOf(originalTag);
    if (filterIndex !== -1) {
      this.currentFilters.selectedTags[filterIndex] = newTag;
    }

    this.closeTagEditModal();
    this.renderTagManageList();
    this.showToast(`タグ名を「${newTag}」に変更しました`, 'success');
  }

  /**
   * タグを削除
   * @param {string} tagName - 削除するタグ名
   */
  handleDeleteTag(tagName) {
    const count = this.getTagUsageCount(tagName);
    const message = count > 0
      ? `タグ「${tagName}」を削除しますか？\n${count}件のタスクからこのタグが削除されます。`
      : `タグ「${tagName}」を削除しますか？`;

    this.showConfirmDialog(message, () => {
      // 設定からタグを削除
      const tags = this.getTags();
      const index = tags.indexOf(tagName);
      if (index !== -1) {
        tags.splice(index, 1);
        this.saveTagsToSettings(tags);
      }

      // 全タスクからタグを削除
      const todos = this.todoManager.getAllTodos();
      todos.forEach(todo => {
        if (todo.tags && todo.tags.includes(tagName)) {
          const tagIndex = todo.tags.indexOf(tagName);
          if (tagIndex !== -1) {
            todo.tags.splice(tagIndex, 1);
          }
        }
      });
      this.todoManager.save();

      // フィルターからも削除
      const filterIndex = this.currentFilters.selectedTags.indexOf(tagName);
      if (filterIndex !== -1) {
        this.currentFilters.selectedTags.splice(filterIndex, 1);
      }

      this.renderTagManageList();
      this.render();
      this.showToast(`タグ「${tagName}」を削除しました`, 'success');
    });
  }

  /**
   * TODOモーダル内のタグチェックボックスを描画
   * @param {string[]} selectedTags - 選択されているタグの配列
   */
  renderTodoTagsCheckboxes(selectedTags) {
    const tags = this.getTags();
    const container = this.elements.todoTagsContainer;

    if (tags.length === 0) {
      container.innerHTML = '<p class="no-tags-hint">タグがありません</p>';
      return;
    }

    let html = '';
    tags.forEach(tag => {
      const isChecked = selectedTags.includes(tag);
      html += `
        <label class="tag-checkbox-item">
          <input type="checkbox" class="tag-checkbox" value="${this.escapeHtml(tag)}" ${isChecked ? 'checked' : ''}>
          <span class="tag-checkbox-name">${this.escapeHtml(tag)}</span>
        </label>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * TODOモーダルから選択されたタグを取得
   * @returns {string[]} 選択されているタグの配列
   */
  getSelectedTagsFromModal() {
    const checkboxes = this.elements.todoTagsContainer.querySelectorAll('.tag-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.value);
  }
}
