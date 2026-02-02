PS> Set-Content -Path "C:\projects\sliman-vscode-extension\KODA.md" -Value "# KODA.md — Инструкции для VS Code Extension проекта (ОБНОВЛЕНО)

## Обзор проекта

**Название:** sli.dev Course Manager  
**Версия:** 0.0.1  
**Назначение:** VS Code расширение для управления учебными курсами, созданными с использованием фреймворка sli.dev (Slidev)

---

## Основные технологии

| Технология | Версия | Назначение |
|------------|--------|------------|
| TypeScript | ^5.3.3 | Основной язык разработки |
| VS Code API | ^1.85.0 | Целевая платформа расширения |
| Node.js | ^18.18.0 | Среда выполнения |
| ESLint | ^9.0.0 | Линтинг кода (flat config) |
| Mocha | ^10.0.0 | Фреймворк тестирования |
| @vscode/test-electron | ^2.5.2 | Тестирование VS Code расширений |

---

## Структура проекта

src/                          # Исходный код расширения
├── extension.ts              # Точка входа расширения (активация/деактивация)
├── constants.ts              # Константы (пути, имена файлов, ключи конфигурации)
├── types/
│   ├── index.ts              # Базовые типы (SlimanConfig, LectureInfo, etc.)
│   └── courseExplorer.ts     # Типы для Course Explorer
├── managers/
│   ├── ManagersContainer.ts  # Singleton-контейнер для менеджеров
│   ├── CourseManager.ts      # Управление конфигурацией курса
│   ├── LectureManager.ts     # Создание и управление лекциями
│   └── BuildManager.ts       # Сборка лекций и курса
├── utils/
│   ├── process.ts            # Утилита для выполнения shell-команд
│   └── translit.ts           # Транслитерация кириллицы в латиницу
├── providers/
│   ├── CourseExplorer.ts     # Tree View менеджер
│   └── CourseExplorerDataProvider.ts # Tree Data Provider
├── commands.ts               # Регистрация и реализация команд
└── test/
    ├── utils/                # Утилиты для тестов
    │   ├── testWorkspace.ts  # Унификация работы с test-workspace
    │   └── courseStructure.ts    # Утилиты для структуры курса
    └── suite/
        ├── buildManager.test.ts    # Тесты BuildManager
        ├── courseManager.test.ts  # Тесты CourseManager
        ├── lectureManager.test.ts  # Тесты LectureManager
        └── managersContainer.test.ts # Тесты ManagersContainer

template/                     # Шаблоны для создания курсов
├── slides.md                 # Шаблон лекции
├── index.html                # Шаблон главной страницы курса
├── package.json              # Шаблон package.json для лекций
├── static.yml                # GitHub Actions workflow для GitHub Pages
├── Courser.vue               # Vue компонент курса
└── global-top.vue            # Глобальный компонент верхней панели

test-workspace/               # Рабочее пространство для тестов
package.json                  # Конфигурация расширения VS Code
tsconfig.json                 # Конфигурация TypeScript
eslint.config.mjs             # Конфигурация ESLint (flat config)
.vscode-test.js               # Конфигурация тестов VS Code

---

## Сборка и запуск

### Основные команды

# Компиляция TypeScript в JavaScript
pnpm run compile

# Компиляция в режиме отслеживания изменений (watch)
pnpm run watch

# Линтинг с автоисправлением ошибок
pnpm run lint

# Проверка линтером без внесения изменений
pnpm run lint:check

# Запуск тестов определённой категории
pnpm run test:course          # Тесты CourseManager
pnpm run test:commands        # Тесты команд
pnpm run test:lecture         # Тесты LectureManager
pnpm run test:process         # Тесты ProcessHelper
pnpm run test:build           # Тесты BuildManager
pnpm run test:translit        # Тесты транслитерации
pnpm run test:extension       # Тесты точки входа
pnpm run test:courseExplorer   # Тесты Course Explorer (добавлено)
pnpm run test:managers        # Тесты ManagersContainer

