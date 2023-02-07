const daoMemoria = require('./src/DAO/daoMemoriaProductos.js');
const classProductos = new daoMemoria();
const yargs = require('yargs/yargs')(process.argv.slice(2));
const args = yargs.default({ port: 8080 }).argv;
const winston = require('winston');

const logger = winston.createLogger({
  level: 'warn',
  transports: [new winston.transports.Console({ level: 'info' }), new winston.transports.File({ filename: 'warn.log', level: 'warn' }), new winston.transports.File({ filename: 'error.log', level: 'error' })],
});

const getRoot = async (req, res) => {
  logger.log('info', 'Get / - log info');
  try {
    const prods = await classProductos.getAll();

    res.render('pages/form', { products: prods });
  } catch (err) {
    logger.log('error', `Error in Get /: ${err}- log error`);
  }
};

const routerPostForm = (req, res) => {
  logger.log('info', 'Post en /api/productos/form - log info');
  try {
    const body = req.body;
    classProductos.save(body);
    if (body) {
    } else {
      res.json({ error: true, msg: 'Producto no agregado' });
    }
  } catch (err) {
    logger.log('error', `Error in Post /api/productos/form: ${err}- log error`);
  }
};

const routerPostLogin = (req, res) => {
  logger.log('info', 'Post en /api/productos/login - log info');
  try {
    const { username, password } = req.user;
    const user = { username, password };
    res.render('pages/profile', { user });
  } catch (err) {
    logger.log('error', `Error in Post /api/productos/login: ${err}- log error`);
  }
};

const routerGetForm = async (req, res) => {
  logger.log('info', 'Get en /api/productos/form: - log info');
  try {
    const prods = await classProductos.getAll();

    res.render('pages/form', { products: prods });
  } catch (err) {
    logger.log('error', `Error in Get /api/productos/form: ${err}- log error`);
  }
};

const routerGetLogin = async (req, res) => {
  logger.log('info', 'Get en /api/productos/login - log info');
  if (req.isAuthenticated()) {
    const { username, password } = req.user;
    const user = { username, password };
    res.render('pages/profile', { user });
  } else {
    res.render('pages/login');
  }
};

const routerGetLogout = async (req, res) => {
  try {
    logger.log('info', 'Get en /api/productos/logout - log info');

    req.session.destroy((err) => {
      if (err) {
        res.send('no pudo deslogear');
      } else {
        res.render('pages/logout');
      }
    });
  } catch (err) {
    logger.log('error', `Error in Get /api/productos/logout: ${err}- log error`);
  }
};

const routerGetSignup = (req, res) => {
  logger.log('info', 'Get en /api/productos/signup - log info');

  if (req.isAuthenticated()) {
    const { username, password } = req.user;
    const user = { username, password };
    res.render('pages/profile', { user });
  } else {
    res.render('pages/signup');
  }
};

const routerPostSignup = (req, res) => {
  logger.log('info', 'Post en /api/productos/signup - log info');

  const { username, password } = req.body;
  const user = { username, password };
  res.render('pages/profile', { user });
};

const routerGetFailLogin = (req, res) => {
  logger.log('info', 'Get en /api/productos/fail/login - log info');

  res.render('pages/faillogin', { Port: args.port });
};

const routerGetFailSignup = (req, res) => {
  logger.log('info', 'Get en /api/productos/fail/signup - log info');
  const port = args.port;
  res.render('pages/failsignup', { Port: port });
};

const getInfo = (req, res) => {
  logger.log('info', 'get en /info - log info');

  res.json({
    Argumentos: args,
    Path: process.execPath,
    OS: process.plataform,
    ProcessId: process.pid,
    NodeVersion: process.version,
    MemoriaTotalReservada: process.memoryUsage.rss(),
    CarpetaDelProyecto: process.cwd(),
  });
};

const getRandoms = (req, res) => {
  logger.log('info', 'Get en /api/randoms- log info');

  let cantidad = req.query.cant || 100000;

  let proceso = fork('./calculo.js');

  proceso.send({ cantidad });

  proceso.on('message', (msg) => {
    const { data } = msg;
    res.json(data);
  });
};

const getInexistent = (req, res) => {
  logger.log('warn', 'Get en Inexistent- log warn');
  res.render('pages/inexistent', { Port: args.port });
};

module.exports = {
  getRoot,
  routerPostForm,
  routerPostLogin,
  routerGetForm,
  routerGetLogin,
  routerGetLogout,
  routerGetSignup,
  routerPostSignup,
  routerGetFailLogin,
  routerGetFailSignup,
  getRandoms,
  getInfo,
  getInexistent,
};
