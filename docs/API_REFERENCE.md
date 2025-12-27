# API リファレンス

このドキュメントでは、各モジュールが提供する関数とメソッドの仕様を定義します。

---

## 1. storage.js - データ永続化モジュール

LocalStorageの操作を抽象化し、将来的にバックエンドAPIに置き換え可能な設計。

### 関数一覧

#### `loadTodos()`
TODOデータをLocalStorageから読み込む。

```javascript
/**
 * TODOデータを読み込む
 * @returns {TodoItem[]} TODOアイテムの配列
 */
function loadTodos()
```

**戻り値**
- `TodoItem[]`: TODOアイテムの配列
- データが存在しない場合は空配列 `[]` を返す
- パースエラー時も空配列を返す

**使用例**
```javascript
const todos = loadTodos();
console.log(todos); // [{id: "...", title: "..."}, ...]
```

---

#### `saveTodos(todos)`
TODOデータをLocalStorageに保存する。

```javascript
/**
 * TODOデータを保存する
 * @param {TodoItem[]} todos - 保存するTODOアイテムの配列
 * @returns {boolean} 成功した場合true、失敗した場合false
 */
function saveTodos(todos)
```

**パラメータ**
- `todos` (TodoItem[]): 保存するTODOアイテムの配列

**戻り値**
- `boolean`: 保存成功時 `true`、失敗時 `false`

**使用例**
```javascript
const success = saveTodos(todos);
if (!success) {
  console.error('保存に失敗しました');
}
```

---

#### `loadSettings()`
アプリケーション設定をLocalStorageから読み込む。

```javascript
/**
 * アプリケーション設定を読み込む
 * @returns {AppSettings} 設定オブジェクト
 */
function loadSettings()
```

**戻り値**
- `AppSettings`: アプリケーション設定
- データが存在しない場合はデフォルト設定を返す

**使用例**
```javascript
const settings = loadSettings();
console.log(settings.theme); // "light" or "dark"
```

---

#### `saveSettings(settings)`
アプリケーション設定をLocalStorageに保存する。

```javascript
/**
 * アプリケーション設定を保存する
 * @param {AppSettings} settings - 保存する設定オブジェクト
 * @returns {boolean} 成功した場合true、失敗した場合false
 */
function saveSettings(settings)
```

**パラメータ**
- `settings` (AppSettings): 保存する設定オブジェクト

**戻り値**
- `boolean`: 保存成功時 `true`、失敗時 `false`

---

#### `clearAllData()`
全てのデータをLocalStorageから削除する（デバッグ用）。

```javascript
/**
 * 全てのデータを削除する
 * @returns {void}
 */
function clearAllData()
```

**使用例**
```javascript
clearAllData();
console.log('全データを削除しました');
```

---

#### `loadGroups()`
グループデータをLocalStorageから読み込む。

```javascript
/**
 * グループデータを読み込む
 * @returns {TaskGroup[]} グループの配列
 */
function loadGroups()
```

**戻り値**
- `TaskGroup[]`: グループの配列
- データが存在しない場合は空配列 `[]` を返す

---

#### `saveGroups(groups)`
グループデータをLocalStorageに保存する。

```javascript
/**
 * グループデータを保存する
 * @param {TaskGroup[]} groups - 保存するグループの配列
 * @returns {boolean} 成功した場合true、失敗した場合false
 */
function saveGroups(groups)
```

**パラメータ**
- `groups` (TaskGroup[]): 保存するグループの配列

**戻り値**
- `boolean`: 保存成功時 `true`、失敗時 `false`

---

#### `loadActiveGroup()`
アクティブグループIDをLocalStorageから読み込む。

```javascript
/**
 * アクティブグループIDを読み込む
 * @returns {string|null} アクティブグループID、存在しない場合はnull
 */
function loadActiveGroup()
```

**戻り値**
- `string`: アクティブグループID
- `null`: 存在しない場合

---

