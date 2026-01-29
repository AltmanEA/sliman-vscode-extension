PS> Set-Content -Path "C:\projects\sliman-vscode-extension\KODA.md" -Value "# KODA.md — Инструкции для VS Code Extension проекта

## Обзор проекта

**Название:** sli.dev Course Manager  
**Версия:** 0.0.1  
**Назначение:** VS Code расширение для управления учебными курсами, созданными с использованием фреймворка sli.dev (Slidev)

### Текущий статус разработки

Проект находится на **Stage 4** — этапе разработки Tree View. Реализованы:

**Stage 1 (Завершён):**
- Базовые типы данных (SlimanConfig, LectureInfo, SlidesConfig, CourseData)
- Константы путей и структуры проекта
- CourseManager для управления файлами конфигурации курса
- extension.ts с командой sliman.scanCourse

**Stage 2 (Завершён):**
- ProcessHelper — утилита для выполнения shell-команд с поддержкой npm/pnpm
- LectureManager — создание лекций, копирование шаблонов, транслитерация кириллицы
- BuildManager — сборка лекций и курса, real-time output, progress bar
- ManagersContainer — обновлён для включения всех менеджеров
- Тесты: LectureManager (40+), ProcessHelper (25+), BuildManager (10+)

**Stage 3 (Завершён):**
- src/commands.ts — регистрация и реализация всех команд
- src/test/suite/commands.test.ts — тесты команд (187+ тестов)
- createCourse, addLecture, scanCourse, runLecture, buildLecture, openSlides, buildCourse, setupPages (реализованы)

**Stage 4 (Завершён):**
- src/providers/CourseExplorer.ts — Tree View менеджер
- src/providers/CourseExplorerDataProvider.ts — провайдер данных для Tree View
- src/managers/ManagersContainer.ts — refreshCourseExplorer() метод
- src/test/suite/courseExplorer.test.ts — тесты Course Explorer (16 тестов)
- Интеграция refresh в команды createCourse и addLecture
- Тесты: 204+ тестов total

---

## Основные технологии

| Технология | Версия | Назначение |
|------------|--------|------------|
| TypeScript | ^5.3.3 | Основной язык разработки |
| VS Code API | ^1.85.0 | Целевая платформа расширения |
| Node.js | ^18.18.0 | Среда выполнения |
| ESLint | ^9.0.0 | Линтинг кода |
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
    │   └── testWorkspace.ts  # Унификация работы с test-workspace
    └── suite/
        ├── courseManager.test.ts  # Тесты CourseManager
        ├── lectureManager.test.ts  # Тесты LectureManager (40+)
        ├── buildManager.test.ts    # Тесты BuildManager (10+)
        ├── process.test.ts        # Тесты ProcessHelper (25+)
        ├── commands.test.ts       # Тесты команд (187+)
        ├── courseExplorer.test.ts # Тесты Course Explorer (16)
        ├── extension.test.ts      # Тесты точки входа
        └── integration.test.ts    # Интеграционные тесты

template/                     # Шаблоны для создания курсов
├── slides.md                 # Шаблон лекции
├── index.html                # Шаблон главной страницы курса
├── package.json              # Шаблон package.json для лекций
├── static.yml                # GitHub Actions workflow для GitHub Pages
├── Courser.vue               # Vue компонент курса
└── global-top.vue            # Глобальный компонент верхней панели

docs/                         # Документация и планы
├── IMPLEMENTATION_PLAN.md    # План реализации
├── STAGE1_TASKS.md           # Задачи Stage 1
├── STAGE2_BREAKDOWN.md       # Разбивка Stage 2
├── STAGE3_PLAN.md            # План Stage 3
├── STAGE4_PLAN.md            # План Stage 4
└── TECHNICAL_SPEC.md         # Техническая спецификация
example/                      # Пример курса для тестирования
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

# Запуск полного набора тестов
pnpm run test

### Отладка в VS Code

1. Открыть проект в VS Code
2. Нажать F5 для запуска расширения в режиме отладки
3. Откроется новое окно VS Code (Extension Development Host)
4. Выполнить команду sli.dev Course: Scan Course через палитру команд (Ctrl+Shift+P)
5. Результат сканирования отобразится в выходном канале sli.dev Course

