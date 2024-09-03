## Пример сценария для сбора метрик сессии

### Действия:
1. Скачиваем репозиторий
2. Собираем проект
3. Переносим сценарий из dist/main в сценарий на платформу
4. Покупаем номер телефона и привязываем к приложению (номер телефона прописываем в конфиге сценария)
5. Создаем Пользователя (имя пользователя прописываем в конфиге сцерания)
6. Заполняем данные для отправки в CRM (или куда либо еще) в конфиге сценария, для отправки метрики сессии
7. Создаем Роут на наше приложение, маску не трогаем

### Сборка проекта:
Сборка проекта осуществляется в файл main.js, по средствам плагина rollup.
```sh
npm run build
```

### Описание
```
Для удобства написания сценариев используется node.js.
Корневая папка сценария {src} - весь код разбит на модули

В папке {src} лежит {started.js} - наша корневая точка сценария (как {index.js} / {app.js} в привычных нам проектах)

{src/globals} - глобальные переменные, которые используется по всех модулях сценария
{src/globals/metric.js} - лежат статусы для объекта metric, лежит сам объект metric с дефолтными значениями
{src/globals/store.js} - лежат данные сессии. Своего рода конфиг нашей сессии и доступ к глобальным объектам сессии для дальнейшей обработки

{src/handlers} - vox события Коннекта/Дисконнекта для входящего и Коннекта/Дисконнекта/Фейла для исходящего звонка. Собственно тут описываем логику работы при срабатывании каждого из данных событий

{src/helpers} - вспомогательные методы/классы, необходимые в работе сценария. Праксически все описано в самих файлах. Интуитивно понятно и просто реализовано.

В качетсве примера реализованы исходящие звонки на callUser и callPSTN:
  1. Если запуск сценария осуществляется через StartScenario или через входящие звонки по SIP/USER - исходящий будет по PSTN. 
  2. Если входяищй пришел по PSTN - исходящий будет по USER
```

### Конфиг файл - store.js
```js
export const store = {
  /*
    В поле {aon} пишем купленный номер на платформе, требуется для осуществления звонков по ПСТН. 
    ВАЖНО!!! 
    Купленный номер необходимо прикрепить к платформе. Далее создать во вкладке Роутинга Роут на сценарий, 
    достаточно написать имя и выбрать созданный сценарий из выпадающего списка. Маску трогать не нужно!
  */
  aon: '79011477211',

  /*
    В поле {username} пишем имя пользователя (ПЛАТФОРМА > ПРИЛОЖЕНИЕ > ПОЛЬЗОВАТЕЛИ). 
    Звонки через пользователя можно осуществить через данный сервис - https://phone.voximplant.com/
    Для авторизации пишем Логин и Пароль созданного юзера, а так же имя Приложения и Аккаунта, на котором создан пользователь и лежит сценарий
  */
  username: 'test',
  
  // Конфиг для отправки данных в CRM, используется как пример, куда хотим отправить, какой метод. Данные не заполняем в конфиге!!!
  metricConfig: {
    url: 'https://url/schema_name',
    method: 'POST',
    data: {},
  },
};

// Все прочие обязательные поля описаны в самом файле, тут вынесены статические данные, которые неоюходимо заполнить руками, их описание!
```