# Запуск полного набора тестов
pnpm run test                # Запуск полного набора тестов
pnpm run test:integration     # Интеграционные тесты

### Отладка в VS Code

1. Открыть проект в VS Code
2. Нажать F5 для запуска расширения в режиме отладки
3. Откроется новое окно VS Code (Extension Development Host)
4. Выполнить команду sli.dev Course: Scan Course через палитру команд (Ctrl+Shift+P)
5. Результат сканирования отобразится в выходном канале sli.dev Course

### Тестирование

Тесты используют фреймворк Mocha и модуль @vscode/test-electron. Тестовые файлы располагаются в src/test/suite/. Для запуска тестов выполните pnpm run test.

Тесты используют утилиты `src/test/utils/testWorkspace.ts` и `src/test/utils/courseStructure.ts` для работы с временными директориями.

---

## Правила разработки

### Стиль кода

- Язык: TypeScript с включённым строгим режимом типизации
- Модульность: CommonJS для скомпилированного кода (требование VS Code)
- Соглашения именования:
  - Интерфейсы: PascalCase (например, SlimanConfig, LectureInfo)
  - Константы: UPPER_SNAKE_CASE (например, SLIMAN_FILENAME, SLIDES_DIR)
  - Файлы: kebab-case для модулей (course-manager.ts), PascalCase для типов
  - Префикс команд: sliman. (например, sliman.scanCourse)

### Конфигурация TypeScript

Файл tsconfig.json включает следующие строгие настройки:

{
  compilerOptions: {
    strict: true,
    noImplicitAny: true,
    noImplicitReturns: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    forceConsistentCasingInFileNames: true
  }
}

### Конфигурация ESLint

Используется современный flat config (eslint.config.mjs) со следующими правилами:

| Правило | Уровень | Описание |
|---------|---------|----------|
| no-explicit-any | warn | Предупреждает использование типа any |
| no-unused-vars | error | Ошибка при неиспользуемых переменных |
| consistent-type-imports | error | Требует консистентного стиля импортов типов |

Исключение: аргументы, начинающиеся с _, считаются используемыми намеренно.

---

## Архитектура расширения

### Основные компоненты

#### 1. extension.ts — Точка входа

Отвечает за:
- Регистрацию и инициализацию менеджеров при активации расширения
- Регистрацию команд (sliman.scanCourse)
- Управление жизненным циклом (activate/deactivate)
- Создание выходного канала для логов

#### 2. ManagersContainer — Контейнер менеджеров

Паттерн Singleton для хранения и предоставления доступа к менеджерам:
- Инициализация один раз при активации расширения
- Предоставляет доступ к CourseManager, LectureManager, BuildManager
- Методы: initialize(), isInitialized(), reset()

Свойства:
- `courseManager: CourseManager | null` — менеджер курса
- `lectureManager: LectureManager | null` — менеджер лекций
- `buildManager: BuildManager | null` — менеджер сборки
- `courseExplorer: CourseExplorer | null` — менеджер Tree View

#### 3. CourseManager — Управление курсом

Основной класс для работы со структурой курса:

Методы path resolution:
- `getCourseRoot()` — возвращает URI корня курса
- `getSlidesDir()` — возвращает URI директории slides/
- `getBuiltCourseDir()` — возвращает URI директории built/ (для обратной совместимости)
- `getBuiltCourseDirWithName(courseName)` — возвращает URI директории {courseName}/
- `isPathInCourseRoot(uri)` — проверяет, находится ли URI в корне курса

Методы для sliman.json:
- `isCourseRoot()` — проверяет наличие файла sliman.json
- `readSliman()` — читает конфигурацию курса
- `writeSliman(config)` — записывает конфигурацию курса

Методы для slides.json:
- `readSlidesJson()` — читает конфигурацию лекций
- `writeSlidesJson(config)` — записывает конфигурацию лекций
- `addLecture(name, title)` — добавляет или обновляет лекцию

