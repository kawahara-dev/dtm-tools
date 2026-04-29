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

(() => {
  'use strict';

  const generatorForm = document.getElementById('chord-generator-form');
  if (!generatorForm) {
    return;
  }

  const keySelect = document.getElementById('cp-key');
  const modeSelect = document.getElementById('cp-mode');
  const genreSelect = document.getElementById('cp-genre');
  const barsSelect = document.getElementById('cp-bars');
  const generateButton = document.getElementById('cp-generate');
  const regenerateButton = document.getElementById('cp-regenerate');
  const copyButton = document.getElementById('cp-copy');
  const errorMessage = document.getElementById('cp-error');
  const resultList = document.getElementById('cp-result-list');
  const copyStatus = document.getElementById('cp-copy-status');
  const commentText = document.getElementById('cp-comment');

  const KEY_ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const KEY_ALIASES = {
    'C# / Db': 'C#',
    'D# / Eb': 'D#',
    'F# / Gb': 'F#',
    'G# / Ab': 'G#',
    'A# / Bb': 'A#',
  };
  const SCALE_NOTES = {
    メジャー: {
      C: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      'C# / Db': ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
      D: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
      'D# / Eb': ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
      E: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
      F: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
      'F# / Gb': ['Gb', 'Ab', 'Bb', 'B', 'Db', 'Eb', 'F'],
      G: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
      'G# / Ab': ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
      A: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
      'A# / Bb': ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
      B: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'],
    },
    マイナー: {
      C: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
      'C# / Db': ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B'],
      D: ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'],
      'D# / Eb': ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'Cb', 'Db'],
      E: ['E', 'F#', 'G', 'A', 'B', 'C', 'D'],
      F: ['F', 'G', 'Ab', 'Bb', 'C', 'Db', 'Eb'],
      'F# / Gb': ['F#', 'G#', 'A', 'B', 'C#', 'D', 'E'],
      G: ['G', 'A', 'Bb', 'C', 'D', 'Eb', 'F'],
      'G# / Ab': ['G#', 'A#', 'B', 'C#', 'D#', 'E', 'F#'],
      A: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      'A# / Bb': ['Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'Ab'],
      B: ['B', 'C#', 'D', 'E', 'F#', 'G', 'A'],
    },
  };

  const ROMAN_PRESETS = {
    'kawaii future bass': ['IV - V - iii - vi', 'vi - IV - V - I', 'I - V - vi - IV'],
    'lofi hiphop': ['ii - V - I - vi', 'Imaj7 - vi7 - ii7 - V7', 'vi - ii - V - I'],
    'J-POP': ['I - V - vi - IV', 'IV - V - iii - vi', 'vi - IV - I - V'],
    '切ない系': ['vi - IV - I - V', 'IV - V - iii - vi', 'ii - V - iii - vi'],
    '明るい系': ['I - IV - V - I', 'I - V - vi - IV', 'IV - I - V - vi'],
  };

  const MODE_DEGREE_MAP = {
    メジャー: {
      I: '1', ii: '2m', iii: '3m', IV: '4', V: '5', vi: '6m', VII: '7dim',
      Imaj7: '1maj7', vi7: '6m7', ii7: '2m7', V7: '57',
    },
    マイナー: {
      i: '1m', ii: '2dim', III: '3', iv: '4m', v: '5m', VI: '6', VII: '7',
      i7: '1m7', iv7: '4m7', V7: '57',
      I: '1m', ii: '2dim', iii: '3', IV: '4m', V: '5m', vi: '6',
      Imaj7: '1m(maj7)', vi7: '6maj7', ii7: '2m7b5'
    },
  };

  const JP_COLON = '\uFF1A';
  const JP_PERIOD = '\u3002';

  const MODE_COMMENTS = {
    メジャー: `明るく王道感のあるコード進行です${JP_PERIOD}Aメロやサビの土台として使いやすいです${JP_PERIOD}`,
    マイナー: `少しエモくて深みのある進行です${JP_PERIOD}静かなAメロや切ない展開にハマりやすいです${JP_PERIOD}`,
  };

  function getRootNote(label) {
    return KEY_ALIASES[label] || label;
  }

  function noteFromDegree(mode, key, degree) {
    const scale = SCALE_NOTES[mode]?.[key];
    const root = getRootNote(key);
    const index = KEY_ROOTS.indexOf(root);
    if (!scale || index < 0) return null;
    const parsed = degree.match(/^([1-7])(.*)$/);
    if (!parsed) return null;
    const degreeIndex = Number.parseInt(parsed[1], 10) - 1;
    const suffix = parsed[2];
    const note = scale[degreeIndex];

    if (suffix === 'm') return `${note}m`;
    if (suffix === 'dim') return `${note}dim`;
    if (suffix === 'maj7') return `${note}maj7`;
    if (suffix === 'm7') return `${note}m7`;
    if (suffix === '7') return `${note}7`;
    if (suffix === 'm7b5') return `${note}m7b5`;
    if (suffix === 'm(maj7)') return `${note}m(maj7)`;
    return note;
  }

  function progressionToChords(mode, key, romanProgression) {
    const modeMap = MODE_DEGREE_MAP[mode];

    return romanProgression.split(' - ').map((roman) => {
      const degree = modeMap[roman] || MODE_DEGREE_MAP['メジャー'][roman] || '1';
      return noteFromDegree(mode, key, degree);
    });
  }

  function generateProgression() {
    const key = keySelect.value;
    const mode = modeSelect.value;
    const genre = genreSelect.value;
    const bars = Number.parseInt(barsSelect.value, 10);
    const presets = ROMAN_PRESETS[genre];

    if (!presets || !key || !mode || ![4, 8].includes(bars)) {
      errorMessage.textContent = '入力内容を確認してね。';
      return null;
    }

    errorMessage.textContent = '';
    const selected = presets[Math.floor(Math.random() * presets.length)];
    const baseRomans = selected.split(' - ');
    const cycle = bars === 8 ? [...baseRomans, ...baseRomans] : baseRomans;
    const romanText = cycle.join(' - ');
    const chordText = progressionToChords(mode, key, romanText).join(' - ');

    return {
      keyLabel: `${key}${mode}`,
      genre,
      chordText,
      romanText,
      comment: MODE_COMMENTS[mode],
    };
  }

  function renderResult(result) {
    const rows = [
      { label: '選択したキー', value: result.keyLabel },
      { label: '選択したジャンル', value: result.genre },
      { label: '生成されたコード進行', value: result.chordText },
      { label: 'ローマ数字表記', value: result.romanText },
    ];

    resultList.innerHTML = rows.map((row) => `\n      <div class="result-row"><dt>${row.label}</dt><dd>${row.value}</dd></div>\n    `).join('');
    commentText.textContent = `コメント${JP_COLON}${result.comment}`;
    return rows;
  }

  async function copyResult() {
    const rows = Array.from(resultList.querySelectorAll('.result-row'));
    if (!rows.length) {
      copyStatus.textContent = '先に生成してからコピーしてね。';
      return;
    }

    const text = rows.map((row) => `${row.querySelector('dt').textContent}${JP_COLON}${row.querySelector('dd').textContent}`).join('\n') + `\n${commentText.textContent}`;

    try {
      await navigator.clipboard.writeText(text);
      copyStatus.textContent = '結果をコピーしたよ！';
    } catch (error) {
      copyStatus.textContent = 'コピーに失敗しました。手動でコピーしてください。';
    }
  }

  function handleGenerate() {
    const result = generateProgression();
    if (!result) return;
    renderResult(result);
    copyStatus.textContent = '';
  }

  generatorForm.addEventListener('change', handleGenerate);
  generateButton.addEventListener('click', handleGenerate);
  regenerateButton.addEventListener('click', handleGenerate);
  copyButton.addEventListener('click', copyResult);

  handleGenerate();
})();
