# データモデル定義

このドキュメントでは、TODOリストアプリで使用する全てのデータ構造を定義します。

## 型定義の表記法

TypeScript風の型定義を使用して、各フィールドの型を明示します。

```typescript
// 型定義の読み方:
string          // 文字列
number          // 数値
boolean         // 真偽値
string[]        // 文字列配列
Type | null     // Typeまたはnull
Type?           // オプショナル（省略可能）
```

---

## 1. TODOアイテム (TodoItem)

メインのTODOデータ構造。

### 型定義

```typescript
interface TodoItem {
  // 基本フィールド
  id: string;                    // ユニークID (例: "1704067200000-abc123")
  title: string;                 // TODOタイトル（必須、最大100文字）
  description: string;           // 詳細説明（オプション、最大500文字）
  completed: boolean;            // 完了状態

  // 分類フィールド
  tags: string[];                // タグ配列（複数可）（例: ["仕事", "緊急", "重要"]）
  priority: 'high' | 'medium' | 'low';  // 優先度

  // 日時フィールド
  dueDate: string | null;        // 期限（ISO 8601形式）（例: "2025-01-01T09:00:00.000Z"）
  createdAt: string;             // 作成日時（ISO 8601形式）
  updatedAt: string;             // 更新日時（ISO 8601形式）

  // サブタスク関連
  parentId: string | null;       // 親タスクのID（ルートの場合はnull）
  subtaskIds: string[];          // 子タスクのID配列

  // 繰り返しタスク関連
  recurrence: RecurrenceSettings | null;  // 繰り返し設定（nullの場合は通常のタスク）

  // グループ関連
  groupId: string;               // 所属するグループのID
}
```

### フィールド詳細

#### id (string)
- ユニークID
- 生成方法: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
- 例: `"1704067200000-abc123xyz"`

#### title (string)
- TODOのタイトル（必須）
- バリデーション:
  - 1文字以上、100文字以下
  - 前後の空白は自動削除

#### description (string)
- 詳細説明（オプション）
- 最大500文字
- 改行対応

#### completed (boolean)
- `true`: 完了
- `false`: 未完了
- デフォルト: `false`

#### tags (string[])
- タグの配列（複数選択可能）
- 空配列 `[]` の場合はタグなし
- タスクの分類やフィルタリングに使用
- 例: `["仕事", "重要", "緊急"]`

#### priority ('high' | 'medium' | 'low')
- `'high'`: 高優先度（赤色表示）
- `'medium'`: 中優先度（黄色表示）
- `'low'`: 低優先度（緑色表示）
- デフォルト: `'medium'`

#### dueDate (string | null)
- 期限日時（ISO 8601形式）
- `null`の場合は期限なし
- 例: `"2025-12-31T23:59:59.000Z"`
- 期限の状態判定:
  - 期限切れ: `dueDate < 現在時刻`
  - 今日が期限: 期限日が今日
  - 明日が期限: 期限日が明日

#### createdAt / updatedAt (string)
- ISO 8601形式の日時文字列
- 例: `"2025-01-01T09:00:00.000Z"`
- createdAt: タスク作成時に設定、以降変更なし
- updatedAt: タスク更新時に自動更新

#### parentId (string | null)
- 親タスクのID
- `null`の場合はルートタスク（親がいない）
- サブタスクの場合は親のIDを持つ

#### subtaskIds (string[])
- 子タスクのID配列
- 空配列 `[]` の場合は子タスクなし
- 階層構造: ルート → 子 → 孫 → ...（無制限）

#### groupId (string)
- 所属するグループのID
- 必須フィールド
- タスク作成時に現在選択中のグループIDが設定される

---

## 2. 繰り返し設定 (RecurrenceSettings)

繰り返しタスクの設定を管理する構造。

### 型定義