#### `saveActiveGroup(groupId)`
アクティブグループIDをLocalStorageに保存する。

```javascript
/**
 * アクティブグループIDを保存する
 * @param {string|null} groupId - 保存するグループID
 * @returns {boolean} 成功した場合true、失敗した場合false
 */
function saveActiveGroup(groupId)
```

**パラメータ**
- `groupId` (string|null): 保存するグループID

**戻り値**
- `boolean`: 保存成功時 `true`、失敗時 `false`

---

## 2. todo.js - ビジネスロジックモジュール

TODOデータの管理とビジネスロジックを提供。

### TODOManager クラス

```javascript
class TodoManager {
  constructor()
  // CRUD操作
  createTodo(data)
  getTodo(id)
  getAllTodos()
  updateTodo(id, updates)
  deleteTodo(id)
  toggleComplete(id)

  // フィルタリング・ソート
  filterTodos(filters)
  sortTodos(todos, sortBy, sortOrder)

  // サブタスク管理
  addSubtask(parentId, subtaskData)
  removeSubtask(parentId, subtaskId)
  getSubtasks(parentId)
  hasCircularReference(parentId, childId)

  // 繰り返しタスク管理
  handleTaskCompletion(id)
  generateNextRecurrence(todo)
  checkScheduledRecurrences()

  // グループ管理
  createGroup(name)
  getGroup(id)
  getAllGroups()
  updateGroup(id, updates)
  deleteGroup(id)
  setActiveGroup(id)
  getActiveGroup()
  getTodosByGroup(groupId)

  // ユーティリティ
  validateTodo(data)
  getDueDateStatus(dueDate)
}
```

### メソッド詳細

#### `constructor()`
TodoManagerのインスタンスを作成。

```javascript
/**
 * TodoManagerのコンストラクタ
 */
constructor()
```

**使用例**
```javascript
const todoManager = new TodoManager();
```

---

#### `createTodo(data)`
新しいTODOを作成する。

```javascript
/**
 * 新しいTODOを作成
 * @param {Object} data - TODOデータ
 * @param {string} data.title - タイトル（必須）
 * @param {string} [data.description] - 説明
 * @param {string[]} [data.tags] - タグ配列
 * @param {string} [data.priority='medium'] - 優先度
 * @param {string|null} [data.dueDate] - 期限
 * @param {string|null} [data.parentId] - 親タスクID
 * @param {Object|null} [data.recurrence] - 繰り返し設定
 * @returns {TodoItem|null} 作成されたTODOアイテム、エラー時はnull
 */
createTodo(data)
```

**パラメータ**
- `data` (Object): TODOデータ
  - `title` (string) 必須
  - その他のフィールドはオプショナル

**戻り値**
- `TodoItem`: 作成されたTODOアイテム
- `null`: バリデーションエラー時

**使用例**
```javascript
const newTodo = todoManager.createTodo({
  title: '買い物に行く',
  tags: ['個人', '今日中'],
  priority: 'high',
  dueDate: '2025-01-10T18:00:00.000Z'
});
```

---

#### `getTodo(id)`
指定IDのTODOを取得する。

```javascript
/**
 * 指定IDのTODOを取得
 * @param {string} id - TODOID
 * @returns {TodoItem|null} TODOアイテム、見つからない場合はnull
 */
getTodo(id)
```

**パラメータ**
- `id` (string): TODO ID

**戻り値**
- `TodoItem`: 該当するTODOアイテム
- `null`: 見つからない場合

---

#### `getAllTodos()`
全てのTODOを取得する。

```javascript
/**
 * 全てのTODOを取得
 * @returns {TodoItem[]} TODOアイテムの配列
 */
getAllTodos()
```

**戻り値**
- `TodoItem[]`: 全TODOアイテムの配列

---

#### `updateTodo(id, updates)`
TODOを更新する。

