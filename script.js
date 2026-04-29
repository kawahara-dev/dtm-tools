(() => {
  'use strict';

  const bpmForm = document.getElementById('bpm-form');
  if (!bpmForm) {
    return;
  }

  const bpmInput = document.getElementById('bpm-input');
  const barsInput = document.getElementById('bars-input');
  const timeSignatureSelect = document.getElementById('time-signature');
  const errorMessage = document.getElementById('error-message');
  const resultList = document.getElementById('result-list');
  const copyButton = document.getElementById('copy-button');
  const copyStatus = document.getElementById('copy-status');
  const presetButtons = document.querySelectorAll('.preset-button');

  const BAR_BEATS_BY_SIGNATURE = {
    '4/4': 4,
    '3/4': 3,
    '6/8': 6,
  };

  const FIXED_BAR_SETS = [8, 16, 32, 64];

  async function writeTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    const isCopied = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (!isCopied) {
      throw new Error('copy failed');
    }
  }

  function isPositiveNumber(value) {
    return Number.isFinite(value) && value > 0;
  }

  function secondsToMinuteFormat(totalSeconds) {
    const secondsFloor = Math.floor(totalSeconds);
    const minutes = Math.floor(secondsFloor / 60);
    const seconds = secondsFloor % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  function formatResultSeconds(seconds) {
    return `${seconds.toFixed(2)}秒 / ${secondsToMinuteFormat(seconds)}`;
  }

  function calculateDurations({ bpm, bars, timeSignature }) {
    const barBeats = BAR_BEATS_BY_SIGNATURE[timeSignature];
    // 入力されたBPMを1拍あたりの速さとして扱う
    const beatSeconds = 60 / bpm;
    const barSeconds = beatSeconds * barBeats;

    return {
      beatSeconds,
      barSeconds,
      inputBarsSeconds: barSeconds * bars,
      fixedBars: FIXED_BAR_SETS.map((fixedBars) => ({
        bars: fixedBars,
        seconds: barSeconds * fixedBars,
      })),
    };
  }

  function createResultRows(durations, inputBars) {
    const rows = [
      { label: '1拍の長さ', value: `${durations.beatSeconds.toFixed(2)}秒` },
      { label: '1小節の長さ', value: `${durations.barSeconds.toFixed(2)}秒` },
      {
        label: `${inputBars}小節の長さ`,
        value: formatResultSeconds(durations.inputBarsSeconds),
      },
      ...durations.fixedBars.map((item) => ({
        label: `${item.bars}小節の長さ`,
        value: formatResultSeconds(item.seconds),
      })),
    ];

    resultList.innerHTML = rows
      .map(
        (row) => `
          <div class="result-row">
            <dt>${row.label}</dt>
            <dd>${row.value}</dd>
          </div>
        `
      )
      .join('');

    return rows;
  }

  function getInputValues() {
    return {
      bpm: Number.parseFloat(bpmInput.value),
      bars: Number.parseFloat(barsInput.value),
      timeSignature: timeSignatureSelect.value,
    };
  }

  function validateInputs(values) {
    if (!isPositiveNumber(values.bpm)) {
      return 'BPMは1以上の数値で入力してね。';
    }

    if (!isPositiveNumber(values.bars)) {
      return '小節数は1以上の数値で入力してね。';
    }

    if (!BAR_BEATS_BY_SIGNATURE[values.timeSignature]) {
      return '拍子の選択が正しくありません。';
    }

    return '';
  }

  function updateResults() {
    const values = getInputValues();
    const validationError = validateInputs(values);

    if (validationError) {
      errorMessage.textContent = validationError;
      resultList.innerHTML = '';
      copyStatus.textContent = '';
      return null;
    }

    errorMessage.textContent = '';
    const durations = calculateDurations(values);
    return createResultRows(durations, values.bars);
  }

  async function copyResults() {
    const rows = updateResults();

    if (!rows) {
      copyStatus.textContent = '入力を確認してからコピーしてね。';
      return;
    }

    const copyText = rows.map((row) => `${row.label}: ${row.value}`).join('\n');

    try {
      await writeTextToClipboard(copyText);
      copyStatus.textContent = '計算結果をコピーしたよ！';
    } catch (error) {
      copyStatus.textContent = 'コピーに失敗しました。手動で選択してコピーしてください。';
    }
  }

  function handlePresetClick(event) {
    const { bpm } = event.currentTarget.dataset;
    bpmInput.value = bpm;
    updateResults();
  }

  bpmForm.addEventListener('input', updateResults);
  timeSignatureSelect.addEventListener('change', updateResults);
  copyButton.addEventListener('click', copyResults);

  presetButtons.forEach((button) => {
    button.addEventListener('click', handlePresetClick);
  });

  updateResults();
})();