### Тестирование

Тесты используют фреймворк Mocha и модуль @vscode/test-electron. Тестовые файлы располагаются в src/test/suite/. Для запуска тестов выполните pnpm run test.

Все тесты используют унифицированный модуль `src/test/utils/testWorkspace.ts` для работы с временными директориями. Формат: `test-workspace-{category}-{testName}-{uniqueId}`.

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

#### 3. CourseManager — Управление курсом

Основной класс для работы со структурой курса:

Методы path resolution:
- `getCourseRoot()` — возвращает URI корня курса
- `getSlidesDir()` — возвращает URI директории slides/
- `getBuiltCourseDir()` — возвращает URI директории built/
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

#### 4. ProcessHelper — Утилита для выполнения команд

Утилита для выполнения shell-команд с поддержкой npm/pnpm и streaming output.

Интерфейсы:
- `ICommandExecutor` — интерфейс исполнителя команд
- `ProcessResult` — результат выполнения команды (success, stdout, stderr, exitCode)
- `ProcessOptions` — опции выполнения (cwd, env, timeout, outputChannel)

Статические методы:
- `exec(command, options?)` — выполнение команды с буферизованным выводом
- `execStream(command, options?, handler?)` — выполнение со streaming выводом
- `execPackageManager(script, cwd, args?, options?)` — выполнение npm/pnpm скриптов
- `installDependencies(cwd, options?)` — установка зависимостей (npm/pnpm)
- `runBuild(cwd, options?)` — сборка презентации (npm run build)

Управление исполнителем:
- `setExecutor(executor)` — установка кастомного исполнителя
- `resetExecutor()` — сброс к исполнителю по умолчанию
- `detectPlatform()` — определение платформы (windows/unix)

#### 5. LectureManager — Управление лекциями

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

#### 6. BuildManager — Сборка лекций и курса

Класс для сборки лекций и курса с real-time output.

Интерфейсы:
- `BuildProgress` — информация о прогрессе (lecture, stage, percent)
- `BuildError` — структурированная информация об ошибке

Свойства:
- `outputChannel` — канал вывода для логов сборки

Методы output integration:
- `attachOutput(channel)` — подключение внешнего канала вывода
- `clearOutput()` — очистка канала вывода
- `appendLine(message)` — добавление строки с timestamp
- `appendBlock(block)` — добавление многострочного блока
- `showOutput(preserveFocus?)` — показ канала вывода
- `showProgress(progress)` — отображение прогресса в status bar
- `hideProgress()` — скрытие status bar

Методы сборки:
- `buildLecture(name)` — сборка одной лекции (install + build)
- `buildCourse()` — сборка всего курса (все лекции)
- `runDevServer(name)` — запуск dev сервера лекции в терминале

#### 7. Constants — Константы

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

#### 8. Transliterator — Транслитерация кириллицы

Утилита для преобразования кириллицы в латиницу в именах папок лекций.

Функции:
- `transliterate(input: string): string` — преобразует строку в Latin
- `generateLectureFolderName(title: string): string` — генерирует имя папки из заголовка
- `isValidFolderName(name: string): boolean` — проверяет валидность имени папки

Особенности:
- Поддержка русских и украинских букв (а-я, А-Я)
- Автоматическая замена пробелов и спецсимволов на дефисы
- Ограничение длины: 64 символа
- fallback: `lecture-{timestamp}` при пустом результате

#### 9. Types — Типы данных

interface SlimanConfig {
  course_name: string;
}

interface LectureInfo {
  name: string;
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

// ProcessHelper типы
interface ProcessResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface ProcessOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  outputChannel?: vscode.OutputChannel;
  packageManager?: 'npm' | 'pnpm';
}

interface StreamHandler {
  (type: 'stdout' | 'stderr', data: string): void;
}

interface ICommandExecutor {
  detectPlatform(): 'windows' | 'unix';
  exec(command: string, options?: ProcessOptions): Promise<ProcessResult>;
  execStream(command: string, options?: ProcessOptions, handler?: StreamHandler): Promise<ProcessResult>;
  execPackageManager(script: string, cwd: string, args?: string[], options?: ProcessOptions): Promise<ProcessResult>;
}

