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
  call_date_time: null, // дата и время звонка
  duration: null, // длительность звонка (общая)
  destination_a: null, // номер, на который пришел звонок
  phone_a: null, // реальный номер абонента А
  connect_duration: null, // длительность от прихода звонка до начала дозвона абоненту Б
  phone_b: null, // реальный номер абонента Б
  destination_b: null, // номер, с которого звоним абоненту Б
  duration_dialing_time: null, // длительность дозвона
  call_status: null, // статус дозвона
  call_status_code: null, // код дозвона
  call_result: statuses.call_result.failed, // статус соединения
  hangup_initiator: null, // кто бросил трубку
  duration_talk: null, // длительность разговора
  record_url: null, // ссылка на запись
  log_url: null, // лог звонка
});
