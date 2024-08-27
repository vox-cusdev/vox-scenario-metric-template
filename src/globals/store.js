import {Duration} from '../helpers/duration';

// Глобальный объект с переменными и данными конфигураций
export const store = {
  callIn: null, // входящий звонок
  callOut: null, // исходящий звонок
  
  aon: '79998887766', // номер платформы
  
  duration: {
    session: new Duration(),
    connect: new Duration(),
    dialing: new Duration(),
    talk: new Duration(),
  },
  
  beenInFinalActions: false, // были ли в finalActions
  
  metricConfig: {
    url: 'https://url/schema_name',
    method: 'POST',
    data: {},
  },
};
