require('dotenv-safe').config();
import 'reflect-metadata';
import express from 'express';
import { createConnection } from 'typeorm';
import { __prod__ } from './constants';
import { join } from 'path';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github';
import { User } from './entities/User';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { Todo } from './entities/Todo';
import { isAuth } from './middleware/isAuth';

(async () => {
  await createConnection({
    type: 'postgres',
    database: 'vstodo',
    entities: [join(__dirname, './entities/*.*')],
    logging: !__prod__,
    synchronize: !__prod__,
  });

  const app = express();

  passport.serializeUser((user: any, done) => {
    done(null, user.accessToken);
  });

  app.use(
    cors({
      origin: '*',
    })
  );
  app.use(express.json());
  app.use(passport.initialize());

  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: 'http://localhost:3002/auth/github/callback',
      },
      async (_, __, profile, cb) => {
        const user = await User.findOne({ where: { githubId: profile.id } });
        if (user) {
          user.name = profile.displayName;
          await user.save();
        } else {
          await User.create({
            name: profile.displayName,
            githubId: profile.id,
          }).save();
        }
        cb(null, {
          accessToken: jwt.sign(
            { userId: user?.id },
            process.env.ACCESS_TOKEN_SECRET as string,
            {
              expiresIn: '1y',
            }
          ),
        });
      }
    )
  );

  // * Auth
  app.get('/auth/github', passport.authenticate('github', { session: false }));

  app.get(
    '/auth/github/callback',
    passport.authenticate('github', { session: false }),
    (req: any, res) => {
      res.redirect(`http://localhost:54321/auth/${req.user.accessToken}`);
    }
  );

  app.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.send({ user: null });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.send({ user: null });
      return;
    }

    let userId = '';

    try {
      const payload: any = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string
      );
      userId = payload.userId;
    } catch (err) {
      res.send({ user: null });
      return;
    }

    if (!userId) {
      res.send({ user: null });
      return;
    }

    const user = await User.findOne(userId);
    res.send({ user });
  });

  // * Todos
  app.get('/todo', isAuth, async (req, res) => {
    const todos = await Todo.find({
      where: { creatorId: req.userId },
      order: { id: 'DESC' },
    });
    res.send({ todos });
  });

  app.post('/todo', isAuth, async (req, res) => {
    const todo = await Todo.create({
      text: req.body.text,
      creatorId: req.userId,
    }).save();
    res.send({ todo });
  });

  app.put('/todo', isAuth, async (req, res) => {
    const todo = await Todo.findOne(req.body.id);
    if (!todo) {
      res.send({ todo: null });
      return;
    }
    if (todo.creatorId !== req.userId) {
      throw new Error('not authorized');
    }
    todo.completed = !todo.completed;
    await todo.save();
    res.send({ todo });
  });

  app.delete('/todo', isAuth, async (req, res) => {
    const todo = await Todo.findOne(req.body.id);
    if (!todo) {
      res.send({ todo: null });
      return;
    }
    if (todo.creatorId !== req.userId) {
      throw new Error('not authorized');
    }
    await todo.remove();
  });

  app.get('/', (_, res) => {
    res.send('/');
  });

  app.listen(3002, () => {
    console.log('Server is listening on localhost:3002');
  });
})();
