# Спецификация: Перенос сборки лекций в VS Code Terminal (PowerShell)

**Статус:** реализовано с изменениями (APPROVED → реализация через ProcessHelper вместо sentinel-подхода)
**Дата:** 2026-08-20
**Касается:** `src/managers/BuildManager.ts`, `src/utils/process.ts` (частично), `src/providers/*` (без изменений)

---

## 1. Цель и контекст

При сборке лекций расширение вызывает `child_process.exec` напрямую
(`BuildManager.ts:170`). На Windows это запускается без явного shell, из-за чего
`pnpm` не находится / не исполняется корректно (pnpm распространяется как
`pnpm.cmd`, а не как исполняемый бинарник в PATH, который Node запустит без
shell-оболочки). Это даёт трудноуловимые ошибки сборки в окружении VS Code.

**Цель:** обеспечить запуск `pnpm build` в окружении пользовательского shell —
тогда `pnpm` доступен так же, как при ручном запуске в терминале. Логику очистки и
копирования артефактов оставляем в расширении (файловая система Node).

**Важно (решение по реализации):** чтение вывода VS Code Terminal
(`vscode.window.onDidWriteTerminalData`, `Terminal.onDidWriteData`) — это
**proposed API**, недоступный в опубликованном расширении (нестабилизирован даже
в актуальных версиях VS Code). Поэтому финальная реализация использует
`ProcessHelper.execStream` (`child_process.spawn` c `shell: true`), который:
запускает `pnpm` через системный shell (решает `ENOENT`/PATH-проблему), стримит
вывод в `outputChannel` и ждёт завершения процесса с проверкой кода выхода.
VS Code Terminal остаётся только для `runDevServer` (non-blocking).

---

## 2. Диагноз (корневая причина)

| Что было | Почему ломается |
|----------|-----------------|
| `child_process.exec('pnpm build --base ...', { cwd })` без `shell: true` | На Windows `pnpm` — это `pnpm.cmd`. Без shell Node пытается запустить `pnpm` как бинарь → `ENOENT` / неверный PATH / обрыв сборки |
| Нет инициализации профиля shell | В терминале VS Code пользователя `pnpm` настраивается через profile (npm/pnpm на PATH); `exec` этого не получает |

**Решение (итоговое):** запускать `pnpm build` через
`ProcessHelper.execStream` — `child_process.spawn` с `shell: true`:
`shell: true` заставляет Node использовать системный shell (PowerShell/cmd),
где `pnpm.cmd` находится через PATH так же, как в терминале пользователя.

---

## 3. Целевая архитектура (реализовано)

```
buildLecture(name, deployRoot, outputChannel?)
  ├─ (в расширении, FS) cleanViteCache(lecturePath)   // как раньше
  ├─ (ProcessHelper.execStream, shell:true) pnpm build --base <basePath>
  │     └─ стриминг вывода в outputChannel, ожидание по коду выхода
  ├─ (в расширении, FS) cleanDirectory(copyDestination)  // как раньше
  └─ (в расширении, FS) copyBuiltFiles(copySource, copyDestination)  // как раньше
```

- `runDevServer(name)` — открывает VS Code Terminal (`sli.dev: <name>`),
  non-blocking (`sendText` + `show`); не читает вывод терминала.
- `buildCourse(outputChannel)` — последовательно вызывает `buildLecture` для
  каждой лекции, передавая `outputChannel` для стриминга (без изменения логики цикла).

---

## 4. Управление терминалами (только runDevServer)

- **Один терминал на лекцию.** Детерминированное имя: `sli.dev: <name>`
  (совпадает с текущим `runDevServer`).
- **Дедуп:** перед созданием проверяем `vscode.window.terminals` по имени.
  - Если терминал с таким именем уже есть — переиспользуем (через `show()`).
- **Не закрываем** терминал после запуска dev-сервера (пользователь может
  остановить его вручную).
- Для сборки (`buildLecture`) терминал больше не используется — см. раздел 5.

---

## 5. Ожидание завершения сборки (реализовано через ProcessHelper)

Ранее планировался sentinel-подход с чтением вывода терминала
(`onDidWriteTerminalData`). Этот путь отвергнут, т.к. API является proposed
и недоступен в опубликованном расширении.

**Финальная реализация — `ProcessHelper.execStream` (stable API):**

1. Команда сборки запускается через `child_process.spawn` c `shell: true`:
   ```ts
   ProcessHelper.execStream(`pnpm build --base ${basePath}`, {
     cwd: lecturePath,
     timeout: 300000,
     outputChannel,
   });
   ```
   `shell: true` гарантирует нахождение `pnpm.cmd` через PATH.

2. Вывод стримится в `outputChannel` в реальном времени (`execStream`
   подписан на `stdout`/`stderr`).

3. Завершение определяется по коду выхода процесса (`child.on('close')`):
   - `exitCode === 0` → успех;
   - `exitCode !== 0` → ошибка с `BuildError.type = 'build-failed'`;
   - таймаут (`exitCode === 124` / `[TIMEOUT]` в stderr) →
     `BuildError.type = 'timeout'`.

4. Никаких proposed API, `enabledApiProposals`, sentinel-маркеров и
   подписок на вывод терминала.