Методы для discovery:
- `getLectureDirectories()` — возвращает список директорий лекций
- `readCourseData()` — читает все данные курса одной операцией

#### 4. LectureManager — Управление лекциями

Класс для создания и управления структурой лекций.

Методы path resolution:
- `getSlidesDir()` — возвращает URI директории slides/
- `getLectureDir(name)` — возвращает URI директории лекции
- `getLectureSlidesPath(name)` — возвращает URI файла slides.md
- `getLecturePackagePath(name)` — возвращает URI файла package.json

Методы структуры:
- `lectureExists(name)` — проверяет существование лекции
- `createLectureDir(name)` — создаёт директорию лекции

Методы шаблонов:
- `copySlidesTemplate(name, title)` — копирует и обновляет slides.md
- `copyPackageJson(name)` — копирует и обновляет package.json
- `initLectureNpm(name)` — устанавливает зависимости лекции

Методы конфигурации:
- `updateCourseConfig(name, title)` — обновляет slides.json

Основной метод:
- `createLecture(nameOrTitle, title?)` — создаёт полную структуру лекции

#### 5. BuildManager — Сборка лекций и курса

Класс для сборки лекций и курса через терминал VS Code.

Интерфейсы:
interface BuildProgress {
  /** Lecture name (optional, for course-level builds) */
  lecture?: string;
  /** Current build stage */
  stage: 'installing' | 'building' | 'copying' | 'updating' | 'complete';
  /** Progress percentage (0-100) */
  percent?: number;
}

interface BuildError {
  /** Error type */
  type: 'lecture-not-found' | 'npm-not-found' | 'build-failed' | 'timeout';
  /** Lecture name (if applicable) */
  lecture?: string;
  /** Error message */
  message: string;
  /** Process exit code */
  exitCode?: number;
}

Основные методы:
- `buildLecture(name)` — сборка одной лекции (install + build)
- `buildCourse()` — сборка всего курса (все лекции)
- `runDevServer(name)` — запуск dev сервера лекции в терминале
- `updateIndexHtml()` — обновление index.html со списком лекций
- `showProgress(progress)` — отображение прогресса в status bar
- `hideProgress()` — скрытие status bar

#### 6. Constants — Константы

Структурные константы проекта:

// Имена файлов
SLIMAN_FILENAME = 'sliman.json'
SLIDES_FILENAME = 'slides.json'

// Директории
SLIDES_DIR = 'slides'
TEMPLATE_DIR = 'template'
BUILT_DIR = 'built'

// Шаблоны
TEMPLATE_SLIDES = 'slides.md'
TEMPLATE_INDEX = 'index.html'
TEMPLATE_PACKAGE = 'package.json'
TEMPLATE_STATIC = 'static.yml'

// Ключи frontmatter
KEY_TITLE = 'title'
KEY_NAME = 'name'
DEFAULT_CANVAS_WIDTH = 1280
DEFAULT_ROUTER_MODE = 'history'

// Файлы лекций
LECTURE_SLIDES = 'slides.md'
LECTURE_PACKAGE = 'package.json'

// Префикс лекций
LECTURE_PREFIX = 'lecture-'

// Конфигурация VS Code
CONFIG_SECTION = 'sliDevCourse'
CONFIG_COURSE_ROOT = 'courseRoot'
LECTURE_CONFIG_SECTION = 'slidev'

#### 7. Transliterator — Транслитерация кириллицы

Утилита для преобразования кириллицы в латиницу в именах папок лекций.

Функции:
- `transliterate(input: string): string` — преобразует строку в Latin
- `generateLectureFolderName(title: string): string` — генерирует имя папки из заголовка
- `isValidFolderName(name: string): boolean` — проверяет валидность имени папки
- `validateCourseName(name: string): { isValid: boolean; error?: string }` — валидация имени курса

Особенности:
- Поддержка русских и украинских букв (а-я, А-Я)
- Автоматическая замена пробелов и спецсимволов на дефисы
- Ограничение длины: 64 символа
- fallback: `lecture-{timestamp}` при пустом результате

