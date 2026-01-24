# KODA.md — Инструкции для VS Code Extension проекта

## Обзор проекта

**Название:** VSCode Extension for sli.dev Lecture Course Development  
**Текущий статус:** Планирование завершено, Stage 1 в разработке  
**Назначение:** VS Code расширение для разработки учебных курсов с использованием фреймворка sli.dev (Slidev)

### Основные технологии

| Технология | Версия | Назначение |
|------------|--------|------------|
| TypeScript | ^5.3.3 | Основной язык разработки |
| VS Code API | ^1.85.0 | Целевая платформа расширения |
| sli.dev | ^52.0.0 | Фреймворк для презентаций |
| ESLint | ^9.0.0 | Линтинг кода |
| Node.js | ^18.18.0 | Среда выполнения |

---

## Структура проекта

```
├── src/
│   ├── extension.ts          # Точка входа расширения
│   ├── test/
│   │   └── suite/
│   │       └── example.test.ts # Тесты расширения
├── template/                 # Шаблоны для курсов
│   ├── slides.md             # Шаблон лекции
│   ├── index.html            # Шаблон главной страницы курса
│   ├── package.json          # Шаблон package.json для сборки
│   └── static.yml            # GitHub Actions для GitHub Pages
├── docs/                     # Документация
│   ├── IMPLEMENTATION_PLAN.md # План реализации (все стадии)
│   └── STAGE1_TASKS.md       # Задачи Stage 1
├── package.json              # Конфигурация расширения
├── tsconfig.json             # Конфигурация TypeScript
└── eslint.config.mjs         # Конфигурация ESLint
```

---

## Сборка и запуск

### Команды npm/pnpm

```bash
# Компиляция TypeScript
pnpm run compile

# Компиляция в режиме watch
pnpm run watch

# Запуск линтера с автоисправлением
pnpm run lint

# Проверка линтером без изменений
pnpm run lint:check

# Запуск тестов
pnpm run test
```

### Разработка и отладка

1. Нажать `F5` в VS Code для запуска расширения в режиме отладки
2. Откроется новое окно VS Code (Extension Development Host)
3. Выполнить команду `Hello World` через палитру команд (`Ctrl+Shift+P`)
4. Для остановки — закрыть окно или нажать `Shift+F5`

### Тестирование

Тесты используют фреймворк Mocha и `@vscode/test-electron`. Тестовый файл находится в `src/test/suite/example.test.ts`.

---

## Правила разработки

### Стиль кода

- **Язык:** TypeScript с строгой типизацией
- **Модульность:** CommonJS для выходного кода (VS Code требование)
- **Соглашения:**
  - Интерфейсы: PascalCase (например, `SlimanConfig`, `LectureInfo`)
  - Константы: UPPER_SNAKE_CASE
  - Файлы: kebab-case для managers/providers/utils, PascalCase для типов
  - Префикс команд: `sliman.` (например, `sliman.createCourse`)

### Конфигурация TypeScript (tsconfig.json)

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Конфигурация ESLint

Используется flat config (`eslint.config.mjs`) с правилами:
- Рекомендованные правила TypeScript ESLint
- `no-explicit-any`: warning
- `no-unused-vars`: error (разрешены аргументы с `_`)
- `consistent-type-imports`: error

### Порядок реализации (по плану)

**Stage 1 — Инфраструктура (текущий этап):**
1. `src/types/index.ts` — типы `SlimanConfig`, `LectureInfo`, `SlidesConfig`, `CourseData`
2. `src/constants.ts` — константы путей и структуры
3. `src/managers/CourseManager.ts` — управление `sliman.json` и `slides.json`
4. `src/extension.ts` — регистрация менеджеров и команд
5. Обновление `package.json` с новыми командами

**Stage 2 — Лекции и сборка:**
- `LectureManager.ts` — создание лекций
- `BuildManager.ts` — сборка (npm run dev/build)
- `process.ts` — утилита для выполнения shell-команд

**Stage 3 — UI команды:**
- 8 команд: createCourse, scanCourse, addLecture, runLecture, buildLecture, openSlides, buildCourse, setupPages

**Stage 4 — Tree View:**
- Course Explorer с отображением структуры курса

**Stage 5 — Контекстные меню:**
- Интеграция с проводником файлов

### Шаблоны

Шаблоны находятся в директории `template/`:
- `slides.md` — шаблон лекции Slidev (frontmatter с title, canvasWidth, routerMode)
- `index.html` — главная страница курса со списком лекций
- `package.json` — зависимости: @slidev/cli, @slidev/theme-*, vue
- `static.yml` — GitHub Actions workflow для деплоя на GitHub Pages

---

## Команды расширения

### Текущие команды

| ID | Название | Описание |
|----|----------|----------|
| `vscode-extension.helloWorld` | Hello World | Тестовая команда |

### Планируемые команды (sli.man)

| ID | Название | Статус |
|----|----------|--------|
| `sliman.createCourse` | Create Course | Stage 3 |
| `sliman.scanCourse` | Scan Course | Stage 1 |
| `sliman.addLecture` | Add Lecture | Stage 3 |
| `sliman.runLecture` | Run Lecture | Stage 3 |
| `sliman.buildLecture` | Build Lecture | Stage 3 |
| `sliman.openSlides` | Open slides.md | Stage 3 |
| `sliman.buildCourse` | Build Course | Stage 3 |
| `sliman.setupPages` | Setup GitHub Pages | Stage 3 |

---

## Структура курса (после реализации)

```
course-root/
├── sliman.json           # Конфигурация курса (course_name)
├── slides.json           # Список лекций
├── slides/               # Директория лекций
│   ├── lecture-1/
│   │   ├── slides.md
│   │   └── package.json
│   └── lecture-2/
└── built/                # Собранный курс (для GitHub Pages)
```

---

## Внешние зависимости

- **sli.dev (Slidev):** Latest версия через npm
- **Node.js:** LTS версия
- **VS Code:** ^1.85.0

---

## Рекомендации для разработки

1. **Следовать порядку задач** в `docs/STAGE1_TASKS.md` — зависимости между задачами
2. **Использовать `vscode.Uri`** для всех путей файловой системы
3. **Хранить состояние** через `context.globalState` или `context.workspaceState`
4. **Использовать `vscode.window.createStatusBarItem`** для отображения прогресса
5. **Обрабатывать ошибки** с `vscode.window.showErrorMessage`
6. **Тестировать** каждую новую команду перед коммитом

---

## Полезные ссылки

- [VS Code Extension API](https://code.visualstudio.com/api)
- [sli.dev документация](https://sli.dev)
- [Slidev на GitHub](https://github.com/slidevjs/slidev)