```typescript
interface RecurrenceSettings {
  enabled: boolean;                    // 繰り返し機能の有効/無効
  type: RecurrenceType;                // 繰り返しタイプ
  interval: number;                    // カスタム間隔（typeがcustomの場合のみ使用）
  weekdays: number[];                  // 曜日指定（typeがweekdaysの場合のみ使用）
  endCondition: EndCondition;          // 終了条件
  completionBehavior: CompletionBehavior;  // 完了時の挙動
  originalTaskId: string | null;       // 元の繰り返しタスクのID
  completedCount: number;              // 完了回数
}

type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'custom' | 'weekdays';

type CompletionBehavior = 'createNext' | 'createOnDue' | 'reset';

interface EndCondition {
  type: 'never' | 'count' | 'date';
  count: number | null;                // type='count'の場合の繰り返し回数
  endDate: string | null;              // type='date'の場合の終了日
}
```

### フィールド詳細

#### enabled (boolean)
- `true`: 繰り返し機能が有効
- `false`: 繰り返し機能が無効（通常のタスク）

#### type (RecurrenceType)
- `'daily'`: 毎日繰り返し
- `'weekly'`: 毎週繰り返し（7日ごと）
- `'monthly'`: 毎月繰り返し
- `'custom'`: カスタム間隔（intervalと組み合わせ）
- `'weekdays'`: 特定の曜日に繰り返し（weekdaysと組み合わせ）

#### interval (number)
- `type='custom'`の場合に使用
- 繰り返し間隔の数値
- 例:
  - `interval: 2` かつ `type='custom'` → 2日ごと
  - `interval: 3` → 3日/週/月ごと（typeに応じて解釈）

#### weekdays (number[])
- `type='weekdays'`の場合に使用
- 曜日を数値で指定: `[0-6]`
  - `0`: 日曜日
  - `1`: 月曜日
  - `2`: 火曜日
  - `3`: 水曜日
  - `4`: 木曜日
  - `5`: 金曜日
  - `6`: 土曜日
- 例:
  - `[1, 3, 5]`: 毎週月・水・金
  - `[1, 2, 3, 4, 5]`: 平日のみ

#### endCondition (EndCondition)

**endCondition.type**
- `'never'`: 無期限で繰り返し
- `'count'`: 指定回数で終了
- `'date'`: 指定日付まで繰り返し

**endCondition.count (number | null)**
- `type='count'`の場合の繰り返し回数
- 例: `5` → 5回繰り返したら終了

**endCondition.endDate (string | null)**
- `type='date'`の場合の終了日（ISO 8601形式）
- 例: `"2025-12-31T23:59:59.000Z"` → この日まで繰り返し

#### completionBehavior (CompletionBehavior)
タスクを完了したときの挙動:

- `'createNext'`: 完了時に次回分のタスクを即座に生成
  - 使用例: 日々のルーティンタスク（完了したら次が欲しい）

- `'createOnDue'`: 次回の期限になったら自動生成
  - 使用例: 定期的なレビュータスク（期限が来たら出現）

- `'reset'`: タスク自体は残し、完了状態のみリセット
  - 使用例: 毎日チェックするタスク（同じタスクを使い回す）

#### originalTaskId (string | null)
- 元の繰り返しタスクのID
- 自動生成されたタスクの場合: 生成元のタスクIDを保持
- 元のタスクの場合: `null`

#### completedCount (number)
- これまでに完了した回数
- 終了条件 `type='count'` のチェックに使用
- 完了するたびにインクリメント

---

## 3. アプリケーション設定 (AppSettings)

カテゴリ、タグ、テーマなどのアプリケーション全体の設定。

### 型定義

```typescript
interface AppSettings {
  tags: string[];                // タグリスト
  theme: 'light' | 'dark';       // テーマ設定
  sortBy: SortField;             // ソート基準
  sortOrder: 'asc' | 'desc';     // ソート順
  filters: FilterSettings;       // フィルター設定
}

type SortField = 'createdAt' | 'dueDate' | 'priority' | 'title';

interface FilterSettings {
  selectedTags: string[];            // 選択中のタグ（OR条件でフィルタリング）
  selectedPriorities: ('high' | 'medium' | 'low')[];  // 選択中の優先度
  showCompleted: boolean;            // 完了タスクを表示するか
}
```

