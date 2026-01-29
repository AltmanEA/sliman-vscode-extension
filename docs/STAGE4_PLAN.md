# Stage 4: Course Explorer (Tree View)

**Status:** Planning  
**Last Updated:** January 2025  
**Dependencies:** Stage 1-3 (CourseManager, LectureManager, BuildManager, Commands)

---

## Overview

Stage 4 реализует Course Explorer — древовидное представление структуры курса в боковой панели VS Code. Это обеспечивает:
- Визуальную навигацию по структуре курса
- Быстрый доступ к лекциям и действиям
- Контекстные команды для выбранных элементов
- Real-time обновление при изменении структуры курса

---

## Структура файлов

```
src/
├── providers/
│   ├── CourseExplorer.ts      # TreeView provider + data models
│   └── CourseExplorerDataProvider.ts # Data provider interface
└── test/
    └── suite/
        └── courseExplorer.test.ts # Тесты Tree View
```

---

## Компоненты Stage 4

### 4.1 CourseExplorerDataProvider

**Файл:** `src/providers/CourseExplorerDataProvider.ts`

**Интерфейс:**
```typescript
/**
 * Data provider interface for course tree data
 */
export interface CourseTreeItem {
  /** Unique identifier for the tree item */
  id: string;
  /** Display label */
  label: string;
  /** Tree item type: 'root', 'lecture', 'action' */
  type: 'root' | 'lecture' | 'action';
  /** Icon name (codicons) */
  icon?: string;
  /** Command to execute on click */
  command?: vscode.Command;
  /** Child items (for root and action nodes) */
  children?: CourseTreeItem[];
  /** Collapsible state */
  collapsible?: vscode.TreeItemCollapsibleState;
}

/**
 * Data provider for Course Explorer tree view
 */
export class CourseExplorerDataProvider implements vscode.TreeDataProvider<CourseTreeItem> {
  // Методы интерфейса TreeDataProvider
}
```

**Методы:**
| Метод | Описание |
|-------|----------|
| `getTreeItem(element)` | Возвращает TreeItem для элемента |
| `getChildren(element?)` | Возвращает дочерние элементы |
| `getParent(element)` | Возвращает родительский элемент |
| `refresh()` | Обновляет дерево |
| `dispose()` | Освобождает ресурсы |

**Структура дерева:**
```
📁 Course: <course_name>
├── 📂 Lectures
│   ├── 📄 about — "About the Subject"
│   └── 📄 mongo — "MongoDB"
└── 🔧 Actions
    ├── 🏗️ Build course
    └── 📦 Setup GitHub Pages
```

---

### 4.2 CourseExplorer

**Файл:** `src/providers/CourseExplorer.ts`

**Класс CourseExplorer:**
```typescript
/**
 * Course Explorer manages the Tree View for course structure
 */
export class CourseExplorer {
  /** Tree view instance */
  private readonly treeView: vscode.TreeView<CourseTreeItem>;
  /** Data provider instance */
  private readonly dataProvider: CourseExplorerDataProvider;
  /** Context for extension */
  private readonly context: vscode.ExtensionContext;
  
  /**
   * Creates a new CourseExplorer instance
   * @param context - VS Code extension context
   */
  constructor(context: vscode.ExtensionContext);
  
  /** Initializes tree view and registers commands */
  initialize(): void;
  
  /** Refreshes tree view with current course data */
  refresh(): void;
  
  /** Disposes tree view and releases resources */
  dispose(): void;
}
```

**События:**
| Событие | Описание |
|---------|----------|
| `onDidChangeTreeData` | Уведомление об изменении данных |
| `onDidChangeSelection` | Изменение выбора пользователя |

---

### 4.3 Интеграция с extension.ts

**Изменения в `src/extension.ts`:**

```typescript
import { CourseExplorer } from './providers/CourseExplorer';

// В функции activate():
const courseExplorer = new CourseExplorer(context);
courseExplorer.initialize();

// В функции deactivate():
courseExplorer.dispose();
```

---

### 4.4 Конфигурация package.json

**Добавление в `contributes`:**

```json
{
  "viewsContainers": {
    "activitybar": [{
      "id": "sliman-course-view",
      "title": "Course",
      "icon": "resources/icon.svg"
    }]
  },
  "views": {
    "sliman-course-view": [{
      "name": "courseExplorer",
      "type": "tree"
    }]
  },
  "menus": {
    "view/title": [{
      "command": "courseExplorer.refresh",
      "group": "navigation"
    }]
  }
}
```