```javascript
/**
 * TODOを更新
 * @param {string} id - TODO ID
 * @param {Object} updates - 更新するフィールド
 * @returns {TodoItem|null} 更新されたTODOアイテム、失敗時はnull
 */
updateTodo(id, updates)
```

**パラメータ**
- `id` (string): TODO ID
- `updates` (Object): 更新するフィールド（部分更新）

**戻り値**
- `TodoItem`: 更新されたTODOアイテム
- `null`: 失敗時

**使用例**
```javascript
const updated = todoManager.updateTodo('todo-123', {
  title: '更新されたタイトル',
  priority: 'low'
});
```

---

#### `deleteTodo(id)`
TODOを削除する（サブタスクも再帰的に削除）。

```javascript
/**
 * TODOを削除（カスケード削除）
 * @param {string} id - TODO ID
 * @returns {boolean} 成功時true、失敗時false
 */
deleteTodo(id)
```

**パラメータ**
- `id` (string): TODO ID

**戻り値**
- `boolean`: 削除成功時 `true`、失敗時 `false`

**注意**
- サブタスクがある場合、全ての子タスクも再帰的に削除される

---

#### `toggleComplete(id)`
TODOの完了状態を切り替える。

```javascript
/**
 * TODOの完了状態を切り替え
 * @param {string} id - TODO ID
 * @returns {boolean} 成功時true、失敗時false
 */
toggleComplete(id)
```

**パラメータ**
- `id` (string): TODO ID

**戻り値**
- `boolean`: 成功時 `true`、失敗時 `false`

**動作**
- 未完了 → 完了
- 完了 → 未完了
- 繰り返しタスクの場合、完了時に`handleTaskCompletion`を呼び出す

---

#### `filterTodos(filters)`
フィルター条件に基づいてTODOを絞り込む。

```javascript
/**
 * TODOをフィルタリング
 * @param {Object} filters - フィルター条件
 * @param {string[]} [filters.selectedTags] - タグ配列（OR条件）
 * @param {string[]} [filters.selectedPriorities] - 優先度配列
 * @param {boolean} [filters.showCompleted=true] - 完了タスクを表示
 * @returns {TodoItem[]} フィルタリングされたTODO配列
 */
filterTodos(filters)
```

**パラメータ**
- `filters` (Object): フィルター条件
  - `selectedTags` (string[]): 選択されたタグ（OR条件：いずれかを含むタスクを表示）
  - `selectedPriorities` (string[]): 選択された優先度
  - `showCompleted` (boolean): 完了タスクを表示するか

**戻り値**
- `TodoItem[]`: フィルタリング後のTODO配列

**使用例**
```javascript
const filtered = todoManager.filterTodos({
  selectedTags: ['仕事', '緊急'],  // 「仕事」OR「緊急」タグを持つタスク
  selectedPriorities: ['high', 'medium'],
  showCompleted: false
});
```

---

#### `sortTodos(todos, sortBy, sortOrder)`
TODOをソートする。

```javascript
/**
 * TODOをソート
 * @param {TodoItem[]} todos - ソート対象のTODO配列
 * @param {string} sortBy - ソート基準 ('createdAt'|'dueDate'|'priority'|'title')
 * @param {string} sortOrder - ソート順 ('asc'|'desc')
 * @returns {TodoItem[]} ソートされたTODO配列
 */
sortTodos(todos, sortBy, sortOrder)
```

**パラメータ**
- `todos` (TodoItem[]): ソート対象の配列
- `sortBy` (string): ソート基準
- `sortOrder` (string): ソート順

**戻り値**
- `TodoItem[]`: ソート後のTODO配列

---

#### `addSubtask(parentId, subtaskData)`
サブタスクを追加する。

```javascript
/**
 * サブタスクを追加
 * @param {string} parentId - 親タスクID
 * @param {Object} subtaskData - サブタスクのデータ
 * @returns {TodoItem|null} 作成されたサブタスク、失敗時はnull
 */
addSubtask(parentId, subtaskData)
```

