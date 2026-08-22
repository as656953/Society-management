import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage.js";
import { User as SelectUser } from "../shared/schema.js";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string | null) {
  if (!stored) return false;
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      // Passport does not catch rejections from an async verify callback, so an
      // unhandled throw here (e.g. a database timeout) takes down the process.
      // Resolve the outcome inside the try, but call done() outside it: a
      // synchronous throw from downstream would otherwise be caught here and
      // fire done() a second time on an already-succeeded strategy.
      let result: SelectUser | false;
      try {
        const user = await storage.getUserByUsername(username);
        result =
          user && (await comparePasswords(password, user.password))
            ? user
            : false;
      } catch (err) {
        return done(err as Error);
      }
      return done(null, result);
    })
  );

  // Google OAuth Strategy - only initialize if credentials are configured
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL:
            process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user already exists with this Google ID
            let user = await storage.getUserByGoogleId(profile.id);

            if (user) {
              // Update profile picture if changed
              if (profile.photos?.[0]?.value !== user.profilePicture) {
                user = await storage.updateUser(user.id, {
                  profilePicture: profile.photos?.[0]?.value || null,
                });
              }
              return done(null, user);
            }

            // Check if user exists with same email (linking accounts)
            const email = profile.emails?.[0]?.value;
            if (email) {
              const existingUser = await storage.getUserByEmail(email);
              if (existingUser) {
                // Link Google account to existing user
                user = await storage.updateUser(existingUser.id, {
                  googleId: profile.id,
                  profilePicture: profile.photos?.[0]?.value || null,
                });
                return done(null, user);
              }
            }

            // Create new user with Google profile
            const newUser = await storage.createUser({
              username: email || `google_${profile.id}`,
              name: profile.displayName || "Google User",
              email: email || null,
              googleId: profile.id,
              profilePicture: profile.photos?.[0]?.value || null,
              authProvider: "google",
              password: null, // No password for Google users
            });

            return done(null, newUser);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
    console.log("Google OAuth strategy initialized");
  } else {
    console.log(
      "Google OAuth credentials not configured - Google login disabled"
    );
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    // Runs on every authenticated request. Passport does not catch rejections
    // from an async callback, so an unhandled throw here (a pool timeout, for
    // instance) takes the whole process down.
    try {
      const user = await storage.getUser(id);
      // `false` clears the session and yields a clean 401. Passing `undefined`
      // makes passport raise "Failed to deserialize user out of session",
      // which 500s on every subsequent request instead.
      done(null, user || false);
    } catch (err) {
      done(err as Error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    if (req.body.email) {
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).send("Email already exists");
      }
    }

    const { username, name, email, phone } = req.body;
    const user = await storage.createUser({
      username,
      name: name || username,
      email: email || null,
      phone: phone || null,
      password: await hashPassword(req.body.password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Google OAuth routes
  app.get(
    "/api/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/auth?error=google_auth_failed",
    }),
    (req, res) => {
      // Successful authentication, redirect to dashboard
      res.redirect("/");
    }
  );

  // Check if Google OAuth is enabled
  app.get("/api/auth/google/status", (req, res) => {
    res.json({
      enabled: !!(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ),
    });
  });
}