---

## Tree View Структура

### 4.1.1 Корневой узел (Course Root)

```
📁 <course_name>
├── 📂 Lectures
│   └── [список лекций]
└── 🔧 Actions
    └── [список действий]
```

**Свойства:**
- `id`: `course-root`
- `label`: Название курса из `sliman.json`
- `type`: `root`
- `icon`: `$(remote` — иконка папки/проекта

### 4.1.2 Узел Lectures

```
📂 Lectures
├── 📄 lecture-1 — "Title 1"
└── 📄 lecture-2 — "Title 2"
```

**Свойства:**
- `id`: `lectures`
- `label`: `Lectures`
- `type`: `folder`
- `collapsible`: `vscode.TreeItemCollapsibleState.Collapsed`

### 4.1.3 Элемент лекции

```
📄 about — "About the Subject"
```

**Свойства:**
- `id`: `lecture-{name}`
- `label`: `{title} ({name})`
- `type`: `lecture`
- `icon`: `$(file-code` — иконка файла кода
- `command`: Открывает slides.md при клике
- `contextValue`: `lecture` для фильтрации в меню

**Command:** `sliman.openSlides` с параметром `{name}`

### 4.1.4 Узел Actions

```
🔧 Actions
├── 🏗️ Build course
└── 📦 Setup GitHub Pages
```

**Свойства:**
- `id`: `actions`
- `label`: `Actions`
- `type`: `action`
- `collapsible`: `vscode.TreeItemCollapsibleState.None`

### 4.1.5 Элемент действия

```
🏗️ Build course
```

**Свойства:**
- `id`: `action-{command}`
- `label`: Отображаемое название
- `type`: `action`
- `icon`: Иконка действия
- `command`: Соответствующая команда

**Доступные действия:**
| ID | Команда | Иконка | Описание |
|----|---------|--------|----------|
| build-course | `sliman.buildCourse` | `$(tools)` | Собрать весь курс |
| setup-pages | `sliman.setupPages` | `$(cloud)` | Настроить GitHub Pages |

---

## Методы CourseManager для Tree View

**Новые методы в `CourseManager`:**

| Метод | Возвращает | Описание |
|-------|------------|----------|
| `getCourseName(): string` | Название курса из sliman.json |
| `getLectures(): Promise<LectureTreeItem[]>` | Список лекций для дерева |

**LectureTreeItem интерфейс:**
```typescript
interface LectureTreeItem {
  name: string;
  title: string;
  uri: vscode.Uri;
}
```

---

## События и обновление

### 4.5.1 Когда обновлять Tree View

| Событие | Триггер | Действие |
|---------|---------|----------|
| Добавлена лекция | `addLecture()` завершён | `treeView.refresh()` |
| Изменён sliman.json | Файл записан | `treeView.refresh()` |
| Пересканирован курс | `scanCourse()` завершён | `treeView.refresh()` |

### 4.5.2 Интеграция с существующими командами

**Изменения в `commands.ts`:**

```typescript
// После успешного выполнения команд:
import { managersContainer } from './managers/ManagersContainer';

// В createCourse():
managersContainer.refreshCourseExplorer();

// В addLecture():
managersContainer.refreshCourseExplorer();

// В scanCourse():
managersContainer.refreshCourseExplorer();
```

**Обновление `ManagersContainer`:**

```typescript
interface IManagersContainer {
  refreshCourseExplorer(): void;
}

// Реализация:
private courseExplorer: CourseExplorer | null = null;

refreshCourseExplorer(): void {
  this.courseExplorer?.refresh();
}
```

---

## Тесты Stage 4

**Файл:** `src/test/suite/courseExplorer.test.ts`

| Тест | Описание |
|------|----------|
| `CourseExplorer: initializes correctly` | Проверяет создание Tree View |
| `CourseExplorer: displays course name` | Отображает название курса |
| `CourseExplorer: shows lectures folder` | Показывает папку Lectures |
| `CourseExplorer: lists lectures` | Отображает список лекций |
| `CourseExplorer: shows actions folder` | Показывает папку Actions |
| `CourseExplorer: displays actions` | Отображает действия |
| `CourseExplorer: refresh triggers update` | Обновление работает |