**パラメータ**
- `parentId` (string): 親タスクID
- `subtaskData` (Object): サブタスクのデータ

**戻り値**
- `TodoItem`: 作成されたサブタスク
- `null`: 失敗時（親が存在しない、循環参照など）

---

#### `hasCircularReference(parentId, childId)`
循環参照をチェックする。

```javascript
/**
 * 循環参照をチェック
 * @param {string} parentId - 親候補のID
 * @param {string} childId - 子候補のID
 * @returns {boolean} 循環参照が発生する場合true
 */
hasCircularReference(parentId, childId)
```

**パラメータ**
- `parentId` (string): 親候補のID
- `childId` (string): 子候補のID

**戻り値**
- `boolean`: 循環参照が発生する場合 `true`

---

#### `getSubtaskProgress(parentId)`
サブタスクの進捗を取得する（再帰的に全階層をカウント）。

```javascript
/**
 * サブタスクの進捗を取得
 * @param {string} parentId - 親タスクID
 * @returns {Object} {total: number, completed: number}
 */
getSubtaskProgress(parentId)
```

**パラメータ**
- `parentId` (string): 親タスクID

**戻り値**
- `Object`: `{total: number, completed: number}`
  - `total`: 全サブタスク数
  - `completed`: 完了済みサブタスク数

---

#### `getIncompleteSubtasksCount(parentId)`
未完了サブタスクの数を取得する。

```javascript
/**
 * 未完了サブタスクの数を取得
 * @param {string} parentId - 親タスクID
 * @returns {number} 未完了サブタスク数
 */
getIncompleteSubtasksCount(parentId)
```

**パラメータ**
- `parentId` (string): 親タスクID

**戻り値**
- `number`: 未完了サブタスク数

---

#### `completeAllSubtasks(parentId)`
全てのサブタスクを再帰的に完了状態にする。

```javascript
/**
 * 全サブタスクを完了にする
 * @param {string} parentId - 親タスクID
 */
completeAllSubtasks(parentId)
```

**パラメータ**
- `parentId` (string): 親タスクID

**使用タイミング**
- 親タスク完了時に未完了サブタスクがある場合、警告ダイアログから呼び出し

---

#### `handleTaskCompletion(id)`
タスク完了時の処理（繰り返しタスクの場合、次回分を生成）。

```javascript
/**
 * タスク完了時の処理
 * @param {string} id - 完了したタスクのID
 * @returns {TodoItem|null} 生成された次回タスク、なければnull
 */
handleTaskCompletion(id)
```

**パラメータ**
- `id` (string): 完了したタスクのID

**戻り値**
- `TodoItem`: 生成された次回タスク
- `null`: 繰り返しタスクでない場合、または生成しない場合

---

#### `generateNextRecurrence(todo)`
繰り返しタスクの次回分を生成する。

```javascript
/**
 * 次回の繰り返しタスクを生成
 * @param {TodoItem} todo - 元のTODOアイテム
 * @returns {TodoItem|null} 生成された次回タスク、終了条件に達した場合はnull
 */
generateNextRecurrence(todo)
```

**パラメータ**
- `todo` (TodoItem): 元のTODOアイテム

**戻り値**
- `TodoItem`: 生成された次回タスク
- `null`: 終了条件に達した場合

---

#### `checkScheduledRecurrences()`
期限が来た繰り返しタスクをチェックし、必要に応じて生成する。

```javascript
/**
 * 期限が来た繰り返しタスクをチェック
 * @returns {TodoItem[]} 生成されたタスクの配列
 */
checkScheduledRecurrences()
```

**戻り値**
- `TodoItem[]`: 生成されたタスクの配列

**使用タイミング**
- アプリ起動時
- 定期的なチェック（将来的に実装）

---

#### `validateTodo(data)`
TODOデータをバリデーションする。

