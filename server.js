const express = require('express');
const session = require('express-session');

const config = require('./config');

const MongoStore = require('connect-mongo');
const route = require('./route');

const { Router } = require('express');
const router = Router();

const multer = require('multer');
const { normalize, schema } = require('normalizr');
const upload = multer();

const mensajesDaoMongo = require('./src/DAO/daoMongoMensajes.js');
const classMsgs = new mensajesDaoMongo();

const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const Usuarios = require('./models/users.js');

const yargs = require('yargs/yargs')(process.argv.slice(2));
const args = yargs.default({ port: 8080 }).argv;

const compression = require('compression');

const winston = require('winston');

const logger = winston.createLogger({
  level: 'warn',
  transports: [new winston.transports.Console({ level: 'info' }), new winston.transports.File({ filename: 'warn.log', level: 'warn' }), new winston.transports.File({ filename: 'error.log', level: 'error' })],
});

const app = express();

app.use(compression());

/* app.use(express.static(__dirname + '/public'));*/
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Passport
function isValidPassword(user, password) {
  return bcrypt.compareSync(password, user.password);
}

function createHash(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
}

passport.use(
  'login',
  new LocalStrategy((username, password, done) => {
    Usuarios.findOne({ username }, (err, user) => {
      if (err) return done(err);

      if (!user) {
        logger.log('error', `User Not Found with username ${username} - log error`);
        return done(null, false);
      }

      if (!isValidPassword(user, password)) {
        logger.log('error', 'Invalid Password - log error');
        return done(null, false);
      }

      return done(null, user);
    });
  })
);

passport.use(
  'signup',
  new LocalStrategy(
    {
      passReqToCallback: true,
    },
    (req, username, password, done) => {
      Usuarios.findOne({ username: username }, function (err, user) {
        if (err) {
          logger.log('error', `Error in signup ${err}- log error`);
          return done(err);
        }

        if (user) {
          logger.log('error', 'User alredy exist - log error');
          return done(null, false);
        }

        const newUser = {
          username: username,
          password: createHash(password),
        };
        Usuarios.create(newUser, (err, userWithId) => {
          if (err) {
            logger.log('error', `Error in saving ${err}- log error`);
            return done(err);
          }
          console.log(user);
          console.log('User Registration succesful');
          return done(null, userWithId);
        });
      });
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  Usuarios.findById(id, done);
});

app.use(passport.initialize());

//Session
app.use(
  session({
    store: MongoStore.create({
      mongoUrl: config.MONGOURL,
      mongoOptions: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    }),
    secret: config.SECRET,
    resave: true,
    saveUninitialized: false,
    cookie: { expires: 60000 },
  })
);

//Socket.io
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer);

httpServer.listen(args.port, () => {
  console.log(`Server on http://${config.HOST}:${args.port}`);
});

app.set('view engine', 'ejs');

app.use('/api/productos', router);

app.get('/', route.getRoot);

router.get('/', route.getRoot);

router.post('/form', upload.none(), route.routerPostForm);

//LOGIN

router.post('/login', upload.none(), passport.authenticate('login', { failureRedirect: '/api/productos/fail/login' }), route.routerPostLogin);

router.get('/form', route.routerGetForm);

router.get('/login', route.routerGetLogin);

router.get('/logout', route.routerGetLogout);

router.get('/signup', route.routerGetSignup);

router.post('/signup', passport.authenticate('signup', { failureRedirect: '/api/productos/fail/signup' }), route.routerPostSignup);

router.get('/fail/login', route.routerGetFailLogin);

router.get('/fail/signup', route.routerGetFailSignup);

app.get('/info', route.getInfo);

app.get('/api/randoms', route.getRandoms);

app.get('*', route.getInexistent);
//SOCKET
io.on('connection', async (socket) => {
  console.log('Usuario conectado');

  socket.on('msg', async (data) => {
    let fecha = new Date();

    const msg = {
      author: {
        id: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        edad: data.edad,
        avatar: data.avatar,
      },
      text: {
        mensaje: data.mensaje,
        fecha: fecha.getDate() + '/' + (fecha.getMonth() + 1) + '/' + fecha.getFullYear(),
        hora: fecha.getHours() + ':' + fecha.getMinutes() + ':' + fecha.getSeconds(),
      },
    };

    classMsgs.save(msg);
    const allData = await classMsgs.getAll();

    const mensajeSchema = new schema.Entity('mensaje');
    const authorSchema = new schema.Entity(
      'author',
      {
        mensaje: mensajeSchema,
      },
      { idAttribute: 'email' }
    );
    const chatSchema = new schema.Entity('chat', {
      author: [authorSchema],
    });
    const normalizado = normalize({ id: 'chatHistory', messages: allData }, chatSchema);
    console.log(JSON.stringify(normalizado));

    io.sockets.emit('msg-list', { normalizado: normalizado });
  });

  socket.on('sendTable', async (data) => {
    classProductos.save(data);

    try {
      const productos = await classProductos.getAll();
      socket.emit('prods', productos);
    } catch (err) {
      logger.log('error', `${err} - log error`);
    }
  });
});