**Mock данные:**
```typescript
// Мок CourseManager для тестов
const mockCourseManager = {
  getCourseName: () => 'Test Course',
  getLectureDirectories: () => ['lecture-1', 'lecture-2'],
  readSlidesJson: () => ({
    slides: [
      { name: 'lecture-1', title: 'Lecture 1' },
      { name: 'lecture-2', title: 'Lecture 2' }
    ]
  })
};
```

---

## Иконки (Codicons)

| Элемент | Codicon | Применение |
|---------|---------|------------|
| Course root | `$(remote)` | Корневой узел курса |
| Lectures | `$(files` | Папка лекций |
| Lecture | `$(file-code)` | Элемент лекции |
| Actions | `$(gear)` | Папка действий |
| Build | `$(tools)` | Действие Build course |
| Pages | `$(cloud)` | Действие Setup GitHub Pages |

---

## Контекстные меню (опционально)

**Для расширения функциональности в Stage 5:**

```json
"menus": {
  "treeView/context": [{
    "when": "view == courseExplorer && viewItem == lecture",
    "command": "sliman.runLecture",
    "group": "navigation"
  }, {
    "when": "view == courseExplorer && viewItem == lecture",
    "command": "sliman.buildLecture",
    "group": "navigation"
  }]
}
```

---

## План реализации

### Неделя 1: Основная инфраструктура

| День | Задача | Файл |
|------|--------|------|
| 1 | Создать CourseTreeItem интерфейс | `src/types/courseExplorer.ts` |
| 2 | Реализовать CourseExplorerDataProvider | `src/providers/CourseExplorerDataProvider.ts` |
| 3 | Реализовать CourseExplorer | `src/providers/CourseExplorer.ts` |
| 4 | Интегрировать в extension.ts | `src/extension.ts` |
| 5 | Обновить package.json | `package.json` |

### Неделя 2: Тесты и доработки

| День | Задача | Файл |
|------|--------|------|
| 1 | Написать unit-тесты | `src/test/suite/courseExplorer.test.ts` |
| 2 | Интегрировать refresh в команды | `src/commands.ts` |
| 3 | Обновить ManagersContainer | `src/managers/ManagersContainer.ts` |
| 4 | Финальное тестирование | Все файлы |
| 5 | Документация | `KODA.md` |

---

## Зависимости

| Компонент | Зависит от | Описание |
|-----------|------------|----------|
| CourseExplorerDataProvider | CourseManager | Чтение структуры курса |
| CourseExplorer | DataProvider | Инициализация TreeView |
| extension.ts | CourseExplorer | Регистрация TreeView |
| commands.ts | ManagersContainer.refresh() | Обновление при изменениях |

---

## Критерии приёмки

- [ ] Tree View отображает название курса
- [ ] Tree View показывает все лекции с названиями
- [ ] Tree View показывает Actions с доступными действиями
- [ ] Клик по лекции открывает slides.md
- [ ] Tree View обновляется после addLecture
- [ ] Tree View обновляется после scanCourse
- [ ] Все тесты проходят (pnpm run test)
- [ ] Линтинг без ошибок (pnpm run lint:check)

---

## Следующие шаги

1. Реализовать `src/types/courseExplorer.ts`
2. Реализовать `src/providers/CourseExplorerDataProvider.ts`
3. Реализовать `src/providers/CourseExplorer.ts`
4. Обновить `src/extension.ts`
5. Обновить `src/managers/ManagersContainer.ts`
6. Обновить `src/commands.ts` (refresh after changes)
7. Обновить `package.json`
8. Написать тесты `src/test/suite/courseExplorer.test.ts`
9. Запустить тесты и линтинг
10. Обновить документацию

---

## Оценка工作量

| Задача | Сложность | Время |
|--------|-----------|-------|
| CourseExplorerDataProvider | Medium | 4 часа |
| CourseExplorer | Medium | 4 часа |
| Интеграция в extension.ts | Low | 1 час |
| Обновление ManagersContainer | Low | 1 час |
| Обновление commands.ts | Low | 1 час |
| package.json конфигурация | Low | 30 мин |
| Тесты | Medium | 4 часа |
| **Итого** | — | **~16 часов** |