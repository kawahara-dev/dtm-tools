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
      await navigator.clipboard.writeText(copyText);
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