```javascript
/**
 * TODOデータをバリデーション
 * @param {Object} data - バリデーション対象のデータ
 * @returns {Object} {valid: boolean, errors: string[]}
 */
validateTodo(data)
```

**パラメータ**
- `data` (Object): バリデーション対象のデータ

**戻り値**
- `Object`:
  - `valid` (boolean): バリデーション成功時 `true`
  - `errors` (string[]): エラーメッセージの配列

**使用例**
```javascript
const result = todoManager.validateTodo(data);
if (!result.valid) {
  console.error('エラー:', result.errors);
}
```

---

#### `getDueDateStatus(dueDate)`
期限の状態を取得する。

```javascript
/**
 * 期限の状態を取得
 * @param {string|null} dueDate - 期限（ISO形式）
 * @returns {string} 'overdue'|'today'|'tomorrow'|'upcoming'|'none'
 */
getDueDateStatus(dueDate)
```

**パラメータ**
- `dueDate` (string|null): 期限（ISO形式）

**戻り値**
- `'overdue'`: 期限切れ
- `'today'`: 今日が期限
- `'tomorrow'`: 明日が期限
- `'upcoming'`: それ以降
- `'none'`: 期限なし

---

### グループ管理メソッド

#### `createGroup(name)`
新しいグループを作成する。

```javascript
/**
 * 新しいグループを作成
 * @param {string} name - グループ名（1-30文字）
 * @returns {TaskGroup|null} 作成されたグループ、失敗時はnull
 */
createGroup(name)
```

**パラメータ**
- `name` (string): グループ名（1-30文字）

**戻り値**
- `TaskGroup`: 作成されたグループ
- `null`: バリデーションエラー時

---

#### `getGroup(id)`
指定IDのグループを取得する。

```javascript
/**
 * 指定IDのグループを取得
 * @param {string} id - グループID
 * @returns {TaskGroup|null} グループ、見つからない場合はnull
 */
getGroup(id)
```

---

#### `getAllGroups()`
全てのグループを取得する（order順にソート）。

```javascript
/**
 * 全てのグループを取得
 * @returns {TaskGroup[]} グループの配列
 */
getAllGroups()
```

---

#### `updateGroup(id, updates)`
グループを更新する。

```javascript
/**
 * グループを更新
 * @param {string} id - グループID
 * @param {Object} updates - 更新するフィールド
 * @returns {TaskGroup|null} 更新されたグループ、失敗時はnull
 */
updateGroup(id, updates)
```

---

#### `deleteGroup(id)`
グループを削除する（グループに属するタスクも削除）。

```javascript
/**
 * グループを削除
 * @param {string} id - グループID
 * @returns {boolean} 成功時true、失敗時false
 */
deleteGroup(id)
```

**注意**
- 最後のグループは削除できない
- グループに属するタスクも全て削除される

---

#### `setActiveGroup(id)`
アクティブグループを設定する。

```javascript
/**
 * アクティブグループを設定
 * @param {string} id - グループID
 * @returns {boolean} 成功時true、失敗時false
 */
setActiveGroup(id)
```

---

#### `getActiveGroup()`
現在のアクティブグループを取得する。

```javascript
/**
 * アクティブグループを取得
 * @returns {TaskGroup|null} アクティブグループ
 */
getActiveGroup()
```

---

#### `getTodosByGroup(groupId)`
指定グループに属するTODOを取得する。

```javascript
/**
 * グループに属するTODOを取得
 * @param {string} groupId - グループID
 * @returns {TodoItem[]} グループに属するTODOの配列
 */
getTodosByGroup(groupId)
```

---

## 3. ui.js - UI管理モジュール

DOM操作とユーザーインタラクションを管理。

### UIManager クラス

