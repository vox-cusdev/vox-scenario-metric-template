// Глобальный объект со статусами для метрики, по ходу сессии данные константы вписываются в объект metric
export const statuses = {
  call_status: {
    connected: 'Трубку подняли',
    failed: 'Трубку не подняли',
  },
  call_result: {
    success: 'Разговор состоялся',
    failed: 'Разговор не состоялся',
  },
  hangup_initiator: {
    a: 'Абонент А',
    b: 'Абонент Б',
    vox: 'Voximplant',
  },
};

// Глобальный объект с данными метрики, по ходу сессии заполняем его данными
export const metric = Object.seal({
  session_id: null, // id звонка
  session_date_time: null, // Дата и время звонка
  duration_session: null, // Длительность звонка (общая)
  duration_session_before_call: null, // Длительность сессии до начала исходящего звонка
  duration_dialing: null, // Длительность дозвона
  duration_talk: null, // Длительность разговора
  phone_a: null, // Реальный номер абонента А
  destination_a: null, // Номер, на который пришел звонок
  phone_b: null, // Реальный номер абонента Б
  destination_b: null, // Номер, с которого звоним абоненту Б
  custom_data: null, // Дополнительный объект данных при входящем звонке, берем из VoxEngine.customData()
  calls_data: [], // Массив данных звонков в сессии
  call_status: null, // Статус дозвона
  call_status_code: null, // Код дозвона
  call_result: statuses.call_result.failed, // Статус соединения
  hangup_initiator: null, // Кто бросил трубку
  record_url: null, // Ссылка на запись
  log_url: null, // Лог звонка
});

// Шаблон объекта данных для сбора данных входящего/исходящего плеча
export const callDataTemplate = Object.seal({
  call_id: null, // Идентификатор плеча
  duration: null, // Длительность плеча
  incoming: null, // Входящий?
  start_time: null, // Время старта звонка
  successful: null, // Ответили на входящее плечо?
  caller_id: null, // С какого номера пришёл звонок
  destination: null, // На какой номер пришёл звонок
  remote_number_type: null, // Тип звонка
});
