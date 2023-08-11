import gates from './gates';
import gate from './gate';
import transports from './transports';
import transport from './transport';
import orders from './orders';
import order from './order';
import stops from './stops';
import stop from './stop';


export default (app) => {
  app.use('/gates', gates);
  app.use('/gate', gate);
  app.use('/transports', transports);
  app.use('/transport', transport);
  app.use('/orders', orders);
  app.use('/order', order);
  app.use('/stops', stops);
  app.use('/stop', stop);
};