```javascript
class UIManager {
  constructor(todoManager)

  // 初期化
  init()
  bindEvents()

  // レンダリング
  render(skipAnimations)
  renderTodoList(skipAllAnimations)
  renderTodoItem(todo, level, skipAnimation)
  updateStats()

  // 完了状態の更新（部分更新）
  updateTodoItemVisualState(id, isCompleted)
  updateSubtaskProgress(id)
  showConfetti(element)

  // モーダル管理
  openTodoModal(todoId)
  closeTodoModal()

  // フィルター・ソート
  applyFilters()
  applySort()

  // サブタスク管理
  toggleCollapse(todoId)
  handleAddSubtask(parentId)
  showSubtaskWarningDialog(todoId, incompleteCount)
  closeSubtaskWarningDialog()

  // グループ管理
  renderGroupTabs()
  handleGroupSelect(groupId)
  handleGroupDelete(groupId)
  handleShowAll()
  openGroupModal(groupId)
  closeGroupModal()
  handleGroupFormSubmit()

  // ユーティリティ
  showConfirmDialog(message)
  showError(message)
}
```

### グループ管理メソッド

#### `renderGroupTabs()`
グループタブをレンダリングする。

```javascript
/**
 * グループタブをレンダリング
 */
renderGroupTabs()
```

---

#### `handleGroupSelect(groupId)`
グループ選択処理。

```javascript
/**
 * グループ選択処理
 * @param {string} groupId - 選択するグループID
 */
handleGroupSelect(groupId)
```

---

#### `handleGroupDelete(groupId)`
グループ削除処理（確認ダイアログ付き）。

```javascript
/**
 * グループ削除処理
 * @param {string} groupId - 削除するグループID
 */
handleGroupDelete(groupId)
```

---

#### `openGroupModal(groupId)`
グループモーダルを開く。

```javascript
/**
 * グループモーダルを開く
 * @param {string|null} groupId - 編集時はグループID、新規作成時はnull
 */
openGroupModal(groupId = null)
```

---

#### `closeGroupModal()`
グループモーダルを閉じる。

```javascript
/**
 * グループモーダルを閉じる
 */
closeGroupModal()
```

---

#### `handleGroupFormSubmit()`
グループフォーム送信処理。

```javascript
/**
 * グループフォーム送信処理
 */
handleGroupFormSubmit()
```

---

#### `handleShowAll()`
「すべて表示」ボタンのクリック処理。

```javascript
/**
 * 全グループのタスクを表示
 */
handleShowAll()
```

---

### 完了状態の更新メソッド（部分更新）

#### `updateTodoItemVisualState(id, isCompleted)`
タスクの視覚状態を直接更新する（全体再描画なし）。

```javascript
/**
 * TODOアイテムの視覚状態を更新
 * @param {string} id - TODO ID
 * @param {boolean} isCompleted - 完了状態
 */
updateTodoItemVisualState(id, isCompleted)
```

**動作**
- 完了時: 完了エフェクト + 紙吹雪を表示後、completedクラスを追加
- 未完了時: completedクラスを削除

---

#### `updateSubtaskProgress(id)`
サブタスク進捗表示を更新する。

```javascript
/**
 * サブタスク進捗表示を更新
 * @param {string} id - TODO ID
 */
updateSubtaskProgress(id)
```

---

#### `showConfetti(element)`
紙吹雪エフェクトを表示する。

```javascript
/**
 * 紙吹雪エフェクトを表示
 * @param {HTMLElement} element - 対象要素
 */
showConfetti(element)
```

**動作**
- 要素の位置から15個の紙吹雪を生成
- 1.5秒後に自動削除

---

### サブタスク管理メソッド

#### `toggleCollapse(todoId)`
サブタスクの展開/折りたたみを切り替える。

```javascript
/**
 * 展開/折りたたみを切り替え
 * @param {string} todoId - TODO ID
 */
toggleCollapse(todoId)
```

**動作**
- 状態をLocalStorageに保存
- UIを再描画

---

#### `handleAddSubtask(parentId)`
サブタスク追加処理を開始する。

```javascript
/**
 * サブタスク追加処理
 * @param {string} parentId - 親タスクID
 */
handleAddSubtask(parentId)
```