### フィールド詳細

#### tags (string[])
- ユーザーが作成したタグのリスト
- サイドバーで管理（追加・編集・削除可能）
- タスクへの割り当てやフィルタリングに使用
- 例: `["仕事", "個人", "重要", "緊急"]`

#### theme ('light' | 'dark')
- `'light'`: ライトモード
- `'dark'`: ダークモード
- デフォルト: システム設定に従う（`prefers-color-scheme`）

#### sortBy (SortField)
- `'createdAt'`: 作成日時順
- `'dueDate'`: 期限順
- `'priority'`: 優先度順
- `'title'`: タイトル順（アルファベット順）

#### sortOrder ('asc' | 'desc')
- `'asc'`: 昇順
- `'desc'`: 降順

#### filters (FilterSettings)
現在のフィルター状態を保持。

---

## 4. タスクグループ (TaskGroup)

タスクをグループ分けするための構造。タブUIで表示される。

### 型定義

```typescript
interface TaskGroup {
  id: string;                    // ユニークID
  name: string;                  // グループ名（最大30文字）
  order: number;                 // 表示順序（0から始まる）
  createdAt: string;             // 作成日時（ISO 8601形式）
}
```

### フィールド詳細

#### id (string)
- ユニークID
- 生成方法: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

#### name (string)
- グループ名（必須）
- バリデーション: 1文字以上、30文字以下

#### order (number)
- タブの表示順序
- 0から始まる連番
- ドラッグ&ドロップで並び替え可能（将来実装）

#### createdAt (string)
- ISO 8601形式の日時文字列
- グループ作成時に設定

### データ例

```json
{
  "id": "group-1704067200000-abc123",
  "name": "仕事",
  "order": 0,
  "createdAt": "2025-01-01T09:00:00.000Z"
}
```

---

## 5. LocalStorageキー定義

LocalStorageに保存するデータのキー名。

```typescript
const STORAGE_KEYS = {
  TODOS: 'todoapp_todos',              // TodoItem[]
  SETTINGS: 'todoapp_settings',        // AppSettings
  COLLAPSE_STATE: 'todoapp_collapse',  // Record<string, boolean> (タスクIDと展開状態)
  GROUPS: 'todoapp_groups',            // TaskGroup[]
  ACTIVE_GROUP: 'todoapp_active_group' // string (現在選択中のグループID)
};
```

---

## 6. データ例

### 通常のTODOアイテム

```json
{
  "id": "1704067200000-abc123",
  "title": "プロジェクトの企画書を作成",
  "description": "来週の会議で使用する企画書を作成する",
  "completed": false,
  "tags": ["仕事", "重要", "緊急"],
  "priority": "high",
  "dueDate": "2025-01-10T17:00:00.000Z",
  "createdAt": "2025-01-01T09:00:00.000Z",
  "updatedAt": "2025-01-01T09:00:00.000Z",
  "parentId": null,
  "subtaskIds": [],
  "recurrence": null,
  "groupId": "group-1704067200000-abc123"
}
```

### サブタスク付きTODO

```json
{
  "id": "parent-001",
  "title": "Webサイトをリニューアル",
  "description": "会社のWebサイトを全面リニューアルする",
  "completed": false,
  "tags": ["仕事", "プロジェクト"],
  "priority": "high",
  "dueDate": "2025-03-31T23:59:59.000Z",
  "createdAt": "2025-01-01T09:00:00.000Z",
  "updatedAt": "2025-01-01T09:00:00.000Z",
  "parentId": null,
  "subtaskIds": ["child-001", "child-002", "child-003"],
  "recurrence": null,
  "groupId": "group-1704067200000-work"
}
```