#### 8. Types — Типы данных

interface SlimanConfig {
  course_name: string;
}

interface LectureInfo {
  /** Имя лекции (название папки) */
  name: string;
  /** Заголовок лекции (для отображения) */
  title: string;
}

interface SlidesConfig {
  slides: LectureInfo[];
}

interface CourseData {
  config: SlimanConfig | null;
  slides: SlidesConfig | null;
}

interface LectureItem {
  type: 'lecture';
  name: string;
  title: string;
  uri: string;
}

interface ActionItem {
  type: 'action';
  command: string;
  title: string;
  icon?: string;
}

interface CourseRootItem {
  type: 'root';
  courseName: string;
  uri: string;
}

// CourseExplorer типы
interface CourseTreeItem extends vscode.TreeItem {
  type: 'root' | 'folder' | 'lecture' | 'action';
  uri?: string;
  command?: vscode.Command;
}

// ManagersContainer типы
interface ManagersContainer {
  isInitialized(): boolean;
  courseManager: CourseManager | null;
  lectureManager: LectureManager | null;
  buildManager: BuildManager | null;
  refreshCourseExplorer(): void; // Обновляет отображение Course Explorer Tree View
}

#### 9. CourseExplorer — Tree View менеджер

Класс для управления Course Explorer в боковой панели VS Code.

Методы:
- `initialize(managers)` — инициализирует Tree View с менеджерами
- `refresh()` — обновляет данные в Tree View
- `dispose()` — освобождает ресурсы
- `show()` — показывает Tree View в боковой панели
- `hide()` — скрывает Tree View

Свойства:
- `treeView` — экземпляр vscode.TreeView

#### 10. CourseExplorerDataProvider — Tree Data Provider

Реализует vscode.TreeDataProvider для Course Explorer.

Методы:
- `getTreeItem(element)` — возвращает TreeItem для отображения
- `getChildren(element?)` — возвращает дочерние элементы
- `getParent(element)` — возвращает родительский элемент
- `refresh()` — вызывает обновление Tree View

Методы для работы с данными:
- `loadCourseData()` — загружает данные курса для отображения
- `createTreeItems()` — создаёт элементы дерева из данных курса

Структура дерева:
- Course Root (название курса)
  ├── Lectures (папка с лекциями)
  │   └── lecture-{name} (лекция → sliman.openSlides или sliman.editLecture)
  └── Actions (папка с действиями)
      ├── Build course (→ sliman.buildCourse)
      └── Setup GitHub Pages (→ sliman.setupPages)

#### 11. Commands — модуль команд

Модуль для регистрации и выполнения команд VS Code.

Функции:
- `initializeCommands(context, outputChannel)` — регистрирует все команды
- `createCourse()` — создание нового курса
- `addLecture()` — добавление новой лекции
- `scanCourse()` — сканирование курса
- `buildLecture(name)` — сборка лекции
- `openSlides(name)` — открытие slides.md
- `buildCourse()` — сборка всего курса
- `setupPages()` — настройка GitHub Pages
- `editLecture(name)` — открытие slides.md + запуск dev сервера
- `deleteLecture(name)` — удаление лекции
- `viewCourse()` — запуск HTTP сервера для просмотра курса

Интеграция с Tree View:
- createCourse() → refreshCourseExplorer()
- addLecture() → refreshCourseExplorer()
- deleteLecture() → refreshCourseExplorer()

---

## Команды расширения

| ID команды | Название | Описание |
|------------|----------|----------|
| sliman.scanCourse | Scan Course | Сканирует курс и выводит информацию: название курса, список лекций |
| sliman.createCourse | Create Course | Создаёт новую структуру курса (sliman.json, slides.json, slides/) |
| sliman.addLecture | Add Lecture | Добавляет новую лекцию с автогенерацией имени папки |
| sliman.editLecture | Edit Lecture | Открывает slides.md и запускает dev сервер для редактирования |
| sliman.deleteLecture | Delete Lecture | Удаляет лекцию с подтверждением |
| sliman.viewCourse | View Course | Запускает HTTP сервер для просмотра собранного курса |

