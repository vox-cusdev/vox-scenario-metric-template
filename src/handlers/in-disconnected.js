import {finalActions} from '../helpers/final-actions';
import {metric, statuses} from '../globals/metric';

export const inDisconnected = async () => {
  Logger.write('[LOGGER] Попали в disconnected входящего плеча (входящий звонок)');
  
  // Вписываем инициатора сброса звонка. По умолчанию значение полей null, потому тот, кто первым сбросит - того результат и запишется и в дальнейшем не будет перезаписи данного поля
  if (!metric.hangup_initiator) metric.hangup_initiator = statuses.hangup_initiator.a;
  
  // Запускаем метод завершения сессии
  await finalActions();
};
