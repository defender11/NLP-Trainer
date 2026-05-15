# AGENTS.md

## Проект

Focus Trainer - оффлайн PWA-тренажер фокуса и NLP-якорения.

Проект начался как один HTML-файл и переводится в модульную архитектуру.

Главная цель проекта:

- быстрый запуск состояния концентрации;
- голосовое сопровождение;
- управление без открытия глаз;
- Pomodoro;
- NLP-якорение;
- оффлайн-работа;
- мобильный UX.

Основная платформа:

- iPhone Safari;
- Android Chrome;
- Desktop Chrome.

Проект должен работать:

- без сборки;
- без backend;
- без обязательной авторизации;
- максимально автономно.

---

## Архитектурные принципы

### Главный принцип

UI не управляет бизнес-логикой напрямую.

Нельзя:

- хранить бизнес-логику внутри DOM;
- смешивать speech/timers/UI/storage;
- делать giant god-file.

Нужно:

- разделять модули;
- разделять ответственность;
- делать маленькие функции;
- избегать глобального состояния.

### Контракты между модулями

Каждый модуль общается через явные события и команды, а не через скрытые side effects.

Общий формат сообщений:

```js
{
  type: 'EVENT_NAME',
  payload: {},
  meta: {
    source: 'worker',
    ts: Date.now()
  }
}
```

Разрешенные связи:

- `ui -> app`: только пользовательские intents;
- `app -> trainer`: команды сценария и lifecycle;
- `trainer -> app`: изменения состояния тренировки;
- `worker -> app`: timer ticks, done, heartbeat, worker errors;
- `app -> ui`: только view model и команды рендера;
- `app <-> storage`: загрузка/сохранение состояния.

Запрещенные связи:

- `ui -> trainer` напрямую;
- `ui -> worker` напрямую;
- `trainer -> ui` напрямую;
- любая бизнес-логика в `ui.js`.

---

## Документация и синхронизация контекста

- Перед началом задачи агент всегда учитывает `AGENTS.md`.
- Если изменились `.md` файлы, агент перечитывает только измененные файлы перед правками кода.
- Для проверки изменений использовать `git status` и `git diff --name-only -- '*.md'`.
- Если пользователь явно указал файл (`README.md`, `md-docs/ROADMAP.md`, `ARCHITECTURE.md`), агент обязан свериться с ним перед выполнением.
- Пользовательские markdown-файлы хранить в папке [md-docs/user-md](./md-docs/user-md/).
- Если существует `md-docs/user-md/USER_GIT_ALIASES.md`, агент может использовать и цитировать алиасы из него при git-командах.

---

## Рекомендуемые .md для рабочего проекта

Оптимальный приоритет чтения для агента:

1. `AGENTS.md` - правила работы агента с кодовой базой и процессом.
2. `README.md` - как запустить проект и что он делает.
3. `ARCHITECTURE.md` - границы модулей, контракты, поток данных.
4. `CONTRIBUTING.md` - правила PR, коммитов, веток и ревью.
5. `RUNBOOK.md` - действия при инцидентах, деградации и восстановлении.
6. `md-docs/ROADMAP.md` - будущие фичи, этапы и технические направления.

Дополнительные полезные `.md`:

- `CHANGELOG.md` - история изменений по версиям и релизам.
- `TESTING.md` - тестовая стратегия, smoke/regression чеклисты, команды запуска.
- `SECURITY.md` - правила безопасной разработки, disclosure, ограничения по данным.
- `RELEASE.md` - процесс подготовки и выпуска релиза.
- `API.md` - публичные API/события/контракты и примеры использования.
- `DECISIONS.md` или `md-docs/adr/*.md` - архитектурные решения и причины выбора.
- `TROUBLESHOOTING.md` - частые проблемы и быстрые способы диагностики.
- `md-docs/user-md/USER_GIT_ALIASES.md` - пользовательские git-алиасы (необязательно), чтобы ускорить работу в терминале.

Если файла пока нет, но потребность появилась, его лучше создать до крупного рефакторинга.

---

## Структура проекта