```json
{
  "id": "child-001",
  "title": "デザインカンプ作成",
  "description": "Figmaでデザインカンプを作成",
  "completed": true,
  "tags": ["仕事", "デザイン"],
  "priority": "medium",
  "dueDate": "2025-01-31T23:59:59.000Z",
  "createdAt": "2025-01-01T10:00:00.000Z",
  "updatedAt": "2025-01-15T14:30:00.000Z",
  "parentId": "parent-001",
  "subtaskIds": [],
  "recurrence": null,
  "groupId": "group-1704067200000-work"
}
```

### 繰り返しTODO（毎日）

```json
{
  "id": "recurring-daily-001",
  "title": "朝のストレッチ",
  "description": "毎朝10分間ストレッチをする",
  "completed": false,
  "tags": ["健康", "習慣"],
  "priority": "medium",
  "dueDate": "2025-01-02T08:00:00.000Z",
  "createdAt": "2025-01-01T07:00:00.000Z",
  "updatedAt": "2025-01-01T07:00:00.000Z",
  "parentId": null,
  "subtaskIds": [],
  "recurrence": {
    "enabled": true,
    "type": "daily",
    "interval": 1,
    "weekdays": [],
    "endCondition": {
      "type": "never",
      "count": null,
      "endDate": null
    },
    "completionBehavior": "createNext",
    "originalTaskId": null,
    "completedCount": 0
  },
  "groupId": "group-1704067200000-health"
}
```

### 繰り返しTODO（曜日指定）

```json
{
  "id": "recurring-weekdays-001",
  "title": "ジムでトレーニング",
  "description": "月・水・金にジムでトレーニング",
  "completed": false,
  "tags": ["健康", "運動"],
  "priority": "medium",
  "dueDate": "2025-01-06T19:00:00.000Z",
  "createdAt": "2025-01-01T09:00:00.000Z",
  "updatedAt": "2025-01-01T09:00:00.000Z",
  "parentId": null,
  "subtaskIds": [],
  "recurrence": {
    "enabled": true,
    "type": "weekdays",
    "interval": 1,
    "weekdays": [1, 3, 5],
    "endCondition": {
      "type": "count",
      "count": 24,
      "endDate": null
    },
    "completionBehavior": "createNext",
    "originalTaskId": null,
    "completedCount": 0
  },
  "groupId": "group-1704067200000-health"
}
```

---

## 7. バリデーションルール

### TodoItem

| フィールド | ルール |
|-----------|--------|
| title | 必須、1-100文字 |
| description | 最大500文字 |
| tags | 有効なタグ名の配列 |
| priority | 'high' \| 'medium' \| 'low' のいずれか |
| dueDate | 有効なISO 8601形式 or null |
| parentId | 存在するタスクID or null、循環参照禁止 |
| groupId | 存在するグループID、必須 |

### TaskGroup

| フィールド | ルール |
|-----------|--------|
| name | 必須、1-30文字 |
| order | 0以上の整数 |

### RecurrenceSettings

| フィールド | ルール |
|-----------|--------|
| interval | 1以上の整数 |
| weekdays | 0-6の配列、重複なし |
| endCondition.count | 1以上の整数 or null |
| endCondition.endDate | 有効なISO 8601形式 or null |

---

## 8. データ移行・拡張性

### 将来的なフィールド追加（コメントアウトで残す）

```javascript
// 将来の拡張用フィールド（現在は未使用）
// userId: string;           // ユーザーID（認証機能追加時）
// sharedWith: string[];     // 共有ユーザー（コラボレーション機能）
// attachments: Attachment[]; // 添付ファイル
```

### バージョン管理

データモデルにバージョン番号を含めることで、将来的な移行を容易にする。

```typescript
interface AppData {
  version: string;          // データモデルのバージョン（例: "1.0.0"）
  todos: TodoItem[];
  settings: AppSettings;
}
```