// BuildManager типы
interface BuildProgress {
  lecture: string;
  stage: 'install' | 'build' | 'copy';
  percent: number;
}

interface BuildError {
  lecture: string;
  stage: string;
  message: string;
  exitCode: number;
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
  refreshCourseExplorer(): void;
}

#### 10. CourseExplorer — Tree View менеджер

Класс для управления Course Explorer в боковой панели VS Code.

Методы:
- `initialize(managers)` — инициализирует Tree View с менеджерами
- `refresh()` — обновляет данные в Tree View
- `dispose()` — освобождает ресурсы

Свойства:
- `treeView` — экземпляр vscode.TreeView

#### 11. CourseExplorerDataProvider — Tree Data Provider

Реализует vscode.TreeDataProvider для Course Explorer.

Методы:
- `getTreeItem(element)` — возвращает TreeItem для отображения
- `getChildren(element?)` — возвращает дочерние элементы
- `getParent(element)` — возвращает родительский элемент
- `refresh()` — вызывает обновление Tree View

Структура дерева:
- Course Root (название курса)
  ├── Lectures (папка с лекциями)
  │   └── lecture-{name} (лекция → sliman.openSlides)
  └── Actions (папка с действиями)
      ├── Build course (→ sliman.buildCourse)
      └── Setup GitHub Pages (→ sliman.setupPages)

#### 12. Commands — модуль команд

Модуль для регистрации и выполнения команд VS Code.

Функции:
- `initializeCommands(context, outputChannel)` — регистрирует все команды
- `createCourse()` — создание нового курса
- `addLecture()` — добавление новой лекции
- `scanCourse()` — сканирование курса
- `runLecture(name)` — запуск dev сервера лекции
- `buildLecture(name)` — сборка лекции
- `openSlides(name)` — открытие slides.md
- `buildCourse()` — сборка всего курса
- `setupPages()` — настройка GitHub Pages

Интеграция с Tree View:
- createCourse() → refreshCourseExplorer()
- addLecture() → refreshCourseExplorer()

---

## Команды расширения

### Реализованные команды

| ID команды | Название | Описание |
|------------|----------|----------|
| sliman.scanCourse | Scan Course | Сканирует курс и выводит информацию: название курса, список лекций |
| sliman.createCourse | Create Course | Создаёт новую структуру курса (sliman.json, slides.json, slides/) |
| sliman.addLecture | Add Lecture | Добавляет новую лекцию с автогенерацией имени папки |

### Реализованные команды (полный список)

| ID команды | Название | Описание |
|------------|----------|----------|
| sliman.scanCourse | Scan Course | Сканирует курс и выводит информацию: название курса, список лекций |
| sliman.createCourse | Create Course | Создаёт новую структуру курса (sliman.json, slides.json, slides/) |
| sliman.addLecture | Add Lecture | Добавляет новую лекцию с автогенерацией имени папки |
| sliman.runLecture | Run Lecture | Запускает лекцию в режиме разработки |
| sliman.buildLecture | Build Lecture | Собирает лекцию в статические файлы |
| sliman.openSlides | Open slides.md | Открывает файл slides.md текущей лекции |
| sliman.buildCourse | Build Course | Собирает весь курс |
| sliman.setupPages | Setup GitHub Pages | Настраивает GitHub Pages для курса |

---

## План развития (Stage 2+)

### Stage 2 — Лекции и сборка (Завершён)

- src/managers/LectureManager.ts — создание и управление лекциями ✓
- src/managers/BuildManager.ts — сборка курса (npm run dev/build) ✓
- src/utils/process.ts — утилита для выполнения shell-команд ✓
- src/utils/translit.ts — транслитерация кириллицы ✓
- Тесты: 187 тестов с унифицированными утилитами ✓
- src/test/utils/testWorkspace.ts — унификация работы с test-workspace ✓

### Stage 3 — UI команды (Завершён)

Реализация 8 команд для полноценной работы с курсом:

| ID команды | Название | Статус | Описание |
|------------|----------|--------|----------|
| sliman.createCourse | Create Course | ✅ Готово | Создаёт новую структуру курса |
| sliman.addLecture | Add Lecture | ✅ Готово | Добавляет новую лекцию |
| sliman.scanCourse | Scan Course | ✅ Готово | Сканирует курс и выводит информацию |
| sliman.runLecture | Run Lecture | ✅ Готово | Запускает лекцию в режиме разработки |
| sliman.buildLecture | Build Lecture | ✅ Готово | Собирает лекцию в статические файлы |
| sliman.openSlides | Open slides.md | ✅ Готово | Открывает файл slides.md текущей лекции |
| sliman.buildCourse | Build Course | ✅ Готово | Собирает весь курс |
| sliman.setupPages | Setup GitHub Pages | ✅ Готово | Настраивает GitHub Pages для курса |

### Stage 3.1 — Command Registration Framework (Завершено)

| Компонент | Файл | Статус |
|-----------|------|--------|
| src/commands.ts | Реализовано | Экспорт всех команд, initializeCommands() |
| src/extension.ts | Обновлено | Инициализация менеджеров, регистрация команд |

### Stage 3.2 — Create Course Command (Завершено)

| Компонент | Файл | Статус |
|-----------|------|--------|
| createCourse() | src/commands.ts | ✅ Реализовано |
| Тесты | src/test/suite/commands.test.ts | ✅ 187 тестов |

### Stage 3.3 — Add Lecture Command (Завершено)

| Компонент | Файл | Статус |
|-----------|------|--------|
| addLecture() | src/commands.ts | ✅ Реализовано |
| CourseManager.readSlidesJson() | src/managers/CourseManager.ts | ✅ Исправлен (корень курса) |
| CourseManager.writeSlidesJson() | src/managers/CourseManager.ts | ✅ Исправлен (корень курса) |
| Тесты | src/test/suite/*.test.ts | ✅ 187 тестов, унифицированные утилиты |

#### Функциональность addLecture:
- Проверка что пользователь в корне курса
- Ввод названия лекции с валидацией (3-200 символов)
- Автогенерация имени папки (транслитерация кириллицы)
- Подтверждение/редактирование имени папки
- Создание структуры лекции через LectureManager
- Логирование в output channel

### Stage 4 — Tree View (Завершён)

Реализация Course Explorer — древовидного представления структуры курса в панели VS Code.

| Компонент | Файл | Статус |
|-----------|------|--------|
| CourseExplorer.ts | src/providers/CourseExplorer.ts | ✅ |
| CourseExplorerDataProvider.ts | src/providers/CourseExplorerDataProvider.ts | ✅ |
| refreshCourseExplorer() | src/managers/ManagersContainer.ts | ✅ |
| Тесты | src/test/suite/courseExplorer.test.ts | ✅ 16 тестов |
| Интеграция refresh в команды | src/commands.ts | ✅ |

**Функциональность Course Explorer:**
- Отображение названия курса из sliman.json
- Папка "Lectures" со списком всех лекций из slides.json
- Папка "Actions" с командами "Build course" и "Setup GitHub Pages"
- Клик по лекции → выполнение команды sliman.openSlides
- Автоматическое обновление после createCourse/addLecture

**Структура Tree View:**
```
Course Name/
├── Lectures/
│   ├── About the Subject (about)
│   └── MongoDB (mongo)
└── Actions/
    ├── Build course
    └── Setup GitHub Pages
```

### Stage 5 — Контекстные меню (В разработке)

Интеграция с проводником файлов для быстрого доступа к командам.

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
├── slides.json              # Список лекций (автогенерируется)
├── slides/                  # Директория с лекциями
│   ├── lecture-1/
│   │   ├── slides.md
│   │   └── package.json
│   └── lecture-2/
└── built/                   # Собранный курс для GitHub Pages
    ├── index.html
    └── lecture-1/

---

## Рекомендации для разработки

### Общие принципы

1. Следовать порядку задач — Stage 1 должен быть завершён перед переходом к Stage 2
2. Использовать vscode.Uri для всех путей файловой системы (не строки)
3. Хранить состояние через context.globalState или context.workspaceState
4. Отображать прогресс через vscode.window.createStatusBarItem
5. Обрабатывать ошибки с использованием vscode.window.showErrorMessage
6. Тестировать каждую новую команду перед коммитом

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

// Глобальная очистка в suiteTeardown (только в extension.test.ts)
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
- pnpm: Рекомендуется как менеджер пакетов"