```text
focus-trainer/
├── index.html
├── README.md (optional)
├── AGENTS.md
├── md-docs/
│   ├── ROADMAP.md
│   └── user-md/
│       └── USER_GIT_ALIASES.md (optional)
├── public/
│   ├── icons/
│   └── sounds/
├── src/
│   ├── app.js
│   ├── trainer.js
│   ├── flows.js
│   ├── voice.js
│   ├── keyboard.js
│   ├── storage.js
│   ├── ui.js
│   ├── timers.js
│   ├── worker.js
│   ├── ws.js
│   └── pwa.js
└── styles/
    └── main.css
```

---

## Назначение модулей

### app.js

Точка входа.

Только:

- инициализация;
- wiring модулей;
- boot приложения;
- маршрутизация событий между модулями.

Не хранить бизнес-логику.

---

### trainer.js

Главный state-machine тренажера.

Отвечает за:

- текущий режим;
- шаги;
- переходы;
- lifecycle;
- завершение сценариев.

Не должен напрямую работать с DOM.

---

### flows.js

Все сценарии тренировки.

Пример:

```js
export const installFlow = [];
export const fullFlow = [];
export const quickFlow = [];
```

Только данные.

Без логики.

---

### voice.js

Все, что связано с:

- `speechSynthesis`;
- голосами;
- очередями;
- fallback;
- voice errors.

Обязательно:

- graceful fallback;
- не ломать приложение, если voice unavailable;
- `stop/cancel` API;
- `utterance.onerror` с разблокировкой UI-переходов.

---

### keyboard.js

Управление без открытия глаз.

Поддерживаемые клавиши для перехода дальше:

```text
Space
Enter
ArrowRight
N
Т
```

Клавиши для пропуска таймера:

```text
S
Ы
```

Обязательные правила:

- не ломать accessibility;
- не hijack input fields;
- игнорировать обработку при фокусе на `input`, `textarea`, `select`, `contenteditable`;
- игнорировать комбинации с `metaKey`, `ctrlKey`, `altKey`.

---

### storage.js

Только:

- localStorage;
- import/export;
- state validation;
- migrations.

Нельзя:

- UI;
- DOM;
- speech.

Все данные валидируются до использования.

---

### timers.js

Работа с:

- pomodoro;
- countdown;
- breath cycles;
- delayed transitions.

Таймеры должны поддерживать:

- pause/resume;
- cleanup;
- background mode.

Основная стратегия: постепенно переносить timer loops в `worker.js`.

---

### worker.js

Web Worker для:

- таймеров;
- heartbeat;
- background ticking;
- autosave events.

Worker не должен:

- трогать DOM;
- использовать `window`;
- использовать `document`.

Только message passing.

Пример:

```js
worker.postMessage({
  type: 'START_TIMER',
  payload: {
    durationSec: 30
  }
});
```

---

### ws.js

WebSocket layer.

Используется только для:

- sync;
- multiplayer focus sessions;
- remote control;
- telemetry.

Не делать обязательным.

Приложение должно полностью работать оффлайн без `ws.js`.

Долгосрочные WS-идеи вынесены в [md-docs/ROADMAP.md](./md-docs/ROADMAP.md).

---

### ui.js

Только DOM rendering.

Без бизнес-логики.

Не хранить state.

---

## Стиль кода

### JavaScript

Использовать:

- camelCase для переменных и функций;
- маленькие функции;
- early return;
- guard clauses.

Уточнение по naming:

- если функция/поле экспортируется как публичный контракт или используется внешним API, допускается локальная конвенция проекта/платформы;
- внутри модулей по умолчанию `camelCase`.

Пример:

```js
function startTimer(seconds) {
  if (!seconds) {
    return;
  }

  // logic
}
```

---

## Запрещено

Нельзя:

- giant functions;
- inline `onclick`;
- inline styles;
- `innerHTML` с пользовательскими данными;
- глобальные mutable singletons;
- смешивать voice/UI/timers.

---

## Безопасность

Никогда не вставлять пользовательский ввод через:

```js
innerHTML
```

Только:

```js
textContent
createTextNode
```