**動作**
- `addingSubtaskParentId`を設定
- TODOモーダルを「サブタスクを追加」モードで開く

---

#### `showSubtaskWarningDialog(todoId, incompleteCount)`
サブタスク警告ダイアログを表示する。

```javascript
/**
 * サブタスク警告ダイアログを表示
 * @param {string} todoId - 完了しようとしているTODO ID
 * @param {number} incompleteCount - 未完了サブタスクの数
 */
showSubtaskWarningDialog(todoId, incompleteCount)
```

---

#### `closeSubtaskWarningDialog()`
サブタスク警告ダイアログを閉じる。

```javascript
/**
 * サブタスク警告ダイアログを閉じる
 */
closeSubtaskWarningDialog()
```

---

### タグ管理メソッド

#### `getTags()`
設定からタグ一覧を取得する。

```javascript
/**
 * タグ一覧を取得
 * @returns {string[]} タグ名の配列
 */
getTags()
```

---

#### `saveTagsToSettings(tags)`
タグ一覧を設定に保存する。

```javascript
/**
 * タグ一覧を設定に保存
 * @param {string[]} tags - タグ名の配列
 */
saveTagsToSettings(tags)
```

---

#### `getTagUsageCount(tagName)`
指定タグの使用数を取得する。

```javascript
/**
 * タグの使用数を取得
 * @param {string} tagName - タグ名
 * @returns {number} 使用しているタスク数
 */
getTagUsageCount(tagName)
```

---

#### `renderTagFilter()`
サイドバーのタグフィルターを描画する。

```javascript
/**
 * タグフィルターをレンダリング
 */
renderTagFilter()
```

**動作**
- チェックボックス形式のタグ一覧を表示
- 各タグに使用数を表示

---

#### `handleTagFilterChange()`
タグフィルター変更時の処理。

```javascript
/**
 * タグフィルター変更処理
 */
handleTagFilterChange()
```

---

#### `openTagModal()`
タグ管理モーダルを開く。

```javascript
/**
 * タグ管理モーダルを開く
 */
openTagModal()
```

---

#### `closeTagModal()`
タグ管理モーダルを閉じる。

```javascript
/**
 * タグ管理モーダルを閉じる
 */
closeTagModal()
```

---

#### `renderTagManageList()`
タグ管理一覧を描画する。

```javascript
/**
 * タグ管理一覧をレンダリング
 */
renderTagManageList()
```

**動作**
- 既存タグの一覧を表示
- 各タグに使用数、編集ボタン、削除ボタンを表示

---

#### `addNewTagFromManageModal()`
タグ管理モーダルから新規タグを追加する。

```javascript
/**
 * 管理モーダルから新規タグを追加
 */
addNewTagFromManageModal()
```

---

#### `addNewTagInline()`
TODOモーダル内のインライン入力から新規タグを追加する。

```javascript
/**
 * インラインで新規タグを追加
 */
addNewTagInline()
```

---

#### `openTagEditModal(tagName)`
タグ編集モーダルを開く。

```javascript
/**
 * タグ編集モーダルを開く
 * @param {string} tagName - 編集するタグ名
 */
openTagEditModal(tagName)
```

---

#### `closeTagEditModal()`
タグ編集モーダルを閉じる。

```javascript
/**
 * タグ編集モーダルを閉じる
 */
closeTagEditModal()
```

---

#### `saveTagEdit()`
タグの編集を保存する。

```javascript
/**
 * タグ編集を保存
 */
saveTagEdit()
```

**動作**
- 設定内のタグ名を更新
- 全タスクのタグ名を一括更新

---

#### `handleDeleteTag(tagName)`
タグを削除する。

```javascript
/**
 * タグを削除
 * @param {string} tagName - 削除するタグ名
 */
handleDeleteTag(tagName)
```

