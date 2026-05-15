# IMPLEMENTATION_PLAN.md

## Правило обновления

После выполнения пункта обязательно меняй `[ ]` на `[x]` и при необходимости добавляй короткий комментарий по результату.

## Формат статусов

- `[ ]` не начато
- `[x]` выполнено

## Этап 0 (Build & Infra)

- [ ] Webpack build: настроить сборку через Webpack.
- [ ] Single-file output: после `npm run build` на выходе должен быть один HTML-файл.
- [ ] Inline assets: внутри итогового HTML должны быть встроены `js + css + img` (base64/Unicode).
- [ ] NPM scripts: добавить скрипты сборки (`build`) и связанные команды для production-сборки.
- [ ] Webpack server: добавить локальный сервер через Webpack для разработки и проверки (`dev`/`serve`).
- [x] Refactor prep: разобрать эталонный `focus-trainer.html` на модульную структуру (`src/*`), чтобы подготовить кодовую базу к удобной webpack-сборке. (Выполнено: вынесены flow/state-модули, добавлены `flow-registry` и `step-descriptor`, `app/trainer/ui` переведены на runtime режимов/шагов, таймерные сценарии вынесены в `timers.js` с event-routing, добавлены модули прогресса/истории, карта декомпозиции — `md-docs/REFRACTOR_WEBPACK_BREAKDOWN.md`)

## Этап 1 (Highest priority)

- [ ] Stability: устранить известные крэши/зависания и закрыть критичные deadlock-сценарии в тренировочном flow. (Отложено: приоритет временно смещен на разбор эталонного `focus-trainer.html` под webpack-подготовку)
- [ ] Offline support: проверить и стабилизировать полноценную работу оффлайн после первого install (без backend и без auth).
- [ ] Blind navigation: довести управление с клавиатуры (`Space`, `Enter`, `ArrowRight`, `N`, `Т`, `S`, `Ы`) без конфликтов с `input/textarea/select/contenteditable`.
- [ ] Mobile UX: проверить и улучшить UX на iPhone Safari и Android Chrome с приоритетом на быстрый запуск и простой контроль сессии.
- [ ] Voice reliability: обеспечить стабильную автозвучку шагов, корректную обработку `utterance.onerror` и fallback в silent-mode без блокировки переходов.

## Этап 2 (Medium priority)

- [ ] Worker timers: постепенно перенести timer loops в `worker.js` с корректными `pause/resume/cleanup` и деградацией в main thread при ошибках worker.
- [ ] PWA: завершить поддержку standalone/installable/offline/wake lock и безопасную update-стратегию без прерывания активной тренировки.
- [ ] Sync: держать `ws.js` опциональным, подготовить безопасную основу для remote sync без зависимости core-функций от WebSocket.
- [ ] Analytics: добавить неблокирующую telemetry-основу (сохранение событий/метрик) без ухудшения offline-first поведения.

## Этап 3 (Low priority)

- [ ] Animations: добавить только легкие анимации, не влияющие на скорость и предсказуемость flow.
- [ ] Themes: реализовывать темы только после стабилизации high/medium приоритетов.
- [ ] Cosmetics: вносить визуальные улучшения точечно, без рефакторинга ради внешнего вида.

## Общие критерии готовности

- Приложение запускается оффлайн после первого install.
- Blind-navigation работает по заданным клавишам.
- Сценарий `voice unavailable` не ломает тренировочный flow.
- Таймеры корректно поддерживают `pause/resume/cleanup` без висящих loop-ов.
- Состояние в storage проходит validation и migrations.
- Пользовательский ввод не вставляется через `innerHTML` (только `textContent`/`createTextNode`).

## Smoke-check после крупных изменений

- iPhone Safari: старт, голос, next-step, timer skip.
- Android Chrome: те же сценарии.
- Desktop Chrome: те же сценарии + background tab behavior.
- Negative test: принудительный `utterance.onerror`.
- Negative test: worker restart path.
- Negative test: localStorage quota path.
