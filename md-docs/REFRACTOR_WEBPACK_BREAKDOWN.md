# REFRACTOR_WEBPACK_BREAKDOWN.md

## Цель

Разобрать read-only эталон `focus-trainer.html` на модульную структуру, чтобы далее собрать приложение через Webpack в один HTML-артефакт.

## Источник правды

- Эталон: `focus-trainer.html` (только чтение)
- Рабочая модульная база: `src/*`, `styles/*`, `index.html`

## Декомпозиция на модули

- `src/flows.js`
  Данные сценариев: `installFlow`, `fullFlow`, `quickFlow`.
- `src/state-defaults.js`
  Дефолтная форма состояния сессий/статистики.
- `src/storage.js`
  Валидация + миграции + сохранение/загрузка.
- `src/voice.js`
  Speech API, fallback, stop/cancel, события ошибок.
- `src/timers.js` + `src/worker.js`
  Таймерный контур и безопасная деградация.
- `src/trainer.js`
  State machine, переходы шагов, lifecycle.
- `src/ui.js`
  Только рендер и подписка на пользовательские intents.
- `src/app.js`
  Wiring модулей и маршрутизация событий.

## Что уже сделано

- Вынесены flow-данные из эталона в `src/flows.js`.
- Вынесена дефолтная структура состояния в `src/state-defaults.js`.
- Добавлен реестр режимов `install/full/quick` в `src/flow-registry.js`.
- Добавлен слой описания шагов `src/step-descriptor.js` (data -> view model шага).
- Переведены `trainer/app/ui` на модульный runtime режимов и шагов без прямой логики в DOM.
- Добавлен таймерный движок шагов `src/timers.js` с event-routing (`STEP_TIMER_*`) для `timer/anchor/peak/breath/simplebreath/pomodoro`.
- Добавлен модуль прогресса и истории `src/progress-metrics.js` + `src/history-helpers.js` (без привязки к DOM).

## Следующие шаги

- Подключить webpack-entry и сборку после завершения основной декомпозиции.
- Настроить single-file production output через Webpack-плагины inline-ассетов.
