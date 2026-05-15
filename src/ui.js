export function createUi({ onIntent }) {
  const statusText = document.getElementById('statusText');
  const stepTitle = document.getElementById('stepTitle');
  const stepHint = document.getElementById('stepHint');
  const stepExtra = document.getElementById('stepExtra');
  const timerStatus = document.getElementById('timerStatus');
  const startButton = document.getElementById('startButton');
  const nextButton = document.getElementById('nextButton');
  const skipButton = document.getElementById('skipButton');
  const voiceButton = document.getElementById('voiceButton');
  const modeList = document.getElementById('modeList');
  const taskSection = document.getElementById('taskSection');
  const taskInput = document.getElementById('taskInput');
  const validationText = document.getElementById('validationText');

  startButton.addEventListener('click', () => onIntent({ type: 'INTENT_START_SESSION' }));
  nextButton.addEventListener('click', () => onIntent({ type: 'INTENT_NEXT_STEP' }));
  skipButton.addEventListener('click', () => onIntent({ type: 'INTENT_SKIP_TIMER' }));
  voiceButton.addEventListener('click', () => onIntent({ type: 'INTENT_TOGGLE_VOICE' }));

  modeList.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const button = target.closest('button[data-flow-key]');
    if (!button) {
      return;
    }

    onIntent({
      type: 'INTENT_SELECT_FLOW',
      payload: {
        flowKey: button.dataset.flowKey
      }
    });
  });

  taskInput.addEventListener('input', () => {
    onIntent({
      type: 'INTENT_UPDATE_TASK_TEXT',
      payload: {
        text: taskInput.value
      }
    });
  });

  function renderModeList(modeOptions) {
    modeList.textContent = '';

    modeOptions.forEach((mode) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'modeButton';
      button.dataset.flowKey = mode.key;
      button.textContent = mode.title;
      button.setAttribute('aria-pressed', String(mode.selected));
      button.disabled = mode.disabled;
      modeList.appendChild(button);
    });
  }

  function render(viewModel) {
    statusText.textContent = viewModel.statusText;
    stepTitle.textContent = viewModel.stepTitle;
    stepHint.textContent = viewModel.stepDescription;
    stepExtra.textContent = viewModel.stepExtraHint;
    timerStatus.textContent = viewModel.timerStatusText;

    nextButton.disabled = viewModel.nextDisabled;
    nextButton.textContent = viewModel.nextButtonText;

    skipButton.classList.toggle('hidden', !viewModel.showSkipTimerButton);
    skipButton.disabled = !viewModel.showSkipTimerButton;

    startButton.disabled = viewModel.startDisabled;
    voiceButton.textContent = viewModel.voiceButtonText;
    voiceButton.setAttribute('aria-pressed', String(viewModel.voiceEnabled));

    taskSection.classList.toggle('hidden', !viewModel.showTaskInput);
    if (viewModel.showTaskInput && taskInput.value !== viewModel.taskInputValue) {
      taskInput.value = viewModel.taskInputValue;
    }

    taskInput.placeholder = viewModel.taskInputPlaceholder;
    validationText.textContent = viewModel.validationText;

    renderModeList(viewModel.modeOptions);
  }

  return {
    render
  };
}
