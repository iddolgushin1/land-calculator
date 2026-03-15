const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/calculate', (req, res) => {
  const {
    cadastralPerSotka, marketPerSotka, area,
    buyout3918, buyoutDom, buyoutOKS, buyoutSX,
    auctionRentStart, auctionRentEnd,
    auctionOwnStart, auctionOwnEnd
  } = req.body;

  const K = cadastralPerSotka * area;
  const M = marketPerSotka * area;
  const results = [];

  // 1. ПСЗПУ в аренду - переуступка
  if (cadastralPerSotka && area) {
    const expenses = K * 0.003;
    results.push({ name: 'ПСЗПУ в аренду (переуступка)', formula: 'цена аренды без торгов 1 год', budget: Math.round(expenses), expenses: Math.round(expenses), profit: Math.round((M - expenses) / 2) });
  }

  // 2. ПСЗПУ в собственность
  if (buyout3918) {
    const expenses = K * buyout3918 / 100;
    results.push({ name: 'ПСЗПУ в собственность', formula: '% по таблице', budget: Math.round(expenses), expenses: Math.round(expenses), profit: Math.round(M - expenses) });
  }

  // 3. ПСЗПУ в аренду (ИЖС, ЛПХ)
  if (buyoutDom) {
    const expenses = K * 0.003 + K * buyoutDom / 100;
    results.push({ name: 'ПСЗПУ в аренду (ИЖС, ЛПХ)', formula: '1 год аренды + % выкупа', budget: Math.round(expenses), expenses: Math.round(expenses), profit: Math.round(M - expenses), note: '+ стройка. Срок аренды 12 мес.' });
  }

  // 4. ПСЗПУ в аренду КФХ
  if (buyoutSX) {
    const expenses = K * 0.003 * 3 + K * buyoutSX / 100;
    results.push({ name: 'ПСЗПУ в аренду КФХ', formula: 'аренда 3 года + % выкупа', budget: Math.round(expenses), expenses: Math.round(expenses), profit: Math.round(M - expenses), note: '+ освоение' });
  }

  // 5. Торги в аренду (ИЖС, ЛПХ)
  if (auctionRentEnd && buyoutDom) {
    const budget = (auctionRentStart || 0) * area;
    const expenses = auctionRentEnd * area / 2 + K * buyoutDom / 100;
    results.push({ name: 'Торги в аренду (ИЖС, ЛПХ)', formula: 'результат торгов / 2 + % выкупа', budget: Math.round(budget), expenses: Math.round(expenses), profit: Math.round(M - expenses), note: '+ стройка. Срок аренды 6 мес.' });
  }

  // 6. Торги в аренду ВРИ Коммерция
  if (auctionRentEnd && buyoutOKS) {
    const expenses = auctionRentEnd * area + K * buyoutOKS / 100;
    results.push({ name: 'Торги в аренду ВРИ Коммерция', formula: 'результат торгов + % выкупа', budget: 0, expenses: Math.round(expenses), profit: Math.round(M - expenses), note: '+ стройка. Срок аренды 12 мес.' });
  }

  // 7. Торги в аренду СХ
  if (auctionRentEnd && buyoutSX) {
    const expenses = auctionRentEnd * area * 3 + K * buyoutSX / 100;
    results.push({ name: 'Торги в аренду СХ', formula: 'результат торгов × 3 года + % выкупа', budget: 0, expenses: Math.round(expenses), profit: Math.round(M - expenses) });
  }

  // 8. Торги покупка
  if (auctionOwnEnd) {
    const expenses = auctionOwnEnd * area;
    results.push({ name: 'Торги покупка', formula: 'результат торгов', budget: 0, expenses: Math.round(expenses), profit: Math.round(M - expenses) });
  }

  // 9. 119-ФЗ Арктика и ДВ
  results.push({ name: '119-ФЗ Арктика и ДВ', formula: 'Освоение мин 30 т.р.', budget: 0, expenses: 30000, profit: Math.round(M - 30000) });

  // 10. Покупка на рынке
  results.push({ name: 'Покупка на рынке', formula: 'Рыночная цена', budget: Math.round(M), expenses: Math.round(M), profit: 0 });

  res.json({ results, cadastral: Math.round(K), market: Math.round(M) });
});

app.listen(3000, () => console.log('Сервер запущен на http://localhost:3000'));