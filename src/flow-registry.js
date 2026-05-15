import { installFlow, fullFlow, quickFlow } from './flows.js';

export const flowRegistry = {
  install: {
    key: 'install',
    title: 'Установка якоря',
    description: 'Базовый протокол установки NLP-якоря.',
    steps: installFlow
  },
  full: {
    key: 'full',
    title: 'Полный запуск',
    description: 'Полный pre-focus ритуал + помодоро.',
    steps: fullFlow
  },
  quick: {
    key: 'quick',
    title: 'Быстрый запуск',
    description: 'Короткий запуск фокуса перед задачей.',
    steps: quickFlow
  }
};

export const defaultFlowKey = 'quick';

export function getFlowMetaList() {
  return Object.values(flowRegistry).map((flow) => ({
    key: flow.key,
    title: flow.title,
    description: flow.description
  }));
}