---

## UX правила

### Главное правило

Пользователь может проходить тренировку:

- с закрытыми глазами;
- без мышки;
- без тача;
- только голосом + клавиатурой.

Это критически важно.

---

## Голос

Voice-first UX.

Если голос включен:

- шаги озвучиваются автоматически;
- переходы работают с клавиатуры;
- не должно быть deadlock-состояний;
- кнопки разблокируются после voice completion;
- при ошибке озвучки сценарий продолжается в silent-mode.

---

## PWA

Проект должен поддерживать:

- standalone mode;
- offline;
- installable app;
- wake lock;
- iOS Safari.

### PWA update strategy

- новая версия не должна обрывать активную тренировку;
- update prompt показывается после завершения шага/сессии;
- ручной reload контролируется через UI-команду;
- при проблеме с cache всегда есть fallback на последнюю рабочую версию.

---

## Политика ошибок и fallback

### Voice ошибки

- логируем событие;
- переключаемся в silent-mode;
- разблокируем переходы шагов;
- приложение продолжает работу.

### Worker ошибки

- логируем событие;
- выполняем одну попытку перезапуска worker;
- если неуспешно, включаем degraded fallback таймер в main thread;
- пользовательский flow не должен зависнуть.

### Storage ошибки

- при `QuotaExceededError` отключаем autosave;
- показываем явное уведомление;
- предлагаем экспорт состояния;
- не ломаем текущую сессию.

---

## Схема данных и миграции

Каждый сохраненный state обязан содержать:

```js
{
  schema_version: number,
  saved_at: string,
  data: {}
}
```

Правила:

- любая загрузка проходит validation перед использованием;
- каждая несовместимая правка схемы добавляет migration step;
- цепочка миграций должна быть детерминированной;
- если state поврежден и не мигрируется безопасно, состояние отбрасывается с fallback на defaults.

---

## Worker правила

Все timer loops постепенно переносить в worker.

UI должен только отображать:

```text
worker -> app -> ui
```

а не вычислять таймеры сам.

---

## Git workflow

Основная ветка:

```text
main
```

Новые фичи:

```text
feature/<short-topic>
```

Примеры:

```text
feature/voice-worker
feature/ws-sync
feature/pwa
```

---

## Работа с git (необязательно)

Пользовательские git-алиасы вынесены в [md-docs/user-md/USER_GIT_ALIASES.md](./md-docs/user-md/USER_GIT_ALIASES.md).

Если файл существует и алиасы настроены, можно использовать сокращенные команды.

Если файла нет или алиасы не настроены, использовать обычные команды `git`.

---

## Commit style

```text
feat: add keyboard blind navigation
fix: repair voice deadlock
refactor: split trainer logic
perf: move timers to worker
```

---

## Definition of Done (для каждого PR)

- приложение запускается оффлайн после первого install;
- blind-navigation работает по заданным клавишам;
- сценарий `voice unavailable` не ломает тренировки;
- таймеры корректно `pause/resume/cleanup`, без висящих loop-ов;
- storage-состояние валидируется и мигрируется;
- нет вставки пользовательского ввода через `innerHTML`.

### Минимальный ручной smoke-checklist

- iPhone Safari: старт, голос, next-step, timer skip;
- Android Chrome: те же сценарии;
- Desktop Chrome: те же сценарии + background tab behavior;
- negative test: принудительный `utterance.onerror`;
- negative test: worker restart path;
- negative test: localStorage quota path.

---

## Цель рефакторинга

Из:

```text
1 huge html file
```

Сделать:

```text
modular offline-first focus app
```

Без потери:

- скорости;
- автономности;
- простоты запуска.

---

## Приоритеты разработки

### Highest priority

1. stability
2. offline support
3. blind navigation
4. mobile UX
5. voice reliability

### Medium priority

1. worker timers
2. PWA
3. sync
4. analytics

### Low priority

1. animations
2. themes
3. cosmetics

---

## Philosophy

Это cognitive tool и focus ritual engine, а не витринный UI-проект.

Скорость, надежность и предсказуемый UX выше косметики.
