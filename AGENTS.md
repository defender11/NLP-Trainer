# AGENTS.md

## Проект

Focus Trainer — оффлайн PWA-тренажёр фокуса и NLP-якорения.

Проект начинался как один HTML-файл, но постепенно переводится в модульную архитектуру.

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

UI не должен управлять логикой напрямую.

Нельзя:

- хранить бизнес-логику внутри DOM;
- смешивать speech/timers/UI/storage;
- делать giant god-file.

Нужно:

- разделять модули;
- разделять ответственность;
- делать маленькие функции;
- избегать глобального состояния.

---

## Структура проекта

```text
focus-trainer/
├── index.html
├── README.md
├── AGENTS.md
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
- boot приложения.

Не хранить бизнес-логику.

---

### trainer.js

Главный state-machine тренажёра.

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

Всё связанное с:

- speechSynthesis;
- голосами;
- очередями;
- fallback;
- voice errors.

Обязательно:

- graceful fallback;
- не ломать приложение, если voice unavailable;
- stop/cancel API.

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

Нельзя:

- ломать accessibility;
- hijack input fields.

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

Все данные валидируются.

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

---

### worker.js

Web Worker для:

- таймеров;
- heartbeat;
- background ticking;
- autosave events.

Worker не должен:

- трогать DOM;
- использовать window;
- использовать document.

Только message passing.

Пример:

```js
worker.postMessage({
  type: 'START_TIMER',
  duration: 30
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

Приложение должно полностью работать оффлайн.

---

### ui.js

Только DOM rendering.

Без бизнес-логики.

Не хранить state.

---

## Стиль кода

### JavaScript

Использовать:

- snakeCase для переменных и функций;
- маленькие функции;
- early return;
- guard clauses.

Пример:

```js
function start_timer(seconds) {
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
- inline onclick;
- inline styles;
- innerHTML с пользовательскими данными;
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

Если голос включён:

- шаги должны озвучиваться автоматически;
- переходы должны работать с клавиатуры;
- не должно быть deadlock состояния;
- кнопки должны разблокироваться после voice completion.

Обязательно:

```js
utterance.onerror
```

---

## PWA

Проект должен поддерживать:

- standalone mode;
- offline;
- installable app;
- wake lock;
- iOS Safari.

---

## Worker правила

Все timer loops постепенно переносить в worker.

UI должен только отображать:

```text
worker -> app -> ui
```

а не вычислять таймеры сам.

---

## WebSocket roadmap

### Возможные будущие фичи

#### 1. Remote focus sync

Синхронизация состояния между:

- Mac;
- iPhone;
- iPad.

#### 2. Shared focus room

Несколько пользователей:

- запускают Pomodoro одновременно;
- видят общий таймер.

#### 3. Voice telemetry

Сервер может:

- логировать прогресс;
- сохранять статистику;
- анализировать usage.

---

## Git workflow

Основная ветка:

```text
main
```

Новые фичи:

```text
feature/voice-worker
feature/ws-sync
feature/pwa
```

---

## Commit style

```text
feat: add keyboard blind navigation
fix: repair voice deadlock
refactor: split trainer logic
perf: move timers to worker
```

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

Это не ещё один todo-app.

Это:

- cognitive tool;
- focus ritual engine;
- offline nervous-system interface.

Поэтому UX важнее визуальных эффектов.

Скорость и надёжность важнее красоты.