(() => {
  'use strict';

  const transposeForm = document.getElementById('transpose-form');
  if (!transposeForm) {
    return;
  }

  const baseKeySelect = document.getElementById('base-key');
  const modeSelect = document.getElementById('mode');
  const semitoneShiftSelect = document.getElementById('semitone-shift');
  const transposeError = document.getElementById('transpose-error');
  const transposeResultList = document.getElementById('transpose-result-list');
  const transposeDescription = document.getElementById('transpose-description');
  const copyButton = document.getElementById('transpose-copy-button');
  const copyStatus = document.getElementById('transpose-copy-status');
  const shiftUpButton = document.getElementById('shift-up-button');
  const shiftDownButton = document.getElementById('shift-down-button');
  const resetButton = document.getElementById('transpose-reset-button');


  async function writeTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    const isCopied = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (!isCopied) {
      throw new Error('copy failed');
    }
  }

  const KEY_LABELS = [
    'C',
    'C# / Db',
    'D',
    'D# / Eb',
    'E',
    'F',
    'F# / Gb',
    'G',
    'G# / Ab',
    'A',
    'A# / Bb',
    'B',
  ];

  function normalizeSemitoneShift(shiftValue) {
    const shift = Number.parseInt(shiftValue, 10);
    if (!Number.isInteger(shift) || shift < -12 || shift > 12) {
      return null;
    }
    return shift;
  }

  function getTransposeValues() {
    return {
      baseKey: baseKeySelect.value,
      mode: modeSelect.value,
      semitoneShift: normalizeSemitoneShift(semitoneShiftSelect.value),
    };
  }

  function validateTransposeInputs(values) {
    if (!KEY_LABELS.includes(values.baseKey)) {
      return '元のキーを選択してください。';
    }

    if (values.mode !== 'メジャー' && values.mode !== 'マイナー') {
      return 'メジャー / マイナーを選択してください。';
    }

    if (values.semitoneShift === null) {
      return '半音の移動量は-12〜+12で選んでください。';
    }

    return '';
  }


  function formatSemitoneShift(value) {
    return `${value > 0 ? '+' : ''}${value}`;
  }

  function transposeKey(baseKey, semitoneShift) {
    const baseIndex = KEY_LABELS.indexOf(baseKey);
    const shiftedIndex = (baseIndex + semitoneShift + 12) % 12;
    return KEY_LABELS[shiftedIndex];
  }

  function buildDescriptionText(result) {
    const absShift = Math.abs(result.semitoneShift);
    const directionText = result.semitoneShift > 0 ? '上げる' : '下げる';
    const jpPeriod = '\u3002';
    const jpComma = '\u3001';

    if (result.semitoneShift === 0) {
      return `${result.baseKey}${result.mode}は移動量が0半音なので${jpComma}${result.transposedKey}${result.mode}のままです${jpPeriod}`;
    }

    return (
      `${result.baseKey}${result.mode}を${absShift}半音${directionText}と${result.transposedKey}${result.mode}になります${jpPeriod}` +
      `曲全体のコードやメロディも同じだけ移動すると${jpComma}雰囲気を保ったままキー変更できます${jpPeriod}`
    );
  }

  function renderTransposeResult(result) {
    const rows = [
      { label: '移調後のキー', value: `${result.transposedKey}${result.mode}` },
      { label: '元のキー', value: `${result.baseKey}${result.mode}` },
      { label: '移動した半音数', value: `${formatSemitoneShift(result.semitoneShift)} 半音` },
      { label: '種類', value: result.mode },
    ];

    transposeResultList.innerHTML = rows
      .map(
        (row) => `
          <div class="result-row">
            <dt>${row.label}</dt>
            <dd>${row.value}</dd>
          </div>
        `
      )
      .join('');

    transposeDescription.textContent = buildDescriptionText(result);

    return rows;
  }

  function updateTransposeResults() {
    const values = getTransposeValues();
    const validationError = validateTransposeInputs(values);

    if (validationError) {
      transposeError.textContent = validationError;
      transposeResultList.innerHTML = '';
      transposeDescription.textContent = '';
      copyStatus.textContent = '';
      return null;
    }

    transposeError.textContent = '';

    const transposedKey = transposeKey(values.baseKey, values.semitoneShift);

    return renderTransposeResult({ ...values, transposedKey });
  }

  async function copyTransposeResult() {
    const rows = updateTransposeResults();

    if (!rows) {
      copyStatus.textContent = '入力を確認してからコピーしてね。';
      return;
    }

    const copyText = [
      ...rows.map((row) => `${row.label}：${row.value}`),
      `コメント：${transposeDescription.textContent}`
    ].join('\n');

    try {
      await writeTextToClipboard(copyText);
      copyStatus.textContent = '結果をコピーしたよ！';
    } catch (error) {
      copyStatus.textContent = 'コピーに失敗しました。手動で選択してコピーしてください。';
    }
  }

  function changeShift(amount) {
    const currentShift = normalizeSemitoneShift(semitoneShiftSelect.value);
    if (currentShift === null) {
      semitoneShiftSelect.value = '0';
      updateTransposeResults();
      return;
    }

    const nextShift = Math.max(-12, Math.min(12, currentShift + amount));
    semitoneShiftSelect.value = String(nextShift);
    updateTransposeResults();
  }

  function resetTransposeForm() {
    baseKeySelect.value = 'C';
    modeSelect.value = 'メジャー';
    semitoneShiftSelect.value = '0';
    copyStatus.textContent = '';
    updateTransposeResults();
  }

  transposeForm.addEventListener('input', updateTransposeResults);
  baseKeySelect.addEventListener('change', updateTransposeResults);
  modeSelect.addEventListener('change', updateTransposeResults);
  semitoneShiftSelect.addEventListener('change', updateTransposeResults);
  copyButton.addEventListener('click', copyTransposeResult);
  shiftUpButton.addEventListener('click', () => changeShift(1));
  shiftDownButton.addEventListener('click', () => changeShift(-1));
  resetButton.addEventListener('click', resetTransposeForm);

  updateTransposeResults();
})();
