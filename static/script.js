

// - 以下用語を定義
const words = [
  { main: '今宵の月は美しい。', sub: 'こよいのつきはうつくしい。', inp: 'koyoinotukihautukushii.' },
  { main: '君の名は、', sub: 'きみのなは、', inp: 'kiminonaha' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' }
  //{ main: '', sub: '', inp: '' }
];
console.log(words);

// - 用語の範囲を指定してランダムに出力
function RandomPick() {
    const N = 3;
    const random = Math.floor(Math.random() * N);
    value = words[random]; // 出力例: 0, 1, 2, ..., 9 のいずれか
    return value
}

// - ゲーム開始時に起動
document.getElementById('start-button').addEventListener('click', () => {
    console.log("始め！");
    RandomPick();
});

function TaskClear() {
  console.log("");
  RandomPick();
}
