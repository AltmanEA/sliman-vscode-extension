PS> Set-Content -Path "C:\projects\sliman-vscode-extension\KODA.md" -Value "# KODA.md — Инструкции для VS Code Extension проекта

## Обзор проекта

**Название:** sli.dev Course Manager  
**Версия:** 0.0.1  
**Назначение:** VS Code расширение для управления учебными курсами, созданными с использованием фреймворка sli.dev (Slidev)

### Текущий статус разработки

Проект находится на **Stage 1** — этапе разработки базовой инфраструктуры. Реализованы:
- Базовые типы данных (SlimanConfig, LectureInfo, SlidesConfig, CourseData)
- Константы путей и структуры проекта
- CourseManager для управления файлами конфигурации курса
- Базовый extension.ts с командой sliman.scanCourse

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
│   └── index.ts              # TypeScript интерфейсы и типы
├── managers/
│   ├── ManagersContainer.ts  # Singleton-контейнер для менеджеров
│   └── CourseManager.ts      # Управление конфигурацией курса
└── test/
    └── suite/
        ├── courseManager.test.ts  # Тесты CourseManager
        └── example.test.ts        # Примеры тестов

template/                     # Шаблоны для создания курсов
├── slides.md                 # Шаблон лекции
├── index.html                # Шаблон главной страницы курса
├── package.json              # Шаблон package.json для лекций
└── static.yml                # GitHub Actions workflow для GitHub Pages

docs/                         # Документация и планы
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
- Предоставляет доступ к CourseManager через свойство courseManager
- Методы: initialize(), isInitialized(), reset()

#### 3. CourseManager — Управление курсом

Основной класс для работы со структурой курса:

Методы path resolution:
- getCourseRoot() — возвращает URI корня курса
- getSlidesDir() — возвращает URI директории slides/
- getBuiltCourseDir() — возвращает URI директории built/
- isPathInCourseRoot(uri) — проверяет, находится ли URI в корне курса

Методы для sliman.json:
- isCourseRoot() — проверяет наличие файла sliman.json
- readSliman() — читает конфигурацию курса
- writeSliman(config) — записывает конфигурацию курса

Методы для slides.json:
- readSlidesJson() — читает конфигурацию лекций
- writeSlidesJson(config) — записывает конфигурацию лекций
- addLecture(name, title) — добавляет или обновляет лекцию

Методы для discovery:
- getLectureDirectories() — возвращает список директорий лекций
- readCourseData() — читает все данные курса одной операцией

#### 4. Constants — Константы

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

#### 5. Types — Типы данных

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

---

## Команды расширения

### Реализованные команды

| ID команды | Название | Описание |
|------------|----------|----------|
| sliman.scanCourse | Scan Course | Сканирует курс и выводит информацию: название курса, список лекций |

### Планируемые команды

| ID команды | Название | Статус | Описание |
|------------|----------|--------|----------|
| sliman.createCourse | Create Course | Stage 3 | Создаёт новую структуру курса |
| sliman.addLecture | Add Lecture | Stage 3 | Добавляет новую лекцию |
| sliman.runLecture | Run Lecture | Stage 3 | Запускает лекцию в режиме разработки |
| sliman.buildLecture | Build Lecture | Stage 3 | Собирает лекцию в статические файлы |
| sliman.openSlides | Open slides.md | Stage 3 | Открывает файл slides.md текущей лекции |
| sliman.buildCourse | Build Course | Stage 3 | Собирает весь курс |
| sliman.setupPages | Setup GitHub Pages | Stage 3 | Настраивает GitHub Pages для курса |

---

## План развития (Stage 2+)

### Stage 2 — Лекции и сборка (планируется)

- src/managers/LectureManager.ts — создание и управление лекциями
- src/managers/BuildManager.ts — сборка курса (npm run dev/build)
- src/utils/process.ts — утилита для выполнения shell-команд

### Stage 3 — UI команды (планируется)

Реализация 8 команд для полноценной работы с курсом.

### Stage 4 — Tree View (планируется)

Реализация Course Explorer — древовидного представления структуры курса в панели VS Code.

### Stage 5 — Контекстные меню (планируется)

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