**動作**
- 確認ダイアログを表示
- 設定からタグを削除
- 全タスクからタグを削除

---

#### `renderTodoTagsCheckboxes(selectedTags)`
TODOモーダル内のタグチェックボックスを描画する。

```javascript
/**
 * モーダル内タグチェックボックスをレンダリング
 * @param {string[]} selectedTags - 選択済みのタグ配列
 */
renderTodoTagsCheckboxes(selectedTags)
```

---

#### `getSelectedTagsFromModal()`
TODOモーダルから選択されたタグを取得する。

```javascript
/**
 * モーダルから選択タグを取得
 * @returns {string[]} 選択されたタグの配列
 */
getSelectedTagsFromModal()
```

---

## 4. app.js - アプリケーション統合モジュール

```javascript
class App {
  constructor()
  init()
  migrateDataIfNeeded()
  initTheme()
  applyTheme(theme)
  checkScheduledRecurrences()
  onAppReady()
}
```

### メソッド詳細

#### `init()`
アプリケーションを初期化する。

```javascript
/**
 * アプリケーション初期化
 */
init()
```

**動作**
1. データマイグレーションを実行
2. 設定を読み込み
3. TodoManagerを初期化
4. UIManagerを初期化
5. テーマを初期化
6. 繰り返しタスクのスケジュールチェック

---

#### `migrateDataIfNeeded()`
データマイグレーションを実行する。

```javascript
/**
 * データマイグレーション
 * カテゴリをタグに統合するマイグレーション処理
 */
migrateDataIfNeeded()
```

**動作**
- 設定の`categories`を`tags`に統合
- 設定の`filters.selectedCategory`を`filters.selectedTags`に統合
- タスクの`category`フィールドを`tags`配列に統合

---

#### `initTheme()`
テーマを初期化する。

```javascript
/**
 * テーマの初期化
 */
initTheme()
```

**動作**
- 保存されたテーマ設定を読み込み
- システム設定（prefers-color-scheme）を検出
- テーマを適用
- テーマ切り替えボタンのイベントを設定

---

#### `applyTheme(theme)`
テーマを適用する。

```javascript
/**
 * テーマを適用
 * @param {string} theme - テーマ ('light' または 'dark')
 */
applyTheme(theme)
```

---

#### `checkScheduledRecurrences()`
繰り返しタスクのスケジュールチェックを実行する。

```javascript
/**
 * 繰り返しタスクのスケジュールチェック
 */
checkScheduledRecurrences()
```

**動作**
- 「期限になったら生成」設定のタスクを確認
- 必要に応じて新規タスクを生成
- UIを再描画

---

## 5. ユーティリティ関数

### 日付関連

```javascript
/**
 * 次の期限日を計算
 * @param {Date} currentDate - 現在の日付
 * @param {RecurrenceSettings} recurrence - 繰り返し設定
 * @returns {Date} 次の期限日
 */
function calculateNextDueDate(currentDate, recurrence)
```

```javascript
/**
 * 指定曜日の次の日付を取得
 * @param {Date} currentDate - 現在の日付
 * @param {number[]} weekdays - 曜日配列 (0-6)
 * @returns {Date} 次の該当曜日の日付
 */
function getNextWeekday(currentDate, weekdays)
```

### ID生成

```javascript
/**
 * ユニークIDを生成
 * @returns {string} ユニークID
 */
function generateId()
```

実装例:
```javascript
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

---

## 6. エラーハンドリング

各関数は以下のエラーハンドリングを実装する必要があります：

1. **バリデーションエラー**: 不正な入力データ
2. **存在しないデータエラー**: 指定IDのTODOが見つからない
3. **循環参照エラー**: サブタスクで循環参照が発生
4. **ストレージエラー**: LocalStorage の容量超過、アクセス拒否

エラー時の挙動:
- 関数は `null` または `false` を返す
- コンソールにエラーログを出力
- UIにエラーメッセージを表示（ui.jsの`showError`）
