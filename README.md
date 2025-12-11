<h2>Плагин для Chrome - Парсинг цен с маркетплейса market.yandex.ru</h2>
<p>Получает sku от вашего API, ходит по страницам вида https://market.yandex.ru/product/${modelId}?sku=${sku}&uniqueId=${uniqueId} и отправляет цены на ваш сервер в формате:</p>
<code>[
  {
    sku: {sku},
    cardPrice: {цена по карте yandex}    
  }
]
</code>
<br>
<p>
Перед использованием переименуйте config_example.json в config.json и установите свои параметры.
</p>
<ul>
<li>baseUrl - адрес вашего сервера API;</li>
<li>listEndpoint - сервис для получения списка sku;</li>
<li>priceEndpoint - сервис для отправки цен;</li>
<li>cycleDelay - задержка между запуском циклов парсинга;</li>
<li>logEnabled - вкл/выкл. логирование;</li>
<li>saveLogs - вкл/выкл. хранение логов</li>
</ul>
<p>В файле manifest.json замените в параметре "host_permissions" домен test.ru на свой.</p>
<p>В файле config.json так же можно заменить или добавить селекторы в которых плагин ищет цену (параметр priceSelectors).</p>
