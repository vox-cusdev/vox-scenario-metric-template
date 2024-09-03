import {Duration} from '../helpers/duration';
import {callDataTemplate} from './metric';

// Глобальный объект с переменными и данными конфигураций
export const store = {
  callIn: null, // Входящий звонок
  callOut: null, // Исходящий звонок
  
  callInData: Object.assign({}, callDataTemplate),
  callOutData: Object.assign({}, callDataTemplate),
  
  aon: '79011477211', // Номер платформы
  username: 'test', // Имя пользователя (vox платформа -> приложение -> пользователи)
  
  duration: {
    session: new Duration(),
    session_before_call: new Duration(),
    dialing: new Duration(),
    talk: new Duration(),
  },
  
  beenInFinalActions: false, // Были ли в finalActions
  
  metricConfig: {
    url: 'https://url/schema_name',
    method: 'POST',
    data: {},
  },
};