---

## 6. Shell и команды

- **Shell по умолчанию:** PowerShell (системный shell терминала VS Code).
- **Разделитель команд:** `;` (работает во всех версиях PowerShell, как уже
  сделано в `runDevServer`).
- **Пути:** оборачиваем в кавычки: `cd "<lecturePath>"`.
- **Базовый путь:** без изменений относительно текущей логики:
  - `deployRoot === true`  → `pnpm build --base /<name>/`
  - `deployRoot === false` → `pnpm build --base /<courseName>/<name>/`
- Кроссплатформенность: проект ориентирован на Windows/pwsh. Делаем команду
  shell-агностичной на уровне `sendText`, но явно не добавляем ветку Unix,
  пока не потребуется (как и сейчас).

---

## 7. Что НЕ меняется

- `cleanViteCache(lecturePath)` — очистка `node_modules/.vite` и `dist`
  синхронно через `fs.rmSync`. Остаётся как есть, вызывается ДО сборки в
  терминале.
- `cleanDirectory(copyDestination)` — очистка целевой директории.
- `copyBuiltFiles(copySource, copyDestination)` — копирование `dist/`.
  Вызывается ПОСЛЕ подтверждения успешной сборки в терминале.
- `getLectureDir`, `getCourseRoot`, `readCourseName`, `readDeployRoot` и пр. —
  без изменений.
- `showProgress` / `hideProgress` — без изменений (status bar).
- `buildCourse` — цикл `for ... await` последовательно вызывает
  `buildLecture`, переиспользуя терминалы по имени. Без изменения логики.

---

## 8. Изменения интерфейса `BuildManager` (реализовано)

Публичная сигнатура:

```ts
async buildLecture(name: string, deployRoot: boolean = false, outputChannel?: vscode.OutputChannel): Promise<void>;
async runDevServer(name: string): Promise<void>;
async buildCourse(outputChannel: vscode.OutputChannel): Promise<void>;
```

Внутренние (private):

```ts
private getOrCreateTerminal(name: string): vscode.Terminal; // только для runDevServer
private readonly BUILD_TIMEOUT_MS = 300000;
```

`process.ts` (`WindowsCommandExecutor.execStream`) используется для сборки
(`buildLecture`). Модуль остаётся на месте и переиспользуется.

---

## 9. План файлов

| Файл | Изменение |
|------|-----------|
| `src/managers/BuildManager.ts` | `buildLecture` использует `ProcessHelper.execStream` (shell:true); удалены `runInTerminalAndWait`, `BUILD_DONE_MARKER`, `_terminalDataDisposable`; `getOrCreateTerminal` оставлен для `runDevServer` |
| `src/commands.ts` | `buildLecture` передаёт `channel` в `buildManager.buildLecture` для стриминга вывода |
| `doc/build-powershell-terminal-spec.md` | Эта спецификация (обновлена под реализацию через ProcessHelper) |
| `src/test/suite/buildManager.test.ts` | Без изменений (существующие тесты покрывают ошибки/прогресс; реальные сборки не тестируются) |

---

## 10. Критерии приёмки

1. Сборка лекции (`sliman.buildLecture`) успешно завершается в окружении VS Code
   на Windows: `pnpm build` запускается через shell (`shell: true`) без `ENOENT`.
2. `buildLecture` не возвращает управление, пока `pnpm build` не завершён
   (успешно или с ошибкой) — ожидание по коду выхода процесса.
3. При ошибке сборки (`pnpm build` вернул ненулевой код) — `buildLecture`
   бросает ошибку с типом `build-failed`, копирование не происходит.
4. При превышении 5 минут — ошибка типа `timeout`.
5. Вывод сборки стримится в `outputChannel` в реальном времени.
6. `runDevServer` открывает/переиспользует терминал `sli.dev: <name>` (non-blocking).
7. `buildCourse` собирает все лекции последовательно, логи пишутся в
   `outputChannel` (как раньше).
8. Очистка Vite-кэша/диста и копирование результатов работают как раньше
   (артефакты не смешиваются).
9. `pnpm run lint:check` и `pnpm run compile` проходят без ошибок.
10. Расширение НЕ использует proposed API (`terminalDataWriteEvent` /
    `onDidWriteTerminalData` / `onDidWriteData`) — `enabledApiProposals` пуст,
    сборка расширения проходит без ошибки proposed API.
11. Существующие тесты `buildManager.test.ts` проходят.

---

## 11. План реализации (коротко)

1. `buildLecture` получает опциональный `outputChannel`.
2. Шаг сборки: `ProcessHelper.execStream('pnpm build --base ...', { cwd, timeout, outputChannel })`.
3. Проверка `result.success` / `exitCode` → типы ошибок `build-failed` / `timeout`.
4. Удалены: `runInTerminalAndWait`, `BUILD_DONE_MARKER`, `_terminalDataDisposable`.
5. `getOrCreateTerminal` оставлен для `runDevServer` (non-blocking, без чтения вывода).
6. `buildCourse` передаёт `outputChannel` в `buildLecture`.
7. `commands.ts` передаёт `channel` в `buildManager.buildLecture`.
8. Прогнать `compile`, `lint:check`, тесты.