| sliman.buildLecture | Build Lecture | Собирает лекцию в терминале с автокопированием в директорию курса |
| sliman.openSlides | Open slides.md | Открывает файл slides.md текущей лекции |
| sliman.buildCourse | Build Course | Собирает весь курс |
| sliman.setupPages | Setup GitHub Pages | Настраивает GitHub Pages для курса |

---

## Шаблоны курса

Директория template/ содержит шаблоны для создания новых курсов:

### slides.md
Шаблон лекции Slidev с frontmatter:
---
title: Название лекции
canvasWidth: 1280
routerMode: history
---

### index.html
Главная страница курса со списком всех лекций для навигации.

### package.json
Зависимости для лекций:
- @slidev/cli — CLI Slidev
- @slidev/theme-* — темы оформления
- vue — для интерактивных компонентов

### static.yml
GitHub Actions workflow для автоматического деплоя на GitHub Pages.

---

## Структура курса sli.dev

После создания курс имеет следующую структуру:

course-root/
├── sliman.json              # Конфигурация курса (course_name)
├── slides/                  # Директория с лекциями
│   ├── lecture-1/
│   │   ├── slides.md
│   │   └── package.json
│   └── lecture-2/
└── {course_name}/           # Собранный курс для GitHub Pages
    ├── slides.json          # Конфигурация лекций
    ├── index.html           # Главная страница курса
    ├── lecture-1/           # Собранная лекция 1 (из lecture-1/dist/)
    │   ├── index.html
    │   └── ...
    └── lecture-2/           # Собранная лекция 2 (из lecture-2/dist/)
        ├── index.html
        └── ...

---

## Рекомендации для разработки

### Общие принципы

1. Следовать порядку задач — Stage 1 должен быть завершён перед переходом к Stage 2
2. Использовать vscode.Uri для всех путей файловой системы (не строки)
3. Хранить состояние через context.globalState или context.workspaceState
4. Отображать прогресс через vscode.window.createStatusBarItem
5. Обрабатывать ошибки с использованием vscode.window.showErrorMessage
6. Тестировать каждую новую команду перед коммитом
7. **Новые команды**: editLecture, deleteLecture, viewCourse реализованы

### Работа с файловой системой

- Использовать vscode.workspace.fs для операций чтения/записи
- Использовать fs/promises Node.js для дополнительных операций
- Всегда обрабатывать ошибки асинхронных операций

### Логирование

Расширение использует выходной канал sli.dev Course для логирования:

const outputChannel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
outputChannel.appendLine('Сообщение');
outputChannel.show();

### Тестовые утилиты

Для обеспечения единообразия тестов используется модуль `src/test/utils/testWorkspace.ts`:

```typescript
import { createTestDir, cleanupTestDir, cleanupAllTestDirs } from '../utils/testWorkspace';

// Создание директории с категорией и именем теста
const tempDir = await createTestDir('manager', 'path-resolution');

// Очистка конкретной директории
await cleanupTestDir(tempDir);

// Глобальная очистка в suiteTeardown
suiteTeardown(async () => {
  await cleanupAllTestDirs();
});
```

---

## Полезные ссылки

- VS Code Extension API: https://code.visualstudio.com/api
- sli.dev документация: https://sli.dev
- Slidev на GitHub: https://github.com/slidevjs/slidev
- TypeScript документация: https://www.typescriptlang.org/docs/
- ESLint документация: https://eslint.org/docs/latest/

---

## Внешние зависимости

- sli.dev (Slidev): Latest версия через npm (для скомпилированных курсов)
- Node.js: LTS версия (^18.18.0)
- VS Code: ^1.85.0
- pnpm: Рекомендуется как менеджер пакетов
- http-server: Для запуска локального сервера просмотра курса"